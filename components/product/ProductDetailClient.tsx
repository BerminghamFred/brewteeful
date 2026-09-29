"use client";

import { useEffect, useRef, useState } from "react";
import { trackViewContent } from "@/lib/analytics-events";
import { useCartStore } from "@/stores/cart-store";
import { formatGbp } from "@/lib/money";
import type { ProductDetail } from "@/lib/data/products";
import { Button } from "@/components/ui/Button";
import { ProductGallery } from "./ProductGallery";
import { StickyProductBar } from "./StickyProductBar";
import { RecentlyViewed } from "@/components/conversion/RecentlyViewed";
import { AccordionItem } from "@/components/ui/Accordion";

export function ProductDetailClient({
  product,
  relatedJson,
}: {
  product: ProductDetail;
  relatedJson: { slug: string; title: string; hero_image_url: string; price_pence: number }[];
}) {
  const addItem = useCartStore((s) => s.addItem);
  const [size, setSize] = useState<string | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  const selectedVariant = product.variants.find((v) => v.size === size);
  const price =
    selectedVariant?.price_pence ?? product.price_pence;

  useEffect(() => {
    trackViewContent([product.id], price / 100);
  }, [product.id, price]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("brewteeful-recent");
      const list = raw ? (JSON.parse(raw) as string[]) : [];
      const next = [product.slug, ...list.filter((s) => s !== product.slug)].slice(
        0,
        8
      );
      localStorage.setItem("brewteeful-recent", JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, [product.slug]);

  function handleAdd() {
    if (!size || !selectedVariant) return;
    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      slug: product.slug,
      title: product.title,
      size,
      quantity: 1,
      unitPricePence: price,
      imageUrl: product.hero_image_url,
    });
  }

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((s, r) => s + r.rating, 0) /
        product.reviews.length
      : 0;

  return (
    <>
      <div
        ref={mainRef}
        className="mx-auto max-w-7xl px-4 py-10 pb-32 md:px-6 md:py-14 md:pb-14"
      >
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <ProductGallery title={product.title} images={product.images} />
          <div className="flex flex-col">
            <h1 className="font-display text-4xl text-white md:text-5xl lg:text-6xl">
              {product.title}
            </h1>
            {product.reviews.length > 0 && (
              <p className="mt-2 text-sm text-brand-accent">
                ★ {avgRating.toFixed(1)} · {product.reviews.length} reviews
              </p>
            )}
            <div className="mt-6 flex flex-wrap items-baseline gap-3">
              <span className="text-2xl font-semibold text-white">
                {formatGbp(price)}
              </span>
              {product.compare_at_price_pence != null &&
                product.compare_at_price_pence > price && (
                  <span className="text-lg text-white/40 line-through">
                    {formatGbp(product.compare_at_price_pence)}
                  </span>
                )}
            </div>
            <p className="mt-4 text-sm text-white/65">{product.description}</p>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-brand-accent">
              Only {product.stock_remaining} left at this price
            </p>
            <p className="mt-1 text-sm text-white/55">
              Arrives in 3–5 business days (UK)
            </p>

            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
                Size
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    disabled={v.stock <= 0}
                    onClick={() => setSize(v.size)}
                    className={`min-w-[48px] rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      size === v.size
                        ? "border-brand-accent bg-brand-accent/10 text-brand-accent"
                        : "border-white/15 text-white/80 hover:border-white/30 disabled:opacity-30"
                    }`}
                  >
                    {v.size}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 hidden gap-3 lg:flex">
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleAdd}
                disabled={!size}
              >
                Add to cart
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap gap-4 border-t border-white/10 pt-6 text-xs text-white/50">
              <span>🔒 Secure checkout</span>
              <span>📦 Tracked UK shipping</span>
              <span>↩ Easy returns</span>
            </div>

            <div className="mt-10">
              <h2 className="font-display text-2xl text-white">Reviews</h2>
              <ul className="mt-4 space-y-4">
                {product.reviews.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-xl border border-white/10 bg-brand-concrete/30 p-4"
                  >
                    <p className="text-sm font-semibold text-white">
                      {r.author_name}
                      {r.city ? (
                        <span className="font-normal text-white/45">
                          {" "}
                          · {r.city}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-brand-accent">
                      {"★".repeat(r.rating)}
                      {"☆".repeat(5 - r.rating)}
                    </p>
                    {r.body && (
                      <p className="mt-2 text-sm text-white/70">{r.body}</p>
                    )}
                    <p className="mt-2 text-[10px] text-white/35">
                      {new Date(r.created_at).toLocaleDateString("en-GB")}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10">
              <h2 className="font-display text-2xl text-white">FAQ</h2>
              <AccordionItem title="What is the fit?" defaultOpen>
                Boxy streetwear fit. Size up if you prefer a looser drape.
              </AccordionItem>
              <AccordionItem title="Shipping & returns">
                UK orders ship in 3–5 days. Unworn items with tags — 14 days to
                return.
              </AccordionItem>
              <AccordionItem title="Fabric">
                100% premium cotton with soft-hand print. Wash cold inside out.
              </AccordionItem>
            </div>
          </div>
        </div>

        <section className="mt-20 border-t border-white/10 pt-14">
          <h2 className="font-display text-3xl text-white">You may also like</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {relatedJson.map((r) => (
              <a
                key={r.slug}
                href={`/product/${r.slug}`}
                className="group overflow-hidden rounded-xl border border-white/10 bg-brand-concrete/30"
              >
                <div className="relative aspect-[4/5]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.hero_image_url}
                    alt=""
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-white">{r.title}</p>
                  <p className="text-xs text-white/55">
                    {formatGbp(r.price_pence)}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>

        <RecentlyViewed currentSlug={product.slug} />
      </div>

      <StickyProductBar
        title={product.title}
        pricePence={price}
        canAdd={Boolean(size)}
        onAdd={handleAdd}
      />
    </>
  );
}
