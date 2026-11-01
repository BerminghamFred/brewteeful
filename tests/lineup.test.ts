import { describe, expect, it } from "vitest";
import { fillDesigns } from "@/lib/lineup";
import type { Person } from "@/stores/set-store";

const p = (design: string | null = null, size: string | null = null): Person => ({ design, size, nickname: "" });
const D = ["a", "b", "c", "d"];

describe("fillDesigns", () => {
  it("gives a fresh lineup a different design each", () => {
    expect(fillDesigns([p(), p(), p()], D).map((x) => x.design)).toEqual(["a", "b", "c"]);
  });
  it("keeps chosen designs and skips them for the rest", () => {
    const out = fillDesigns([p(), p("a", "L"), p()], D);
    expect(out.map((x) => x.design)).toEqual(["b", "a", "c"]);
    expect(out[1]!.size).toBe("L");
  });
  it("only repeats once every design is used", () => {
    expect(fillDesigns(Array.from({ length: 6 }, () => p()), D).map((x) => x.design)).toEqual(["a", "b", "c", "d", "a", "b"]);
  });
  it("leaves a full lineup untouched (same objects)", () => {
    const people = [p("a"), p("b")];
    const out = fillDesigns(people, D);
    expect(out[0]).toBe(people[0]);
    expect(out[1]).toBe(people[1]);
  });
});

import { fillSizes } from "@/lib/lineup";
import { isComplete } from "@/components/builder/useSetPricing";
import { parseSizeFlow } from "@/components/builder/types";

describe("size flows", () => {
  it("fillSizes only fills blanks", () => {
    expect(fillSizes([p("a", "M"), p("b")], "L").map((x) => x.size)).toEqual(["M", "L"]);
  });
  it("sizes are optional only for pay-now-sizes-later", () => {
    const people = [p("a", "M"), p("b")];
    expect(isComplete(people)).toBe(false);
    expect(isComplete(people, true)).toBe(true);
    expect(isComplete([p(null)], true)).toBe(false);
  });
  it("unknown flow values fall back to share", () => {
    expect(parseSizeFlow("pay_first")).toBe("pay_first");
    expect(parseSizeFlow("default_l")).toBe("default_l");
    expect(parseSizeFlow(undefined)).toBe("share");
    expect(parseSizeFlow("nonsense")).toBe("share");
  });
});
