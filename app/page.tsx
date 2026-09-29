import Link from "next/link";
import { getApprovedReviews, getCatalogue, getFaqs, getStorefrontContext } from "@/lib/store";
import { priceSet } from "@/lib/pricing";
import { gbp, deliveryWindowText } from "@/lib/format";
import { BRAND, absoluteUrl } from "@/lib/brand";
import { Lineup } from "@/components/site/Lineup";
import { TeeArt } from "@/components/site/TeeArt";
import { CtaLink } from "@/components/site/CtaLink";
import { Faqs } from "@/components/site/Faqs";
import { StickyCta } from "@/components/site/StickyCta";
import { TrackOnView } from "@/components/site/TrackOnView";
import { JsonLd } from "@/components/site/JsonLd";

export const metadata = { alternates: { canonical: "/" } };

export default async function HomePage() {
  const [{ settings, offers, experiments }, { products }, faqs, reviews] = await Promise.all([
    getStorefrontContext(),
    getCatalogue(),
    getFaqs(),
    getApprovedReviews(),
  ]);
  const c = settings.content;
  const unitOverride = experiments.overrides.unit_price_pence ?? null;
  const fromPrice = unitOverride ?? Math.min(...products.map((p) => p.price_pence), 2000);
  const min = settings.pricing.min_group_size;
  const deliveryWindow = deliveryWindowText(settings.delivery);
  const examples = [min, 6, 8, 10].filter((n, i, a) => n >= min && a.indexOf(n) === i);
  const priceRows = examples.map((n) => ({
    n,
    r: priceSet({
      lines: Array.from({ length: n }, () => ({ productId: "x", unitPricePence: fromPrice })),
      settings: settings.pricing,
      offers,
    }),
  }));
  const freeFrom = settings.pricing.free_shipping_min_items;

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: BRAND.name,
            url: absoluteUrl("/"),
            email: settings.contact.email,
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: { "@type": "Answer", text: f.answer },
            })),
          },
        ]}
      />

      {/* 1. Hero */}
      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-10 pt-6 md:grid-cols-2 md:items-center md:gap-10 md:pb-16 md:pt-12">
        <div>
          <p className="eyebrow text-pitch">{c.hero_eyebrow}</p>
          <h1 className="h-display mt-2 text-balance text-[3.4rem] md:text-7xl">{c.hero_headline}</h1>
          <p className="mt-4 max-w-md text-lg leading-snug">{c.hero_subheadline}</p>
          <ul className="mt-5 flex flex-wrap gap-2 text-xs font-extrabold uppercase">
            <li className="rounded-full border-2 border-ink bg-sun px-3 py-1">{gbp(fromPrice)} a shirt</li>
            <li className="rounded-full border-2 border-ink bg-chalk px-3 py-1">Min {min} shirts</li>
            <li className="rounded-full border-2 border-ink bg-chalk px-3 py-1">
              {freeFrom <= min ? "Free UK delivery" : `Free delivery ${freeFrom}+`}
            </li>
            <li className="rounded-full border-2 border-ink bg-chalk px-3 py-1">Arrives in {deliveryWindow}</li>
          </ul>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <CtaLink href="/build" location="hero" className="btn-primary text-lg">
              {c.hero_cta} →
            </CtaLink>
            <Link href="#designs" className="btn-ghost">
              See the designs
            </Link>
          </div>
          <p className="mt-4 text-sm text-mute">✓ {c.guarantee}</p>
        </div>
        <Lineup products={products} photoUrl={c.hero_image_url} photoAlt={c.hero_image_alt} />
      </section>

      {/* 2. How it works */}
      <section id="how-it-works" className="border-y-2 border-ink bg-chalk">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <h2 className="h-display text-4xl md:text-5xl">Sorted in three steps</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["How many of you?", `Pick your group size — ${min} or more. Tell us the stag date and we'll check delivery.`],
              ["Everyone gets a design", "Give each lad his own design and size. Different shirts, one collection. The Stag gets his own."],
              ["Pay once, one parcel", `Apple Pay, Google Pay or card. Printed to order and delivered in ${deliveryWindow}.`],
            ].map(([t, d], i) => (
              <li key={t} className="card p-5 shadow-hard-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-flare font-display text-xl">
                  {i + 1}
                </span>
                <h3 className="mt-3 text-lg font-extrabold">{t}</h3>
                <p className="mt-1 text-sm text-ink/80">{d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8">
            <CtaLink href="/build" location="how_it_works">{c.hero_cta} →</CtaLink>
          </div>
        </div>
      </section>

      {/* 3. Designs */}
      <section id="designs" className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <TrackOnView event="view_collection" props={{ list_id: "home", count: products.length }}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="h-display text-4xl md:text-5xl">The collection</h2>
              <p className="mt-1 text-ink/80">{products.length} designs. Every one different, all made to sit together.</p>
            </div>
            <Link href="/designs" className="hidden text-sm font-bold underline md:block">All designs</Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {products.map((p) => (
              <Link key={p.id} href={`/designs/${p.slug}`} className="card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-hard">
                <TeeArt name={p.name} color={p.accent_color} imageUrl={p.images[0]?.url ?? p.hero_image_url} className="aspect-square border-b-2 border-ink" />
                <div className="p-3">
                  <p className="font-extrabold leading-tight">{p.name}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-mute">{p.tagline}</p>
                </div>
              </Link>
            ))}
          </div>
        </TrackOnView>
      </section>

      {/* 4. Pricing */}
      <section className="border-y-2 border-ink bg-pitch text-chalk">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-2 md:py-16">
          <div>
            <h2 className="h-display text-4xl md:text-5xl">Simple group pricing</h2>
            <p className="mt-3 max-w-md text-chalk/85">
              {gbp(fromPrice)} a shirt, whatever the design. {freeFrom <= min ? "Free tracked UK delivery on every set." : `Free tracked UK delivery on ${freeFrom}+ shirts.`} The price you see in the builder is the price you pay.
            </p>
          </div>
          <div className="card overflow-hidden text-ink">
            <table className="w-full text-left">
              <thead className="border-b-2 border-ink bg-sun text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Group</th>
                  <th className="px-4 py-3">Delivery</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {priceRows.map(({ n, r }) => (
                  <tr key={n} className="border-b border-ink/15 last:border-0">
                    <td className="px-4 py-3 font-bold">{n} shirts</td>
                    <td className="px-4 py-3 text-sm">{r.shippingPence ? gbp(r.shippingPence) : "Free"}</td>
                    <td className="px-4 py-3 text-right font-extrabold">
                      {gbp(r.totalPence)}
                      {r.discountPence ? <span className="block text-xs font-bold text-pitch">{r.discounts[0]?.label}</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. Why different */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <h2 className="h-display text-4xl md:text-5xl">Not your average stag tee</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {c.why_points.map((w) => (
            <div key={w.title} className="card p-5">
              <h3 className="text-lg font-extrabold">{w.title}</h3>
              <p className="mt-1 text-sm text-ink/80">{w.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-mute">{c.garment_info}</p>
      </section>

      {/* 6. Delivery */}
      <section className="mx-auto max-w-6xl px-4 pb-12 md:pb-16">
        <div className="card grid gap-4 bg-sun p-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="h-display text-3xl">Got a date? We&apos;ll tell you if we can make it.</h2>
            <p className="mt-2 text-sm">{settings.delivery.headline}. Enter your stag date in the builder and we&apos;ll show your estimated delivery before you pay.</p>
          </div>
          <Link href="/delivery-returns" className="btn-ghost">Delivery &amp; returns</Link>
        </div>
      </section>

      {/* 7. Reviews — genuine only; hidden until we have some */}
      {reviews.length ? (
        <section className="mx-auto max-w-6xl px-4 pb-12 md:pb-16">
          <h2 className="h-display text-4xl">What stags said</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {reviews.slice(0, 6).map((r) => (
              <figure key={r.id} className="card p-5">
                <p aria-label={`${r.rating} out of 5`}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
                <blockquote className="mt-2 text-sm">{r.body}</blockquote>
                <figcaption className="mt-3 text-xs font-bold uppercase">
                  {r.author_name}
                  {r.verified ? " · Verified order" : ""}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {/* 8. FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-12 md:pb-16">
        <h2 className="h-display text-4xl">Questions</h2>
        <div className="mt-6">
          <Faqs faqs={faqs.slice(0, 7)} />
        </div>
        <Link href="/faq" className="mt-3 inline-block text-sm font-bold underline">More questions</Link>
      </section>

      {/* 9. Final CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24 md:pb-16">
        <div className="card bg-ink p-8 text-center text-paper shadow-hard md:p-12">
          <h2 className="h-display text-4xl md:text-6xl">{c.final_cta_headline}</h2>
          <p className="mx-auto mt-3 max-w-lg text-paper/80">{c.final_cta_body}</p>
          <CtaLink href="/build" location="final" className="btn-primary mt-6 text-lg">
            {c.hero_cta} →
          </CtaLink>
        </div>
      </section>

      <StickyCta label="Build set" summary={`${gbp(fromPrice)} a shirt · min ${min} · ${freeFrom <= min ? "free delivery" : "UK delivery"}`} />
    </>
  );
}
