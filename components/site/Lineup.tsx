import Image from "next/image";
import { TeeArt } from "@/components/site/TeeArt";
import type { ProductWithRelations } from "@/lib/types";

/**
 * The core concept, visualised: a row of different shirts that belong together.
 * Uses the real group photo from settings as soon as there is one.
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
      <div className="card relative aspect-[4/3] overflow-hidden shadow-hard md:aspect-[16/10]">
        <Image src={photoUrl} alt={photoAlt ?? ""} fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
      </div>
    );
  }
  const row = products.slice(0, 8);
  return (
    <div className="card relative overflow-hidden bg-pitch p-3 shadow-hard md:p-5">
      <div className="grid grid-cols-4 gap-2 md:gap-3">
        {row.map((p, i) => (
          <div key={p.id} className="relative">
            <TeeArt
              name={p.name}
              color={p.accent_color}
              imageUrl={p.hero_image_url}
              label={false}
              priority={i < 4}
              sizes="(max-width: 768px) 25vw, 12vw"
              className="aspect-square rounded-xl border-2 border-ink"
            />
            <span className="mt-1 block truncate text-center text-[10px] font-bold uppercase text-chalk md:text-xs">
              {i === 0 ? "The Stag" : `Lad ${i + 1}`}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-xs font-bold uppercase tracking-widest text-sun">
        8 lads · 8 designs · 1 collection
      </p>
    </div>
  );
}
