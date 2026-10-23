-- Admin RPC to update user account status (active, suspended, blocked)
-- Only executable by authenticated super-admins
-- Provides granular status control with audit trail

create or replace function public.admin_set_user_status(
  p_profile_id uuid,
  p_account_status text,
  p_reason text default null
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

    -- Validate account_status
    if p_account_status not in ('active', 'suspended', 'blocked') then
      raise exception 'Invalid account status: must be active, suspended, or blocked'
        using errcode = '22023';
    end if;

    -- Capture pre-update state for audit log
    select jsonb_build_object(
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

    -- Determine is_active based on account_status
    -- suspended and blocked users are not active
    declare
      v_is_active boolean := (p_account_status = 'active');
    begin
      -- Update user status
      update public.profiles
      set
        account_status = p_account_status,
        is_active = v_is_active,
        updated_at = now(),
        updated_by = auth.uid()
      where id = p_profile_id
        and deleted_at is null;
    end;

    -- Capture post-update state for audit log
    select jsonb_build_object(
      'account_status', account_status,
      'is_active', is_active
    ) into v_new
    from public.profiles
    where id = p_profile_id;

    -- Audit log the status change with reason
    perform public.admin_write_audit_log(
      'USERS',
      'SET_STATUS',
      'profiles',
      p_profile_id,
      v_old,
      v_new || jsonb_build_object('reason', p_reason)
    );

    return true;
  end;
$function$;

revoke all on function public.admin_set_user_status(uuid, text, text) from public, anon;
grant execute on function public.admin_set_user_status(uuid, text, text) to authenticated;

comment on function public.admin_set_user_status(uuid, text, text) is
  'Updates user account status (active, suspended, blocked) for super-admin management. Requires super-admin role. Automatically sets is_active based on status. Accepts optional reason for audit trail. Writes audit log via admin_write_audit_log. Returns true on success.';