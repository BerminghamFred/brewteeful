/**
 * Unit economics. Everything here is an estimate built from admin-editable
 * assumptions (Settings → Economics) plus actuals where we have them
 * (Stripe fee from the balance transaction, per-SKU cost snapshot on each order item).
 */
import type { EconomicsSettings } from "@/lib/settings";
import type { ShippingMethod } from "@/lib/pricing";

export function estimatePaymentFee(totalPence: number, e: EconomicsSettings) {
  if (totalPence <= 0) return 0;
  return Math.round((totalPence * e.payment_fee_percent) / 100 + e.payment_fee_fixed_pence);
}

export function estimateFulfilmentCost(
  itemCount: number,
  e: EconomicsSettings,
  method: ShippingMethod = "standard"
) {
  const extraItems = Math.max(0, itemCount - e.postage_included_items);
  return (
    e.postage_per_order_pence +
    extraItems * e.postage_per_extra_item_pence +
    e.packaging_per_order_pence +
    (method === "express" ? e.express_extra_cost_pence : 0)
  );
}

/** Revenue net of VAT (if registered) and refunds. */
export function netRevenue(totalPence: number, refundedPence: number, e: EconomicsSettings) {
  const gross = Math.max(0, totalPence - refundedPence);
  if (!e.vat_registered) return gross;
  return Math.round(gross / (1 + e.vat_rate_percent / 100));
}

export type OrderEconomicsInput = {
  total_pence: number;
  refunded_pence: number;
  cogs_pence: number;
  fulfilment_cost_pence: number;
  payment_fee_pence: number | null;
  item_count: number;
  status: string;
};

export type OrderEconomics = {
  revenuePence: number;
  cogsPence: number;
  fulfilmentPence: number;
  paymentFeePence: number;
  grossProfitPence: number;
  contributionPence: number;
};

/**
 * Contribution before ads for one order. A fully refunded order still costs us the
 * COGS and postage if it was produced, so those stay in; only revenue goes.
 */
export function orderEconomics(o: OrderEconomicsInput, e: EconomicsSettings): OrderEconomics {
  const revenuePence = netRevenue(o.total_pence, o.refunded_pence, e);
  const paymentFeePence = o.payment_fee_pence ?? estimatePaymentFee(o.total_pence, e);
  const grossProfitPence = revenuePence - o.cogs_pence;
  return {
    revenuePence,
    cogsPence: o.cogs_pence,
    fulfilmentPence: o.fulfilment_cost_pence,
    paymentFeePence,
    grossProfitPence,
    contributionPence: grossProfitPence - o.fulfilment_cost_pence - paymentFeePence,
  };
}

export type BusinessSummary = {
  sessions: number;
  orders: number;
  units: number;
  revenuePence: number;
  cogsPence: number;
  fulfilmentPence: number;
  paymentFeePence: number;
  grossProfitPence: number;
  contributionBeforeAdsPence: number;
  adSpendPence: number;
  contributionAfterAdsPence: number;
  aovPence: number;
  shirtsPerOrder: number;
  conversionRate: number;
  cpaPence: number | null;
  roas: number | null;
  contributionPerOrderPence: number | null;
  contributionPerVisitorPence: number | null;
  revenuePerVisitorPence: number | null;
  /** Max CPA we could pay and break even, at current contribution/order. */
  breakEvenCpaPence: number | null;
};

export function summarise(
  orders: OrderEconomicsInput[],
  sessions: number,
  adSpendPence: number,
  e: EconomicsSettings
): BusinessSummary {
  const paid = orders.filter((o) =>
    ["paid", "partially_refunded", "refunded"].includes(o.status)
  );
  const acc = paid.reduce(
    (a, o) => {
      const x = orderEconomics(o, e);
      a.revenue += x.revenuePence;
      a.cogs += x.cogsPence;
      a.fulfilment += x.fulfilmentPence;
      a.fees += x.paymentFeePence;
      a.gross += x.grossProfitPence;
      a.contribution += x.contributionPence;
      a.units += o.item_count;
      return a;
    },
    { revenue: 0, cogs: 0, fulfilment: 0, fees: 0, gross: 0, contribution: 0, units: 0 }
  );
  const n = paid.length;
  const contributionAfterAds = acc.contribution - adSpendPence;
  return {
    sessions,
    orders: n,
    units: acc.units,
    revenuePence: acc.revenue,
    cogsPence: acc.cogs,
    fulfilmentPence: acc.fulfilment,
    paymentFeePence: acc.fees,
    grossProfitPence: acc.gross,
    contributionBeforeAdsPence: acc.contribution,
    adSpendPence,
    contributionAfterAdsPence: contributionAfterAds,
    aovPence: n ? Math.round(acc.revenue / n) : 0,
    shirtsPerOrder: n ? acc.units / n : 0,
    conversionRate: sessions ? n / sessions : 0,
    cpaPence: n && adSpendPence ? Math.round(adSpendPence / n) : null,
    roas: adSpendPence ? acc.revenue / adSpendPence : null,
    contributionPerOrderPence: n ? Math.round(contributionAfterAds / n) : null,
    contributionPerVisitorPence: sessions ? Math.round(contributionAfterAds / sessions) : null,
    revenuePerVisitorPence: sessions ? Math.round(acc.revenue / sessions) : null,
    breakEvenCpaPence: n ? Math.round(acc.contribution / n) : null,
  };
}
