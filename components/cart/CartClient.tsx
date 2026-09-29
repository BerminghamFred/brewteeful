"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cart-store";
import { formatGbp } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { trackInitiateCheckout } from "@/lib/analytics-events";

export function CartClient() {
  const router = useRouter();
  const { items, updateQty, removeItem } = useCartStore();
  const [bump, setBump] = useState(false);
  const [loading, setLoading] = useState(false);

  const subtotal = items.reduce(
    (s, i) => s + i.unitPricePence * i.quantity,
    0
  );

  function checkout() {
    setLoading(true);
    trackInitiateCheckout(
      items.map((i) => ({
        id: i.productId,
        quantity: i.quantity,
        item_price: i.unitPricePence / 100,
      })),
      subtotal / 100
    );
    try {
      sessionStorage.setItem("brewteeful-order-bump", bump ? "1" : "0");
      router.push("/checkout");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mt-12 rounded-2xl border border-dashed border-white/20 p-12 text-center text-white/55">
        Your cart is empty.
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {items.map((line) => (
          <div
            key={line.variantId}
            className="flex gap-4 rounded-xl border border-white/10 bg-brand-concrete/30 p-4"
          >
            <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-lg bg-brand-ink">
              <Image
                src={line.imageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/product/${line.slug}`}
                className="font-medium text-white hover:text-brand-accent"
              >
                {line.title}
              </Link>
              <p className="text-xs text-white/45">Size {line.size}</p>
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  className="rounded border border-white/15 px-2 text-sm"
                  onClick={() =>
                    updateQty(line.variantId, Math.max(1, line.quantity - 1))
                  }
                >
                  −
                </button>
                <span className="text-sm">{line.quantity}</span>
                <button
                  type="button"
                  className="rounded border border-white/15 px-2 text-sm"
                  onClick={() => updateQty(line.variantId, line.quantity + 1)}
                >
                  +
                </button>
                <button
                  type="button"
                  className="ml-auto text-xs text-white/45 hover:text-white"
                  onClick={() => removeItem(line.variantId)}
                >
                  Remove
                </button>
              </div>
            </div>
            <p className="text-sm font-semibold text-white">
              {formatGbp(line.unitPricePence * line.quantity)}
            </p>
          </div>
        ))}
      </div>

      <div className="h-fit rounded-2xl border border-white/10 bg-brand-ink p-6">
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 p-3 hover:border-brand-accent/40">
          <input
            type="checkbox"
            checked={bump}
            onChange={(e) => setBump(e.target.checked)}
            className="mt-1 accent-brand-accent"
          />
          <span className="text-sm text-white/80">
            <span className="font-semibold text-white">Order bump</span>
            <br />
            Add another tee for £19.99 — we&apos;ll pick a best-seller in your
            size when possible.
          </span>
        </label>
        <div className="mt-6 flex justify-between text-sm">
          <span className="text-white/55">Subtotal</span>
          <span className="font-semibold text-white">
            {formatGbp(subtotal + (bump ? 1999 : 0))}
          </span>
        </div>
        <Button
          variant="primary"
          className="mt-6 w-full"
          onClick={checkout}
          disabled={loading}
        >
          {loading ? "Loading…" : "Checkout"}
        </Button>
        <p className="mt-4 text-center text-[10px] text-white/35">
          Apple Pay & Google Pay available at checkout when supported.
        </p>
      </div>
    </div>
  );
}
