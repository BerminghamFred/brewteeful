import { Basket } from "@/components/basket/Basket";
import { getBuilderConfig } from "@/lib/builder-config";
import { getStorefrontContext } from "@/lib/store";

export const metadata = { title: "Your set", robots: { index: false } };

export default async function BasketPage() {
  const [cfg, { settings }] = await Promise.all([getBuilderConfig(), getStorefrontContext()]);
  return <Basket cfg={cfg} guarantee={settings.content.guarantee} />;
}
