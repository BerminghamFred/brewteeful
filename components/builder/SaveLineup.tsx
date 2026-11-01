"use client";

import { useState } from "react";
import { track } from "@/lib/track";

/** "Email me this lineup": sends the shareable link to the organiser so they can come back. */
export function SaveLineup({ lineupUrl, groupSize }: { lineupUrl: () => string; groupSize: number }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setState("error");
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/save-lineup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), url: lineupUrl(), groupSize }),
      });
      if (!res.ok) throw new Error();
      setState("sent");
      track("save_lineup", { group_size: groupSize });
    } catch {
      setState("error");
    }
  }

  if (state === "sent")
    return <p className="mt-4 rounded-2xl bg-chalk/10 p-3 text-sm">Sent ✓ Check your inbox for the link to your lineup.</p>;

  return (
    <form onSubmit={submit} className="mt-4">
      <label htmlFor="save-lineup-email" className="text-[13px] text-chalk/70">
        Or email me this lineup to finish later
      </label>
      <div className="mt-1.5 flex gap-2">
        <input
          id="save-lineup-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === "error") setState("idle");
          }}
          placeholder="you@example.com"
          className="min-w-0 flex-1 rounded-full bg-chalk/95 px-4 py-2.5 text-base text-ink placeholder:text-ink/40 focus:outline-none"
        />
        <button type="submit" disabled={state === "sending"} className="btn shrink-0 border border-chalk/40 px-4 text-sm text-chalk">
          {state === "sending" ? "Sending…" : "Email me"}
        </button>
      </div>
      {state === "error" ? <p className="mt-1.5 text-[13px] text-[#ffb4a1]">Check the email address and try again.</p> : null}
    </form>
  );
}
