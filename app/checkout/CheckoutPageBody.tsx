"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cart-store";
import {
  CheckoutChrome,
  EmbeddedCheckoutClient,
} from "@/components/checkout/EmbeddedCheckoutClient";

export function CheckoutPageBody() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);

  useEffect(() => {
    if (items.length === 0) {
      router.replace("/cart");
    }
  }, [items.length, router]);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-white/55">
        Redirecting to cart…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
      <CheckoutChrome />
      <EmbeddedCheckoutClient />
    </div>
  );
}
