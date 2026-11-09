/**
 * Abandoned-checkout rules (pure, so they're testable).
 * An order is "abandoned" once it has sat unpaid for an hour after the customer reached
 * the payment step. We act on it at most once, and never after Stripe's session would
 * have expired (24h), when the webhook cancels it.
 */
export const REMIND_AFTER_MIN = 60;
export const GIVE_UP_AFTER_MIN = 23 * 60;

export type RecoveryOrder = {
  status: string;
  email: string | null;
  created_at: string;
  reminder_opt_in: boolean;
  reminder_sent_at: string | null;
  abandon_alert_sent_at: string | null;
};

export function recoveryDue(o: RecoveryOrder, now = new Date()) {
  const ageMin = (now.getTime() - new Date(o.created_at).getTime()) / 60_000;
  if (o.status !== "pending" || !o.email || ageMin < REMIND_AFTER_MIN || ageMin > GIVE_UP_AFTER_MIN) return { alert: false, remind: false };
  return { alert: !o.abandon_alert_sent_at, remind: o.reminder_opt_in && !o.reminder_sent_at };
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;
export function normaliseEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const e = raw.trim().toLowerCase();
  return e.length <= 254 && EMAIL_RE.test(e) ? e : null;
}
