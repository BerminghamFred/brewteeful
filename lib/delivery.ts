/** Delivery-date estimates in UK working days (weekends skipped; bank holidays not modelled). */
import type { DeliverySettings } from "@/lib/settings";
import type { ShippingMethod } from "@/lib/pricing";

export function addWorkingDays(from: Date, days: number): Date {
  const d = new Date(from);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return d;
}

export type DeliveryEstimate = { earliest: Date; latest: Date };

export function estimateDelivery(
  settings: DeliverySettings,
  method: ShippingMethod = "standard",
  orderDate = new Date()
): DeliveryEstimate {
  if (method === "express") {
    const days = settings.production_days_min + settings.express_days;
    const d = addWorkingDays(orderDate, days);
    return { earliest: d, latest: d };
  }
  return {
    earliest: addWorkingDays(
      orderDate,
      settings.production_days_min + settings.standard_days_min
    ),
    latest: addWorkingDays(
      orderDate,
      settings.production_days_max + settings.standard_days_max
    ),
  };
}

export type EventDateCheck = {
  status: "comfortable" | "tight" | "too_late" | "past";
  daysUntil: number;
  estimate: DeliveryEstimate;
};

/** Is the stag date reachable? "Tight" = latest estimate lands within 2 days of the event. */
export function checkEventDate(
  settings: DeliverySettings,
  eventDate: Date,
  method: ShippingMethod = "standard",
  now = new Date()
): EventDateCheck {
  const estimate = estimateDelivery(settings, method, now);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysUntil = Math.round(
    (eventDate.getTime() - startOfToday.getTime()) / 86_400_000
  );
  let status: EventDateCheck["status"];
  if (daysUntil < 0) status = "past";
  else if (estimate.earliest >= eventDate) status = "too_late";
  else if (estimate.latest.getTime() + 2 * 86_400_000 > eventDate.getTime())
    status = "tight";
  else status = "comfortable";
  return { status, daysUntil, estimate };
}

export function formatDay(d: Date) {
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
