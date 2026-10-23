-- Admin RPC to soft-delete a user
-- Only executable by authenticated super-admins
-- Soft delete preserves data and audit trail while removing from active administration

create or replace function public.admin_delete_user(
  p_profile_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $function$
  declare
    v_old jsonb;
  begin
    -- Authorization: only super-admins may call this function
    if not public.is_super_admin() then
      raise exception 'Forbidden'
        using errcode = '42501';
    end if;

    -- Capture pre-delete state for audit log
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
      'is_active', is_active,
      'created_at', created_at,
      'updated_at', updated_at,
      'deleted_at', deleted_at
    ) into v_old
    from public.profiles
    where id = p_profile_id
      and deleted_at is null;

    if not found then
      raise exception 'User not found or already deleted'
        using errcode = 'P0001';
    end if;

    -- Soft delete: set deleted_at and updated_by
    -- updated_by is set to the authenticated caller's user ID (auth.uid())
    update public.profiles
    set
      deleted_at = now(),
      updated_at = now(),
      updated_by = auth.uid()
    where id = p_profile_id
      and deleted_at is null;

    -- Audit log the deletion
    perform public.admin_write_audit_log(
      'USERS',
      'DELETE',
      'profiles',
      p_profile_id,
      v_old,
      jsonb_build_object('deleted_at', now())
    );

    return true;
  end;
$function$;

revoke all on function public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_delete_user(uuid) to authenticated;

comment on function public.admin_delete_user(uuid) is
  'Soft-deletes a user for super-admin management. Requires super-admin role. Sets deleted_at timestamp and updated_by to authenticated caller. Preserves all data for audit trail. Writes audit log via admin_write_audit_log. Returns true on success.';