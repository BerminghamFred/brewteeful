import { describe, expect, it } from "vitest";
import { normaliseOrigin } from "@/lib/brand";

describe("normaliseOrigin", () => {
  it("cleans values pasted into the hosting dashboard", () => {
    expect(normaliseOrigin("https://brewteeful.vercel.app")).toBe("https://brewteeful.vercel.app");
    expect(normaliseOrigin("https://brewteeful.vercel.app/\n")).toBe("https://brewteeful.vercel.app");
    expect(normaliseOrigin(' "https://brewteeful.vercel.app/" ')).toBe("https://brewteeful.vercel.app");
    expect(normaliseOrigin("brewteeful.vercel.app")).toBe("https://brewteeful.vercel.app");
    expect(normaliseOrigin("https://shop.example.com/some/path")).toBe("https://shop.example.com");
  });

  it("returns null when there is nothing usable", () => {
    expect(normaliseOrigin(undefined)).toBeNull();
    expect(normaliseOrigin("   ")).toBeNull();
    expect(normaliseOrigin("https://")).toBeNull();
  });
});
