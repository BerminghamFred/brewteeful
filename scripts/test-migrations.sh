#!/usr/bin/env bash
# Applies the old + new migrations and the seed to a throwaway local Postgres with minimal
# Supabase stubs (auth schema, roles, storage). Catches SQL errors before they hit Supabase.
set -euo pipefail
cd "$(dirname "$0")/.."
PGBIN=$(ls -d /usr/lib/postgresql/*/bin | tail -1)
TMP=$(mktemp -d)
RUN=()
if [ "$(id -u)" = 0 ]; then chmod 777 "$TMP"; RUN=(runuser -u postgres --); fi
cleanup() {
  "${RUN[@]}" "$PGBIN/pg_ctl" -D "$TMP/data" stop -m fast >/dev/null 2>&1 || true
  rm -rf "$TMP"
}
trap cleanup EXIT
"${RUN[@]}" "$PGBIN/initdb" -D "$TMP/data" -U postgres >/dev/null
"${RUN[@]}" "$PGBIN/pg_ctl" -D "$TMP/data" -o "-k $TMP -p 54329 -c listen_addresses=''" -l "$TMP/log" start >/dev/null
PSQL=(psql -h "$TMP" -p 54329 -U postgres -v ON_ERROR_STOP=1 -q)
"${PSQL[@]}" <<'SQL'
create role anon; create role authenticated; create role service_role;
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text);
create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
create function auth.role() returns text language sql stable as $$ select 'anon'::text $$;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text);
alter table storage.objects enable row level security;
-- Mirror Supabase's default grants so privilege checks below are meaningful.
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
SQL
for f in supabase/migrations/*.sql; do
  echo "applying $f"
  "${PSQL[@]}" -f "$f"
done
echo "applying seed"
"${PSQL[@]}" -f supabase/seed.sql
"${PSQL[@]}" -c "select count(*) as products from products" -c "select count(*) as variants from product_variants"
# Funnel view sanity check: one session that reached add_to_cart, one that bounced.
"${PSQL[@]}" <<'SQL'
insert into visitor_sessions (id, visitor_id, utm_term) values
  ('00000000-0000-0000-0000-000000000001', 'v1', 'stag do t shirts'),
  ('00000000-0000-0000-0000-000000000002', 'v2', null);
insert into events (name, session_id) values
  ('start_group_builder', '00000000-0000-0000-0000-000000000001'),
  ('complete_group_builder', '00000000-0000-0000-0000-000000000001'),
  ('add_to_cart', '00000000-0000-0000-0000-000000000001'),
  ('page_view', '00000000-0000-0000-0000-000000000002');
do $$
declare r record;
begin
  select count(*) filter (where added_to_cart) as carts, count(*) filter (where started_builder) as starts,
         count(*) filter (where coalesce(purchased, false)) as buys, count(*) as n
    into r from session_funnel;
  if r.n <> 2 or r.carts <> 1 or r.starts <> 1 or r.buys <> 0 then
    raise exception 'session_funnel wrong: %', r;
  end if;
end $$;
-- Anon must not be able to read unit costs.
set role anon;
select count(*) as anon_visible_products from products;
select slug, price_pence from products limit 1;
do $$ begin
  perform cost_pence from products limit 1;
  raise exception 'anon can read cost_pence';
exception when insufficient_privilege then null;
end $$;
reset role;
SQL
echo "OK"
