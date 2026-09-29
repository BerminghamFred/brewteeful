import { createClient } from "@/lib/supabase/server";
import { updateOrderFormAction } from "@/lib/actions/admin";

export default async function AdminOrdersPage() {
  let rows: {
    id: string;
    email: string | null;
    status: string;
    total_pence: number;
    created_at: string;
  }[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("orders")
      .select("id, email, status, total_pence, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    rows = (data ?? []) as typeof rows;
  } catch {
    rows = [];
  }

  return (
    <div>
      <h1 className="font-display text-4xl text-white">Orders</h1>
      <table className="mt-8 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-white/45">
            <th className="pb-2">Date</th>
            <th className="pb-2">Email</th>
            <th className="pb-2">Total</th>
            <th className="pb-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id} className="border-b border-white/5">
              <td className="py-3 text-white/70">
                {new Date(o.created_at).toLocaleString("en-GB")}
              </td>
              <td className="text-white">{o.email ?? "—"}</td>
              <td>£{(o.total_pence / 100).toFixed(2)}</td>
              <td>
                <form action={updateOrderFormAction} className="flex gap-2">
                  <input type="hidden" name="id" value={o.id} />
                  <select
                    name="status"
                    defaultValue={o.status}
                    className="rounded border border-white/15 bg-brand-ink px-2 py-1 text-xs text-white"
                  >
                    <option value="paid">paid</option>
                    <option value="fulfilled">fulfilled</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                  <button
                    type="submit"
                    className="rounded bg-white/10 px-2 text-xs hover:bg-white/20"
                  >
                    Save
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="mt-8 text-sm text-white/45">No orders yet.</p>
      )}
    </div>
  );
}
