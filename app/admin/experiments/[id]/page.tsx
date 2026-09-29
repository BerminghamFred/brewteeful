import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { saveExperiment, setExperimentStatus } from "@/lib/admin/actions";
import { experimentResults, loadReportData } from "@/lib/admin/reports";
import { Card, Field, Notice, PageTitle } from "@/components/admin/ui";
import { gbp, pct } from "@/lib/format";
import type { Experiment } from "@/lib/types";

export default async function ExperimentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const db = await requireAdmin();
  const { data } = await db.from("experiments").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const e = data as Experiment;
  const from = e.started_at ? new Date(e.started_at) : new Date();
  const to = e.ended_at ? new Date(e.ended_at) : new Date();
  const results = e.started_at ? experimentResults(await loadReportData(db, { from, to }), e.key, e.variants) : [];
  const control = results[0];
  const minSessions = Math.min(...results.map((r) => r.sessions), Infinity);

  return (
    <>
      <PageTitle title={e.name} sub={`${e.variable} · ${e.status}${e.hypothesis ? ` · ${e.hypothesis}` : ""}`}>
        <Link href="/admin/experiments" className="text-sm underline">← Experiments</Link>
      </PageTitle>
      <Notice sp={sp} />

      <Card title="Results">
        {results.length ? (
          <>
            {minSessions < 1000 ? (
              <p className="mb-3 rounded bg-sun p-2 text-xs font-bold">
                Not enough data yet ({minSessions} sessions in the smallest variant). Treat differences as noise until each variant has ~1,000 sessions and 20+ orders.
              </p>
            ) : null}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead className="text-left text-xs uppercase text-mute">
                  <tr>
                    <th className="py-1">Variant</th>
                    <th className="text-right">Sessions</th>
                    <th className="text-right">Builder %</th>
                    <th className="text-right">Basket %</th>
                    <th className="text-right">Checkout %</th>
                    <th className="text-right">Orders</th>
                    <th className="text-right">Conv.</th>
                    <th className="text-right">AOV</th>
                    <th className="text-right">Revenue / visitor</th>
                    <th className="text-right">Contribution / visitor ★</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => {
                    const lift = control && control.contributionPerVisitorPence && r !== control ? r.contributionPerVisitorPence / control.contributionPerVisitorPence - 1 : null;
                    return (
                      <tr key={r.key} className="border-t border-ink/10">
                        <td className="py-2 font-bold">{r.name} <span className="text-xs text-mute">{r.key}</span></td>
                        <td className="text-right tabular-nums">{r.sessions}</td>
                        <td className="text-right tabular-nums">{pct(r.builderRate)}</td>
                        <td className="text-right tabular-nums">{pct(r.cartRate)}</td>
                        <td className="text-right tabular-nums">{pct(r.checkoutRate)}</td>
                        <td className="text-right tabular-nums">{r.orders}</td>
                        <td className="text-right tabular-nums">{pct(r.conversionRate, 2)}</td>
                        <td className="text-right tabular-nums">{gbp(r.aovPence, { whole: false })}</td>
                        <td className="text-right tabular-nums">{gbp(r.revenuePerVisitorPence, { whole: false })}</td>
                        <td className="text-right font-extrabold tabular-nums">
                          {gbp(r.contributionPerVisitorPence, { whole: false })}
                          {lift != null ? <span className={`ml-1 text-xs ${lift >= 0 ? "text-pitch" : "text-flare"}`}>{lift >= 0 ? "+" : ""}{pct(lift, 0)}</span> : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-mute">Contribution here is before ad spend (spend isn&apos;t split by variant). First variant is treated as control.</p>
          </>
        ) : (
          <p className="text-sm text-mute">Start the experiment to collect results.</p>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Status">
          {e.status === "draft" ? (
            <form action={setExperimentStatus}>
              <input type="hidden" name="id" value={e.id} />
              <input type="hidden" name="status" value="running" />
              <button className="btn-dark w-full">Start experiment</button>
              <p className="mt-2 text-xs text-mute">QA each variant first: {e.variants.map((v) => <code key={v.key} className="mr-2">/?exp_{e.key}={v.key}</code>)}</p>
            </form>
          ) : e.status === "running" ? (
            <form action={setExperimentStatus} className="space-y-3">
              <input type="hidden" name="id" value={e.id} />
              <input type="hidden" name="status" value="ended" />
              <Field label="Declare winner (optional)">
                <select name="winner" className="input">
                  <option value="">No winner / inconclusive</option>
                  {e.variants.map((v) => <option key={v.key} value={v.key}>{v.name}</option>)}
                </select>
              </Field>
              <button className="btn-dark w-full">End experiment</button>
              <p className="text-xs text-mute">Ending stops all overrides. To ship a winner, change the underlying price/copy/offer yourself.</p>
            </form>
          ) : (
            <p className="text-sm">Ended {e.ended_at?.slice(0, 10)}. Winner: <strong>{e.winner ?? "none"}</strong></p>
          )}
        </Card>
        {e.status === "draft" ? (
          <Card title="Edit">
            <form action={saveExperiment} className="space-y-3">
              <input type="hidden" name="id" value={e.id} />
              <input type="hidden" name="variable" value={e.variable} />
              <Field label="Name"><input name="name" defaultValue={e.name} className="input" /></Field>
              <Field label="Key"><input name="key" defaultValue={e.key} className="input" /></Field>
              <Field label="Hypothesis"><input name="hypothesis" defaultValue={e.hypothesis ?? ""} className="input" /></Field>
              <Field label="Variants JSON"><textarea name="variants" rows={5} defaultValue={JSON.stringify(e.variants)} className="input font-mono text-xs" /></Field>
              <button className="btn-dark w-full">Save</button>
            </form>
          </Card>
        ) : null}
      </div>
    </>
  );
}
