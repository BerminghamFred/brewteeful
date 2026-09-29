import { getStorefrontContext } from "@/lib/store";
import { InfoPage } from "@/components/site/InfoPage";
import { BRAND } from "@/lib/brand";

export const metadata = { title: "Privacy & Cookies", alternates: { canonical: "/privacy" } };

// Starting-point policy describing what the code actually does. Have it reviewed before launch.
export default async function PrivacyPage() {
  const { settings } = await getStorefrontContext();
  const c = settings.contact;
  return (
    <InfoPage title="Privacy & cookies">
      <p>
        {c.company_name || BRAND.name} (&quot;we&quot;) is the controller of the personal data described here. Contact:{" "}
        <a className="underline" href={`mailto:${c.email}`}>{c.email}</a>.
      </p>
      <h2>What we collect and why</h2>
      <ul>
        <li><strong>Orders:</strong> name, email, phone, delivery address and what you ordered — to make and deliver your order (contract) and keep accounting records (legal obligation).</li>
        <li><strong>Payments:</strong> handled by Stripe. We never see or store your card details.</li>
        <li><strong>Site usage:</strong> we record which pages you view and steps you take in the set builder, using a first-party cookie, to understand where our site works and doesn&apos;t (legitimate interests). This data stays with us.</li>
        <li><strong>Advertising &amp; analytics cookies (only if you accept):</strong> Google Analytics, Google Ads and Meta Pixel, used to measure which ads lead to orders and to show our ads to people who&apos;ve visited. If you accept marketing cookies, we also send Meta a scrambled (hashed) copy of your order contact details to match the sale to an ad.</li>
      </ul>
      <h2>Cookies we use</h2>
      <ul>
        <li><code>stg_vid</code>, <code>stg_sid</code> — first-party visit identifiers (13 months / 30 minutes).</li>
        <li><code>stg_consent</code> — remembers your cookie choice (6 months).</li>
        <li><code>_ga*</code>, <code>_gcl*</code> — Google Analytics / Ads, only with consent.</li>
        <li><code>_fbp</code>, <code>_fbc</code> — Meta, only with consent.</li>
      </ul>
      <p>You can change your choice at any time by clearing cookies for this site; the banner will ask again.</p>
      <h2>Who we share it with</h2>
      <p>Stripe (payments), our print and delivery partners (to fulfil your order), our hosting and database providers (Vercel, Supabase), and — only with consent — Google and Meta.</p>
      <h2>How long we keep it</h2>
      <p>Order records for 6 years (tax law). Site usage data for up to 26 months.</p>
      <h2>Your rights</h2>
      <p>You can ask for a copy of your data, to correct or delete it, or object to how we use it — email us. You can also complain to the ICO (ico.org.uk).</p>
    </InfoPage>
  );
}
