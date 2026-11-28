-- Allow Super Admins to review and manage customer support submissions.
create policy "Super admins can view all support tickets"
on public.support_tickets for select to authenticated
using ((select public.is_super_admin()) = true);
create policy "Super admins can manage support tickets"
on public.support_tickets for update to authenticated
using ((select public.is_super_admin()) = true)
with check ((select public.is_super_admin()) = true);
