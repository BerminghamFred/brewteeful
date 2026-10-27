import { describe, expect, it } from "vitest";
import { priceSet, validateDiscountCode } from "@/lib/pricing";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import type { DiscountCode, Offer } from "@/lib/types";

const settings = { ...DEFAULT_SETTINGS.pricing, free_shipping_min_items: 6, standard_shipping_pence: 499 };
const lines = (n: number, price = 2000) =>
  Array.from({ length: n }, (_, i) => ({ productId: `p${i % 3}`, unitPricePence: price }));
const now = new Date("2026-10-01T12:00:00Z");

const offer = (partial: Partial<Offer>): Offer => ({
  id: "o1",
  name: "Offer",
  kind: "quantity_discount",
  config: {},
  starts_at: null,
  ends_at: null,
  active: true,
  priority: 0,
  ...partial,
});

const code = (partial: Partial<DiscountCode>): DiscountCode => ({
  id: "c1",
  code: "STAG10",
  kind: "percent",
  value: 10,
  min_items: 0,
  starts_at: null,
  ends_at: null,
  max_uses: null,
  uses_count: 0,
  active: true,
  ...partial,
});

describe("priceSet", () => {
  it("prices a basic set and enforces the minimum", () => {
    const r = priceSet({ lines: lines(2), settings, offers: [], now });
    expect(r.subtotalPence).toBe(4000);
    expect(r.meetsMinimum).toBe(false);
    expect(r.errors[0]).toMatch(/Minimum order is 3/);
  });

  it("charges delivery below the free threshold and nudges toward it", () => {
    const r = priceSet({ lines: lines(5), settings, offers: [], now });
    expect(r.shippingPence).toBe(499);
    expect(r.totalPence).toBe(10499);
    expect(r.nextThreshold).toEqual({ itemsNeeded: 1, label: "free UK delivery" });
  });

  it("gives free delivery at the threshold", () => {
    const r = priceSet({ lines: lines(6), settings, offers: [], now });
    expect(r.shippingPence).toBe(0);
    expect(r.freeShipping).toBe(true);
    expect(r.totalPence).toBe(12000);
  });

  it("applies only the best quantity discount", () => {
    const offers = [
      offer({ id: "a", config: { min_items: 8, amount_off_pence: 1000, label: "8+ £10 off" } }),
      offer({ id: "b", config: { min_items: 10, amount_off_pence: 2500, label: "10+ £25 off" } }),
    ];
    expect(priceSet({ lines: lines(9), settings, offers, now }).discountPence).toBe(1000);
    const r10 = priceSet({ lines: lines(10), settings, offers, now });
    expect(r10.discounts).toHaveLength(1);
    expect(r10.discountPence).toBe(2500);
    expect(priceSet({ lines: lines(7), settings, offers, now }).nextThreshold).toEqual({
      itemsNeeded: 1,
      label: "8+ £10 off",
    });
  });

  it("ignores inactive and out-of-window offers", () => {
    const offers = [
      offer({ active: false, config: { min_items: 5, amount_off_pence: 1000, label: "x" } }),
      offer({ id: "o2", ends_at: "2026-09-01T00:00:00Z", config: { min_items: 5, amount_off_pence: 1000, label: "x" } }),
    ];
    expect(priceSet({ lines: lines(8), settings, offers, now }).discountPence).toBe(0);
  });

  it("stacks a percent code after the quantity discount", () => {
    const offers = [offer({ config: { min_items: 8, amount_off_pence: 1000, label: "8+" } })];
    const r = priceSet({ lines: lines(8), settings, offers, discount: code({}), now });
    // 16000 - 1000 = 15000; 10% = 1500
    expect(r.discountPence).toBe(2500);
    expect(r.totalPence).toBe(13500);
  });

  it("rejects invalid codes without discounting", () => {
    const r = priceSet({ lines: lines(5), settings, offers: [], discount: code({ min_items: 8 }), now });
    expect(r.discountPence).toBe(0);
    expect(r.codeRejection).toMatch(/at least 8/);
    expect(priceSet({ lines: lines(5), settings, offers: [], discount: null, now }).codeRejection).toMatch(/doesn't exist/);
  });

  it("free-shipping code removes delivery", () => {
    const r = priceSet({ lines: lines(5), settings, offers: [], discount: code({ kind: "free_shipping", value: 0 }), now });
    expect(r.shippingPence).toBe(0);
  });

  it("never discounts below zero", () => {
    const r = priceSet({ lines: lines(5), settings, offers: [], discount: code({ kind: "fixed", value: 999999 }), now });
    expect(r.discountPence).toBe(10000);
    expect(r.totalPence).toBe(499);
  });

  it("applies experiment price override to every line", () => {
    const r = priceSet({ lines: lines(6), settings, offers: [], unitPriceOverridePence: 2199, now });
    expect(r.subtotalPence).toBe(6 * 2199);
  });

  it("express is charged even when standard would be free, only when enabled", () => {
    const s = { ...settings, express_enabled: true, express_shipping_pence: 995 };
    expect(priceSet({ lines: lines(8), settings: s, offers: [], shippingMethod: "express", now }).shippingPence).toBe(995);
    expect(priceSet({ lines: lines(8), settings, offers: [], shippingMethod: "express", now }).shippingMethod).toBe("standard");
  });
});

describe("validateDiscountCode", () => {
  it("checks max uses and dates", () => {
    expect(validateDiscountCode(code({ max_uses: 3, uses_count: 3 }), 6, now)).toMatch(/fully redeemed/);
    expect(validateDiscountCode(code({ starts_at: "2026-11-01T00:00:00Z" }), 6, now)).toMatch(/expired/);
    expect(validateDiscountCode(code({}), 6, now)).toBeNull();
  });
});
