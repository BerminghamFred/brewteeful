import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatGbp } from "@/lib/money";
import type { ProductRow } from "@/types/database";
import { MOCK_PRODUCTS } from "@/lib/data/mock-products";

export default async function AdminProductsPage() {
  let rows: ProductRow[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("updated_at", { ascending: false });
    rows = (data ?? []) as ProductRow[];
  } catch {
    rows = MOCK_PRODUCTS;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl text-white">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-brand-accent px-4 py-2 text-sm font-semibold text-brand-dark"
        >
          Add product
        </Link>
      </div>
      <table className="mt-8 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-white/45">
            <th className="pb-2">Title</th>
            <th className="pb-2">Slug</th>
            <th className="pb-2">Price</th>
            <th className="pb-2">Status</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="border-b border-white/5">
              <td className="py-3 text-white">{p.title}</td>
              <td className="text-white/55">{p.slug}</td>
              <td>{formatGbp(p.price_pence)}</td>
              <td className="capitalize text-white/70">{p.status}</td>
              <td>
                <Link
                  href={`/admin/products/${p.id}`}
                  className="text-brand-accent hover:underline"
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
