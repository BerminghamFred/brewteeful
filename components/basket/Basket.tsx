"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSetStore } from "@/stores/set-store";
import { TeeArt } from "@/components/site/TeeArt";
import { DesignGallery } from "@/components/site/DesignGallery";
import { deliveryWindowText, gbp, shirts } from "@/lib/format";
import { estimateDelivery, formatDay } from "@/lib/delivery";
import { track } from "@/lib/track";
import type { PricingResult } from "@/lib/pricing";
import type { BuilderConfig, BuilderDesign } from "@/components/builder/types";
import { isComplete, useSetPricing } from "@/components/builder/useSetPricing";
import { PriceBreakdown } from "@/components/basket/PriceBreakdown";

const isModel = (url: string | undefined) => Boolean(url?.includes("/model/"));
const defaultSize = (d: BuilderDesign) => (d.sizes.includes("L") ? "L" : (d.sizes[0] ?? null));

type ServerQuote = { ok: boolean; errors: string[]; pricing: PricingResult };

export function Basket({ cfg, guarantee }: { cfg: BuilderConfig; guarantee: string }) {
  const { people, inBasket, eventDate, discountCode, shippingMethod, setDiscountCode, setShippingMethod, updatePerson, replaceAll } = useSetStore();
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState(0);
  // Arrived from an ad straight into the basket (?start=<design>): greet, don't say "Your set".
  const [landed, setLanded] = useState(false);
  const detailRef = useRef<HTMLDivElement | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [quote, setQuote] = useState<ServerQuote | null>(null);
  const [checking, setChecking] = useState(false);
  const viewed = useRef(false);
  const bySlug = useMemo(() => new Map(cfg.designs.map((d) => [d.slug, d])), [cfg.designs]);
  const local = useSetPricing(cfg, people, shippingMethod);

  // ?start=<design>: ad landing test — open the basket with that design in L, unless
  // this visitor already has a set in their basket (then just show that design).
  useEffect(() => {
    const start = new URLSearchParams(window.location.search).get("start");
    const d = start ? bySlug.get(start) : undefined;
    if (d) {
      setLanded(true);
      const s = useSetStore.getState();
      if (!s.inBasket || !s.people.length) {
        s.replaceAll([{ design: d.slug, size: defaultSize(d), nickname: "" }]);
        s.setInBasket(true);
        track("select_design", { design: d.slug, source: "landing" });
      } else {
        const i = s.people.findIndex((p) => p.design === d.slug);
        if (i >= 0) setSelected(i);
      }
    }
    setMounted(true);
  }, [bySlug]);

  const sizesLater = cfg.sizeFlow === "pay_first";
  const missingSizes = people.filter((p) => !p.size).length;
  const ready = mounted && inBasket && isComplete(people, sizesLater);

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
  const sel = Math.min(selected, people.length - 1);
  const cur = people[sel];
  const current = cur?.design ? bySlug.get(cur.design) : undefined;
  const personLabel = (i: number) => (i === 0 ? "★ The Stag" : `Person ${i + 1}`);

  function showDetail() {
    requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }
  function select(i: number) {
    setSelected(i);
    showDetail();
  }
  function swapTo(d: BuilderDesign) {
    updatePerson(sel, { design: d.slug, size: cur?.size && d.sizes.includes(cur.size) ? cur.size : defaultSize(d) });
    track("select_design", { design: d.slug, source: "basket", action: "swap" });
    showDetail();
  }
  function addDesign(d: BuilderDesign) {
    replaceAll([...people, { design: d.slug, size: defaultSize(d), nickname: "" }]);
    setSelected(people.length);
    track("select_design", { design: d.slug, source: "basket", action: "add", group_size: people.length + 1 });
    showDetail();
  }
  function removeSelected() {
    if (people.length < 2) return;
    replaceAll(people.filter((_, j) => j !== sel));
    setSelected(Math.max(0, sel - 1));
  }

  function applyCode(e: React.FormEvent) {
    e.preventDefault();
    const code = codeInput.trim().toUpperCase();
    if (!code) return;
    setDiscountCode(code);
    track("apply_discount", { code });
  }

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 pb-32 pt-6 md:grid-cols-[minmax(0,1fr)_340px] md:pb-16 md:pt-10">
      <div className="min-w-0">
        {landed && people.length === 1 && current ? (
          <div>
            <h1 className="h-display text-4xl md:text-5xl">Start with {current.name}.</h1>
            <p className="mt-2 text-[16px] text-ink/70">
              <strong className="text-ink">
                {gbp(pricing.unitPrices[0] ?? current.pricePence)}
                {pricing.shippingPence ? "" : ", free UK delivery"}
              </strong>
              , arrives in {deliveryWindowText(cfg.delivery)}. Pick your size and check out, or swap it and add your mates&apos; below.
            </p>
          </div>
        ) : (
          <div className="flex items-end justify-between">
            <h1 className="h-display text-5xl">Your set</h1>
            <Link href="/build" className="text-sm font-medium text-ink/60 hover:text-ink">Open the group builder</Link>
          </div>
        )}

        {people.length > 1 ? (
          <ul className="mt-4 divide-y divide-ink/[0.06] card overflow-hidden">
            {people.map((p, i) => {
              const d = bySlug.get(p.design!);
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => select(i)}
                    aria-current={i === sel}
                    className={`flex w-full items-center gap-3 p-3 text-left transition ${i === sel ? "bg-paper" : "hover:bg-paper/60"}`}
                  >
                    <TeeArt name={d?.name ?? ""} color={d?.color ?? "#ddd"} imageUrl={d?.imageUrl} label={false} sizes="56px" className="h-14 w-14 shrink-0 rounded-2xl" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] font-medium text-mute">
                        {personLabel(i)}
                        {p.nickname ? ` · ${p.nickname}` : ""}
                      </span>
                      <span className="block truncate font-semibold">{d?.name}</span>
                    </span>
                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${p.size ? "bg-chalk" : "bg-[#fff1ec] text-ink/70"}`}>{p.size ?? "Size later"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

        {current && cur ? (
          <div ref={detailRef} className="card mt-4 scroll-mt-24 overflow-hidden">
            <div className="grid gap-5 p-4 md:grid-cols-2 md:p-5">
              <div className="min-w-0">
              <DesignGallery
                key={current.slug}
                name={current.name}
                color={current.color}
                images={current.images.length ? current.images : current.imageUrl ? [{ id: "main", url: current.imageUrl, alt: current.name }] : []}
                portrait={isModel(current.images[0]?.url)}
              />
              </div>
              <div className="min-w-0">
                {people.length > 1 ? <p className="text-[12px] font-medium text-mute">{personLabel(sel)}</p> : null}
                <h2 className="h-display text-4xl">{current.name}</h2>
                {current.tagline ? <p className="mt-2 text-ink/65">{current.tagline}</p> : null}
                <p className="mt-3 text-xl font-semibold">
                  {gbp(pricing.unitPrices[sel] ?? current.pricePence)}
                  <span className="ml-2 text-sm font-normal text-mute">per shirt{cfg.pricing.free_shipping_min_items <= 1 ? " · free UK delivery" : ""}</span>
                </p>

                <div className="mt-5">
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-semibold">Size</p>
                    <Link href="/size-guide" className="text-sm text-ink/60 underline underline-offset-2">Size guide</Link>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {current.sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          updatePerson(sel, { size });
                          track("select_size", { size, source: "basket" });
                        }}
                        aria-pressed={cur.size === size}
                        className={`h-11 min-w-[3rem] rounded-full px-3 text-sm font-semibold transition ${cur.size === size ? "bg-ink text-chalk" : "bg-paper hover:bg-ink/10"}`}
                      >
                        {size}
                      </button>
                    ))}
                    {sizesLater ? (
                      <button
                        type="button"
                        onClick={() => updatePerson(sel, { size: null })}
                        aria-pressed={!cur.size}
                        className={`h-11 rounded-full px-3 text-sm font-semibold transition ${!cur.size ? "bg-ink text-chalk" : "bg-paper hover:bg-ink/10"}`}
                      >
                        Add later
                      </button>
                    ) : null}
                  </div>
                </div>

                {current.description ? <p className="mt-5 text-[15px] leading-relaxed text-ink/80">{current.description}</p> : null}
                {people.length > 1 ? (
                  <button type="button" onClick={removeSelected} className="mt-4 text-sm text-ink/60 underline underline-offset-2 hover:text-ink">
                    Remove this shirt
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {sizesLater && missingSizes ? (
          <div className="mt-4 rounded-3xl bg-pitch p-5 text-chalk">
            <p className="font-semibold">Pay now, add {missingSizes === people.length ? "sizes" : `the other ${missingSizes} ${missingSizes === 1 ? "size" : "sizes"}`} later</p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-chalk/80">
              After you pay, we&apos;ll email you a link to send to the group chat so everyone adds their own size.{" "}
              <strong className="text-chalk">Printing starts as soon as the last size is in</strong>, so the sooner they&apos;re in, the sooner your
              shirts arrive.
            </p>
          </div>
        ) : null}

        {current ? (
          <section className="mt-8" aria-labelledby="more-designs">
            <h2 id="more-designs" className="text-xl font-semibold tracking-tight">Swap it, or add one for a mate</h2>
            <p className="mt-1 text-sm text-mute">Everyone can have a different design{cfg.pricing.free_shipping_min_items <= 1 ? ", and delivery stays free" : ""}.</p>
            <div className="no-scrollbar -mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0">
              {cfg.designs
                .filter((x) => x.slug !== current.slug)
                .map((x) => (
                  <div key={x.slug} className="w-[46%] max-w-[210px] shrink-0 snap-start md:w-auto md:max-w-none">
                    <TeeArt
                      name={x.name}
                      color={x.color}
                      imageUrl={x.images[0]?.url ?? x.imageUrl}
                      label={false}
                      sizes="(max-width: 768px) 46vw, 220px"
                      className="aspect-[4/5] rounded-2xl"
                    />
                    <p className="mt-2 truncate font-semibold leading-tight">{x.name}</p>
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      <button type="button" onClick={() => swapTo(x)} className="h-10 rounded-full border border-ink/15 bg-chalk text-sm font-semibold hover:border-ink/40">
                        Swap
                      </button>
                      <button type="button" onClick={() => addDesign(x)} className="h-10 rounded-full bg-ink text-sm font-semibold text-chalk hover:bg-ink/85">
                        + Add
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        ) : null}
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
            {sizesLater && missingSizes ? (
              <>
                <strong>Arrives {cfg.delivery.production_days_min + cfg.delivery.standard_days_min}–{cfg.delivery.production_days_max + cfg.delivery.standard_days_max} working days after the last size is in.</strong>{" "}
                <span className="text-mute">
                  All in today? {formatDay(est.earliest)}
                  {est.latest > est.earliest ? `–${formatDay(est.latest)}` : ""}.
                </span>
              </>
            ) : (
              <>
                <strong>Estimated arrival:</strong> {formatDay(est.earliest)}
                {est.latest > est.earliest ? `–${formatDay(est.latest)}` : ""}
              </>
            )}
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

      {/* Mobile: keep the total and checkout in reach while browsing designs. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-chalk/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-lg font-semibold leading-tight tabular-nums">{gbp(pricing.totalPence)}</p>
            <p className="truncate text-xs text-mute">
              {shirts(pricing.itemCount)} · {pricing.shippingPence ? `${gbp(pricing.shippingPence)} delivery` : "free delivery"}
            </p>
          </div>
          <Link
            href="/checkout"
            aria-disabled={!quote?.ok}
            className={`btn-primary h-12 shrink-0 px-6 ${quote?.ok && !checking ? "" : "pointer-events-none opacity-50"}`}
          >
            Checkout →
          </Link>
        </div>
      </div>
    </div>
  );
}
