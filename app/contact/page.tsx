import { getStorefrontContext } from "@/lib/store";
import { InfoPage } from "@/components/site/InfoPage";

export const metadata = {
  title: "Contact",
  description: "Questions about a stag set, a tight deadline or a big group? Get in touch.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const { settings } = await getStorefrontContext();
  const c = settings.contact;
  return (
    <InfoPage title="Contact">
      <p>Tight deadline, big group, or a question about sizing? Get in touch — a real person replies. {c.response_time}</p>
      <ul>
        <li>
          Email: <a className="underline" href={`mailto:${c.email}`}>{c.email}</a>
        </li>
        {c.phone ? <li>Phone: <a className="underline" href={`tel:${c.phone.replace(/\s/g, "")}`}>{c.phone}</a></li> : null}
        {c.whatsapp ? (
          <li>
            WhatsApp: <a className="underline" href={`https://wa.me/${c.whatsapp.replace(/[^\d]/g, "")}`}>{c.whatsapp}</a>
          </li>
        ) : null}
        {c.instagram ? <li>Instagram: {c.instagram}</li> : null}
      </ul>
      {c.company_name || c.business_address ? (
        <p className="text-sm text-mute">
          {c.company_name}
          {c.business_address ? `, ${c.business_address}` : ""}
        </p>
      ) : null}
    </InfoPage>
  );
}
