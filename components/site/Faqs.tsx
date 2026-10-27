"use client";

import { track } from "@/lib/track";
import type { Faq } from "@/lib/types";

export function Faqs({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="divide-y divide-ink/10 border-y border-ink/10">
      {faqs.map((f) => (
        <details
          key={f.id}
          className="group"
          onToggle={(e) => (e.currentTarget as HTMLDetailsElement).open && track("open_faq", { question: f.question })}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[16px] font-medium [&::-webkit-details-marker]:hidden">
            {f.question}
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink/15 text-ink/60 transition duration-200 group-open:rotate-45 group-open:bg-ink group-open:text-chalk"
              aria-hidden
            >
              +
            </span>
          </summary>
          <p className="max-w-2xl pb-6 pr-10 text-[15px] leading-relaxed text-ink/65">{f.answer}</p>
        </details>
      ))}
    </div>
  );
}
