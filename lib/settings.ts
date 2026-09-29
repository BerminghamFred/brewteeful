/**
 * Typed site settings. Stored in `site_settings` (one row per key, JSON value),
 * edited in /admin/content. Anything missing in the DB falls back to these defaults,
 * so a fresh database (or no database) still renders a sensible site.
 */

export type PricingSettings = {
  min_group_size: number;
  max_group_size: number;
  /** Standard delivery charge when free delivery doesn't apply. */
  standard_shipping_pence: number;
  /** Item count at which standard delivery becomes free. 0 = always free. */
  free_shipping_min_items: number;
  express_enabled: boolean;
  express_shipping_pence: number;
};

export type DeliverySettings = {
  production_days_min: number;
  production_days_max: number;
  standard_days_min: number;
  standard_days_max: number;
  express_days: number;
  standard_label: string;
  express_label: string;
  /** Short line used in hero / sticky bars. */
  headline: string;
  /** Longer explanation for the delivery page. */
  details: string;
  returns_policy: string;
};

export type EconomicsSettings = {
  payment_fee_percent: number;
  payment_fee_fixed_pence: number;
  /** Postage we pay per parcel (standard). */
  postage_per_order_pence: number;
  /** Extra postage for larger parcels, applied per item above `postage_included_items`. */
  postage_per_extra_item_pence: number;
  postage_included_items: number;
  packaging_per_order_pence: number;
  /** What express costs us, over and above standard postage. */
  express_extra_cost_pence: number;
  vat_registered: boolean;
  vat_rate_percent: number;
};

export type ContentSettings = {
  hero_eyebrow: string;
  hero_headline: string;
  hero_subheadline: string;
  hero_cta: string;
  /** Real group photo. When empty the illustrated lineup is shown instead. */
  hero_image_url: string;
  hero_image_alt: string;
  why_points: { title: string; body: string }[];
  guarantee: string;
  final_cta_headline: string;
  final_cta_body: string;
  garment_info: string;
};

export type ContactSettings = {
  email: string;
  phone: string;
  whatsapp: string;
  company_name: string;
  business_address: string;
  response_time: string;
  instagram: string;
};

export type SeoSettings = {
  default_title: string;
  default_description: string;
  og_image_url: string;
};

export type SizeSettings = {
  sizes: string[];
  /** Chest width / length in cm, one row per size. */
  chart: { size: string; chest_cm: number; length_cm: number }[];
  fit_note: string;
};

export type SiteSettings = {
  pricing: PricingSettings;
  delivery: DeliverySettings;
  economics: EconomicsSettings;
  content: ContentSettings;
  contact: ContactSettings;
  seo: SeoSettings;
  sizing: SizeSettings;
};

export type SettingsKey = keyof SiteSettings;

export const SETTINGS_KEYS: SettingsKey[] = [
  "pricing",
  "delivery",
  "economics",
  "content",
  "contact",
  "seo",
  "sizing",
];

