import Link from "next/link";

export function PageTitle({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {sub ? <p className="mt-1 max-w-2xl text-sm text-mute">{sub}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function Notice({ sp }: { sp: { saved?: string; error?: string } }) {
  if (sp.error) return <p className="mb-4 rounded-lg border border-flare/40 bg-flare/10 p-3 text-sm font-bold">{sp.error}</p>;
  if (sp.saved) return <p className="mb-4 rounded-lg border border-pitch/30 bg-pitch/10 p-3 text-sm font-bold">Saved.</p>;
  return null;
}

export function Stat({ label, value, hint, tone }: { label: string; value: React.ReactNode; hint?: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-chalk p-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-mute">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${tone === "good" ? "text-pitch" : tone === "bad" ? "text-flare" : ""}`}>{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-mute">{hint}</p> : null}
    </div>
  );
}

export function Card({ title, children, id }: { title?: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="mb-6 rounded-xl border border-ink/10 bg-chalk p-4">
      {title ? <h2 className="mb-3 text-lg font-semibold">{title}</h2> : null}
      {children}
    </section>
  );
}

export function RangeForm({ from, to, extra }: { from: string; to: string; extra?: Record<string, string> }) {
  return (
    <form className="flex flex-wrap items-end gap-2 text-sm">
      {Object.entries(extra ?? {}).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <label className="flex flex-col text-xs font-bold">
        From
        <input type="date" name="from" defaultValue={from} className="input" />
      </label>
      <label className="flex flex-col text-xs font-bold">
        To
        <input type="date" name="to" defaultValue={to} className="input" />
      </label>
      <button className="btn-dark min-h-[38px] px-4 text-xs">Apply</button>
    </form>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block text-sm">
      <span className="text-xs font-bold uppercase tracking-wide text-mute">{label}</span>
      <div className="mt-1">{children}</div>
      {hint ? <span className="mt-0.5 block text-xs text-mute">{hint}</span> : null}
    </label>
  );
}

export function EmptyDb() {
  return (
    <p className="rounded-lg border border-dashed border-ink/20 p-4 text-sm">
      Supabase isn&apos;t configured. See <code>README.md</code> → Setup. <Link href="/" className="underline">Storefront</Link>
    </p>
  );
}
