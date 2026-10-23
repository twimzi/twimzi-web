-- Admin RPC to toggle user business flag
-- Only executable by authenticated super-admins
-- Provides business/customer toggle with audit trail

create or replace function public.admin_set_user_business(
  p_profile_id uuid,
  p_is_business boolean
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
      'is_business', is_business
    ) into v_old
    from public.profiles
    where id = p_profile_id
      and deleted_at is null;

    if not found then
      raise exception 'User not found'
        using errcode = 'P0001';
    end if;

    -- Update business flag
    update public.profiles
    set
      is_business = p_is_business,
      updated_at = now(),
      updated_by = auth.uid()
    where id = p_profile_id
      and deleted_at is null;

    -- Capture post-update state for audit log
    select jsonb_build_object(
      'is_business', is_business
    ) into v_new
    from public.profiles
    where id = p_profile_id;

    -- Audit log the business flag change
    perform public.admin_write_audit_log(
      'USERS',
      'SET_BUSINESS',
      'profiles',
      p_profile_id,
      v_old,
      v_new
    );

    return true;
  end;
$function$;

revoke all on function public.admin_set_user_business(uuid, boolean) from public, anon;
grant execute on function public.admin_set_user_business(uuid, boolean) to authenticated;

comment on function public.admin_set_user_verified(uuid, boolean) is
  'Updates user business flag for super-admin management. Requires super-admin role. Writes audit log via admin_write_audit_log. Returns true on success.';