import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/supabase/public";
import { ResumeOrder } from "@/components/checkout/ResumeOrder";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your order", robots: { index: false } };

/** "Finish my order" link from the reminder email: puts their set back in the basket. */
export default async function ResumePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id) || !hasServiceRole()) notFound();
  const db = createAdminClient();
  const { data: order } = await db.from("orders").select("id, status, email, event_date").eq("id", id).maybeSingle();
  if (!order) notFound();
  if (order.status === "paid") {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="h-display text-4xl">This one&apos;s already paid.</h1>
        <p className="mt-3 text-ink/70">Thanks — your order is in. Check your email for the confirmation.</p>
        <Link href="/" className="btn-primary mt-6">Back to the shop</Link>
      </div>
    );
  }
  const { data: items } = await db.from("order_items").select("position, product_id, size, nickname").eq("order_id", id).order("position");
  const ids = [...new Set((items ?? []).map((i) => i.product_id).filter(Boolean))] as string[];
  const { data: products } = ids.length ? await db.from("products").select("id, slug, status").in("id", ids) : { data: [] };
  const slug = new Map((products ?? []).filter((p) => p.status === "active").map((p) => [p.id, p.slug]));
  const people = (items ?? [])
    .map((i) => ({ design: (i.product_id && slug.get(i.product_id)) || null, size: i.size && i.size !== "TBC" ? i.size : null, nickname: i.nickname ?? "" }))
    .filter((p) => p.design);
  return <ResumeOrder people={people} email={order.email} eventDate={order.event_date} />;
}
