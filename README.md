# Stag-set storefront (MVP)

Coordinated stag-do T-shirt sets: a different design for every person, ordered as one group set.
Built to answer one question cheaply: *will Google Search traffic buy £20-a-head group sets at a profitable CPA?*

The plan, phases, schema, event taxonomy and launch checklist are in **[docs/PLAN.md](docs/PLAN.md)**.

## Stack
Next.js 15 (App Router) · TypeScript · Tailwind · Supabase (Postgres/Auth/Storage) · Stripe embedded Checkout · Vercel.

## How it fits together
| Area | Where |
|---|---|
| Pricing engine (display + charge use the same function) | `lib/pricing.ts` |
| Economics / contribution | `lib/economics.ts` |
| A/B assignment (deterministic hash) | `lib/ab.ts` |
| Settings with defaults (editable in admin) | `lib/settings.ts` |
| Cached storefront data + experiment overrides | `lib/store.ts` |
| Group builder / basket / checkout | `components/builder`, `components/basket`, `app/checkout` |
| Server quote → pending order → Stripe session | `lib/checkout.ts`, `app/api/checkout` |
| Webhook (paid, refunds, fees, CAPI, purchase event) | `app/api/stripe/webhook` |
| First-party tracking | `lib/track.ts` → `app/api/events` → `visitor_sessions` / `events` |
| Consent, GA4/Ads (Consent Mode v2), Meta Pixel | `components/tracking` |
| Admin (dashboard, funnel, orders, pick list, products, offers, spend, experiments, content, reviews) | `app/admin`, `lib/admin` |

With no Supabase env vars the storefront still renders from placeholder data (`lib/catalogue-fallback.ts`). Checkout and admin need the real env.

## Setup
1. `cp .env.example .env.local` and fill it in.
2. Supabase: apply `supabase/migrations/*` in order (`supabase db push`, or paste them into the SQL editor), then `supabase/seed.sql`.
   The stag migration is non-destructive: old store tables move to a `legacy` schema.
3. Create your admin user in Supabase Auth, then run:
   `update profiles set role = 'admin' where email = 'you@…';`
4. Stripe: add a webhook to `https://<domain>/api/stripe/webhook` for
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`,
   `checkout.session.expired` and `charge.refunded`. Enable Apple Pay (register the domain), Google Pay and Link, and turn on receipt emails.
5. `npm run dev`.

## Checks
```
npm run lint && npm run typecheck && npm test && npm run build
npm run db:test   # applies all migrations + seed to a throwaway local Postgres and checks the funnel view and cost privacy
```

## Before spending on ads
Work through docs/PLAN.md §8. In short: real product and group photos, supplier costs entered, a real test order placed end to end,
tracking verified with Tag Assistant, and the Ads tracking template set to
`{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={adgroupid}&utm_term={keyword}`.

QA a running experiment variant with `/?exp_<key>=<variant>`.
