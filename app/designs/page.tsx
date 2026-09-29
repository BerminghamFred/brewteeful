import Link from "next/link";
import { getCatalogue, getStorefrontContext } from "@/lib/store";
import { TeeArt } from "@/components/site/TeeArt";
import { TrackOnView } from "@/components/site/TrackOnView";
import { CtaLink } from "@/components/site/CtaLink";
import { gbp } from "@/lib/format";

export const metadata = {
  title: "Stag Do T-Shirt Designs",
  description: "Every design in the collection. Give each lad a different one — they're made to look great together.",
  alternates: { canonical: "/designs" },
};

export default async function DesignsPage() {
  const [{ products }, { experiments, settings }] = await Promise.all([getCatalogue(), getStorefrontContext()]);
  const override = experiments.overrides.unit_price_pence;
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 md:px-6 md:pt-14">
      <nav className="text-[13px] text-mute" aria-label="Breadcrumb">
        <Link href="/">Home</Link> / Designs
      </nav>
      <h1 className="h-display mt-2 text-5xl md:text-6xl">The designs</h1>
      <p className="mt-2 max-w-xl text-ink/80">
        Pick a different one for every lad in the group (minimum {settings.pricing.min_group_size}). The Stag gets his own.
      </p>
      <TrackOnView event="view_collection" props={{ list_id: "designs", count: products.length }} immediate>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {products.map((p) => (
            <Link key={p.id} href={`/designs/${p.slug}`} className="card overflow-hidden transition hover:-translate-y-0.5 hover:shadow-soft">
              <TeeArt name={p.name} color={p.accent_color} imageUrl={p.images[0]?.url ?? p.hero_image_url} className="aspect-square border-b border-ink/10" />
              <div className="p-3">
                <p className="font-semibold leading-tight">{p.name}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-mute">{p.tagline}</p>
                <p className="mt-1 text-sm font-bold">{gbp(override ?? p.price_pence)}</p>
              </div>
            </Link>
          ))}
        </div>
      </TrackOnView>
      <div className="mt-10 text-center">
        <CtaLink href="/build" location="designs_page">Build your stag set →</CtaLink>
      </div>
    </div>
  );
}
