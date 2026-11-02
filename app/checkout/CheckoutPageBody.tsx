"use client";

import { shirts } from "@/lib/format";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { useSetStore } from "@/stores/set-store";
import { isComplete } from "@/components/builder/useSetPricing";
import { track } from "@/lib/track";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export function CheckoutPageBody({ guarantee, sizesLater = false }: { guarantee: string; sizesLater?: boolean }) {
  const router = useRouter();
  const { people, inBasket } = useSetStore();
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stripePromise = useMemo(() => (publishableKey ? loadStripe(publishableKey) : null), []);

  useEffect(() => setMounted(true), []);
  const ready = inBasket && isComplete(people, sizesLater);
  useEffect(() => {
    if (mounted && !ready) router.replace("/basket");
  }, [mounted, ready, router]);

  // Stable per mount so the embedded checkout isn't recreated on re-render; reads the latest set.
  const fetchClientSecret = useCallback(async () => {
    const { people, eventDate, discountCode, shippingMethod } = useSetStore.getState();
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ people, eventDate, discountCode, shippingMethod }),
    });
    const data = (await res.json()) as { clientSecret?: string; error?: string };
    if (!res.ok || !data.clientSecret) {
      setError(data.error ?? "Couldn't start checkout.");
      throw new Error(data.error ?? "checkout failed");
    }
    track("begin_checkout", { group_size: people.length });
    return data.clientSecret;
  }, []);

  if (!mounted || !ready) return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-mute">Loading checkout…</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-6 md:pt-10">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="h-display text-4xl">Checkout</h1>
        <Link href="/basket" className="text-sm font-bold underline">← Back to set</Link>
      </div>
      <p className="mb-4 text-sm text-mute">
        🔒 Secure payment by Stripe — Apple Pay, Google Pay and cards. {shirts(people.length)}, one parcel. {guarantee}
      </p>
      {sizesLater && people.some((p) => !p.size) ? (
        <p className="mb-4 rounded-2xl bg-paper p-3 text-sm">
          <strong>Sizes later:</strong> straight after paying you&apos;ll get a link for the group to add their sizes. Printing starts when the last one&apos;s in.
        </p>
      ) : null}
      {error ? (
        <div className="card bg-sun p-4 text-sm font-bold">
          {error}{" "}
          <Link href="/basket" className="underline">Back to your set</Link>
        </div>
      ) : null}
      {!publishableKey || !stripePromise ? (
        <p className="card p-4 text-sm">Payments aren&apos;t configured yet (missing Stripe publishable key).</p>
      ) : (
        <div className="min-h-[520px] overflow-hidden rounded-2xl border border-ink/10 bg-white">
          <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      )}
    </div>
  );
}
