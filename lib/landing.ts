/**
 * Landing-page test for ad clicks (experiment variable "landing"): the homepage, or
 * straight into the basket with one design already in it (size L).
 */
const AD_CLICK_PARAMS = ["gclid", "gbraid", "wbraid", "gad_source"];

export const isAdArrival = (sp: URLSearchParams) => AD_CLICK_PARAMS.some((p) => sp.has(p));

/**
 * Where an arriving visitor should go instead of the homepage, or null to stay.
 * Only ad clicks are redirected; the click ids ride along so attribution still works.
 */
export function landingRedirect(sp: URLSearchParams, landing: string | undefined, validSlugs: Set<string>): string | null {
  if (!landing || landing === "home" || !validSlugs.has(landing) || !isAdArrival(sp)) return null;
  const next = new URLSearchParams(sp);
  next.delete("start");
  return `/basket?start=${encodeURIComponent(landing)}${next.size ? `&${next.toString()}` : ""}`;
}
