import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { bulkFulfilment } from "@/lib/admin/actions";
import { Card, Notice, PageTitle } from "@/components/admin/ui";
import type { Order, OrderItem } from "@/lib/types";

/** Everything paid but not yet sent to print/shipped: designs × sizes to order from the printer. */
export default async function PickListPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string; s?: string }> }) {
  const sp = await searchParams;
  const status = sp.s === "in_production" ? "in_production" : "unfulfilled";
  const db = await requireAdmin();
  const { data: orders } = await db
    .from("orders")
    .select("*")
    .eq("status", "paid")
    .eq("fulfilment_status", status)
    .order("paid_at")
    .returns<Order[]>();
  const ids = (orders ?? []).map((o) => o.id);
  const { data: items } = ids.length
    ? await db.from("order_items").select("*").in("order_id", ids).order("position").returns<OrderItem[]>()
    : { data: [] as OrderItem[] };

  const sizes = [...new Set((items ?? []).map((i) => i.size))];
  const matrix = new Map<string, Map<string, number>>();
  for (const i of items ?? []) {
    const row = matrix.get(i.product_name) ?? new Map<string, number>();
    row.set(i.size, (row.get(i.size) ?? 0) + 1);
    matrix.set(i.product_name, row);
  }

  return (
    <>
      <PageTitle title="Production pick list" sub="Totals to send to the printer, plus each order's lineup for packing.">
        <div className="flex gap-2 text-sm">
          <Link href="?s=unfulfilled" className={`rounded-full border border-ink/10 px-3 py-1 font-bold ${status === "unfulfilled" ? "bg-ink text-paper" : ""}`}>Not yet printed</Link>
          <Link href="?s=in_production" className={`rounded-full border border-ink/10 px-3 py-1 font-bold ${status === "in_production" ? "bg-ink text-paper" : ""}`}>In production</Link>
        </div>
      </PageTitle>
      <Notice sp={sp} />
      <Card title={`Totals — ${items?.length ?? 0} shirts across ${ids.length} orders`}>
        {matrix.size ? (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-mute">
              <tr>
                <th className="py-1">Design</th>
                {sizes.map((s) => <th key={s} className="text-right">{s}</th>)}
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {[...matrix.entries()].map(([name, row]) => (
                <tr key={name} className="border-t border-ink/10">
                  <td className="py-2 font-bold">{name}</td>
                  {sizes.map((s) => <td key={s} className="text-right tabular-nums">{row.get(s) ?? ""}</td>)}
                  <td className="text-right font-semibold tabular-nums">{[...row.values()].reduce((a, b) => a + b, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-mute">Nothing waiting.</p>
        )}
      </Card>
      {ids.length ? (
        <form action={bulkFulfilment}>
          {(orders ?? []).map((o) => (
            <Card key={o.id}>
              <label className="flex items-start gap-3">
                <input type="checkbox" name="ids" value={o.id} defaultChecked className="mt-1" />
                <div className="flex-1 text-sm">
                  <p className="font-semibold">
                    <Link href={`/admin/orders/${o.id}`} className="underline">#{o.order_number}</Link> — {o.customer_name} · {o.item_count} shirts
                    {o.event_date ? <span className="ml-2 rounded bg-sun px-1.5">Stag {o.event_date}</span> : null}
                    {o.shipping_method === "express" ? <span className="ml-2 rounded bg-flare px-1.5">EXPRESS</span> : null}
                  </p>
                  <p className="mt-1 text-mute">
                    {(items ?? []).filter((i) => i.order_id === o.id).map((i) => `${i.product_name} ${i.size}${i.nickname ? ` (${i.nickname})` : ""}`).join(" · ")}
                  </p>
                </div>
              </label>
            </Card>
          ))}
          <div className="flex gap-2">
            <select name="to" className="input max-w-xs" defaultValue={status === "unfulfilled" ? "in_production" : "shipped"}>
              <option value="in_production">Mark selected as in production</option>
              <option value="shipped">Mark selected as shipped</option>
            </select>
            <button className="btn-dark min-h-[38px] px-4 text-xs">Update</button>
          </div>
        </form>
      ) : null}
    </>
  );
}
