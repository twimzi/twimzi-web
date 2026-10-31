"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import {
  captureAnalyticsAttribution,
  trackAnalyticsEvent,
} from "@/lib/analytics";

function wasTracked(key: string): boolean {
  try {
    if (window.sessionStorage.getItem(key) === "1") return true;
    window.sessionStorage.setItem(key, "1");
  } catch {
    // Continue tracking for this page if session storage is unavailable.
  }

  return false;
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
  }, [pathname]);

  useEffect(() => {
    const handleFocus = (event: FocusEvent) => {
      if (!pathname || pathname.startsWith("/admin")) return;

      const target = event.target;
      if (!(target instanceof HTMLElement) || !target.closest("form")) return;

      if (pathname === "/add-business") {
        if (!wasTracked("twimzi:business-registration-started:v1")) {
          void trackAnalyticsEvent("business_registration_started");
        }
      }

      if (pathname === "/register") {
        if (!wasTracked("twimzi:signup-started:v1")) {
          void trackAnalyticsEvent("signup_started");
        }
      }
    };

    const handleClick = (event: MouseEvent) => {
      if (!pathname || pathname.startsWith("/admin")) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (anchor instanceof HTMLAnchorElement) {
        let destination: URL;

        try {
          destination = new URL(anchor.href, window.location.origin);
        } catch {
          return;
        }

        const host = destination.hostname.toLowerCase();
        const isWhatsApp =
          host === "wa.me" ||
          host.endsWith(".whatsapp.com") ||
          host === "whatsapp.com";

        if (isWhatsApp) {
          void trackAnalyticsEvent("whatsapp_click", {
            destination_host: host,
            cta_label: anchor.textContent?.trim().slice(0, 80) || "WhatsApp",
          });
          return;
        }

        if (destination.pathname === "/add-business") {
          void trackAnalyticsEvent("cta_click", {
            destination_host: destination.hostname,
            cta_label: anchor.textContent?.trim().slice(0, 80) || "Register business",
          });
        }
      }

      if (pathname === "/register") {
        const button = target.closest("button");
        if (button && /google/i.test(button.textContent ?? "")) {
          if (!wasTracked("twimzi:signup-started:v1")) {
            void trackAnalyticsEvent("signup_started");
          }
        }
      }
    };

    document.addEventListener("focusin", handleFocus, true);
    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("focusin", handleFocus, true);
      document.removeEventListener("click", handleClick, true);
    };
  }, [pathname]);

  return null;
}
