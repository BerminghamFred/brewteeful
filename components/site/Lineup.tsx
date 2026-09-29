import Image from "next/image";
import Link from "next/link";
import { TeeArt } from "@/components/site/TeeArt";
import type { ProductWithRelations } from "@/lib/types";

/**
 * The core concept, visualised: a row of different shirts that belong together.
 * Uses the real group photo from settings as soon as there is one. Tiles expand on
 * hover (towards the centre, so edge tiles stay inside the panel) and link to the design.
 */
export function Lineup({
  products,
  photoUrl,
  photoAlt,
}: {
  products: ProductWithRelations[];
  photoUrl?: string;
  photoAlt?: string;
}) {
  if (photoUrl) {
    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] shadow-lift md:aspect-[5/4]">
        <Image src={photoUrl} alt={photoAlt ?? ""} fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
      </div>
    );
  }
  const row = products.slice(0, 8);
  return (
    <div className="relative overflow-hidden rounded-[28px] bg-pitch p-4 shadow-lift md:p-6">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="relative flex items-center justify-between text-[12px] font-medium text-chalk/70">
        <span>The lineup</span>
        <span>{row.length} shirts · {row.length} designs</span>
      </div>
      <div className="relative mt-4 grid grid-cols-4 gap-2.5 md:gap-3 [&:hover>*:not(:hover)]:opacity-60">
        {row.map((p, i) => {
          const col = i % 4;
          const originX = col === 0 ? "left" : col === 3 ? "right" : "center";
          const originY = i < 4 ? "top" : "bottom";
          return (
            <Link
              key={p.id}
              href={`/designs/${p.slug}`}
              style={{ transformOrigin: `${originY} ${originX}` }}
              className="group/tile relative z-0 block rounded-2xl transition duration-300 ease-out hover:z-10 hover:scale-150 hover:bg-pitch hover:shadow-2xl hover:ring-[6px] hover:ring-pitch focus-visible:z-10 focus-visible:scale-150 focus-visible:bg-pitch focus-visible:outline-none focus-visible:ring-[6px] focus-visible:ring-pitch motion-reduce:transition-none"
            >
              <figure>
                <TeeArt
                  name={p.name}
                  color={p.accent_color}
                  imageUrl={p.hero_image_url}
                  label={false}
                  tone="dark"
                  priority={i < 4}
                  sizes="(max-width: 768px) 40vw, 20vw"
                  className="aspect-[4/5] rounded-2xl"
                />
                <figcaption className="mt-1.5 truncate text-center text-[10px] font-medium text-chalk/70 transition-colors group-hover/tile:text-chalk md:text-[11px]">
                  {p.slug === "the-stag" ? "★ The Stag" : p.name}
                </figcaption>
              </figure>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
