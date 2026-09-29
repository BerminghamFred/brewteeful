import { createClientOptional } from "@/lib/supabase/server";
import {
  MOCK_PRODUCTS,
  mockImagesFor,
  mockReviewsFor,
  mockVariantsFor,
} from "@/lib/data/mock-products";
import type {
  ProductImageRow,
  ProductRow,
  ProductVariantRow,
  ReviewRow,
} from "@/types/database";

export type ProductDetail = ProductRow & {
  images: ProductImageRow[];
  variants: ProductVariantRow[];
  reviews: ReviewRow[];
};

export async function listPublishedProducts(collection?: string): Promise<ProductRow[]> {
  const supabase = await createClientOptional();
  if (!supabase) {
    let list = MOCK_PRODUCTS;
    if (collection && collection !== "all") {
      list = list.filter((p) => p.collection_slug === collection);
    }
    return list;
  }
  let q = supabase
    .from("products")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (collection && collection !== "all") {
    q = q.eq("collection_slug", collection);
  }
  const { data, error } = await q;
  if (error || !data?.length) {
    return MOCK_PRODUCTS.filter(
      (p) => !collection || collection === "all" || p.collection_slug === collection
    );
  }
  return data as ProductRow[];
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const supabase = await createClientOptional();
  if (!supabase) {
    const p = MOCK_PRODUCTS.find((x) => x.slug === slug);
    if (!p) return null;
    return {
      ...p,
      images: mockImagesFor(p.id),
      variants: mockVariantsFor(p.id),
      reviews: mockReviewsFor(p.id),
    };
  }
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error || !product) {
    const p = MOCK_PRODUCTS.find((x) => x.slug === slug);
    if (!p) return null;
    return {
      ...p,
      images: mockImagesFor(p.id),
      variants: mockVariantsFor(p.id),
      reviews: mockReviewsFor(p.id),
    };
  }
  const pid = product.id as string;
  const [images, variants, reviews] = await Promise.all([
    supabase
      .from("product_images")
      .select("*")
      .eq("product_id", pid)
      .order("sort_order"),
    supabase.from("product_variants").select("*").eq("product_id", pid),
    supabase
      .from("reviews")
      .select("*")
      .eq("product_id", pid)
      .eq("approved", true)
      .order("created_at", { ascending: false }),
  ]);
  return {
    ...(product as ProductRow),
    images: (images.data ?? []) as ProductImageRow[],
    variants: (variants.data ?? []) as ProductVariantRow[],
    reviews: (reviews.data ?? []) as ReviewRow[],
  };
}

export async function getRelatedProducts(
  slug: string,
  collectionSlug: string,
  limit = 4
): Promise<ProductRow[]> {
  const supabase = await createClientOptional();
  if (!supabase) {
    return MOCK_PRODUCTS.filter((p) => p.slug !== slug).slice(0, limit);
  }
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("status", "published")
    .eq("collection_slug", collectionSlug)
    .neq("slug", slug)
    .limit(limit);
  const rows = (data ?? []) as ProductRow[];
  if (rows.length < limit) {
    const { data: more } = await supabase
      .from("products")
      .select("*")
      .eq("status", "published")
      .neq("slug", slug)
      .limit(limit);
    const merged = [...rows];
    for (const p of (more ?? []) as ProductRow[]) {
      if (!merged.find((m) => m.id === p.id) && merged.length < limit)
        merged.push(p);
    }
    return merged.slice(0, limit);
  }
  return rows;
}
