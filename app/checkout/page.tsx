import { CheckoutPageBody } from "./CheckoutPageBody";
import { getStorefrontContext } from "@/lib/store";
import { parseSizeFlow } from "@/components/builder/types";
import { BRAND } from "@/lib/brand";

export const metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const { settings, experiments } = await getStorefrontContext();
  const c = settings.contact;
  return (
    <CheckoutPageBody
      guarantee={settings.content.guarantee}
      sizesLater={parseSizeFlow(experiments.overrides.size_flow) === "pay_first"}
      delivery={settings.delivery}
      freeDelivery={settings.pricing.free_shipping_min_items <= 1}
      company={{
        name: c.company_name || BRAND.legalName,
        registration: c.company_registration,
        email: c.email,
      }}
    />
  );
}
