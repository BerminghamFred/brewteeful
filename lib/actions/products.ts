"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/actions/admin";

export async function saveProduct(formData: FormData) {
  const supabase = await requireAdmin();
  const id = formData.get("id") as string | null;
  const slug = (formData.get("slug") as string)?.trim();
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string) ?? "";
  const collection_slug = (formData.get("collection_slug") as string) ?? "all";
  const price_pence = Math.round(
    parseFloat(formData.get("price") as string) * 100
  );
  const compare = formData.get("compare_price") as string;
  const compare_at_price_pence = compare
    ? Math.round(parseFloat(compare) * 100)
    : null;
  const stock_remaining = parseInt(
    (formData.get("stock") as string) ?? "0",
    10
  );
  const hero_image_url = (formData.get("hero_image_url") as string)?.trim();
  const status = (formData.get("status") as string) ?? "draft";
  const sizes = (formData.get("sizes") as string)
    ?.split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean) ?? ["S", "M", "L", "XL"];

  if (!slug || !title || !hero_image_url) {
    throw new Error("Slug, title, and hero image required");
  }

  let productId = id;

  if (id) {
    await supabase
      .from("products")
      .update({
        slug,
        title,
        description,
        collection_slug,
        price_pence,
        compare_at_price_pence,
        stock_remaining,
        hero_image_url,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    productId = id;
    await supabase.from("product_variants").delete().eq("product_id", id);
  } else {
    const { data, error } = await supabase
      .from("products")
      .insert({
        slug,
        title,
        description,
        collection_slug,
        price_pence,
        compare_at_price_pence,
        stock_remaining,
        hero_image_url,
        status,
      })
      .select("id")
      .single();
    if (error) throw error;
    productId = data!.id as string;
  }

  const variants = sizes.map((size) => ({
    product_id: productId,
    size,
    sku: `BTF-${slug.slice(0, 6).toUpperCase()}-${size}`,
    stock: 25,
  }));
  await supabase.from("product_variants").insert(variants);

  revalidatePath("/collection/all");
  revalidatePath(`/product/${slug}`);
  revalidatePath("/admin/products");
  return productId;
}

export async function deleteProduct(id: string) {
  const supabase = await requireAdmin();
  await supabase.from("products").delete().eq("id", id);
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function saveProductAction(formData: FormData) {
  await saveProduct(formData);
  redirect("/admin/products");
}
