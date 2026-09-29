/**
 * Server-side storefront data. Public reads are cached (tag "storefront") and
 * revalidated from admin actions via revalidateTag("storefront").
 */
import "server-only";
import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { cache } from "react";
import { publicClient, hasServiceRole } from "@/lib/supabase/public";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  FALLBACK_COLLECTION,
  FALLBACK_FAQS,
  FALLBACK_PRODUCTS,
} from "@/lib/catalogue-fallback";
import { DEFAULT_SETTINGS, mergeSettings, type SiteSettings } from "@/lib/settings";
import { resolveExperiments, type ExperimentContext } from "@/lib/ab";
import { activeOffers } from "@/lib/pricing";
import type {
  Collection,
  Experiment,
  Faq,
  Offer,
  ProductWithRelations,
  Review,
} from "@/lib/types";
import { COOKIES } from "@/lib/cookies";

export const STOREFRONT_TAG = "storefront";
const REVALIDATE = 300;

// Anon can't read cost columns (see migration); costs come from the service role at checkout.
export const PUBLIC_PRODUCT_COLS =
  "id, slug, name, collection_id, tagline, description, price_pence, compare_at_price_pence, status, sort_order, hero_image_url, accent_color, seo_title, seo_description, created_at, updated_at";
const PUBLIC_VARIANT_COLS = "id, product_id, size, sku, active, stock";

function sortRelations(p: ProductWithRelations): ProductWithRelations {
  return {
    ...p,
    cost_pence: p.cost_pence ?? 0,
    images: [...(p.images ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    variants: [...(p.variants ?? [])].filter((v) => v.active),
  };
}

export const getCatalogue = unstable_cache(
  async (): Promise<{ collections: Collection[]; products: ProductWithRelations[] }> => {
    const sb = publicClient();
    if (!sb) return { collections: [FALLBACK_COLLECTION], products: FALLBACK_PRODUCTS };
    const [cols, prods] = await Promise.all([
      sb.from("collections").select("*").order("sort_order"),
      sb
        .from("products")
        .select(`${PUBLIC_PRODUCT_COLS}, images:product_images(*), variants:product_variants(${PUBLIC_VARIANT_COLS})`)
        .eq("status", "active")
        .order("sort_order"),
    ]);
    if (prods.error) {
      console.error("catalogue", prods.error);
      return { collections: [FALLBACK_COLLECTION], products: FALLBACK_PRODUCTS };
    }
    return {
      collections: (cols.data ?? []) as Collection[],
      products: ((prods.data ?? []) as ProductWithRelations[]).map(sortRelations),
    };
  },
  ["catalogue"],
  { tags: [STOREFRONT_TAG], revalidate: REVALIDATE }
);

export async function getProductBySlug(slug: string) {
  const { products } = await getCatalogue();
  return products.find((p) => p.slug === slug) ?? null;
}

/** Public settings (everything except economics, which RLS hides from anon). */
export const getSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    const sb = publicClient();
    if (!sb) return DEFAULT_SETTINGS;
    const { data, error } = await sb.from("site_settings").select("key, value");
    if (error) console.error("settings", error);
    return mergeSettings(data);
  },
  ["settings"],
  { tags: [STOREFRONT_TAG], revalidate: REVALIDATE }
);

/** Full settings incl. economics — server-only via service role. */
export async function getSettingsWithEconomics(): Promise<SiteSettings> {
  if (!hasServiceRole()) return DEFAULT_SETTINGS;
  const { data } = await createAdminClient().from("site_settings").select("key, value");
  return mergeSettings(data);
}

export const getOffers = unstable_cache(
  async (): Promise<Offer[]> => {
    const sb = publicClient();
    if (!sb) return [];
    const { data } = await sb.from("offers").select("*").eq("active", true);
    return (data ?? []) as Offer[];
  },
  ["offers"],
  { tags: [STOREFRONT_TAG], revalidate: REVALIDATE }
);

export const getFaqs = unstable_cache(
  async (): Promise<Faq[]> => {
    const sb = publicClient();
    if (!sb) return FALLBACK_FAQS;
    const { data } = await sb.from("faqs").select("*").eq("active", true).order("sort_order");
    return (data ?? []) as Faq[];
  },
  ["faqs"],
  { tags: [STOREFRONT_TAG], revalidate: REVALIDATE }
);

export const getApprovedReviews = unstable_cache(
  async (): Promise<Review[]> => {
    const sb = publicClient();
    if (!sb) return [];
    const { data } = await sb
      .from("reviews")
      .select("*")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(12);
    return (data ?? []) as Review[];
  },
  ["reviews"],
  { tags: [STOREFRONT_TAG], revalidate: REVALIDATE }
);

export const getRunningExperiments = unstable_cache(
  async (): Promise<Experiment[]> => {
    const sb = publicClient();
    if (!sb) return [];
    const { data } = await sb.from("experiments").select("*").eq("status", "running");
    return (data ?? []) as Experiment[];
  },
  ["experiments"],
  { tags: [STOREFRONT_TAG], revalidate: 60 }
);

/** Forced variants for QA: cookie `stg_force` = "key:variant,key2:variant". */
export function parseForced(raw: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of (raw ?? "").split(",")) {
    const [k, v] = pair.split(":");
    if (k && v) out[k] = v;
  }
  return out;
}

export type StorefrontContext = {
  settings: SiteSettings;
  offers: Offer[];
  experiments: ExperimentContext;
  visitorId: string | null;
};

/**
 * Settings + offers with this visitor's experiment overrides applied.
 * Used by pages *and* /api/checkout so displayed and charged prices always agree.
 */
export async function resolveStorefront(visitorId: string | null, forced: Record<string, string>) {
  const [settings, offers, running] = await Promise.all([
    getSettings(),
    getOffers(),
    getRunningExperiments(),
  ]);
  const experiments = resolveExperiments(running, visitorId, forced);
  const o = experiments.overrides;
  const s: SiteSettings = structuredClone(settings);
  if (o.headline) s.content.hero_headline = o.headline;
  if (o.subheadline) s.content.hero_subheadline = o.subheadline;
  if (o.cta) s.content.hero_cta = o.cta;
  if (o.hero_image_url) s.content.hero_image_url = o.hero_image_url;
  if (o.free_shipping_min_items != null)
    s.pricing.free_shipping_min_items = Number(o.free_shipping_min_items);
  if (o.min_group_size != null) s.pricing.min_group_size = Number(o.min_group_size);
  let live = activeOffers(offers);
  if (o.offer_ids) {
    // Offer experiments: only offers listed by the variant are live; others in the
    // experiment's pool stay off. Offers not mentioned by any variant are unaffected.
    const pool = new Set(
      running
        .filter((e) => e.variable === "offer")
        .flatMap((e) => e.variants.flatMap((v) => (v.config.offer_ids as string[]) ?? []))
    );
    live = live.filter((x) => !pool.has(x.id) || o.offer_ids!.includes(x.id));
  }
  return { settings: s, offers: live, experiments, visitorId } satisfies StorefrontContext;
}

export const getStorefrontContext = cache(async (): Promise<StorefrontContext> => {
  const jar = await cookies();
  const visitorId = jar.get(COOKIES.visitor)?.value ?? null;
  return resolveStorefront(visitorId, parseForced(jar.get(COOKIES.force)?.value));
});
