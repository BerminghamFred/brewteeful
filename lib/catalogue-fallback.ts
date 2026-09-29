/**
 * Catalogue used when Supabase isn't configured (local dev, previews), mirrored in
 * supabase/seed.sql. Designs with `images` are real; the rest are placeholders to be
 * replaced with real designs + photography in /admin/products before launch.
 */
import type { Collection, Faq, ProductWithRelations } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/settings";

export const FALLBACK_COLLECTION: Collection = {
  id: "col-football",
  slug: "football",
  name: "The Football Collection",
  description: "Illustrated, terrace-culture designs that look unreal as a lineup.",
  sort_order: 0,
  active: true,
};

type DesignSeed = {
  slug: string;
  name: string;
  tagline: string;
  color: string;
  description?: string;
  /** Files under /public; first is the main image. */
  images?: { url: string; alt: string }[];
};

const BIERRY = "/designs/bierry-henry";

const DESIGNS: DesignSeed[] = [
  {
    slug: "bierry-henry",
    name: "Bierry Henry",
    tagline: "Va-va-voom. Va-va-vino. A certain French No. 12, one bottle in.",
    color: "#1f3c9c",
    description:
      "Hand-illustrated tribute to a certain French No. 12 — hand on hip, drink in hand, completely unbothered. Small chest print up front; the full piece on the back, with splashes of stadium colour and 'Bierry Henry' scrawled across the pitch. Oversized organic tee with a high neck.",
    images: [
      { url: `${BIERRY}/back.jpg`, alt: "Bierry Henry T-shirt — back print" },
      { url: `${BIERRY}/front.jpg`, alt: "Bierry Henry T-shirt — front chest print" },
      { url: `${BIERRY}/folded.jpg`, alt: "Bierry Henry T-shirt — folded" },
      { url: `${BIERRY}/side-left.jpg`, alt: "Bierry Henry T-shirt — left side" },
      { url: `${BIERRY}/side-right.jpg`, alt: "Bierry Henry T-shirt — right side" },
    ],
  },
  { slug: "the-stag", name: "The Stag", tagline: "Reserved for the man of the hour.", color: "#b3862a" },
  { slug: "sunday-league-legend", name: "Sunday League Legend", tagline: "Hungover, unfit, undroppable.", color: "#1f6f43" },
  { slug: "away-day", name: "Away Day", tagline: "Train beers from 9am. Standard.", color: "#d4481c" },
  { slug: "golden-boot", name: "Golden Boot", tagline: "Scores more at the bar than on the pitch.", color: "#d9a400" },
  { slug: "the-gaffer", name: "The Gaffer", tagline: "Picks the team. Picks the bar. Picks the fights.", color: "#1d3b8b" },
  { slug: "half-time-oranges", name: "Half-Time Oranges", tagline: "Peaked at under-11s.", color: "#ef7d1a" },
  { slug: "last-orders", name: "Last Orders", tagline: "Never, ever the first to leave.", color: "#7a1f3d" },
];

const now = "2026-09-29T00:00:00.000Z";

export const FALLBACK_PRODUCTS: ProductWithRelations[] = DESIGNS.map((d, i) => {
  const id = `fallback-${d.slug}`;
  return {
    id,
    slug: d.slug,
    name: d.name,
    collection_id: FALLBACK_COLLECTION.id,
    tagline: d.tagline,
    description:
      d.description ??
      `${d.tagline} Original illustrated artwork from the Football Collection, printed on a heavyweight tee. Designed to sit alongside every other shirt in the set.`,
    price_pence: 2000,
    compare_at_price_pence: null,
    cost_pence: 1050,
    status: "active",
    sort_order: i,
    hero_image_url: d.images?.[0]?.url ?? null,
    accent_color: d.color,
    seo_title: null,
    seo_description: null,
    created_at: now,
    updated_at: now,
    images: (d.images ?? []).map((img, j) => ({ id: `${id}-img-${j}`, product_id: id, url: img.url, alt: img.alt, sort_order: j })),
    variants: DEFAULT_SETTINGS.sizing.sizes.map((size) => ({
      id: `${id}-${size}`,
      product_id: id,
      size,
      sku: `${d.slug.toUpperCase().slice(0, 12)}-${size}`,
      cost_pence: null,
      active: true,
      stock: null,
    })),
  };
});

export const FALLBACK_FAQS: Faq[] = [
  ["How does the group set work?", "Tell us how many are going, give each person a design and a size, and pay once. Everyone can have a different design (that's the point) — or double up if two of you fight over the same one."],
  ["What's the minimum order?", "5 shirts. Most groups order 6–10. Over 30? Get in touch and we'll sort a bulk price."],
  ["How much does it cost?", "£20 a shirt, with free tracked UK delivery on sets. You'll see the exact total before you pay — no surprises at checkout."],
  ["How long does delivery take?", "Every set is printed to order: 3–5 working days to print, then 1–3 working days tracked delivery. Enter your stag date in the builder and we'll tell you straight away if we can make it."],
  ["I don't know everyone's size yet.", "Build the set anyway and hit 'Share lineup' — send the link to the group chat so everyone can check their design and size, then come back and pay. Most lads take L if you're really stuck."],
  ["Can I put names on the shirts?", "Add a nickname to each person in the builder so we know who's who in the parcel. Printed names aren't available yet."],
  ["What if something's wrong with a shirt?", "If anything arrives misprinted, damaged or wrong we'll reprint and resend it free. Just email us a photo within 14 days."],
  ["Can I return shirts?", "Yes — unworn, unwashed shirts can be returned within 14 days of delivery for a refund. Full details on our delivery & returns page."],
  ["How do I pay?", "Apple Pay, Google Pay or any major card, through Stripe's secure checkout. We never see or store your card details."],
].map(([question, answer], i) => ({
  id: `faq-${i}`,
  question: question!,
  answer: answer!,
  sort_order: i,
  active: true,
}));
