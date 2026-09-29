import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { Card, PageTitle } from "@/components/admin/ui";
import { gbp } from "@/lib/format";
import type { Order } from "@/lib/types";

const FILTERS = [
  ["to_fulfil", "To fulfil"],
  ["shipped", "Shipped"],
  ["all_paid", "All paid"],
  ["pending", "Abandoned checkouts"],
  ["refunded", "Refunded"],
] as const;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f = "to_fulfil" } = await searchParams;
  const db = await requireAdmin();
  let q = db.from("orders").select("*").order("created_at", { ascending: false }).limit(300);
  if (f === "to_fulfil") q = q.eq("status", "paid").in("fulfilment_status", ["unfulfilled", "in_production"]);
  else if (f === "shipped") q = q.in("fulfilment_status", ["shipped", "delivered"]);
  else if (f === "all_paid") q = q.in("status", ["paid", "partially_refunded"]);
  else if (f === "pending") q = q.in("status", ["pending", "cancelled"]);
  else if (f === "refunded") q = q.in("status", ["refunded", "partially_refunded"]);
  const { data } = await q;
  const orders = (data ?? []) as Order[];

  return (
    <>
      <PageTitle title="Orders" sub="Refunds are issued in the Stripe dashboard and sync back here automatically.">
        <Link href="/admin/orders/pick-list" className="btn-dark min-h-[38px] px-4 text-xs">Production pick list</Link>
      </PageTitle>
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {FILTERS.map(([k, label]) => (
          <Link key={k} href={`?f=${k}`} className={`rounded-full border-2 border-ink px-3 py-1 font-bold ${f === k ? "bg-ink text-paper" : "bg-chalk"}`}>
            {label}
          </Link>
        ))}
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="text-left text-xs uppercase text-mute">
              <tr>
                <th className="py-1">#</th>
                <th>Placed</th>
                <th>Customer</th>
                <th className="text-right">Shirts</th>
                <th className="text-right">Total</th>
                <th>Payment</th>
                <th>Fulfilment</th>
                <th>Stag date</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-ink/10">
                  <td className="py-2 font-bold">
                    <Link href={`/admin/orders/${o.id}`} className="underline">#{o.order_number}</Link>
                  </td>
                  <td>{new Date(o.paid_at ?? o.created_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td className="max-w-[200px] truncate">{o.customer_name ?? o.email ?? "—"}</td>
                  <td className="text-right tabular-nums">{o.item_count}</td>
                  <td className="text-right tabular-nums">{gbp(o.total_pence, { whole: false })}</td>
                  <td>{o.status}</td>
                  <td>{o.fulfilment_status}</td>
                  <td>{o.event_date ?? "—"}</td>
                  <td className="max-w-[180px] truncate text-xs text-mute">
                    {[o.attribution?.utm_source, o.attribution?.utm_term].filter(Boolean).join(" · ") || (o.attribution?.gclid ? "google (gclid)" : "direct")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!orders.length ? <p className="text-sm text-mute">Nothing here.</p> : null}
      </Card>
    </>
  );
}
