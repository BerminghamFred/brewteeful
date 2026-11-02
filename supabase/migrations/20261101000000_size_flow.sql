-- Size-step A/B/C test, "pay now, sizes later" orders, and saved lineups.

alter table public.experiments drop constraint if exists experiments_variable_check;
alter table public.experiments add constraint experiments_variable_check
  check (variable in ('price', 'headline', 'cta', 'hero_image', 'offer', 'free_shipping', 'min_group_size', 'homepage', 'size_flow'));

-- Orders paid before everyone's size is known: items carry size 'TBC' until the group
-- fills them in at /sizes/<token>; printing waits for sizes_completed_at.
alter table public.orders add column if not exists sizes_token text unique;
alter table public.orders add column if not exists sizes_completed_at timestamptz;

-- "Email me this lineup": a lead to follow up, plus the link we sent.
create table if not exists public.saved_lineups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  lineup_url text not null,
  group_size integer,
  visitor_id text,
  session_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists saved_lineups_created_idx on public.saved_lineups (created_at desc);
alter table public.saved_lineups enable row level security;
drop policy if exists "admin all saved_lineups" on public.saved_lineups;
create policy "admin all saved_lineups" on public.saved_lineups
  for all using (public.is_admin()) with check (public.is_admin());
