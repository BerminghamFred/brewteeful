/**
 * Brand identity in one place. The name/domain are not final yet — change here
 * and everything (metadata, schema, emails, admin) follows.
 */
export const BRAND = {
  name: "BrewTeeFul",
  legalName: "BrewTeeFul",
  tagline: "Stag shirts that aren't shit.",
  description:
    "Coordinated stag-do T-shirt sets. A different football-inspired design for every lad, one collection that looks great together. From £20 a shirt, UK delivery.",
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  locale: "en_GB",
  currency: "GBP",
} as const;

export function absoluteUrl(path = "/") {
  return `${BRAND.siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
