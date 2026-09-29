import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionClient } from "@/components/collection/CollectionClient";
import { listPublishedProducts } from "@/lib/data/products";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ size?: string; max?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const title = slug === "all" ? "All tees" : `${slug.charAt(0).toUpperCase()}${slug.slice(1)}`;
  return { title, description: `Shop BrewTeeFul ${title}.` };
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const allowed = ["all", "drops"];
  if (!allowed.includes(slug)) notFound();

  const products = await listPublishedProducts(slug === "all" ? undefined : slug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
      <h1 className="font-display text-5xl text-white md:text-6xl">
        {slug === "all" ? "All tees" : "Drops"}
      </h1>
      <p className="mt-2 text-white/55">
        Filter by size and price — built for mobile.
      </p>
      <CollectionClient products={products} initialSize={sp.size} initialMax={sp.max} />
    </div>
  );
}
