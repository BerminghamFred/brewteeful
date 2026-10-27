import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { funnel, type SessionRow } from "@/lib/admin/reports";
import { parseSpendCsv } from "@/lib/spend-csv";
import { decodeLineup, encodeLineup } from "@/stores/set-store";

const s = (flags: Partial<SessionRow>): SessionRow =>
  ({ session_id: "x", visitor_id: "v", started_at: "", experiments: {}, ...flags }) as SessionRow;

describe("funnel", () => {
  it("computes step rates and the biggest drop", () => {
    const rows = [
      ...Array.from({ length: 100 }, () => s({})),
      ...Array.from({ length: 40 }, () => s({ started_builder: true })),
      ...Array.from({ length: 10 }, () => s({ started_builder: true, completed_builder: true, added_to_cart: true, began_checkout: true })),
      ...Array.from({ length: 2 }, () => s({ started_builder: true, completed_builder: true, added_to_cart: true, began_checkout: true, purchased: true })),
    ];
    const f = funnel(rows);
    expect(f.steps[0]!.count).toBe(152);
    expect(f.steps[1]!.count).toBe(52);
    expect(f.steps[2]!.stepRate).toBeCloseTo(12 / 52);
    expect(f.biggestDrop).toBe("purchased"); // 12 -> 2 is an 83% loss
  });
});

describe("parseSpendCsv", () => {
  it("parses a Google Ads keyword export with title rows and totals", () => {
    const csv = [
      "Search keyword report",
      "1 October 2026 - 7 October 2026",
      "Day,Campaign,Ad group,Search keyword,Cost,Clicks,Impr.",
      '2026-10-01,Stag Shirts — Search,A - T-shirts,"[stag do t shirts]","£1,012.40",120,1500',
      "02/10/2026,Stag Shirts — Search,B - Outfits,stag do outfits,3.50,9,--",
      "Total: Account,,,,£1015.90,129,1500",
    ].join("\n");
    const { rows, errors } = parseSpendCsv(csv);
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ date: "2026-10-01", keyword: "stag do t shirts", spend_pence: 101240, clicks: 120 });
    expect(rows[1]).toMatchObject({ date: "2026-10-02", ad_group: "B - Outfits", impressions: null });
  });
});

describe("lineup share links", () => {
  it("round-trips", () => {
    const people = [
      { design: "the-stag", size: "L", nickname: "Big Dave" },
      { design: "away-day", size: null, nickname: "" },
      { design: null, size: "XL", nickname: "" },
    ];
    const qs = encodeLineup(people, "2026-10-24");
    const out = decodeLineup(new URLSearchParams(qs), new Set(["the-stag", "away-day"]), new Set(["L", "XL"]), 30);
    expect(out).toEqual({ people, eventDate: "2026-10-24" });
  });
  it("drops unknown designs and rejects silly sizes", () => {
    expect(decodeLineup(new URLSearchParams("n=500"), new Set(), new Set(), 30)).toBeNull();
    const out = decodeLineup(new URLSearchParams("n=1&p=hacked~L"), new Set(["a"]), new Set(["L"]), 30);
    expect(out?.people[0]).toEqual({ design: null, size: "L", nickname: "" });
  });
});
