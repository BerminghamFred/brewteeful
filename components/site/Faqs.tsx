"use client";

import { track } from "@/lib/track";
import type { Faq } from "@/lib/types";

export function Faqs({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="card divide-y-2 divide-ink overflow-hidden">
      {faqs.map((f) => (
        <details
          key={f.id}
          className="group"
          onToggle={(e) => (e.currentTarget as HTMLDetailsElement).open && track("open_faq", { question: f.question })}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 font-bold md:px-6">
            {f.question}
            <span className="text-xl leading-none transition group-open:rotate-45" aria-hidden>
              +
            </span>
          </summary>
          <p className="px-4 pb-5 text-sm leading-relaxed text-ink/80 md:px-6">{f.answer}</p>
        </details>
      ))}
    </div>
  );
}
