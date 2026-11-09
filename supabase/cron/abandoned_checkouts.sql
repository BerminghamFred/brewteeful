-- Runs the abandoned-checkout job every 10 minutes (Supabase pg_cron + pg_net).
-- Not a migration: needs the hosted extensions and the live site URL. Re-run to update.
create extension if not exists pg_net;
create extension if not exists pg_cron;
select cron.unschedule('abandoned-checkouts') where exists (select 1 from cron.job where jobname = 'abandoned-checkouts');
select cron.schedule(
  'abandoned-checkouts',
  '*/10 * * * *',
  $$ select net.http_post(
       url := 'https://www.brewteeful.co.uk/api/cron/abandoned',
       headers := '{"Content-Type": "application/json"}'::jsonb,
       body := '{}'::jsonb,
       timeout_milliseconds := 30000
     ) $$
);
