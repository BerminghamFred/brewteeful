-- Stag-set MVP schema.
-- Non-destructive: the previous single-shirt store's tables are moved to the `legacy`
-- schema (drop it manually once you're sure nothing in it is needed).
-- Keeps: profiles, is_admin(), handle_new_user(), stripe_events, site_settings, storage bucket.

-- ---------------------------------------------------------------------------
-- 0. Park legacy tables
-- ---------------------------------------------------------------------------
create schema if not exists legacy;
revoke all on schema legacy from public, anon, authenticated;
alter table if exists public.products set schema legacy;
alter table if exists public.product_images set schema legacy;
alter table if exists public.product_variants set schema legacy;
alter table if exists public.reviews set schema legacy;
alter table if exists public.discount_codes set schema legacy;
alter table if exists public.orders set schema legacy;
alter table if exists public.experiments set schema legacy;
alter table if exists public.experiment_assignments set schema legacy;
alter table if exists public.analytics_events set schema legacy;
alter table if exists public.abandoned_carts set schema legacy;

-- Legacy anon-insert policies must not stay open.
drop policy if exists "Anon can insert analytics" on legacy.analytics_events;
drop policy if exists "Anon insert abandoned carts" on legacy.abandoned_carts;

-- Old seed keys that drove fake urgency/social proof.
delete from public.site_settings
  where key in ('floating_offer', 'exit_popup', 'countdown', 'live_notifications');

alter table public.stripe_events add column if not exists type text;

-- updated_at helper
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. Catalogue
-- ---------------------------------------------------------------------------
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  collection_id uuid references public.collections(id) on delete set null,
  tagline text,
  description text,
  price_pence integer not null check (price_pence >= 0),
  compare_at_price_pence integer check (compare_at_price_pence is null or compare_at_price_pence > price_pence),
  cost_pence integer not null default 0 check (cost_pence >= 0),
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  sort_order integer not null default 0,
  hero_image_url text,
  accent_color text not null default '#1f6f43',
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_status_sort_idx on public.products (status, sort_order);
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt text,
  sort_order integer not null default 0
);
create index product_images_product_idx on public.product_images (product_id, sort_order);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null,
  sku text not null unique,
  cost_pence integer check (cost_pence is null or cost_pence >= 0),
  active boolean not null default true,
  stock integer, -- null = printed to order
  unique (product_id, size)
);

-- ---------------------------------------------------------------------------
-- 2. Commerce
-- ---------------------------------------------------------------------------
create table public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code)),
  kind text not null check (kind in ('percent', 'fixed', 'free_shipping')),
  value integer not null default 0 check (value >= 0),
  min_items integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  max_uses integer,
  uses_count integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('banner', 'badge', 'modal', 'quantity_discount', 'free_shipping')),
  config jsonb not null default '{}',
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default false,
  priority integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity (start with 1001) unique,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'refunded', 'partially_refunded', 'cancelled')),
  fulfilment_status text not null default 'unfulfilled'
    check (fulfilment_status in ('unfulfilled', 'in_production', 'shipped', 'delivered', 'cancelled')),
  email text,
  customer_name text,
  phone text,
  shipping_address jsonb,
  shipping_method text not null default 'standard',
  event_date date,
  group_name text,
  item_count integer not null,
  subtotal_pence integer not null,
  discount_pence integer not null default 0,
  shipping_pence integer not null default 0,
  total_pence integer not null,
  cogs_pence integer not null default 0,
  fulfilment_cost_pence integer not null default 0,
  payment_fee_pence integer,
  refunded_pence integer not null default 0,
  discount_code text,
  applied_offers jsonb not null default '[]',
  pricing_snapshot jsonb,
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  carrier text,
  tracking_number text,
  tracking_url text,
  shipped_at timestamptz,
  admin_notes text,
  visitor_id text,
  session_id uuid,
  attribution jsonb,
  experiments jsonb not null default '{}',
  consent jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index orders_status_created_idx on public.orders (status, created_at desc);
create index orders_paid_at_idx on public.orders (paid_at desc);
create index orders_email_idx on public.orders (email);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  position integer not null,
  is_stag boolean not null default false,
  nickname text,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  size text not null,
  sku text,
  unit_price_pence integer not null,
  unit_cost_pence integer not null default 0
);
create index order_items_order_idx on public.order_items (order_id, position);
create index order_items_product_idx on public.order_items (product_id);

-- ---------------------------------------------------------------------------
-- 3. Content
-- ---------------------------------------------------------------------------
create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  active boolean not null default true
);

-- Only genuine customer feedback. `verified` = tied to a real paid order.
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  author_name text not null,
  rating integer not null check (rating between 1 and 5),
  body text,
  approved boolean not null default false,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. Tracking
-- ---------------------------------------------------------------------------
create table public.visitor_sessions (
  id uuid primary key,
  visitor_id text not null,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  landing_page text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  gclid text,
  gbraid text,
  wbraid text,
  fbclid text,
  device text,
  experiments jsonb not null default '{}'
);
create index visitor_sessions_started_idx on public.visitor_sessions (started_at desc);
create index visitor_sessions_visitor_idx on public.visitor_sessions (visitor_id);

create table public.events (
  id bigint generated always as identity primary key,
  name text not null,
  visitor_id text,
  session_id uuid,
  path text,
  props jsonb not null default '{}',
  value_pence integer,
  created_at timestamptz not null default now()
);
create index events_created_idx on public.events (created_at desc);
create index events_session_name_idx on public.events (session_id, name);

