import Link from "next/link";
import { BRAND } from "@/lib/brand";
import type { ContactSettings } from "@/lib/settings";

export function SiteFooter({ contact }: { contact: ContactSettings }) {
  return (
    <footer className="mt-20 bg-ink text-chalk">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4 md:px-6">
        <div className="md:col-span-2">
          <p className="font-display text-2xl font-extrabold tracking-[-0.04em]">{BRAND.name}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-chalk/60">
            {BRAND.tagline} Coordinated stag-do T-shirt sets, printed to order in the UK.
          </p>
          <p className="mt-6 text-sm">
            <a href={`mailto:${contact.email}`} className="text-chalk/90 hover:text-chalk">{contact.email}</a>
            {contact.phone ? <span className="text-chalk/60"> · {contact.phone}</span> : null}
          </p>
          <p className="mt-1 text-xs text-chalk/50">{contact.response_time}</p>
        </div>
        <nav className="flex flex-col gap-2.5 text-sm text-chalk/70">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-chalk/40">Shop</p>
          <Link href="/build" className="hover:text-chalk">Build your set</Link>
          <Link href="/designs" className="hover:text-chalk">All designs</Link>
          <Link href="/size-guide" className="hover:text-chalk">Size guide</Link>
          <Link href="/faq" className="hover:text-chalk">FAQ</Link>
        </nav>
        <nav className="flex flex-col gap-2.5 text-sm text-chalk/70">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-chalk/40">Help</p>
          <Link href="/delivery-returns" className="hover:text-chalk">Delivery &amp; returns</Link>
          <Link href="/contact" className="hover:text-chalk">Contact</Link>
          <Link href="/privacy" className="hover:text-chalk">Privacy &amp; cookies</Link>
          <Link href="/terms" className="hover:text-chalk">Terms</Link>
        </nav>
      </div>
      <div className="border-t border-chalk/10 px-4 py-5 text-center text-xs text-chalk/40">
        © {new Date().getFullYear()} {contact.company_name || BRAND.legalName}
        {contact.business_address ? ` · ${contact.business_address}` : ""} · Secure payments by Stripe
      </div>
    </footer>
  );
}
