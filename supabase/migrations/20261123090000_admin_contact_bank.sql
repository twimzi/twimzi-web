create table if not exists public.admin_contact_bank (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(btrim(full_name)) between 1 and 160),
  company_name text, email text, phone text, city text, state text, country text default 'India',
  contact_type text not null default 'other' check (contact_type in ('business','manufacturer','trader','professional','supplier','customer','partner','other')),
  source text, tags text[] not null default '{}', notes text,
  email_marketing_consent boolean not null default false, email_consent_at timestamptz,
  whatsapp_marketing_consent boolean not null default false, whatsapp_consent_at timestamptz,
  email_unsubscribed_at timestamptz, whatsapp_opted_out_at timestamptz, last_contacted_at timestamptz,
  archived_at timestamptz, created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint admin_contact_bank_email_format check (email is null or email = '' or email ~* '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$')
);
create index if not exists admin_contact_bank_name_idx on public.admin_contact_bank (lower(full_name));
create index if not exists admin_contact_bank_email_idx on public.admin_contact_bank (lower(email)) where email is not null;
create index if not exists admin_contact_bank_phone_idx on public.admin_contact_bank (phone) where phone is not null;
create index if not exists admin_contact_bank_tags_idx on public.admin_contact_bank using gin(tags);
alter table public.admin_contact_bank enable row level security;
drop policy if exists "Super admins manage contact bank" on public.admin_contact_bank;
create policy "Super admins manage contact bank" on public.admin_contact_bank for all to authenticated using ((select public.is_super_admin()) is true) with check ((select public.is_super_admin()) is true);
grant select, insert, update, delete on public.admin_contact_bank to authenticated;
