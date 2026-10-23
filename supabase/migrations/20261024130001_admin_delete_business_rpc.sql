-- Admin RPC to soft-delete a business
-- Only executable by authenticated super-admins
-- Soft delete preserves data and audit trail while removing from active administration

create or replace function public.admin_delete_business(
  p_business_id uuid
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
      'business_code', business_code,
      'business_name', business_name,
      'legal_name', legal_name,
      'slug', slug,
      'public_handle', public_handle,
      'description', description,
      'business_type', business_type,
      'email', email,
      'phone', phone,
      'whatsapp_number', whatsapp_number,
      'website', website,
      'established_year', established_year,
      'gst_number', gst_number,
      'pan_number', pan_number,
      'business_status', business_status,
      'verification_status', verification_status,
      'is_active', is_active,
      'is_featured', is_featured,
      'featured_until', featured_until,
      'boost_until', boost_until,
      'priority_score', priority_score,
      'profile_completion', profile_completion,
      'qr_scan_count', qr_scan_count,
      'business_card_download_count', business_card_download_count,
      'logo_media_id', logo_media_id,
      'cover_media_id', cover_media_id,
      'owner_profile_id', owner_profile_id,
      'created_at', created_at,
      'updated_at', updated_at,
      'deleted_at', deleted_at
    ) into v_old
    from public.businesses
    where id = p_business_id
      and deleted_at is null;

    if not found then
      raise exception 'Business not found or already deleted'
        using errcode = 'P0001';
    end if;

    -- Soft delete: set deleted_at and updated_by
    -- updated_by is set to the authenticated caller's user ID (auth.uid())
    update public.businesses
    set
      deleted_at = now(),
      updated_at = now(),
      updated_by = auth.uid()
    where id = p_business_id
      and deleted_at is null;

    -- Audit log the deletion
    perform public.admin_write_audit_log(
      'BUSINESSES',
      'DELETE',
      'businesses',
      p_business_id,
      v_old,
      jsonb_build_object('deleted_at', now())
    );

    return true;
  end;
$function$;

revoke all on function public.admin_delete_business(uuid) from public, anon;
grant execute on function public.admin_delete_business(uuid) to authenticated;

comment on function public.admin_delete_business(uuid) is
  'Soft-deletes a business for super-admin management. Requires super-admin role. Sets deleted_at timestamp and updated_by to authenticated caller. Preserves all data for audit trail. Writes audit log via admin_write_audit_log. Returns true on success.';