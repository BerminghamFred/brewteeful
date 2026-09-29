import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

type Body = {
  items: {
    productId: string;
    variantId: string;
    quantity: number;
    unitPricePence: number;
    title: string;
    imageUrl: string;
  }[];
  orderBump?: boolean;
};

/**
 * Creates an embedded Checkout Session (`ui_mode: embedded`).
 * Client mounts <EmbeddedCheckout /> with the returned `clientSecret`.
 * @see https://docs.stripe.com/checkout/embedded/quickstart
 */
export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 503 }
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.items?.length) {
    return NextResponse.json({ error: "Empty cart" }, { status: 400 });
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const lineItems = body.items.map((i) => ({
    price_data: {
      currency: "gbp",
      product_data: {
        name: i.title,
        images: i.imageUrl ? [i.imageUrl] : undefined,
        metadata: {
          product_id: i.productId,
          variant_id: i.variantId,
        },
      },
      unit_amount: i.unitPricePence,
    },
    quantity: i.quantity,
  }));

  if (body.orderBump) {
    lineItems.push({
      price_data: {
        currency: "gbp",
        product_data: {
          name: "Order bump — extra tee",
          images: undefined,
          metadata: {
            product_id: "order_bump",
            variant_id: "order_bump",
          },
        },
        unit_amount: 1999,
      },
      quantity: 1,
    });
  }

  const stripe = getStripe();

  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      mode: "payment",
      line_items: lineItems,
      return_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      automatic_tax: { enabled: false },
      billing_address_collection: "required",
      shipping_address_collection: {
        allowed_countries: ["GB"],
      },
      phone_number_collection: { enabled: true },
      metadata: {
        order_bump: body.orderBump ? "true" : "false",
        items_json: JSON.stringify(body.items),
      },
    });

    if (!session.client_secret) {
      return NextResponse.json(
        { error: "No client secret" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      clientSecret: session.client_secret,
      sessionId: session.id,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Stripe error" }, { status: 500 });
  }
}
