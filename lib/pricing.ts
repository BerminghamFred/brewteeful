/**
 * Pricing engine — the single source of truth for what a set costs.
 * Pure and deterministic: the builder uses it for display, /api/checkout uses it to
 * charge. The client never sends prices.
 */
import type {
  DiscountCode,
  FreeShippingConfig,
  Offer,
  QuantityDiscountConfig,
} from "@/lib/types";
import type { PricingSettings } from "@/lib/settings";

export type ShippingMethod = "standard" | "express";

export type PricingLine = {
  productId: string;
  unitPricePence: number;
};

export type PricingInput = {
  lines: PricingLine[];
  settings: PricingSettings;
  /** Only active + in-window offers; use `activeOffers()` to filter. */
  offers: Offer[];
  discount?: DiscountCode | null;
  shippingMethod?: ShippingMethod;
  /** Experiment override: replaces every line's unit price. */
  unitPriceOverridePence?: number | null;
  now?: Date;
};

export type AppliedDiscount = {
  source: "offer" | "code";
  id: string;
  label: string;
  amountPence: number;
};

export type PricingResult = {
  itemCount: number;
  unitPrices: number[];
  subtotalPence: number;
  discounts: AppliedDiscount[];
  discountPence: number;
  shippingMethod: ShippingMethod;
  shippingPence: number;
  freeShipping: boolean;
  freeShippingReason: string | null;
  totalPence: number;
  meetsMinimum: boolean;
  errors: string[];
  /** Next quantity threshold worth nudging toward ("Add 2 more for £10 off"). */
  nextThreshold: { itemsNeeded: number; label: string } | null;
  codeRejection: string | null;
};

export function isInWindow(
  item: { starts_at: string | null; ends_at: string | null },
  now: Date
) {
  if (item.starts_at && new Date(item.starts_at) > now) return false;
  if (item.ends_at && new Date(item.ends_at) < now) return false;
  return true;
}

export function activeOffers(offers: Offer[], now = new Date()): Offer[] {
  return offers
    .filter((o) => o.active && isInWindow(o, now))
    .sort((a, b) => b.priority - a.priority);
}

export function validateDiscountCode(
  code: DiscountCode | null | undefined,
  itemCount: number,
  now = new Date()
): string | null {
  if (!code) return "That code doesn't exist.";
  if (!code.active || !isInWindow(code, now)) return "That code has expired.";
  if (code.max_uses != null && code.uses_count >= code.max_uses)
    return "That code has been fully redeemed.";
  if (itemCount < code.min_items)
    return `That code needs at least ${code.min_items} shirts.`;
  return null;
}

function quantityDiscountAmount(cfg: QuantityDiscountConfig, subtotal: number) {
  if (cfg.amount_off_pence) return Math.min(cfg.amount_off_pence, subtotal);
  if (cfg.percent_off) return Math.round((subtotal * cfg.percent_off) / 100);
  return 0;
}

