-- Structured-feed configuration and bounded worker execution.
alter table public.admin_contact_bank
  add column if not exists website text,
  add column if not exists website_domain text,
  add column if not exists business_address text,
  add column if not exists district text,
  add column if not exists business_category text;

create index if not exists admin_contact_bank_website_domain_idx
  on public.admin_contact_bank(website_domain)
  where website_domain is not null;
create index if not exists admin_contact_bank_business_location_idx
  on public.admin_contact_bank(business_category, state, district);
alter table public.lead_generator_sources
  add column if not exists feed_format text not null default 'json',
  add column if not exists feed_config jsonb not null default '{}'::jsonb;

alter table public.lead_generator_sources
  drop constraint if exists lead_generator_sources_feed_format_check;
alter table public.lead_generator_sources
  add constraint lead_generator_sources_feed_format_check
  check (feed_format in ('json'));

alter table public.lead_generator_sources
  drop constraint if exists lead_generator_sources_feed_config_object_check;
alter table public.lead_generator_sources
  add constraint lead_generator_sources_feed_config_object_check
  check (jsonb_typeof(feed_config) = 'object');

create table if not exists public.lead_generator_fetch_log (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.lead_generator_sources(id) on delete cascade,
  job_id uuid references public.lead_generator_jobs(id) on delete set null,
  requested_at timestamptz not null default now(),
  http_status integer,
  outcome text not null default 'started',
  records_seen integer not null default 0,
  records_inserted integer not null default 0,
  records_duplicate integer not null default 0,
  records_rejected integer not null default 0,
  error_message text
);

create index if not exists lead_generator_fetch_log_source_time_idx
  on public.lead_generator_fetch_log(source_id, requested_at desc);

alter table public.lead_generator_fetch_log enable row level security;
revoke all on public.lead_generator_fetch_log from anon, authenticated;
grant all on public.lead_generator_fetch_log to service_role;

comment on column public.lead_generator_sources.feed_config is
  'Explicit JSON feed mapping: items_path and field-path map. Source must have documented permission and remain disabled until approved.';
comment on table public.lead_generator_fetch_log is
  'Service-only audit log for bounded collection worker requests; no public or authenticated access.';
