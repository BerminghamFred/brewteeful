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
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 -top-40 h-[480px] bg-[radial-gradient(60%_60%_at_70%_30%,rgba(15,59,44,0.10),transparent)]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-14 pt-8 md:grid-cols-[1.05fr_1fr] md:items-center md:gap-14 md:px-6 md:pb-24 md:pt-16">
          <div>
            <p className="chip border-pitch/15 bg-pitch/[0.06] text-pitch">
              <span className="h-1.5 w-1.5 rounded-full bg-flare" /> {c.hero_eyebrow}
            </p>
            <h1 className="h-display mt-5 text-balance text-[3.25rem] md:text-[5.25rem]">{c.hero_headline}</h1>
            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-ink/70 md:text-lg">{c.hero_subheadline}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CtaLink href="/build" location="hero" className="btn-primary h-14 px-8 text-base">
                {c.hero_cta} <span aria-hidden>→</span>
              </CtaLink>
              <Link href="#designs" className="btn-ghost h-14 px-8 text-base">
                See the designs
              </Link>
            </div>
            <dl className="mt-8 grid max-w-md grid-cols-3 divide-x divide-ink/10 border-t border-ink/10 pt-5 text-sm">
              <div className="pr-3">
                <dt className="text-mute">From</dt>
                <dd className="mt-0.5 font-semibold">{gbp(fromPrice)} a shirt</dd>
              </div>
              <div className="px-3">
                <dt className="text-mute">Minimum</dt>
                <dd className="mt-0.5 font-semibold">{min} shirts</dd>
              </div>
              <div className="pl-3">
                <dt className="text-mute">{freeFrom <= min ? "Free delivery" : `Free ${freeFrom}+`}</dt>
                <dd className="mt-0.5 font-semibold">{deliveryWindow}</dd>
              </div>
            </dl>
          </div>
          <Lineup products={products} photoUrl={c.hero_image_url} photoAlt={c.hero_image_alt} />
        </div>
      </section>

      {/* 2. How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 md:px-6 md:py-24">
        <p className="eyebrow">How it works</p>
        <h2 className="h-display mt-3 max-w-xl text-4xl md:text-5xl">Sorted in five minutes.</h2>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            ["How many of you?", `Pick your group size — ${min} or more. Add the stag date and we'll check delivery.`],
            ["Everyone gets a design", "Give everyone their own design and size. Different shirts, one collection. The Stag gets his own."],
            ["Pay once, one parcel", `Apple Pay, Google Pay or card. Printed to order and delivered in ${deliveryWindow}.`],
          ].map(([t, d], i) => (
            <li key={t} className="card p-6 md:p-7">
              <span className="font-display text-sm font-bold text-flare">0{i + 1}</span>
              <h3 className="mt-6 text-xl font-semibold tracking-tight">{t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink/65">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 3. Designs */}
      <section id="designs" className="scroll-mt-20 bg-chalk py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <TrackOnView event="view_collection" props={{ list_id: "home", count: products.length }}>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">The collection</p>
                <h2 className="h-display mt-3 text-4xl md:text-5xl">{products.length} designs. One lineup.</h2>
              </div>
              <Link href="/designs" className="hidden text-sm font-medium text-ink/70 hover:text-ink md:block">View all →</Link>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6">
              {products.map((p) => (
                <Link key={p.id} href={`/designs/${p.slug}`} className="group">
                  <TeeArt
                    name={p.name}
                    color={p.accent_color}
                    imageUrl={p.images[0]?.url ?? p.hero_image_url}
                    className="aspect-[4/5] rounded-2xl transition duration-300 group-hover:scale-[1.015]"
                  />
                  <p className="mt-3 font-medium leading-tight">{p.name}</p>
                  <p className="mt-0.5 line-clamp-1 text-sm text-mute">{p.tagline}</p>
                </Link>
              ))}
            </div>
          </TrackOnView>
        </div>
      </section>

      {/* 4. Pricing */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <div className="grid gap-10 overflow-hidden rounded-[32px] bg-ink p-8 text-chalk md:grid-cols-2 md:p-14">
          <div>
            <p className="eyebrow text-chalk/50">Pricing</p>
            <h2 className="h-display mt-3 text-4xl md:text-5xl">One price. Every design.</h2>
            <p className="mt-4 max-w-md leading-relaxed text-chalk/65">
              {gbp(fromPrice)} a shirt, whatever the design.{" "}
              {freeFrom <= min ? "Free tracked UK delivery on every set." : `Free tracked UK delivery on ${freeFrom}+ shirts.`} The price in the builder is the price you pay.
            </p>
            <CtaLink href="/build" location="pricing" className="btn mt-8 bg-chalk text-ink hover:bg-sun">
              {c.hero_cta} <span aria-hidden>→</span>
            </CtaLink>
          </div>
          <div className="self-center">
            <table className="w-full text-left">
              <thead className="text-[12px] uppercase tracking-[0.12em] text-chalk/40">
                <tr>
                  <th className="pb-3 font-medium">Group</th>
                  <th className="pb-3 font-medium">Delivery</th>
                  <th className="pb-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {priceRows.map(({ n, r }) => (
                  <tr key={n} className="border-t border-chalk/10">
                    <td className="py-4 font-medium">{n} shirts</td>
                    <td className="py-4 text-chalk/60">{r.shippingPence ? gbp(r.shippingPence) : "Free"}</td>
                    <td className="py-4 text-right text-lg font-semibold tabular-nums">
                      {gbp(r.totalPence)}
                      {r.discountPence ? <span className="block text-xs font-medium text-flare">{r.discounts[0]?.label}</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. Why different */}
      <section className="mx-auto max-w-6xl px-4 md:px-6">
        <p className="eyebrow">Why us</p>
        <h2 className="h-display mt-3 max-w-2xl text-4xl md:text-5xl">Not your average stag tee.</h2>
        <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2">
          {c.why_points.map((w, i) => (
            <div key={w.title} className="flex gap-4 border-t border-ink/10 pt-6">
              <span className="font-display text-sm font-bold text-mute">0{i + 1}</span>
              <div>
                <h3 className="text-lg font-semibold tracking-tight">{w.title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-ink/65">{w.body}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-mute">{c.garment_info}</p>
      </section>

      {/* 6. Delivery */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <div className="card flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-10">
          <div className="max-w-2xl">
            <h2 className="h-display text-3xl md:text-4xl">Got a date? We&apos;ll tell you if we can make it.</h2>
            <p className="mt-3 leading-relaxed text-ink/65">
              {settings.delivery.headline}. Enter your stag date in the builder and you&apos;ll see your estimated delivery before you pay. {c.guarantee}
            </p>
          </div>
          <Link href="/delivery-returns" className="btn-ghost shrink-0">Delivery &amp; returns</Link>
        </div>
      </section>

      {/* 7. Reviews — genuine only; hidden until we have some */}
      {reviews.length ? (
        <section className="mx-auto max-w-6xl px-4 pb-16 md:px-6 md:pb-24">
          <p className="eyebrow">Reviews</p>
          <h2 className="h-display mt-3 text-4xl">What stags said.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {reviews.slice(0, 6).map((r) => (
              <figure key={r.id} className="card p-6">
                <p aria-label={`${r.rating} out of 5`} className="text-flare">{"★".repeat(r.rating)}<span className="text-ink/15">{"★".repeat(5 - r.rating)}</span></p>
                <blockquote className="mt-3 leading-relaxed">{r.body}</blockquote>
                <figcaption className="mt-4 text-sm text-mute">
                  {r.author_name}
                  {r.verified ? " · Verified order" : ""}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {/* 8. FAQ */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 md:grid-cols-[1fr_1.6fr] md:px-6 md:pb-24">
        <div>
          <p className="eyebrow">FAQ</p>
          <h2 className="h-display mt-3 text-4xl">Questions.</h2>
          <Link href="/faq" className="mt-4 inline-block text-sm font-medium text-ink/70 hover:text-ink">All questions →</Link>
        </div>
        <Faqs faqs={faqs.slice(0, 7)} />
      </section>

      {/* 9. Final CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24 md:px-6 md:pb-8">
        <div className="relative overflow-hidden rounded-[32px] bg-pitch px-8 py-14 text-center text-chalk md:py-20">
          <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[600px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
          <h2 className="h-display relative mx-auto max-w-2xl text-4xl md:text-6xl">{c.final_cta_headline}</h2>
          <p className="relative mx-auto mt-4 max-w-lg leading-relaxed text-chalk/70">{c.final_cta_body}</p>
          <CtaLink href="/build" location="final" className="btn relative mt-8 h-14 bg-chalk px-8 text-base text-ink hover:bg-sun">
            {c.hero_cta} <span aria-hidden>→</span>
          </CtaLink>
        </div>
      </section>

      <StickyCta label="Build set" summary={`${gbp(fromPrice)} a shirt · min ${min} · ${freeFrom <= min ? "free delivery" : "UK delivery"}`} />
    </>
  );
}
