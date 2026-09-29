"use client";

import { useEffect } from "react";
import { trackPurchaseTags, type GaItem } from "@/lib/track";
import { useSetStore } from "@/stores/set-store";

/** Fires browser purchase tags once per order (GA4, Google Ads + enhanced conversions, Meta) and clears the set. */
export function PurchaseComplete(props: {
  orderId: string;
  orderNumber: number;
  value: number;
  shipping: number;
  discount: number;
  items: GaItem[];
  email?: string | null;
}) {
  const reset = useSetStore((s) => s.reset);
  useEffect(() => {
    // Give gtag/fbq a moment to finish loading on a fresh page load.
    const t = setTimeout(() => trackPurchaseTags(props), 800);
    reset();
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
