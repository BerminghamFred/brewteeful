/**
 * Server-side quote + order draft. Shared by /api/quote (basket) and /api/checkout.
 * Everything the customer pays is decided here from DB prices, never from the client.
 */
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/supabase/public";
import { getCatalogue, getSettingsWithEconomics, type StorefrontContext } from "@/lib/store";
import { priceSet, type PricingResult, type ShippingMethod } from "@/lib/pricing";
import { estimateFulfilmentCost } from "@/lib/economics";
import type { DiscountCode, ProductWithRelations } from "@/lib/types";

export type CheckoutInput = {
  people: { design: string; size: string; nickname?: string }[];
  eventDate?: string | null;
  discountCode?: string | null;
  shippingMethod?: ShippingMethod;
};

export type DraftLine = {
  position: number;
  is_stag: boolean;
  nickname: string | null;
  product: ProductWithRelations;
  variantId: string | null;
  sku: string | null;
  size: string;
  unitPricePence: number;
  unitCostPence: number;
};

export type Quote = {
  ok: boolean;
  errors: string[];
  pricing: PricingResult;
  lines: DraftLine[];
  discount: DiscountCode | null;
  eventDate: string | null;
};

export function parseCheckoutInput(raw: unknown): CheckoutInput | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.people) || r.people.length > 100) return null;
  const people = r.people.map((p) => {
    const x = (p ?? {}) as Record<string, unknown>;
    return {
      design: typeof x.design === "string" ? x.design.slice(0, 80) : "",
      size: typeof x.size === "string" ? x.size.slice(0, 8) : "",
      nickname: typeof x.nickname === "string" ? x.nickname.trim().slice(0, 24) : "",
    };
  });
  const eventDate = typeof r.eventDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.eventDate) ? r.eventDate : null;
  const discountCode =
    typeof r.discountCode === "string" && r.discountCode.trim() ? r.discountCode.trim().toUpperCase().slice(0, 40) : null;
  const shippingMethod: ShippingMethod = r.shippingMethod === "express" ? "express" : "standard";
  return { people, eventDate, discountCode, shippingMethod };
}

/** Products with real costs (service role) or the public catalogue as a fallback. */
async function loadProducts(): Promise<ProductWithRelations[]> {
  if (!hasServiceRole()) return (await getCatalogue()).products;
  const { data, error } = await createAdminClient()
    .from("products")
    .select("*, images:product_images(*), variants:product_variants(*)")
    .eq("status", "active");
  if (error) throw error;
  return (data ?? []) as ProductWithRelations[];
}

async function loadDiscount(code: string | null | undefined): Promise<DiscountCode | null | undefined> {
  if (!code) return undefined; // no code entered
  if (!hasServiceRole()) return null;
  const { data } = await createAdminClient().from("discount_codes").select("*").eq("code", code).maybeSingle();
  return (data as DiscountCode | null) ?? null;
}

export async function buildQuote(input: CheckoutInput, ctx: StorefrontContext): Promise<Quote> {
  const [products, discount] = await Promise.all([loadProducts(), loadDiscount(input.discountCode)]);
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const errors: string[] = [];
  const lines: DraftLine[] = [];

  input.people.forEach((person, i) => {
    const product = bySlug.get(person.design);
    if (!product) {
      errors.push(`Person ${i + 1}: that design is no longer available.`);
      return;
    }
    const variant = product.variants.find((v) => v.size === person.size && v.active);
    if (!variant) {
      errors.push(`Person ${i + 1}: ${product.name} isn't available in ${person.size || "that size"}.`);
      return;
    }
    if (variant.stock != null && variant.stock <= 0) {
      errors.push(`Person ${i + 1}: ${product.name} in ${person.size} is out of stock.`);
      return;
    }
    lines.push({
      position: i + 1,
      is_stag: i === 0,
      nickname: person.nickname || null,
      product,
      variantId: variant.id.startsWith("fallback-") ? null : variant.id,
      sku: variant.sku,
      size: variant.size,
      unitPricePence: product.price_pence,
      unitCostPence: variant.cost_pence ?? product.cost_pence ?? 0,
    });
  });

  const pricing = priceSet({
    lines: lines.map((l) => ({ productId: l.product.id, unitPricePence: l.unitPricePence })),
    settings: ctx.settings.pricing,
    offers: ctx.offers,
    discount,
    shippingMethod: input.shippingMethod,
    unitPriceOverridePence: ctx.experiments.overrides.unit_price_pence ?? null,
  });
  lines.forEach((l, i) => (l.unitPricePence = pricing.unitPrices[i]!));
  errors.push(...pricing.errors);

  return {
    ok: errors.length === 0 && lines.length > 0,
    errors,
    pricing,
    lines,
    discount: discount && !pricing.codeRejection ? discount : null,
    eventDate: input.eventDate ?? null,
  };
}

/** Public-safe view of a quote for the basket (no costs). */
export function publicQuote(q: Quote) {
  return {
    ok: q.ok,
    errors: q.errors,
    pricing: q.pricing,
    lines: q.lines.map((l) => ({
      position: l.position,
      name: l.product.name,
      slug: l.product.slug,
      size: l.size,
      nickname: l.nickname,
      unitPricePence: l.unitPricePence,
    })),
  };
}

export async function orderCostSnapshot(q: Quote) {
  const settings = await getSettingsWithEconomics();
  return {
    cogsPence: q.lines.reduce((a, l) => a + l.unitCostPence, 0),
    fulfilmentCostPence: estimateFulfilmentCost(q.lines.length, settings.economics, q.pricing.shippingMethod),
  };
}
