"use client";

import React, { useState } from "react";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { TextInput } from "../ui/text-input";
import { TurnstileWidget } from "../security/turnstile-widget";

export interface ForgotPasswordFormProps {
  locale: string;
}

export function ForgotPasswordForm({ locale }: ForgotPasswordFormProps) {
  const isTr = locale === "tr";
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({ email: email.trim(), locale, turnstileToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || (isTr ? "İşlem gerçekleştirilemedi." : "Request could not be processed.")
        );
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      const fallbackMsg = isTr
        ? "Talep iletilemedi. Lütfen tekrar deneyiniz."
        : "Could not send reset instructions.";
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
          {isTr ? "Sıfırlama Bağlantısı Gönderildi" : "Reset Link Sent"}
        </h2>
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          {isTr
            ? `${email} adresine şifre yenileme bağlantısı gönderildi. Lütfen gelen kutunuzu ve spam klasörünüzü kontrol ediniz.`
            : `We have sent password reset instructions to ${email}. Please check your inbox and spam folder.`}
        </p>
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

      <TextInput
        label={isTr ? "Kayıtlı E-posta Adresiniz" : "Registered Email"}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="adiniz@sirket.com"
        required
        autoFocus
        startIcon={<Mail className="h-4 w-4" aria-hidden="true" />}
      />

      {/* Cloudflare Turnstile Bot Defense */}
      <TurnstileWidget
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
        {isTr ? "Sıfırlama Bağlantısı Gönder" : "Send Reset Link"}
      </Button>
    </form>
  );
}
