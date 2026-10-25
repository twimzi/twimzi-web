create or replace function public.get_public_business_stories(p_limit integer default 24)
returns table (
  id uuid,
  business_id uuid,
  caption text,
  created_at timestamptz,
  expires_at timestamptz,
  business_name text,
  business_slug text,
  media_object_path text,
  media_mime_type text
)
language sql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $function$
  select
    s.id,
    s.business_id,
    s.caption,
    s.created_at,
    s.expires_at,
    b.business_name,
    b.slug as business_slug,
    m.object_path as media_object_path,
    m.mime_type as media_mime_type
  from public.business_stories s
  join public.businesses b on b.id = s.business_id
  join public.media m on m.id = s.media_id
  where s.is_active = true
    and s.deleted_at is null
    and s.expires_at > now()
    and b.business_status = 'approved'::public.business_status
    and b.is_active = true
    and b.deleted_at is null
    and m.is_public = true
    and m.mime_type like 'image/%'
  order by s.created_at desc
  limit least(greatest(coalesce(p_limit, 24), 1), 50);
$function$;

revoke all on function public.get_public_business_stories(integer) from public;
grant execute on function public.get_public_business_stories(integer) to anon, authenticated;
