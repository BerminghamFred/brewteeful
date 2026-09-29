/**
 * A/B assignment. Deterministic: hash(visitorId:experimentKey) → bucket, so the
 * server page render, the checkout API and the webhook all agree without storing
 * assignments. Force a variant for QA with `?exp_<key>=<variant>` (sets a cookie).
 */
import type { Experiment, ExperimentVariable } from "@/lib/types";

/** FNV-1a 32-bit. */
export function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function assignVariant(visitorId: string, exp: Pick<Experiment, "key" | "variants">) {
  const variants = exp.variants.filter((v) => v.weight > 0);
  if (!variants.length) return null;
  const total = variants.reduce((a, v) => a + v.weight, 0);
  const bucket = (hash32(`${visitorId}:${exp.key}`) % 10_000) / 10_000;
  let cursor = 0;
  for (const v of variants) {
    cursor += v.weight / total;
    if (bucket < cursor) return v;
  }
  return variants[variants.length - 1]!;
}

export type ExperimentOverrides = {
  unit_price_pence?: number;
  headline?: string;
  subheadline?: string;
  cta?: string;
  hero_image_url?: string;
  free_shipping_min_items?: number;
  min_group_size?: number;
  /** Only these offer ids are active for this visitor (offer experiments). */
  offer_ids?: string[];
};

export type ExperimentContext = {
  /** experiment key → variant key */
  assignments: Record<string, string>;
  overrides: ExperimentOverrides;
};

const OVERRIDE_KEYS: Record<ExperimentVariable, (keyof ExperimentOverrides)[]> = {
  price: ["unit_price_pence"],
  headline: ["headline", "subheadline"],
  cta: ["cta"],
  hero_image: ["hero_image_url"],
  offer: ["offer_ids"],
  free_shipping: ["free_shipping_min_items"],
  min_group_size: ["min_group_size"],
};

export function resolveExperiments(
  running: Experiment[],
  visitorId: string | null,
  forced: Record<string, string> = {}
): ExperimentContext {
  const ctx: ExperimentContext = { assignments: {}, overrides: {} };
  if (!visitorId) return ctx;
  for (const exp of running) {
    if (exp.status !== "running") continue;
    const forcedVariant = exp.variants.find((v) => v.key === forced[exp.key]);
    const variant = forcedVariant ?? assignVariant(visitorId, exp);
    if (!variant) continue;
    ctx.assignments[exp.key] = variant.key;
    for (const k of OVERRIDE_KEYS[exp.variable] ?? []) {
      const val = variant.config[k];
      if (val !== undefined && val !== null && val !== "")
        (ctx.overrides as Record<string, unknown>)[k] = val;
    }
  }
  return ctx;
}
