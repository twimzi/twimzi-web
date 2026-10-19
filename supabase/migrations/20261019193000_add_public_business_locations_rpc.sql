create or replace function public.get_public_business_locations()
returns table (
  business_id uuid,
  city text,
  state text
)
language sql
stable
security definer
set search_path = public
as $function$
  select distinct
    b.id as business_id,
    nullif(trim(br.city), '') as city,
    nullif(trim(br.state), '') as state
  from public.business_branches br
  join public.businesses b on b.id = br.business_id
  where br.is_active = true
    and br.deleted_at is null
    and nullif(trim(br.city), '') is not null
    and nullif(trim(br.state), '') is not null
    and b.is_active = true
    and b.deleted_at is null
    and b.business_status = 'approved'::public.business_status;
$function$;

revoke all on function public.get_public_business_locations() from public;
revoke all on function public.get_public_business_locations() from anon, authenticated;
grant execute on function public.get_public_business_locations() to anon, authenticated;

comment on function public.get_public_business_locations() is
  'Returns city/state only for active branches of approved, active, non-deleted public businesses.';
