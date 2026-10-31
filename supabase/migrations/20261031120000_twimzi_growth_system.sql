-- Twimzi Growth System
-- Adds anonymous, privacy-minimised web event ingestion and an admin-only growth summary.
-- Existing analytics_events rows, policies, business workflows and dashboard RPCs are preserved.

grant usage on schema public to anon;
grant insert (event_name, platform, device_type, metadata)
  on table public.analytics_events to anon;

drop policy if exists analytics_public_web_insert on public.analytics_events;
create policy analytics_public_web_insert
  on public.analytics_events
  for insert
  to anon
  with check (
    event_name in (
      'page_view',
      'business_registration_viewed',
      'business_registration_started',
      'business_registration_submitted',
      'signup_started',
      'signup_completed',
      'whatsapp_click',
      'cta_click'
    )
    and platform = 'web'
    and device_type in ('desktop', 'mobile', 'tablet')
    and profile_id is null
    and business_id is null
    and entity_type is null
    and entity_id is null
    and app_version is null
    and ip_address is null
    and user_agent is null
    and jsonb_typeof(metadata) = 'object'
    and octet_length(metadata::text) <= 2048
    and metadata ? 'session_id'
    and metadata ? 'path'
    and (metadata ->> 'session_id') ~ '^[0-9a-fA-F-]{36}$'
    and length(metadata ->> 'path') between 1 and 200
    and coalesce(length(metadata ->> 'referrer_host'), 0) <= 160
    and coalesce(length(metadata ->> 'utm_source'), 0) <= 100
    and coalesce(length(metadata ->> 'utm_medium'), 0) <= 100
    and coalesce(length(metadata ->> 'utm_campaign'), 0) <= 120
    and coalesce(length(metadata ->> 'utm_content'), 0) <= 120
    and coalesce(length(metadata ->> 'utm_term'), 0) <= 120
    and coalesce(length(metadata ->> 'cta_label'), 0) <= 80
    and coalesce(length(metadata ->> 'destination_host'), 0) <= 160
    and metadata - array[
      'session_id',
      'path',
      'referrer_host',
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_content',
      'utm_term',
      'cta_label',
      'destination_host'
    ]::text[] = '{}'::jsonb
  );

