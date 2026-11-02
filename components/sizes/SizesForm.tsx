"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type Person = {
  position: number;
  label: string;
  design: string;
  size: string | null;
  artworkUrl: string | null;
  imageUrl: string | null;
  color: string;
};

/** Each person taps their size; saved straight away. Shareable — anyone with the link can help. */
export function SizesForm({
  token,
  sizes,
  people: initial,
  editable,
  alreadyComplete,
}: {
  token: string;
  sizes: string[];
  people: Person[];
  editable: boolean;
  alreadyComplete: boolean;
}) {
  const [people, setPeople] = useState(initial);
  const [saving, setSaving] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(alreadyComplete);
  const [copied, setCopied] = useState(false);
  const done = people.filter((p) => p.size).length;

  async function pick(position: number, size: string) {
    if (!editable || complete) return;
    setError(null);
    setSaving(position);
    const before = people;
    setPeople((ps) => ps.map((p) => (p.position === position ? { ...p, size } : p)));
    try {
      const res = await fetch("/api/sizes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, position, size }),
      });
      const data = (await res.json()) as { ok?: boolean; complete?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Couldn't save — try again");
      if (data.complete) setComplete(true);
    } catch (e) {
      setPeople(before);
      setError(e instanceof Error ? e.message : "Couldn't save — try again");
    } finally {
      setSaving(null);
    }
  }

  async function share() {
    const url = window.location.href;
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
    <div className="mt-6">
      {complete ? (
        <div className="rounded-3xl bg-pitch p-5 text-chalk">
          <p className="text-lg font-semibold">All sizes in — your set is going to print. 🎉</p>
          <p className="mt-1 text-[15px] text-chalk/80">We&apos;ll email tracking as soon as it ships. Need to change something? Reply to your order email.</p>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-3xl bg-chalk p-4 shadow-soft">
          <div>
            <p className="text-[15px] font-semibold">
              {done} of {people.length} sizes in
            </p>
            <div className="mt-2 h-2 w-40 overflow-hidden rounded-full bg-paper">
              <div className="h-full rounded-full bg-pitch transition-all" style={{ width: `${(done / Math.max(1, people.length)) * 100}%` }} />
            </div>
          </div>
          <button type="button" onClick={share} className="btn-primary shrink-0 px-5 text-sm">
            {copied ? "Link copied ✓" : "Send to the group"}
          </button>
        </div>
      )}

      {error ? <p className="mt-3 rounded-2xl bg-[#fff1ec] p-3 text-sm font-semibold text-ink">{error}</p> : null}
      {!editable && !complete ? (
        <p className="mt-3 rounded-2xl bg-paper p-3 text-sm">Sizes for this order are locked. Email us if something needs changing.</p>
      ) : null}

      <ul className="mt-5 space-y-3">
        {people.map((p) => (
          <li key={p.position} className={`card p-4 ${p.size ? "" : "ring-2 ring-flare/40"}`}>
            <div className="flex items-center gap-3.5">
              <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-2xl" style={{ backgroundColor: p.color }}>
                {p.artworkUrl || p.imageUrl ? (
                  <Image src={(p.artworkUrl ?? p.imageUrl)!} alt={p.design} fill sizes="64px" className={p.artworkUrl ? "object-contain p-1" : "object-cover"} />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-mute">{p.label}</p>
                <p className="truncate text-[17px] font-semibold tracking-tight">
                  {p.design}
                  <span className={`ml-2 text-[15px] font-medium ${p.size ? "text-pitch" : "text-flare"}`}>{p.size ?? "size needed"}</span>
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5" role="radiogroup" aria-label={`Size for ${p.label}`}>
              {sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={p.size === s}
                  disabled={!editable || complete || saving === p.position}
                  onClick={() => pick(p.position, s)}
                  className={`h-10 min-w-[48px] rounded-full px-3 text-sm font-medium transition disabled:cursor-default ${
                    p.size === s ? "bg-ink text-chalk" : "bg-paper text-ink/70 hover:bg-ink/[0.07] hover:text-ink"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-center text-sm text-mute">
        Not sure of your size? <Link href="/size-guide" target="_blank" className="underline">See the size guide</Link>.
      </p>
    </div>
  );
}
