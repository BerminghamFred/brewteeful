import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { Card, PageTitle } from "@/components/admin/ui";
import { TeeArt } from "@/components/site/TeeArt";
import { gbp } from "@/lib/format";
import type { ProductWithRelations } from "@/lib/types";

export default async function ProductsPage() {
  const db = await requireAdmin();
  const { data } = await db.from("products").select("*, images:product_images(*), variants:product_variants(*)").order("status").order("sort_order");
  const products = (data ?? []) as ProductWithRelations[];
  return (
    <>
      <PageTitle title="Products" sub="Each design is one product; sizes are variants.">
        <Link href="/admin/products/new" className="btn-dark min-h-[38px] px-4 text-xs">New design</Link>
      </PageTitle>
      <Card>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-mute">
            <tr>
              <th className="py-1" />
              <th>Design</th>
              <th>Status</th>
              <th className="text-right">Price</th>
              <th className="text-right">Cost</th>
              <th className="text-right">Margin</th>
              <th>Sizes</th>
              <th>Photos</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-ink/10">
                <td className="py-2">
                  <TeeArt name={p.name} color={p.accent_color} imageUrl={p.images[0]?.url ?? p.hero_image_url} label={false} sizes="40px" className="h-10 w-10 rounded border border-ink" />
                </td>
                <td>
                  <Link href={`/admin/products/${p.id}`} className="font-bold underline">{p.name}</Link>
                  <span className="block text-xs text-mute">/{p.slug}</span>
                </td>
                <td>{p.status}</td>
                <td className="text-right tabular-nums">{gbp(p.price_pence, { whole: false })}</td>
                <td className="text-right tabular-nums">{gbp(p.cost_pence, { whole: false })}</td>
                <td className="text-right tabular-nums">{gbp(p.price_pence - p.cost_pence, { whole: false })}</td>
                <td className="text-xs">{p.variants.filter((v) => v.active).map((v) => v.size).join(" ")}</td>
                <td>{p.images.length ? p.images.length : <span className="font-bold text-flare">none</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
