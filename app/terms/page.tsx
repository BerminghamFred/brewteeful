import { getStorefrontContext } from "@/lib/store";
import { InfoPage } from "@/components/site/InfoPage";
import { BRAND } from "@/lib/brand";

export const metadata = { title: "Terms", alternates: { canonical: "/terms" } };

// Starting-point terms reflecting how the shop works. Have them reviewed before launch.
export default async function TermsPage() {
  const { settings } = await getStorefrontContext();
  const c = settings.contact;
  return (
    <InfoPage title="Terms of sale">
      <p>
        These terms apply to orders placed with {c.company_name || BRAND.name}
        {c.business_address ? `, ${c.business_address}` : ""}. Contact: <a className="underline" href={`mailto:${c.email}`}>{c.email}</a>.
      </p>
      <h2>Orders</h2>
      <p>Sets have a minimum of {settings.pricing.min_group_size} shirts. Your order is accepted when payment is taken and you receive a confirmation. Prices are shown in GBP and include any applicable taxes. The total shown before payment is the total you pay.</p>
      <h2>Printing &amp; delivery</h2>
      <p>{settings.delivery.details} Delivery estimates are estimates; if we can&apos;t deliver within 30 days we&apos;ll refund you in full.</p>
      <h2>Changes &amp; cancellations</h2>
      <p>You can change sizes or designs, or cancel for a full refund, within 24 hours of ordering or before your order goes to print, whichever is sooner.</p>
      <h2>Your right to return</h2>
      <p>{settings.delivery.returns_policy} This doesn&apos;t affect your statutory rights under the Consumer Rights Act 2015 and the Consumer Contracts Regulations 2013.</p>
      <h2>Designs</h2>
      <p>All artwork is original. Designs are inspired by football culture and are not affiliated with or endorsed by any club, league or player.</p>
    </InfoPage>
  );
}
