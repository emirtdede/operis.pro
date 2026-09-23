"use client";

import React, { useEffect, Suspense } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import "@/sentry.client.config";

export interface OperisPostHogProviderProps {
  children: React.ReactNode;
  userId?: string | null;
}

export function OperisPostHogProvider({ children, userId }: OperisPostHogProviderProps) {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

  useEffect(() => {
    if (!apiKey || typeof window === "undefined" || !posthog.__loaded) return;

    if (userId) {
      posthog.identify(userId);
    } else {
      posthog.reset();
    }
  }, [userId, apiKey]);

  useEffect(() => {
    if (!apiKey || typeof window === "undefined") return;

    if (!posthog.__loaded) {
      posthog.init(apiKey, {
        api_host: apiHost,
        person_profiles: "identified_only", // Respect privacy - don't profile anonymous users
        capture_pageview: false, // Captured manually on route changes below
        capture_pageleave: true,
        session_recording: {
          maskAllInputs: true, // KVKK protection: all form inputs masked
          maskTextSelector: "*", // KVKK protection: all text masked in replays
        },
        autocapture: true,
        loaded: (ph) => {
          if (userId) {
            ph.identify(userId);
          }
        },
      });

      // Synchronize with stored cookie preferences (Strict KVKK / GDPR opt-in)
      try {
        const stored = localStorage.getItem("operis_cookie_consent");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (!parsed.analytics) {
            posthog.opt_out_capturing();
          }
        } else {
          // Default to opt-out until user explicitly consents via modal
          posthog.opt_out_capturing();
        }
      } catch {
        posthog.opt_out_capturing();
      }
    }

    // Listen for real-time cookie consent updates from CookieConsentModal
    const handleConsentUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ analytics?: boolean }>;
      if (customEvent.detail?.analytics) {
        posthog.opt_in_capturing();
      } else {
        posthog.opt_out_capturing();
      }
    };

    window.addEventListener("operis-cookie-consent-updated", handleConsentUpdate);
    return () => {
      window.removeEventListener("operis-cookie-consent-updated", handleConsentUpdate);
    };
  }, [apiKey, apiHost, userId]);

  if (!apiKey) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageViewTracker />
      </Suspense>
      {children}
    </PHProvider>
  );
}

function PostHogPageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && typeof window !== "undefined") {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = `${url}?${searchParams.toString()}`;
      }
      posthog.capture("$pageview", {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}
