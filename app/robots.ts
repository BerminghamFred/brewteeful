import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/brand";

export default function robots(): MetadataRoute.Robots {
  const isProd = !process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production";
  return {
    rules: isProd
      ? { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/basket", "/checkout", "/build?"] }
      : { userAgent: "*", disallow: "/" },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
