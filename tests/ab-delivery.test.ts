import { describe, expect, it } from "vitest";
import { assignVariant, resolveExperiments } from "@/lib/ab";
import { addWorkingDays, checkEventDate } from "@/lib/delivery";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import type { Experiment } from "@/lib/types";

const exp: Experiment = {
  id: "e1",
  key: "price-test",
  name: "Price",
  hypothesis: null,
  variable: "price",
  status: "running",
  variants: [
    { key: "control", name: "£20", weight: 50, config: {} },
    { key: "high", name: "£21.99", weight: 50, config: { unit_price_pence: 2199 } },
  ],
  started_at: null,
  ended_at: null,
  winner: null,
  created_at: "",
};

describe("assignVariant", () => {
  it("is deterministic per visitor", () => {
    const a = assignVariant("visitor-1", exp);
    for (let i = 0; i < 5; i++) expect(assignVariant("visitor-1", exp)?.key).toBe(a?.key);
  });

  it("splits roughly by weight", () => {
    let high = 0;
    for (let i = 0; i < 4000; i++) if (assignVariant(`v${i}`, exp)?.key === "high") high++;
    expect(high / 4000).toBeGreaterThan(0.45);
    expect(high / 4000).toBeLessThan(0.55);
  });

  it("resolves overrides and honours forced variants", () => {
    const ctx = resolveExperiments([exp], "anyone", { "price-test": "high" });
    expect(ctx.assignments["price-test"]).toBe("high");
    expect(ctx.overrides.unit_price_pence).toBe(2199);
    const ctl = resolveExperiments([exp], "anyone", { "price-test": "control" });
    expect(ctl.overrides.unit_price_pence).toBeUndefined();
    expect(resolveExperiments([{ ...exp, status: "ended" }], "x").assignments).toEqual({});
  });

  it("ignores legacy experiments whose variants aren't a list (old schema)", () => {
    const legacy = { ...exp, variants: { A: { headline: "x" } } as unknown as Experiment["variants"] };
    expect(() => resolveExperiments([legacy], "visitor")).not.toThrow();
    expect(resolveExperiments([legacy], "visitor").assignments).toEqual({});
  });
});

describe("delivery", () => {
  it("skips weekends", () => {
    // Fri 2 Oct 2026 + 1 working day = Mon 5 Oct
    expect(addWorkingDays(new Date(2026, 9, 2), 1).getDate()).toBe(5);
  });

  it("classifies stag dates", () => {
    const d = DEFAULT_SETTINGS.delivery; // 2-3 production + 1-2 delivery = 3-5 working days
    const now = new Date(2026, 9, 1); // Thu
    expect(checkEventDate(d, new Date(2026, 9, 3), "standard", now).status).toBe("too_late");
    expect(checkEventDate(d, new Date(2026, 9, 9), "standard", now).status).toBe("tight");
    expect(checkEventDate(d, new Date(2026, 10, 1), "standard", now).status).toBe("comfortable");
    expect(checkEventDate(d, new Date(2026, 8, 1), "standard", now).status).toBe("past");
  });
});
