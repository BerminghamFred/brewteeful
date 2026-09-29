-- BrewTeeFul initial schema
-- Run via Supabase CLI or SQL editor

create extension if not exists "pgcrypto";

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  phone text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  collection_slug text not null default 'all',
  price_pence integer not null,
  compare_at_price_pence integer,
  stock_remaining integer not null default 50,
  status text not null default 'draft' check (status in ('draft', 'published')),
  hero_image_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_collection_idx on public.products (collection_slug);
create index products_status_idx on public.products (status);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  sort_order integer not null default 0,
  alt text
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null,
  sku text not null,
  stock integer not null default 0,
  price_pence integer
);

create unique index product_variants_product_size on public.product_variants (product_id, size);

-- Reviews
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  author_name text not null,
  city text,
  rating integer not null check (rating >= 1 and rating <= 5),
  body text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create index reviews_product_idx on public.reviews (product_id);

-- Site settings (key-value JSON)
create table public.site_settings (
  key text primary key,
  value jsonb not null default '{}'
);

-- Discount codes
create table public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  percent_off numeric(5,2),
  amount_off_pence integer,
  expires_at timestamptz,
  max_uses integer,
  uses_count integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  status text not null default 'pending',
  email text,
  total_pence integer not null default 0,
  currency text not null default 'gbp',
  line_items jsonb not null default '[]',
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index orders_email_idx on public.orders (email);

-- Stripe webhook idempotency
create table public.stripe_events (
  id text primary key,
  received_at timestamptz not null default now()
);

-- Experiments
create table public.experiments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'running', 'paused')),
  experiment_type text not null check (experiment_type in ('headline', 'price', 'image')),
  variants jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.experiment_assignments (
  visitor_id text not null,
  experiment_id uuid not null references public.experiments(id) on delete cascade,
  variant_key text not null,
  created_at timestamptz not null default now(),
  primary key (visitor_id, experiment_id)
);

-- Analytics events (optional funnel)
create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  visitor_id text,
  path text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index analytics_events_name_idx on public.analytics_events (name, created_at);

-- Abandoned carts
create table public.abandoned_carts (
  id uuid primary key default gen_random_uuid(),
  email text,
  cart jsonb not null,
  updated_at timestamptz not null default now()
);

-- RLS: products (public read published)
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.reviews enable row level security;
alter table public.site_settings enable row level security;
alter table public.discount_codes enable row level security;
alter table public.orders enable row level security;
alter table public.experiments enable row level security;
alter table public.experiment_assignments enable row level security;
alter table public.analytics_events enable row level security;
alter table public.abandoned_carts enable row level security;

-- Helper: admin check
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- Products: anon can read published
create policy "Published products are visible to all"
  on public.products for select
  using (status = 'published');

create policy "Admins manage products"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

-- Images
create policy "Images for published products"
  on public.product_images for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.status = 'published'
    )
  );

create policy "Admins manage product_images"
  on public.product_images for all
  using (public.is_admin())
  with check (public.is_admin());

-- Variants
create policy "Variants for published products"
  on public.product_variants for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.status = 'published'
    )
  );

create policy "Admins manage variants"
  on public.product_variants for all
  using (public.is_admin())
  with check (public.is_admin());

-- Reviews
create policy "Approved reviews visible"
  on public.reviews for select
  using (approved = true);

create policy "Admins manage reviews"
  on public.reviews for all
  using (public.is_admin())
  with check (public.is_admin());

-- Site settings: public read selected keys only — use anon read for storefront
-- Expose only non-sensitive keys via a view or allow select all for anon (banner text is public)
create policy "Site settings readable"
  on public.site_settings for select
  using (true);

create policy "Admins manage site_settings"
  on public.site_settings for all
  using (public.is_admin())
  with check (public.is_admin());

-- Discount codes: no public select (validate server-side)
create policy "No public discount list"
  on public.discount_codes for select
  using (false);

create policy "Admins manage discount_codes"
  on public.discount_codes for all
  using (public.is_admin())
  with check (public.is_admin());

-- Orders: admin only
create policy "Admins see orders"
  on public.orders for select
  using (public.is_admin());

create policy "Service role inserts orders" -- webhook uses service role; anon cannot insert
  on public.orders for insert
  with check (false);

create policy "Admins update orders"
  on public.orders for update
  using (public.is_admin());

-- Experiments: public read running only for assignment via server
create policy "Experiments readable by admin"
  on public.experiments for select
  using (public.is_admin() or status = 'running');

create policy "Admins manage experiments"
  on public.experiments for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Assignments admin"
  on public.experiment_assignments for all
  using (public.is_admin())
  with check (public.is_admin());

-- Allow anon insert analytics_events for funnel (optional) — or disable
create policy "Anon can insert analytics"
  on public.analytics_events for insert
  with check (true);

create policy "Admins read analytics"
  on public.analytics_events for select
  using (public.is_admin());

-- Stripe events: service role only (bypass RLS with service key)
alter table public.stripe_events enable row level security;

-- Abandoned carts
create policy "Anon insert abandoned carts"
  on public.abandoned_carts for insert
  with check (true);

create policy "Admins read abandoned carts"
  on public.abandoned_carts for select
  using (public.is_admin());

-- Profiles: allow insert on signup
create policy "Users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup (Supabase Auth)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'customer');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
