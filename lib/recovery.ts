import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSettings } from "@/lib/store";
import { getStripe } from "@/lib/stripe";
import { emailConfigured, sendEmail } from "@/lib/email/send";
import { alertRecipients, loadOrderForEmail } from "@/lib/email/orders";
import { abandonedAlertEmail, abandonedReminderEmail } from "@/lib/email/templates";
import { GIVE_UP_AFTER_MIN, REMIND_AFTER_MIN, recoveryDue } from "@/lib/recovery-rules";
import type { Order } from "@/lib/types";

type Outcome = { order: number; alert: boolean; reminder: "sent" | "opted_out" | "suppressed" | "skipped" | "failed" | null };

/**
 * Finds checkouts that reached payment an hour+ ago and weren't paid; emails the customer
 * one reminder (if they agreed) and alerts the owner. Safe to call any number of times:
 * each send is claimed first with a conditional update.
 */
export async function runAbandonedCheckouts(now = new Date()): Promise<Outcome[]> {
  if (!emailConfigured()) return [];
  const db = createAdminClient();
  const from = new Date(now.getTime() - GIVE_UP_AFTER_MIN * 60_000).toISOString();
  const to = new Date(now.getTime() - REMIND_AFTER_MIN * 60_000).toISOString();
  const { data: candidates, error } = await db
    .from("orders")
    .select("*")
    .eq("status", "pending")
    .not("email", "is", null)
    .gte("created_at", from)
    .lte("created_at", to)
    .or("abandon_alert_sent_at.is.null,and(reminder_opt_in.eq.true,reminder_sent_at.is.null)")
    .returns<Order[]>();
  if (error) throw error;

  const settings = await getSettings();
  const owner = alertRecipients(settings.contact.order_alert_email);
  const out: Outcome[] = [];

  for (const order of candidates ?? []) {
    const due = recoveryDue(order, now);
    if (!due.alert && !due.remind) continue;

    // Paid but the webhook hasn't landed yet? Then leave it alone.
    if (order.stripe_session_id) {
      try {
        const s = await getStripe().checkout.sessions.retrieve(order.stripe_session_id);
        if (s.status === "complete" || s.payment_status === "paid") continue;
      } catch (e) {
        console.error("recovery: stripe lookup", order.order_number, e);
        continue;
      }
    }

    const email = order.email!.toLowerCase();
    let reminder: Outcome["reminder"] = null;
    if (due.remind) {
      const [{ data: suppressed }, { data: later }] = await Promise.all([
        db.from("email_suppressions").select("email").eq("email", email).maybeSingle(),
        // They've since paid for another order, or we reminded them in the last week.
        db
          .from("orders")
          .select("id")
          .ilike("email", email)
          .neq("id", order.id)
          .or(`and(status.eq.paid,created_at.gte."${new Date(order.created_at).toISOString()}"),reminder_sent_at.gte."${new Date(now.getTime() - 7 * 864e5).toISOString()}"`)
          .limit(1),
      ]);
      if (suppressed) reminder = "suppressed";
      else if (later?.length) reminder = "skipped";
      else {
        const { data: claimed } = await db
          .from("orders")
          .update({ reminder_sent_at: now.toISOString() })
          .eq("id", order.id)
          .is("reminder_sent_at", null)
          .select("id")
          .maybeSingle();
        if (claimed) {
          const data = await loadOrderForEmail(order.id);
          const msg = data && abandonedReminderEmail({ order: data.order, items: data.items, products: data.products, settings });
          const ok =
            !!msg &&
            (await sendEmail({ to: email, ...msg, replyTo: settings.contact.email || null, idempotencyKey: `reminder-${order.id}` }));
          if (ok) reminder = "sent";
          else {
            reminder = "failed";
            await db.from("orders").update({ reminder_sent_at: null }).eq("id", order.id);
          }
        }
      }
    } else if (!order.reminder_opt_in) reminder = "opted_out";

    let alerted = false;
    if (due.alert && owner.length) {
      const { data: claimed } = await db
        .from("orders")
        .update({ abandon_alert_sent_at: now.toISOString() })
        .eq("id", order.id)
        .is("abandon_alert_sent_at", null)
        .select("id")
        .maybeSingle();
      if (claimed) {
        const data = await loadOrderForEmail(order.id);
        if (data) {
          const msg = abandonedAlertEmail({
            order: data.order,
            items: data.items,
            settings,
            reminder: reminder === "failed" || reminder === null ? "skipped" : reminder,
          });
          alerted = await sendEmail({ to: owner, ...msg, replyTo: email, idempotencyKey: `abandon-alert-${order.id}` });
          if (!alerted) await db.from("orders").update({ abandon_alert_sent_at: null }).eq("id", order.id);
        }
      }
    }
    out.push({ order: order.order_number, alert: alerted, reminder });
  }
  return out;
}

/** One-click unsubscribe from the reminder email (order id is the token). */
export async function unsubscribeByOrder(orderId: string): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return false;
  const db = createAdminClient();
  const { data: order } = await db.from("orders").select("id, email").eq("id", orderId).maybeSingle();
  if (!order?.email) return false;
  await Promise.all([
    db.from("email_suppressions").upsert({ email: order.email.toLowerCase(), reason: "unsubscribe" }, { onConflict: "email" }),
    db.from("orders").update({ reminder_opt_in: false }).eq("id", order.id),
  ]);
  return true;
}
