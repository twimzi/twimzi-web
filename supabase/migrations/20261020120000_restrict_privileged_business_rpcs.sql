-- Security hardening: restrict privileged business RPCs to authenticated users.
-- Public business discovery RPCs remain available to anon; these two are not public APIs.
-- admin_get_business also checks is_super_admin() inside the function.
-- create_business independently requires auth.uid() and records the caller as owner.

REVOKE EXECUTE ON FUNCTION public.admin_get_business(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_business(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_business(
  text, text, text, text, text, text, text, text, text, text, text, text,
  double precision, double precision
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_business(
  text, text, text, text, text, text, text, text, text, text, text, text,
  double precision, double precision
) TO authenticated;
