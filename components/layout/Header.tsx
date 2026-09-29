import Link from "next/link";
import { createClientOptional } from "@/lib/supabase/server";
import { CartIcon } from "./CartIcon";

export async function Header() {
  let floatingOffer: { enabled?: boolean; text?: string } = {
    enabled: true,
    text: "10% OFF TODAY — use code KICKOFF10",
  };
  const supabase = await createClientOptional();
  if (supabase) {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "floating_offer")
      .maybeSingle();
    if (data?.value) {
      floatingOffer = data.value as { enabled?: boolean; text?: string };
    }
  }

  return (
    <>
      {floatingOffer.enabled !== false && (
        <div className="bg-brand-accent px-4 py-2 text-center text-sm font-medium text-brand-dark">
          {floatingOffer.text ?? "10% OFF TODAY — use code KICKOFF10"}
        </div>
      )}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-brand-ink/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <Link
            href="/"
            className="font-display text-2xl tracking-tight text-white md:text-3xl"
          >
            BrewTeeFul
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/collection/all"
              className="text-sm font-medium text-white/80 transition hover:text-white"
            >
              Shop
            </Link>
            <Link
              href="/collection/drops"
              className="text-sm font-medium text-white/80 transition hover:text-white"
            >
              Drops
            </Link>
            <Link
              href="/#why"
              className="text-sm font-medium text-white/80 transition hover:text-white"
            >
              Why us
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/cart"
              className="relative flex items-center justify-center rounded-full border border-white/15 p-2 transition hover:border-brand-accent/60 hover:bg-white/5"
              aria-label="Cart"
            >
              <CartIcon />
            </Link>
            <Link
              href="/admin"
              className="hidden text-xs text-white/40 hover:text-white/70 sm:inline"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
