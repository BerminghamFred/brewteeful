import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!process.env.STRIPE_WEBHOOK_SECRET || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const raw = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      raw,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const id = event.id;

    try {
      const admin = createAdminClient();
      const { error: evErr } = await admin.from("stripe_events").insert({
        id,
      });
      if (evErr?.code === "23505") {
        return NextResponse.json({ received: true, duplicate: true });
      }
      if (evErr) throw evErr;

      const amount = session.amount_total ?? 0;
      const lineItems = session.metadata?.items_json
        ? JSON.parse(session.metadata.items_json as string)
        : [];

      await admin.from("orders").insert({
        stripe_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
        status: "paid",
        email: session.customer_details?.email ?? session.customer_email,
        total_pence: amount,
        currency: session.currency ?? "gbp",
        line_items: lineItems,
        metadata: session.metadata as Record<string, unknown>,
      });
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
