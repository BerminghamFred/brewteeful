import { createClient } from "@/lib/supabase/server";
import { upsertDiscountCode } from "@/lib/actions/admin";

export default async function AdminOffersPage() {
  let codes: {
    id: string;
    code: string;
    percent_off: number | null;
    active: boolean;
  }[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("discount_codes")
      .select("id, code, percent_off, active")
      .order("created_at", { ascending: false });
    codes = (data ?? []) as typeof codes;
  } catch {
    codes = [];
  }

  return (
    <div>
      <h1 className="font-display text-4xl text-white">Offers & codes</h1>
      <p className="mt-2 text-sm text-white/55">
        Floating banner and popups are under Site settings.
      </p>
      <form action={upsertDiscountCode} className="mt-8 max-w-md space-y-4 rounded-xl border border-white/10 p-6">
        <p className="text-sm font-medium text-white">New discount code</p>
        <div>
          <label className="text-xs text-white/45">Code</label>
          <input
            name="code"
            required
            className="mt-1 w-full rounded-lg border border-white/15 bg-brand-ink px-3 py-2 text-sm uppercase text-white"
          />
        </div>
        <div>
          <label className="text-xs text-white/45">% off</label>
          <input
            name="percent_off"
            type="number"
            step="0.01"
            className="mt-1 w-full rounded-lg border border-white/15 bg-brand-ink px-3 py-2 text-sm text-white"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-white/70">
          <input type="checkbox" name="active" defaultChecked className="accent-brand-accent" />
          Active
        </label>
        <button
          type="submit"
          className="rounded-full bg-brand-accent px-4 py-2 text-sm font-semibold text-brand-dark"
        >
          Save code
        </button>
      </form>

      <ul className="mt-10 space-y-2">
        {codes.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between rounded-lg border border-white/10 px-4 py-2 text-sm"
          >
            <span className="font-mono text-brand-accent">{c.code}</span>
            <span className="text-white/55">
              {c.percent_off ?? 0}% · {c.active ? "active" : "off"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
