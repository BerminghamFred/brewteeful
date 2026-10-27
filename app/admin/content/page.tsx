import { requireAdmin } from "@/lib/admin/auth";
import { deleteFaq, saveFaq, saveSettings } from "@/lib/admin/actions";
import { Card, Field, Notice, PageTitle } from "@/components/admin/ui";
import { mergeSettings, SETTINGS_KEYS, type SettingsKey } from "@/lib/settings";
import type { Faq } from "@/lib/types";

const GROUPS: Record<SettingsKey, { title: string; help: string }> = {
  content: { title: "Homepage copy", help: "Hero headline, CTA, why-us points and guarantee. Keep 'stag' in the headline for Ads relevance. Add a real group photo URL as soon as you have one." },
  pricing: { title: "Pricing & delivery charges", help: "Minimum group size, free-delivery threshold and express option. Amounts in pence." },
  delivery: { title: "Delivery messaging", help: "Production and delivery working days drive the date checker. Be conservative." },
  economics: { title: "Economics assumptions", help: "Used for contribution. Pence and percentages. Never shown to customers." },
  contact: { title: "Contact & business details", help: "A business name and address are legally required for UK distance selling." },
  seo: { title: "SEO defaults", help: "Default title/description for pages without their own." },
  sizing: { title: "Sizes & size guide", help: "Size list used by the builder and the size-guide table (JSON)." },
};

const LONG = new Set(["details", "returns_policy", "hero_subheadline", "final_cta_body", "garment_info", "fit_note", "default_description", "business_address"]);

function SettingsForm({ k, value }: { k: SettingsKey; value: Record<string, unknown> }) {
  return (
    <form action={saveSettings} className="grid gap-3 md:grid-cols-2">
      <input type="hidden" name="key" value={k} />
      {Object.entries(value).map(([field, v]) => {
        const name = `f_${field}`;
        const label = field.replace(/_/g, " ");
        if (typeof v === "boolean")
          return (
            <label key={field} className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" name={name} defaultChecked={v} /> {label}
            </label>
          );
        if (typeof v === "number")
          return <Field key={field} label={label}><input name={name} type="number" step="any" defaultValue={v} className="input" /></Field>;
        if (typeof v === "string")
          return (
            <div key={field} className={LONG.has(field) ? "md:col-span-2" : ""}>
              <Field label={label}>
                {LONG.has(field) ? <textarea name={name} rows={3} defaultValue={v} className="input" /> : <input name={name} defaultValue={v} className="input" />}
              </Field>
            </div>
          );
        return (
          <div key={field} className="md:col-span-2">
            <Field label={`${label} (JSON)`}>
              <textarea name={name} rows={6} defaultValue={JSON.stringify(v, null, 2)} className="input font-mono text-xs" />
            </Field>
          </div>
        );
      })}
      <button className="btn-dark md:col-span-2">Save {GROUPS[k].title.toLowerCase()}</button>
    </form>
  );
}

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const sp = await searchParams;
  const db = await requireAdmin();
  const [{ data: rows }, { data: faqs }] = await Promise.all([
    db.from("site_settings").select("key, value"),
    db.from("faqs").select("*").order("sort_order"),
  ]);
  const settings = mergeSettings(rows);

  return (
    <>
      <PageTitle title="Content & settings" sub="Everything commercial is editable here — no code changes. Saved changes appear on the site within a few seconds." />
      <Notice sp={sp} />
      <nav className="mb-4 flex flex-wrap gap-2 text-sm">
        {SETTINGS_KEYS.map((k) => <a key={k} href={`#${k}`} className="rounded-full border border-ink/10 px-3 py-1 font-bold">{GROUPS[k].title}</a>)}
        <a href="#faqs" className="rounded-full border border-ink/10 px-3 py-1 font-bold">FAQs</a>
      </nav>
      {SETTINGS_KEYS.map((k) => (
        <Card key={k} id={k} title={GROUPS[k].title}>
          <p className="mb-3 text-xs text-mute">{GROUPS[k].help}</p>
          <SettingsForm k={k} value={settings[k] as Record<string, unknown>} />
        </Card>
      ))}
      <Card id="faqs" title="FAQs">
        <div className="space-y-3">
          {((faqs ?? []) as Faq[]).map((f) => (
            <details key={f.id} className="rounded-lg border border-ink/10 p-3">
              <summary className="cursor-pointer text-sm font-bold">{f.active ? "" : "(hidden) "}{f.question}</summary>
              <form action={saveFaq} className="mt-3 space-y-2">
                <input type="hidden" name="id" value={f.id} />
                <input name="question" defaultValue={f.question} className="input" />
                <textarea name="answer" defaultValue={f.answer} rows={3} className="input" />
                <div className="flex items-center gap-3">
                  <input name="sort_order" type="number" defaultValue={f.sort_order} className="input w-24" />
                  <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="active" defaultChecked={f.active} /> Visible</label>
                  <button className="btn-dark min-h-[34px] px-4 text-xs">Save</button>
                </div>
              </form>
              <form action={deleteFaq} className="mt-2"><input type="hidden" name="id" value={f.id} /><button className="text-xs underline">Delete</button></form>
            </details>
          ))}
        </div>
        <form action={saveFaq} className="mt-4 space-y-2">
          <p className="text-sm font-bold">Add FAQ</p>
          <input name="question" required placeholder="Question" className="input" />
          <textarea name="answer" required placeholder="Answer" rows={3} className="input" />
          <div className="flex items-center gap-3">
            <input name="sort_order" type="number" defaultValue={(faqs?.length ?? 0) + 1} className="input w-24" />
            <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="active" defaultChecked /> Visible</label>
            <button className="btn-dark min-h-[34px] px-4 text-xs">Add</button>
          </div>
        </form>
      </Card>
    </>
  );
}