create table public.ad_spend (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  channel text not null default 'google_ads',
  campaign text,
  ad_group text,
  keyword text,
  spend_pence integer not null check (spend_pence >= 0),
  clicks integer,
  impressions integer,
  source text not null default 'manual' check (source in ('manual', 'csv', 'api')),
  created_at timestamptz not null default now()
);
create index ad_spend_date_idx on public.ad_spend (date);

create table public.experiments (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  hypothesis text,
  variable text not null
    check (variable in ('price', 'headline', 'cta', 'hero_image', 'offer', 'free_shipping', 'min_group_size')),
  status text not null default 'draft' check (status in ('draft', 'running', 'ended')),
  variants jsonb not null default '[]',
  started_at timestamptz,
  ended_at timestamptz,
  winner text,
  created_at timestamptz not null default now()
);
-- One running experiment per variable, so overrides can't collide.
create unique index experiments_one_running_per_variable
  on public.experiments (variable) where status = 'running';

-- Per-session funnel flags: the admin funnel, breakdowns and experiment results read this.
create or replace view public.session_funnel
with (security_invoker = true) as
select
  s.id as session_id,
  s.visitor_id,
  s.started_at,
  s.landing_page,
  s.referrer,
  s.utm_source,
  s.utm_medium,
  s.utm_campaign,
  s.utm_term,
  s.utm_content,
  (s.gclid is not null or s.gbraid is not null or s.wbraid is not null) as has_click_id,
  s.device,
  s.experiments,
  bool_or(e.name = 'start_group_builder') as started_builder,
  bool_or(e.name = 'complete_group_builder') as completed_builder,
  bool_or(e.name = 'add_to_cart') as added_to_cart,
  bool_or(e.name = 'begin_checkout') as began_checkout,
  bool_or(e.name = 'purchase') as purchased
from public.visitor_sessions s
left join public.events e on e.session_id = s.id
group by s.id;

-- Atomic discount redemption (called by the webhook).
create or replace function public.redeem_discount_code(p_code text)
returns void language sql security definer set search_path = public as $$
  update public.discount_codes set uses_count = uses_count + 1 where code = upper(p_code);
$$;
revoke execute on function public.redeem_discount_code(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Row level security
-- Storefront reads go through the anon key; tracking + orders are written with the
-- service role from API routes (never directly by browsers).
-- ---------------------------------------------------------------------------
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.discount_codes enable row level security;
alter table public.offers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.faqs enable row level security;
alter table public.reviews enable row level security;
alter table public.visitor_sessions enable row level security;
alter table public.events enable row level security;
alter table public.ad_spend enable row level security;
alter table public.experiments enable row level security;

create policy "public read active collections" on public.collections
  for select using (active or public.is_admin());
create policy "admin all collections" on public.collections
  for all using (public.is_admin()) with check (public.is_admin());

create policy "public read active products" on public.products
  for select using (status = 'active' or public.is_admin());
create policy "admin all products" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

create policy "public read images of active products" on public.product_images
  for select using (
    public.is_admin() or exists (
      select 1 from public.products p where p.id = product_id and p.status = 'active'
    )
  );
create policy "admin all product_images" on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());

create policy "public read variants of active products" on public.product_variants
  for select using (
    public.is_admin() or exists (
      select 1 from public.products p where p.id = product_id and p.status = 'active'
    )
  );
create policy "admin all product_variants" on public.product_variants
  for all using (public.is_admin()) with check (public.is_admin());

-- Codes are validated server-side only.
create policy "admin all discount_codes" on public.discount_codes
  for all using (public.is_admin()) with check (public.is_admin());

-- Offers are public config (banner text, thresholds).
create policy "public read offers" on public.offers
  for select using (active or public.is_admin());
create policy "admin all offers" on public.offers
  for all using (public.is_admin()) with check (public.is_admin());

create policy "admin all orders" on public.orders
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all order_items" on public.order_items
  for all using (public.is_admin()) with check (public.is_admin());

create policy "public read active faqs" on public.faqs
  for select using (active or public.is_admin());
create policy "admin all faqs" on public.faqs
  for all using (public.is_admin()) with check (public.is_admin());

create policy "public read approved reviews" on public.reviews
  for select using (approved or public.is_admin());
create policy "admin all reviews" on public.reviews
  for all using (public.is_admin()) with check (public.is_admin());

create policy "admin read sessions" on public.visitor_sessions
  for select using (public.is_admin());
create policy "admin read events" on public.events
  for select using (public.is_admin());

create policy "admin all ad_spend" on public.ad_spend
  for all using (public.is_admin()) with check (public.is_admin());

create policy "public read running experiments" on public.experiments
  for select using (status = 'running' or public.is_admin());
create policy "admin all experiments" on public.experiments
  for all using (public.is_admin()) with check (public.is_admin());

-- Storage: only admins may write product images (previously any signed-in user could).
drop policy if exists "Authenticated upload product images" on storage.objects;
drop policy if exists "Authenticated update product images" on storage.objects;
drop policy if exists "Authenticated delete product images" on storage.objects;
create policy "Admins upload product images" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());
create policy "Admins update product images" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin());
create policy "Admins delete product images" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());

-- Site settings: economics holds costs/margins — admin only.
drop policy if exists "Site settings readable" on public.site_settings;
create policy "public read non-sensitive settings" on public.site_settings
  for select using (key <> 'economics' or public.is_admin());

-- Unit costs are commercially sensitive: hide cost columns from the public anon role.
revoke select on public.products from anon;
grant select (id, slug, name, collection_id, tagline, description, price_pence, compare_at_price_pence,
  status, sort_order, hero_image_url, accent_color, seo_title, seo_description, created_at, updated_at)
  on public.products to anon;
revoke select on public.product_variants from anon;
grant select (id, product_id, size, sku, active, stock) on public.product_variants to anon;
