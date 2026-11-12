-- Allow the anonymous registration funnel to record the auth hand-off step.
-- Keep the existing privacy and payload constraints unchanged.
-- The event contains only the existing session/path attribution metadata, never form data.

drop policy if exists analytics_public_web_insert on public.analytics_events;
create policy analytics_public_web_insert
  on public.analytics_events
  for insert
  to anon
  with check (
    event_name in (
      'page_view',
      'business_registration_viewed',
      'business_registration_started',
      'business_registration_submitted',
      'business_registration_auth_required',
      'signup_started',
      'signup_completed',
      'whatsapp_click',
      'cta_click'
    )
    and platform = 'web'
    and device_type in ('desktop', 'mobile', 'tablet')
    and profile_id is null
    and business_id is null
    and entity_type is null
    and entity_id is null
    and app_version is null
    and ip_address is null
    and user_agent is null
    and jsonb_typeof(metadata) = 'object'
    and octet_length(metadata::text) <= 2048
    and metadata ? 'session_id'
    and metadata ? 'path'
    and (metadata ->> 'session_id') ~ '^[0-9a-fA-F-]{36}$'
    and length(metadata ->> 'path') between 1 and 200
    and coalesce(length(metadata ->> 'referrer_host'), 0) <= 160
    and coalesce(length(metadata ->> 'utm_source'), 0) <= 100
    and coalesce(length(metadata ->> 'utm_medium'), 0) <= 100
    and coalesce(length(metadata ->> 'utm_campaign'), 0) <= 120
    and coalesce(length(metadata ->> 'utm_content'), 0) <= 120
    and coalesce(length(metadata ->> 'utm_term'), 0) <= 120
    and coalesce(length(metadata ->> 'cta_label'), 0) <= 80
    and coalesce(length(metadata ->> 'destination_host'), 0) <= 160
    and metadata - array[
      'session_id',
      'path',
      'referrer_host',
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_content',
      'utm_term',
      'cta_label',
      'destination_host'
    ]::text[] = '{}'::jsonb
  );
