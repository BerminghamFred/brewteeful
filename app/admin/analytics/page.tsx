import { createClient } from "@/lib/supabase/server";

export default async function AdminAnalyticsPage() {
  let funnel: { name: string; c: number }[] = [];
  let orders = 0;
  let revenue = 0;

  try {
    const supabase = await createClient();
    const { data: ev } = await supabase
      .from("analytics_events")
      .select("name")
      .gte(
        "created_at",
        new Date(Date.now() - 30 * 86400000).toISOString()
      );
    const map = new Map<string, number>();
    for (const e of ev ?? []) {
      const n = (e as { name: string }).name;
      map.set(n, (map.get(n) ?? 0) + 1);
    }
    funnel = [...map.entries()].map(([name, c]) => ({ name, c }));

    const { data: ord } = await supabase
      .from("orders")
      .select("total_pence")
      .eq("status", "paid");
    orders = ord?.length ?? 0;
    revenue = ord?.reduce((s, o) => s + (o.total_pence as number), 0) ?? 0;
  } catch {
    funnel = [];
  }

  return (
    <div>
      <h1 className="font-display text-4xl text-white">Analytics</h1>
      <p className="mt-2 text-sm text-white/55">
        Events from on-site logging (last 30 days). Use GA4 for full traffic.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-brand-concrete/40 p-6">
          <p className="text-xs uppercase text-white/45">Paid orders</p>
          <p className="mt-2 font-display text-3xl text-brand-accent">{orders}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-brand-concrete/40 p-6">
          <p className="text-xs uppercase text-white/45">Revenue</p>
          <p className="mt-2 font-display text-3xl text-white">
            £{(revenue / 100).toFixed(2)}
          </p>
        </div>
      </div>
      <h2 className="mt-10 font-display text-2xl text-white">Event counts</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {funnel.map((f) => (
          <li
            key={f.name}
            className="flex justify-between rounded-lg border border-white/10 px-3 py-2"
          >
            <span className="text-white/70">{f.name}</span>
            <span className="text-brand-accent">{f.c}</span>
          </li>
        ))}
      </ul>
      {funnel.length === 0 && (
        <p className="mt-4 text-sm text-white/45">
          No events logged yet. POST to /api/analytics from the client or wire
          page_view events.
        </p>
      )}
    </div>
  );
}
