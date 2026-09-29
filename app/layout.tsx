import type { Metadata, Viewport } from "next";
import { Anton, Inter } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/brand";
import { getStorefrontContext } from "@/lib/store";
import { Chrome } from "@/components/site/Chrome";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { OfferWidgets } from "@/components/site/OfferWidgets";
import { Tracking } from "@/components/tracking/Tracking";

const display = Anton({ weight: "400", subsets: ["latin"], variable: "--font-display", display: "swap" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getStorefrontContext();
  return {
    metadataBase: new URL(BRAND.siteUrl),
    title: { default: `${settings.seo.default_title} | ${BRAND.name}`, template: `%s | ${BRAND.name}` },
    description: settings.seo.default_description,
    openGraph: {
      type: "website",
      locale: BRAND.locale,
      siteName: BRAND.name,
      images: settings.seo.og_image_url ? [settings.seo.og_image_url] : undefined,
    },
    robots: process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production" ? { index: false } : undefined,
  };
}

export const viewport: Viewport = { themeColor: "#f4eee3", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { settings, offers } = await getStorefrontContext();
  return (
    <html lang="en-GB" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen font-sans">
        <Chrome header={<SiteHeader offers={offers} />} footer={<SiteFooter contact={settings.contact} />}>
          {children}
        </Chrome>
        <OfferWidgets offers={offers} />
        <Tracking />
      </body>
    </html>
  );
}
