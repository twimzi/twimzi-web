create or replace function public.get_my_business_head_office(p_business_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare v_user_id uuid := auth.uid(); v_result jsonb;
begin
  if v_user_id is null then raise exception 'Please sign in.'; end if;
  if not exists (select 1 from public.businesses b where b.id=p_business_id and b.owner_profile_id=v_user_id and b.deleted_at is null) then
    raise exception 'You do not have permission to view this business location.';
  end if;
  select jsonb_build_object(
    'id',br.id,'branch_name',br.branch_name,'branch_type',br.branch_type,
    'address_line_1',br.address_line_1,'address_line_2',br.address_line_2,
    'landmark',br.landmark,'city',br.city,'state',br.state,'country',br.country,
    'postal_code',br.postal_code,'latitude',br.latitude,'longitude',br.longitude,
    'is_head_office',br.is_head_office
  ) into v_result
  from public.business_branches br
  where br.business_id=p_business_id and br.is_head_office=true and br.deleted_at is null
  order by br.created_at asc limit 1;
  return v_result;
end;
$$;
revoke all on function public.get_my_business_head_office(uuid) from public, anon;
grant execute on function public.get_my_business_head_office(uuid) to authenticated;

create or replace function public.save_my_business_head_office(
 p_business_id uuid, p_branch_name text, p_address_line_1 text, p_address_line_2 text,
 p_landmark text, p_city text, p_state text, p_country text, p_postal_code text,
 p_latitude double precision, p_longitude double precision
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare v_user_id uuid := auth.uid(); v_branch_id uuid; v_code text;
begin
  if v_user_id is null then raise exception 'Please sign in.'; end if;
  if not exists (select 1 from public.businesses b where b.id=p_business_id and b.owner_profile_id=v_user_id and b.deleted_at is null) then
    raise exception 'You do not have permission to update this business location.';
  end if;
  if nullif(trim(p_branch_name),'') is null or nullif(trim(p_address_line_1),'') is null
     or nullif(trim(p_city),'') is null or nullif(trim(p_state),'') is null or nullif(trim(p_country),'') is null then
    raise exception 'Branch name, address, city, state and country are required.';
  end if;
  if p_latitude is null or p_longitude is null or p_latitude < -90 or p_latitude > 90 or p_longitude < -180 or p_longitude > 180 then
    raise exception 'Valid current GPS coordinates are required.';
  end if;
  select id into v_branch_id from public.business_branches
  where business_id=p_business_id and is_head_office=true and deleted_at is null
  order by created_at asc limit 1 for update;
  if v_branch_id is null then
    v_code := 'HO-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
    insert into public.business_branches(
      business_id,branch_code,branch_name,branch_type,address_line_1,address_line_2,landmark,
      city,state,country,postal_code,latitude,longitude,is_head_office,accepts_walk_in,
      accepts_home_delivery,accepts_pickup,is_active,created_by,updated_by
    ) values (
      p_business_id,v_code,trim(p_branch_name),'head_office',trim(p_address_line_1),
      nullif(trim(coalesce(p_address_line_2,'')),''),nullif(trim(coalesce(p_landmark,'')),''),trim(p_city),
      trim(p_state),trim(p_country),nullif(trim(coalesce(p_postal_code,'')),''),p_latitude,p_longitude,
      true,true,false,false,true,v_user_id,v_user_id
    ) returning id into v_branch_id;
  else
    update public.business_branches set
      branch_name=trim(p_branch_name),address_line_1=trim(p_address_line_1),
      address_line_2=nullif(trim(coalesce(p_address_line_2,'')),''),landmark=nullif(trim(coalesce(p_landmark,'')),''),
      city=trim(p_city),state=trim(p_state),country=trim(p_country),
      postal_code=nullif(trim(coalesce(p_postal_code,'')),''),latitude=p_latitude,longitude=p_longitude,
      updated_at=now(),updated_by=v_user_id
    where id=v_branch_id;
  end if;
  return jsonb_build_object('id',v_branch_id,'latitude',p_latitude,'longitude',p_longitude,'is_head_office',true);
end;
$$;
revoke all on function public.save_my_business_head_office(uuid,text,text,text,text,text,text,text,text,double precision,double precision) from public, anon;
grant execute on function public.save_my_business_head_office(uuid,text,text,text,text,text,text,text,text,double precision,double precision) to authenticated;
