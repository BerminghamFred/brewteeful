# Stag-set MVP: plan

Status: plan agreed internally, Phase 1 in build on `claude/stag-do-tshirt-mvp-qzd4gj`.
All £ figures are estimates. Every assumption below can be edited in the admin panel (Settings → Economics) so the dashboard numbers change without code changes.

---

## 1. The business model as I understand it

- **Product:** coordinated stag-do T-shirt sets. Each person gets a *different* design from one visually consistent collection (football and pop-culture illustration, streetwear feel). The group looks coordinated without everyone wearing the same shirt.
- **Customer:** the **organiser**, not the wearer. They're buying a solved problem ("what are we all wearing?") for 5–15 people, usually against a deadline, with a WhatsApp group that can't make decisions.
- **Unit of sale:** the **group order** (min 5, typical 6–10, about £100–£300), not the shirt.
- **Acquisition:** Google Search, bottom of funnel. The previous Meta test brought cheap, low-intent clicks and no sales.
- **The question we're paying £300 to answer:** *Will people searching for stag outfits/T-shirts buy coordinated sets at about £20 a head, at a CPA below the contribution per order?*
- **Primary KPI:** contribution after ads per order, and contribution per visitor for experiments. CTR, CPC and sessions are diagnostics only.

### Reference unit economics (defaults, all editable)

| | 5 shirts | 6 | 8 | 10 |
|---|---|---|---|---|
| Revenue @ £20 | £100 | £120 | £160 | £200 |
| COGS @ £10.50 | £52.50 | £63 | £84 | £105 |
| Postage + packaging (free delivery to customer) | £5.50 | £5.50 | £5.50 | £6.50 |
| Stripe fees (1.5% + 20p, UK cards) | £1.70 | £2.00 | £2.60 | £3.20 |
| **Contribution before ads** | **£40** | **£50** | **£68** | **£85** |
| Break-even conversion rate @ £0.60 CPC | 1.5% | 1.2% | 0.9% | 0.7% |
| Break-even conversion rate @ £0.92 CPC | 2.3% | 1.8% | 1.4% | 1.1% |

Takeaway: the model works if we convert about 1.5–2% of paid clicks at 6+ shirts per order. That's plausible for bottom-funnel search, but it's not guaranteed for a new brand with no reviews. **Shirts per order is the biggest lever we control**, followed by conversion rate.

---

## 2. Assumptions and problems in the plan

Ordered by how much each one could distort the result.

1. **Seasonality.** Today is 29 Sep 2026. Stag season peaks around Mar–Sep, and monthly search-volume figures are 12-month averages. October–February volume (and possibly conversion) will be noticeably lower. Before launch, check the monthly trend in Keyword Planner. If a winter test is thin, that means low season, not necessarily a bad proposition. Consider a smaller daily budget over a longer window.
2. **£300 buys a signal, not statistical proof.** At about £0.60 CPC that's roughly 500 clicks. At 1–2% conversion that's **5–10 orders**. That's enough to tell "clearly working", "clearly not" and "ambiguous" apart. It is **not** enough to A/B test anything or to compare ad group A vs B with confidence. So:
   - A/B testing is built into the architecture (assignments, variant on every event and order), but **no experiments run during the first £300**.
   - Leading indicators (builder starts and builder completions per click) give earlier, higher-volume signal than purchases.
   - Decision rules are set **before** spending (see §8).
