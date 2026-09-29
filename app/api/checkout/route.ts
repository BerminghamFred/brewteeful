import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/supabase/public";
import { buildQuote, orderCostSnapshot, parseCheckoutInput } from "@/lib/checkout";
import { getStorefrontContext } from "@/lib/store";
import { COOKIES, parseConsent } from "@/lib/cookies";
import { absoluteUrl } from "@/lib/brand";

export const runtime = "nodejs";

/**
 * 1. Re-price the set server-side  2. Write a pending order + items
 * 3. Create an embedded Stripe Checkout Session pointing at that order.
 */
export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !hasServiceRole())
    return NextResponse.json({ error: "Checkout isn't configured yet." }, { status: 503 });

  const input = parseCheckoutInput(await req.json().catch(() => null));
  if (!input) return NextResponse.json({ error: "Invalid set" }, { status: 400 });

  const ctx = await getStorefrontContext();
  const quote = await buildQuote(input, ctx);
  if (!quote.ok) return NextResponse.json({ error: quote.errors[0] ?? "Invalid set", errors: quote.errors }, { status: 400 });
  if (input.discountCode && quote.pricing.codeRejection)
    return NextResponse.json({ error: quote.pricing.codeRejection }, { status: 400 });

  const jar = await cookies();
  const sessionId = jar.get(COOKIES.session)?.value ?? null;
  const db = createAdminClient();

  // Attribution from this visit's session row (written by /api/events).
  let attribution: Record<string, unknown> | null = null;
  if (sessionId) {
    const { data } = await db
      .from("visitor_sessions")
      .select("utm_source, utm_medium, utm_campaign, utm_term, utm_content, gclid, gbraid, wbraid, fbclid, landing_page, referrer, device")
      .eq("id", sessionId)
      .maybeSingle();
    attribution = data;
  }
  // Meta browser ids + UA improve Conversions API match quality (only used with ads consent).
  attribution = {
    ...(attribution ?? {}),
    fbp: jar.get("_fbp")?.value ?? null,
    fbc: jar.get("_fbc")?.value ?? null,
    client_ua: req.headers.get("user-agent")?.slice(0, 300) ?? null,
  };

  const p = quote.pricing;
  const costs = await orderCostSnapshot(quote);
  const { data: order, error } = await db
    .from("orders")
    .insert({
      status: "pending",
      event_date: quote.eventDate,
      shipping_method: p.shippingMethod,
      item_count: p.itemCount,
      subtotal_pence: p.subtotalPence,
      discount_pence: p.discountPence,
      shipping_pence: p.shippingPence,
      total_pence: p.totalPence,
      cogs_pence: costs.cogsPence,
      fulfilment_cost_pence: costs.fulfilmentCostPence,
      discount_code: quote.discount?.code ?? null,
      applied_offers: p.discounts,
      pricing_snapshot: p,
      visitor_id: ctx.visitorId,
      session_id: sessionId && /^[0-9a-f-]{36}$/i.test(sessionId) ? sessionId : null,
      attribution,
      experiments: ctx.experiments.assignments,
      consent: parseConsent(jar.get(COOKIES.consent)?.value),
    })
    .select("id, order_number")
    .single();
  if (error || !order) {
    console.error("order insert", error);
    return NextResponse.json({ error: "Couldn't start checkout. Please try again." }, { status: 500 });
  }

  const { error: itemsError } = await db.from("order_items").insert(
    quote.lines.map((l) => ({
      order_id: order.id,
      position: l.position,
      is_stag: l.is_stag,
      nickname: l.nickname,
      product_id: l.product.id.startsWith("fallback-") ? null : l.product.id,
      variant_id: l.variantId,
      product_name: l.product.name,
      size: l.size,
      sku: l.sku,
      unit_price_pence: l.unitPricePence,
      unit_cost_pence: l.unitCostPence,
    }))
  );
  if (itemsError) {
    console.error("order items insert", itemsError);
    return NextResponse.json({ error: "Couldn't start checkout. Please try again." }, { status: 500 });
  }

  // Stripe line items: one per design+price, sizes listed so the receipt is readable.
  const grouped = new Map<string, { name: string; sizes: string[]; unit: number; image?: string | null }>();
  for (const l of quote.lines) {
    const key = `${l.product.id}:${l.unitPricePence}`;
    const g = grouped.get(key) ?? { name: l.product.name, sizes: [], unit: l.unitPricePence, image: l.product.hero_image_url };
    g.sizes.push(l.size);
    grouped.set(key, g);
  }
  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [...grouped.values()].map((g) => ({
    quantity: g.sizes.length,
    price_data: {
      currency: "gbp",
      unit_amount: g.unit,
      product_data: {
        name: `${g.name} T-shirt`,
        description: `Sizes: ${g.sizes.join(", ")}`,
        images: g.image ? [g.image] : undefined,
      },
    },
  }));

  const stripe = getStripe();
  let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
  if (p.discountPence > 0) {
    const coupon = await stripe.coupons.create({
      amount_off: p.discountPence,
      currency: "gbp",
      duration: "once",
      max_redemptions: 1,
      name: p.discounts.map((d) => d.label).join(" + ").slice(0, 40),
      metadata: { order_id: order.id },
    });
    discounts = [{ coupon: coupon.id }];
  }

  const shippingLabel = p.shippingMethod === "express" ? ctx.settings.delivery.express_label : ctx.settings.delivery.standard_label;
  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      mode: "payment",
      line_items,
      discounts,
      shipping_address_collection: { allowed_countries: ["GB"] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: p.freeShipping ? `${shippingLabel} (free)` : shippingLabel,
            fixed_amount: { amount: p.shippingPence, currency: "gbp" },
          },
        },
      ],
      phone_number_collection: { enabled: true },
      client_reference_id: order.id,
      metadata: { order_id: order.id, order_number: String(order.order_number) },
      payment_intent_data: {
        metadata: { order_id: order.id, order_number: String(order.order_number) },
        description: `Stag set #${order.order_number} (${p.itemCount} shirts)`,
      },
      return_url: `${absoluteUrl("/checkout/success")}?session_id={CHECKOUT_SESSION_ID}`,
    });
    await db.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);
    return NextResponse.json({ clientSecret: session.client_secret, orderId: order.id });
  } catch (e) {
    console.error("stripe session", e);
    await db.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    return NextResponse.json({ error: "Payment provider error. Please try again." }, { status: 502 });
  }
}
