import Image from "next/image";
import Link from "next/link";
import { TrackOnView } from "@/components/site/TrackOnView";
import type { ProductWithRelations } from "@/lib/types";

/** On-model photos live at /designs/<slug>/model/… */
export const isModelShot = (url: string) => url.includes("/model/");

/**
 * "How they look on": the on-model shots, so visitors can judge size, placement and
 * how the print reads when worn. Hidden until at least two designs have one.
 */
export function OnModel({ products }: { products: ProductWithRelations[] }) {
  const shots = products.flatMap((p) => {
    const img = p.images.find((i) => isModelShot(i.url));
    return img ? [{ p, img }] : [];
  });
  if (shots.length < 2) return null;
  return (
    <section className="py-12 md:py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <p className="eyebrow">On the back</p>
        <h2 className="h-display mt-3 max-w-xl text-4xl md:text-5xl">How they look on.</h2>
        <p className="mt-3 max-w-lg text-[15px] text-ink/65">
          A big print on the back, and a different design for everyone. Tap one to see it up close.
        </p>
      </div>
      <TrackOnView event="view_collection" props={{ list_id: "on_model", count: shots.length }}>
        <div className="no-scrollbar mx-auto mt-6 max-w-6xl snap-x snap-mandatory scroll-px-4 overflow-x-auto pb-2 md:scroll-px-6">
          <div className="flex w-max gap-3 px-4 md:gap-4 md:px-6">
            {shots.map(({ p, img }) => (
              <Link key={p.id} href={`/designs/${p.slug}`} className="w-[70vw] max-w-[300px] shrink-0 snap-start md:w-[260px]">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#efede7]">
                  <Image src={img.url} alt={img.alt ?? `${p.name} T-shirt shown on model`} fill sizes="(max-width: 768px) 70vw, 260px" className="object-cover" />
                </div>
                <p className="mt-2 font-semibold leading-tight">{p.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </TrackOnView>
      <p className="mx-auto mt-2 max-w-6xl px-4 text-xs text-ink/45 md:px-6">Shown on model.</p>
    </section>
  );
}
