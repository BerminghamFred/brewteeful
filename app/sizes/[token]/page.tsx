import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadSizesOrder, sizesEditable } from "@/lib/order-sizes";
import { getCatalogue, getStorefrontContext } from "@/lib/store";
import { hasServiceRole } from "@/lib/supabase/public";
import { SIZE_TBC } from "@/lib/sizes";
import { SizesForm } from "@/components/sizes/SizesForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Add your sizes", robots: { index: false, follow: false } };

export default async function SizesPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!hasServiceRole()) notFound();
  const [data, { products }, { settings }] = await Promise.all([loadSizesOrder(token), getCatalogue(), getStorefrontContext()]);
  if (!data) notFound();
  const byId = new Map(products.map((p) => [p.id, p]));
  const d = settings.delivery;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-8 md:pt-14">
      <p className="eyebrow">Order #{data.order.order_number}</p>
      <h1 className="h-display mt-2 text-[2.6rem] leading-[0.95] md:text-6xl">Add your size.</h1>
      <p className="mt-3 text-[16px] leading-relaxed text-ink/75">
        Your stag set is paid for. Find your shirt below and tap your size.{" "}
        <strong className="text-ink">Printing starts as soon as the last size is in</strong>, then it&apos;s {d.production_days_min + d.standard_days_min}–
        {d.production_days_max + d.standard_days_max} working days to arrive, so the sooner everyone&apos;s done, the sooner the shirts turn up.
      </p>
      <SizesForm
        token={token}
        sizes={settings.sizing.sizes}
        editable={sizesEditable(data.order)}
        alreadyComplete={Boolean(data.order.sizes_completed_at)}
        people={data.items.map((i) => {
          const p = i.product_id ? byId.get(i.product_id) : undefined;
          return {
            position: i.position,
            label: i.is_stag ? `★ The Stag${i.nickname ? ` (${i.nickname})` : ""}` : i.nickname || `Person ${i.position}`,
            design: i.product_name,
            size: i.size === SIZE_TBC ? null : i.size,
            artworkUrl: p?.artwork_url ?? null,
            imageUrl: p?.hero_image_url ?? null,
            color: p?.accent_color ?? "#d9d6cf",
          };
        })}
      />
    </div>
  );
}
