import Image from "next/image";

/**
 * Shows a design's real image when there is one; otherwise a clean placeholder tee in
 * the design's colour (never a stock photo), clearly labelled as a placeholder.
 */
export function TeeArt({
  name,
  color,
  imageUrl,
  className = "",
  sizes = "(max-width: 768px) 50vw, 25vw",
  priority = false,
  label = true,
  tone = "light",
}: {
  name: string;
  color: string;
  imageUrl?: string | null;
  className?: string;
  sizes?: string;
  priority?: boolean;
  label?: boolean;
  tone?: "light" | "dark";
}) {
  const bg = tone === "dark" ? "bg-white/[0.06]" : "bg-[#efede7]";
  if (imageUrl) {
    return (
      <div className={`relative overflow-hidden ${bg} ${className}`}>
        <Image src={imageUrl} alt={name} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    );
  }
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
  const id = `g-${name.replace(/\W/g, "")}`;
  return (
    <div className={`relative overflow-hidden ${bg} ${className}`} aria-label={`${name} shirt`} role="img">
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} />
            <stop offset="1" stopColor={color} stopOpacity="0.82" />
          </linearGradient>
        </defs>
        <ellipse cx="100" cy="182" rx="52" ry="5" fill="#000" opacity={tone === "dark" ? 0.35 : 0.08} />
        <path
          d="M66 34 L86 27 Q100 38 114 27 L134 34 L166 56 L153 80 L138 72 L138 172 Q100 177 62 172 L62 72 L47 80 L34 56 Z"
          fill={`url(#${id})`}
        />
        <path d="M86 27 Q100 42 114 27" fill="none" stroke="#000" strokeOpacity="0.18" strokeWidth="2" />
        <text
          x="100"
          y="112"
          textAnchor="middle"
          fontFamily="var(--font-display), system-ui, sans-serif"
          fontWeight="800"
          fontSize="22"
          letterSpacing="-1"
          fill="#fff"
          fillOpacity="0.92"
        >
          {initials}
        </text>
      </svg>
      {label ? (
        <span className="absolute left-2.5 top-2.5 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium text-ink/60 backdrop-blur">
          Placeholder art
        </span>
      ) : null}
    </div>
  );
}
