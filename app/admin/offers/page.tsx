import { requireAdmin } from "@/lib/admin/auth";
import { deleteOffer, saveDiscountCode, saveOffer, toggleDiscountCode, toggleOffer } from "@/lib/admin/actions";
import { Card, Field, Notice, PageTitle } from "@/components/admin/ui";
import { isInWindow } from "@/lib/pricing";
import { gbp } from "@/lib/format";
import type { DiscountCode, Offer } from "@/lib/types";

const KINDS = {
  banner: "Site-wide banner (top of every page)",
  badge: "Floating badge (bottom corner)",
  modal: "Promo modal (once per visitor)",
  quantity_discount: "Quantity discount (e.g. 8+ shirts → £10 off)",
  free_shipping: "Free delivery threshold",
} as const;

const local = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

function OfferForm({ offer }: { offer?: Offer }) {
  const c = (offer?.config ?? {}) as Record<string, string | number | null>;
  const v = (k: string) => (c[k] == null ? "" : String(c[k]));
  return (
    <form action={saveOffer} className="grid gap-3 md:grid-cols-3">
      <input type="hidden" name="id" value={offer?.id ?? ""} />
      <Field label="Type">
        <select name="kind" defaultValue={offer?.kind ?? "banner"} className="input">
          {Object.entries(KINDS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </Field>
      <Field label="Internal name"><input name="name" defaultValue={offer?.name} className="input" /></Field>
      <Field label="Priority" hint="Higher wins when several banners are live"><input name="priority" type="number" defaultValue={offer?.priority ?? 0} className="input" /></Field>
      <Field label="Text (banner / badge)"><input name="text" defaultValue={v("text")} className="input" placeholder="Free UK delivery on every stag set" /></Field>
      <Field label="Link (banner / badge)"><input name="link" defaultValue={v("link")} className="input" placeholder="/build" /></Field>
      <Field label="Label (discounts)" hint="Shown in basket, e.g. '£10 off 8+ shirts'"><input name="label" defaultValue={v("label")} className="input" /></Field>
      <Field label="Min shirts (discounts / free delivery)"><input name="min_items" type="number" defaultValue={v("min_items")} className="input" /></Field>
      <Field label="£ off whole order"><input name="amount_off" inputMode="decimal" defaultValue={c.amount_off_pence ? (Number(c.amount_off_pence) / 100).toFixed(2) : ""} className="input" /></Field>
      <Field label="or % off"><input name="percent_off" type="number" defaultValue={v("percent_off")} className="input" /></Field>
      <Field label="Modal title"><input name="title" defaultValue={v("title")} className="input" /></Field>
      <Field label="Modal body"><input name="body" defaultValue={v("body")} className="input" /></Field>
      <Field label="Modal code (optional)"><input name="code" defaultValue={v("code")} className="input" /></Field>
      <Field label="Modal button label"><input name="cta_label" defaultValue={v("cta_label")} className="input" /></Field>
      <Field label="Modal button link"><input name="cta_link" defaultValue={v("cta_link")} className="input" /></Field>
      <Field label="Modal delay (seconds)"><input name="delay_seconds" type="number" defaultValue={v("delay_seconds") || "8"} className="input" /></Field>
      <Field label="Starts (optional)"><input name="starts_at" type="datetime-local" defaultValue={local(offer?.starts_at ?? null)} className="input" /></Field>
      <Field label="Ends (optional)" hint="Only use an end date that's real — no fake countdowns."><input name="ends_at" type="datetime-local" defaultValue={local(offer?.ends_at ?? null)} className="input" /></Field>
      <label className="flex items-center gap-2 self-end text-sm font-bold">
        <input type="checkbox" name="active" defaultChecked={offer?.active ?? false} /> Active
      </label>
      <button className="btn-dark min-h-[38px] md:col-span-3">{offer ? "Save offer" : "Create offer"}</button>
    </form>
  );
}

function describe(o: Offer) {
  const c = o.config as Record<string, unknown>;
  switch (o.kind) {
    case "quantity_discount":
      return `${c.min_items}+ shirts → ${c.amount_off_pence ? gbp(Number(c.amount_off_pence)) : `${c.percent_off}%`} off`;
    case "free_shipping":
      return `Free delivery on ${c.min_items}+ shirts`;
    case "modal":
      return String(c.title ?? "");
    default:
      return String(c.text ?? "");
  }
}

export default async function OffersPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const sp = await searchParams;
  const db = await requireAdmin();
  const [{ data: offers }, { data: codes }] = await Promise.all([
    db.from("offers").select("*").order("created_at", { ascending: false }),
    db.from("discount_codes").select("*").order("created_at", { ascending: false }),
  ]);
  const now = new Date();

  return (
    <>
      <PageTitle title="Offers & codes" sub="Changes go live within seconds. Quantity discounts don't stack with each other; codes apply on top." />
      <Notice sp={sp} />
      <Card title="Offers">
        <div className="space-y-2">
          {((offers ?? []) as Offer[]).map((o) => {
            const live = o.active && isInWindow(o, now);
            return (
              <details key={o.id} className="rounded-lg border-2 border-ink/20 p-3">
                <summary className="flex cursor-pointer flex-wrap items-center gap-2 text-sm">
                  <span className={`rounded px-1.5 text-xs font-bold ${live ? "bg-pitch text-chalk" : "bg-ink/10"}`}>{live ? "LIVE" : o.active ? "scheduled" : "off"}</span>
                  <strong>{o.name}</strong>
                  <span className="text-mute">{KINDS[o.kind]} — {describe(o)}</span>
                  <span className="ml-auto flex gap-2">
                    <form action={toggleOffer}>
                      <input type="hidden" name="id" value={o.id} />
                      <input type="hidden" name="active" value={String(!o.active)} />
                      <button className="rounded border-2 border-ink px-2 text-xs font-bold">{o.active ? "Turn off" : "Turn on"}</button>
                    </form>
                    <form action={deleteOffer}>
                      <input type="hidden" name="id" value={o.id} />
                      <button className="rounded border-2 border-flare px-2 text-xs font-bold">Delete</button>
                    </form>
                  </span>
                </summary>
                <div className="mt-3"><OfferForm offer={o} /></div>
              </details>
            );
          })}
        </div>
        <details className="mt-4">
          <summary className="cursor-pointer font-bold">+ New offer</summary>
          <div className="mt-3"><OfferForm /></div>
        </details>
      </Card>

      <Card title="Discount codes">
        <table className="mb-4 w-full text-sm">
          <thead className="text-left text-xs uppercase text-mute">
            <tr><th>Code</th><th>Discount</th><th>Min</th><th>Uses</th><th>Window</th><th /></tr>
          </thead>
          <tbody>
            {((codes ?? []) as DiscountCode[]).map((c) => (
              <tr key={c.id} className="border-t border-ink/10">
                <td className="py-2 font-mono font-bold">{c.code}</td>
                <td>{c.kind === "percent" ? `${c.value}%` : c.kind === "fixed" ? gbp(c.value) : "Free delivery"}</td>
                <td>{c.min_items || "—"}</td>
                <td>{c.uses_count}{c.max_uses ? ` / ${c.max_uses}` : ""}</td>
                <td className="text-xs">{c.starts_at?.slice(0, 10) ?? "…"} → {c.ends_at?.slice(0, 10) ?? "…"}</td>
                <td className="text-right">
                  <form action={toggleDiscountCode}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="active" value={String(!c.active)} />
                    <button className="rounded border-2 border-ink px-2 text-xs font-bold">{c.active ? "Disable" : "Enable"}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <form action={saveDiscountCode} className="grid gap-3 md:grid-cols-4">
          <Field label="Code"><input name="code" required className="input uppercase" /></Field>
          <Field label="Type">
            <select name="kind" className="input">
              <option value="percent">% off</option>
              <option value="fixed">£ off</option>
              <option value="free_shipping">Free delivery</option>
            </select>
          </Field>
          <Field label="Value" hint="% or £"><input name="value" inputMode="decimal" className="input" /></Field>
          <Field label="Min shirts"><input name="min_items" type="number" className="input" /></Field>
          <Field label="Max uses"><input name="max_uses" type="number" className="input" /></Field>
          <Field label="Starts"><input name="starts_at" type="datetime-local" className="input" /></Field>
          <Field label="Ends"><input name="ends_at" type="datetime-local" className="input" /></Field>
          <label className="flex items-center gap-2 self-end text-sm font-bold"><input type="checkbox" name="active" defaultChecked /> Active</label>
          <button className="btn-dark min-h-[38px] md:col-span-4">Create code</button>
        </form>
      </Card>
    </>
  );
}
