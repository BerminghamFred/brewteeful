export function gbp(pence: number, opts: { whole?: boolean } = {}) {
  const whole = opts.whole ?? pence % 100 === 0;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(pence / 100);
}

export function pct(x: number, digits = 1) {
  return `${(x * 100).toFixed(digits)}%`;
}

export function deliveryWindowText(d: {
  production_days_min: number;
  production_days_max: number;
  standard_days_min: number;
  standard_days_max: number;
}) {
  return `${d.production_days_min + d.standard_days_min}–${d.production_days_max + d.standard_days_max} working days`;
}
