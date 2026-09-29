"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSetStore } from "@/stores/set-store";
import { TeeArt } from "@/components/site/TeeArt";
import { gbp } from "@/lib/format";
import { estimateDelivery, formatDay } from "@/lib/delivery";
import { track } from "@/lib/track";
import type { PricingResult } from "@/lib/pricing";
import type { BuilderConfig } from "@/components/builder/types";
import { isComplete, useSetPricing } from "@/components/builder/useSetPricing";
import { PriceBreakdown } from "@/components/basket/PriceBreakdown";

type ServerQuote = { ok: boolean; errors: string[]; pricing: PricingResult };

export function Basket({ cfg, guarantee }: { cfg: BuilderConfig; guarantee: string }) {
  const { people, inBasket, eventDate, discountCode, shippingMethod, setDiscountCode, setShippingMethod } = useSetStore();
  const [mounted, setMounted] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [quote, setQuote] = useState<ServerQuote | null>(null);
  const [checking, setChecking] = useState(false);
  const viewed = useRef(false);
  const bySlug = useMemo(() => new Map(cfg.designs.map((d) => [d.slug, d])), [cfg.designs]);
  const local = useSetPricing(cfg, people, shippingMethod);

  useEffect(() => setMounted(true), []);

  const ready = mounted && inBasket && isComplete(people);

  // Server quote is authoritative (codes, experiment pricing); refresh when inputs change.
  useEffect(() => {
    if (!ready) return;
    const ctrl = new AbortController();
    setChecking(true);
    fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ people, eventDate, discountCode, shippingMethod }),
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((q: ServerQuote) => {
        setQuote(q);
        if (!viewed.current) {
          viewed.current = true;
          track("view_cart", { group_size: people.length }, { value: q.pricing.totalPence / 100 });
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
    return () => ctrl.abort();
  }, [ready, people, eventDate, discountCode, shippingMethod]);

  if (!mounted) return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-mute">Loading…</div>;

  if (!ready) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="h-display text-5xl">Your basket&apos;s empty</h1>
        <p className="mt-3 text-ink/80">Build your group&apos;s set — it takes about five minutes.</p>
        <Link href="/build" className="btn-primary mt-6">
          {people.length ? "Finish your set →" : "Build your stag set →"}
        </Link>
      </div>
    );
  }

  const pricing = quote?.pricing ?? local;
  const est = estimateDelivery(cfg.delivery, pricing.shippingMethod);

  function applyCode(e: React.FormEvent) {
    e.preventDefault();
    const code = codeInput.trim().toUpperCase();
    if (!code) return;
    setDiscountCode(code);
    track("apply_discount", { code });
  }

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 pb-16 pt-6 md:grid-cols-[minmax(0,1fr)_360px] md:pt-10">
      <div className="min-w-0">
        <div className="flex items-end justify-between">
          <h1 className="h-display text-5xl">Your set</h1>
          <Link href="/build" className="text-sm font-medium text-ink/60 hover:text-ink">Edit set</Link>
        </div>
        <ul className="mt-4 divide-y divide-ink/[0.06] card overflow-hidden">
          {people.map((p, i) => {
            const d = bySlug.get(p.design!);
            return (
              <li key={i} className="flex items-center gap-3 p-3">
                <TeeArt name={d?.name ?? ""} color={d?.color ?? "#ddd"} imageUrl={d?.imageUrl} label={false} sizes="56px" className="h-14 w-14 shrink-0 rounded-2xl" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-mute">
                    {i === 0 ? "★ The Stag" : `Person ${i + 1}`}
                    {p.nickname ? ` · ${p.nickname}` : ""}
                  </p>
                  <p className="truncate font-semibold">{d?.name}</p>
                </div>
                <span className="rounded-full bg-paper px-3 py-1 text-sm font-medium">{p.size}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <aside className="min-w-0 space-y-4 md:sticky md:top-24 md:self-start">
        <div className="card p-5 shadow-soft">
          <PriceBreakdown pricing={pricing} />
          {quote?.errors?.length ? <p className="mt-3 text-sm font-bold text-flare">{quote.errors[0]}</p> : null}

          {cfg.pricing.express_enabled ? (
            <fieldset className="mt-4 space-y-2 text-sm">
              <legend className="eyebrow mb-1">Delivery</legend>
              {(["standard", "express"] as const).map((m) => (
                <label key={m} className="flex cursor-pointer items-center gap-2">
                  <input type="radio" name="ship" checked={shippingMethod === m} onChange={() => setShippingMethod(m)} />
                  {m === "standard" ? cfg.delivery.standard_label : `${cfg.delivery.express_label} — ${gbp(cfg.pricing.express_shipping_pence)}`}
                </label>
              ))}
            </fieldset>
          ) : null}

          <p className="mt-4 rounded-2xl bg-paper p-4 text-sm">
            <strong>Estimated arrival:</strong> {formatDay(est.earliest)}
            {est.latest > est.earliest ? `–${formatDay(est.latest)}` : ""}
            {eventDate ? <span className="block text-xs text-mute">Stag date: {new Date(eventDate + "T12:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span> : null}
          </p>

          <Link
            href="/checkout"
            aria-disabled={!quote?.ok}
            className={`btn-primary mt-4 w-full text-lg ${quote?.ok && !checking ? "" : "pointer-events-none opacity-50"}`}
          >
            Checkout securely →
          </Link>
          <p className="mt-2 text-center text-xs text-mute">Apple Pay · Google Pay · All major cards</p>

          <form onSubmit={applyCode} className="mt-4 flex gap-2">
            <input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Discount code"
              className="h-11 min-w-0 flex-1 rounded-full border border-ink/10 bg-paper px-4 text-base"
              aria-label="Discount code"
            />
            <button type="submit" className="btn-ghost min-h-[44px] px-4 text-sm">Apply</button>
          </form>
          {discountCode ? (
            <p className="mt-2 text-xs">
              {quote?.pricing.codeRejection ? (
                <span className="font-bold text-flare">{quote.pricing.codeRejection}</span>
              ) : (
                <span className="font-bold text-pitch">Code {discountCode} applied</span>
              )}{" "}
              <button type="button" className="underline" onClick={() => setDiscountCode(null)}>Remove</button>
            </p>
          ) : null}
        </div>
        <p className="text-center text-sm">✓ {guarantee}</p>
      </aside>
    </div>
  );
}
