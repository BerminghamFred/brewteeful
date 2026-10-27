/**
 * Brand identity in one place. The name/domain are not final yet — change here
 * and everything (metadata, schema, emails, admin) follows.
 */
export const BRAND = {
  name: "BrewTeeFul",
  legalName: "BrewTeeFul",
  tagline: "Stag shirts that aren't shit.",
  description:
    "Coordinated stag-do T-shirt sets. A different design for everyone in the group, one collection that looks great together. From £20 a shirt, UK delivery.",
  siteUrl: normaliseOrigin(process.env.NEXT_PUBLIC_SITE_URL) ?? "http://localhost:3000",
  locale: "en_GB",
  currency: "GBP",
} as const;

/** Tolerates pasted env values: whitespace/newlines, wrapping quotes, a trailing path or slash. */
export function normaliseOrigin(value: string | undefined | null): string | null {
  const v = (value ?? "").trim().replace(/^["']|["']$/g, "").trim();
  if (!v) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    return u.origin;
  } catch {
    return null;
  }
}

export function absoluteUrl(path = "/") {
  return `${BRAND.siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
