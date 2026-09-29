import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { updateOrder } from "@/lib/admin/actions";
import { Card, Field, Notice, PageTitle, Stat } from "@/components/admin/ui";
import { gbp } from "@/lib/format";
import { mergeSettings } from "@/lib/settings";
import { orderEconomics } from "@/lib/economics";
import type { Order, OrderItem } from "@/lib/types";

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const db = await requireAdmin();
  const [{ data: order }, { data: items }, { data: settingsRows }] = await Promise.all([
    db.from("orders").select("*").eq("id", id).maybeSingle<Order>(),
    db.from("order_items").select("*").eq("order_id", id).order("position").returns<OrderItem[]>(),
    db.from("site_settings").select("key, value"),
  ]);
  if (!order) notFound();
  const econ = orderEconomics(order, mergeSettings(settingsRows).economics);
  const a = order.shipping_address ?? {};
  const stripeUrl = order.stripe_payment_intent_id ? `https://dashboard.stripe.com/payments/${order.stripe_payment_intent_id}` : null;

  return (
    <>
      <PageTitle title={`Order #${order.order_number}`} sub={`${order.status} · ${order.fulfilment_status} · placed ${new Date(order.created_at).toLocaleString("en-GB")}`}>
        <Link href="/admin/orders" className="text-sm underline">← Orders</Link>
      </PageTitle>
      <Notice sp={sp} />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Total paid" value={gbp(order.total_pence, { whole: false })} />
        <Stat label="COGS" value={gbp(order.cogs_pence, { whole: false })} />
        <Stat label="Postage est." value={gbp(order.fulfilment_cost_pence, { whole: false })} />
        <Stat label="Stripe fee" value={gbp(econ.paymentFeePence, { whole: false })} hint={order.payment_fee_pence == null ? "estimated" : "actual"} />
        <Stat label="Contribution" value={gbp(econ.contributionPence, { whole: false })} tone={econ.contributionPence >= 0 ? "good" : "bad"} hint="before ads" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div>
          <Card title={`Lineup — ${order.item_count} shirts`}>
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-mute">
                <tr>
                  <th className="py-1">#</th>
                  <th>Person</th>
                  <th>Design</th>
                  <th>Size</th>
                  <th>SKU</th>
                  <th className="text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {(items ?? []).map((i) => (
                  <tr key={i.id} className="border-t border-ink/10">
                    <td className="py-2">{i.position}</td>
                    <td>{i.is_stag ? "★ Stag" : "Lad"}{i.nickname ? ` — ${i.nickname}` : ""}</td>
                    <td className="font-bold">{i.product_name}</td>
                    <td className="font-semibold">{i.size}</td>
                    <td className="text-xs text-mute">{i.sku}</td>
                    <td className="text-right tabular-nums">{gbp(i.unit_price_pence)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-sm">
              Subtotal {gbp(order.subtotal_pence)} · Discount −{gbp(order.discount_pence)}
              {order.discount_code ? ` (${order.discount_code})` : ""} · Delivery {gbp(order.shipping_pence)} ({order.shipping_method})
              {order.refunded_pence ? ` · Refunded ${gbp(order.refunded_pence)}` : ""}
            </p>
          </Card>
          <Card title="Customer & delivery">
            <p className="text-sm">
              <strong>{order.customer_name}</strong>
              <br />
              {order.email} {order.phone ? `· ${order.phone}` : ""}
              <br />
              {[a.line1, a.line2, a.city, a.state, a.postal_code].filter(Boolean).join(", ")}
            </p>
            <p className="mt-2 text-sm">Stag date: <strong>{order.event_date ?? "not given"}</strong></p>
            {stripeUrl ? <a href={stripeUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm underline">Open in Stripe (refunds) ↗</a> : null}
          </Card>
          <Card title="Attribution">
            <pre className="overflow-x-auto text-xs">{JSON.stringify({ ...order.attribution, experiments: order.experiments, consent: order.consent }, null, 2)}</pre>
          </Card>
        </div>

        <Card title="Fulfilment">
          <form action={updateOrder} className="space-y-3">
            <input type="hidden" name="id" value={order.id} />
            <input type="hidden" name="shipped_at" value={order.shipped_at ?? ""} />
            <Field label="Status">
              <select name="fulfilment_status" defaultValue={order.fulfilment_status} className="input">
                {["unfulfilled", "in_production", "shipped", "delivered", "cancelled"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Carrier"><input name="carrier" defaultValue={order.carrier ?? ""} className="input" placeholder="Royal Mail" /></Field>
            <Field label="Tracking number"><input name="tracking_number" defaultValue={order.tracking_number ?? ""} className="input" /></Field>
            <Field label="Tracking URL"><input name="tracking_url" defaultValue={order.tracking_url ?? ""} className="input" /></Field>
            <Field label="Notes"><textarea name="admin_notes" defaultValue={order.admin_notes ?? ""} rows={4} className="input" /></Field>
            <button className="btn-dark w-full">Save</button>
          </form>
        </Card>
      </div>
    </>
  );
}
