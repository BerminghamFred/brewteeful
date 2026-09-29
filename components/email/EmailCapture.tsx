"use client";

import { useState } from "react";

/** Klaviyo-ready: swap action for Klaviyo subscribe API. */
export function EmailCapture() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setMsg("You're on the list.");
        setEmail("");
      } else {
        setMsg("Something went wrong.");
      }
    } catch {
      setMsg("Something went wrong.");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email for drops"
        className="min-w-0 flex-1 rounded-full border border-white/15 bg-brand-ink px-4 py-2.5 text-sm text-white placeholder:text-white/35"
      />
      <button
        type="submit"
        className="rounded-full bg-brand-accent px-5 py-2.5 text-sm font-semibold text-brand-dark"
      >
        Join
      </button>
      {msg && <span className="text-xs text-brand-accent">{msg}</span>}
    </form>
  );
}