3. **Lead time and deadlines.** Stags have fixed dates. If the £10–11 cost is print-on-demand, production (2–5 working days) plus delivery (1–3 days) has to be promised clearly, and we need a "when's the stag?" question to catch orders that can't arrive in time. **Needed from you:** the supplier, production SLA, and whether express is possible. Phase 1 asks for the stag date in the builder and warns when it's too tight.
4. **The organiser often doesn't know everyone's size.** This is the biggest friction specific to group orders. Phase 1 mitigation: size guide, "most people take L", and a **shareable builder link** so the organiser can send the lineup to the group chat and come back. Phase 2 (if the signal is positive): a **collaborative group order**, where each member picks their own design and size from a link and the organiser pays once. This is probably the strongest differentiator we could add.
5. **"Personalised/custom stag shirts" keywords.** These searchers expect names, nicknames or dates printed. If we don't offer that, the ad is a mismatch and wastes spend. **Phase 1: leave personalised/custom keywords out** (or add them as negatives) unless the supplier can print a back name cheaply. The data model already stores a per-person `nickname` so it can be switched on later.
6. **"Stag do costumes" intent.** Many of these searchers want fancy dress (mankinis, inflatables). It's cheap traffic, but expect lower conversion. Run it in a separate ad group so it can't pollute ad group A's data, and review the search-terms report every 2–3 days.
7. **Trademark/IP risk.** "Football-inspired" designs that use club crests, names, player likenesses or kit designs can breach trademarks. That can get Google Ads disapproved, get the Stripe account closed, or bring a takedown. Make sure designs are clearly original parody or homage without protected marks. Don't use club names in ad copy or keywords.
8. **Returns law.** Non-personalised shirts are **not** exempt from the 14-day cancellation right (Consumer Contracts Regulations 2013). The returns policy must allow returns of unworn, non-personalised shirts. Personalised items can be exempt. Faulty or misprinted items are always replaced. The default site copy reflects this.
9. **VAT.** Below the £90k threshold, no VAT is due. Once registered, VAT takes about £3.33 of every £20 shirt, which wipes out roughly a third of contribution per shirt. It's irrelevant for the test, but it matters for scale-up pricing, so the economics model has a VAT toggle.
10. **Consent (UK GDPR/PECR).** GA4, Google Ads and Meta cookies need consent. Without a consent banner the site is non-compliant. With one, platform conversion counts will under-report, which is why our **own database is the source of truth for orders and funnel**, and Google Consent Mode v2 is implemented so Ads can model the missing conversions.
11. **Brand/domain.** Ads relevance and landing-page trust benefit from a stag-specific name/domain. The brand name is one config value (`lib/brand.ts`), so it's cheap to change later. **Needed from you:** final brand name and domain.
12. **The existing codebase contains dark patterns** (fake "X just bought" toasts, a fake countdown, "Trusted by 1,000+ fans", fake low stock, mock reviews). They contradict the brief and are **removed**. The old checkout also trusted client-sent prices (anyone could pay £0.01) and stored cart JSON in Stripe metadata (breaks above ~500 chars, i.e. around 4 shirts). Both are fixed.
13. **`add_payment_info` can't be observed with Stripe Checkout** (payment entry happens inside Stripe's iframe). We track `begin_checkout` and the Stripe checkout session state instead. If checkout drop-off turns out to be the problem, Phase 2 can move to the Payment Element for full visibility.

---

## 3. Ideal customer journey

```
Google: "stag do t shirts"
  → Landing (/): 3-second answer — what, £ each, min 5, delivery, why different
      Hero: "Stag shirts that aren't shit." + lineup visual + [Build your stag set]
  → /build
      1. How many of you?   [5][6][7][8][9][10][10+]      (+ optional stag date → delivery check)
      2. The lineup: one card per person
            Person 1 (The Stag ★) — design ▸ swipe row — size [S M L XL XXL]
            Person 2 … Person N
         Shortcuts: "Give everyone a different design", "Everyone in L", nicknames (optional)
         Sticky bar: "8 shirts · £160 · Free UK delivery   [Review set →]"
      3. Share lineup link (to the WhatsApp group) — optional
  → /basket: the lineup as one set, price breakdown, discount code, delivery estimate
  → /checkout: Stripe embedded (Apple Pay / Google Pay / card / Link), UK address
  → /checkout/success: order number, lineup, production + delivery dates, what happens next
```

Design principles:
- Price, minimum and delivery are visible **above the fold** and in the sticky bar.
- Nothing is fake: no reviews until they're real, no scarcity, no countdowns.
- One set per basket in Phase 1. It keeps the mental model simple and fulfilment trivial.
- Mobile first. The builder is a vertical list of person cards with horizontally scrolling design chips and size pills, and there's always a sticky total with a CTA.

---

## 4. Phases

### Phase 1: must have for the £300 test (build now)
Storefront
- Landing page doubling as the Ads landing page (hero, lineup visual, how it works, designs, pricing, why different, delivery, FAQ, final CTA; reviews block appears only when approved genuine reviews exist).
- Group builder with URL-shareable state, stag-date delivery check, "all different" shortcut, optional nicknames.
- Design pages (`/designs`, `/designs/[slug]`) with Product schema, feeding "start a set with this".
- Basket (one set), discount codes, server-authoritative pricing.
- Stripe embedded Checkout (Apple Pay, Google Pay, cards, Link), shipping options (standard + optional express).
- Success page with order recap and timeline.
- Info pages: FAQ, Delivery & returns, Size guide, Contact, Privacy, Terms.
- Consent banner with Google Consent Mode v2.

