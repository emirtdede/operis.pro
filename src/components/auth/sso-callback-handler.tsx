"use client";

import { useEffect, useState } from "react";
import { AuthenticateWithRedirectCallback, useAuth } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export function SSOCallbackHandler() {
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const redirectUrl = searchParams.get("redirect_url") || "/tr/ilanlar";

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId || syncing) return;

    let mounted = true;
    setSyncing(true);

    async function syncSession() {
      try {
        const res = await fetch("/api/auth/clerk-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clerkUserId: userId }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Oturum senkronizasyonu tamamlanamadı.");
        }

        // Full browser navigation so SSR picks up fp_session cookie immediately
        window.location.href = redirectUrl;
      } catch (err) {
        if (mounted) {
          setSyncError(err instanceof Error ? err.message : "Giriş tamamlanamadı.");
          setSyncing(false);
        }
      }
    }

    syncSession();

    return () => {
      mounted = false;
    };
  }, [isLoaded, isSignedIn, userId, redirectUrl, syncing]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 px-4 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      <p className="text-sm font-medium text-slate-300">
        {syncing
          ? "Hesabınız hazırlanıyor, aktarılıyorsunuz..."
          : "Yetkilendirme tamamlanıyor, lütfen bekleyin..."}
      </p>
      {syncError && (
        <div className="max-w-md rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400">
          <span>{syncError}</span>
          <div className="mt-2">
            <a href="/tr/giris" className="underline hover:text-red-300">
              Giriş sayfasına dön
            </a>
          </div>
        </div>
      )}
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
