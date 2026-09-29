"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useCartStore } from "@/stores/cart-store";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export function EmbeddedCheckoutClient() {
  const items = useCartStore((s) => s.items);

  const stripePromise = useMemo(() => {
    if (!publishableKey) return null;
    return loadStripe(publishableKey);
  }, []);

  const fetchClientSecret = useCallback(async () => {
    const orderBump =
      typeof window !== "undefined" &&
      sessionStorage.getItem("brewteeful-order-bump") === "1";

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
          unitPricePence: i.unitPricePence,
          title: i.title,
          imageUrl: i.imageUrl,
        })),
        orderBump,
      }),
    });

    const data = (await res.json()) as {
      clientSecret?: string;
      error?: string;
    };

    if (!res.ok || !data.clientSecret) {
      throw new Error(data.error ?? "Could not start checkout");
    }

    return data.clientSecret;
  }, [items]);

  if (!publishableKey) {
    return (
      <p className="text-sm text-red-400">
        Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY. Add it to your environment.
      </p>
    );
  }

  if (!stripePromise) {
    return null;
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-[480px] w-full">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ fetchClientSecret }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}

export function CheckoutChrome() {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-8 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-display text-4xl text-white">Checkout</h1>
        <p className="mt-1 text-sm text-white/55">
          Secure payment powered by Stripe — Apple Pay & Google Pay when
          available.
        </p>
      </div>
      <Link
        href="/cart"
        className="text-sm font-medium text-brand-accent hover:underline"
      >
        ← Back to cart
      </Link>
    </div>
  );
}
