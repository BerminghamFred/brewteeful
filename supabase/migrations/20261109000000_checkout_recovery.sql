-- Abandoned-checkout recovery: we ask for the email before payment, then (if they agreed)
-- send one reminder an hour later, and alert the owner.
alter table public.orders add column if not exists reminder_opt_in boolean not null default false;
alter table public.orders add column if not exists reminder_sent_at timestamptz;
alter table public.orders add column if not exists abandon_alert_sent_at timestamptz;
create index if not exists orders_pending_recovery_idx on public.orders (created_at) where status = 'pending';

-- Addresses that unsubscribed: never sent a reminder again.
create table if not exists public.email_suppressions (
  email text primary key,
  reason text,
  created_at timestamptz not null default now()
);
alter table public.email_suppressions enable row level security;
drop policy if exists "admin all email_suppressions" on public.email_suppressions;
create policy "admin all email_suppressions" on public.email_suppressions
  for all using (public.is_admin()) with check (public.is_admin());
