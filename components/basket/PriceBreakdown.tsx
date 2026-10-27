import { gbp } from "@/lib/format";
import type { PricingResult } from "@/lib/pricing";

export function PriceBreakdown({ pricing }: { pricing: PricingResult }) {
  const unit = pricing.unitPrices[0] ?? 0;
  const allSame = pricing.unitPrices.every((u) => u === unit);
  return (
    <dl className="space-y-1.5 text-sm">
      <div className="flex justify-between">
        <dt>
          {pricing.itemCount} shirts{allSame ? ` × ${gbp(unit)}` : ""}
        </dt>
        <dd>{gbp(pricing.subtotalPence)}</dd>
      </div>
      {pricing.discounts.map((d) => (
        <div key={d.id} className="flex justify-between font-bold text-pitch">
          <dt>{d.label}</dt>
          <dd>−{gbp(d.amountPence)}</dd>
        </div>
      ))}
      <div className="flex justify-between">
        <dt>Delivery</dt>
        <dd>{pricing.shippingPence ? gbp(pricing.shippingPence) : "Free"}</dd>
      </div>
      <div className="flex justify-between border-t border-ink/10 pt-2 text-lg font-semibold">
        <dt>Total</dt>
        <dd>{gbp(pricing.totalPence)}</dd>
      </div>
      {pricing.nextThreshold ? (
        <p className="pt-1 text-xs text-mute">
          Add {pricing.nextThreshold.itemsNeeded} more for {pricing.nextThreshold.label}.
        </p>
      ) : null}
    </dl>
  );
}
