import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type AnalyticsEventName =
  | "page_view"
  | "business_registration_viewed"
  | "business_registration_started"
  | "business_registration_submitted"
  | "signup_started"
  | "signup_completed"
  | "whatsapp_click"
  | "cta_click";

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

function getSessionId(): string {
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

function getAttribution(): Attribution {
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
      session_id: getSessionId(),
      path: clean(window.location.pathname, 200) ?? "/",
      referrer_host: getReferrerHost(),
      ...getAttribution(),
      ...(extras.cta_label
        ? { cta_label: clean(extras.cta_label, 80) }
        : {}),
      ...(extras.destination_host
        ? { destination_host: clean(extras.destination_host, 160) }
        : {}),
    };

    const supabase = createSupabaseBrowserClient();
    await supabase.from("analytics_events").insert({
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
