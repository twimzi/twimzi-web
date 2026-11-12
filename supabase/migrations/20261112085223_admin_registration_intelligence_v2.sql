create index if not exists analytics_events_profile_created_idx
  on public.analytics_events (profile_id, created_at desc)
  where profile_id is not null;

create index if not exists analytics_events_session_created_idx
  on public.analytics_events ((metadata ->> 'session_id'), created_at desc)
  where metadata ? 'session_id';

create or replace function public.admin_registration_intelligence()
returns jsonb language plpgsql stable security definer
set search_path = pg_catalog, public
as $function$
declare v_result jsonb;
begin
  if auth.uid() is null or not public.is_super_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  with user_rows as (
    select p.id as profile_id,p.full_name,p.email::text as email,p.phone,p.city,p.state,
      p.account_status::text as account_status,p.created_at,p.last_seen,
      coalesce(biz.businesses,'[]'::jsonb) as businesses,
      ev.last_event,ev.last_event_at,ev.first_registration_at,ev.event_count,
      ev.source,ev.medium,ev.campaign,
      case when coalesce(biz.business_count,0)=0 then 'account_created'
        when biz.has_approved then 'approved'
        when biz.has_pending then 'pending_approval'
        when biz.has_draft then 'draft' else 'business_created' end as pipeline_status
    from public.profiles p
    left join lateral (
      select count(*)::integer as business_count,
        bool_or(b.business_status::text='approved') as has_approved,
        bool_or(b.business_status::text='pending') as has_pending,
        bool_or(b.business_status::text='draft') as has_draft,
        jsonb_agg(jsonb_build_object('id',b.id,'name',b.business_name,'status',b.business_status::text,
          'verification_status',b.verification_status::text,'profile_completion',b.profile_completion,
          'created_at',b.created_at,'is_active',b.is_active) order by b.created_at desc) as businesses
      from public.businesses b where b.owner_profile_id=p.id and b.deleted_at is null
    ) biz on true
    left join lateral (
      select (array_agg(ae.event_name order by ae.created_at desc))[1] as last_event,
        max(ae.created_at) as last_event_at,
        min(ae.created_at) filter(where ae.event_name like 'business_registration%') as first_registration_at,
        count(*)::integer as event_count,
        (array_agg(coalesce(nullif(ae.metadata->>'utm_source',''),nullif(ae.metadata->>'referrer_host',''),'Direct')
          order by ae.created_at desc) filter(where ae.metadata ? 'session_id'))[1] as source,
        (array_agg(ae.metadata->>'utm_medium' order by ae.created_at desc)
          filter(where ae.metadata ? 'utm_medium'))[1] as medium,
        (array_agg(ae.metadata->>'utm_campaign' order by ae.created_at desc)
          filter(where ae.metadata ? 'utm_campaign'))[1] as campaign
      from public.analytics_events ae where ae.profile_id=p.id
    ) ev on true
    where p.deleted_at is null order by p.created_at desc limit 250
  ),
  anonymous_sessions as (
    select ae.metadata->>'session_id' as session_id,min(ae.created_at) as first_seen,max(ae.created_at) as last_seen,
      count(*)::integer as event_count,(array_agg(ae.event_name order by ae.created_at desc))[1] as last_event,
      (array_agg(ae.metadata->>'path' order by ae.created_at desc))[1] as last_path,
      (array_agg(coalesce(nullif(ae.metadata->>'utm_source',''),nullif(ae.metadata->>'referrer_host',''),'Direct')
        order by ae.created_at desc))[1] as source,
      (array_agg(ae.metadata->>'utm_campaign' order by ae.created_at desc)
        filter(where ae.metadata ? 'utm_campaign'))[1] as campaign,
      bool_or(ae.event_name='business_registration_started') as registration_started,
      bool_or(ae.event_name='business_registration_submitted') as registration_submitted
    from public.analytics_events ae where ae.profile_id is null and ae.metadata ? 'session_id'
      and ae.created_at>=now()-interval '90 days'
    group by ae.metadata->>'session_id' order by max(ae.created_at) desc limit 250
  )
  select jsonb_build_object(
    'users',coalesce((select jsonb_agg(to_jsonb(u)) from user_rows u),'[]'::jsonb),
    'anonymous_sessions',coalesce((select jsonb_agg(to_jsonb(s)) from anonymous_sessions s),'[]'::jsonb),
    'summary',jsonb_build_object(
      'total_accounts',(select count(*) from public.profiles where deleted_at is null),
      'accounts_30d',(select count(*) from public.profiles where deleted_at is null and created_at>=now()-interval '30 days'),
      'accounts_7d',(select count(*) from public.profiles where deleted_at is null and created_at>=now()-interval '7 days'),
      'businesses_total',(select count(*) from public.businesses where deleted_at is null),
      'businesses_30d',(select count(*) from public.businesses where deleted_at is null and created_at>=now()-interval '30 days'),
      'businesses_approved',(select count(*) from public.businesses where deleted_at is null and business_status::text='approved'),
      'registration_starts_30d',(select count(distinct metadata->>'session_id') from public.analytics_events where event_name='business_registration_started' and created_at>=now()-interval '30 days'),
      'registration_submissions_30d',(select count(distinct metadata->>'session_id') from public.analytics_events where event_name='business_registration_submitted' and created_at>=now()-interval '30 days'),
      'anonymous_registration_sessions',(select count(distinct metadata->>'session_id') from public.analytics_events where profile_id is null and event_name='business_registration_started' and created_at>=now()-interval '90 days')
    )
  ) into v_result;
  return v_result;
end;
$function$;

revoke all on function public.admin_registration_intelligence() from public, anon;
grant execute on function public.admin_registration_intelligence() to authenticated;
