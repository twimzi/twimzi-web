"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { captureAnalyticsAttribution, trackAnalyticsEvent } from "@/lib/analytics";

function wasTracked(key: string): boolean {
  try {
    if (window.sessionStorage.getItem(key) === "1") return true;
    window.sessionStorage.setItem(key, "1");
  } catch {
    // Tracking must continue if storage is unavailable.
  }
  return false;
}

function safeLabel(element: Element): string | undefined {
  const raw =
    element.getAttribute("aria-label") ||
    element.getAttribute("title") ||
    element.textContent ||
    "";
  const label = raw.replace(/\s+/g, " ").trim();
  return label ? label.slice(0, 100) : undefined;
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    captureAnalyticsAttribution();
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    void trackAnalyticsEvent("page_view");
    if (pathname === "/add-business") {
      void trackAnalyticsEvent("business_registration_viewed");
    }

    const scrollMarks = new Set<number>();
    const handleScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const depth = Math.min(100, Math.round((window.scrollY / scrollable) * 100));
      for (const mark of [25, 50, 75, 90, 100]) {
        if (depth >= mark && !scrollMarks.has(mark)) {
          scrollMarks.add(mark);
          void trackAnalyticsEvent("ux_scroll_depth", { scroll_depth: mark });
        }
      }
    };

    const handleFocus = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const form = target.closest("form");
      if (!form) return;
      const formId = form.id || form.getAttribute("name") || "unnamed-form";
      if (!wasTracked("twimzi:form-started:" + pathname + ":" + formId)) {
        void trackAnalyticsEvent("ux_form_started", { form_id: formId });
      }
      if (pathname === "/add-business" && !wasTracked("twimzi:business-registration-started:v1")) {
        void trackAnalyticsEvent("business_registration_started");
      }
      if (pathname === "/register" && !wasTracked("twimzi:signup-started:v1")) {
        void trackAnalyticsEvent("signup_started");
      }
    };

    const handleSubmit = (event: Event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      const formId = form.id || form.getAttribute("name") || "unnamed-form";
      void trackAnalyticsEvent("ux_form_submitted", { form_id: formId });
      if (form.querySelector('input[type="search"],input[name*="search" i]')) {
        void trackAnalyticsEvent("ux_search", { form_id: formId });
      }
    };

    const handleInvalid = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) return;
      const form = target.form;
      const formId = form?.id || form?.getAttribute("name") || "unnamed-form";
      void trackAnalyticsEvent("ux_form_error", {
        form_id: formId,
        input_type: target.type || target.tagName.toLowerCase(),
        error_code: target.validity.valueMissing ? "value_missing" :
          target.validity.typeMismatch ? "type_mismatch" :
          target.validity.tooShort ? "too_short" :
          target.validity.patternMismatch ? "pattern_mismatch" : "invalid_value",
      });
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const interactive = target.closest("button,a[href],[role='button'],[role='link']");
      if (!(interactive instanceof HTMLElement)) return;
      if (interactive.closest("form") && /^(INPUT|BUTTON|SELECT|TEXTAREA)$/.test(interactive.tagName)) return;

      const label = safeLabel(interactive);
      const elementType = interactive.tagName.toLowerCase();
      if (interactive instanceof HTMLAnchorElement) {
        try {
          const destination = new URL(interactive.href, window.location.origin);
          if (destination.origin !== window.location.origin) {
            void trackAnalyticsEvent("ux_outbound_click", {
              element_type: elementType,
              element_label: label,
              destination_host: destination.hostname.slice(0, 160),
              target_path: destination.pathname.slice(0, 200),
            });
          } else {
            void trackAnalyticsEvent("ux_click", {
              element_type: elementType,
              element_label: label,
              target_path: destination.pathname.slice(0, 200),
            });
          }
          if (destination.pathname === "/add-business") {
            void trackAnalyticsEvent("cta_click", {
              destination_host: destination.hostname,
              cta_label: label || "Register business",
            });
          }
          if (["wa.me", "whatsapp.com"].includes(destination.hostname) || destination.hostname.endsWith(".whatsapp.com")) {
            void trackAnalyticsEvent("whatsapp_click", {
              destination_host: destination.hostname,
              cta_label: label || "WhatsApp",
            });
          }
        } catch {
          // Ignore malformed links.
        }
        return;
      }
      void trackAnalyticsEvent("ux_click", {
        element_type: elementType,
        element_label: label,
      });
    };

    const handleError = (event: ErrorEvent) => {
      void trackAnalyticsEvent("ux_js_error", {
        error_name: event.error?.name || "JavaScriptError",
        error_message: (event.message || "Unhandled browser error").slice(0, 300),
        target_path: event.filename ? (() => {
          try { return new URL(event.filename).pathname.slice(0, 200); } catch { return undefined; }
        })() : undefined,
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : "Unhandled promise rejection";
      void trackAnalyticsEvent("ux_js_error", {
        error_name: reason instanceof Error ? reason.name : "UnhandledRejection",
        error_message: message.slice(0, 300),
      });
    };

    const handleResourceError = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLImageElement || target instanceof HTMLScriptElement || target instanceof HTMLLinkElement || target instanceof HTMLIFrameElement)) return;
      void trackAnalyticsEvent("ux_resource_error", {
        element_type: target.tagName.toLowerCase(),
        target_path: (() => {
          try { const resourceUrl = target instanceof HTMLLinkElement ? target.href : target.src; return new URL(resourceUrl, window.location.origin).pathname.slice(0, 200); } catch { return undefined; }
        })(),
        error_message: "Page resource failed to load",
      });
    };

    const reportPagePerformance = () => {
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (!navigation) return;
      void trackAnalyticsEvent("ux_page_performance", {
        metric_name: "dom_content_loaded_ms",
        metric_value: Math.round(navigation.domContentLoadedEventEnd),
        duration_ms: Math.round(navigation.loadEventEnd || navigation.domContentLoadedEventEnd),
      });
    };

    if (document.readyState === "complete") reportPagePerformance();
    else window.addEventListener("load", reportPagePerformance, { once: true });

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("focusin", handleFocus, true);
    document.addEventListener("submit", handleSubmit, true);
    document.addEventListener("invalid", handleInvalid, true);
    document.addEventListener("click", handleClick, true);
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    document.addEventListener("error", handleResourceError, true);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("focusin", handleFocus, true);
      document.removeEventListener("submit", handleSubmit, true);
      document.removeEventListener("invalid", handleInvalid, true);
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
      document.removeEventListener("error", handleResourceError, true);
      window.removeEventListener("load", reportPagePerformance);
    };
  }, [pathname]);

  return null;
}
