import Link from "next/link";
import { BRAND } from "@/lib/brand";
import type { BannerConfig, Offer } from "@/lib/types";
import { BasketButton } from "@/components/site/BasketButton";

export function SiteHeader({ offers }: { offers: Offer[] }) {
  const banner = offers.find((o) => o.kind === "banner");
  const cfg = banner?.config as BannerConfig | undefined;
  return (
    <>
      {cfg?.text ? (
        <div className="bg-ink px-4 py-2 text-center text-[13px] font-medium text-chalk">
          {cfg.link ? (
            <Link href={cfg.link} className="hover:underline">
              {cfg.text} <span aria-hidden>→</span>
            </Link>
          ) : (
            cfg.text
          )}
        </div>
      ) : null}
      <header className="glass sticky top-0 z-40 border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 md:h-16 md:px-6">
          <Link href="/" className="font-display text-[19px] font-extrabold tracking-[-0.04em] md:text-xl">
            {BRAND.name}
          </Link>
          <nav className="hidden items-center gap-8 text-[14px] font-medium text-ink/70 md:flex">
            <Link href="/designs" className="transition hover:text-ink">Designs</Link>
            <Link href="/#how-it-works" className="transition hover:text-ink">How it works</Link>
            <Link href="/delivery-returns" className="transition hover:text-ink">Delivery</Link>
            <Link href="/faq" className="transition hover:text-ink">FAQ</Link>
          </nav>
          <div className="flex items-center gap-2">
            <BasketButton />
            <Link href="/build" className="btn-primary hidden min-h-[40px] px-5 text-sm sm:inline-flex">
              Build your set
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
