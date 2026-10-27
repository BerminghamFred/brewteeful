/**
 * Admin reporting. Aggregation is done in TS over per-session rows from the
 * `session_funnel` view — plenty fast at validation-stage volumes, and any dimension
 * can be sliced without new SQL.
 */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { mergeSettings, type SiteSettings } from "@/lib/settings";
import { orderEconomics, summarise, type BusinessSummary } from "@/lib/economics";
import type { AdSpendRow, Order } from "@/lib/types";
import { FUNNEL_STEPS } from "@/lib/events";

export type SessionRow = {
  session_id: string;
  visitor_id: string;
  started_at: string;
  landing_page: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  has_click_id: boolean;
  device: string | null;
  experiments: Record<string, string>;
  started_builder: boolean | null;
  completed_builder: boolean | null;
  added_to_cart: boolean | null;
  began_checkout: boolean | null;
  purchased: boolean | null;
};

export type Range = { from: Date; to: Date };

export function parseRange(sp: { from?: string; to?: string }): Range {
  const to = sp.to ? new Date(sp.to + "T23:59:59") : new Date();
  const from = sp.from ? new Date(sp.from + "T00:00:00") : new Date(to.getTime() - 29 * 86_400_000);
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

export const ymd = (d: Date) => d.toISOString().slice(0, 10);

async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const out: T[] = [];
  const page = 1000;
  for (let i = 0; i < 100; i++) {
    const { data, error } = await build(i * page, i * page + page - 1);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < page) break;
  }
  return out;
}

export async function loadReportData(db: SupabaseClient, range: Range) {
  const [sessions, orders, spend, settingsRows] = await Promise.all([
    fetchAll<SessionRow>((a, b) =>
      db.from("session_funnel").select("*").gte("started_at", range.from.toISOString()).lte("started_at", range.to.toISOString()).order("started_at").range(a, b)
    ),
    fetchAll<Order>((a, b) =>
      db
        .from("orders")
        .select("*")
        .in("status", ["paid", "partially_refunded", "refunded"])
        .gte("paid_at", range.from.toISOString())
        .lte("paid_at", range.to.toISOString())
        .order("paid_at")
        .range(a, b)
    ),
    fetchAll<AdSpendRow>((a, b) => db.from("ad_spend").select("*").gte("date", ymd(range.from)).lte("date", ymd(range.to)).range(a, b)),
    db.from("site_settings").select("key, value"),
  ]);
  const settings: SiteSettings = mergeSettings(settingsRows.data);
  return { sessions, orders, spend, settings };
}

export type FunnelStep = { key: string; label: string; count: number; stepRate: number | null; overallRate: number | null };

export function funnel(sessions: SessionRow[]): { steps: FunnelStep[]; biggestDrop: string | null } {
  const counts: Record<string, number> = {
    sessions: sessions.length,
    started_builder: sessions.filter((s) => s.started_builder).length,
    completed_builder: sessions.filter((s) => s.completed_builder).length,
    added_to_cart: sessions.filter((s) => s.added_to_cart).length,
    began_checkout: sessions.filter((s) => s.began_checkout).length,
    purchased: sessions.filter((s) => s.purchased).length,
  };
  let prev: number | null = null;
  let biggest: { key: string; loss: number } | null = null;
  const steps = FUNNEL_STEPS.map((s) => {
    const count = counts[s.key] ?? 0;
    const stepRate = prev == null ? null : prev ? count / prev : 0;
    if (prev != null && prev > 0) {
      const loss = 1 - count / prev;
      if (!biggest || loss > biggest.loss) biggest = { key: s.key, loss };
    }
    prev = count;
    return { key: s.key, label: s.label, count, stepRate, overallRate: counts.sessions ? count / counts.sessions : null };
  });
  return { steps, biggestDrop: (biggest as { key: string } | null)?.key ?? null };
}

export function businessSummary(data: Awaited<ReturnType<typeof loadReportData>>): BusinessSummary {
  const spend = data.spend.reduce((a, s) => a + s.spend_pence, 0);
  return summarise(data.orders, data.sessions.length, spend, data.settings.economics);
}

export const DIMENSIONS = {
  utm_campaign: "Campaign",
  utm_content: "Ad group (utm_content)",
  utm_term: "Keyword (utm_term)",
  utm_source: "Source",
  device: "Device",
  landing_page: "Landing page",
} as const;
export type Dimension = keyof typeof DIMENSIONS;

