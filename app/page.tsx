import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProductCard } from "@/components/product/ProductCard";
import { CountdownStrip } from "@/components/conversion/CountdownStrip";
import { listPublishedProducts } from "@/lib/data/products";
import { getHomeHeroExperiment } from "@/lib/experiments";
import { createClientOptional } from "@/lib/supabase/server";

export default async function HomePage() {
  const [hero, products, settings] = await Promise.all([
    getHomeHeroExperiment(),
    listPublishedProducts("all"),
    (async () => {
      const sb = await createClientOptional();
      if (!sb) return null;
      const { data } = await sb
        .from("site_settings")
        .select("key, value")
        .in("key", ["countdown", "floating_offer"]);
      return data;
    })(),
  ]);

  const featured = products.slice(0, 4);
  const countdown = settings?.find((s) => s.key === "countdown")?.value as
    | { enabled?: boolean; endIso?: string; label?: string }
    | undefined;

  return (
    <>
      <CountdownStrip settings={countdown} />
      <section className="relative min-h-[88vh] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1920&q=85"
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/70 to-brand-dark/30" />
        <div className="relative z-10 mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-end px-4 pb-20 pt-32 md:px-6 md:pb-28">
          <Badge className="mb-4 w-fit">New season · Limited runs</Badge>
          <h1 className="font-display text-5xl leading-[0.95] text-white md:text-7xl lg:text-8xl">
            {hero.headline}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/85 md:text-xl">
            {hero.sub}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button href="/collection/all" variant="primary">
              Shop now
            </Button>
            <Button href="/collection/drops" variant="secondary">
              View drops
            </Button>
          </div>
          <p className="mt-10 text-sm text-white/55">
            ⭐️⭐️⭐️⭐️⭐️ Trusted by 1,000+ fans · Fast UK shipping
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-4xl text-white md:text-5xl">
              Featured
            </h2>
            <p className="mt-2 text-white/55">
              Premium cotton. Street silhouettes. No filler.
            </p>
          </div>
          <Link
            href="/collection/all"
            className="text-sm font-semibold text-brand-accent hover:underline"
          >
            Shop all →
          </Link>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section id="why" className="border-y border-white/10 bg-brand-concrete/50">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
          <h2 className="font-display text-4xl text-white md:text-5xl">
            Why BrewTeeFul
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              {
                t: "Premium cotton",
                d: "Heavyweight blanks with a soft hand — made to survive washes and weekends.",
              },
              {
                t: "Fast UK shipping",
                d: "Dispatched quickly. Track your pack from our door to your doorstep.",
              },
              {
                t: "Unique designs",
                d: "Limited runs inspired by terraces, graffiti, and UK street culture.",
              },
            ].map((x) => (
              <div key={x.t} className="rounded-2xl border border-white/10 bg-brand-ink/40 p-6">
                <h3 className="font-display text-2xl text-brand-accent">{x.t}</h3>
                <p className="mt-2 text-sm text-white/65">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <h2 className="font-display text-4xl text-white md:text-5xl">On the street</h2>
        <p className="mt-2 text-white/55">Real fans. Real fits.</p>
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {[
            "photo-1521572163474-6864f9cf17ab",
            "photo-1576566588028-4147f3842f27",
            "photo-1503341504253-dff4815485f1",
            "photo-1583743814966-8936f5b7be1a",
          ].map((id) => (
            <div
              key={id}
              className="relative aspect-[3/4] overflow-hidden rounded-xl border border-white/10"
            >
              <Image
                src={`https://images.unsplash.com/${id}?w=600&q=80`}
                alt="Customer style"
                fill
                className="object-cover transition hover:scale-105"
                sizes="(max-width:768px) 50vw, 25vw"
              />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
