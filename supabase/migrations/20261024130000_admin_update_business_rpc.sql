-- Admin RPC to update business details
-- Only executable by authenticated super-admins
-- Provides full edit capability for business fields while preserving audit trail

create or replace function public.admin_update_business(
  p_business_id uuid,
  p_business_code text default null,
  p_business_name text default null,
  p_legal_name text default null,
  p_slug text default null,
  p_public_handle text default null,
  p_description text default null,
  p_business_type text default null,
  p_email text default null,
  p_phone text default null,
  p_whatsapp_number text default null,
  p_website text default null,
  p_established_year int default null,
  p_gst_number text default null,
  p_pan_number text default null,
  p_business_status text default null,
  p_verification_status text default null,
  p_is_active boolean default null,
  p_is_featured boolean default null,
  p_featured_until timestamptz default null,
  p_priority_score int default null
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
      'priority_score', priority_score
    ) into v_old
    from public.businesses
    where id = p_business_id
      and deleted_at is null;

    if not found then
      raise exception 'Business not found'
        using errcode = 'P0001';
    end if;

    -- Validate business_status if provided
    if p_business_status is not null and p_business_status not in ('draft', 'pending', 'approved', 'rejected', 'suspended') then
      raise exception 'Invalid business status'
        using errcode = '22023';
    end if;

    -- Validate verification_status if provided
    if p_verification_status is not null and p_verification_status not in ('unverified', 'pending', 'verified', 'rejected') then
      raise exception 'Invalid verification status'
        using errcode = '22023';
    end if;

    -- Validate established_year if provided
    if p_established_year is not null and (p_established_year < 1800 or p_established_year > extract(year from now()) + 1) then
      raise exception 'Invalid established year'
        using errcode = '22023';
    end if;

    -- Validate priority_score if provided
    if p_priority_score is not null and p_priority_score < 0 then
      raise exception 'Invalid priority score: must be non-negative'
        using errcode = '22023';
    end if;

    -- Update business (only non-null params are updated)
    -- updated_by is set to the authenticated caller's user ID (auth.uid())
    update public.businesses
    set
      business_code = coalesce(p_business_code, business_code),
      business_name = coalesce(p_business_name, business_name),
      legal_name = coalesce(p_legal_name, legal_name),
      slug = coalesce(p_slug, slug),
      public_handle = coalesce(p_public_handle, public_handle),
      description = coalesce(p_description, description),
      business_type = coalesce(p_business_type, business_type),
      email = coalesce(p_email, email),
      phone = coalesce(p_phone, phone),
      whatsapp_number = coalesce(p_whatsapp_number, whatsapp_number),
      website = coalesce(p_website, website),
      established_year = coalesce(p_established_year, established_year),
      gst_number = coalesce(p_gst_number, gst_number),
      pan_number = coalesce(p_pan_number, pan_number),
      business_status = coalesce(p_business_status, business_status),
      verification_status = coalesce(p_verification_status, verification_status),
      is_active = coalesce(p_is_active, is_active),
      is_featured = coalesce(p_is_featured, is_featured),
      featured_until = coalesce(p_featured_until, featured_until),
      priority_score = coalesce(p_priority_score, priority_score),
      updated_at = now(),
      updated_by = auth.uid()
    where id = p_business_id
      and deleted_at is null;

    -- Capture post-update state for audit log
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
      'priority_score', priority_score
    ) into v_new
    from public.businesses
    where id = p_business_id;

    -- Audit log the update
    perform public.admin_write_audit_log(
      'BUSINESSES',
      'UPDATE',
      'businesses',
      p_business_id,
      v_old,
      v_new
    );

    return true;
  end;
$function$;

revoke all on function public.admin_update_business(
  uuid, text, text, text, text, text, text, text, text, text, text, text,
  int, text, text, text, text, boolean, boolean, timestamptz, int
) from public, anon;
grant execute on function public.admin_update_business(
  uuid, text, text, text, text, text, text, text, text, text, text, text,
  int, text, text, text, text, boolean, boolean, timestamptz, int
) to authenticated;

comment on function public.admin_update_business(
  uuid, text, text, text, text, text, text, text, text, text, text, text,
  int, text, text, text, text, boolean, boolean, timestamptz, int
) is
  'Updates business details for super-admin management. Requires super-admin role. Validates status, verification_status, established_year, and priority_score. Only non-null parameters are updated. updated_by is automatically set to the authenticated caller via auth.uid(). Writes audit log via admin_write_audit_log. Returns true on success.';