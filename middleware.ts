import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { COOKIES, SESSION_MAX_AGE, VISITOR_MAX_AGE } from "@/lib/cookies";

const CAMPAIGN_PARAMS = ["gclid", "gbraid", "wbraid", "fbclid", "utm_source", "utm_campaign"];

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const denied = await guardAdmin(request);
    if (denied) return denied;
  }

  // Make ids available to this same request's server components.
  const vid = request.cookies.get(COOKIES.visitor)?.value ?? crypto.randomUUID();
  const arrivingFromCampaign = CAMPAIGN_PARAMS.some((p) => searchParams.has(p));
  const existingSid = request.cookies.get(COOKIES.session)?.value;
  const sid = !existingSid || arrivingFromCampaign ? crypto.randomUUID() : existingSid;
  request.cookies.set(COOKIES.visitor, vid);
  request.cookies.set(COOKIES.session, sid);

  // QA: ?exp_<key>=<variant> pins a variant for this browser.
  let force = request.cookies.get(COOKIES.force)?.value;
  for (const [k, v] of searchParams) {
    if (k.startsWith("exp_")) {
      const key = k.slice(4);
      const rest = (force ?? "").split(",").filter((p) => p && !p.startsWith(`${key}:`));
      force = [...rest, `${key}:${v}`].join(",");
    }
  }
  if (force !== undefined) request.cookies.set(COOKIES.force, force);

  const response = NextResponse.next({ request: { headers: request.headers } });
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set(COOKIES.visitor, vid, { path: "/", maxAge: VISITOR_MAX_AGE, sameSite: "lax", secure });
  // Rolling 30-minute session; readable by JS so the tracker can tag events with it.
  response.cookies.set(COOKIES.session, sid, { path: "/", maxAge: SESSION_MAX_AGE, sameSite: "lax", secure });
  if (force !== undefined)
    response.cookies.set(COOKIES.force, force, { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax", secure });
  return response;
}

async function guardAdmin(request: NextRequest): Promise<NextResponse | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const login = request.nextUrl.clone();
  login.pathname = "/admin/login";
  login.search = "";
  if (!url || !key) {
    // Never serve admin unauthenticated, even in a misconfigured deployment.
    login.searchParams.set("error", "not_configured");
    return NextResponse.redirect(login);
  }
  const passthrough = NextResponse.next();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => passthrough.cookies.set(name, value, options));
      },
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") {
    login.searchParams.set("error", "forbidden");
    return NextResponse.redirect(login);
  }
  return null;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|api/stripe|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
