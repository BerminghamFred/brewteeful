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
import { estimateDelivery, formatDay } from "@/lib/delivery";
import type { DeliverySettings } from "@/lib/settings";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export function CheckoutPageBody({
  guarantee,
  sizesLater = false,
  delivery,
  freeDelivery,
  company,
}: {
  guarantee: string;
  sizesLater?: boolean;
  delivery: DeliverySettings;
  freeDelivery: boolean;
  company: { name: string; registration: string; email: string };
}) {
  const router = useRouter();
  const { people, inBasket, email: savedEmail, setEmail } = useSetStore();
  // Step 1: email (so we can send updates — and one reminder if they don't finish). Step 2: Stripe.
  const [emailInput, setEmailInput] = useState("");
  const [reminderOk, setReminderOk] = useState(true);
  const [confirmed, setConfirmed] = useState<{ email: string; reminderOk: boolean } | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stripePromise = useMemo(() => (publishableKey ? loadStripe(publishableKey) : null), []);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (savedEmail && !emailInput) setEmailInput(savedEmail);
  }, [savedEmail, emailInput]);
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
      body: JSON.stringify({ people, eventDate, discountCode, shippingMethod, email: confirmed?.email, reminderOptIn: confirmed?.reminderOk }),
    });
    const data = (await res.json()) as { clientSecret?: string; error?: string };
    if (!res.ok || !data.clientSecret) {
      setError(data.error ?? "Couldn't start checkout.");
      throw new Error(data.error ?? "checkout failed");
    }
    track("begin_checkout", { group_size: people.length });
    return data.clientSecret;
  }, [confirmed]);

  function continueToPayment(e: React.FormEvent) {
    e.preventDefault();
    const value = emailInput.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError(null);
    setEmail(value);
    setConfirmed({ email: value, reminderOk });
    track("add_contact_info", { reminder_opt_in: reminderOk });
  }

  const est = estimateDelivery(delivery, "standard");
  const trust = (
    <ul className="space-y-2.5 text-sm text-ink/80">
      <li className="flex gap-2.5">
        <span aria-hidden>🚚</span>
        <span>
          <strong className="text-ink">{freeDelivery ? "Free tracked UK delivery" : "Tracked UK delivery"}</strong> — order today, arrives{" "}
          {formatDay(est.earliest)}
          {est.latest > est.earliest ? `–${formatDay(est.latest)}` : ""}.{" "}
          <Link href="/delivery-returns" target="_blank" className="underline underline-offset-2">Delivery &amp; returns</Link>
        </span>
      </li>
      <li className="flex gap-2.5">
        <span aria-hidden>✓</span>
        <span>{guarantee}</span>
      </li>
      <li className="flex gap-2.5">
        <span aria-hidden>↩︎</span>
        <span>Changed your mind? Return unworn shirts within 14 days of delivery for a refund.</span>
      </li>
      <li className="flex gap-2.5">
        <span aria-hidden>🔒</span>
        <span>Secure payment by Stripe — Apple Pay, Google Pay and cards. We never see your card details.</span>
      </li>
      <li className="flex gap-2.5 text-xs text-mute">
        <span aria-hidden>🏷</span>
        <span>
          Sold by {company.name}
          {company.registration ? ` · ${company.registration.replace(/ Registered office as above\.?/, "")}` : ""}
          {company.email ? (
            <>
              {" "}· <a href={`mailto:${company.email}`} className="underline underline-offset-2">{company.email}</a>
            </>
          ) : null}
        </span>
      </li>
    </ul>
  );

  if (!mounted || !ready) return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-mute">Loading checkout…</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-6 md:pt-10">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="h-display text-4xl">Checkout</h1>
        <Link href="/basket" className="text-sm font-bold underline">← Back to set</Link>
      </div>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          {sizesLater && people.some((p) => !p.size) ? (
            <p className="mb-4 rounded-2xl bg-paper p-3 text-sm">
              <strong>Sizes later:</strong> straight after paying you&apos;ll get a link for the group to add their sizes. Printing starts when the last one&apos;s in.
            </p>
          ) : null}
          {error ? (
            <div className="card mb-4 bg-sun p-4 text-sm font-bold">
              {error}{" "}
              <Link href="/basket" className="underline">Back to your set</Link>
            </div>
          ) : null}

          {!confirmed ? (
            <form onSubmit={continueToPayment} className="card p-5 md:p-6" noValidate>
              <p className="text-sm font-semibold text-mute">Step 1 of 2</p>
              <label htmlFor="checkout-email" className="mt-1 block text-xl font-semibold tracking-tight">
                Where should we send your order updates?
              </label>
              <input
                id="checkout-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@example.com"
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "checkout-email-error" : undefined}
                className="mt-3 h-12 w-full rounded-2xl border border-ink/15 bg-white px-4 text-base outline-none focus:border-ink"
              />
              {emailError ? (
                <p id="checkout-email-error" className="mt-2 text-sm font-semibold text-flare">{emailError}</p>
              ) : null}
              <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-ink/80">
                <input type="checkbox" checked={reminderOk} onChange={(e) => setReminderOk(e.target.checked)} className="mt-0.5 h-4 w-4 accent-ink" />
                <span>If I don&apos;t finish, send me one reminder with a link back to my order. (Just one, and you can unsubscribe.)</span>
              </label>
              <button type="submit" className="btn-primary mt-5 h-12 w-full text-base">Continue to payment →</button>
              <p className="mt-3 text-center text-xs text-mute">
                We&apos;ll use this for your receipt and delivery updates. See our <Link href="/privacy" className="underline">privacy policy</Link>.
              </p>
            </form>
          ) : (
            <>
              <p className="mb-3 text-sm text-mute">
                <span className="font-semibold text-ink">Step 2 of 2</span> · Updates go to <strong className="text-ink">{confirmed.email}</strong>{" "}
                <button type="button" onClick={() => setConfirmed(null)} className="underline underline-offset-2">Change</button>
              </p>
              {!publishableKey || !stripePromise ? (
                <p className="card p-4 text-sm">Payments aren&apos;t configured yet (missing Stripe publishable key).</p>
              ) : (
                <div className="min-h-[520px] overflow-hidden rounded-2xl border border-ink/10 bg-white">
                  <EmbeddedCheckoutProvider key={confirmed.email} stripe={stripePromise} options={{ fetchClientSecret }}>
                    <EmbeddedCheckout />
                  </EmbeddedCheckoutProvider>
                </div>
              )}
            </>
          )}
        </div>
        <aside className="card h-fit p-5 md:sticky md:top-24">
          <p className="mb-3 text-sm font-semibold">{shirts(people.length)}, one parcel</p>
          {trust}
        </aside>
      </div>
    </div>
  );
}
