/** Domain types for the stag-set storefront. Mirrors supabase/migrations/*_stag_sets.sql. */

export type ProductStatus = "draft" | "active" | "archived";

export type Collection = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  active: boolean;
};

export type ProductImage = {
  id: string;
  product_id: string;
  url: string;
  alt: string | null;
  sort_order: number;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  size: string;
  sku: string;
  cost_pence: number | null;
  active: boolean;
  stock: number | null;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  collection_id: string | null;
  tagline: string | null;
  description: string | null;
  price_pence: number;
  compare_at_price_pence: number | null;
  cost_pence: number;
  status: ProductStatus;
  sort_order: number;
  hero_image_url: string | null;
  /** Close-up of the print itself, shown large on the homepage lineup hover. */
  artwork_url: string | null;
  accent_color: string;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductWithRelations = Product & {
  images: ProductImage[];
  variants: ProductVariant[];
};

export type OrderStatus =
  | "pending"
  | "paid"
  | "refunded"
  | "partially_refunded"
  | "cancelled";

export type FulfilmentStatus =
  | "unfulfilled"
  | "in_production"
  | "shipped"
  | "delivered"
  | "cancelled";

export type Attribution = {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  gclid?: string | null;
  gbraid?: string | null;
  wbraid?: string | null;
  fbclid?: string | null;
  landing_page?: string | null;
  referrer?: string | null;
  device?: string | null;
};

export type Order = {
  id: string;
  order_number: number;
  status: OrderStatus;
  fulfilment_status: FulfilmentStatus;
  email: string | null;
  customer_name: string | null;
  phone: string | null;
  shipping_address: Record<string, string | null> | null;
  shipping_method: string | null;
  event_date: string | null;
  group_name: string | null;
  item_count: number;
  subtotal_pence: number;
  discount_pence: number;
  shipping_pence: number;
  total_pence: number;
  cogs_pence: number;
  fulfilment_cost_pence: number;
  payment_fee_pence: number | null;
  refunded_pence: number;
  discount_code: string | null;
  applied_offers: unknown;
  pricing_snapshot: unknown;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shipped_at: string | null;
  admin_notes: string | null;
  visitor_id: string | null;
  session_id: string | null;
  attribution: Attribution | null;
  experiments: Record<string, string> | null;
  consent: { analytics?: boolean; ads?: boolean } | null;
  created_at: string;
  paid_at: string | null;
};

export type OrderItem = {
  id: string;
  order_id: string;
  position: number;
  is_stag: boolean;
  nickname: string | null;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  size: string;
  sku: string | null;
  unit_price_pence: number;
  unit_cost_pence: number;
};

export type DiscountKind = "percent" | "fixed" | "free_shipping";

export type DiscountCode = {
  id: string;
  code: string;
  kind: DiscountKind;
  /** percent: 0-100; fixed: pence; free_shipping: ignored */
  value: number;
  min_items: number;
  starts_at: string | null;
  ends_at: string | null;
  max_uses: number | null;
  uses_count: number;
  active: boolean;
};

export type OfferKind =
  | "banner"
  | "badge"
  | "modal"
  | "quantity_discount"
  | "free_shipping";

export type BannerConfig = { text: string; link?: string | null };
export type BadgeConfig = { text: string; link?: string | null };
export type ModalConfig = {
  title: string;
  body: string;
  cta_label?: string | null;
  cta_link?: string | null;
  code?: string | null;
  delay_seconds?: number;
};
export type QuantityDiscountConfig = {
  min_items: number;
  /** One of these. amount is whole-order pence, percent is 0-100. */
  amount_off_pence?: number | null;
  percent_off?: number | null;
  label: string;
};
export type FreeShippingConfig = { min_items: number; label: string };

export type Offer = {
  id: string;
  name: string;
  kind: OfferKind;
  config: Record<string, unknown>;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
  priority: number;
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  active: boolean;
};

export type Review = {
  id: string;
  order_id: string | null;
  product_id: string | null;
  author_name: string;
  rating: number;
  body: string | null;
  approved: boolean;
  verified: boolean;
  created_at: string;
};

export type ExperimentVariable =
  | "price"
  | "headline"
  | "cta"
  | "hero_image"
  | "offer"
  | "free_shipping"
  | "min_group_size";

export type ExperimentVariant = {
  key: string;
  name: string;
  weight: number;
  /** Variable-specific overrides, e.g. { unit_price_pence: 1999 } or { headline: "..." } */
  config: Record<string, unknown>;
};

export type Experiment = {
  id: string;
  key: string;
  name: string;
  hypothesis: string | null;
  variable: ExperimentVariable;
  status: "draft" | "running" | "ended";
  variants: ExperimentVariant[];
  started_at: string | null;
  ended_at: string | null;
  winner: string | null;
  created_at: string;
};

export type AdSpendRow = {
  id: string;
  date: string;
  channel: string;
  campaign: string | null;
  ad_group: string | null;
  keyword: string | null;
  spend_pence: number;
  clicks: number | null;
  impressions: number | null;
  source: "manual" | "csv" | "api";
};
