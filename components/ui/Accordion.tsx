"use client";

import { useState } from "react";

export function AccordionItem({
  title,
  children,
  defaultOpen,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="border-b border-white/10">
      <button
        type="button"
        className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-white"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {title}
        <span className="text-brand-accent">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="pb-4 text-sm text-white/65">{children}</div>}
    </div>
  );
}
