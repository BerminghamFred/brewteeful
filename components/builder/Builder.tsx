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

  const sizeBtn = (active: boolean) =>
    `h-11 min-w-0 rounded-full px-0 text-[15px] font-medium transition ${active ? "bg-ink text-chalk shadow-soft" : "text-ink/70 hover:bg-ink/5 hover:text-ink"}`;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-40 pt-8 md:px-6 md:pt-14">
      <p className="eyebrow">Group builder</p>
      <h1 className="h-display mt-3 text-[2.75rem] md:text-6xl">Build your stag set.</h1>
      <p className="mt-3 text-[16px] text-ink/65">
        {gbp(pricing.unitPrices[0] ?? cfg.designs[0]?.pricePence ?? 2000)} a shirt · minimum {min} · everyone can pick a different design.
      </p>

      {/* Step 1: group size + date */}
      <section className="card mt-8 p-5 md:p-7">
        <StepTitle n={1} title="How many of you?" />
        <div className="mt-4 grid auto-cols-fr grid-flow-col gap-0.5 rounded-full bg-paper p-1">
          {quickSizes.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                setCustomSize(false);
                setSize(n);
              }}
              className={sizeBtn(people.length === n && !customSize)}
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
            className={`${sizeBtn(customSize)} whitespace-nowrap`}
            aria-pressed={customSize}
          >
            10+
          </button>
        </div>
        {customSize ? (
          <div className="mt-4 flex items-center gap-3">
            <button type="button" className="btn-ghost h-11 min-h-0 w-11 px-0 text-lg" onClick={() => setSize(people.length - 1)} aria-label="One fewer">−</button>
            <span className="w-10 text-center text-2xl font-semibold tabular-nums">{people.length}</span>
            <button type="button" className="btn-ghost h-11 min-h-0 w-11 px-0 text-lg" onClick={() => setSize(people.length + 1)} aria-label="One more">+</button>
            <span className="text-sm text-mute">Up to {max}. Bigger? <Link href="/contact" className="underline underline-offset-2">Get in touch</Link></span>
          </div>
        ) : null}

        <div className="mt-6 border-t border-ink/[0.07] pt-6">
          <label htmlFor="event-date" className="text-[15px] font-medium">
            When&apos;s the stag? <span className="font-normal text-mute">Optional — we&apos;ll check delivery</span>
          </label>
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
            className="mt-2 block h-12 w-full rounded-2xl border border-ink/10 bg-paper px-4 text-base outline-none transition focus:border-ink/40 focus:bg-chalk md:w-72"
          />
          {dateCheck ? (
            <p
              className={`mt-3 flex gap-2 rounded-2xl px-4 py-3 text-sm leading-snug ${
                dateCheck.status === "comfortable" ? "bg-pitch/[0.08] text-pitch" : dateCheck.status === "tight" ? "bg-sun text-ink" : "bg-flare/10 text-[#b3361a]"
              }`}
            >
              {dateCheck.status === "comfortable" &&
                `✓ Plenty of time — order today and it should arrive ${formatDay(dateCheck.estimate.earliest)}–${formatDay(dateCheck.estimate.latest)}.`}
              {dateCheck.status === "tight" &&
                `Tight but doable — estimated arrival ${formatDay(dateCheck.estimate.earliest)}–${formatDay(dateCheck.estimate.latest)}. Order today.`}
              {dateCheck.status === "too_late" && (
                <span>
                  Our standard timeline (arrives {formatDay(dateCheck.estimate.earliest)}–{formatDay(dateCheck.estimate.latest)}) won&apos;t make it.{" "}
                  <Link href="/contact" className="underline underline-offset-2">Message us</Link> before ordering and we&apos;ll tell you honestly if we can rush it.
                </span>
              )}
              {dateCheck.status === "past" && "That date's in the past — double-check it?"}
            </p>
          ) : null}
        </div>
      </section>

      {/* Step 2: lineup */}
      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StepTitle n={2} title="Give everyone a design & size" />
          <span className="text-sm text-mute">
            <span className="font-semibold text-ink">{readyCount}</span>/{people.length} ready
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" onClick={allDifferent} className="btn-ghost min-h-[40px] px-4 text-sm">
            Everyone different
          </button>
          <label className="btn-ghost min-h-[40px] cursor-pointer gap-1 px-4 text-sm">
            <span>Fill sizes</span>
            <select
              className="cursor-pointer bg-transparent font-semibold outline-none"
              value=""
              onChange={(e) => sizeForAll(e.target.value)}
              aria-label="Set a size for everyone without one"
            >
              <option value="">…</option>
              {cfg.sizes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <Link href="/size-guide" target="_blank" onClick={() => track("open_size_guide", { from: "builder" })} className="ml-1 text-sm text-ink/60 underline underline-offset-2 hover:text-ink">
            Size guide
          </Link>
        </div>

        <div className="mt-5 space-y-3">
          {people.map((p, i) => {
            const d = p.design ? bySlug.get(p.design) : null;
            const missing = highlight === i && (!p.design || !p.size);
            const done = Boolean(p.design && p.size);
            return (
              <div
                key={i}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className={`card p-4 transition md:p-5 ${missing ? "ring-2 ring-flare" : ""}`}
              >
                <div className="flex items-center gap-3.5">
                  <TeeArt
                    name={d?.name ?? " "}
                    color={d?.color ?? "#d9d6cf"}
                    imageUrl={d?.imageUrl}
                    label={false}
                    sizes="56px"
                    className="h-14 w-14 shrink-0 rounded-2xl"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-[12px] font-medium text-mute">
                      {i === 0 ? <span className="text-flare">★ The Stag</span> : `Person ${i + 1}`}
                      {done ? <span className="h-1.5 w-1.5 rounded-full bg-pitch" aria-label="ready" /> : null}
                    </p>
                    <p className="truncate text-[17px] font-semibold tracking-tight">
                      {d?.name ?? <span className="text-ink/40">Choose a design</span>}
                      {p.size ? <span className="ml-2 text-[15px] font-medium text-mute">{p.size}</span> : null}
                    </p>
                    <input
                      value={p.nickname}
                      maxLength={24}
                      onChange={(e) => store.updatePerson(i, { nickname: e.target.value })}
                      placeholder="Add a name (optional)"
                      aria-label={`Nickname for person ${i + 1}`}
                      className="mt-0.5 w-full bg-transparent text-base text-ink/80 placeholder:text-ink/35 focus:outline-none md:text-sm"
                    />
                  </div>
                </div>

                <div className="no-scrollbar -mx-4 mt-3 flex gap-2.5 overflow-x-auto px-4 pb-1 pt-1 md:-mx-5 md:px-5" role="radiogroup" aria-label={`Design for person ${i + 1}`}>
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
                        className="group relative shrink-0 text-center"
                        title={opt.name}
                      >
                        <TeeArt
                          name={opt.name}
                          color={opt.color}
                          imageUrl={opt.imageUrl}
                          label={false}
                          sizes="68px"
                          className={`h-[68px] w-[68px] rounded-2xl ring-offset-2 transition ${selected ? "ring-2 ring-ink" : "opacity-90 group-hover:opacity-100"}`}
                        />
                        <span className={`mt-1.5 block w-[68px] truncate text-[11px] ${selected ? "font-semibold text-ink" : "text-mute"}`}>{opt.name}</span>
                        {uses > 0 && !selected ? (
                          <span className="absolute right-1.5 top-2.5 h-2 w-2 rounded-full bg-ink/70 ring-2 ring-chalk" title={`Already used ×${uses}`} />
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5" role="radiogroup" aria-label={`Size for person ${i + 1}`}>
                  {(d?.sizes ?? cfg.sizes).map((s) => (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={p.size === s}
                      onClick={() => pickSize(i, s)}
                      className={`h-10 min-w-[48px] rounded-full px-3 text-sm font-medium transition ${
                        p.size === s ? "bg-ink text-chalk" : "bg-paper text-ink/70 hover:bg-ink/[0.07] hover:text-ink"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <button type="button" onClick={share} className="btn-ghost mt-5 w-full">
          {copied ? "Link copied ✓" : "Share lineup with the group"}
        </button>
        <p className="mt-2 text-center text-[13px] text-mute">Not sure of everyone&apos;s size? Send the link to the group chat and come back to pay.</p>
      </section>

      {/* Floating summary */}
      <div className="fixed inset-x-3 bottom-3 z-30" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
        <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-full bg-ink/95 py-2 pl-5 pr-2 text-chalk shadow-lift backdrop-blur md:pl-6">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold tabular-nums">
              {gbp(pricing.totalPence)}
              <span className="ml-1.5 font-normal text-chalk/60">· {people.length} shirts</span>
              {pricing.discountPence ? <span className="ml-1.5 text-[13px] font-medium text-[#8fe3b8]">−{gbp(pricing.discountPence)}</span> : null}
            </p>
            <p className="truncate text-[12px] text-chalk/55">
              {!pricing.meetsMinimum
                ? `Minimum ${min} shirts`
                : pricing.freeShipping
                  ? "Free UK delivery"
                  : `+ ${gbp(pricing.shippingPence)} delivery`}
              {pricing.nextThreshold && pricing.meetsMinimum ? ` · add ${pricing.nextThreshold.itemsNeeded} for ${pricing.nextThreshold.label}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={addToBasket}
            className={`btn min-h-[46px] shrink-0 px-5 text-sm ${complete && pricing.meetsMinimum ? "bg-flare text-chalk" : "bg-chalk/10 text-chalk/80"}`}
          >
            {complete ? "Review set →" : `${people.length - readyCount} to go`}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepTitle({ n, title }: { n: number; title: string }) {
  return (
    <h2 className="flex items-center gap-3 text-lg font-semibold tracking-tight">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[13px] font-semibold text-chalk">{n}</span>
      {title}
    </h2>
  );
}
