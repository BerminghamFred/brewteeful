import { saveProduct } from "@/lib/admin/actions";
import { Card, Field } from "@/components/admin/ui";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import type { Collection, ProductWithRelations } from "@/lib/types";

const p2 = (pence: number | null | undefined) => (pence == null ? "" : (pence / 100).toFixed(2));

export function ProductEditor({ product, collections }: { product?: ProductWithRelations; collections: Collection[] }) {
  const sizes = product
    ? product.variants.filter((v) => v.active).map((v) => v.size).join(", ")
    : DEFAULT_SETTINGS.sizing.sizes.join(", ");
  const margin = product ? product.price_pence - product.cost_pence : null;
  return (
    <form action={saveProduct} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <div>
        <Card title="Design">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Name"><input name="name" required defaultValue={product?.name} className="input" /></Field>
            <Field label="Slug (URL)" hint="lowercase-with-dashes; changing it breaks old links"><input name="slug" required defaultValue={product?.slug} className="input" /></Field>
          </div>
          <div className="mt-3 space-y-3">
            <Field label="Tagline"><input name="tagline" defaultValue={product?.tagline ?? ""} className="input" /></Field>
            <Field label="Description"><textarea name="description" rows={4} defaultValue={product?.description ?? ""} className="input" /></Field>
            <Field label="Images" hint="Real photography only. Upload or paste URLs, one per line.">
              <ImageUploader name="images" defaultValue={(product?.images ?? []).map((i) => i.url).join("\n")} />
            </Field>
            <Field label="Lineup / social image URL (optional)" hint="Used for OG image and when there are no gallery images.">
              <input name="hero_image_url" defaultValue={product?.hero_image_url ?? ""} className="input" />
            </Field>
          </div>
        </Card>
        <Card title="SEO">
          <div className="space-y-3">
            <Field label="Page title"><input name="seo_title" defaultValue={product?.seo_title ?? ""} className="input" placeholder={`${product?.name ?? "Name"} Stag Do T-Shirt`} /></Field>
            <Field label="Meta description"><textarea name="seo_description" rows={2} defaultValue={product?.seo_description ?? ""} className="input" /></Field>
          </div>
        </Card>
      </div>
      <div>
        <Card title="Commercials">
          <div className="space-y-3">
            <Field label="Status">
              <select name="status" defaultValue={product?.status ?? "draft"} className="input">
                <option value="draft">Draft (hidden)</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
            <Field label="Price (£)"><input name="price" required inputMode="decimal" defaultValue={p2(product?.price_pence ?? 2000)} className="input" /></Field>
            <Field label="Unit cost (£)" hint="Print + garment. Drives COGS & contribution.">
              <input name="cost" inputMode="decimal" defaultValue={p2(product?.cost_pence ?? 1050)} className="input" />
            </Field>
            {margin != null ? <p className="text-xs text-mute">Gross margin per shirt: £{(margin / 100).toFixed(2)}</p> : null}
            <Field label="Compare-at price (£)" hint="Only if genuinely sold at this price before (CMA/DMCC rules).">
              <input name="compare_at_price" inputMode="decimal" defaultValue={p2(product?.compare_at_price_pence)} className="input" />
            </Field>
            <Field label="Sizes" hint="Comma separated. Removed sizes are hidden, not deleted.">
              <input name="sizes" defaultValue={sizes} className="input" />
            </Field>
            <Field label="Collection">
              <select name="collection_id" defaultValue={product?.collection_id ?? collections[0]?.id ?? ""} className="input">
                <option value="">—</option>
                {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Sort order"><input name="sort_order" type="number" defaultValue={product?.sort_order ?? 0} className="input" /></Field>
              <Field label="Accent colour"><input name="accent_color" type="color" defaultValue={product?.accent_color ?? "#1f6f43"} className="input h-9 p-1" /></Field>
            </div>
          </div>
          <button className="btn-dark mt-4 w-full">Save design</button>
        </Card>
      </div>
    </form>
  );
}