export function priceSet(input: PricingInput): PricingResult {
  const now = input.now ?? new Date();
  const settings = input.settings;
  const offers = activeOffers(input.offers, now);
  const errors: string[] = [];

  const unitPrices = input.lines.map((l) =>
    input.unitPriceOverridePence != null && input.unitPriceOverridePence > 0
      ? input.unitPriceOverridePence
      : l.unitPricePence
  );
  const itemCount = input.lines.length;
  const subtotalPence = unitPrices.reduce((a, b) => a + b, 0);
  const meetsMinimum = itemCount >= settings.min_group_size;
  if (!meetsMinimum)
    errors.push(`Minimum order is ${settings.min_group_size} shirts.`);
  if (itemCount > settings.max_group_size)
    errors.push(
      `For more than ${settings.max_group_size} shirts, get in touch and we'll sort a bulk price.`
    );

  const discounts: AppliedDiscount[] = [];

  // Best single quantity discount (they don't stack with each other).
  let best: { offer: Offer; amount: number; label: string } | null = null;
  for (const o of offers.filter((o) => o.kind === "quantity_discount")) {
    const cfg = o.config as QuantityDiscountConfig;
    if (itemCount < cfg.min_items) continue;
    const amount = quantityDiscountAmount(cfg, subtotalPence);
    if (amount > 0 && (!best || amount > best.amount))
      best = { offer: o, amount, label: cfg.label || o.name };
  }
  if (best)
    discounts.push({
      source: "offer",
      id: best.offer.id,
      label: best.label,
      amountPence: best.amount,
    });

  // Discount code applies after quantity discount.
  let codeRejection: string | null = null;
  let codeFreeShipping = false;
  if (input.discount !== undefined) {
    codeRejection = validateDiscountCode(input.discount, itemCount, now);
    const code = input.discount;
    if (!codeRejection && code) {
      const afterOffers =
        subtotalPence - discounts.reduce((a, d) => a + d.amountPence, 0);
      let amount = 0;
      if (code.kind === "percent")
        amount = Math.round((afterOffers * Math.min(code.value, 100)) / 100);
      else if (code.kind === "fixed") amount = Math.min(code.value, afterOffers);
      else codeFreeShipping = true;
      if (amount > 0)
        discounts.push({
          source: "code",
          id: code.id,
          label: code.code,
          amountPence: amount,
        });
    }
  }

  const discountPence = Math.min(
    subtotalPence,
    discounts.reduce((a, d) => a + d.amountPence, 0)
  );

  // Shipping
  const shippingMethod: ShippingMethod =
    input.shippingMethod === "express" && settings.express_enabled
      ? "express"
      : "standard";
  let freeShipping = false;
  let freeShippingReason: string | null = null;
  if (shippingMethod === "standard") {
    if (codeFreeShipping) {
      freeShipping = true;
      freeShippingReason = input.discount?.code ?? "Discount code";
    } else if (itemCount >= settings.free_shipping_min_items) {
      freeShipping = true;
      freeShippingReason = "Free UK delivery on sets";
    } else {
      for (const o of offers.filter((o) => o.kind === "free_shipping")) {
        const cfg = o.config as FreeShippingConfig;
        if (itemCount >= cfg.min_items) {
          freeShipping = true;
          freeShippingReason = cfg.label || o.name;
          break;
        }
      }
    }
  }
  const shippingPence =
    shippingMethod === "express"
      ? settings.express_shipping_pence
      : freeShipping
        ? 0
        : settings.standard_shipping_pence;

  // Nudge: smallest threshold above the current count that adds value.
  let nextThreshold: PricingResult["nextThreshold"] = null;
  const candidates: { min: number; label: string }[] = [];
  for (const o of offers) {
    if (o.kind === "quantity_discount") {
      const cfg = o.config as QuantityDiscountConfig;
      if (cfg.min_items > itemCount)
        candidates.push({ min: cfg.min_items, label: cfg.label || o.name });
    }
    if (o.kind === "free_shipping" && !freeShipping) {
      const cfg = o.config as FreeShippingConfig;
      if (cfg.min_items > itemCount)
        candidates.push({ min: cfg.min_items, label: cfg.label || o.name });
    }
  }
  if (!freeShipping && settings.free_shipping_min_items > itemCount)
    candidates.push({
      min: settings.free_shipping_min_items,
      label: "free UK delivery",
    });
  candidates.sort((a, b) => a.min - b.min);
  if (candidates[0])
    nextThreshold = {
      itemsNeeded: candidates[0].min - itemCount,
      label: candidates[0].label,
    };

  return {
    itemCount,
    unitPrices,
    subtotalPence,
    discounts,
    discountPence,
    shippingMethod,
    shippingPence,
    freeShipping,
    freeShippingReason,
    totalPence: subtotalPence - discountPence + shippingPence,
    meetsMinimum,
    errors,
    nextThreshold,
    codeRejection: input.discount === undefined ? null : codeRejection,
  };
}
