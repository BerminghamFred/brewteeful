import { requireAdmin } from "@/lib/admin/auth";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { Notice, PageTitle } from "@/components/admin/ui";
import type { Collection } from "@/lib/types";

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const db = await requireAdmin();
  const { data } = await db.from("collections").select("*").order("sort_order");
  return (
    <>
      <PageTitle title="New design" />
      <Notice sp={sp} />
      <ProductEditor collections={(data ?? []) as Collection[]} />
    </>
  );
}
