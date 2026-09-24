"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs/legacy";
import { useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

export interface SocialLoginButtonsProps {
  locale: string;
  returnUrl?: string;
  mode?: "login" | "register";
  onError?: (msg: string) => void;
}

type OAuthProvider = "oauth_google";

export function SocialLoginButtons(props: SocialLoginButtonsProps) {
  // If Clerk Publishable Key is not configured, render safe fallback without invoking Clerk hooks
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <SocialLoginButtonsFallback {...props} />;
  }

  return <SocialLoginButtonsConnected {...props} />;
}

function SocialLoginButtonsConnected({
  locale,
  returnUrl,
  mode = "login",
  onError,
}: SocialLoginButtonsProps) {
  const isTr = locale === "tr";
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);
  const { isLoaded, signIn } = useSignIn();
  const { isSignedIn, userId, isLoaded: authLoaded } = useAuth();

  const defaultRedirect = isTr ? "/tr/ilanlar?view=stream" : "/en/listings?view=stream";
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
        redirectUrlComplete: `/sso-callback?redirect_url=${encodeURIComponent(targetRedirect)}`,
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

  return (
    <SocialButtonsView
      isTr={isTr}
      mode={mode}
      loadingProvider={loadingProvider}
      onSelect={handleOAuth}
    />
  );
}

function SocialLoginButtonsFallback({ locale, mode = "login", onError }: SocialLoginButtonsProps) {
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
      mode={mode}
      loadingProvider={null}
      onSelect={(_strategy, name) => handleFallback(name)}
    />
  );
}

interface SocialButtonsViewProps {
  isTr: boolean;
  mode: "login" | "register";
  loadingProvider: OAuthProvider | null;
  onSelect: (strategy: OAuthProvider, name: string) => void;
}

function SocialButtonsView({ isTr, mode, loadingProvider, onSelect }: SocialButtonsViewProps) {
  const isSigningIn = loadingProvider === "oauth_google";

  const buttonText = isTr
    ? mode === "register"
      ? "Google ile Kayıt Ol"
      : "Google ile Giriş Yap"
    : mode === "register"
      ? "Sign up with Google"
      : "Continue with Google";

  return (
    <div className="w-full space-y-3">
      <div className="relative flex items-center justify-center">
        <div className="border-t border-[var(--color-border-subtle)] w-full" />
        <span className="bg-[var(--color-surface-base)] px-3 text-[11px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider shrink-0">
          {isTr ? "veya" : "or"}
        </span>
        <div className="border-t border-[var(--color-border-subtle)] w-full" />
      </div>

      <button
        type="button"
        onClick={() => onSelect("oauth_google", "Google")}
        disabled={!!loadingProvider}
        aria-label={buttonText}
        className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] py-3 px-4 text-sm font-semibold text-[var(--color-text-primary)] transition-all duration-200 hover:border-blue-500/40 hover:bg-[var(--color-surface-hover)] hover:shadow-md hover:shadow-blue-500/10 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
      >
        {isSigningIn ? (
          <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
        ) : (
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
        )}
        <span>{buttonText}</span>
      </button>
    </div>
  );
}
