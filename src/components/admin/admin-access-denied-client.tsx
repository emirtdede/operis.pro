"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ShieldAlert, Lock, ArrowLeft, UserCheck, Shield, KeyRound } from "lucide-react";
import { BrandLogo } from "@/src/components/layout/brand-logo";

interface AdminAccessDeniedClientProps {
  currentRole?: string;
  errorReason?: string;
}

function getAdminLoginButtonLabel(isPending: boolean, requires2FA: boolean): string {
  if (isPending) {
    return "Doğrulanıyor...";
  }
  if (requires2FA) {
    return "2FA Kodu ile Giriş Yap (Yönetici)";
  }
  return "Sistem Yöneticisi Olarak Giriş Yap";
}

export function AdminAccessDeniedClient({
  currentRole = "USER",
  errorReason = "Standart kullanıcı hesaplarının bu yönetim konsoluna erişim izni bulunmamaktadır.",
}: AdminAccessDeniedClientProps) {
  const [adminKey, setAdminKey] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAdminLogin = (role: "ADMIN" | "SECURITY_ADMIN") => {
    if (!adminEmail.trim()) {
      setErrorMsg("Lütfen yönetici e-posta adresini giriniz.");
      return;
    }
    if (!adminKey.trim()) {
      setErrorMsg("Lütfen güvenlik anahtarını / PIN kodunu giriniz.");
      return;
    }
    if (requires2FA && (!totpCode.trim() || totpCode.trim().length !== 6)) {
      setErrorMsg("Lütfen 6 haneli iki aşamalı doğrulama (TOTP) kodunu eksiksiz giriniz.");
      return;
    }
    setErrorMsg(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adminKey: adminKey.trim(),
            role,
            email: adminEmail.trim(),
            displayName: role === "ADMIN" ? (adminEmail.split("@")[0] || "Yönetici") : "Güvenlik Sorumlusu",
            totpCode: requires2FA ? totpCode.trim() : undefined,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          window.location.reload();
        } else {
          if (data.requires2FA) {
            setRequires2FA(true);
            setErrorMsg(data.error || "İki aşamalı doğrulama (TOTP) kodu gereklidir.");
          } else {
            setErrorMsg(data.error || "Yetkilendirme doğrulanamadı.");
          }
        }
      } catch {
        setErrorMsg("Bağlantı hatası oluştu.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0b0e] flex items-center justify-center p-4 selection:bg-red-600 selection:text-white">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg bg-[#12141a] border border-red-500/30 rounded-3xl p-8 space-y-6 shadow-2xl backdrop-blur-xl">
        {/* Header with Brand and Lock Icon */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <BrandLogo size="sm" showText={true} />
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-[11px] font-semibold">
            <Lock className="h-3.5 w-3.5" />
            <span>403 FORBIDDEN</span>
          </div>
        </div>

        {/* Threat / Warning Box */}
        <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-2">
          <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <span>Yetkisiz Yönetim Girişimi Engellendi</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">{errorReason}</p>
          <div className="flex items-center gap-2 pt-1 font-mono text-[11px]">
            <span className="text-slate-500">Mevcut Oturum Rolü:</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
              {currentRole}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-red-400">Erişim Reddedildi</span>
          </div>
        </div>

        {/* Admin Authentication Box */}
        <div className="space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Yetkili Yönetici Giriş Kapısı
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">
                Yönetici E-Posta
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="yonetici@operis.pro"
                className="w-full bg-[#0d0e12] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500/60"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">
                Güvenlik Anahtarı / PIN
              </label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#0d0e12] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500/60 font-mono"
              />
            </div>

            {requires2FA && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                  <KeyRound className="h-4 w-4" />
                  <span>İki Aşamalı Doğrulama (TOTP) Kodu</span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  autoFocus
                  className="w-full bg-[#0d0e12] border border-amber-500/40 rounded-xl px-3.5 py-2.5 text-center text-sm font-mono tracking-widest text-amber-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
                <p className="text-[10px] text-slate-400">
                  Google/Microsoft Authenticator uygulamanızdaki 6 haneli kodu giriniz.
                </p>
              </div>
            )}

            {/* Authentication Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => handleAdminLogin("ADMIN")}
                disabled={isPending}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer disabled:opacity-50"
              >
                <UserCheck className="h-4 w-4" />
                <span>
                  {getAdminLoginButtonLabel(isPending, requires2FA)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleAdminLogin("SECURITY_ADMIN")}
                disabled={isPending}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Shield className="h-4 w-4 text-red-400" />
                <span>
                  {requires2FA
                    ? "2FA Kodu ile Giriş Yap (Güvenlik)"
                    : "Güvenlik Yöneticisi Olarak Giriş Yap"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
          <Link
            href="/tr"
            className="text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Ana Sayfaya Dön</span>
          </Link>

          <Link
            href="/tr/panel/ilanlarim"
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            Kullanıcı Çalışma Alanı
          </Link>
        </div>
      </div>
    </div>
  );
}
