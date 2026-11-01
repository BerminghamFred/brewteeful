"use client";

import { useState } from "react";

/** Big "send this to the group" button for the sizes link (order-confirmed page). */
export function ShareSizesLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Add your stag shirt size", text: "Tap your size for the stag shirts:", url });
        return;
      }
    } catch {
      /* cancelled */
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }
  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
      <button type="button" onClick={share} className="btn h-12 flex-1 bg-chalk px-6 text-ink hover:bg-sun">
        {copied ? "Link copied ✓" : "Send the sizes link to the group"}
      </button>
      <a href={url} className="btn h-12 border border-chalk/40 px-6 text-chalk">
        Add sizes now →
      </a>
    </div>
  );
}
