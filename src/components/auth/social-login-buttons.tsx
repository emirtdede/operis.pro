"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs/legacy";
import { useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

export interface SocialLoginButtonsProps {
  locale: string;
  returnUrl?: string;
  onError?: (msg: string) => void;
}

type OAuthProvider =
  "oauth_google" | "oauth_github" | "oauth_linkedin_oidc" | "oauth_apple" | "oauth_microsoft";

export function SocialLoginButtons(props: SocialLoginButtonsProps) {
  // If Clerk Publishable Key is not configured, render safe fallback without invoking Clerk hooks
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <SocialLoginButtonsFallback {...props} />;
  }

  return <SocialLoginButtonsConnected {...props} />;
}

function SocialLoginButtonsConnected({ locale, returnUrl, onError }: SocialLoginButtonsProps) {
  const isTr = locale === "tr";
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);
  const { isLoaded, signIn } = useSignIn();
  const { isSignedIn, userId, isLoaded: authLoaded } = useAuth();

  const defaultRedirect = isTr ? "/tr/akis" : "/en/feed";
  const targetRedirect = returnUrl || defaultRedirect;

  const handleOAuth = async (strategy: OAuthProvider, providerName: string) => {
    if (loadingProvider) return;

    // 1. If already authenticated via Clerk, synchronize directly with Operis
    if (authLoaded && isSignedIn && userId) {
      setLoadingProvider(strategy);
      try {
        const syncRes = await fetch("/api/auth/clerk-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clerkUserId: userId }),
        });

        if (syncRes.ok) {
          window.location.href = targetRedirect;
          return;
        } else {
          setLoadingProvider(null);
          const errData = await syncRes.json().catch(() => ({}));
          const msg = isTr
            ? errData.error || `${providerName} oturumu senkronize edilemedi.`
            : errData.error || `Could not sync ${providerName} session.`;
          if (onError) onError(msg);
          return;
        }
      } catch {
        setLoadingProvider(null);
        const msg = isTr
          ? "Sunucuyla bağlantı kurulamadı. Lütfen tekrar deneyin."
          : "Could not connect to server. Please try again.";
        if (onError) onError(msg);
        return;
      }
    }

    if (!isLoaded || !signIn) {
      const msg = isTr
        ? `${providerName} ile giriş şu anda yükleniyor. Lütfen birkaç saniye sonra tekrar deneyin.`
        : `${providerName} sign-in is loading. Please try again in a few seconds.`;
      if (onError) onError(msg);
      return;
    }

    setLoadingProvider(strategy);
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: targetRedirect,
      });
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : String(err);

      // Check if user is already signed in on Clerk (session_exists)
      const isAlreadySignedIn =
        rawMsg.toLowerCase().includes("already signed in") ||
        rawMsg.includes("session_exists") ||
        (typeof err === "object" &&
          err !== null &&
          "errors" in err &&
          Array.isArray((err as { errors: Array<{ code?: string }> }).errors) &&
          (err as { errors: Array<{ code?: string }> }).errors.some(
            (e) => e.code === "session_exists"
          ));

      if (isAlreadySignedIn) {
        try {
          const syncRes = await fetch("/api/auth/clerk-sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          if (syncRes.ok) {
            window.location.href = targetRedirect;
            return;
          }
        } catch {
          // Ignore
        }

        setLoadingProvider(null);
        const msg = isTr
          ? "Oturum senkronize edilemedi. Lütfen sayfayı yenileyip tekrar deneyiniz."
          : "Session could not be synchronized. Please refresh and try again.";
        if (onError) onError(msg);
        return;
      }

      setLoadingProvider(null);
      const msg = isTr
        ? `${providerName} ile bağlantı kurulamadı. Lütfen tekrar deneyiniz.`
        : `Failed to connect with ${providerName}. Please try again.`;
      if (onError) onError(msg);
    }
  };

  return <SocialButtonsView isTr={isTr} loadingProvider={loadingProvider} onSelect={handleOAuth} />;
}

