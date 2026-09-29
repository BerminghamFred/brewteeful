/**
 * Placeholder catalogue used when Supabase isn't configured (local dev, previews)
 * and mirrored in supabase/seed.sql. Names/copy are placeholders — replace with the
 * real designs + photography in /admin/products before launch.
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

const DESIGNS: [slug: string, name: string, tagline: string, color: string][] = [
  ["the-stag", "The Stag", "Reserved for the man of the hour.", "#b3862a"],
  ["sunday-league-legend", "Sunday League Legend", "Hungover, unfit, undroppable.", "#1f6f43"],
  ["away-day", "Away Day", "Train beers from 9am. Standard.", "#d4481c"],
  ["golden-boot", "Golden Boot", "Scores more at the bar than on the pitch.", "#d9a400"],
  ["the-gaffer", "The Gaffer", "Picks the team. Picks the bar. Picks the fights.", "#1d3b8b"],
  ["half-time-oranges", "Half-Time Oranges", "Peaked at under-11s.", "#ef7d1a"],
  ["last-orders", "Last Orders", "Never, ever the first to leave.", "#7a1f3d"],
  ["under-review", "Under Review", "Every decision questioned. Every round checked.", "#5b3a98"],
];

const now = "2026-09-29T00:00:00.000Z";

export const FALLBACK_PRODUCTS: ProductWithRelations[] = DESIGNS.map(
  ([slug, name, tagline, color], i) => {
    const id = `fallback-${slug}`;
    return {
      id,
      slug,
      name,
      collection_id: FALLBACK_COLLECTION.id,
      tagline,
      description: `${tagline} Original illustrated artwork from the Football Collection, printed on a heavyweight relaxed-fit tee. Designed to sit alongside every other shirt in the set.`,
      price_pence: 2000,
      compare_at_price_pence: null,
      cost_pence: 1050,
      status: "active",
      sort_order: i,
      hero_image_url: null,
      accent_color: color,
      seo_title: null,
      seo_description: null,
      created_at: now,
      updated_at: now,
      images: [],
      variants: DEFAULT_SETTINGS.sizing.sizes.map((size) => ({
        id: `${id}-${size}`,
        product_id: id,
        size,
        sku: `${slug.toUpperCase().slice(0, 12)}-${size}`,
        cost_pence: null,
        active: true,
        stock: null,
      })),
    };
  }
);

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
