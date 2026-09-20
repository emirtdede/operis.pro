"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "../ui/button";
import { TextInput } from "../ui/text-input";
import { TurnstileWidget } from "../security/turnstile-widget";

export interface ResetPasswordFormProps {
  locale: string;
}

function getTogglePasswordAriaLabel(showPassword: boolean, isTr: boolean): string {
  if (showPassword) {
    return isTr ? "Şifreyi gizle" : "Hide password";
  }
  return isTr ? "Şifreyi göster" : "Show password";
}

export function ResetPasswordForm({ locale }: ResetPasswordFormProps) {
  const isTr = locale === "tr";
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-center space-y-3">
        <div className="mx-auto h-10 w-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
          <AlertCircle className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
          {isTr ? "Geçersiz veya Eksik Sıfırlama Bağlantısı" : "Invalid or Missing Reset Link"}
        </h2>
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          {isTr
            ? "Şifre sıfırlama bağlantınız eksik veya süresi dolmuş olabilir. Lütfen yeni bir sıfırlama bağlantısı talep ediniz."
            : "Your password reset link is invalid or has expired. Please request a new reset link."}
        </p>
        <div className="pt-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => router.push(isTr ? "/tr/sifremi-unuttum" : "/en/forgot-password")}
            className="w-full"
          >
            {isTr ? "Yeni Bağlantı Talep Et" : "Request New Link"}
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 12) {
      setError(
        isTr
          ? "Şifreniz en az 12 karakter uzunluğunda olmalıdır."
          : "Password must be at least 12 characters long."
      );
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError(
        isTr
          ? "Şifreniz en az bir büyük harf içermelidir."
          : "Password must contain at least one uppercase letter."
      );
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError(
        isTr
          ? "Şifreniz en az bir rakam içermelidir."
          : "Password must contain at least one number."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(isTr ? "Şifreler birbiriyle eşleşmiyor." : "Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({ token, password, locale, turnstileToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isTr ? "Şifre yenilenemedi." : "Failed to reset password."));
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push(isTr ? "/tr/giris" : "/en/login");
      }, 2500);
    } catch (err: unknown) {
      const fallbackMsg = isTr
        ? "Şifre güncellenemedi. Lütfen bağlantınızı kontrol edip tekrar deneyiniz."
        : "Failed to reset password.";
      setError(err instanceof Error ? err.message : fallbackMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center space-y-3">
        <div className="mx-auto h-10 w-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
          {isTr ? "Şifreniz Başarıyla Değiştirildi!" : "Password Successfully Reset!"}
        </h2>
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          {isTr
            ? "Yeni şifreniz kaydedildi. Giriş sayfasına yönlendiriliyorsunuz..."
            : "Your new password has been saved. Redirecting to login..."}
        </p>
        <div className="pt-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => router.push(isTr ? "/tr/giris" : "/en/login")}
            className="w-full"
          >
            {isTr ? "Hemen Giriş Yap" : "Go to Login"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="relative space-y-1">
        <TextInput
          label={isTr ? "Yeni Şifre" : "New Password"}
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
          required
          autoFocus
          startIcon={<Lock className="h-4 w-4" aria-hidden="true" />}
          endIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={getTogglePasswordAriaLabel(showPassword, isTr)}
              className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />
        <p className="text-[11px] text-[var(--color-text-tertiary)] px-1">
          {isTr
            ? "En az 12 karakter, 1 büyük harf ve 1 rakam içermelidir."
            : "Must contain at least 12 characters, 1 uppercase letter, and 1 number."}
        </p>
      </div>

      <TextInput
        label={isTr ? "Yeni Şifre (Tekrar)" : "Confirm New Password"}
        type={showPassword ? "text" : "password"}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="••••••••••••"
        required
        startIcon={<Lock className="h-4 w-4" aria-hidden="true" />}
      />

      {/* Cloudflare Turnstile Bot Defense (Invisible / Interaction-Only) */}
      <TurnstileWidget
        appearance="interaction-only"
        onVerify={(token) => setTurnstileToken(token)}
        onExpire={() => setTurnstileToken(null)}
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full text-sm font-semibold mt-2"
        isLoading={isLoading}
      >
        {isTr ? "Yeni Şifreyi Kaydet" : "Save New Password"}
      </Button>
    </form>
  );
}
