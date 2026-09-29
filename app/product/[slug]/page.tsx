import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import { getProductBySlug, getRelatedProducts } from "@/lib/data/products";
import { productJsonLd } from "@/lib/seo/schema";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Product" };
  return {
    title: p.title,
    description: p.description ?? p.title,
    openGraph: {
      images: [p.hero_image_url],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(slug, product.collection_slug, 4);
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const url = `${siteUrl}/product/${product.slug}`;

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((s, r) => s + r.rating, 0) /
        product.reviews.length
      : 0;

  const jsonLd = productJsonLd(
    product,
    avgRating,
    product.reviews.length,
    url
  );

  return (
    <>
      <Script
        id="ld-product"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient
        product={product}
        relatedJson={related.map((r) => ({
          slug: r.slug,
          title: r.title,
          hero_image_url: r.hero_image_url,
          price_pence: r.price_pence,
        }))}
      />
    </>
  );
}
