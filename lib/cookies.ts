export const COOKIES = {
  /** First-party visitor id, 13 months. */
  visitor: "stg_vid",
  /** Session id, 30-minute rolling. */
  session: "stg_sid",
  /** Consent choices: "a1m1" style (analytics, marketing). */
  consent: "stg_consent",
  /** QA-only forced experiment variants. */
  force: "stg_force",
  /** "1" = the owner's own browser (set via ?internal=1): never tracked or counted. */
  internal: "stg_internal",
} as const;

export const VISITOR_MAX_AGE = 60 * 60 * 24 * 395;
export const SESSION_MAX_AGE = 60 * 30;

export type Consent = { analytics: boolean; ads: boolean };

export function parseConsent(raw: string | undefined | null): Consent | null {
  if (!raw) return null;
  const m = /^a([01])m([01])$/.exec(raw);
  if (!m) return null;
  return { analytics: m[1] === "1", ads: m[2] === "1" };
}

export function serializeConsent(c: Consent) {
  return `a${c.analytics ? 1 : 0}m${c.ads ? 1 : 0}`;
}
