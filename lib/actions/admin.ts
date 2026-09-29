"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") throw new Error("Forbidden");
  return supabase;
}

export async function updateOrderStatus(orderId: string, status: string) {
  const supabase = await requireAdmin();
  await supabase.from("orders").update({ status }).eq("id", orderId);
  revalidatePath("/admin/orders");
}

export async function updateOrderFormAction(formData: FormData) {
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;
  await updateOrderStatus(id, status);
}

export async function setReviewApproved(reviewId: string, approved: boolean) {
  const supabase = await requireAdmin();
  await supabase.from("reviews").update({ approved }).eq("id", reviewId);
  revalidatePath("/admin/reviews");
}

export async function toggleReviewAction(formData: FormData) {
  const id = formData.get("id") as string;
  const approved = formData.get("approved") === "true";
  await setReviewApproved(id, approved);
}

export async function updateExperimentStatusAction(formData: FormData) {
  const supabase = await requireAdmin();
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;
  await supabase.from("experiments").update({ status }).eq("id", id);
  revalidatePath("/admin/experiments");
}

export async function upsertSiteSetting(
  key: string,
  value: Record<string, unknown>
) {
  const supabase = await requireAdmin();
  await supabase.from("site_settings").upsert({ key, value });
  revalidatePath("/admin/settings");
}

export async function saveFloatingBannerAction(formData: FormData) {
  const text = (formData.get("text") as string) ?? "";
  const enabled = formData.get("enabled") === "on";
  await upsertSiteSetting("floating_offer", { enabled, text });
}

export async function saveExitPopupAction(formData: FormData) {
  await upsertSiteSetting("exit_popup", {
    enabled: formData.get("enabled") === "on",
    title: formData.get("title") as string,
    subtitle: formData.get("subtitle") as string,
    discountPercent: parseInt(
      (formData.get("discount") as string) ?? "10",
      10
    ),
  });
}

export async function upsertDiscountCode(formData: FormData) {
  const supabase = await requireAdmin();
  const code = (formData.get("code") as string)?.trim().toUpperCase();
  const percent = formData.get("percent_off")
    ? parseFloat(formData.get("percent_off") as string)
    : null;
  const id = formData.get("id") as string | null;
  if (!code) throw new Error("Code required");
  if (id) {
    await supabase
      .from("discount_codes")
      .update({
        code,
        percent_off: percent,
        active: formData.get("active") === "on",
      })
      .eq("id", id);
  } else {
    await supabase.from("discount_codes").insert({
      code,
      percent_off: percent,
      active: true,
    });
  }
  revalidatePath("/admin/offers");
}
