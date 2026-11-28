-- Expand privacy-safe first-party UX telemetry and provide a Super Admin monitoring summary.
drop policy if exists analytics_public_web_insert on public.analytics_events;
create policy analytics_public_web_insert on public.analytics_events
for insert to anon
with check (
  event_name = any (array[
    'page_view','business_registration_viewed','business_registration_started',
    'business_registration_submitted','business_registration_auth_required','business_registration_auth_failed',
    'signup_started','signup_completed','whatsapp_click','cta_click',
    'ux_click','ux_form_started','ux_form_submitted','ux_form_error',
    'ux_js_error','ux_resource_error','ux_page_performance','ux_scroll_depth',
    'ux_outbound_click','ux_search'
  ]::text[])
  and platform = 'web'
  and device_type = any (array['desktop','mobile','tablet']::text[])
  and profile_id is null and business_id is null and entity_type is null
  and entity_id is null and app_version is null and ip_address is null and user_agent is null
  and jsonb_typeof(metadata) = 'object' and octet_length(metadata::text) <= 2048
  and metadata ? 'session_id' and metadata ? 'path'
  and (metadata->>'session_id') ~ '^[0-9a-fA-F-]{36}$'
  and length(metadata->>'path') between 1 and 200
  and coalesce(length(metadata->>'referrer_host'),0) <= 160
  and coalesce(length(metadata->>'utm_source'),0) <= 100
  and coalesce(length(metadata->>'utm_medium'),0) <= 100
  and coalesce(length(metadata->>'utm_campaign'),0) <= 120
  and coalesce(length(metadata->>'utm_content'),0) <= 120
  and coalesce(length(metadata->>'utm_term'),0) <= 120
  and coalesce(length(metadata->>'cta_label'),0) <= 80
  and coalesce(length(metadata->>'destination_host'),0) <= 160
  and coalesce(length(metadata->>'step_name'),0) <= 80
  and coalesce(length(metadata->>'element_type'),0) <= 40
  and coalesce(length(metadata->>'element_label'),0) <= 100
  and coalesce(length(metadata->>'form_id'),0) <= 100
  and coalesce(length(metadata->>'error_message'),0) <= 300
  and coalesce(length(metadata->>'error_name'),0) <= 100
  and coalesce(length(metadata->>'error_code'),0) <= 80
  and coalesce(length(metadata->>'metric_name'),0) <= 40
  and coalesce(length(metadata->>'target_path'),0) <= 200
  and coalesce(length(metadata->>'input_type'),0) <= 40
  and (not (metadata ? 'duration_ms') or (metadata->>'duration_ms') ~ '^\d+(\.\d+)?$')
  and (not (metadata ? 'metric_value') or (metadata->>'metric_value') ~ '^-?\d+(\.\d+)?$')
  and (not (metadata ? 'scroll_depth') or (metadata->>'scroll_depth') in ('25','50','75','90','100'))
  and (not (metadata ? 'status_code') or (metadata->>'status_code') ~ '^\d{3}$')
  and (metadata - array[
    'session_id','path','referrer_host','utm_source','utm_medium','utm_campaign','utm_content','utm_term',
    'cta_label','destination_host','step_name','element_type','element_label','form_id',
    'error_message','error_name','error_code','metric_name','metric_value','duration_ms',
    'scroll_depth','target_path','input_type','status_code'
  ]::text[]) = '{}'::jsonb
);

create or replace function public.admin_ux_monitoring_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare result jsonb;
begin
  if not public.is_super_admin() then raise exception 'Unauthorized'; end if;
  select jsonb_build_object(
    'events_today',(select count(*) from public.analytics_events where created_at >= date_trunc('day', now())),
    'sessions_today',(select count(distinct metadata->>'session_id') from public.analytics_events where created_at >= date_trunc('day', now()) and metadata ? 'session_id'),
    'page_views_today',(select count(*) from public.analytics_events where event_name='page_view' and created_at >= date_trunc('day', now())),
    'errors_24h',(select count(*) from public.analytics_events where event_name in ('ux_js_error','ux_resource_error','ux_form_error') and created_at >= now()-interval '24 hours'),
    'events_7d',(select count(*) from public.analytics_events where created_at >= now()-interval '7 days'),
    'top_pages',coalesce((select jsonb_agg(x) from (
      select jsonb_build_object('path',coalesce(metadata->>'path','/'),'views',count(*)) x
      from public.analytics_events where event_name='page_view' and created_at>=now()-interval '7 days'
      group by metadata->>'path' order by count(*) desc limit 10
    ) q),'[]'::jsonb),
    'recent_errors',coalesce((select jsonb_agg(x) from (
      select jsonb_build_object('event_name',event_name,'path',metadata->>'path','message',metadata->>'error_message',
        'error_name',metadata->>'error_name','status_code',metadata->>'status_code',
        'session_id',metadata->>'session_id','created_at',created_at) x
      from public.analytics_events
      where event_name in ('ux_js_error','ux_resource_error','ux_form_error')
      order by created_at desc limit 30
    ) q),'[]'::jsonb),
    'recent_activity',coalesce((select jsonb_agg(x) from (
      select jsonb_build_object('event_name',event_name,'path',metadata->>'path',
        'label',coalesce(metadata->>'cta_label',metadata->>'element_label',metadata->>'step_name'),
        'session_id',metadata->>'session_id','device_type',device_type,'created_at',created_at) x
      from public.analytics_events order by created_at desc limit 50
    ) q),'[]'::jsonb)
  ) into result;
  return result;
end;
$$;
revoke all on function public.admin_ux_monitoring_stats() from public, anon;
grant execute on function public.admin_ux_monitoring_stats() to authenticated;
