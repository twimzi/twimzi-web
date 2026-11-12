-- Consent-based capture of incomplete business registrations for Super Admin follow-up.
create table if not exists public.business_registration_leads (
  session_id uuid primary key,
  payload jsonb not null default '{}'::jsonb,
  user_id uuid references auth.users(id) on delete set null,
  consent_at timestamptz not null,
  source text,
  medium text,
  campaign text,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'follow_up', 'converted', 'not_interested')),
  admin_notes text,
  submitted boolean not null default false,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_registration_leads_updated_at_idx
  on public.business_registration_leads (updated_at desc);
create index if not exists business_registration_leads_status_idx
  on public.business_registration_leads (status, updated_at desc);
create index if not exists business_registration_leads_user_id_idx
  on public.business_registration_leads (user_id)
  where user_id is not null;

alter table public.business_registration_leads enable row level security;
revoke all on table public.business_registration_leads from anon, authenticated;
grant all on table public.business_registration_leads to service_role;

create or replace function public.capture_business_registration_lead(
  p_session_id uuid,
  p_payload jsonb,
  p_consent boolean,
  p_submitted boolean default false,
  p_source text default null,
  p_medium text default null,
  p_campaign text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_payload jsonb;
begin
  if p_session_id is null or p_consent is distinct from true
     or jsonb_typeof(p_payload) <> 'object'
     or octet_length(p_payload::text) > 12000 then
    raise exception 'Invalid registration lead payload' using errcode = '22023';
  end if;

  if p_payload - array[
    'business_name','business_type','contact_name','contact_email','phone',
    'website','address_line_1','address_line_2','landmark','city','state',
    'country','postal_code','description','keywords','hashtags'
  ]::text[] <> '{}'::jsonb then
    raise exception 'Unsupported registration lead fields' using errcode = '22023';
  end if;

  v_payload := jsonb_strip_nulls(jsonb_build_object(
    'business_name', left(coalesce(p_payload->>'business_name',''), 160),
    'business_type', left(coalesce(p_payload->>'business_type',''), 120),
    'contact_name', left(coalesce(p_payload->>'contact_name',''), 120),
    'contact_email', left(coalesce(p_payload->>'contact_email',''), 254),
    'phone', left(coalesce(p_payload->>'phone',''), 32),
    'website', left(coalesce(p_payload->>'website',''), 300),
    'address_line_1', left(coalesce(p_payload->>'address_line_1',''), 240),
    'address_line_2', left(coalesce(p_payload->>'address_line_2',''), 240),
    'landmark', left(coalesce(p_payload->>'landmark',''), 160),
    'city', left(coalesce(p_payload->>'city',''), 100),
    'state', left(coalesce(p_payload->>'state',''), 100),
    'country', left(coalesce(p_payload->>'country',''), 100),
    'postal_code', left(coalesce(p_payload->>'postal_code',''), 20),
    'description', left(coalesce(p_payload->>'description',''), 2000),
    'keywords', left(coalesce(p_payload->>'keywords',''), 500),
    'hashtags', left(coalesce(p_payload->>'hashtags',''), 500)
  ));

  insert into public.business_registration_leads (
    session_id, payload, user_id, consent_at, source, medium, campaign,
    submitted, submitted_at, updated_at
  )
  values (
    p_session_id, v_payload, auth.uid(), now(),
    nullif(left(coalesce(p_source,''),100),''),
    nullif(left(coalesce(p_medium,''),100),''),
    nullif(left(coalesce(p_campaign,''),120),''),
    coalesce(p_submitted,false),
    case when coalesce(p_submitted,false) then now() else null end,
    now()
  )
  on conflict (session_id) do update set
    payload = excluded.payload,
    user_id = coalesce(excluded.user_id, public.business_registration_leads.user_id),
    source = coalesce(excluded.source, public.business_registration_leads.source),
    medium = coalesce(excluded.medium, public.business_registration_leads.medium),
    campaign = coalesce(excluded.campaign, public.business_registration_leads.campaign),
    submitted = public.business_registration_leads.submitted or excluded.submitted,
    submitted_at = coalesce(public.business_registration_leads.submitted_at, excluded.submitted_at),
    updated_at = now();

  return true;
end;
$function$;

revoke all on function public.capture_business_registration_lead(uuid,jsonb,boolean,boolean,text,text,text) from public;
grant execute on function public.capture_business_registration_lead(uuid,jsonb,boolean,boolean,text,text,text) to anon, authenticated;

create or replace function public.admin_registration_leads()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if auth.uid() is null or not public.is_super_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'session_id', l.session_id,
      'payload', l.payload,
      'user_id', l.user_id,
      'source', l.source,
      'medium', l.medium,
      'campaign', l.campaign,
      'status', l.status,
      'admin_notes', l.admin_notes,
      'submitted', l.submitted,
      'submitted_at', l.submitted_at,
      'created_at', l.created_at,
      'updated_at', l.updated_at
    ) order by l.updated_at desc)
    from public.business_registration_leads l
  ), '[]'::jsonb);
end;
$function$;

revoke all on function public.admin_registration_leads() from public, anon;
grant execute on function public.admin_registration_leads() to authenticated;

create or replace function public.admin_update_registration_lead(
  p_session_id uuid,
  p_status text,
  p_admin_notes text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if auth.uid() is null or not public.is_super_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_status not in ('new','contacted','follow_up','converted','not_interested') then
    raise exception 'Invalid lead status' using errcode = '22023';
  end if;

  update public.business_registration_leads
  set status = p_status,
      admin_notes = left(coalesce(p_admin_notes,''),2000),
      updated_at = now()
  where session_id = p_session_id;

  return found;
end;
$function$;

revoke all on function public.admin_update_registration_lead(uuid,text,text) from public, anon;
grant execute on function public.admin_update_registration_lead(uuid,text,text) to authenticated;
