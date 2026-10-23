-- Admin RPC to update offer state (status, is_featured, optionally is_active)
-- Only executable by authenticated super-admins
-- NOTE: This matches the live production function signature for status/is_featured.
-- The p_is_active parameter is made optional (DEFAULT NULL) so callers that cannot
-- determine the true is_active value (because admin_get_offers does not return it)
-- can omit it. When omitted, the existing is_active value is preserved.
-- The live function calls: public.admin_write_audit_log('OFFERS','UPDATE_STATE','offers',p_offer_id,v_old,v_new)
-- where v_old/v_new are jsonb_build_object with status, is_active, is_featured only.

create or replace function public.admin_set_offer_state(
  p_offer_id uuid,
  p_status text,
  p_is_featured boolean,
  p_is_active boolean DEFAULT NULL
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

    -- Validate status against supported values
    if p_status not in ('active', 'draft', 'paused', 'expired') then
      raise exception 'Invalid offer status'
        using errcode = '22023';
    end if;

    -- Capture pre-update state for audit log (v_old) - only the fields that change
    select jsonb_build_object(
      'status', status,
      'is_active', is_active,
      'is_featured', is_featured
    ) into v_old
    from public.offers
    where id = p_offer_id
      and deleted_at is null;

    if not found then
      raise exception 'Offer not found'
        using errcode = 'P0001';
    end if;

    -- Update only non-deleted offers
    -- updated_by is set to the authenticated caller's user ID (auth.uid())
    -- This cannot be spoofed because the function is SECURITY DEFINER
    -- If p_is_active is NULL (not provided), preserve the existing is_active value
    update public.offers
    set
      status = p_status,
      is_active = COALESCE(p_is_active, is_active),
      is_featured = COALESCE(p_is_featured, false),
      updated_at = now(),
      updated_by = auth.uid()
    where id = p_offer_id
      and deleted_at is null;

    -- Capture post-update state for audit log (v_new)
    select jsonb_build_object(
      'status', status,
      'is_active', is_active,
      'is_featured', is_featured
    ) into v_new
    from public.offers
    where id = p_offer_id;

    -- Audit log the state change (matches verified live production function signature)
    -- admin_write_audit_log(p_module_name, p_action_name, p_entity_name, p_entity_id, p_old_data, p_new_data)
    perform public.admin_write_audit_log(
      'OFFERS',
      'UPDATE_STATE',
      'offers',
      p_offer_id,
      v_old,
      v_new
    );

    return true;
  end;
$function$;

revoke all on function public.admin_set_offer_state(uuid, text, boolean, boolean) from public, anon;
grant execute on function public.admin_set_offer_state(uuid, text, boolean, boolean) to authenticated;

comment on function public.admin_set_offer_state(uuid, text, boolean, boolean) is
  'Updates offer state for super-admin management. Requires super-admin role. Validates status and targets only non-deleted offers. updated_by is automatically set to the authenticated caller via auth.uid(). Writes audit log via admin_write_audit_log with verified live signature. p_is_active is optional (defaults to current value) to avoid inferring from status. Returns true on success.';