import type { ProductRow, ProductImageRow, ProductVariantRow, ReviewRow } from "@/types/database";

/** Offline / no-DB fallback — mirrors seed.sql slugs. */
export const MOCK_PRODUCTS: ProductRow[] = [
  {
    id: "mock-1",
    slug: "terrace-king-tee",
    title: "Terrace King",
    description:
      "Heavyweight cotton. Graffiti-inspired crest. Built for cold mornings and loud away ends.",
    collection_slug: "all",
    price_pence: 4500,
    compare_at_price_pence: 5500,
    stock_remaining: 12,
    status: "published",
    hero_image_url:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=80",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mock-2",
    slug: "north-london-nights",
    title: "North London Nights",
    description:
      "Minimal line work, maximum attitude. Premium print on bone white.",
    collection_slug: "drops",
    price_pence: 4200,
    compare_at_price_pence: 5000,
    stock_remaining: 28,
    status: "published",
    hero_image_url:
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1200&q=80",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mock-3",
    slug: "kickoff-chrome",
    title: "Kickoff Chrome",
    description: "Metallic ink detail. Fits boxy — size up for relaxed.",
    collection_slug: "all",
    price_pence: 4800,
    compare_at_price_pence: null,
    stock_remaining: 40,
    status: "published",
    hero_image_url:
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=1200&q=80",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mock-4",
    slug: "ultras-script",
    title: "Ultras Script",
    description:
      "Brush script inspired by terrace banners. Soft-hand feel.",
    collection_slug: "all",
    price_pence: 3900,
    compare_at_price_pence: 4500,
    stock_remaining: 8,
    status: "published",
    hero_image_url:
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1200&q=80",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mock-5",
    slug: "pitch-black-club",
    title: "Pitch Black Club",
    description: "All black everything. Subtle crest hit on chest.",
    collection_slug: "drops",
    price_pence: 4400,
    compare_at_price_pence: 5200,
    stock_remaining: 22,
    status: "published",
    hero_image_url:
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=1200&q=80",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mock-6",
    slug: "extra-time-vintage",
    title: "Extra Time Vintage",
    description:
      "Washed vintage black. Feels like a tee you stole from the best era.",
    collection_slug: "all",
    price_pence: 4100,
    compare_at_price_pence: null,
    stock_remaining: 35,
    status: "published",
    hero_image_url:
      "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=1200&q=80",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function mockImagesFor(productId: string): ProductImageRow[] {
  const p = MOCK_PRODUCTS.find((x) => x.id === productId);
  if (!p) return [];
  return [
    {
      id: "i1",
      product_id: productId,
      url: p.hero_image_url,
      sort_order: 0,
      alt: p.title,
    },
    {
      id: "i2",
      product_id: productId,
      url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1200&q=80",
      sort_order: 1,
      alt: "Flat lay",
    },
  ];
}

export function mockVariantsFor(productId: string): ProductVariantRow[] {
  const sizes = ["S", "M", "L", "XL"];
  return sizes.map((size, i) => ({
    id: `${productId}-v-${i}`,
    product_id: productId,
    size,
    sku: `MOCK-${size}`,
    stock: 20,
    price_pence: null,
  }));
}

export function mockReviewsFor(productId: string): ReviewRow[] {
  return [
    {
      id: "r1",
      product_id: productId,
      author_name: "James",
      city: "Manchester",
      rating: 5,
      body: "Quality is mad. Fits true, print has depth.",
      approved: true,
      created_at: "2026-03-01T12:00:00.000Z",
    },
    {
      id: "r2",
      product_id: productId,
      author_name: "Aaliyah",
      city: "London",
      rating: 5,
      body: "Fast delivery — wore it to five-a-side already.",
      approved: true,
      created_at: "2026-03-05T12:00:00.000Z",
    },
  ];
}
