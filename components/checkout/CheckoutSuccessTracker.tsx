"use client";

import { useEffect } from "react";
import { trackPurchase } from "@/lib/analytics-events";
import { useCartStore } from "@/stores/cart-store";

export function CheckoutSuccessTracker({ sessionId }: { sessionId: string }) {
  const clear = useCartStore((s) => s.clear);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch(
          `/api/checkout/session?session_id=${encodeURIComponent(sessionId)}`
        );
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          id: string;
          amount_total: number | null;
          currency: string | null;
          payment_status: string;
        };
        if (data.payment_status !== "paid") return;
        trackPurchase({
          transaction_id: data.id,
          value: (data.amount_total ?? 0) / 100,
          currency: (data.currency ?? "gbp").toUpperCase(),
          contents: [],
        });
        clear();
      } catch {
        /* ignore */
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [sessionId, clear]);

  return null;
}
