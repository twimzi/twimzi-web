import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type AnalyticsEventName =
  | "page_view"
  | "business_registration_viewed"
  | "business_registration_started"
  | "business_registration_auth_required"
  | "business_registration_submitted"
  | "business_registration_step_completed"
  | "business_registration_auth_failed"
  | "signup_started"
  | "signup_completed"
  | "whatsapp_click"
  | "cta_click"
  | "ux_click"
  | "ux_form_started"
  | "ux_form_submitted"
  | "ux_form_error"
  | "ux_js_error"
  | "ux_resource_error"
  | "ux_page_performance"
  | "ux_scroll_depth"
  | "ux_outbound_click"
  | "ux_search";

type Attribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

type EventExtras = {
  cta_label?: string;
  destination_host?: string;
  step_name?: string;
  element_type?: string;
  element_label?: string;
  form_id?: string;
  error_message?: string;
  error_name?: string;
  error_code?: string;
  metric_name?: string;
  metric_value?: number;
  duration_ms?: number;
  scroll_depth?: number;
  target_path?: string;
  input_type?: string;
  status_code?: number;
};

const SESSION_KEY = "twimzi:analytics-session:v1";
const ATTRIBUTION_KEY = "twimzi:analytics-attribution:v1";

function clean(
  value: string | null | undefined,
  maxLength: number,
): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

export function setAnalyticsSessionId(sessionId: string): void {
  if (typeof window === "undefined" || !/^[0-9a-fA-F-]{36}$/.test(sessionId)) return;
  window.sessionStorage.setItem(SESSION_KEY, sessionId);
}

export function getAnalyticsSessionId(): string {
  let sessionId = window.sessionStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    sessionId = window.crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
}

export function captureAnalyticsAttribution(): void {
  if (typeof window === "undefined") return;

  try {
    const params = new URLSearchParams(window.location.search);
    const attribution: Attribution = {
      utm_source: clean(params.get("utm_source"), 100),
      utm_medium: clean(params.get("utm_medium"), 100),
      utm_campaign: clean(params.get("utm_campaign"), 120),
      utm_content: clean(params.get("utm_content"), 120),
      utm_term: clean(params.get("utm_term"), 120),
    };

    const hasCampaign = Object.values(attribution).some(Boolean);
    if (hasCampaign) {
      window.sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
    }
  } catch {
    // Analytics attribution is optional and must not interrupt navigation.
  }
}

export function getAnalyticsAttribution(): Attribution {
  try {
    const stored = window.sessionStorage.getItem(ATTRIBUTION_KEY);
    return stored ? (JSON.parse(stored) as Attribution) : {};
  } catch {
    return {};
  }
}

function getReferrerHost(): string | undefined {
  if (!document.referrer) return undefined;

  try {
    return clean(new URL(document.referrer).hostname, 160);
  } catch {
    return undefined;
  }
}

export async function trackAnalyticsEvent(
  eventName: AnalyticsEventName,
  extras: EventExtras = {},
): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const metadata = {
      session_id: getAnalyticsSessionId(),
      path: clean(window.location.pathname, 200) ?? "/",
      referrer_host: getReferrerHost(),
      ...getAnalyticsAttribution(),
      ...(extras.cta_label
        ? { cta_label: clean(extras.cta_label, 80) }
        : {}),
      ...(extras.destination_host
        ? { destination_host: clean(extras.destination_host, 160) }
        : {}),
      ...(extras.step_name ? { step_name: clean(extras.step_name, 80) } : {}),
      ...(extras.element_type ? { element_type: clean(extras.element_type, 40) } : {}),
      ...(extras.element_label ? { element_label: clean(extras.element_label, 100) } : {}),
      ...(extras.form_id ? { form_id: clean(extras.form_id, 100) } : {}),
      ...(extras.error_message ? { error_message: clean(extras.error_message.replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[email]").replace(/(password|token|authorization|access_token|refresh_token)\s*[:=]\s*[^\s,;]+/gi, "$1=[redacted]"), 300) } : {}),
      ...(extras.error_name ? { error_name: clean(extras.error_name, 100) } : {}),
      ...(extras.error_code ? { error_code: clean(extras.error_code, 80) } : {}),
      ...(extras.metric_name ? { metric_name: clean(extras.metric_name, 40) } : {}),
      ...(typeof extras.metric_value === "number" && Number.isFinite(extras.metric_value) ? { metric_value: extras.metric_value } : {}),
      ...(typeof extras.duration_ms === "number" && Number.isFinite(extras.duration_ms) ? { duration_ms: extras.duration_ms } : {}),
      ...(typeof extras.scroll_depth === "number" ? { scroll_depth: extras.scroll_depth } : {}),
      ...(extras.target_path ? { target_path: clean(extras.target_path, 200) } : {}),
      ...(extras.input_type ? { input_type: clean(extras.input_type, 40) } : {}),
      ...(typeof extras.status_code === "number" ? { status_code: extras.status_code } : {}),
    };

    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("analytics_events").insert({
      profile_id: user?.id ?? null,
      event_name: eventName,
      platform: "web",
      device_type: window.matchMedia("(max-width: 767px)").matches
        ? "mobile"
        : "desktop",
      metadata,
    });
  } catch {
    // Analytics must never block sign-in, registration, navigation, or checkout.
  }
}

export async function trackRegistrationDiagnostic(input: {
  eventName: string;
  stage: string;
  httpStatus?: number;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, string | number | boolean | null>;
}): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    const safeMessage = input.errorMessage
      ?.replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[email]")
      .replace(/(password|token|authorization|access_token|refresh_token)\s*[:=]\s*[^\s,;]+/gi, "$1=[redacted]")
      .slice(0, 500);
    const metadata = Object.fromEntries(Object.entries(input.metadata ?? {}).slice(0, 20));
    await supabase.from("registration_audit_events").insert({
      session_id: getAnalyticsSessionId(),
      profile_id: user?.id ?? null,
      event_name: input.eventName.slice(0, 80),
      stage: input.stage.slice(0, 80),
      path: window.location.pathname.slice(0, 200),
      http_status: input.httpStatus ?? 500,
      error_code: input.errorCode?.slice(0, 80) ?? null,
      error_message: safeMessage ?? null,
      metadata,
    });
  } catch {
    // Diagnostic logging must never interrupt a customer's registration.
  }
}
