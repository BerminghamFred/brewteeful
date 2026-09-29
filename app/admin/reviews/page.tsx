import { createClient } from "@/lib/supabase/server";
import { toggleReviewAction } from "@/lib/actions/admin";

export default async function AdminReviewsPage() {
  let rows: {
    id: string;
    author_name: string;
    city: string | null;
    rating: number;
    body: string | null;
    approved: boolean;
    product_id: string;
  }[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("reviews")
      .select("id, author_name, city, rating, body, approved, product_id")
      .order("created_at", { ascending: false })
      .limit(200);
    rows = (data ?? []) as typeof rows;
  } catch {
    rows = [];
  }

  return (
    <div>
      <h1 className="font-display text-4xl text-white">Reviews</h1>
      <p className="mt-2 text-sm text-white/55">
        Approve reviews before they appear on the storefront.
      </p>
      <ul className="mt-8 space-y-4">
        {rows.map((r) => (
          <li
            key={r.id}
            className="rounded-xl border border-white/10 bg-brand-concrete/30 p-4"
          >
            <p className="font-medium text-white">{r.author_name}</p>
            <p className="text-xs text-white/45">
              Product {r.product_id.slice(0, 8)}… · {r.city}
            </p>
            <p className="mt-2 text-sm text-white/70">{r.body}</p>
            <form action={toggleReviewAction} className="mt-3 flex gap-2">
              <input type="hidden" name="id" value={r.id} />
              <input
                type="hidden"
                name="approved"
                value={r.approved ? "false" : "true"}
              />
              <button
                type="submit"
                className="rounded-full bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20"
              >
                {r.approved ? "Unapprove" : "Approve"}
              </button>
            </form>
          </li>
        ))}
      </ul>
      {rows.length === 0 && (
        <p className="mt-8 text-sm text-white/45">No reviews.</p>
      )}
    </div>
  );
}
