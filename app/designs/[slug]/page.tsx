import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCatalogue, getProductBySlug, getStorefrontContext } from "@/lib/store";
import { TeeArt } from "@/components/site/TeeArt";
import { TrackOnView } from "@/components/site/TrackOnView";
import { CtaLink } from "@/components/site/CtaLink";
import { JsonLd } from "@/components/site/JsonLd";
import { gbp, deliveryWindowText } from "@/lib/format";
import { BRAND, absoluteUrl } from "@/lib/brand";

export async function generateStaticParams() {
  const { products } = await getCatalogue();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return {};
  return {
    title: p.seo_title ?? `${p.name} Stag Do T-Shirt`,
    description: p.seo_description ?? `${p.tagline ?? ""} Part of a coordinated stag set — a different design for every lad.`.trim(),
    alternates: { canonical: `/designs/${p.slug}` },
    openGraph: { images: p.hero_image_url ? [p.hero_image_url] : undefined },
  };
}

export default async function DesignPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [p, { products }, { settings, experiments }] = await Promise.all([getProductBySlug(slug), getCatalogue(), getStorefrontContext()]);
  if (!p) notFound();
  const price = experiments.overrides.unit_price_pence ?? p.price_pence;
  const images = p.images.length ? p.images : p.hero_image_url ? [{ id: "hero", url: p.hero_image_url, alt: p.name }] : [];
  const others = products.filter((x) => x.slug !== p.slug).slice(0, 4);
  const url = absoluteUrl(`/designs/${p.slug}`);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 md:px-6 md:pt-14">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: `${p.name} T-Shirt`,
            description: p.description ?? p.tagline,
            image: images.map((i) => i.url),
            sku: p.slug,
            brand: { "@type": "Brand", name: BRAND.name },
            offers: {
              "@type": "Offer",
              url,
              priceCurrency: "GBP",
              price: (price / 100).toFixed(2),
              availability: "https://schema.org/InStock",
              itemCondition: "https://schema.org/NewCondition",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
              { "@type": "ListItem", position: 2, name: "Designs", item: absoluteUrl("/designs") },
              { "@type": "ListItem", position: 3, name: p.name, item: url },
            ],
          },
        ]}
      />
      <TrackOnView
        event="view_item"
        immediate
        props={{ item_id: p.slug }}
        value={price / 100}
        items={[{ item_id: p.slug, item_name: p.name, price: price / 100, quantity: 1 }]}
      />
      <nav className="text-[13px] text-mute" aria-label="Breadcrumb">
        <Link href="/">Home</Link> / <Link href="/designs">Designs</Link> / {p.name}
      </nav>
      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <div>
          {images.length ? (
            <>
              <TeeArt name={images[0]!.alt ?? p.name} color={p.accent_color} imageUrl={images[0]!.url} priority sizes="(max-width: 768px) 100vw, 50vw" className="aspect-square rounded-[28px] border border-ink/[0.06]" />
              {images.length > 1 ? (
                <div className="no-scrollbar -mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
                  {images.slice(1).map((img) => (
                    <TeeArt key={img.id} name={img.alt ?? p.name} color={p.accent_color} imageUrl={img.url} sizes="(max-width: 768px) 40vw, 12vw" className="aspect-square w-[40%] shrink-0 snap-start rounded-2xl border border-ink/[0.06] md:w-auto" />
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <TeeArt name={p.name} color={p.accent_color} priority sizes="(max-width: 768px) 100vw, 50vw" className="aspect-square rounded-[28px]" />
          )}
        </div>
        <div className="md:sticky md:top-24 md:self-start">
          <h1 className="h-display text-5xl md:text-6xl">{p.name}</h1>
          <p className="mt-3 text-lg text-ink/65">{p.tagline}</p>
          <p className="mt-3 text-2xl font-semibold">
            {gbp(price)}
            {p.compare_at_price_pence && p.compare_at_price_pence > price ? (
              <s className="ml-2 text-base font-bold text-mute">{gbp(p.compare_at_price_pence)}</s>
            ) : null}
            <span className="ml-2 text-sm font-normal text-mute">per shirt · min {settings.pricing.min_group_size} in a set</span>
          </p>
          <p className="mt-4 leading-relaxed text-ink/85">{p.description}</p>
          <CtaLink href={`/build?design=${p.slug}`} location="design_page" className="btn-primary mt-6 w-full text-lg md:w-auto">
            Start a set with this design →
          </CtaLink>
          <ul className="mt-6 space-y-2 text-sm">
            <li>✓ Mix with any other design in the collection</li>
            <li>✓ Sizes {settings.sizing.sizes[0]}–{settings.sizing.sizes[settings.sizing.sizes.length - 1]} · <Link href="/size-guide" className="underline">Size guide</Link></li>
            <li>✓ Printed to order, arrives in {deliveryWindowText(settings.delivery)}</li>
            <li>✓ {settings.content.guarantee}</li>
          </ul>
          <p className="mt-4 text-xs text-mute">{settings.content.garment_info}</p>
        </div>
      </div>

      <h2 className="h-display mt-14 text-3xl">Pairs well with</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {others.map((o) => (
          <Link key={o.id} href={`/designs/${o.slug}`} className="card overflow-hidden">
            <TeeArt name={o.name} color={o.accent_color} imageUrl={o.images[0]?.url ?? o.hero_image_url} className="aspect-square border-b border-ink/10" />
            <p className="p-3 font-semibold">{o.name}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
