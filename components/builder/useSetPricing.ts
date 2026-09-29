"use client";

import { useMemo } from "react";
import { priceSet } from "@/lib/pricing";
import type { Person } from "@/stores/set-store";
import type { BuilderConfig } from "@/components/builder/types";

/** Display-side pricing. /api/checkout re-prices on the server with the same function. */
export function useSetPricing(cfg: BuilderConfig, people: Person[], shippingMethod: "standard" | "express" = "standard") {
  return useMemo(() => {
    const bySlug = new Map(cfg.designs.map((d) => [d.slug, d]));
    const fallbackPrice = cfg.designs[0]?.pricePence ?? 2000;
    return priceSet({
      lines: people.map((p) => ({
        productId: p.design ?? "unassigned",
        unitPricePence: (p.design && bySlug.get(p.design)?.pricePence) || fallbackPrice,
      })),
      settings: cfg.pricing,
      offers: cfg.offers,
      unitPriceOverridePence: cfg.unitPriceOverridePence,
      shippingMethod,
    });
  }, [cfg, people, shippingMethod]);
}

export function isComplete(people: Person[]) {
  return people.length > 0 && people.every((p) => p.design && p.size);
}
