-- Return every field required by the Super Admin Edit Business form.
-- PostgreSQL cannot change a function's TABLE return type with CREATE OR REPLACE,
-- so drop the previous signature before creating the expanded result.
drop function if exists public.get_admin_businesses(text, text, integer, integer);

create function public.get_admin_businesses(
  p_search text default null,
  p_status text default null,
  p_limit integer default 100,
  p_offset integer default 0
)
returns table (
  id uuid,
  business_name text,
  business_code varchar,
  legal_name text,
  slug text,
  public_handle text,
  description text,
  business_type text,
  email text,
  phone text,
  whatsapp_number text,
  website text,
  established_year integer,
  gst_number text,
  pan_number text,
  business_status text,
  verification_status text,
  is_active boolean,
  is_featured boolean,
  featured_until timestamptz,
  priority_score numeric,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if not public.is_super_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select
    b.id,
    b.business_name::text,
    b.business_code,
    b.legal_name,
    b.slug,
    b.public_handle,
    b.description,
    b.business_type::text,
    b.email,
    b.phone,
    b.whatsapp_number,
    b.website,
    b.established_year,
    b.gst_number,
    b.pan_number,
    b.business_status::text,
    b.verification_status::text,
    b.is_active,
    b.is_featured,
    b.featured_until,
    b.priority_score::numeric,
    b.created_at
  from public.businesses b
  where b.deleted_at is null
    and (
      nullif(pg_catalog.trim(p_search), '') is null
      or b.business_name ilike '%' || pg_catalog.trim(p_search) || '%'
      or coalesce(b.business_code, '') ilike '%' || pg_catalog.trim(p_search) || '%'
      or coalesce(b.slug, '') ilike '%' || pg_catalog.trim(p_search) || '%'
      or coalesce(b.public_handle, '') ilike '%' || pg_catalog.trim(p_search) || '%'
    )
    and (
      nullif(pg_catalog.trim(p_status), '') is null
      or (
        pg_catalog.trim(p_status) = 'pending'
        and b.business_status::text in ('draft', 'pending')
      )
      or (
        pg_catalog.trim(p_status) <> 'pending'
        and b.business_status::text = pg_catalog.trim(p_status)
      )
    )
  order by b.created_at desc
  limit least(greatest(coalesce(p_limit, 100), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$function$;

revoke all on function public.get_admin_businesses(text, text, integer, integer) from public, anon;
grant execute on function public.get_admin_businesses(text, text, integer, integer) to authenticated;
