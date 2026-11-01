import { CheckoutPageBody } from "./CheckoutPageBody";
import { getStorefrontContext } from "@/lib/store";
import { parseSizeFlow } from "@/components/builder/types";

export const metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const { settings, experiments } = await getStorefrontContext();
  return <CheckoutPageBody guarantee={settings.content.guarantee} sizesLater={parseSizeFlow(experiments.overrides.size_flow) === "pay_first"} />;
}
