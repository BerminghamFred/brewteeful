"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { decodeLineup, encodeLineup, useSetStore, type Person } from "@/stores/set-store";
import { TeeArt } from "@/components/site/TeeArt";
import { gbp } from "@/lib/format";
import { checkEventDate, formatDay } from "@/lib/delivery";
import { track, type GaItem } from "@/lib/track";
import type { BuilderConfig, BuilderDesign } from "@/components/builder/types";
import { isComplete, useSetPricing } from "@/components/builder/useSetPricing";

export function Builder({ cfg }: { cfg: BuilderConfig }) {
  const router = useRouter();
  const sp = useSearchParams();
  const store = useSetStore();
  const { people, eventDate } = store;
  const [mounted, setMounted] = useState(false);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [customSize, setCustomSize] = useState(false);
  const [copied, setCopied] = useState(false);
  const completeFired = useRef(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const min = cfg.pricing.min_group_size;
  const max = cfg.pricing.max_group_size;
  const bySlug = useMemo(() => new Map(cfg.designs.map((d) => [d.slug, d])), [cfg.designs]);

  // Hydrate: shared link > existing set > ?design= prefill > fresh set of `min`.
  useEffect(() => {
    const s = useSetStore.getState();
    const shared = decodeLineup(new URLSearchParams(sp.toString()), new Set(bySlug.keys()), new Set(cfg.sizes), max);
    const prefill = sp.get("design");
    let source = "direct";
    if (shared) {
      s.replaceAll(shared.people, shared.eventDate);
      s.setInBasket(false);
      source = "shared_link";
    } else if (!s.people.length) {
      s.setGroupSize(min);
    }
    if (prefill && bySlug.has(prefill)) {
      const people = useSetStore.getState().people;
      if (!people.some((p) => p.design === prefill)) {
        const idx = people.findIndex((p, i) => !p.design && (i > 0 || prefill === cfg.stagSlug));
        if (idx >= 0) useSetStore.getState().updatePerson(idx, { design: prefill });
      }
      source = "design_page";
    }
    if (useSetStore.getState().people.length > 10) setCustomSize(true);
    setMounted(true);
    try {
      if (!sessionStorage.getItem("stg_builder_started")) {
        sessionStorage.setItem("stg_builder_started", "1");
        track("start_group_builder", { source, prefilled_design: prefill ?? null });
      }
    } catch {
      track("start_group_builder", { source });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pricing = useSetPricing(cfg, people);
  const complete = isComplete(people);
  const readyCount = people.filter((p) => p.design && p.size).length;
  const distinct = new Set(people.map((p) => p.design).filter(Boolean)).size;

  const items: GaItem[] = useMemo(() => {
    const grouped = new Map<string, GaItem>();
    people.forEach((p, i) => {
      if (!p.design || !p.size) return;
      const d = bySlug.get(p.design)!;
      const key = `${p.design}:${p.size}`;
      const g = grouped.get(key) ?? { item_id: d.slug, item_name: d.name, item_variant: p.size, price: pricing.unitPrices[i]! / 100, quantity: 0 };
      g.quantity++;
      grouped.set(key, g);
    });
    return [...grouped.values()];
  }, [people, bySlug, pricing.unitPrices]);

  useEffect(() => {
    if (!mounted) return;
    if (complete && !completeFired.current) {
      completeFired.current = true;
      track("complete_group_builder", { group_size: people.length, distinct_designs: distinct }, { value: pricing.totalPence / 100, items });
    }
    if (!complete) completeFired.current = false;
  }, [complete, mounted, people.length, distinct, pricing.totalPence, items]);

  const dateCheck = useMemo(() => {
    if (!eventDate) return null;
    const [y, m, d] = eventDate.split("-").map(Number);
    return checkEventDate(cfg.delivery, new Date(y!, m! - 1, d!));
  }, [eventDate, cfg.delivery]);

  function setSize(n: number) {
    // Record attempts below the minimum: it tells us whether min group size is costing orders.
    const clamped = Math.max(min, Math.min(max, n));
    store.setGroupSize(clamped);
    store.setInBasket(false);
    track("select_group_size", { group_size: clamped, attempted: n, below_min_attempt: n < min });
  }

  function pickDesign(i: number, d: BuilderDesign) {
    store.updatePerson(i, { design: d.slug });
    store.setInBasket(false);
    track("select_design", { position: i + 1, item_id: d.slug });
  }

  function pickSize(i: number, size: string) {
    store.updatePerson(i, { size });
    store.setInBasket(false);
    track("select_size", { position: i + 1, size });
  }

  function allDifferent() {
    const order = [
      ...(cfg.stagSlug ? [cfg.stagSlug] : []),
      ...cfg.designs.map((d) => d.slug).filter((s) => s !== cfg.stagSlug),
    ];
    const rest = order.slice(cfg.stagSlug ? 1 : 0);
    const next: Person[] = people.map((p, i) => ({
      ...p,
      design: i === 0 && cfg.stagSlug ? cfg.stagSlug : rest[(i - (cfg.stagSlug ? 1 : 0)) % rest.length] ?? p.design,
    }));
    store.replaceAll(next);
    store.setInBasket(false);
    track("select_design", { position: "all", method: "all_different" });
  }

  function sizeForAll(size: string) {
    if (!size) return;
    store.replaceAll(people.map((p) => ({ ...p, size: p.size ?? size })));
    store.setInBasket(false);
    track("select_size", { position: "all_unset", size });
  }

  async function share() {
    const url = `${window.location.origin}/build?${encodeLineup(people, eventDate)}`;
    track("share_builder", { group_size: people.length, ready: readyCount });
    const text = "Stag shirts — pick your design and check your size:";
    try {
      if (navigator.share) {
        await navigator.share({ title: "Our stag lineup", text, url });
        return;
      }
    } catch {
      /* cancelled — fall through to copy */
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  function addToBasket() {
    if (!complete || !pricing.meetsMinimum) {
      const idx = people.findIndex((p) => !p.design || !p.size);
      if (idx >= 0) {
        setHighlight(idx);
        cardRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    store.setInBasket(true);
    track("add_to_cart", { group_size: people.length, distinct_designs: distinct }, { value: pricing.totalPence / 100, items });
    router.push("/basket");
  }

  if (!mounted) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-mute">Loading your set…</div>;
  }

  const quickSizes = Array.from({ length: Math.max(0, Math.min(10, max) - min + 1) }, (_, i) => min + i);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-40 pt-6 md:pt-10">
      <h1 className="h-display text-5xl md:text-6xl">Build your stag set</h1>
      <p className="mt-2 text-ink/80">
        {gbp(pricing.unitPrices[0] ?? cfg.designs[0]?.pricePence ?? 2000)} a shirt · minimum {min} · everyone can pick a different design.
      </p>

      {/* Step 1: group size */}
      <section className="mt-6">
        <h2 className="eyebrow">1 · How many of you?</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {quickSizes.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                setCustomSize(false);
                setSize(n);
              }}
              className={`h-12 w-12 rounded-xl border-2 border-ink text-lg font-extrabold ${
                people.length === n && !customSize ? "bg-ink text-paper" : "bg-chalk"
              }`}
              aria-pressed={people.length === n && !customSize}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setCustomSize(true);
              if (people.length <= 10) setSize(11);
            }}
            className={`h-12 rounded-xl border-2 border-ink px-4 text-lg font-extrabold ${customSize ? "bg-ink text-paper" : "bg-chalk"}`}
            aria-pressed={customSize}
          >
            10+
          </button>
        </div>
        {customSize ? (
          <div className="mt-3 flex items-center gap-3">
            <button type="button" className="btn-ghost h-11 min-h-0 w-11 px-0" onClick={() => setSize(people.length - 1)} aria-label="One fewer">−</button>
            <span className="w-12 text-center text-2xl font-extrabold">{people.length}</span>
            <button type="button" className="btn-ghost h-11 min-h-0 w-11 px-0" onClick={() => setSize(people.length + 1)} aria-label="One more">+</button>
            <span className="text-sm text-mute">Up to {max}. Bigger group? <Link href="/contact" className="underline">Get in touch</Link>.</span>
          </div>
        ) : null}
      </section>

      {/* Stag date */}
      <section className="mt-6">
        <label htmlFor="event-date" className="eyebrow">When&apos;s the stag? <span className="font-bold normal-case tracking-normal text-mute">(optional — we&apos;ll check delivery)</span></label>
        <input
          id="event-date"
          type="date"
          value={eventDate ?? ""}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(e) => {
            const v = e.target.value || null;
            store.setEventDate(v);
            if (v) {
              const [y, m, d] = v.split("-").map(Number);
              const c = checkEventDate(cfg.delivery, new Date(y!, m! - 1, d!));
              track("set_event_date", { days_until: c.daysUntil, status: c.status });
            }
          }}
          className="mt-2 block h-12 w-full rounded-xl border-2 border-ink bg-chalk px-3 text-base md:w-64"
        />
        {dateCheck ? (
          <p
            className={`mt-2 rounded-xl border-2 border-ink p-3 text-sm font-bold ${
              dateCheck.status === "comfortable" ? "bg-pitch text-chalk" : dateCheck.status === "tight" ? "bg-sun" : "bg-flare"
            }`}
          >
            {dateCheck.status === "comfortable" &&
              `✓ Plenty of time — order today and it should arrive ${formatDay(dateCheck.estimate.earliest)}–${formatDay(dateCheck.estimate.latest)}.`}
            {dateCheck.status === "tight" &&
              `Tight but doable — estimated arrival ${formatDay(dateCheck.estimate.earliest)}–${formatDay(dateCheck.estimate.latest)}. Order today.`}
            {dateCheck.status === "too_late" && (
              <>
                Our standard timeline (arrives {formatDay(dateCheck.estimate.earliest)}–{formatDay(dateCheck.estimate.latest)}) won&apos;t make it.{" "}
                <Link href="/contact" className="underline">Message us</Link> before ordering and we&apos;ll tell you honestly if we can rush it.
              </>
            )}
            {dateCheck.status === "past" && "That date's in the past — double-check it?"}
          </p>
        ) : null}
      </section>

      {/* Step 2: lineup */}
      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="eyebrow">2 · Give everyone a design &amp; size</h2>
          <span className="text-sm font-bold">{readyCount}/{people.length} ready</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={allDifferent} className="btn-ghost min-h-[40px] px-4 text-sm">
            🎲 Everyone different
          </button>
          <label className="btn-ghost min-h-[40px] cursor-pointer px-4 text-sm">
            <span>Unset sizes →</span>
            <select
              className="bg-transparent font-extrabold"
              value=""
              onChange={(e) => sizeForAll(e.target.value)}
              aria-label="Set a size for everyone without one"
            >
              <option value="">pick</option>
              {cfg.sizes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <Link href="/size-guide" target="_blank" onClick={() => track("open_size_guide", { from: "builder" })} className="self-center text-sm font-bold underline">
            Size guide
          </Link>
        </div>

        <div className="mt-4 space-y-3">
          {people.map((p, i) => {
            const d = p.design ? bySlug.get(p.design) : null;
            const missing = highlight === i && (!p.design || !p.size);
            return (
              <div
                key={i}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className={`card p-3 md:p-4 ${missing ? "ring-4 ring-flare" : ""} ${p.design && p.size ? "" : "border-dashed"}`}
              >
                <div className="flex items-center gap-3">
                  <TeeArt
                    name={d?.name ?? "Pick a design"}
                    color={d?.color ?? "#e5ded2"}
                    imageUrl={d?.imageUrl}
                    label={false}
                    sizes="64px"
                    className="h-16 w-16 shrink-0 rounded-xl border-2 border-ink"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold uppercase text-mute">
                      {i === 0 ? "★ The Stag" : `Lad ${i + 1}`}
                    </p>
                    <p className="truncate text-lg font-extrabold leading-tight">{d?.name ?? "Choose a design"}</p>
                    <input
                      value={p.nickname}
                      maxLength={24}
                      onChange={(e) => store.updatePerson(i, { nickname: e.target.value })}
                      placeholder="Name / nickname (optional)"
                      aria-label={`Nickname for person ${i + 1}`}
                      className="mt-1 w-full border-b border-ink/20 bg-transparent text-base placeholder:text-mute/70 focus:border-ink focus:outline-none md:text-sm"
                    />
                  </div>
                </div>

                <div className="no-scrollbar -mx-3 mt-3 flex gap-2 overflow-x-auto px-3 pb-1 md:-mx-4 md:px-4" role="radiogroup" aria-label={`Design for person ${i + 1}`}>
                  {cfg.designs.map((opt) => {
                    const selected = p.design === opt.slug;
                    const uses = people.filter((x) => x.design === opt.slug).length;
                    return (
                      <button
                        key={opt.slug}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => pickDesign(i, opt)}
                        className="relative shrink-0 text-center"
                        title={opt.name}
                      >
                        <TeeArt
                          name={opt.name}
                          color={opt.color}
                          imageUrl={opt.imageUrl}
                          label={false}
                          sizes="72px"
                          className={`h-[72px] w-[72px] rounded-xl border-2 ${selected ? "border-ink ring-4 ring-flare" : "border-ink/30"}`}
                        />
                        <span className="mt-1 block w-[72px] truncate text-[10px] font-bold uppercase">{opt.name}</span>
                        {uses > 0 && !selected ? (
                          <span className="absolute right-1 top-1 rounded-full bg-ink px-1.5 text-[10px] font-bold text-paper">×{uses}</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label={`Size for person ${i + 1}`}>
                  {(d?.sizes ?? cfg.sizes).map((s) => (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={p.size === s}
                      onClick={() => pickSize(i, s)}
                      className={`h-10 min-w-[48px] rounded-lg border-2 border-ink px-2 text-sm font-extrabold ${p.size === s ? "bg-ink text-paper" : "bg-paper"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <button type="button" onClick={share} className="btn-ghost mt-4 w-full">
          {copied ? "Link copied ✓" : "Share lineup with the group"}
        </button>
        <p className="mt-2 text-center text-xs text-mute">Not sure of everyone&apos;s size? Send the link to the group chat and come back to pay.</p>
      </section>

      {/* Sticky summary */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-ink bg-paper pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold">
              {people.length} shirts · {gbp(pricing.totalPence)}
              {pricing.discountPence ? <span className="ml-1 text-pitch">(−{gbp(pricing.discountPence)})</span> : null}
            </p>
            <p className="truncate text-xs text-mute">
              {!pricing.meetsMinimum
                ? `Minimum ${min} shirts`
                : pricing.freeShipping
                  ? "Free UK delivery"
                  : `+ ${gbp(pricing.shippingPence)} delivery`}
              {pricing.nextThreshold && pricing.meetsMinimum ? ` · add ${pricing.nextThreshold.itemsNeeded} for ${pricing.nextThreshold.label}` : ""}
            </p>
          </div>
          <button type="button" onClick={addToBasket} className={`btn-primary min-h-[48px] px-5 text-sm ${complete && pricing.meetsMinimum ? "" : "opacity-60"}`}>
            {complete ? "Review set →" : `${people.length - readyCount} to go`}
          </button>
        </div>
      </div>
    </div>
  );
}
