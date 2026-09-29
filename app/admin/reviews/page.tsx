import { requireAdmin } from "@/lib/admin/auth";
import { saveReview, toggleReview } from "@/lib/admin/actions";
import { Card, Field, Notice, PageTitle } from "@/components/admin/ui";
import type { Review } from "@/lib/types";

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const sp = await searchParams;
  const db = await requireAdmin();
  const { data } = await db.from("reviews").select("*").order("created_at", { ascending: false });
  const reviews = (data ?? []) as Review[];
  return (
    <>
      <PageTitle
        title="Reviews"
        sub="Only genuine customer feedback. Enter the order number to mark it Verified. Nothing shows on the site until approved, and the reviews section stays hidden until there is at least one."
      />
      <Notice sp={sp} />
      <Card title="Add a customer review">
        <form action={saveReview} className="grid gap-3 md:grid-cols-4">
          <Field label="Customer name (as they'd like it shown)"><input name="author_name" required className="input" /></Field>
          <Field label="Order number"><input name="order_number" type="number" className="input" /></Field>
          <Field label="Rating"><input name="rating" type="number" min={1} max={5} defaultValue={5} className="input" /></Field>
          <label className="flex items-center gap-2 self-end text-sm font-bold"><input type="checkbox" name="approved" /> Approve now</label>
          <div className="md:col-span-4"><Field label="Their words (verbatim)"><textarea name="body" rows={3} className="input" /></Field></div>
          <button className="btn-dark md:col-span-4">Add review</button>
        </form>
      </Card>
      <Card>
        {reviews.map((r) => (
          <div key={r.id} className="flex items-start gap-3 border-t border-ink/10 py-3 text-sm first:border-0">
            <div className="flex-1">
              <p className="font-bold">{"★".repeat(r.rating)} {r.author_name} {r.verified ? <span className="rounded bg-pitch px-1 text-xs text-chalk">verified</span> : null}</p>
              <p className="mt-1">{r.body}</p>
            </div>
            <form action={toggleReview}>
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="approved" value={String(!r.approved)} />
              <button className="rounded border border-ink/10 px-2 text-xs font-bold">{r.approved ? "Unpublish" : "Approve"}</button>
            </form>
          </div>
        ))}
        {!reviews.length ? <p className="text-sm text-mute">No reviews yet — ask your first customers after delivery.</p> : null}
      </Card>
    </>
  );
}
