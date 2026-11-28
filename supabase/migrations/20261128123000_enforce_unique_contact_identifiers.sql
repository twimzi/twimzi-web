begin;

alter table public.admin_contact_bank
  add column if not exists duplicate_email_value text,
  add column if not exists duplicate_email_of uuid references public.admin_contact_bank(id) on delete set null,
  add column if not exists duplicate_phone_value text,
  add column if not exists duplicate_phone_of uuid references public.admin_contact_bank(id) on delete set null;

create or replace function public.normalize_admin_contact_phone(p_phone text)
returns text language sql immutable parallel safe set search_path = pg_catalog as $
  with digits as (select regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g') as value)
  select case when value = '' then null
    when length(value) = 12 and left(value, 2) = '91' then right(value, 10)
    when length(value) = 11 and left(value, 1) = '0' then right(value, 10)
    else value end from digits;
$$;

with normalized as (
  select id, nullif(lower(btrim(email)), '') email_key,
         public.normalize_admin_contact_phone(phone) phone_key, archived_at, created_at
  from public.admin_contact_bank
),
ranked as (
  select id,
    case when email_key is not null then row_number() over(partition by email_key order by (archived_at is not null), created_at, id) else 1 end email_rank,
    case when email_key is not null then first_value(id) over(partition by email_key order by (archived_at is not null), created_at, id) end email_keeper,
    case when phone_key is not null then row_number() over(partition by phone_key order by (archived_at is not null), created_at, id) else 1 end phone_rank,
    case when phone_key is not null then first_value(id) over(partition by phone_key order by (archived_at is not null), created_at, id) end phone_keeper
  from normalized
)
update public.admin_contact_bank c
set duplicate_email_value = case when r.email_rank > 1 then c.email else c.duplicate_email_value end,
    duplicate_email_of = case when r.email_rank > 1 then r.email_keeper else c.duplicate_email_of end,
    email = case when r.email_rank > 1 then null else c.email end,
    duplicate_phone_value = case when r.phone_rank > 1 then c.phone else c.duplicate_phone_value end,
    duplicate_phone_of = case when r.phone_rank > 1 then r.phone_keeper else c.duplicate_phone_of end,
    phone = case when r.phone_rank > 1 then null else c.phone end,
    email_marketing_consent = case when r.email_rank > 1 then false else c.email_marketing_consent end,
    email_consent_at = case when r.email_rank > 1 then null else c.email_consent_at end,
    whatsapp_marketing_consent = case when r.phone_rank > 1 then false else c.whatsapp_marketing_consent end,
    whatsapp_consent_at = case when r.phone_rank > 1 then null else c.whatsapp_consent_at end,
    archived_at = case when c.source_type = 'lead_generator'
      and (case when r.email_rank > 1 then null else c.email end) is null
      and (case when r.phone_rank > 1 then null else c.phone end) is null
      then coalesce(c.archived_at, now()) else c.archived_at end,
    updated_at = now()
from ranked r where c.id = r.id and (r.email_rank > 1 or r.phone_rank > 1);

create unique index if not exists admin_contact_bank_email_unique_uidx
  on public.admin_contact_bank (lower(btrim(email)))
  where nullif(btrim(email), '') is not null;
create unique index if not exists admin_contact_bank_phone_unique_uidx
  on public.admin_contact_bank (public.normalize_admin_contact_phone(phone))
  where public.normalize_admin_contact_phone(phone) is not null;

create or replace function public.sync_profile_to_admin_contact_bank()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  v_contact_id uuid;
  v_existing_profile_id uuid;
  v_contact_type text;
  v_email text;
  v_phone text;
begin
  if new.deleted_at is not null or coalesce(new.is_active, true) is false then return new; end if;
  v_contact_type := case when coalesce(new.is_business, false) then 'business' else 'customer' end;
  v_email := nullif(lower(btrim(new.email::text)), '');
  v_phone := nullif(btrim(new.phone), '');

  update public.admin_contact_bank c
  set full_name = coalesce(nullif(btrim(new.full_name), ''), c.full_name),
      email = case when v_email is null then c.email
        when not exists (select 1 from public.admin_contact_bank other where other.id <> c.id and lower(btrim(other.email)) = v_email) then v_email else c.email end,
      phone = case when v_phone is null then c.phone
        when not exists (select 1 from public.admin_contact_bank other where other.id <> c.id and public.normalize_admin_contact_phone(other.phone) = public.normalize_admin_contact_phone(v_phone)) then v_phone else c.phone end,
      city = coalesce(nullif(btrim(new.city), ''), c.city),
      state = coalesce(nullif(btrim(new.state), ''), c.state),
      country = coalesce(nullif(btrim(new.country), ''), c.country),
      contact_type = v_contact_type, source = 'Twimzi account registration',
      source_type = 'user_self_register', updated_at = now()
  where c.source_profile_id = new.id returning c.id into v_contact_id;
  if v_contact_id is not null then return new; end if;

  select c.id, c.source_profile_id into v_contact_id, v_existing_profile_id
  from public.admin_contact_bank c
  where (v_email is not null and lower(btrim(c.email)) = v_email)
     or (v_phone is not null and public.normalize_admin_contact_phone(c.phone) = public.normalize_admin_contact_phone(v_phone))
  order by case when v_email is not null and lower(btrim(c.email)) = v_email then 0 else 1 end,
           (c.source_profile_id is null) desc, c.created_at asc limit 1;

  if v_contact_id is not null then
    if v_existing_profile_id is null then
      update public.admin_contact_bank c
      set source_type = 'user_self_register', source_profile_id = new.id,
          source = 'Twimzi account registration',
          full_name = coalesce(nullif(btrim(new.full_name), ''), c.full_name),
          email = case when v_email is null then c.email
            when not exists (select 1 from public.admin_contact_bank other where other.id <> c.id and lower(btrim(other.email)) = v_email) then v_email else c.email end,
          phone = case when v_phone is null then c.phone
            when not exists (select 1 from public.admin_contact_bank other where other.id <> c.id and public.normalize_admin_contact_phone(other.phone) = public.normalize_admin_contact_phone(v_phone)) then v_phone else c.phone end,
          city = coalesce(nullif(btrim(new.city), ''), c.city),
          state = coalesce(nullif(btrim(new.state), ''), c.state),
          country = coalesce(nullif(btrim(new.country), ''), c.country),
          contact_type = v_contact_type, updated_at = now()
      where c.id = v_contact_id and c.source_profile_id is null;
    end if;
    return new;
  end if;

  insert into public.admin_contact_bank (
    full_name, email, phone, city, state, country, contact_type, source,
    source_type, source_profile_id, email_marketing_consent,
    whatsapp_marketing_consent, created_at, updated_at
  ) values (
    coalesce(nullif(btrim(new.full_name), ''), 'Twimzi user'), v_email, v_phone,
    nullif(btrim(new.city), ''), nullif(btrim(new.state), ''),
    coalesce(nullif(btrim(new.country), ''), 'India'), v_contact_type,
    'Twimzi account registration', 'user_self_register', new.id, false, false,
    coalesce(new.created_at, now()), now()
  ) on conflict do nothing;
  return new;
end;
$$;

commit;