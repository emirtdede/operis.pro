"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import {
  Lock,
  Check,
  KeyRound,
  Laptop,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { TextInput } from "@/src/components/ui/text-input";
import { Badge } from "@/src/components/ui/badge";
import { CompanyVerificationCard } from "@/src/components/profile/company-verification-card";
import { getTwoFactorButtonLabel, getSavePasswordButtonLabel } from "../types";

export interface SecuritySettingsTabProps {
  email?: string;
  twoFactorEnabled: boolean;
  locale: string;
  saving: boolean;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  companyData: {
    isCompanyVerified?: boolean;
    companyName?: string | null;
    companyType?: string | null;
    taxOffice?: string | null;
    vknMasked?: string | null;
    companyVerifiedAt?: Date | string | null;
  };
  onCurrentPasswordChange: (val: string) => void;
  onNewPasswordChange: (val: string) => void;
  onConfirmPasswordChange: (val: string) => void;
  onPasswordSubmit: (e: FormEvent) => void;
}

export function SecuritySettingsTab({
  email,
  twoFactorEnabled,
  locale,
  saving,
  currentPassword,
  newPassword,
  confirmPassword,
  companyData,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onPasswordSubmit,
}: SecuritySettingsTabProps) {
  const isTr = locale === "tr";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          <Lock className="h-5 w-5 text-blue-500" />
          <span>{isTr ? "Giriş ve Güvenlik" : "Sign in & security"}</span>
        </h2>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          {isTr
            ? "Hesabınızın erişim bilgilerini, şifrenizi ve iki faktörlü doğrulamayı yönetin."
            : "Manage credentials, password authentication, and 2FA protection."}
        </p>
      </div>

      {/* Birincil E-posta */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-4">
        <div>
          <label className="text-xs font-bold text-[var(--color-text-primary)] block">
            {isTr ? "Birincil E-posta Adresi" : "Primary Email"}
          </label>
          <span className="text-xs text-[var(--color-text-secondary)] font-mono mt-0.5 block">
            {email || "kullanici@operis.pro"}
          </span>
        </div>
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
          <Check className="h-3 w-3 mr-1" />
          {isTr ? "Doğrulandı" : "Verified"}
        </Badge>
      </div>

      {/* İki Faktörlü Doğrulama (2FA) */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-4">
        <div>
          <label className="text-xs font-bold text-[var(--color-text-primary)] block">
            {isTr ? "İki Faktörlü Doğrulama (2FA)" : "Two-Factor Authentication (2FA)"}
          </label>
          <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
            {isTr
              ? "Giriş yaparken mobil doğrulama uygulamasıyla ek güvenlik katmanı sağlar."
              : "Adds an extra layer of protection using authenticator apps."}
          </p>
        </div>
        <Link href={isTr ? "/tr/panel/guvenlik" : "/en/dashboard/security"}>
          <Button variant="outline" size="sm">
            <KeyRound className="h-3.5 w-3.5" />
            <span>{getTwoFactorButtonLabel(twoFactorEnabled, isTr)}</span>
          </Button>
        </Link>
      </div>

      {/* Kurumsal Şirket & Vergi No Doğrulaması */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)]">
        <CompanyVerificationCard
          initialData={companyData}
          locale={locale}
        />
      </div>

      {/* Şifre Değiştirme */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
          {isTr ? "Şifre Değiştirme" : "Change Password"}
        </h3>
        <form onSubmit={onPasswordSubmit} className="space-y-3 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
              {isTr ? "Mevcut Şifre" : "Current Password"}
            </label>
            <TextInput
              type="password"
              value={currentPassword}
              onChange={(e) => onCurrentPasswordChange(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
              {isTr ? "Yeni Şifre" : "New Password"}
            </label>
            <TextInput
              type="password"
              value={newPassword}
              onChange={(e) => onNewPasswordChange(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
              {isTr ? "Yeni Şifre (Tekrar)" : "Confirm New Password"}
            </label>
            <TextInput
              type="password"
              value={confirmPassword}
              onChange={(e) => onConfirmPasswordChange(e.target.value)}
              required
            />
          </div>
          <Button type="submit" variant="primary" size="sm" disabled={saving}>
            {getSavePasswordButtonLabel(saving, isTr)}
          </Button>
        </form>
      </div>

      {/* Aktif Oturumlar */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-2">
        <label className="text-xs font-bold text-[var(--color-text-primary)] block">
          {isTr ? "Mevcut Aktif Oturum" : "Active Session"}
        </label>
        <div className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]">
          <div className="flex items-center gap-3">
            <Laptop className="h-5 w-5 text-blue-400" />
            <div>
              <span className="text-xs font-bold text-[var(--color-text-primary)] block">
                Windows • Chrome Tarayıcı
              </span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {isTr ? "Şu an aktif olan oturumunuz" : "Current active session"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
