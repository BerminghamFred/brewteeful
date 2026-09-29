import { createClient } from "@/lib/supabase/server";

export default async function AdminHomePage() {
  let orders = 0;
  let revenue = 0;
  let products = 0;
  try {
    const supabase = await createClient();
    const [{ count: oc }, { data: sums }, { count: pc }] = await Promise.all([
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("total_pence").eq("status", "paid"),
      supabase.from("products").select("*", { count: "exact", head: true }),
    ]);
    orders = oc ?? 0;
    products = pc ?? 0;
    revenue =
      sums?.reduce((s, r) => s + (r.total_pence as number), 0) ?? 0;
  } catch {
    /* no DB */
  }

  return (
    <div>
      <h1 className="font-display text-4xl text-white">Overview</h1>
      <p className="mt-2 text-sm text-white/55">
        Revenue and orders from Supabase. Connect GA for traffic.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-brand-concrete/40 p-6">
          <p className="text-xs uppercase text-white/45">Orders (paid)</p>
          <p className="mt-2 font-display text-3xl text-brand-accent">{orders}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-brand-concrete/40 p-6">
          <p className="text-xs uppercase text-white/45">Revenue</p>
          <p className="mt-2 font-display text-3xl text-white">
            £{(revenue / 100).toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-brand-concrete/40 p-6">
          <p className="text-xs uppercase text-white/45">Products</p>
          <p className="mt-2 font-display text-3xl text-white">{products}</p>
        </div>
      </div>
    </div>
  );
}