export type BreakdownRow = {
  key: string;
  sessions: number;
  started: number;
  configured: number;
  carts: number;
  checkouts: number;
  orders: number;
  units: number;
  revenuePence: number;
  contributionPence: number;
  spendPence: number | null;
};

function dimValue(row: { [k: string]: unknown }, dim: Dimension): string {
  const v = row[dim];
  if (dim === "landing_page" && typeof v === "string") return v.split("?")[0] || "/";
  return (typeof v === "string" && v) || "(none)";
}

/** Sessions + orders sliced by one dimension. Orders use their own stored attribution. */
export function breakdown(data: Awaited<ReturnType<typeof loadReportData>>, dim: Dimension): BreakdownRow[] {
  const rows = new Map<string, BreakdownRow>();
  const get = (key: string) => {
    let r = rows.get(key);
    if (!r) {
      r = { key, sessions: 0, started: 0, configured: 0, carts: 0, checkouts: 0, orders: 0, units: 0, revenuePence: 0, contributionPence: 0, spendPence: null };
      rows.set(key, r);
    }
    return r;
  };
  for (const s of data.sessions) {
    const r = get(dimValue(s, dim));
    r.sessions++;
    if (s.started_builder) r.started++;
    if (s.completed_builder) r.configured++;
    if (s.added_to_cart) r.carts++;
    if (s.began_checkout) r.checkouts++;
  }
  for (const o of data.orders) {
    const r = get(dimValue({ ...(o.attribution ?? {}) }, dim));
    r.orders++;
    r.units += o.item_count;
    const e = orderEconomics(o, data.settings.economics);
    r.revenuePence += e.revenuePence;
    r.contributionPence += e.contributionPence;
  }
  // Ad spend joins on campaign / ad group / keyword when those were recorded.
  const spendKey: Partial<Record<Dimension, keyof AdSpendRow>> = { utm_campaign: "campaign", utm_content: "ad_group", utm_term: "keyword" };
  const sk = spendKey[dim];
  if (sk) {
    for (const s of data.spend) {
      const k = (s[sk] as string | null) || "(none)";
      const r = get(k);
      r.spendPence = (r.spendPence ?? 0) + s.spend_pence;
    }
  }
  return [...rows.values()].sort((a, b) => b.sessions - a.sessions || b.orders - a.orders);
}

export function productPerformance(db: SupabaseClient, orderIds: string[]) {
  if (!orderIds.length) return Promise.resolve([] as { product_name: string; units: number; revenuePence: number }[]);
  return db
    .from("order_items")
    .select("product_name, unit_price_pence, order_id")
    .in("order_id", orderIds.slice(0, 1000))
    .then(({ data }) => {
      const m = new Map<string, { product_name: string; units: number; revenuePence: number }>();
      for (const i of data ?? []) {
        const r = m.get(i.product_name) ?? { product_name: i.product_name, units: 0, revenuePence: 0 };
        r.units++;
        r.revenuePence += i.unit_price_pence;
        m.set(i.product_name, r);
      }
      return [...m.values()].sort((a, b) => b.units - a.units);
    });
}

/** Per-variant experiment results; primary metric is contribution per visitor. */
export function experimentResults(
  data: Awaited<ReturnType<typeof loadReportData>>,
  key: string,
  variants: { key: string; name: string }[]
) {
  return variants.map((v) => {
    const sessions = data.sessions.filter((s) => s.experiments?.[key] === v.key);
    const visitors = new Set(sessions.map((s) => s.visitor_id)).size;
    const orders = data.orders.filter((o) => o.experiments?.[key] === v.key);
    const summary = summarise(orders, sessions.length, 0, data.settings.economics);
    const f = funnel(sessions).steps;
    const rate = (k: string) => (sessions.length ? (f.find((x) => x.key === k)?.count ?? 0) / sessions.length : 0);
    return {
      ...v,
      sessions: sessions.length,
      visitors,
      builderRate: rate("started_builder"),
      cartRate: rate("added_to_cart"),
      checkoutRate: rate("began_checkout"),
      orders: summary.orders,
      conversionRate: summary.conversionRate,
      aovPence: summary.aovPence,
      revenuePerVisitorPence: sessions.length ? Math.round(summary.revenuePence / sessions.length) : 0,
      contributionPerVisitorPence: sessions.length ? Math.round(summary.contributionBeforeAdsPence / sessions.length) : 0,
    };
  });
}
