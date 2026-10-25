create or replace function public.set_my_business_head_office_gps(
  p_business_id uuid,
  p_latitude double precision,
  p_longitude double precision
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_user_id uuid := auth.uid();
  v_branch_id uuid;
begin
  if v_user_id is null then
    raise exception 'Please sign in to update your business location.';
  end if;
  if p_latitude is null or p_longitude is null
     or p_latitude < -90 or p_latitude > 90
     or p_longitude < -180 or p_longitude > 180 then
    raise exception 'Valid GPS coordinates are required.';
  end if;
  if not exists (
    select 1 from public.businesses b
    where b.id = p_business_id
      and b.owner_profile_id = v_user_id
      and b.deleted_at is null
  ) then
    raise exception 'You do not have permission to update this business location.';
  end if;

  update public.business_branches br
  set latitude = p_latitude,
      longitude = p_longitude,
      updated_at = now(),
      updated_by = v_user_id
  where br.business_id = p_business_id
    and br.is_head_office = true
    and br.deleted_at is null
  returning br.id into v_branch_id;

  if v_branch_id is null then
    raise exception 'This business has no head-office branch yet. Add a branch first, then verify its GPS location.';
  end if;

  return jsonb_build_object('branch_id', v_branch_id, 'latitude', p_latitude, 'longitude', p_longitude);
end;
$$;

revoke all on function public.set_my_business_head_office_gps(uuid, double precision, double precision) from public, anon;
grant execute on function public.set_my_business_head_office_gps(uuid, double precision, double precision) to authenticated;
