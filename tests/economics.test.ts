import { describe, expect, it } from "vitest";
import { estimateFulfilmentCost, estimatePaymentFee, orderEconomics, summarise } from "@/lib/economics";
import { DEFAULT_SETTINGS } from "@/lib/settings";

const e = DEFAULT_SETTINGS.economics;

describe("economics", () => {
  it("estimates Stripe fees at 1.5% + 20p", () => {
    expect(estimatePaymentFee(16000, e)).toBe(260);
    expect(estimatePaymentFee(0, e)).toBe(0);
  });

  it("estimates fulfilment per parcel", () => {
    expect(estimateFulfilmentCost(8, e)).toBe(550);
    expect(estimateFulfilmentCost(8, e, "express")).toBe(1050);
    expect(estimateFulfilmentCost(12, { ...e, postage_per_extra_item_pence: 50 })).toBe(650);
  });

  it("matches the plan's 8-shirt worked example", () => {
    const x = orderEconomics(
      { total_pence: 16000, refunded_pence: 0, cogs_pence: 8400, fulfilment_cost_pence: 550, payment_fee_pence: null, item_count: 8, status: "paid" },
      e
    );
    expect(x.contributionPence).toBe(16000 - 8400 - 550 - 260);
  });

  it("strips VAT when registered", () => {
    const x = orderEconomics(
      { total_pence: 12000, refunded_pence: 0, cogs_pence: 0, fulfilment_cost_pence: 0, payment_fee_pence: 0, item_count: 6, status: "paid" },
      { ...e, vat_registered: true }
    );
    expect(x.revenuePence).toBe(10000);
  });

  it("summarises KPIs incl. contribution after ads and CPA", () => {
    const orders = [
      { total_pence: 12000, refunded_pence: 0, cogs_pence: 6300, fulfilment_cost_pence: 550, payment_fee_pence: 200, item_count: 6, status: "paid" },
      { total_pence: 20000, refunded_pence: 0, cogs_pence: 10500, fulfilment_cost_pence: 550, payment_fee_pence: 320, item_count: 10, status: "paid" },
      { total_pence: 9999, refunded_pence: 0, cogs_pence: 0, fulfilment_cost_pence: 0, payment_fee_pence: 0, item_count: 5, status: "pending" },
    ];
    const s = summarise(orders, 400, 10000, e);
    expect(s.orders).toBe(2);
    expect(s.units).toBe(16);
    expect(s.shirtsPerOrder).toBe(8);
    expect(s.revenuePence).toBe(32000);
    expect(s.contributionBeforeAdsPence).toBe(32000 - 16800 - 1100 - 520);
    expect(s.contributionAfterAdsPence).toBe(s.contributionBeforeAdsPence - 10000);
    expect(s.cpaPence).toBe(5000);
    expect(s.conversionRate).toBeCloseTo(0.005);
    expect(s.roas).toBeCloseTo(3.2);
  });
});
