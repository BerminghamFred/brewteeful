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
        <div className="border-b-2 border-ink bg-sun px-4 py-2 text-center text-xs font-extrabold uppercase tracking-wide md:text-sm">
          {cfg.link ? <Link href={cfg.link}>{cfg.text}</Link> : cfg.text}
        </div>
      ) : null}
      <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 md:h-16">
          <Link href="/" className="font-display text-2xl uppercase tracking-tight md:text-3xl">
            {BRAND.name}
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-bold uppercase md:flex">
            <Link href="/designs" className="hover:text-flare">Designs</Link>
            <Link href="/#how-it-works" className="hover:text-flare">How it works</Link>
            <Link href="/delivery-returns" className="hover:text-flare">Delivery</Link>
            <Link href="/faq" className="hover:text-flare">FAQ</Link>
          </nav>
          <div className="flex items-center gap-2">
            <BasketButton />
            <Link href="/build" className="btn-dark hidden min-h-[40px] px-4 text-sm sm:inline-flex">
              Build your set
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
