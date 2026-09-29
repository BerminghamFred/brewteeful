import Image from "next/image";
import Link from "next/link";
import type { ProductRow } from "@/types/database";
import { formatGbp } from "@/lib/money";

export function ProductCard({ product }: { product: ProductRow }) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block overflow-hidden rounded-2xl border border-white/10 bg-brand-concrete/40 transition hover:border-brand-accent/40"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-brand-ink">
        <Image
          src={product.hero_image_url}
          alt={product.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width:768px) 50vw, 25vw"
        />
      </div>
      <div className="p-4">
        <h3 className="font-display text-xl text-white">{product.title}</h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-sm font-semibold text-white">
            {formatGbp(product.price_pence)}
          </span>
          {product.compare_at_price_pence != null && (
            <span className="text-xs text-white/40 line-through">
              {formatGbp(product.compare_at_price_pence)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