function SocialLoginButtonsFallback({ locale, onError }: SocialLoginButtonsProps) {
  const isTr = locale === "tr";

  const handleFallback = (providerName: string) => {
    const msg = isTr
      ? `${providerName} ile giriş şu anda hazırlık aşamasında. Lütfen .env dosyasında Clerk anahtarlarını kontrol edin.`
      : `${providerName} sign-in is currently being configured. Please check Clerk keys in .env.`;
    if (onError) onError(msg);
  };

  return (
    <SocialButtonsView
      isTr={isTr}
      loadingProvider={null}
      onSelect={(_strategy, name) => handleFallback(name)}
    />
  );
}

interface SocialButtonsViewProps {
  isTr: boolean;
  loadingProvider: OAuthProvider | null;
  onSelect: (strategy: OAuthProvider, name: string) => void;
}

function SocialButtonsView({ isTr, loadingProvider, onSelect }: SocialButtonsViewProps) {
  const providers = [
    {
      id: "oauth_google" as const,
      name: "Google",
      ariaLabel: isTr ? "Google ile Giriş Yap / Devam Et" : "Continue with Google",
      icon: (
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
      ),
    },
    {
      id: "oauth_github" as const,
      name: "GitHub",
      ariaLabel: isTr ? "GitHub ile Giriş Yap / Devam Et" : "Continue with GitHub",
      icon: (
        <svg
          className="h-5 w-5 shrink-0 fill-slate-200 group-hover:fill-white"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          />
        </svg>
      ),
    },
    {
      id: "oauth_linkedin_oidc" as const,
      name: "LinkedIn",
      ariaLabel: isTr ? "LinkedIn ile Giriş Yap / Devam Et" : "Continue with LinkedIn",
      icon: (
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#0A66C2"
            d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37h2.79V10.9H6.46M7.86 6.32a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z"
          />
        </svg>
      ),
    },
    ...(process.env.NEXT_PUBLIC_ENABLE_OAUTH_APPLE === "true"
      ? [
          {
            id: "oauth_apple" as const,
            name: "Apple",
            ariaLabel: isTr ? "Apple ile Giriş Yap / Devam Et" : "Continue with Apple",
            icon: (
              <svg
                className="h-5 w-5 shrink-0 fill-slate-200 group-hover:fill-white"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.66-.82 1.11-1.96.99-3.1-.96.04-2.12.64-2.8 1.43-.6.69-1.12 1.83-.98 2.93 1.08.08 2.14-.54 2.79-1.26z" />
              </svg>
            ),
          },
        ]
      : []),
    {
      id: "oauth_microsoft" as const,
      name: "Microsoft",
      ariaLabel: isTr ? "Microsoft ile Giriş Yap / Devam Et" : "Continue with Microsoft",
      icon: (
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="1.5" y="1.5" width="10" height="10" rx="1" fill="#F25022" />
          <rect x="12.5" y="1.5" width="10" height="10" rx="1" fill="#7FBA00" />
          <rect x="1.5" y="12.5" width="10" height="10" rx="1" fill="#00A4EF" />
          <rect x="12.5" y="12.5" width="10" height="10" rx="1" fill="#FFB900" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full space-y-3">
      <div className="relative flex items-center justify-center">
        <div className="border-t border-[var(--color-border-subtle)] w-full" />
        <span className="bg-[var(--color-surface-base)] px-3 text-[11px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider shrink-0">
          {isTr ? "veya sosyal hesapla devam et" : "or continue with social"}
        </span>
        <div className="border-t border-[var(--color-border-subtle)] w-full" />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 py-1">
        {providers.map((p) => {
          const isLoadingThis = loadingProvider === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id, p.name)}
              disabled={!!loadingProvider}
              title={p.ariaLabel}
              aria-label={p.ariaLabel}
              className="group relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full border border-slate-800 bg-[#12141a] overflow-hidden transition-all duration-200 hover:scale-105 hover:border-blue-500/50 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-blue-500/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              {isLoadingThis ? <Loader2 className="h-5 w-5 animate-spin text-blue-400" /> : p.icon}
              <span className="absolute inset-0 rounded-full border border-transparent transition-colors group-hover:border-blue-500/20" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
