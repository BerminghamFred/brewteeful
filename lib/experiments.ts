import { cookies } from "next/headers";
import { createClientOptional } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VISITOR_COOKIE = "brewteeful_vid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 400;

export type HeroCopy = {
  headline: string;
  sub: string;
  variantKey: string;
};

function hasServiceRole() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function getHomeHeroExperiment(): Promise<HeroCopy> {
  const defaultCopy: HeroCopy = {
    headline: "Football Culture. Reimagined.",
    sub: "Premium streetwear tees — UK shipped in days.",
    variantKey: "default",
  };

  const supabase = await createClientOptional();
  if (!supabase) return defaultCopy;

  const { data: exp } = await supabase
    .from("experiments")
    .select("id, variants, status")
    .eq("slug", "home-hero-headline")
    .eq("status", "running")
    .maybeSingle();

  if (!exp?.variants) return defaultCopy;

  const variants = exp.variants as Record<
    string,
    { headline?: string; sub?: string }
  >;
  const keys = Object.keys(variants);
  if (keys.length === 0) return defaultCopy;

  const cookieStore = await cookies();
  let vid = cookieStore.get(VISITOR_COOKIE)?.value;
  if (!vid) {
    vid = crypto.randomUUID();
  }

  let variantKey: string | undefined;

  if (hasServiceRole()) {
    try {
      const admin = createAdminClient();
      const { data: existing } = await admin
        .from("experiment_assignments")
        .select("variant_key")
        .eq("visitor_id", vid)
        .eq("experiment_id", exp.id)
        .maybeSingle();

      variantKey = existing?.variant_key as string | undefined;
      if (!variantKey) {
        variantKey = keys[Math.floor(Math.random() * keys.length)]!;
        await admin.from("experiment_assignments").insert({
          visitor_id: vid,
          experiment_id: exp.id,
          variant_key: variantKey,
        });
      }
    } catch {
      variantKey = keys[0];
    }
  } else {
    variantKey = keys[0];
  }

  const v = variants[variantKey ?? keys[0]!];
  if (!v?.headline) return defaultCopy;

  return {
    headline: v.headline,
    sub: v.sub ?? defaultCopy.sub,
    variantKey: variantKey ?? keys[0]!,
  };
}

export async function setVisitorCookieHeader(): Promise<void> {
  /* Cookie set in middleware when missing */
}

export { VISITOR_COOKIE, COOKIE_MAX_AGE };
