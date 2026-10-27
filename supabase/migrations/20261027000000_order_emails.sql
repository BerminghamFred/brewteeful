-- When each customer email went out (also stops duplicates on webhook retries).
alter table public.orders add column if not exists confirmation_email_sent_at timestamptz;
alter table public.orders add column if not exists shipped_email_sent_at timestamptz;
