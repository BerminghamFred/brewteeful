import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { Notice, PageTitle } from "@/components/admin/ui";
import type { Collection, ProductWithRelations } from "@/lib/types";

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const db = await requireAdmin();
  const [{ data: product }, { data: collections }] = await Promise.all([
    db.from("products").select("*, images:product_images(*), variants:product_variants(*)").eq("id", id).maybeSingle(),
    db.from("collections").select("*").order("sort_order"),
  ]);
  if (!product) notFound();
  const p = product as ProductWithRelations;
  p.images.sort((a, b) => a.sort_order - b.sort_order);
  return (
    <>
      <PageTitle title={p.name} sub="Archive instead of deleting — past orders reference this design.">
        <div className="flex gap-3 text-sm">
          {p.status === "active" ? <Link href={`/designs/${p.slug}`} target="_blank" className="underline">View ↗</Link> : null}
          <Link href="/admin/products" className="underline">← Products</Link>
        </div>
      </PageTitle>
      <Notice sp={sp} />
      <ProductEditor product={p} collections={(collections ?? []) as Collection[]} />
    </>
  );
}
