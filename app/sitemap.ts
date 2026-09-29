import type { MetadataRoute } from "next";
import { getCatalogue } from "@/lib/store";
import { absoluteUrl } from "@/lib/brand";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products } = await getCatalogue();
  const staticPages = ["/", "/designs", "/faq", "/delivery-returns", "/size-guide", "/contact"];
  return [
    ...staticPages.map((p) => ({ url: absoluteUrl(p), changeFrequency: "weekly" as const, priority: p === "/" ? 1 : 0.6 })),
    ...products.map((p) => ({ url: absoluteUrl(`/designs/${p.slug}`), lastModified: p.updated_at, priority: 0.7 })),
  ];
}
