import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { breakdown, DIMENSIONS, loadReportData, parseRange, ymd, type Dimension } from "@/lib/admin/reports";
import { Card, PageTitle, RangeForm } from "@/components/admin/ui";
import { gbp, pct } from "@/lib/format";

export default async function AcquisitionPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; by?: string }> }) {
  const sp = await searchParams;
  const range = parseRange(sp);
  const by: Dimension = (sp.by && sp.by in DIMENSIONS ? sp.by : "utm_term") as Dimension;
  const db = await requireAdmin();
  const data = await loadReportData(db, range);
  const rows = breakdown(data, by);
  const q = (d: string) => `?by=${d}&from=${ymd(range.from)}&to=${ymd(range.to)}`;

  return (
    <>
      <PageTitle title="Acquisition" sub="Which campaigns, ad groups and keywords turn into profitable orders. Spend joins on campaign / ad group / keyword names from your spend imports.">
        <RangeForm from={ymd(range.from)} to={ymd(range.to)} extra={{ by }} />
      </PageTitle>
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {Object.entries(DIMENSIONS).map(([k, label]) => (
          <Link key={k} href={q(k)} className={`rounded-full border-2 border-ink px-3 py-1 font-bold ${k === by ? "bg-ink text-paper" : "bg-chalk"}`}>
            {label}
          </Link>
        ))}
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="text-left text-xs uppercase text-mute">
              <tr>
                <th className="py-1">{DIMENSIONS[by]}</th>
                <th className="text-right">Sessions</th>
                <th className="text-right">Builder</th>
                <th className="text-right">Configured</th>
                <th className="text-right">Basket</th>
                <th className="text-right">Checkout</th>
                <th className="text-right">Orders</th>
                <th className="text-right">CR</th>
                <th className="text-right">Shirts/order</th>
                <th className="text-right">Revenue</th>
                <th className="text-right">Spend</th>
                <th className="text-right">CPA</th>
                <th className="text-right">Contribution after ads</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const after = r.contributionPence - (r.spendPence ?? 0);
                return (
                  <tr key={r.key} className="border-t border-ink/10">
                    <td className="max-w-[260px] truncate py-2 font-bold" title={r.key}>{r.key}</td>
                    <td className="text-right tabular-nums">{r.sessions}</td>
                    <td className="text-right tabular-nums">{r.started} <span className="text-mute">{r.sessions ? pct(r.started / r.sessions, 0) : ""}</span></td>
                    <td className="text-right tabular-nums">{r.configured}</td>
                    <td className="text-right tabular-nums">{r.carts}</td>
                    <td className="text-right tabular-nums">{r.checkouts}</td>
                    <td className="text-right tabular-nums font-bold">{r.orders}</td>
                    <td className="text-right tabular-nums">{r.sessions ? pct(r.orders / r.sessions, 2) : "—"}</td>
                    <td className="text-right tabular-nums">{r.orders ? (r.units / r.orders).toFixed(1) : "—"}</td>
                    <td className="text-right tabular-nums">{gbp(r.revenuePence)}</td>
                    <td className="text-right tabular-nums">{r.spendPence != null ? gbp(r.spendPence, { whole: false }) : "—"}</td>
                    <td className="text-right tabular-nums">{r.spendPence != null && r.orders ? gbp(Math.round(r.spendPence / r.orders)) : "—"}</td>
                    <td className={`text-right tabular-nums font-bold ${after >= 0 ? "text-pitch" : "text-flare"}`}>{gbp(after, { whole: false })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!rows.length ? <p className="text-sm text-mute">No sessions in this period.</p> : null}
        <p className="mt-3 text-xs text-mute">
          Keyword data needs <code>utm_term={"{keyword}"}</code> in your Google Ads tracking template (see docs/PLAN.md §8). Low-volume rows are noise — judge on totals until each row has 100+ clicks.
        </p>
      </Card>
    </>
  );
}
