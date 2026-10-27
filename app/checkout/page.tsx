import { CheckoutPageBody } from "./CheckoutPageBody";
import { getStorefrontContext } from "@/lib/store";

export const metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const { settings } = await getStorefrontContext();
  return <CheckoutPageBody guarantee={settings.content.guarantee} />;
}
