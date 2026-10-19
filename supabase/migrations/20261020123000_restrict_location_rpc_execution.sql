-- Remove direct API access to the trigger-only helper and anonymous access to
-- the authenticated location-verification mutation.
REVOKE EXECUTE ON FUNCTION public.require_business_post_location() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.verify_business_location(uuid, double precision, double precision) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_business_location(uuid, double precision, double precision) TO authenticated;
