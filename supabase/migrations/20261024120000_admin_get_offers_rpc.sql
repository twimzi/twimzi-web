-- Admin RPC to retrieve offers with search, status filter, and pagination
-- Only executable by authenticated super-admins
-- NOTE: This matches the live production function signature exactly (22 columns).
-- The live function does NOT return coupon_code or is_active.
-- If those columns are needed, a separate, reviewed migration is required.

create or replace function public.admin_get_offers(
  p_search text default null,
  p_status text default null,
  p_limit int default 25,
  p_offset int default 0
)
returns table (
  id uuid,
  business_id uuid,
  business_name text,
  title text,
  slug text,
  short_description text,
  offer_type text,
  discount_type text,
  discount_value numeric,
  minimum_order_amount numeric,
  maximum_discount_amount numeric,
  redemption_limit integer,
  redemption_count integer,
  per_user_limit integer,
  start_at timestamptz,
  end_at timestamptz,
  visibility text,
  status text,
  priority integer,
  is_featured boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $function$
BEGIN
  -- Authorization: only super-admins may call this function
  if not public.is_super_admin() then
    raise exception 'Insufficient privilege: super-admin required'
      using errcode = '42501';
  end if;

  -- Validate pagination bounds
  if p_limit < 1 or p_limit > 100 then
    raise exception 'Invalid limit: must be between 1 and 100'
      using errcode = '22023';
  end if;
  if p_offset < 0 then
    raise exception 'Invalid offset: must be non-negative'
      using errcode = '22023';
  end if;

  RETURN QUERY
  select
    o.id,
    o.business_id,
    b.business_name::text,
    o.title::text,
    o.slug::text,
    o.short_description::text,
    o.offer_type::text,
    o.discount_type::text,
    o.discount_value,
    o.minimum_order_amount,
    o.maximum_discount_amount,
    o.redemption_limit,
    o.redemption_count,
    o.per_user_limit,
    o.start_at,
    o.end_at,
    o.visibility::text,
    o.status::text,
    o.priority,
    o.is_featured,
    o.created_at,
    o.updated_at
  from public.offers o
  inner join public.businesses b on b.id = o.business_id
  where public.is_super_admin()
    and o.deleted_at is null
    and b.deleted_at is null
    and (p_status is null or btrim(p_status) = '' or o.status::text = btrim(p_status))
    and (p_search is null or btrim(p_search) = ''
         or o.title ilike '%' || btrim(p_search) || '%'
         or o.slug ilike '%' || btrim(p_search) || '%'
         or o.short_description ilike '%' || btrim(p_search) || '%'
         or b.business_name ilike '%' || btrim(p_search) || '%')
  order by o.created_at desc
  limit GREATEST(1, LEAST(p_limit, 100))
  offset GREATEST(p_offset, 0);
END;
$function$;

revoke all on function public.admin_get_offers(text, text, int, int) from public, anon;
grant execute on function public.admin_get_offers(text, text, int, int) to authenticated;

comment on function public.admin_get_offers(text, text, int, int) is
  'Returns offers for super-admin management. Requires super-admin role. Supports search, status filter, and pagination. Validates limit (1-100) and offset (>=0). Returns 22 columns (excludes coupon_code and is_active per live contract).';