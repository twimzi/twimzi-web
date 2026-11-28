-- Append-only, privacy-conscious diagnostics for the public business registration funnel.
create table if not exists public.registration_audit_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null default gen_random_uuid(),
  session_id uuid not null,
  profile_id uuid references public.profiles(id) on delete set null,
  event_name text not null,
  stage text not null,
  path text not null,
  http_status integer,
  error_code text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint registration_audit_event_name_length check (length(event_name) between 1 and 80),
  constraint registration_audit_stage_length check (length(stage) between 1 and 80),
  constraint registration_audit_path_length check (length(path) between 1 and 200),
  constraint registration_audit_error_code_length check (coalesce(length(error_code),0) <= 80),
  constraint registration_audit_error_message_length check (coalesce(length(error_message),0) <= 500),
  constraint registration_audit_metadata_object check (jsonb_typeof(metadata) = 'object' and octet_length(metadata::text) <= 2048)
);
create index if not exists registration_audit_events_created_at_idx on public.registration_audit_events(created_at desc);
create index if not exists registration_audit_events_session_idx on public.registration_audit_events(session_id, created_at desc);
create index if not exists registration_audit_events_stage_idx on public.registration_audit_events(stage, created_at desc);
alter table public.registration_audit_events enable row level security;
drop policy if exists registration_audit_anon_insert on public.registration_audit_events;
create policy registration_audit_anon_insert on public.registration_audit_events for insert to anon with check (profile_id is null and http_status between 100 and 599);
drop policy if exists registration_audit_authenticated_insert on public.registration_audit_events;
create policy registration_audit_authenticated_insert on public.registration_audit_events for insert to authenticated with check ((profile_id is null or profile_id = (select auth.uid())) and http_status between 100 and 599);
drop policy if exists registration_audit_super_admin_read on public.registration_audit_events;
create policy registration_audit_super_admin_read on public.registration_audit_events for select to authenticated using (public.is_super_admin());
drop policy if exists registration_audit_no_update on public.registration_audit_events;
create policy registration_audit_no_update on public.registration_audit_events for update to anon, authenticated using (false) with check (false);
drop policy if exists registration_audit_no_delete on public.registration_audit_events;
create policy registration_audit_no_delete on public.registration_audit_events for delete to anon, authenticated using (false);

grant insert on public.registration_audit_events to anon, authenticated;
grant select on public.registration_audit_events to authenticated;
revoke update, delete on public.registration_audit_events from anon, authenticated;
