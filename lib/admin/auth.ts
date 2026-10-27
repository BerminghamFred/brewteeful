import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Returns an RLS-bound client for a verified admin, or throws. Middleware also guards /admin. */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") throw new Error("Forbidden");
  return supabase;
}
