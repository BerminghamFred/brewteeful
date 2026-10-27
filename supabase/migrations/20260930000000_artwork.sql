-- Close-up of each design's print, shown large on the homepage lineup hover.
alter table public.products add column if not exists artwork_url text;
grant select (artwork_url) on public.products to anon;
