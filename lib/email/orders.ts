/**
 * Order emails. Each send is "claimed" first with a conditional update on its *_sent_at
 * column, so webhook retries and repeated admin saves never email a customer twice.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { getSettings } from "@/lib/store";
import type { Order, OrderItem } from "@/lib/types";
import { emailConfigured, sendEmail } from "@/lib/email/send";
import { orderConfirmationEmail, orderShippedEmail, type EmailProduct } from "@/lib/email/templates";

type Kind = "confirmation" | "shipped";
const COLUMN: Record<Kind, "confirmation_email_sent_at" | "shipped_email_sent_at"> = {
  confirmation: "confirmation_email_sent_at",
  shipped: "shipped_email_sent_at",
};

async function load(orderId: string) {
  const db = createAdminClient();
  const [{ data: order }, { data: items }] = await Promise.all([
    db.from("orders").select("*").eq("id", orderId).maybeSingle<Order>(),
    db.from("order_items").select("*").eq("order_id", orderId).order("position").returns<OrderItem[]>(),
  ]);
  if (!order) return null;
  const ids = [...new Set((items ?? []).map((i) => i.product_id).filter((x): x is string => !!x))];
  const products: Record<string, EmailProduct> = {};
  if (ids.length) {
    const { data } = await db.from("products").select("id, name, hero_image_url, accent_color").in("id", ids);
    for (const p of data ?? []) products[p.id] = { name: p.name, imageUrl: p.hero_image_url, color: p.accent_color };
  }
  return { order, items: items ?? [], products };
}

/** Sends the email once. `force` re-sends (admin "resend" button). Returns true if sent. */
export async function sendOrderEmail(orderId: string, kind: Kind, opts: { force?: boolean } = {}): Promise<boolean> {
  if (!emailConfigured()) return false;
  const db = createAdminClient();
  const col = COLUMN[kind];

  if (!opts.force) {
    const { data: claimed } = await db
      .from("orders")
      .update({ [col]: new Date().toISOString() })
      .eq("id", orderId)
      .is(col, null)
      .not("email", "is", null)
      .select("id")
      .maybeSingle();
    if (!claimed) return false; // already sent, or no email address
  }

  try {
    const data = await load(orderId);
    if (!data?.order.email) throw new Error("order or email missing");
    const settings = await getSettings();
    const msg = kind === "confirmation" ? orderConfirmationEmail({ ...data, settings }) : orderShippedEmail({ ...data, settings });
    const ok = await sendEmail({
      to: data.order.email,
      ...msg,
      replyTo: settings.contact.email && !settings.contact.email.endsWith("example.com") ? settings.contact.email : null,
      idempotencyKey: opts.force ? undefined : `${kind}-${orderId}`,
    });
    if (!ok) throw new Error("send failed");
    if (opts.force) await db.from("orders").update({ [col]: new Date().toISOString() }).eq("id", orderId);
    return true;
  } catch (e) {
    console.error(`order email (${kind})`, orderId, e);
    // Release the claim so a later retry (webhook redelivery / admin resend) can send it.
    if (!opts.force) await db.from("orders").update({ [col]: null }).eq("id", orderId);
    return false;
  }
}
