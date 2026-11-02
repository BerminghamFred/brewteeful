import { describe, expect, it } from "vitest";
import { newOrderAlertEmail, orderConfirmationEmail, orderShippedEmail, savedLineupEmail, sizesCompleteEmail } from "@/lib/email/templates";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import type { Order, OrderItem } from "@/lib/types";

const order = {
  id: "o1", order_number: 1008, email: "sam@example.com", customer_name: "Sam O'Neill",
  shipping_address: { name: "Sam", line1: "12 High St", line2: null, city: "Leeds", state: null, postal_code: "LS1 1AA" },
  shipping_method: "standard", event_date: "2026-11-14", item_count: 2, subtotal_pence: 4000, discount_pence: 500,
  discount_code: "SAVE5", shipping_pence: 0, total_pence: 3500, carrier: "Royal Mail", tracking_number: "AB1GB",
  tracking_url: "javascript:alert(1)", shipped_at: "2026-10-30T10:00:00Z", created_at: "2026-10-27T10:00:00Z", paid_at: "2026-10-27T10:00:00Z",
} as unknown as Order;
const items = [
  { position: 1, is_stag: true, nickname: null, product_id: "p1", product_name: "Bierry Henry", size: "L" },
  { position: 2, is_stag: false, nickname: "<b>Tom</b>", product_id: null, product_name: "Mother Beeresa", size: "M" },
] as unknown as OrderItem[];

describe("order emails", () => {
  it("confirmation lists every person, totals and the address, escaping customer input", () => {
    const m = orderConfirmationEmail({ order, items, products: {}, settings: DEFAULT_SETTINGS });
    expect(m.subject).toContain("#1008");
    expect(m.html).toContain("★ The Stag");
    expect(m.html).toContain("&lt;b&gt;Tom&lt;/b&gt;");
    expect(m.html).not.toContain("<b>Tom</b>");
    expect(m.html).toContain("Sam O&#39;Neill".split(" ")[0]);
    expect(m.html).toContain("SAVE5");
    expect(m.text).toContain("Total paid: £35");
    expect(m.text).toContain("LS1 1AA");
    expect(m.html).toContain("company no. 17123579");
  });

  it("shipped email never links a non-http tracking URL", () => {
    const m = orderShippedEmail({ order, items, products: {}, settings: DEFAULT_SETTINGS });
    expect(m.html).not.toContain("javascript:");
    expect(m.html).toContain("AB1GB");
    expect(m.text).toContain("Mother Beeresa, size M");
  });

  it("owner alert summarises the order with an admin link, escaping input", () => {
    const m = newOrderAlertEmail({ order, items, settings: DEFAULT_SETTINGS });
    expect(m.subject).toBe("New order #1008 — £35 (2 shirts)");
    expect(m.html).toContain("/admin/orders/o1");
    expect(m.html).toContain("&lt;b&gt;Tom&lt;/b&gt;");
    expect(m.text).toContain("- Bierry Henry, L (★ The Stag)");
    expect(DEFAULT_SETTINGS.contact.order_alert_email).toBe("freddie@pubclubapp.co.uk");
  });

  it("pay-now-sizes-later confirmation leads with the sizes link and 'sooner sizes, sooner shirts'", () => {
    const waitingOrder = { ...order, sizes_token: "tok_123456789012345678", sizes_completed_at: null } as Order;
    const tbc = [{ ...items[0]!, size: "TBC" }, items[1]!] as OrderItem[];
    const m = orderConfirmationEmail({ order: waitingOrder, items: tbc, products: {}, settings: DEFAULT_SETTINGS });
    expect(m.subject).toContain("add everyone's sizes");
    expect(m.html).toContain("/sizes/tok_123456789012345678");
    expect(m.html).toContain("as soon as the last size is in");
    expect(m.html).toContain("Size to follow");
    expect(m.text).toContain("1 size is still needed");
    const alert = newOrderAlertEmail({ order: waitingOrder, items: tbc, settings: DEFAULT_SETTINGS });
    expect(alert.html).toContain("Don't print yet");
  });

  it("normal orders don't mention sizes later", () => {
    const m = orderConfirmationEmail({ order: { ...order, sizes_token: null, sizes_completed_at: null } as Order, items, products: {}, settings: DEFAULT_SETTINGS });
    expect(m.html).not.toContain("/sizes/");
    expect(m.subject).toContain("going to print");
  });

  it("sizes-complete and saved-lineup emails", () => {
    expect(sizesCompleteEmail({ order, items, products: {}, settings: DEFAULT_SETTINGS }).subject).toContain("All sizes in");
    const saved = savedLineupEmail({ link: "https://x.test/build?n=3&p=a,b,c", groupSize: 3, settings: DEFAULT_SETTINGS });
    expect(saved.html).toContain("https://x.test/build?n=3&amp;p=a,b,c");
    expect(saved.html).toContain("3-person");
  });
});
