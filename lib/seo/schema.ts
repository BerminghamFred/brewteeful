import type { ProductRow } from "@/types/database";

export function productJsonLd(
  product: ProductRow,
  ratingAvg: number,
  reviewCount: number,
  url: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description ?? product.title,
    image: [product.hero_image_url],
    sku: product.slug,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "GBP",
      price: (product.price_pence / 100).toFixed(2),
      availability: "https://schema.org/InStock",
    },
    aggregateRating:
      reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: ratingAvg.toFixed(1),
            reviewCount,
          }
        : undefined,
  };
}