Tracking
- First-party visitor/session/event tracking into Postgres, with UTMs, gclid/gbraid/wbraid/fbclid, landing page, referrer and device captured per session and copied onto orders.
- GA4 ecommerce events, the Google Ads purchase conversion with enhanced conversions (hashed email), and Meta Pixel. Meta Conversions API sends Purchase from the webhook, deduplicated by event_id.

Admin
- Supabase Auth, admin role, RLS.
- Dashboard: KPIs, funnel with step conversion and biggest drop-off, and a breakdown by campaign / keyword (utm_term) / device / landing page.
- Economics: revenue − COGS − postage/packaging − Stripe fees (actual, from Stripe) − ad spend = contribution. Also CPA, ROAS and contribution per visitor.
- Ad spend: manual entry plus CSV paste import (Google Ads campaign / ad group / keyword report).
- Orders: list, detail (lineup by person), fulfilment status, tracking, notes, refunds shown from Stripe, **production pick list** (designs × sizes to send to the printer).
- Products: create/edit/archive, price, compare-at, **cost**, sizes, images (upload), collection, sort, SEO fields.
- Offers: banner / floating badge / modal / quantity discount / free-delivery threshold, scheduled and without code changes. Discount codes.
- Content: hero copy, delivery messaging, FAQs, contact, SEO defaults, economics assumptions.
- Experiments: data model and assignment engine (price, headline, CTA, hero, offer, minimum group size), admin create/start/end, and a results table on contribution per visitor. Built, but not used during the first £300.

Explicitly **not** in Phase 1: customer accounts, reviews collection flow, custom transactional email (Stripe receipts cover it), supplier API automation, landing-page CMS, Google Ads API, multi-set baskets, inventory.

### Phase 2: if we see positive signal
- **Collaborative group order links** (each member picks their own design and size, organiser pays), and a deposit or split-pay option.
- Personalisation (names or nicknames on the back) with a price uplift. This opens up the "personalised" keywords.
- Post-purchase review requests (verified, attached to an order) and a real photo UGC gallery.
- Transactional emails (confirmation, dispatched, delivered) via Resend, and a basket-abandonment email (with consent).
- SEO landing pages with genuine unique content: `/stag-do-t-shirts`, `/football-stag-do-t-shirts`, `/funny-stag-do-t-shirts`, and city pages only where there's real local content (Pub Club crossover).
- Google Ads API spend import (daily, by campaign / ad group / keyword) and offline conversion uploads by gclid (margin-based value).
- Supplier/POD integration (auto-submit orders, tracking back into orders).
- More collections (golf, music, film, British culture), and collection-first builder navigation.
- Meta retargeting audiences (consented site visitors, builder abandoners).
- Hen / birthday / lads' holiday variants.

