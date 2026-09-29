"use client";

import { useFormStatus } from "react-dom";
import { saveProductAction } from "@/lib/actions/products";
import { Button } from "@/components/ui/Button";
import type { ProductRow } from "@/types/database";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? "Saving…" : "Save product"}
    </Button>
  );
}

export function ProductForm({ product }: { product?: ProductRow | null }) {
  return (
    <form action={saveProductAction} className="max-w-xl space-y-4">
      {product?.id ? (
        <input type="hidden" name="id" value={product.id} />
      ) : null}
      <div>
        <label className="text-xs text-white/45">Slug</label>
        <input
          name="slug"
          required
          defaultValue={product?.slug}
          className="mt-1 w-full rounded-lg border border-white/15 bg-brand-ink px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label className="text-xs text-white/45">Title</label>
        <input
          name="title"
          required
          defaultValue={product?.title}
          className="mt-1 w-full rounded-lg border border-white/15 bg-brand-ink px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label className="text-xs text-white/45">Description</label>
        <textarea
          name="description"
          rows={4}
          defaultValue={product?.description ?? ""}
          className="mt-1 w-full rounded-lg border border-white/15 bg-brand-ink px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label className="text-xs text-white/45">Collection (all | drops)</label>
        <input
          name="collection_slug"
          defaultValue={product?.collection_slug ?? "all"}
          className="mt-1 w-full rounded-lg border border-white/15 bg-brand-ink px-3 py-2 text-sm text-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-white/45">Price (£)</label>
          <input
            name="price"
            type="number"
            step="0.01"
            required
            defaultValue={product ? product.price_pence / 100 : ""}
            className="mt-1 w-full rounded-lg border border-white/15 bg-brand-ink px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="text-xs text-white/45">Compare at (£)</label>
          <input
            name="compare_price"
            type="number"
            step="0.01"
            defaultValue={
              product?.compare_at_price_pence
                ? product.compare_at_price_pence / 100
                : ""
            }
            className="mt-1 w-full rounded-lg border border-white/15 bg-brand-ink px-3 py-2 text-sm text-white"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-white/45">Stock remaining (urgency)</label>
        <input
          name="stock"
          type="number"
          defaultValue={product?.stock_remaining ?? 50}
          className="mt-1 w-full rounded-lg border border-white/15 bg-brand-ink px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label className="text-xs text-white/45">Hero image URL</label>
        <input
          name="hero_image_url"
          required
          defaultValue={product?.hero_image_url}
          className="mt-1 w-full rounded-lg border border-white/15 bg-brand-ink px-3 py-2 text-sm text-white"
        />
        <p className="mt-1 text-[10px] text-white/35">
          Paste Unsplash URL or Supabase Storage public URL.
        </p>
      </div>
      <div>
        <label className="text-xs text-white/45">Sizes (comma)</label>
        <input
          name="sizes"
          defaultValue="S,M,L,XL"
          className="mt-1 w-full rounded-lg border border-white/15 bg-brand-ink px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label className="text-xs text-white/45">Status</label>
        <select
          name="status"
          defaultValue={product?.status ?? "published"}
          className="mt-1 w-full rounded-lg border border-white/15 bg-brand-ink px-3 py-2 text-sm text-white"
        >
          <option value="draft">draft</option>
          <option value="published">published</option>
        </select>
      </div>
      <Submit />
    </form>
  );
}
