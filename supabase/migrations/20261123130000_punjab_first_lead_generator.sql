-- Punjab-first lead generator foundation. No source is enabled by default.
alter table public.admin_contact_bank
  add column if not exists professional_contact_name text,
  add column if not exists professional_contact_designation text,
  add column if not exists source_url text,
  add column if not exists source_collected_at timestamptz,
  add column if not exists source_last_checked_at timestamptz,
  add column if not exists email_kind text not null default 'unknown',
  add column if not exists review_status text not null default 'pending',
  add column if not exists verification_status text not null default 'unverified',
  add column if not exists collection_basis text,
  add column if not exists do_not_contact boolean not null default false;

alter table public.admin_contact_bank
  drop constraint if exists admin_contact_bank_email_kind_check;
alter table public.admin_contact_bank
  add constraint admin_contact_bank_email_kind_check
  check (email_kind in ('business','professional_work','personal_public','unknown'));
alter table public.admin_contact_bank
  drop constraint if exists admin_contact_bank_review_status_check;
alter table public.admin_contact_bank
  add constraint admin_contact_bank_review_status_check
  check (review_status in ('pending','approved','rejected'));
alter table public.admin_contact_bank
  drop constraint if exists admin_contact_bank_verification_status_check;
alter table public.admin_contact_bank
  add constraint admin_contact_bank_verification_status_check
  check (verification_status in ('unverified','verified','failed'));

create index if not exists admin_contact_bank_review_status_idx
  on public.admin_contact_bank(review_status, created_at desc);
create index if not exists admin_contact_bank_source_url_idx
  on public.admin_contact_bank(source_url);

create table if not exists public.lead_generator_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_url text not null,
  source_type text not null check (source_type in ('government_open_data','trade_association','exhibitor_directory','business_website','licensed_directory','user_provided')),
  terms_url text,
  permission_status text not null default 'pending_review' check (permission_status in ('pending_review','approved','rejected','suspended')),
  permitted_fields text[] not null default array['business_name','category','business_email','business_phone','website','address','city','district','state','professional_contact_name','professional_designation','professional_work_email']::text[],
  allowed_states text[] not null default array['Punjab']::text[],
  allowed_categories text[] not null default array[]::text[],
  crawl_interval_hours integer not null default 168 check (crawl_interval_hours between 24 and 8760),
  max_requests_per_hour integer not null default 30 check (max_requests_per_hour between 1 and 300),
  last_checked_at timestamptz,
  last_status text,
  enabled boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(source_url)
);

create table if not exists public.lead_generator_jobs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.lead_generator_sources(id) on delete set null,
  region_state text not null default 'Punjab',
  districts text[] not null default array[]::text[],
  categories text[] not null default array[]::text[],
  status text not null default 'queued' check (status in ('queued','running','paused','completed','failed','cancelled')),
  collection_mode text not null default 'balanced' check (collection_mode = 'balanced'),
  daily_target integer,
  processed_count integer not null default 0,
  inserted_count integer not null default 0,
  duplicate_count integer not null default 0,
  rejected_count integer not null default 0,
  last_error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.lead_generator_sources enable row level security;
alter table public.lead_generator_jobs enable row level security;

drop policy if exists "Super admins manage lead generator sources" on public.lead_generator_sources;
create policy "Super admins manage lead generator sources"
on public.lead_generator_sources for all to authenticated
using ((select public.is_super_admin()) = true)
with check ((select public.is_super_admin()) = true);

drop policy if exists "Super admins manage lead generator jobs" on public.lead_generator_jobs;
create policy "Super admins manage lead generator jobs"
on public.lead_generator_jobs for all to authenticated
using ((select public.is_super_admin()) = true)
with check ((select public.is_super_admin()) = true);

grant select, insert, update, delete on public.lead_generator_sources to authenticated;
grant select, insert, update, delete on public.lead_generator_jobs to authenticated;

comment on table public.lead_generator_sources is 'Only sources with documented permission/terms approval may be enabled for collection.';
comment on table public.lead_generator_jobs is 'Queue of bounded, auditable discovery jobs; no unlimited or evasive crawling.';
comment on column public.admin_contact_bank.email_kind is 'Separates company/work email from publicly displayed personal email; public visibility alone is not marketing consent.';
comment on column public.admin_contact_bank.review_status is 'Lead review status; approval never grants marketing consent.';
