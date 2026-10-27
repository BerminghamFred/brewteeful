import { requireAdmin } from "@/lib/admin/auth";
import { addSpend, deleteSpend, importSpendCsv } from "@/lib/admin/actions";
import { Card, Field, Notice, PageTitle } from "@/components/admin/ui";
import { gbp } from "@/lib/format";
import type { AdSpendRow } from "@/lib/types";

export default async function SpendPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const sp = await searchParams;
  const db = await requireAdmin();
  const { data } = await db.from("ad_spend").select("*").order("date", { ascending: false }).limit(500);
  const rows = (data ?? []) as AdSpendRow[];
  const total = rows.reduce((a, r) => a + r.spend_pence, 0);
  const clicks = rows.reduce((a, r) => a + (r.clicks ?? 0), 0);

  return (
    <>
      <PageTitle
        title="Ad spend"
        sub="Feeds CPA, ROAS and contribution after ads. Import at the same level you want to analyse (keyword-level export = keyword CPA). Names must match your utm_campaign / utm_content / utm_term values."
      />
      <Notice sp={sp} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Import Google Ads CSV">
          <form action={importSpendCsv} className="space-y-3">
            <p className="text-xs text-mute">
              Google Ads → Keywords (or Campaigns) → segment by Day → Download CSV. Columns used: Day, Campaign, Ad group, Keyword, Cost, Clicks, Impr.
            </p>
            <input type="file" name="file" accept=".csv,text/csv,text/tab-separated-values" className="text-sm" />
            <Field label="…or paste CSV"><textarea name="csv" rows={4} className="input font-mono text-xs" /></Field>
            <Field label="Date for rows without a Day column"><input type="date" name="fallback_date" className="input" /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="replace" defaultChecked /> Replace earlier CSV imports for the same dates</label>
            <button className="btn-dark w-full">Import</button>
          </form>
        </Card>
        <Card title="Add manually">
          <form action={addSpend} className="grid grid-cols-2 gap-3">
            <Field label="Date"><input type="date" name="date" required className="input" defaultValue={new Date().toISOString().slice(0, 10)} /></Field>
            <Field label="Spend (£)"><input name="spend" required inputMode="decimal" className="input" /></Field>
            <Field label="Campaign"><input name="campaign" className="input" /></Field>
            <Field label="Ad group"><input name="ad_group" className="input" /></Field>
            <Field label="Keyword"><input name="keyword" className="input" /></Field>
            <Field label="Channel">
              <select name="channel" className="input"><option value="google_ads">Google Ads</option><option value="meta">Meta</option><option value="other">Other</option></select>
            </Field>
            <Field label="Clicks"><input name="clicks" type="number" className="input" /></Field>
            <Field label="Impressions"><input name="impressions" type="number" className="input" /></Field>
            <button className="btn-dark col-span-2">Add</button>
          </form>
        </Card>
      </div>
      <Card title={`Recorded spend — ${gbp(total, { whole: false })} · ${clicks} clicks${clicks ? ` · avg CPC ${gbp(Math.round(total / clicks), { whole: false })}` : ""}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="text-left text-xs uppercase text-mute">
              <tr><th className="py-1">Date</th><th>Campaign</th><th>Ad group</th><th>Keyword</th><th className="text-right">Spend</th><th className="text-right">Clicks</th><th>Source</th><th /></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-ink/10">
                  <td className="py-1.5">{r.date}</td>
                  <td>{r.campaign ?? "—"}</td>
                  <td>{r.ad_group ?? "—"}</td>
                  <td>{r.keyword ?? "—"}</td>
                  <td className="text-right tabular-nums">{gbp(r.spend_pence, { whole: false })}</td>
                  <td className="text-right tabular-nums">{r.clicks ?? "—"}</td>
                  <td className="text-xs">{r.source}</td>
                  <td className="text-right">
                    <form action={deleteSpend}><input type="hidden" name="id" value={r.id} /><button className="text-xs underline">delete</button></form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
