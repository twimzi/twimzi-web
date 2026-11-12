create or replace function public.admin_registration_intelligence()
returns jsonb language plpgsql stable security definer
set search_path = pg_catalog, public
as $function$
declare v_result jsonb;
begin
  if auth.uid() is null or not public.is_super_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  with linked_sessions as (
    select distinct profile_id,metadata->>'session_id' as session_id
    from public.analytics_events where profile_id is not null and metadata ? 'session_id'
  ),
  profile_event_scope as (
    select profile_id,event_name,created_at,metadata from public.analytics_events where profile_id is not null
    union all
    select ls.profile_id,ae.event_name,ae.created_at,ae.metadata
    from public.analytics_events ae join linked_sessions ls on ls.session_id=ae.metadata->>'session_id'
    where ae.profile_id is null
  ),
  user_rows as (
    select p.id as profile_id,p.full_name,p.email::text as email,p.phone,p.city,p.state,
      p.account_status::text as account_status,p.created_at,p.last_seen,
      coalesce(biz.businesses,'[]'::jsonb) as businesses,
      ev.last_event,ev.last_event_at,ev.first_registration_at,ev.event_count,
      ev.source,ev.medium,ev.campaign,coalesce(ev.recent_events,'[]'::jsonb) as recent_events,
      case when coalesce(biz.business_count,0)=0 then 'account_created'
        when biz.has_approved then 'approved' when biz.has_pending then 'pending_approval'
        when biz.has_draft then 'draft' when biz.has_rejected then 'rejected'
        when biz.has_suspended then 'suspended' else 'business_created' end as pipeline_status
    from public.profiles p
    left join lateral (
      select count(*)::integer as business_count,
        bool_or(b.business_status::text='approved') as has_approved,
        bool_or(b.business_status::text='pending') as has_pending,
        bool_or(b.business_status::text='draft') as has_draft,
        bool_or(b.business_status::text='rejected') as has_rejected,
        bool_or(b.business_status::text='suspended') as has_suspended,
        jsonb_agg(jsonb_build_object('id',b.id,'name',b.business_name,'status',b.business_status::text,
          'verification_status',b.verification_status::text,'profile_completion',b.profile_completion,
          'created_at',b.created_at,'is_active',b.is_active) order by b.created_at desc) as businesses
      from public.businesses b where b.owner_profile_id=p.id and b.deleted_at is null
    ) biz on true
    left join lateral (
      select
        (select x.event_name from profile_event_scope x where x.profile_id=p.id order by x.created_at desc limit 1) as last_event,
        (select max(x.created_at) from profile_event_scope x where x.profile_id=p.id) as last_event_at,
        (select min(x.created_at) from profile_event_scope x where x.profile_id=p.id and x.event_name like 'business_registration%') as first_registration_at,
        (select count(*)::integer from profile_event_scope x where x.profile_id=p.id) as event_count,
        (select coalesce(nullif(x.metadata->>'utm_source',''),nullif(x.metadata->>'referrer_host',''),'Direct')
          from profile_event_scope x where x.profile_id=p.id and x.metadata ? 'session_id' order by x.created_at desc limit 1) as source,
        (select x.metadata->>'utm_medium' from profile_event_scope x where x.profile_id=p.id and x.metadata ? 'utm_medium' order by x.created_at desc limit 1) as medium,
        (select x.metadata->>'utm_campaign' from profile_event_scope x where x.profile_id=p.id and x.metadata ? 'utm_campaign' order by x.created_at desc limit 1) as campaign,
        (select jsonb_agg(jsonb_build_object('event_name',r.event_name,'created_at',r.created_at,
          'path',r.metadata->>'path','step_name',r.metadata->>'step_name',
          'source',coalesce(nullif(r.metadata->>'utm_source',''),nullif(r.metadata->>'referrer_host',''),'Direct'))
          order by r.created_at desc)
         from (select x.event_name,x.created_at,x.metadata from profile_event_scope x
               where x.profile_id=p.id order by x.created_at desc limit 8) r) as recent_events
    ) ev on true
    where p.deleted_at is null order by p.created_at desc limit 250
  ),
  anonymous_session_summary as (
    select ae.metadata->>'session_id' as session_id,min(ae.created_at) as first_seen,max(ae.created_at) as last_seen,
      count(*)::integer as event_count,(array_agg(ae.event_name order by ae.created_at desc))[1] as last_event,
      (array_agg(ae.metadata->>'path' order by ae.created_at desc))[1] as last_path,
      (array_agg(coalesce(nullif(ae.metadata->>'utm_source',''),nullif(ae.metadata->>'referrer_host',''),'Direct')
        order by ae.created_at desc))[1] as source,
      (array_agg(ae.metadata->>'utm_campaign' order by ae.created_at desc)
        filter(where ae.metadata ? 'utm_campaign'))[1] as campaign,
      bool_or(ae.event_name='business_registration_started') as registration_started,
      bool_or(ae.event_name='business_registration_submitted') as registration_submitted,

    from public.analytics_events ae
    where ae.profile_id is null and ae.metadata ? 'session_id' and ae.created_at>=now()-interval '90 days'
      and ae.event_name in ('business_registration_started','business_registration_submitted')
      and not exists (select 1 from linked_sessions ls where ls.session_id=ae.metadata->>'session_id')
    group by ae.metadata->>'session_id' order by max(ae.created_at) desc limit 250
  ),
  anonymous_sessions as (
    select s.*,
      (select jsonb_agg(jsonb_build_object('event_name',h.event_name,'created_at',h.created_at,
        'path',h.metadata->>'path','cta_label',h.metadata->>'cta_label') order by h.created_at desc)
       from (select x.event_name,x.created_at,x.metadata from public.analytics_events x
        where x.profile_id is null and x.metadata->>'session_id'=s.session_id
        order by x.created_at desc limit 12) h) as event_history
    from anonymous_session_summary s
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
      'anonymous_registration_sessions',(select count(distinct ae.metadata->>'session_id') from public.analytics_events ae
        where ae.profile_id is null and ae.event_name='business_registration_started' and ae.created_at>=now()-interval '90 days'
          and not exists (select 1 from linked_sessions ls where ls.session_id=ae.metadata->>'session_id'))
    )
  ) into v_result;
  return v_result;
end;
$function$;