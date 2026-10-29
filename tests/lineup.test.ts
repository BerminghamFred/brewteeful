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
