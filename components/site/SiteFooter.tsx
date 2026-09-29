import Link from "next/link";
import { BRAND } from "@/lib/brand";
import type { ContactSettings } from "@/lib/settings";

export function SiteFooter({ contact }: { contact: ContactSettings }) {
  return (
    <footer className="mt-16 border-t-2 border-ink bg-ink text-paper">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-3xl uppercase">{BRAND.name}</p>
          <p className="mt-2 max-w-sm text-sm text-paper/70">{BRAND.tagline} Coordinated stag-do T-shirt sets, printed to order in the UK.</p>
          <p className="mt-4 text-sm">
            <a href={`mailto:${contact.email}`} className="underline">{contact.email}</a>
            {contact.phone ? <> · {contact.phone}</> : null}
          </p>
          <p className="mt-1 text-xs text-paper/60">{contact.response_time}</p>
        </div>
        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/build">Build your set</Link>
          <Link href="/designs">All designs</Link>
          <Link href="/size-guide">Size guide</Link>
          <Link href="/faq">FAQ</Link>
        </nav>
        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/delivery-returns">Delivery &amp; returns</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/privacy">Privacy &amp; cookies</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </div>
      <div className="border-t border-paper/15 px-4 py-4 text-center text-xs text-paper/60">
        © {new Date().getFullYear()} {contact.company_name || BRAND.legalName}
        {contact.business_address ? ` · ${contact.business_address}` : ""} · Secure payments by Stripe
      </div>
    </footer>
  );
}
