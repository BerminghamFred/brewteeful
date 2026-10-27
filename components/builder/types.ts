import type { Offer } from "@/lib/types";
import type { DeliverySettings, PricingSettings } from "@/lib/settings";

export type BuilderDesign = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  color: string;
  imageUrl: string | null;
  pricePence: number;
  sizes: string[];
};

export type BuilderConfig = {
  designs: BuilderDesign[];
  sizes: string[];
  pricing: PricingSettings;
  delivery: DeliverySettings;
  offers: Offer[];
  unitPriceOverridePence: number | null;
  stagSlug: string | null;
};
