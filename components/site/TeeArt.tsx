import Image from "next/image";

/**
 * Shows a design's real image when there is one; otherwise an honest illustrated
 * placeholder tee in the design's accent colour (never a stock photo).
 */
export function TeeArt({
  name,
  color,
  imageUrl,
  className = "",
  sizes = "(max-width: 768px) 50vw, 25vw",
  priority = false,
  label = true,
}: {
  name: string;
  color: string;
  imageUrl?: string | null;
  className?: string;
  sizes?: string;
  priority?: boolean;
  label?: boolean;
}) {
  if (imageUrl) {
    return (
      <div className={`relative overflow-hidden bg-chalk ${className}`}>
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
  return (
    <div className={`relative overflow-hidden bg-chalk ${className}`} aria-label={`${name} shirt`} role="img">
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
        <path
          d="M62 28 L84 20 Q100 32 116 20 L138 28 L176 54 L160 84 L142 74 L142 180 L58 180 L58 74 L40 84 L24 54 Z"
          fill={color}
          stroke="#121212"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path d="M84 20 Q100 38 116 20" fill="none" stroke="#121212" strokeWidth="4" />
        <circle cx="100" cy="98" r="28" fill="#fffaf1" stroke="#121212" strokeWidth="3" />
        <text
          x="100"
          y="107"
          textAnchor="middle"
          fontFamily="Impact, sans-serif"
          fontSize="24"
          fill="#121212"
        >
          {initials}
        </text>
      </svg>
      {label ? (
        <span className="absolute bottom-2 left-2 rounded-full border-2 border-ink bg-sun px-2 py-0.5 text-[10px] font-extrabold uppercase">
          Artwork placeholder
        </span>
      ) : null}
    </div>
  );
}
