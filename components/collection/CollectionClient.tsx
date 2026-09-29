"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ProductRow } from "@/types/database";
import { ProductCard } from "@/components/product/ProductCard";

const SIZES = ["S", "M", "L", "XL"];

export function CollectionClient({
  products,
  initialSize,
  initialMax,
}: {
  products: ProductRow[];
  initialSize?: string;
  initialMax?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [size, setSize] = useState(initialSize ?? "");
  const [maxPence, setMaxPence] = useState(
    initialMax ? parseInt(initialMax, 10) * 100 : 100000
  );

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (p.price_pence > maxPence) return false;
      return true;
    });
  }, [products, maxPence]);

  function applyToUrl(nextSize: string, nextMax: number) {
    const q = new URLSearchParams(searchParams?.toString() ?? "");
    if (nextSize) q.set("size", nextSize);
    else q.delete("size");
    if (nextMax < 100000) q.set("max", String(Math.round(nextMax / 100)));
    else q.delete("max");
    router.push(`${pathname}?${q.toString()}`, { scroll: false });
  }

  return (
    <div className="mt-10 flex flex-col gap-8 lg:flex-row">
      <aside className="w-full shrink-0 space-y-6 lg:w-56">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
            Size
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  const next = size === s ? "" : s;
                  setSize(next);
                  applyToUrl(next, maxPence);
                }}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  size === s
                    ? "border-brand-accent bg-brand-accent/10 text-brand-accent"
                    : "border-white/15 text-white/70 hover:border-white/30"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-white/35">
            Size filter is indicative — pick your fit on the product page.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
            Max price
          </p>
          <input
            type="range"
            min={2000}
            max={6000}
            step={100}
            value={Math.min(maxPence, 6000)}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              setMaxPence(v);
              applyToUrl(size, v);
            }}
            className="mt-2 w-full accent-brand-accent"
          />
          <p className="text-xs text-white/55">Up to £{(maxPence / 100).toFixed(0)}</p>
        </div>
      </aside>
      <div className="grid flex-1 grid-cols-2 gap-4 md:grid-cols-3">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
