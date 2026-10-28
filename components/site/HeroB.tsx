import Link from "next/link";
import { TeeArt } from "@/components/site/TeeArt";
import { CtaLink } from "@/components/site/CtaLink";
import { TrackOnView } from "@/components/site/TrackOnView";
import { KeepTogether } from "@/components/site/KeepTogether";
import type { ProductWithRelations } from "@/lib/types";

/**
 * Homepage variant B (experiment variable "homepage", home_layout = "b").
 * Built for ad traffic on a phone: the first screen says exactly what the ad said
 * (stag do T-shirts, price, delivery), shows the shirts big enough to judge, and has
 * one obvious next step.
 */
export function HeroB({
  products,
  price,
  min,
  deliveryWindow,
  freeDelivery,
  cta,
  headline,
}: {
  products: ProductWithRelations[];
  price: string;
  min: number;
  deliveryWindow: string;
  freeDelivery: boolean;
  cta: string;
  /** Same headline as A (content.hero_headline), so the test only compares layout. */
  headline: string;
}) {
  return (
    <section className="relative overflow-hidden bg-pitch text-chalk">
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-4 pb-2 pt-6 md:px-6 md:pt-14">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-chalk/60">Stag do T-shirts</p>
        <h1 className="h-display mt-2 max-w-3xl text-balance text-[2.5rem] leading-[0.95] md:text-[4.5rem]">
          <KeepTogether text={headline} />
        </h1>
        <p className="mt-3 text-[16px] text-chalk/80 md:text-lg">
          <strong className="text-chalk">{price} a shirt</strong> · min {min} · {freeDelivery ? "free UK delivery" : "UK delivery"} in {deliveryWindow}
        </p>
      </div>

      <TrackOnView event="view_collection" props={{ list_id: "home_b", count: products.length }}>
        <div className="no-scrollbar relative mx-auto mt-5 max-w-6xl snap-x snap-mandatory scroll-px-4 overflow-x-auto pb-2 md:scroll-px-6">
          <div className="flex w-max gap-3 px-4 md:gap-4 md:px-6">
          {products.map((p, i) => (
            <Link
              key={p.id}
              href={`/designs/${p.slug}`}
              className="w-[62vw] max-w-[280px] shrink-0 snap-start md:w-[240px]"
            >
              <TeeArt
                name={p.name}
                color={p.accent_color}
                imageUrl={p.images[0]?.url ?? p.hero_image_url}
                label={false}
                tone="dark"
                priority={i < 2}
                sizes="(max-width: 768px) 62vw, 240px"
                className="aspect-[4/5] rounded-2xl"
              />
              <p className="mt-2 font-semibold leading-tight">{p.name}</p>
              <p className="line-clamp-1 text-sm text-chalk/60">{p.tagline}</p>
            </Link>
          ))}
          <Link
            href="/designs"
            className="flex w-[40vw] max-w-[180px] shrink-0 snap-start items-center justify-center rounded-2xl border border-chalk/20 text-sm font-semibold text-chalk/80 md:w-[180px]"
          >
            See all →
          </Link>
          </div>
        </div>
      </TrackOnView>

      <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-5 md:px-6 md:pb-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <CtaLink href="/build" location="hero_b" className="btn h-14 w-full bg-chalk px-8 text-base text-ink hover:bg-sun sm:w-auto">
            {cta} <span aria-hidden>→</span>
          </CtaLink>
          <p className="text-sm text-chalk/70">Pick a design and size for each person. Takes 5 minutes.</p>
        </div>
        <ul className="mt-6 grid gap-2 text-sm text-chalk/85 sm:grid-cols-3">
          {[
            freeDelivery ? "Free tracked UK delivery" : "Tracked UK delivery",
            `Arrives in ${deliveryWindow}`,
            "Wrong or misprinted? Free reprint",
          ].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <span aria-hidden className="flex h-5 w-5 items-center justify-center rounded-full bg-chalk/15 text-[11px]">✓</span>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
