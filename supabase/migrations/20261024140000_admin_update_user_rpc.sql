-- Admin RPC to update user profile details
-- Only executable by authenticated super-admins
-- Provides full edit capability for user fields while preserving audit trail

create or replace function public.admin_update_user(
  p_profile_id uuid,
  p_full_name text default null,
  p_username text default null,
  p_email text default null,
  p_phone text default null,
  p_city text default null,
  p_state text default null,
  p_country text default null,
  p_is_business boolean default null,
  p_is_verified boolean default null,
  p_account_status text default null,
  p_is_active boolean default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $function$
  declare
    v_old jsonb;
    v_new jsonb;
  begin
    -- Authorization: only super-admins may call this function
    if not public.is_super_admin() then
      raise exception 'Forbidden'
        using errcode = '42501';
    end if;

    -- Capture pre-update state for audit log
    select jsonb_build_object(
      'full_name', full_name,
      'username', username,
      'email', email,
      'phone', phone,
      'city', city,
      'state', state,
      'country', country,
      'is_business', is_business,
      'is_verified', is_verified,
      'account_status', account_status,
      'is_active', is_active
    ) into v_old
    from public.profiles
    where id = p_profile_id
      and deleted_at is null;

    if not found then
      raise exception 'User not found'
        using errcode = 'P0001';
    end if;

    -- Validate account_status if provided
    if p_account_status is not null and p_account_status not in ('active', 'suspended', 'blocked') then
      raise exception 'Invalid account status: must be active, suspended, or blocked'
        using errcode = '22023';
    end if;

    -- Validate username uniqueness if provided and changed
    if p_username is not null then
      if exists (
        select 1 from public.profiles
        where username = p_username
          and id != p_profile_id
          and deleted_at is null
      ) then
        raise exception 'Username already taken'
          using errcode = '23505';
      end if;
    end if;

    -- Validate email uniqueness if provided and changed
    if p_email is not null then
      if exists (
        select 1 from public.profiles
        where email = p_email
          and id != p_profile_id
          and deleted_at is null
      ) then
        raise exception 'Email already registered'
          using errcode = '23505';
      end if;
    end if;

    -- Update user profile (only non-null params are updated)
    -- updated_by is set to the authenticated caller's user ID (auth.uid())
    update public.profiles
    set
      full_name = coalesce(p_full_name, full_name),
      username = coalesce(p_username, username),
      email = coalesce(p_email, email),
      phone = coalesce(p_phone, phone),
      city = coalesce(p_city, city),
      state = coalesce(p_state, state),
      country = coalesce(p_country, country),
      is_business = coalesce(p_is_business, is_business),
      is_verified = coalesce(p_is_verified, is_verified),
      account_status = coalesce(p_account_status, account_status),
      is_active = coalesce(p_is_active, is_active),
      updated_at = now(),
      updated_by = auth.uid()
    where id = p_profile_id
      and deleted_at is null;

    -- Capture post-update state for audit log
    select jsonb_build_object(
      'full_name', full_name,
      'username', username,
      'email', email,
      'phone', phone,
      'city', city,
      'state', state,
      'country', country,
      'is_business', is_business,
      'is_verified', is_verified,
      'account_status', account_status,
      'is_active', is_active
    ) into v_new
    from public.profiles
    where id = p_profile_id;

    -- Audit log the update
    perform public.admin_write_audit_log(
      'USERS',
      'UPDATE',
      'profiles',
      p_profile_id,
      v_old,
      v_new
    );

    return true;
  end;
$function$;

revoke all on function public.admin_update_user(
  uuid, text, text, text, text, text, text, text, boolean, boolean, text, boolean
) from public, anon;
grant execute on function public.admin_update_user(
  uuid, text, text, text, text, text, text, text, boolean, boolean, text, boolean
) to authenticated;

comment on function public.admin_update_user(
  uuid, text, text, text, text, text, text, text, boolean, boolean, text, boolean
) is
  'Updates user profile details for super-admin management. Requires super-admin role. Validates account_status, username, and email uniqueness. Only non-null parameters are updated. updated_by is automatically set to the authenticated caller via auth.uid(). Writes audit log via admin_write_audit_log. Returns true on success.';