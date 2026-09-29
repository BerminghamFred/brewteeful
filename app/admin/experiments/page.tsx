import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { saveExperiment } from "@/lib/admin/actions";
import { Card, Field, Notice, PageTitle } from "@/components/admin/ui";
import type { Experiment } from "@/lib/types";

const EXAMPLE_VARIANTS: Record<string, string> = {
  price: `[{"key":"control","name":"£20","weight":50,"config":{}},{"key":"p2199","name":"£21.99","weight":50,"config":{"unit_price_pence":2199}}]`,
  headline: `[{"key":"control","name":"Current","weight":50,"config":{}},{"key":"b","name":"Different design for everyone","weight":50,"config":{"headline":"A different shirt for everyone.","subheadline":"..."}}]`,
  cta: `[{"key":"control","name":"Build your stag set","weight":50,"config":{}},{"key":"b","name":"Sort the shirts","weight":50,"config":{"cta":"Sort the shirts"}}]`,
  hero_image: `[{"key":"control","name":"Current","weight":50,"config":{}},{"key":"b","name":"Group photo 2","weight":50,"config":{"hero_image_url":"https://..."}}]`,
  offer: `[{"key":"control","name":"No offer","weight":50,"config":{"offer_ids":[]}},{"key":"b","name":"8+ £10 off","weight":50,"config":{"offer_ids":["<offer id>"]}}]`,
  free_shipping: `[{"key":"control","name":"Free on all sets","weight":50,"config":{}},{"key":"b","name":"Free on 8+","weight":50,"config":{"free_shipping_min_items":8}}]`,
  min_group_size: `[{"key":"control","name":"Min 5","weight":50,"config":{}},{"key":"b","name":"Min 4","weight":50,"config":{"min_group_size":4}}]`,
};

export default async function ExperimentsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const sp = await searchParams;
  const db = await requireAdmin();
  const { data } = await db.from("experiments").select("*").order("created_at", { ascending: false });
  const rows = (data ?? []) as Experiment[];
  return (
    <>
      <PageTitle
        title="Experiments"
        sub="Winners are judged on contribution per visitor, not conversion rate. Rough guide: you need ~1,000+ visitors per variant before anything but huge differences is real — don't run tests during the first £300."
      />
      <Notice sp={sp} />
      <Card>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-mute">
            <tr><th className="py-1">Name</th><th>Variable</th><th>Status</th><th>Started</th><th>Winner</th></tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id} className="border-t border-ink/10">
                <td className="py-2"><Link href={`/admin/experiments/${e.id}`} className="font-bold underline">{e.name}</Link> <span className="text-xs text-mute">{e.key}</span></td>
                <td>{e.variable}</td>
                <td>{e.status}</td>
                <td>{e.started_at?.slice(0, 10) ?? "—"}</td>
                <td>{e.winner ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? <p className="text-sm text-mute">No experiments yet.</p> : null}
      </Card>
      <Card title="New experiment">
        <form action={saveExperiment} className="grid gap-3 md:grid-cols-2">
          <Field label="Name"><input name="name" required className="input" placeholder="£20 vs £21.99" /></Field>
          <Field label="Key" hint="Stored on sessions/orders; also used for ?exp_<key>=<variant> QA links"><input name="key" required className="input" placeholder="price-2199" /></Field>
          <Field label="Variable">
            <select name="variable" className="input">
              {Object.keys(EXAMPLE_VARIANTS).map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="Hypothesis"><input name="hypothesis" className="input" placeholder="Higher price won't reduce conversion enough to cut contribution/visitor" /></Field>
          <div className="md:col-span-2">
            <Field label="Variants (JSON)" hint="weight = traffic share. Examples per variable below.">
              <textarea name="variants" required rows={4} className="input font-mono text-xs" defaultValue={EXAMPLE_VARIANTS.price} />
            </Field>
          </div>
          <button className="btn-dark md:col-span-2">Create (as draft)</button>
        </form>
        <details className="mt-4 text-xs">
          <summary className="cursor-pointer font-bold">Variant examples</summary>
          {Object.entries(EXAMPLE_VARIANTS).map(([k, v]) => (
            <p key={k} className="mt-2"><strong>{k}:</strong> <code className="break-all">{v}</code></p>
          ))}
        </details>
      </Card>
    </>
  );
}
