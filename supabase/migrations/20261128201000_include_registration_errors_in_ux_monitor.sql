-- Include detailed registration diagnostics in the same Super Admin UX error feed.
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
    'errors_24h',
      (select count(*) from public.analytics_events where event_name in ('ux_js_error','ux_resource_error','ux_form_error') and created_at >= now()-interval '24 hours')
      + (select count(*) from public.registration_audit_events where created_at >= now()-interval '24 hours'),
    'events_7d',(select count(*) from public.analytics_events where created_at >= now()-interval '7 days'),
    'top_pages',coalesce((select jsonb_agg(x) from (
      select jsonb_build_object('path',coalesce(metadata->>'path','/'),'views',count(*)) x
      from public.analytics_events where event_name='page_view' and created_at>=now()-interval '7 days'
      group by metadata->>'path' order by count(*) desc limit 10
    ) q),'[]'::jsonb),
    'recent_errors',coalesce((select jsonb_agg(x order by created_at desc) from (
      select jsonb_build_object('event_name',event_name,'path',metadata->>'path','message',metadata->>'error_message',
        'error_name',metadata->>'error_name','status_code',metadata->>'status_code',
        'session_id',metadata->>'session_id','created_at',created_at) x, created_at
      from public.analytics_events
      where event_name in ('ux_js_error','ux_resource_error','ux_form_error')
      union all
      select jsonb_build_object('event_name',event_name,'path',path,'message',error_message,
        'error_name',null,'status_code',http_status::text,'session_id',session_id::text,'created_at',created_at) x, created_at
      from public.registration_audit_events
    ) q),'[]'::jsonb),
    'recent_activity',coalesce((select jsonb_agg(x order by created_at desc) from (
      select jsonb_build_object('event_name',event_name,'path',metadata->>'path',
        'label',coalesce(metadata->>'cta_label',metadata->>'element_label',metadata->>'step_name'),
        'session_id',metadata->>'session_id','device_type',device_type,'created_at',created_at) x, created_at
      from public.analytics_events
      union all
      select jsonb_build_object('event_name',event_name,'path',path,
        'label',stage,'session_id',session_id::text,'device_type',null,'created_at',created_at) x, created_at
      from public.registration_audit_events
    ) q limit 50),'[]'::jsonb)
  ) into result;
  return result;
end;
$$;
revoke all on function public.admin_ux_monitoring_stats() from public, anon;
grant execute on function public.admin_ux_monitoring_stats() to authenticated;
