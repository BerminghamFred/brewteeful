/**
 * Transactional email via Resend's HTTP API (no SDK needed). If RESEND_API_KEY or
 * EMAIL_FROM isn't set, sending is skipped and logged, so nothing else breaks.
 */
export type OutgoingEmail = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string | null;
  /** Resend de-duplicates retries carrying the same key for 24h. */
  idempotencyKey?: string;
};

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());
}

export async function sendEmail(email: OutgoingEmail): Promise<boolean> {
  if (!emailConfigured()) {
    console.warn(`email skipped (RESEND_API_KEY / EMAIL_FROM not set): ${email.subject}`);
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`,
      "Content-Type": "application/json",
      ...(email.idempotencyKey ? { "Idempotency-Key": email.idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM!.trim(),
      to: Array.isArray(email.to) ? email.to : [email.to],
      subject: email.subject,
      html: email.html,
      text: email.text,
      ...(email.replyTo ? { reply_to: email.replyTo } : {}),
    }),
  });
  if (!res.ok) {
    console.error("email send failed", res.status, await res.text().catch(() => ""));
    return false;
  }
  return true;
}
