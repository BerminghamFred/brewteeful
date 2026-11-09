import { describe, expect, it } from "vitest";
import { normaliseEmail, recoveryDue } from "@/lib/recovery-rules";
import { abandonedAlertEmail, abandonedReminderEmail } from "@/lib/email/templates";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import type { Order, OrderItem } from "@/lib/types";

const now = new Date("2026-11-09T12:00:00Z");
const minsAgo = (m: number) => new Date(now.getTime() - m * 60_000).toISOString();
const base = { status: "pending", email: "sam@example.com", created_at: minsAgo(70), reminder_opt_in: true, reminder_sent_at: null, abandon_alert_sent_at: null };

describe("abandoned checkout rules", () => {
  it("waits an hour, then reminds (if agreed) and alerts once", () => {
    expect(recoveryDue({ ...base, created_at: minsAgo(30) }, now)).toEqual({ alert: false, remind: false });
    expect(recoveryDue(base, now)).toEqual({ alert: true, remind: true });
    expect(recoveryDue({ ...base, reminder_opt_in: false }, now)).toEqual({ alert: true, remind: false });
    expect(recoveryDue({ ...base, reminder_sent_at: minsAgo(5), abandon_alert_sent_at: minsAgo(5) }, now)).toEqual({ alert: false, remind: false });
  });
  it("never acts on paid orders, orders without an email, or after a day", () => {
    expect(recoveryDue({ ...base, status: "paid" }, now)).toEqual({ alert: false, remind: false });
    expect(recoveryDue({ ...base, email: null }, now)).toEqual({ alert: false, remind: false });
    expect(recoveryDue({ ...base, created_at: minsAgo(25 * 60) }, now)).toEqual({ alert: false, remind: false });
  });
  it("validates and normalises emails", () => {
    expect(normaliseEmail("  Sam@Example.COM ")).toBe("sam@example.com");
    expect(normaliseEmail("nope")).toBeNull();
    expect(normaliseEmail("a@b")).toBeNull();
    expect(normaliseEmail(42)).toBeNull();
  });
});

const order = {
  id: "11111111-2222-3333-4444-555555555555", order_number: 1011, email: "sam@example.com", customer_name: null,
  shipping_method: "standard", item_count: 1, subtotal_pence: 2000, discount_pence: 0, shipping_pence: 0, total_pence: 2000,
  created_at: "2026-11-09T10:00:00Z", experiments: { "ad-landing": "osama" },
} as unknown as Order;
const items = [{ position: 1, is_stag: true, nickname: "<i>x</i>", product_id: null, product_name: "Osama Tin Laden", size: "L" }] as unknown as OrderItem[];

describe("abandoned checkout emails", () => {
  it("reminder links back to the order, offers one-click unsubscribe, escapes input", () => {
    const m = abandonedReminderEmail({ order, items, products: {}, settings: DEFAULT_SETTINGS });
    expect(m.subject).toBe("Your Osama Tin Laden shirt is still waiting");
    expect(m.html).toContain(`/resume/${order.id}`);
    expect(m.html).toContain(`/api/unsubscribe?o=${order.id}`);
    expect(m.headers["List-Unsubscribe"]).toContain(`/api/unsubscribe?o=${order.id}`);
    expect(m.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    expect(m.html).toContain("free UK delivery");
    expect(m.html).not.toContain("<i>x</i>");
    expect(m.text).toContain("Finish your order:");
  });
  it("owner alert says what happened and who to reply to", () => {
    const m = abandonedAlertEmail({ order, items, settings: DEFAULT_SETTINGS, reminder: "sent" });
    expect(m.subject).toBe("Abandoned checkout #1011 — £20, 1 shirt");
    expect(m.html).toContain("sam@example.com");
    expect(m.html).toContain("Reminder email sent to them.");
    expect(m.html).toContain("osama");
    expect(m.html).toContain(`/admin/orders/${order.id}`);
    expect(abandonedAlertEmail({ order, items, settings: DEFAULT_SETTINGS, reminder: "opted_out" }).text).toContain("unticked");
  });
});
