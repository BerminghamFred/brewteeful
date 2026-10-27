import "server-only";
import { getCatalogue, getStorefrontContext } from "@/lib/store";
import type { BuilderConfig } from "@/components/builder/types";

export async function getBuilderConfig(): Promise<BuilderConfig> {
  const [{ settings, offers, experiments }, { products }] = await Promise.all([
    getStorefrontContext(),
    getCatalogue(),
  ]);
  const designs = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    color: p.accent_color,
    imageUrl: p.images[0]?.url ?? p.hero_image_url,
    pricePence: p.price_pence,
    sizes: settings.sizing.sizes.filter((s) => p.variants.some((v) => v.size === s)),
  }));
  return {
    designs,
    sizes: settings.sizing.sizes,
    pricing: settings.pricing,
    delivery: settings.delivery,
    offers,
    unitPriceOverridePence: experiments.overrides.unit_price_pence ?? null,
    stagSlug: designs.find((d) => d.slug === "the-stag")?.slug ?? null,
  };
}