export const DEFAULT_SETTINGS: SiteSettings = {
  pricing: {
    min_group_size: 5,
    max_group_size: 30,
    standard_shipping_pence: 499,
    free_shipping_min_items: 5,
    express_enabled: false,
    express_shipping_pence: 995,
  },
  delivery: {
    production_days_min: 3,
    production_days_max: 5,
    standard_days_min: 1,
    standard_days_max: 3,
    express_days: 1,
    standard_label: "Tracked UK delivery",
    express_label: "Express (priority print + next-day)",
    headline: "Printed to order · UK delivery in 4–8 working days",
    details:
      "Every set is printed to order once you check out. Printing takes 3–5 working days, then your set ships in one parcel by tracked UK delivery (1–3 working days). You'll get tracking by email as soon as it ships. Got a tight deadline? Tell us your stag date when you build your set and we'll tell you straight away whether we can make it.",
    returns_policy:
      "If anything arrives misprinted, damaged or wrong, we reprint and resend it free — just email us a photo within 14 days. Changed your mind? Unworn, unwashed shirts can be returned within 14 days of delivery for a refund (you cover return postage). Personalised items can't be returned unless faulty.",
  },
  economics: {
    payment_fee_percent: 1.5,
    payment_fee_fixed_pence: 20,
    postage_per_order_pence: 450,
    postage_per_extra_item_pence: 0,
    postage_included_items: 10,
    packaging_per_order_pence: 100,
    express_extra_cost_pence: 500,
    vat_registered: false,
    vat_rate_percent: 20,
  },
  content: {
    hero_eyebrow: "Stag do T-shirts",
    hero_headline: "Pick your legend. Pick your pint.",
    hero_subheadline:
      "Stag shirts starring hand-illustrated icons. A different one for each member of the group, including Bierry Henry, Wayne Schooney, Osama Tin Laden and more.",
    hero_cta: "Build your stag set",
    hero_image_url: "",
    hero_image_alt: "A stag group wearing different designs from the collection",
    why_points: [
      {
        title: "Everyone gets a different shirt",
        body: "No matching 'Dave's Last Ride' tees. Everyone picks their own design; the collection ties the group together.",
      },
      {
        title: "Designed, not templated",
        body: "Original illustrated artwork with a streetwear feel. You'll wear it to five-a-side long after the stag.",
      },
      {
        title: "Ordering for 8 feels like ordering 1",
        body: "Set the group size, give everyone a design and a size, pay once. One parcel, one tracking link.",
      },
      {
        title: "Misprint? We fix it free",
        body: "If anything's wrong with a shirt, we reprint and resend it at our cost. No arguments.",
      },
    ],
    guarantee: "Wrong, damaged or misprinted? Free reprint and resend.",
    final_cta_headline: "Sort the shirts in five minutes.",
    final_cta_body: "Pick the group size, give everyone a design, done. The group chat can argue about something else.",
    garment_info:
      "Organic cotton, oversized boxy fit with a high neck. Wash inside out at 30°.",
  },
  contact: {
    email: "hello@example.com",
    phone: "",
    whatsapp: "",
    company_name: "",
    business_address: "",
    response_time: "We reply within one working day.",
    instagram: "",
  },
  seo: {
    default_title: "Stag Do T-Shirts — A Different Design For Everyone",
    default_description:
      "Stag do T-shirts starring hand-illustrated icons, each with a drink in hand. A different design for everyone in the group. From £20 a shirt, minimum 5, tracked UK delivery.",
    og_image_url: "",
  },
  sizing: {
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    chart: [
      { size: "S", chest_cm: 51, length_cm: 71 },
      { size: "M", chest_cm: 54, length_cm: 73 },
      { size: "L", chest_cm: 57, length_cm: 75 },
      { size: "XL", chest_cm: 60, length_cm: 77 },
      { size: "2XL", chest_cm: 63, length_cm: 79 },
      { size: "3XL", chest_cm: 66, length_cm: 81 },
    ],
    fit_note:
      "Oversized, boxy fit — take your normal size for the relaxed look, or size down for a closer fit. Not sure? Most people take L. Measure a T-shirt you like flat, armpit to armpit, and compare to chest width.",
  },
};

/** Shallow-merge stored values over defaults, per key, so new fields get defaults automatically. */
export function mergeSettings(
  rows: { key: string; value: unknown }[] | null | undefined
): SiteSettings {
  const out = structuredClone(DEFAULT_SETTINGS) as SiteSettings;
  for (const row of rows ?? []) {
    if (!SETTINGS_KEYS.includes(row.key as SettingsKey)) continue;
    if (!row.value || typeof row.value !== "object") continue;
    const key = row.key as SettingsKey;
    (out as Record<SettingsKey, unknown>)[key] = {
      ...out[key],
      ...(row.value as object),
    };
  }
  return out;
}
