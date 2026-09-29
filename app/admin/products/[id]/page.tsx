import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/ProductForm";
import type { ProductRow } from "@/types/database";
import { MOCK_PRODUCTS } from "@/lib/data/mock-products";
import { deleteProduct } from "@/lib/actions/products";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let product: ProductRow | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();
    product = data as ProductRow | null;
  } catch {
    product = MOCK_PRODUCTS.find((p) => p.id === id) ?? null;
  }
  if (!product) notFound();

  async function del() {
    "use server";
    await deleteProduct(id);
  }

  return (
    <div>
      <h1 className="font-display text-4xl text-white">Edit product</h1>
      <div className="mt-8">
        <ProductForm product={product} />
      </div>
      <form action={del} className="mt-8">
        <button
          type="submit"
          className="rounded-full border border-red-500/40 bg-transparent px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
        >
          Delete product
        </button>
      </form>
    </div>
  );
}
