import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { ConversionWidgets } from "@/components/conversion/ConversionWidgets";

const display = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "BrewTeeFul | Football Culture. Reimagined.",
    template: "%s | BrewTeeFul",
  },
  description:
    "Premium UK streetwear tees — football nostalgia, urban edge. Fast shipping, unique designs.",
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "BrewTeeFul",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen font-sans">
        <AnalyticsProvider />
        <Header />
        <main className="min-h-[60vh]">{children}</main>
        <Footer />
        <ConversionWidgets />
      </body>
    </html>
  );
}
