-- Track how each contact entered the Contact Data Bank and sync self-registered users.
alter table public.admin_contact_bank
  add column if not exists source_type text not null default 'manual_contact_add',
  add column if not exists source_profile_id uuid references public.profiles(id) on delete set null;

alter table public.admin_contact_bank
  drop constraint if exists admin_contact_bank_source_type_check;
alter table public.admin_contact_bank
  add constraint admin_contact_bank_source_type_check
  check (source_type in ('manual_contact_add', 'lead_generator', 'user_self_register'));

create unique index if not exists admin_contact_bank_source_profile_uidx
  on public.admin_contact_bank(source_profile_id)
  where source_profile_id is not null;

create index if not exists admin_contact_bank_source_type_idx
  on public.admin_contact_bank(source_type);

create or replace function public.sync_profile_to_admin_contact_bank()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_contact_type text;
begin
  if new.deleted_at is not null or coalesce(new.is_active, true) is false then
    return new;
  end if;

  v_contact_type := case when coalesce(new.is_business, false) then 'business' else 'customer' end;

  update public.admin_contact_bank
  set full_name = coalesce(nullif(btrim(new.full_name), ''), full_name),
      email = coalesce(nullif(lower(btrim(new.email::text)), ''), email),
      phone = coalesce(nullif(btrim(new.phone), ''), phone),
      city = coalesce(nullif(btrim(new.city), ''), city),
      state = coalesce(nullif(btrim(new.state), ''), state),
      country = coalesce(nullif(btrim(new.country), ''), country),
      contact_type = v_contact_type,
      source = 'Twimzi account registration',
      source_type = 'user_self_register',
      source_profile_id = new.id,
      updated_at = now()
  where source_profile_id = new.id;

  if not found then
    update public.admin_contact_bank
    set source_type = 'user_self_register',
        source_profile_id = new.id,
        source = 'Twimzi account registration',
        updated_at = now()
    where source_profile_id is null
      and (
        (nullif(lower(btrim(new.email::text)), '') is not null and lower(email) = lower(btrim(new.email::text)))
        or
        (nullif(regexp_replace(coalesce(new.phone, ''), '\\D', '', 'g'), '') is not null
          and regexp_replace(coalesce(phone, ''), '\\D', '', 'g') = regexp_replace(new.phone, '\\D', '', 'g'))
      )
    returning id into strict v_contact_type;
  end if;

  if not found then
    insert into public.admin_contact_bank (
      full_name, email, phone, city, state, country, contact_type,
      source, source_type, source_profile_id, email_marketing_consent,
      whatsapp_marketing_consent, created_at, updated_at
    ) values (
      coalesce(nullif(btrim(new.full_name), ''), 'Twimzi user'),
      nullif(lower(btrim(new.email::text)), ''),
      nullif(btrim(new.phone), ''),
      nullif(btrim(new.city), ''),
      nullif(btrim(new.state), ''),
      coalesce(nullif(btrim(new.country), ''), 'India'),
      v_contact_type,
      'Twimzi account registration',
      'user_self_register',
      new.id,
      false,
      false,
      coalesce(new.created_at, now()),
      now()
    );
  end if;

  return new;
end;
$$;

drop trigger if exists sync_profile_to_admin_contact_bank on public.profiles;
create trigger sync_profile_to_admin_contact_bank
after insert or update of full_name, email, phone, city, state, country, is_business, is_active, deleted_at
on public.profiles
for each row execute function public.sync_profile_to_admin_contact_bank();

-- Backfill existing accounts. Existing matching contacts are linked rather than duplicated.
do $$
declare
  p record;
  v_contact_id uuid;
begin
  for p in
    select id, full_name, email::text as email, phone, city, state, country,
           is_business, is_active, deleted_at, created_at
    from public.profiles
    where deleted_at is null and coalesce(is_active, true) = true
    order by created_at asc
  loop
    select id into v_contact_id
    from public.admin_contact_bank
    where source_profile_id = p.id
       or (source_profile_id is null and (
         (nullif(lower(btrim(p.email)), '') is not null and lower(email) = lower(btrim(p.email)))
         or
         (nullif(regexp_replace(coalesce(p.phone, ''), '\\D', '', 'g'), '') is not null
           and regexp_replace(coalesce(phone, ''), '\\D', '', 'g') = regexp_replace(p.phone, '\\D', '', 'g'))
       ))
    order by (source_profile_id = p.id) desc nulls last, created_at asc
    limit 1;

    if v_contact_id is not null then
      update public.admin_contact_bank
      set source_type = 'user_self_register',
          source_profile_id = p.id,
          source = 'Twimzi account registration',
          full_name = coalesce(nullif(btrim(p.full_name), ''), full_name),
          email = coalesce(nullif(lower(btrim(p.email)), ''), email),
          phone = coalesce(nullif(btrim(p.phone), ''), phone),
          city = coalesce(nullif(btrim(p.city), ''), city),
          state = coalesce(nullif(btrim(p.state), ''), state),
          country = coalesce(nullif(btrim(p.country), ''), country),
          contact_type = case when coalesce(p.is_business, false) then 'business' else 'customer' end,
          updated_at = now()
      where id = v_contact_id;
    else
      insert into public.admin_contact_bank (
        full_name, email, phone, city, state, country, contact_type,
        source, source_type, source_profile_id, email_marketing_consent,
        whatsapp_marketing_consent, created_at, updated_at
      ) values (
        coalesce(nullif(btrim(p.full_name), ''), 'Twimzi user'),
        nullif(lower(btrim(p.email)), ''),
        nullif(btrim(p.phone), ''),
        nullif(btrim(p.city), ''),
        nullif(btrim(p.state), ''),
        coalesce(nullif(btrim(p.country), ''), 'India'),
        case when coalesce(p.is_business, false) then 'business' else 'customer' end,
        'Twimzi account registration',
        'user_self_register',
        p.id,
        false,
        false,
        coalesce(p.created_at, now()),
        now()
      );
    end if;
  end loop;
end;
$$;
