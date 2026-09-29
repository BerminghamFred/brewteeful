import Link from "next/link";
import { notFound } from "next/navigation";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/supabase/public";
import { getStorefrontContext } from "@/lib/store";
import { estimateDelivery, formatDay } from "@/lib/delivery";
import { gbp } from "@/lib/format";
import type { Order, OrderItem } from "@/lib/types";
import { PurchaseComplete } from "@/components/checkout/PurchaseComplete";

export const metadata = { title: "Order confirmed", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  if (!session_id || !hasServiceRole() || !process.env.STRIPE_SECRET_KEY) notFound();

  const [session, { settings }] = await Promise.all([
    getStripe().checkout.sessions.retrieve(session_id).catch(() => null),
    getStorefrontContext(),
  ]);
  if (!session) notFound();
  const paid = session.payment_status === "paid";

  const db = createAdminClient();
  const { data: order } = await db.from("orders").select("*").eq("stripe_session_id", session_id).maybeSingle<Order>();
  if (!order) notFound();
  const { data: items } = await db.from("order_items").select("*").eq("order_id", order.id).order("position").returns<OrderItem[]>();

  const est = estimateDelivery(settings.delivery, order.shipping_method === "express" ? "express" : "standard", new Date(order.created_at));
  const email = session.customer_details?.email ?? order.email;

  const grouped = new Map<string, { item_id: string; item_name: string; item_variant: string; price: number; quantity: number }>();
  for (const i of items ?? []) {
    const key = `${i.product_id}:${i.size}`;
    const g = grouped.get(key) ?? { item_id: i.product_id ?? i.product_name, item_name: i.product_name, item_variant: i.size, price: i.unit_price_pence / 100, quantity: 0 };
    g.quantity++;
    grouped.set(key, g);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-8 md:pt-14">
      {paid ? (
        <PurchaseComplete
          orderId={order.id}
          orderNumber={order.order_number}
          value={(session.amount_total ?? order.total_pence) / 100}
          shipping={(session.shipping_cost?.amount_total ?? order.shipping_pence) / 100}
          discount={order.discount_pence / 100}
          items={[...grouped.values()]}
          email={email}
        />
      ) : null}
      <p className="eyebrow text-pitch">{paid ? "Order confirmed" : "Payment processing"}</p>
      <h1 className="h-display mt-1 text-5xl md:text-6xl">{paid ? "Shirts sorted. Legend." : "Nearly there…"}</h1>
      <p className="mt-3 text-lg">
        Order <strong>#{order.order_number}</strong>
        {email ? <> · confirmation sent to <strong>{email}</strong></> : null}
      </p>

      <ol className="card mt-6 divide-y-2 divide-ink/10">
        <li className="p-4">
          <p className="font-extrabold">1. Printing</p>
          <p className="text-sm text-ink/80">Your set goes to print within one working day and takes {settings.delivery.production_days_min}–{settings.delivery.production_days_max} working days.</p>
        </li>
        <li className="p-4">
          <p className="font-extrabold">2. Dispatch</p>
          <p className="text-sm text-ink/80">One parcel, tracked. We&apos;ll email your tracking link as soon as it ships.</p>
        </li>
        <li className="p-4">
          <p className="font-extrabold">3. Arrives {formatDay(est.earliest)}{est.latest > est.earliest ? `–${formatDay(est.latest)}` : ""}</p>
          {order.event_date ? <p className="text-sm text-ink/80">Stag date: {new Date(order.event_date + "T12:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</p> : null}
        </li>
      </ol>

      <h2 className="h-display mt-8 text-3xl">The lineup</h2>
      <ul className="card mt-3 divide-y divide-ink/10">
        {(items ?? []).map((i) => (
          <li key={i.id} className="flex justify-between gap-3 p-3 text-sm">
            <span>
              <span className="font-bold">{i.is_stag ? "★ The Stag" : `Lad ${i.position}`}</span>
              {i.nickname ? ` (${i.nickname})` : ""} — {i.product_name}
            </span>
            <span className="font-extrabold">{i.size}</span>
          </li>
        ))}
        <li className="flex justify-between p-3 font-extrabold">
          <span>Total paid</span>
          <span>{gbp(session.amount_total ?? order.total_pence)}</span>
        </li>
      </ul>

      <p className="mt-6 text-sm">
        Spotted a wrong size? Email <a className="underline" href={`mailto:${settings.contact.email}?subject=Order%20%23${order.order_number}`}>{settings.contact.email}</a> within 24 hours and we&apos;ll change it before printing.
      </p>
      <Link href="/" className="btn-ghost mt-6">Back to home</Link>
    </div>
  );
}
