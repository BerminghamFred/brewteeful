import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { businessSummary, funnel, loadReportData, parseRange, productPerformance, ymd } from "@/lib/admin/reports";
import { Card, PageTitle, RangeForm, Stat } from "@/components/admin/ui";
import { gbp, pct } from "@/lib/format";

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const range = parseRange(sp);
  const db = await requireAdmin();
  const data = await loadReportData(db, range);
  const s = businessSummary(data);
  const f = funnel(data.sessions);
  const products = await productPerformance(db, data.orders.map((o) => o.id));
  const spendMissing = s.adSpendPence === 0 && data.sessions.some((x) => x.utm_medium === "cpc" || x.has_click_id);

  return (
    <>
      <PageTitle title="Dashboard" sub="Primary KPI: contribution after ads. Everything else is diagnostic.">
        <RangeForm from={ymd(range.from)} to={ymd(range.to)} />
      </PageTitle>

      {spendMissing ? (
        <p className="mb-4 rounded-lg border-2 border-flare bg-flare/10 p-3 text-sm font-bold">
          Paid clicks recorded but no ad spend entered for this period — CPA/ROAS/contribution are overstated. <Link href="/admin/spend" className="underline">Add spend</Link>
        </p>
      ) : null}

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        <Stat
          label="Contribution after ads"
          value={gbp(s.contributionAfterAdsPence, { whole: false })}
          tone={s.contributionAfterAdsPence >= 0 ? "good" : "bad"}
          hint="Revenue − COGS − postage − fees − ads"
        />
        <Stat label="Contribution / visitor" value={s.contributionPerVisitorPence != null ? gbp(s.contributionPerVisitorPence, { whole: false }) : "—"} />
        <Stat label="Contribution / order" value={s.contributionPerOrderPence != null ? gbp(s.contributionPerOrderPence, { whole: false }) : "—"} hint="after ads" />
        <Stat label="CPA" value={s.cpaPence != null ? gbp(s.cpaPence, { whole: false }) : "—"} hint={s.breakEvenCpaPence != null ? `Break-even ${gbp(s.breakEvenCpaPence, { whole: false })}` : undefined} tone={s.cpaPence != null && s.breakEvenCpaPence != null ? (s.cpaPence <= s.breakEvenCpaPence ? "good" : "bad") : undefined} />
        <Stat label="ROAS" value={s.roas != null ? `${s.roas.toFixed(2)}×` : "—"} />
        <Stat label="Ad spend" value={gbp(s.adSpendPence, { whole: false })} />
        <Stat label="Revenue" value={gbp(s.revenuePence, { whole: false })} hint={data.settings.economics.vat_registered ? "ex VAT, net of refunds" : "net of refunds"} />
        <Stat label="Orders" value={s.orders} />
        <Stat label="Conversion rate" value={pct(s.conversionRate, 2)} hint="orders / sessions" />
        <Stat label="AOV" value={gbp(s.aovPence, { whole: false })} />
        <Stat label="Shirts / order" value={s.shirtsPerOrder.toFixed(1)} hint={`${s.units} units`} />
        <Stat label="Gross profit" value={gbp(s.grossProfitPence, { whole: false })} hint="revenue − COGS" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Funnel (sessions)">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-mute">
              <tr>
                <th className="py-1">Step</th>
                <th className="py-1 text-right">Sessions</th>
                <th className="py-1 text-right">Step conv.</th>
                <th className="py-1 text-right">Of sessions</th>
              </tr>
            </thead>
            <tbody>
              {f.steps.map((st) => (
                <tr key={st.key} className={`border-t border-ink/10 ${f.biggestDrop === st.key ? "bg-flare/15 font-bold" : ""}`}>
                  <td className="py-2">
                    {st.label}
                    {f.biggestDrop === st.key ? <span className="ml-2 rounded bg-flare px-1.5 text-[10px] uppercase">Biggest drop</span> : null}
                  </td>
                  <td className="py-2 text-right tabular-nums">{st.count}</td>
                  <td className="py-2 text-right tabular-nums">{st.stepRate == null ? "" : pct(st.stepRate)}</td>
                  <td className="py-2 text-right tabular-nums">{st.overallRate == null ? "" : pct(st.overallRate, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 space-y-1">
            {f.steps.map((st) => (
              <div key={st.key} className="h-2 rounded bg-ink/10">
                <div className="h-2 rounded bg-pitch" style={{ width: `${Math.max(0.5, (st.overallRate ?? 0) * 100)}%` }} />
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-mute">
            Session-based: a purchase counts in the session it happened in. Bots are excluded. Orders in KPIs come from the orders table.
          </p>
        </Card>

        <Card title="Unit economics">
          <table className="w-full text-sm">
            <tbody>
              {[
                ["Revenue", s.revenuePence],
                ["− COGS (per-SKU cost snapshot)", -s.cogsPence],
                ["− Postage & packaging (estimate)", -s.fulfilmentPence],
                ["− Payment fees (actual from Stripe)", -s.paymentFeePence],
                ["= Contribution before ads", s.contributionBeforeAdsPence],
                ["− Ad spend", -s.adSpendPence],
                ["= Contribution after ads", s.contributionAfterAdsPence],
              ].map(([label, v]) => (
                <tr key={label as string} className={`border-t border-ink/10 ${(label as string).startsWith("=") ? "font-extrabold" : ""}`}>
                  <td className="py-2">{label}</td>
                  <td className="py-2 text-right tabular-nums">{gbp(v as number, { whole: false })}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-mute">
            Assumptions editable under <Link href="/admin/content#economics" className="underline">Content & settings → economics</Link>.
          </p>
        </Card>
      </div>

      <Card title="Design performance">
        {products.length ? (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-mute">
              <tr>
                <th>Design</th>
                <th className="text-right">Units</th>
                <th className="text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.product_name} className="border-t border-ink/10">
                  <td className="py-1.5">{p.product_name}</td>
                  <td className="text-right tabular-nums">{p.units}</td>
                  <td className="text-right tabular-nums">{gbp(p.revenuePence)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-mute">No orders in this period.</p>
        )}
      </Card>
    </>
  );
}
