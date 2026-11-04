import type { Offer } from "@/lib/types";
import type { DeliverySettings, PricingSettings } from "@/lib/settings";

export type BuilderDesign = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  color: string;
  imageUrl: string | null;
  /** Close-up of the print (no shirt) — easier to tell designs apart at small sizes. */
  artworkUrl: string | null;
  pricePence: number;
  sizes: string[];
  /** Longer copy for the expanded basket view. */
  description: string | null;
  /** Gallery photos, on-model shot first when there is one. */
  images: { id: string; url: string; alt: string | null }[];
};

/** Which size step this visitor sees (A/B/C test "size_flow"). */
export type SizeFlow = "pay_first" | "share" | "default_l";

export function parseSizeFlow(v: unknown): SizeFlow {
  return v === "pay_first" || v === "default_l" ? v : "share";
}

export type BuilderConfig = {
  designs: BuilderDesign[];
  sizes: string[];
  pricing: PricingSettings;
  delivery: DeliverySettings;
  offers: Offer[];
  unitPriceOverridePence: number | null;
  stagSlug: string | null;
  sizeFlow: SizeFlow;
};
