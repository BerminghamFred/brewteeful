import { getStorefrontContext } from "@/lib/store";
import { InfoPage } from "@/components/site/InfoPage";
import { gbp, deliveryWindowText } from "@/lib/format";

export const metadata = {
  title: "Delivery & Returns",
  description: "How long stag set delivery takes, what it costs, and our reprint guarantee.",
  alternates: { canonical: "/delivery-returns" },
};

export default async function DeliveryPage() {
  const { settings } = await getStorefrontContext();
  const d = settings.delivery;
  const p = settings.pricing;
  return (
    <InfoPage title="Delivery & returns">
      <h2>Delivery</h2>
      <p>{d.details}</p>
      <ul>
        <li>
          <strong>{d.standard_label}:</strong> arrives in {deliveryWindowText(d)} from order.{" "}
          {p.free_shipping_min_items <= p.min_group_size
            ? "Free on every set."
            : `${gbp(p.standard_shipping_pence)}, free on ${p.free_shipping_min_items}+ shirts.`}
        </li>
        {p.express_enabled ? (
          <li>
            <strong>{d.express_label}:</strong> {gbp(p.express_shipping_pence)} — arrives in about {d.production_days_min + d.express_days} working days.
          </li>
        ) : null}
        <li>UK mainland addresses only for now. Working days are Monday–Friday, excluding bank holidays.</li>
      </ul>
      <h2>Returns &amp; problems</h2>
      <p>{d.returns_policy}</p>
      <p>
        To start a return or report a problem, email <a className="underline" href={`mailto:${settings.contact.email}`}>{settings.contact.email}</a> with your order number. {settings.contact.response_time}
      </p>
    </InfoPage>
  );
}
