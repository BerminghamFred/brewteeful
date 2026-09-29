import Link from "next/link";
import { EmailCapture } from "@/components/email/EmailCapture";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-brand-ink">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="mb-10 rounded-2xl border border-white/10 bg-brand-concrete/30 p-6 md:p-8">
          <p className="font-display text-2xl text-white">Get the drop first</p>
          <p className="mt-1 text-sm text-white/55">
            Email list — Klaviyo-ready endpoint. No spam.
          </p>
          <div className="mt-4">
            <EmailCapture />
          </div>
        </div>
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="font-display text-2xl text-white">BrewTeeFul</p>
            <p className="mt-2 max-w-sm text-sm text-white/55">
              Football culture, reimagined. Premium tees inspired by UK street
              culture and the terraces.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
              Shop
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/collection/all" className="text-white/70 hover:text-white">
                  All tees
                </Link>
              </li>
              <li>
                <Link href="/collection/drops" className="text-white/70 hover:text-white">
                  Limited drops
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
              Legal
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <span className="text-white/55">UK shipping · Secure checkout</span>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-white/35">
          © {new Date().getFullYear()} BrewTeeFul. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