create or replace function public.admin_growth_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_result jsonb;
begin
  if not public.is_super_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  with events as materialized (
    select
      event_name,
      created_at,
      metadata
    from public.analytics_events
    where created_at >= now() - interval '30 days'
  ),
  daily_events as (
    select
      created_at::date as event_day,
      count(distinct metadata ->> 'session_id')
        filter (where event_name = 'page_view') as visitors,
      count(distinct metadata ->> 'session_id')
        filter (where event_name = 'business_registration_submitted') as registrations,
      count(*) filter (where event_name = 'whatsapp_click') as whatsapp_clicks
    from events
    group by created_at::date
  ),
  funnel as (
    select jsonb_agg(
      jsonb_build_object(
        'stage', stage,
        'label', label,
        'sessions', sessions
      )
      order by sort_order
    ) as rows
    from (
      select
        1 as sort_order,
        'registration_viewed'::text as stage,
        'Viewed business registration'::text as label,
        count(distinct metadata ->> 'session_id') as sessions
      from events
      where event_name = 'business_registration_viewed'
      union all
      select
        2,
        'registration_started',
        'Started entering business details',
        count(distinct metadata ->> 'session_id')
      from events
      where event_name = 'business_registration_started'
      union all
      select
        3,
        'registration_submitted',
        'Submitted a business profile',
        count(distinct metadata ->> 'session_id')
      from events
      where event_name = 'business_registration_submitted'
    ) stages
  ),
  daily as (
    select jsonb_agg(
      jsonb_build_object(
        'date', to_char(days.day, 'YYYY-MM-DD'),
        'visitors', coalesce(daily_events.visitors, 0),
        'registrations', coalesce(daily_events.registrations, 0),
        'whatsapp_clicks', coalesce(daily_events.whatsapp_clicks, 0)
      )
      order by days.day
    ) as rows
    from generate_series(
      current_date - 13,
      current_date,
      interval '1 day'
    ) as days(day)
    left join daily_events on daily_events.event_day = days.day::date
  ),
  campaigns as (
    select jsonb_agg(
      jsonb_build_object(
        'source', source,
        'campaign', campaign,
        'visitors', visitors,
        'registrations', registrations
      )
      order by visitors desc, registrations desc
    ) as rows
    from (
      select
        coalesce(
          nullif(metadata ->> 'utm_source', ''),
          nullif(metadata ->> 'referrer_host', ''),
          'Direct'
        ) as source,
        coalesce(nullif(metadata ->> 'utm_campaign', ''), '(not set)') as campaign,
        count(distinct metadata ->> 'session_id')
          filter (where event_name = 'page_view') as visitors,
        count(distinct metadata ->> 'session_id')
          filter (where event_name = 'business_registration_submitted') as registrations
      from events
      group by 1, 2
      having count(*) > 0
      order by 3 desc, 4 desc
      limit 10
    ) campaign_rows
  ),
  top_pages as (
    select jsonb_agg(
      jsonb_build_object(
        'path', path,
        'views', views,
        'visitors', visitors
      )
      order by views desc
    ) as rows
    from (
      select
        coalesce(nullif(metadata ->> 'path', ''), '/') as path,
        count(*) as views,
        count(distinct metadata ->> 'session_id') as visitors
      from events
      where event_name = 'page_view'
      group by 1
      order by 2 desc
      limit 10
    ) page_rows
  )
  select jsonb_build_object(
    'summary', jsonb_build_object(
      'total_events', (select count(*) from events),
      'unique_visitors', (
        select count(distinct metadata ->> 'session_id')
        from events
        where event_name = 'page_view'
      ),
      'page_views', (
        select count(*) from events where event_name = 'page_view'
      ),
      'registration_views', (
        select count(distinct metadata ->> 'session_id')
        from events where event_name = 'business_registration_viewed'
      ),
      'registration_starts', (
        select count(distinct metadata ->> 'session_id')
        from events where event_name = 'business_registration_started'
      ),
      'registration_submissions', (
        select count(distinct metadata ->> 'session_id')
        from events where event_name = 'business_registration_submitted'
      ),
      'whatsapp_clicks', (
        select count(*) from events where event_name = 'whatsapp_click'
      ),
      'signup_completions', (
        select count(distinct metadata ->> 'session_id')
        from events where event_name = 'signup_completed'
      ),
      'new_businesses_30d', (
        select count(*) from public.businesses
        where deleted_at is null and created_at >= now() - interval '30 days'
      ),
      'new_users_30d', (
        select count(*) from public.profiles
        where deleted_at is null and created_at >= now() - interval '30 days'
      ),
      'total_businesses', (
        select count(*) from public.businesses where deleted_at is null
      ),
      'approved_businesses', (
        select count(*) from public.businesses
        where deleted_at is null and business_status::text = 'approved'
      ),
      'draft_businesses', (
        select count(*) from public.businesses
        where deleted_at is null and business_status::text = 'draft'
      )
    ),
    'funnel', coalesce((select rows from funnel), '[]'::jsonb),
    'daily', coalesce((select rows from daily), '[]'::jsonb),
    'campaigns', coalesce((select rows from campaigns), '[]'::jsonb),
    'top_pages', coalesce((select rows from top_pages), '[]'::jsonb)
  )
  into v_result;

  return v_result;
end;
$function$;

revoke all on function public.admin_growth_dashboard_stats() from public;
revoke all on function public.admin_growth_dashboard_stats() from anon;
grant execute on function public.admin_growth_dashboard_stats() to authenticated;

comment on function public.admin_growth_dashboard_stats() is
  'Returns 30-day acquisition, business registration funnel and campaign metrics for super admins only.';
