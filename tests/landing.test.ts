import { describe, expect, it } from "vitest";
import { isAdArrival, landingRedirect } from "@/lib/landing";

const slugs = new Set(["osama-tin-laden", "bierry-henry"]);
const sp = (q: string) => new URLSearchParams(q);

describe("ad landing test", () => {
  it("only redirects ad clicks", () => {
    expect(isAdArrival(sp("gclid=abc"))).toBe(true);
    expect(isAdArrival(sp("gad_source=1&gbraid=x"))).toBe(true);
    expect(isAdArrival(sp("utm_source=newsletter"))).toBe(false);
    expect(landingRedirect(sp(""), "bierry-henry", slugs)).toBeNull();
  });
  it("keeps the homepage for the home variant or unknown designs", () => {
    expect(landingRedirect(sp("gclid=abc"), "home", slugs)).toBeNull();
    expect(landingRedirect(sp("gclid=abc"), undefined, slugs)).toBeNull();
    expect(landingRedirect(sp("gclid=abc"), "nope", slugs)).toBeNull();
  });
  it("sends the click to the basket with the design, keeping click ids", () => {
    const to = landingRedirect(sp("gad_source=1&gclid=Cj0&start=evil"), "osama-tin-laden", slugs)!;
    const u = new URL(to, "https://x.test");
    expect(u.pathname).toBe("/basket");
    expect(u.searchParams.getAll("start")).toEqual(["osama-tin-laden"]);
    expect(u.searchParams.get("gclid")).toBe("Cj0");
    expect(u.searchParams.get("gad_source")).toBe("1");
  });
});

import { resolveExperiments } from "@/lib/ab";
describe("landing experiment wiring", () => {
  it("a homepage experiment can carry the landing override", () => {
    const exp = {
      id: "e", key: "ad-landing", name: "", hypothesis: null, variable: "homepage", status: "running",
      winner: null, started_at: null, ended_at: null, created_at: "",
      variants: [{ key: "osama", name: "", weight: 1, config: { landing: "osama-tin-laden" } }],
    } as never;
    expect(resolveExperiments([exp], "v1").overrides.landing).toBe("osama-tin-laden");
  });
});
