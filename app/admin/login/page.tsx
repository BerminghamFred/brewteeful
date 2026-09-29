"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

const ERRORS: Record<string, string> = {
  forbidden: "That account isn't an admin. Set profiles.role = 'admin' for it in Supabase.",
  not_configured: "Supabase isn't configured for this deployment.",
};

function AdminLoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") ?? "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(ERRORS[sp.get("error") ?? ""] ?? null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const { error } = await createClient().auth.signInWithPassword({ email, password });
      if (error) return setErr(error.message);
      router.push(next.startsWith("/admin") ? next : "/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center">
      <h1 className="text-3xl font-semibold">Admin sign in</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input type="email" required autoComplete="username" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
        <input type="password" required autoComplete="current-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
        {err ? <p className="text-sm font-bold text-flare">{err}</p> : null}
        <button type="submit" disabled={loading} className="btn-dark w-full">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}
