import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-accent text-brand-dark hover:bg-brand-accent/90 shadow-lg shadow-brand-accent/20",
  secondary:
    "border border-white/20 bg-white/5 text-white hover:border-brand-accent/50 hover:bg-white/10",
  ghost: "text-white/80 hover:text-white",
};

export function Button({
  variant = "primary",
  className = "",
  href,
  children,
  disabled,
  ...props
}: ComponentProps<"button"> & {
  variant?: Variant;
  href?: string;
  className?: string;
}) {
  const cls = `inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-wide transition disabled:pointer-events-none disabled:opacity-40 ${variants[variant]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} disabled={disabled} {...props}>
      {children}
    </button>
  );
}
