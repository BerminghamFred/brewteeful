import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMetaPurchase } from "@/lib/meta-capi";
import { absoluteUrl } from "@/lib/brand";

export const runtime = "nodejs";

/**
 * Stripe → orders. Handlers are idempotent by construction (conditional updates),
 * so Stripe retries are safe; side effects only run on the transition itself.
 */
export async function POST(req: Request) {
  if (!process.env.STRIPE_WEBHOOK_SECRET || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const raw = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("webhook signature", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === "paid") await markPaid(session);
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id;
        if (orderId)
          await createAdminClient().from("orders").update({ status: "cancelled" }).eq("id", orderId).eq("status", "pending");
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
        if (pi)
          await createAdminClient()
            .from("orders")
            .update({
              refunded_pence: charge.amount_refunded,
              status: charge.amount_refunded >= charge.amount ? "refunded" : "partially_refunded",
            })
            .eq("stripe_payment_intent_id", pi);
        break;
      }
    }
    await createAdminClient().from("stripe_events").upsert({ id: event.id, type: event.type }, { ignoreDuplicates: true });
  } catch (e) {
    console.error("webhook handler", event.type, e);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}

async function markPaid(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;
  if (!orderId) return;
  const db = createAdminClient();
  const stripe = getStripe();

  const piId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
  let fee: number | null = null;
  if (piId) {
    try {
      const pi = await stripe.paymentIntents.retrieve(piId, { expand: ["latest_charge.balance_transaction"] });
      const charge = pi.latest_charge as Stripe.Charge | null;
      const bt = charge?.balance_transaction as Stripe.BalanceTransaction | null;
      fee = bt?.fee ?? null;
    } catch (e) {
      console.error("fee lookup", e);
    }
  }

  const ship = session.collected_information?.shipping_details ?? session.shipping_details;
  const details = session.customer_details;
  const address = ship?.address ?? details?.address ?? null;

  const { data: order, error } = await db
    .from("orders")
    .update({
      status: "paid",
      paid_at: new Date((session.created ?? Date.now() / 1000) * 1000).toISOString(),
      email: details?.email ?? null,
      customer_name: ship?.name ?? details?.name ?? null,
      phone: details?.phone ?? null,
      shipping_address: address ? { name: ship?.name ?? details?.name ?? null, ...address } : null,
      total_pence: session.amount_total ?? undefined,
      shipping_pence: session.shipping_cost?.amount_total ?? undefined,
      payment_fee_pence: fee,
      stripe_payment_intent_id: piId,
    })
    .eq("id", orderId)
    .in("status", ["pending", "cancelled"])
    .select("*")
    .maybeSingle();
  if (error) throw error;
  if (!order) return; // already processed

  if (order.discount_code) await db.rpc("redeem_discount_code", { p_code: order.discount_code });

  const { data: items } = await db.from("order_items").select("product_id, product_name").eq("order_id", orderId);
  const contentIds = [...new Set((items ?? []).map((i) => i.product_id ?? i.product_name))];

  await db.from("events").insert({
    name: "purchase",
    visitor_id: order.visitor_id,
    session_id: order.session_id,
    path: "/checkout/success",
    value_pence: order.total_pence,
    props: { order_id: order.id, order_number: order.order_number, item_count: order.item_count, source: "webhook" },
  });

  if (order.consent?.ads) {
    const [firstName, ...rest] = (order.customer_name ?? "").split(" ");
    const attr = order.attribution ?? {};
    await sendMetaPurchase({
      orderId: order.id,
      valuePence: order.total_pence,
      itemCount: order.item_count,
      contentIds,
      email: order.email,
      phone: order.phone,
      firstName: firstName || null,
      lastName: rest.join(" ") || null,
      postcode: address?.postal_code ?? null,
      city: address?.city ?? null,
      fbp: attr.fbp,
      fbc: attr.fbc,
      fbclid: attr.fbclid,
      clientUa: attr.client_ua,
      eventSourceUrl: absoluteUrl("/checkout/success"),
      eventTime: Math.floor(Date.now() / 1000),
    }).catch((e) => console.error("meta capi", e));
  }
}
