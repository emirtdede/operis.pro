"use client";

import { useEffect, useRef } from "react";

export interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact" | "flexible";
  appearance?: "always" | "execute" | "interaction-only";
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: (error: string) => void;
          "expired-callback"?: () => void;
          theme?: string;
          size?: "normal" | "compact" | "flexible";
          appearance?: "always" | "execute" | "interaction-only";
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onTurnstileLoaded?: () => void;
  }
}

export function TurnstileWidget({
  onVerify,
  onError,
  onExpire,
  theme = "auto",
  size = "flexible",
  appearance = "interaction-only",
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onVerifyRef = useRef(onVerify);
  const onErrorRef = useRef(onError);
  const onExpireRef = useRef(onExpire);

  onVerifyRef.current = onVerify;
  onErrorRef.current = onError;
  onExpireRef.current = onExpire;

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !containerRef.current || typeof window === "undefined") return;

    const renderWidget = () => {
      if (!window.turnstile || !containerRef.current || widgetIdRef.current) return;

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          size,
          appearance,
          callback: (token) => onVerifyRef.current(token),
          "error-callback": (err) => onErrorRef.current?.(err),
          "expired-callback": () => {
            onExpireRef.current?.();
            // Automatically reset so token remains ready
            if (widgetIdRef.current && window.turnstile) {
              try {
                window.turnstile.reset(widgetIdRef.current);
              } catch {
                // Ignore
              }
            }
          },
        });
      } catch {
        // Ignore render race condition
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      // Load script if not already present
      const scriptId = "cf-turnstile-script";
      let script = document.getElementById(scriptId) as HTMLScriptElement | null;

      if (!script) {
        script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }

      const checkInterval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkInterval);
          renderWidget();
        }
      }, 100);

      return () => {
        clearInterval(checkInterval);
      };
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        } catch {
          // Ignore
        }
      }
    };
  }, [siteKey, theme, size, appearance]);

  // If site key is not configured, silently render nothing (graceful fallback)
  if (!siteKey) {
    return null;
  }

  return (
    <div
      className={
        appearance === "interaction-only"
          ? "sr-only pointer-events-none absolute -z-50 h-0 w-0 overflow-hidden"
          : "my-2 flex justify-center"
      }
      aria-hidden={appearance === "interaction-only"}
    >
      <div ref={containerRef} />
    </div>
  );
}
