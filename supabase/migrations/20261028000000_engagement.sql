-- Engagement per session from `page_engagement` events: on-screen seconds, furthest
-- scroll, pages viewed, and an `engaged` flag that separates real visitors from bots.
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
  bool_or(e.name = 'purchase') as purchased,
  count(*) filter (where e.name = 'page_view')::int as page_views,
  coalesce(sum(case when e.name = 'page_engagement' and jsonb_typeof(e.props->'secs') = 'number'
                    then (e.props->>'secs')::numeric end), 0)::int as engaged_secs,
  coalesce(max(case when e.name = 'page_engagement' and jsonb_typeof(e.props->'scroll') = 'number'
                    then (e.props->>'scroll')::numeric end), 0)::int as max_scroll,
  (
    coalesce(sum(case when e.name = 'page_engagement' and jsonb_typeof(e.props->'secs') = 'number'
                      then (e.props->>'secs')::numeric end), 0) >= 10
    or coalesce(max(case when e.name = 'page_engagement' and jsonb_typeof(e.props->'scroll') = 'number'
                         then (e.props->>'scroll')::numeric end), 0) >= 50
    or count(*) filter (where e.name = 'page_view') > 1
    or coalesce(bool_or(e.name not in ('page_view', 'page_engagement', 'consent_update', 'view_collection')), false)
  ) as engaged
from public.visitor_sessions s
left join public.events e on e.session_id = s.id
group by s.id;
