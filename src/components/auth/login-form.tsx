"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ShieldAlert, KeyRound, Eye, EyeOff } from "lucide-react";
import { Button } from "../ui/button";
import { TextInput } from "../ui/text-input";
import { SocialLoginButtons } from "./social-login-buttons";
import { TurnstileWidget } from "../security/turnstile-widget";

export interface LoginFormProps {
  locale: string;
  returnUrl?: string;
}

function getSafeReturnUrl(url: string | undefined | null, fallback: string): string {
  if (!url) return fallback;
  if (/^\/(tr|en)(\/|$)/.test(url) && !url.startsWith("//")) {
    return url;
  }
  return fallback;
}

export function LoginForm({ locale, returnUrl }: LoginFormProps) {
  const isTr = locale === "tr";
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const defaultRedirect = isTr ? "/tr/akis" : "/en/feed";
  const targetRedirect = getSafeReturnUrl(returnUrl, defaultRedirect);

  useEffect(() => {
    // If already logged in, silently forward to target page without any intrusive banners
    if (
      typeof window !== "undefined" &&
      (window as unknown as { Clerk?: { session?: unknown } }).Clerk?.session
    ) {
      fetch("/api/auth/clerk-sync", { method: "POST" })
        .then((res) => {
          if (res.ok) {
            window.location.href = targetRedirect;
          }
        })
        .catch(() => {});
    }
  }, [targetRedirect]);

  const handleSocialError = (msg: string) => {
    if (msg.toLowerCase().includes("already signed in") || msg.includes("session_exists")) {
      window.location.href = targetRedirect;
      return;
    }
    setError(msg);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          totpCode: requires2FA ? totpCode.trim() : undefined,
          turnstileToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.requires2FA) {
          setRequires2FA(true);
          return;
        }
        throw new Error(data.error || "Login failed");
      }

      router.push(targetRedirect);
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : isTr
            ? "Giriş yapılamadı. Bilgilerinizi kontrol ediniz."
            : "Invalid email or password."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400">
          <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {!requires2FA ? (
        <>
          <TextInput
            label={isTr ? "E-posta adresi" : "Email address"}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@alanadi.com"
            required
            autoComplete="email"
            startIcon={<Mail className="h-4 w-4" aria-hidden="true" />}
          />

          <TextInput
            label={isTr ? "Şifre" : "Password"}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
            autoComplete="current-password"
            startIcon={<Lock className="h-4 w-4" aria-hidden="true" />}
            endIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer"
                aria-label={
                  showPassword
                    ? isTr
                      ? "Şifreyi gizle"
                      : "Hide password"
                    : isTr
                      ? "Şifreyi göster"
                      : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            }
          />

          {/* Symmetrical Action Row: Hesap Oluştur (Left) & Şifremi Unuttum (Right) */}
          <div className="flex items-center justify-between text-xs pt-1 px-1">
            <Link
              href={isTr ? "/tr/kayit" : "/en/register"}
              className="font-medium text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
            >
              {isTr ? "Hesap Oluştur" : "Create an Account"}
            </Link>
            <Link
              href={isTr ? "/tr/sifremi-unuttum" : "/en/forgot-password"}
              className="font-normal text-[var(--color-text-secondary)] hover:text-slate-200 transition-colors"
            >
              {isTr ? "Şifremi unuttum" : "Forgot password?"}
            </Link>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            <span>
              {isTr
                ? "İki Adımlı Doğrulama (2FA) Gerekli"
                : "Two-Factor Authentication Required"}
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            {useBackupCode
              ? isTr
                ? "Hesabınızı oluştururken kaydedilen 8 karakterli yedek kodunuzu giriniz."
                : "Enter your 8-character backup recovery code saved during 2FA setup."
              : isTr
                ? "Kimlik doğrulama (Authenticator) uygulamanızdaki 6 haneli kodu giriniz."
                : "Enter the 6-digit code from your authenticator application."}
          </p>

          {!useBackupCode ? (
            <>
              <TextInput
                label={isTr ? "6 Haneli Doğrulama Kodu" : "6-Digit Verification Code"}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                required
                maxLength={6}
                autoFocus
                startIcon={<KeyRound className="h-4 w-4" aria-hidden="true" />}
              />
              <div className="flex justify-between items-center pt-0.5 text-xs">
                <span className="text-[var(--color-text-tertiary)] text-[11px]">
                  {isTr ? "30 saniyede bir yenilenir" : "Refreshes every 30 seconds"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setUseBackupCode(true);
                    setTotpCode("");
                  }}
                  className="text-blue-400 hover:text-blue-300 hover:underline transition-colors cursor-pointer"
                >
                  {isTr ? "Yedek kod kullan" : "Use a backup code"}
                </button>
              </div>
            </>
          ) : (
            <>
              <TextInput
                label={isTr ? "8 Karakterli Yedek Kod" : "8-Character Backup Code"}
                type="text"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.toUpperCase().slice(0, 10))}
                placeholder="A1B2C3D4"
                required
                maxLength={10}
                autoFocus
                startIcon={<KeyRound className="h-4 w-4" aria-hidden="true" />}
              />
              <div className="flex justify-between items-center pt-0.5 text-xs">
                <span className="text-[var(--color-text-tertiary)] text-[11px]">
                  {isTr ? "8 haneli tek kullanımlık kod" : "8-character single-use code"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setUseBackupCode(false);
                    setTotpCode("");
                  }}
                  className="text-blue-400 hover:text-blue-300 hover:underline transition-colors cursor-pointer"
                >
                  {isTr ? "Authenticator kodu kullan" : "Use Authenticator app"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Cloudflare Turnstile Bot Defense (Invisible / Interaction-Only) */}
      <TurnstileWidget
        appearance="interaction-only"
        onVerify={(token) => setTurnstileToken(token)}
        onExpire={() => setTurnstileToken(null)}
      />

      {/* Main Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full text-sm font-semibold mt-1 cursor-pointer"
        isLoading={isLoading}
      >
        {requires2FA
          ? isTr
            ? "Doğrula ve Giriş Yap"
            : "Verify & Sign In"
          : isTr
            ? "Giriş Yap"
            : "Sign In"}
      </Button>

      {/* 5 Circular Social Login Buttons */}
      {!requires2FA && (
        <div className="pt-2">
          <SocialLoginButtons
            locale={locale}
            returnUrl={targetRedirect}
            onError={handleSocialError}
          />
        </div>
      )}
    </form>
  );
}
