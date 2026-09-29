/**
 * Catalogue used when Supabase isn't configured (local dev, previews), mirrored in
 * supabase/seed.sql. Designs with `images` are real; The Stag is a placeholder to be
 * replaced with a real design + photography in /admin/products before launch.
 */
import type { Collection, Faq, ProductWithRelations } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/settings";

export const FALLBACK_COLLECTION: Collection = {
  id: "col-legends",
  slug: "legends",
  name: "The Legends Collection",
  description: "Hand-illustrated icons, each with a drink in hand. Made to look unreal as a lineup.",
  sort_order: 0,
  active: true,
};

type DesignSeed = {
  slug: string;
  name: string;
  tagline: string;
  color: string;
  description?: string;
  /** Close-up of the print itself (lineup hover preview). */
  artwork?: string;
  /** Files under /public; first is the main image. */
  images?: { url: string; alt: string }[];
};

const BIERRY = "/designs/bierry-henry";

const DESIGNS: DesignSeed[] = [
  {
    slug: "bierry-henry",
    name: "Bierry Henry",
    tagline: "Va-va-voom. Va-va-vino. A certain French No. 12, one bottle in.",
    color: "#4f8f3a",
    artwork: "/designs/bierry-henry/art.jpg",
    description:
      "Hand-illustrated tribute to a certain French No. 12 — hand on hip, drink in hand, completely unbothered. Small chest print up front; the full piece on the back, with splashes of stadium colour and 'Bierry Henry' scrawled across the pitch. Oversized organic tee with a high neck.",
    images: [
      { url: `${BIERRY}/colour/back.jpg`, alt: "Bierry Henry T-shirt — back print" },
      { url: `${BIERRY}/colour/front.jpg`, alt: "Bierry Henry T-shirt — front chest print" },
      { url: `${BIERRY}/colour/folded.jpg`, alt: "Bierry Henry T-shirt — folded" },
      { url: `${BIERRY}/colour/side-left.jpg`, alt: "Bierry Henry T-shirt — left side" },
      { url: `${BIERRY}/colour/side-right.jpg`, alt: "Bierry Henry T-shirt — right side" },
    ],
  },
  {
    slug: "osama-tin-laden",
    name: "Osama Tin Laden",
    tagline: "Strapped to the tits with tinnies. Nobody's finding him at last orders.",
    color: "#e9a91f",
    artwork: "/designs/osama-tin-laden/art.jpg",
    description:
      "Satirical illustrated portrait with the vest swapped for five cans of the good stuff. Small chest print up front; the full portrait on the back against a bold mustard block, with 'Osama Tin Laden' scrawled alongside. Oversized organic tee with a high neck.",
    images: [
      { url: "/designs/osama-tin-laden/colour/back.jpg", alt: "Osama Tin Laden T-shirt — back print" },
      { url: "/designs/osama-tin-laden/colour/front.jpg", alt: "Osama Tin Laden T-shirt — front chest print" },
      { url: "/designs/osama-tin-laden/colour/folded.jpg", alt: "Osama Tin Laden T-shirt — folded" },
      { url: "/designs/osama-tin-laden/colour/side-left.jpg", alt: "Osama Tin Laden T-shirt — left side" },
      { url: "/designs/osama-tin-laden/colour/side-right.jpg", alt: "Osama Tin Laden T-shirt — right side" },
    ],
  },
  {
    slug: "wayne-schooney",
    name: "Wayne Schooney",
    tagline: "Overhead kick, pint in hand. A certain Manchester No. 10, still hasn't spilled a drop.",
    color: "#9b1c24",
    artwork: "/designs/wayne-schooney/art.jpg",
    description:
      "Hand-painted homage to the most famous derby-day overhead kick — with a pint where the ball should be. Small chest print of the moment up front; the full scene on the back with the crowd behind and 'Wayne Schooney' scrawled across the stand. Oversized organic tee with a high neck.",
    images: [
      { url: "/designs/wayne-schooney/colour/back.jpg", alt: "Wayne Schooney T-shirt — back print" },
      { url: "/designs/wayne-schooney/colour/front.jpg", alt: "Wayne Schooney T-shirt — front chest print" },
      { url: "/designs/wayne-schooney/colour/folded.jpg", alt: "Wayne Schooney T-shirt — folded" },
      { url: "/designs/wayne-schooney/colour/side-left.jpg", alt: "Wayne Schooney T-shirt — left side" },
      { url: "/designs/wayne-schooney/colour/side-right.jpg", alt: "Wayne Schooney T-shirt — right side" },
    ],
  },
  {
    slug: "pamela-canderson",
    name: "Pamela Canderson",
    tagline: "The beach's finest lifeguard, running in slow motion with a tray of ice-cold ones.",
    color: "#8fcde6",
    artwork: "/designs/pamela-canderson/art.jpg",
    description:
      "Hand-painted 90s lifeguard icon in the red swimsuit, wading out of the surf with a full tray of cold ones. Small chest print up front; the full beach scene on the back with 'Pamela Canderson' in red across the sky. Oversized organic tee with a high neck.",
    images: [
      { url: "/designs/pamela-canderson/colour/back.jpg", alt: "Pamela Canderson T-shirt — back print" },
      { url: "/designs/pamela-canderson/colour/front.jpg", alt: "Pamela Canderson T-shirt — front chest print" },
      { url: "/designs/pamela-canderson/colour/folded.jpg", alt: "Pamela Canderson T-shirt — folded" },
      { url: "/designs/pamela-canderson/colour/side-left.jpg", alt: "Pamela Canderson T-shirt — left side" },
      { url: "/designs/pamela-canderson/colour/side-right.jpg", alt: "Pamela Canderson T-shirt — right side" },
    ],
  },
  {
    slug: "marilyn-monrose",
    name: "Marilyn Monrosé",
    tagline: "Some like it pink. Skirt up, glass up, never spilled a drop.",
    color: "#f28b9a",
    artwork: "/designs/marilyn-monrose/art.jpg",
    description:
      "Hand-painted Hollywood icon in that white halter dress, mid-breeze, with a glass of rosé raised. Small chest print up front; the full piece on the back against a bold red block with 'Marilyn Monrosé' across the top. Oversized organic tee with a high neck.",
    images: [
      { url: "/designs/marilyn-monrose/colour/back.jpg", alt: "Marilyn Monrosé T-shirt — back print" },
      { url: "/designs/marilyn-monrose/colour/front.jpg", alt: "Marilyn Monrosé T-shirt — front chest print" },
      { url: "/designs/marilyn-monrose/colour/folded.jpg", alt: "Marilyn Monrosé T-shirt — folded" },
      { url: "/designs/marilyn-monrose/colour/side-left.jpg", alt: "Marilyn Monrosé T-shirt — left side" },
      { url: "/designs/marilyn-monrose/colour/side-right.jpg", alt: "Marilyn Monrosé T-shirt — right side" },
    ],
  },
  {
    slug: "nelson-manstella",
    name: "Nelson Manstella",
    tagline: "Long walk to the bar. Freedom tastes like a cold one.",
    color: "#8b919a",
    artwork: "/designs/nelson-manstella/art.jpg",
    description:
      "Hand-painted statesman at the podium, one fist in the air and a cold can held high. Small chest print up front; the full piece on the back against an abstract crowd, with 'Nelson Manstella' scrawled across the podium. Oversized organic tee with a high neck.",
    images: [
      { url: "/designs/nelson-manstella/colour/back.jpg", alt: "Nelson Manstella T-shirt — back print" },
      { url: "/designs/nelson-manstella/colour/front.jpg", alt: "Nelson Manstella T-shirt — front chest print" },
    ],
  },
  {
    slug: "mother-beeresa",
    name: "Mother Beeresa",
    tagline: "Patron saint of the pint. Blesses every round.",
    color: "#7a4a2e",
    artwork: "/designs/mother-beeresa/art.jpg",
    description:
      "Hand-painted saintly icon in the blue-striped habit, pint in hand and a knowing grin. Small chest print up front; the full portrait on the back against a bold brown block with 'Mother Beeresa' across the top. Oversized organic tee with a high neck.",
    images: [
      { url: "/designs/mother-beeresa/colour/back.jpg", alt: "Mother Beeresa T-shirt — back print" },
      { url: "/designs/mother-beeresa/colour/front.jpg", alt: "Mother Beeresa T-shirt — front chest print" },
    ],
  },
  { slug: "the-stag", name: "The Stag", tagline: "Reserved for the man of the hour.", color: "#b3862a" },
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
      `${d.tagline} Original illustrated artwork from the Legends Collection, printed on a heavyweight tee. Designed to sit alongside every other shirt in the set.`,
    price_pence: 2000,
    compare_at_price_pence: null,
    cost_pence: 1050,
    status: "active",
    sort_order: i,
    hero_image_url: d.images?.[0]?.url ?? null,
    artwork_url: d.artwork ?? null,
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
  ["What's the minimum order?", "3 shirts. Most groups order 6–10. Over 30? Get in touch and we'll sort a bulk price."],
  ["How much does it cost?", "£20 a shirt, with free tracked UK delivery on sets. You'll see the exact total before you pay — no surprises at checkout."],
  ["How long does delivery take?", "Every set is printed to order: 2–3 working days to print, then 1–2 working days tracked delivery — 3–5 working days in total. Enter your stag date in the builder and we'll tell you straight away if we can make it."],
  ["I don't know everyone's size yet.", "Build the set anyway and hit 'Share lineup' — send the link to the group chat so everyone can check their design and size, then come back and pay. Most people take L if you're really stuck."],
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
