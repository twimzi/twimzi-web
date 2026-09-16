# Twimzi Super Admin Module

Copy `src/app/admin` into the existing Next.js website project.

This is the owner-control UI foundation connected to the shared Supabase backend. It contains no demo/test business records and does not expose a service-role key.

Important: privileged mutations (approve, suspend, delete, user creation/removal, role changes, featured/boost controls, settings and notifications) must be implemented through owner-only Supabase RPCs/server-side operations with audit logging. Existing RLS should not be weakened just to make the dashboard work.
