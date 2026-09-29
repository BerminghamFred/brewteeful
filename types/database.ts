export type ProductStatus = "draft" | "published";

export type ProductRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  collection_slug: string;
  price_pence: number;
  compare_at_price_pence: number | null;
  stock_remaining: number;
  status: ProductStatus;
  hero_image_url: string;
  created_at: string;
  updated_at: string;
};

export type ProductImageRow = {
  id: string;
  product_id: string;
  url: string;
  sort_order: number;
  alt: string | null;
};

export type ProductVariantRow = {
  id: string;
  product_id: string;
  size: string;
  sku: string;
  stock: number;
  price_pence: number | null;
};

export type ReviewRow = {
  id: string;
  product_id: string;
  author_name: string;
  city: string | null;
  rating: number;
  body: string | null;
  approved: boolean;
  created_at: string;
};

export type SiteSettingRow = {
  key: string;
  value: Record<string, unknown>;
};

export type DiscountCodeRow = {
  id: string;
  code: string;
  percent_off: number | null;
  amount_off_pence: number | null;
  expires_at: string | null;
  max_uses: number | null;
  uses_count: number;
  active: boolean;
};

export type OrderRow = {
  id: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  status: string;
  email: string | null;
  total_pence: number;
  currency: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type ExperimentRow = {
  id: string;
  slug: string;
  name: string;
  status: "draft" | "running" | "paused";
  experiment_type: "headline" | "price" | "image";
  variants: Record<string, Record<string, unknown>>;
  created_at: string;
};

export type ProfileRow = {
  id: string;
  email: string | null;
  role: "customer" | "admin";
};