### Phase 3: scale infrastructure
- Multi-product catalogue (hoodies, bucket hats, the groom's special edition), bundles.
- Customer accounts, reorders, referral ("your mate's getting married next").
- Warehouse/inventory if we move from POD to bulk printing (the margin step-change).
- Proper experimentation stats (sequential testing, CUPED), a server-side tagging container.
- Multi-brand/tenant (hen brand on the same engine), B2B/corporate group orders.
- Pub Club integration: shared audiences, content and affiliate links.

---

## 5. Architecture

**Stack: Next.js 15 (App Router, RSC) + TypeScript + Tailwind + Supabase Postgres/Auth/Storage + Stripe Checkout (embedded) + Vercel.** Keep it.

- *Considered: Shopify.* It would give us checkout, Shop Pay, refunds, shipping labels and POD apps for free. But a group builder that writes N line items, contribution-per-visitor experiments, a first-party funnel and keyword-level contribution reporting are all awkward on Shopify, and the codebase already exists on this stack. Stripe's dashboard covers refunds and disputes. Verdict: custom stack. Revisit if operations (not acquisition) become the bottleneck.
- **Server-authoritative pricing.** One pure `lib/pricing.ts` function is used by the builder (display) and the checkout API (charge). The client never sends prices.
- **Pending order first.** `/api/checkout` validates the set, prices it, writes a `pending` order and its `order_items`, then creates the Stripe session with `metadata.order_id`. The webhook marks it `paid`, records the actual Stripe fee from the balance transaction, and fires Meta CAPI plus the first-party `purchase` event.
- **Tracking.** Middleware sets a first-party `vid` (visitor, 13 months) and `sid` (session, 30-minute rolling) cookie. The client sends events to `/api/events` via `sendBeacon`, where they're checked against an allowlist and inserted with the service role (no anon insert through RLS). A new session posts its attribution (UTMs, click IDs, landing page, referrer, device) once.
- **Experiments.** Deterministic assignment: `hash(visitor_id + experiment_key) → bucket` by weight. It's cached in an `exp` cookie so RSC and the checkout API agree. Assignments are stored on sessions, events and orders.
- **Settings and offers.** `site_settings` (typed JSON by key) plus an `offers` table (scheduled, typed JSON config), read through one cached loader. Admin edits revalidate.
- **Offline-safe dev.** With no Supabase env, the storefront renders from built-in placeholder catalogue and settings. Checkout and admin need real env.

### Database schema (Postgres, see `supabase/migrations/`)

```
profiles(id→auth.users, email, role['customer'|'admin'])

collections(id, slug, name, description, sort_order, active)
products(id, slug, name, collection_id→collections, tagline, description,
         price_pence, compare_at_price_pence, cost_pence,
         status['draft'|'active'|'archived'], sort_order,
         hero_image_url, accent_color, seo_title, seo_description, timestamps)
product_images(id, product_id, url, alt, sort_order)
product_variants(id, product_id, size, sku, cost_pence NULL=product cost,
                 active, stock NULL=made to order)

orders(id, order_number serial, status['pending'|'paid'|'refunded'|'partially_refunded'|'cancelled'],
       fulfilment_status['unfulfilled'|'in_production'|'shipped'|'delivered'|'cancelled'],
       email, customer_name, phone, shipping_address jsonb, shipping_method,
       event_date, group_name,
       item_count, subtotal_pence, discount_pence, shipping_pence, total_pence,
       cogs_pence, fulfilment_cost_pence, payment_fee_pence, refunded_pence,
       discount_code, applied_offers jsonb, pricing_snapshot jsonb,
       stripe_session_id, stripe_payment_intent_id,
       carrier, tracking_number, tracking_url, shipped_at, admin_notes,
       visitor_id, session_id, attribution jsonb (utm_*, gclid, gbraid, wbraid, fbclid,
       landing_page, referrer, device), experiments jsonb, consent jsonb,
       created_at, paid_at)
order_items(id, order_id, position, is_stag, nickname,
            product_id, variant_id, product_name, size, sku,
            unit_price_pence, unit_cost_pence)

discount_codes(id, code, kind['percent'|'fixed'|'free_shipping'], value,
               min_items, starts_at, ends_at, max_uses, uses_count, active)
offers(id, name, kind['banner'|'badge'|'modal'|'quantity_discount'|'free_shipping'],
       config jsonb, starts_at, ends_at, active, priority)
site_settings(key, value jsonb)          -- pricing, delivery, economics, content, contact, seo
faqs(id, question, answer, sort_order, active)
reviews(id, order_id NULL, product_id NULL, author_name, rating, body,
        approved, verified, created_at)  -- only approved + real ever shown

visitor_sessions(id, visitor_id, started_at, last_seen_at, landing_page, referrer,
                 utm_source, utm_medium, utm_campaign, utm_term, utm_content,
                 gclid, gbraid, wbraid, fbclid, device, experiments jsonb)
events(id, name, visitor_id, session_id, path, props jsonb, value_pence, created_at)

ad_spend(id, date, channel, campaign, ad_group, keyword, spend_pence,
         clicks, impressions, source['manual'|'csv'|'api'])

experiments(id, key, name, hypothesis, variable, status['draft'|'running'|'ended'],
            variants jsonb [{key,name,weight,config}], started_at, ended_at, winner)

stripe_events(id, type, received_at)     -- webhook idempotency
```

---

## 6. Analytics / event taxonomy

Common context on every first-party event: `visitor_id`, `session_id`, `path`, `experiments`, and the device from the session row.

| Event | Fires when | Key props | FP | GA4 | Ads | Meta |
|---|---|---|---|---|---|---|
| `session_start` | First hit of a new session (server-derived) | utm_*, click IDs, landing, referrer, device | ✓ | (auto) | | |
| `page_view` | Every route change | path, title | ✓ | ✓ | | PageView |
| `click_cta` | Any "Build your set" CTA | location (`hero`, `sticky`, `final`, `design_page`…) | ✓ | ✓ | | |
| `view_collection` | Designs grid (home section in view, or `/designs`) | list_id, item count | ✓ | view_item_list | | |
| `view_item` | Design page | item_id, price | ✓ | ✓ | | ViewContent |
| `start_group_builder` | `/build` mounted (once per session) | source, prefilled_design | ✓ | ✓ | | |
| `select_group_size` | Group size chosen or changed | group_size | ✓ | ✓ | | |
| `select_design` | Design assigned to a person | position, item_id | ✓ | ✓ | | |
| `select_size` | Size assigned to a person | position, size | ✓ | ✓ | | |
| `set_event_date` | Stag date entered | days_until, on_time | ✓ | ✓ | | |
| `share_builder` | Lineup link shared or copied | group_size | ✓ | ✓ | | |
| `complete_group_builder` | All N people have design and size (first time) | group_size, value, distinct_designs | ✓ | ✓ | | CustomizeProduct |
| `add_to_cart` | Set added to basket | items[], value, group_size | ✓ | ✓ | | AddToCart |
| `view_cart` | `/basket` viewed | value | ✓ | ✓ | | |
| `apply_discount` | Code applied (valid or not) | code, valid | ✓ | ✓ | | |
| `begin_checkout` | `/checkout` session created | value, items[] | ✓ | ✓ | | InitiateCheckout |
| `add_payment_info` | *Not observable in Stripe Checkout; see §2.13* | | | | | |
| `purchase` | Webhook `checkout.session.completed` (FP, CAPI). Success page (browser tags, once per order) | transaction_id, value, items[], shipping, discount, enhanced-conversion email | ✓ server | ✓ | conversion + EC | Purchase (pixel + CAPI, event_id=order id) |
| `consent_update` | Banner choice | analytics, ads | ✓ | consent | consent | |

**Admin funnel steps** (distinct sessions): Sessions → `start_group_builder` → `complete_group_builder` → `add_to_cart` → `begin_checkout` → `purchase`. Shown with step conversion %, overall %, and the largest relative drop highlighted. Filterable by date, campaign, keyword, device and experiment variant.

**Attribution.** Last non-direct session before purchase is stored on the order. First touch is reconstructable from `visitor_sessions`. The Google Ads final URL template must add `utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={adgroupid}&utm_term={keyword}` (and auto-tagging for gclid). See §8.

---

## 7. Information architecture

```
/                       Landing (Ads LP)
/build                  Group builder        (?n=8&l=slug:L,slug:XL… shareable)
/designs                All designs
/designs/[slug]         Design page (Product + Breadcrumb schema)
/basket                 Review set
/checkout               Stripe embedded checkout
/checkout/success       Confirmation
/faq  /delivery-returns  /size-guide  /contact  /privacy  /terms
/sitemap.xml  /robots.txt
/admin                  Dashboard (funnel + economics)
/admin/orders[/id]  /admin/orders/pick-list
/admin/products[/id|new]
/admin/offers           Offers + discount codes
/admin/spend            Ad spend (manual + CSV)
/admin/experiments[/id]
/admin/content          Settings, copy, economics, FAQs
/admin/login
Phase 2: /stag-do-t-shirts, /football-stag-do-t-shirts, /group/[code], /collections/[slug]
```

---

## 8. Must exist before the first £300 is spent

**Site and ops**
- [ ] Real product photography for every design (flat lay or on body). No stock images of other people's shirts.
- [ ] **At least one real group photo** (6+ people, different designs). Even friends in a garden beats a render. It's the most important conversion asset.
- [ ] Supplier confirmed: unit cost per size, production SLA, postage cost per parcel size, misprint policy. Entered in admin.
- [ ] A test order placed end to end (real card, refund afterwards): order appears, pick list is correct, and the shirt arrives and looks right.
- [ ] Delivery promise that you can actually meet, shown in the hero and on the builder.
- [ ] Returns / misprint policy, contact email, and a business name/address (legally required for distance selling) filled in.
- [ ] Stripe live mode, Apple Pay domain verified, Google Pay enabled, receipt emails on, Radar default rules on.
- [ ] Privacy policy and cookie banner live, with consent mode checked in Tag Assistant.

**Tracking verified (Tag Assistant plus a test purchase)**
- [ ] GA4 receives `purchase` with the correct value and transaction_id. Key events marked in GA4.
- [ ] Google Ads purchase conversion set as **Primary**, the others Secondary, and enhanced conversions on.
- [ ] Meta Pixel and CAPI Purchase deduplicated (Events Manager shows "deduplicated").
- [ ] Admin funnel shows the test session moving through every step, and the order carries utm_term and gclid.
- [ ] Ads tracking template: `{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={adgroupid}&utm_term={keyword}&matchtype={matchtype}`.

**Campaign setup**
- [ ] One Search campaign with 2–3 ad groups (A: t-shirt intent, B: outfit intent, optionally C: costume intent), exact and phrase match only.
- [ ] Manual CPC or Maximise Clicks with a max CPC cap (smart bidding has no conversion data yet). Daily budget £15–20 → 15–20 days.
- [ ] Negative list: `fancy dress` (if you exclude C), `mankini`, `inflatable`, `free`, `cheap`, `diy`, `template`, `ideas pinterest`, `hen`, `personalised`/`custom` (until supported), `jobs`, `print your own`.
- [ ] UK-only location targeting ("presence", not "interest"), no Display network, no Search partners for the test.
- [ ] Sitelinks (Designs, How it works, Delivery), callouts (Different design for everyone, Free UK delivery, Apple Pay), structured snippet (Styles).

**Pre-registered decision rules (after £300 or 21 days)**

| Outcome | Read | Next step |
|---|---|---|
| ≥ 6 orders, contribution after ads ≥ £0 | Validated | Phase 2 and scale the budget |
| 2–5 orders | Promising or ambiguous | Fix the largest funnel drop-off, run another £300 |
| 0–1 orders, builder-start rate ≥ 25% of sessions | Proposition interests people; price, trust or friction blocks | Offer or price test, group-link feature |
| 0–1 orders, builder-start rate < 10% | Traffic/landing mismatch | Rework keywords and hero, or rethink the channel |

---

## 9. Other things that could materially affect conversion or economics

- **Shirts per order > conversion rate** in leverage. Quantity-based offers ("8+ → free express" or "10+ → £20 off") raise AOV more cheaply than discounts. All are configurable.
- **"The Stag" shirt.** A distinct design or colour for the groom is what organisers actually want. It's cheap to add as a product and gives the lineup a focal point. The builder already marks person 1 as the stag.
- **Delivery-date certainty** ("Order by Thu → arrives by Tue 14 Oct") converts deadline-driven buyers. The date check is in the builder.
- **Real photos of the lineup** do more for trust than anything else we can build.
- **Minimum 5** may block 4-person stags and late add-ons. Measure it: `select_group_size` records "10+" and the builder logs attempts below the minimum. A "min group size" experiment is supported.
- **Payment timing.** Organisers often collect money from the group first. A "share the cost" link (Phase 2) or a clear "pay now, lineup locked" message helps.
- **Misprint/late-delivery guarantee.** "If it's wrong, we reprint it free and fast" costs little and removes the biggest fear.
- **Speed.** Server-rendered pages, `next/image`, no heavy UI libraries, and third-party tags loaded after consent and after interaction. Aim for LCP < 2.0s on 4G.
- **Google Ads landing experience** (quality score → CPC): fast mobile page, keyword in the H1 ("stag do t-shirts"), clear pricing. The headline is editable in admin; we recommend keeping "stag" in the H1.

---

## 10. Implementation milestones (Phase 1)

Each milestone ends green on `npm run lint && npm run typecheck && npm test && npm run build`.

| # | Milestone | Testable outcome |
|---|---|---|
| M1 | Foundations: remove dark patterns and old store, brand config, design tokens, new schema + seed, vitest | Migration applies cleanly on Postgres 16, build passes |
| M2 | Pricing engine + settings/offers loader | Unit tests: min group, quantity discounts, free shipping, codes, experiment price override |
| M3 | Catalogue + landing + design pages | Home renders offline with placeholder catalogue, Lighthouse mobile ≥ 90 |
| M4 | Group builder + basket + shareable URL | Build 8-person set on mobile, share URL round-trips, validation blocks < min |
| M5 | Checkout + webhook + orders | Stripe test card → order `paid`, items match, fee recorded, idempotent on replay |
| M6 | Tracking: sessions, events, consent, GA4/Ads/Meta, CAPI | Events in DB with attribution, tags gated by consent, purchase deduped |
| M7 | Admin: auth, dashboard/funnel/economics, orders + pick list, products, offers, content, spend, experiments | Admin-only access, dashboard numbers reconcile with a hand-calculated fixture |
| M8 | SEO + info pages + launch checklist | sitemap/robots/schema validate, all §8 site items present |
