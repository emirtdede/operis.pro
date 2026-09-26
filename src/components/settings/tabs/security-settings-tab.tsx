"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import {
  Lock,
  Laptop,
  Shield,
  Eye,
  EyeOff,
  LogOut,
  Loader2,
  CheckCircle2,
  History,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { TextInput } from "@/src/components/ui/text-input";
import { Badge } from "@/src/components/ui/badge";
import { getSavePasswordButtonLabel } from "../types";
import { TwoFactorAuthSection } from "@/src/components/security/sections/two-factor-auth-section";
import type { SecurityFeedback } from "@/src/components/security/types";

export interface SecuritySettingsTabProps {
  twoFactorEnabled: boolean;
  locale: string;
  saving: boolean;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  onCurrentPasswordChange: (val: string) => void;
  onNewPasswordChange: (val: string) => void;
  onConfirmPasswordChange: (val: string) => void;
  onPasswordSubmit: (e: FormEvent) => void;
  onFeedback?: (feedback: SecurityFeedback) => void;
}

export function SecuritySettingsTab({
  twoFactorEnabled,
  locale,
  saving,
  currentPassword,
  newPassword,
  confirmPassword,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onPasswordSubmit,
  onFeedback,
}: SecuritySettingsTabProps) {
  const isTr = locale === "tr";

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [loggingOutOthers, setLoggingOutOthers] = useState(false);
  const [loggedOutMessage, setLoggedOutMessage] = useState<string | null>(null);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<
    Array<{
      id: string;
      eventType: string;
      label: string;
      ipAddress: string;
      createdAt: string;
    }>
  >([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchAuditLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await fetch("/api/account/audit-logs", {
        headers: { "x-locale": locale },
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch {
      // Non-blocking
    } finally {
      setLogsLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Password strength calculation
  const hasMinLen = newPassword.length >= 12;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

  const passedCriteria = [hasMinLen, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  const strengthColor =
    passedCriteria <= 1
      ? "bg-red-500"
      : passedCriteria === 2
      ? "bg-amber-500"
      : passedCriteria === 3
      ? "bg-blue-500"
      : "bg-emerald-500";

  const handleLogoutOtherSessions = async () => {
    setLoggingOutOthers(true);
    setLoggedOutMessage(null);
    try {
      const res = await fetch("/api/auth/logout-other-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-locale": locale },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed");
      }
      setLoggedOutMessage(
        data.message ||
          (isTr
            ? "Bu cihaz haricindeki diğer tüm aktif oturumlar başarıyla sonlandırıldı."
            : "All other active sessions have been terminated.")
      );
      fetchAuditLogs();
    } catch {
      setLoggedOutMessage(
        isTr
          ? "Oturumlar sonlandırılırken bir hata oluştu."
          : "Failed to terminate other sessions."
      );
    } finally {
      setLoggingOutOthers(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          <Lock className="h-5 w-5 text-blue-500" />
          <span>{isTr ? "Giriş ve Hesap Güvenliği" : "Sign-in & Security"}</span>
        </h2>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          {isTr
            ? "Hesabınızın erişim şifresini, iki faktörlü doğrulamayı ve aktif oturumları yönetin."
            : "Manage your credentials, two-factor authentication, and monitor active devices."}
        </p>
      </div>

      {/* 1. İki Faktörlü Doğrulama (2FA) */}
      <TwoFactorAuthSection
        locale={locale}
        twoFactorEnabled={twoFactorEnabled}
        onFeedback={onFeedback || (() => {})}
      />

      {/* 2. Şifre Değiştirme Formu */}
      <form onSubmit={onPasswordSubmit} className="pt-4 border-t border-[var(--color-border-subtle)] space-y-4">
        <label className="text-xs font-bold text-[var(--color-text-primary)] block">
          {isTr ? "Şifre Değiştir" : "Change Password"}
        </label>

        <div className="space-y-3">
          {/* Mevcut Şifre */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-[var(--color-text-secondary)]">
                {isTr ? "Mevcut Şifre" : "Current Password"}
              </label>
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="text-[10px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] flex items-center gap-1 cursor-pointer"
              >
                {showCurrentPass ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                <span>{showCurrentPass ? (isTr ? "Gizle" : "Hide") : (isTr ? "Göster" : "Show")}</span>
              </button>
            </div>
            <TextInput
              type={showCurrentPass ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => onCurrentPasswordChange(e.target.value)}
              placeholder="••••••••••••"
              className="text-xs font-mono"
            />
          </div>

          {/* Yeni Şifre & Onay */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-[var(--color-text-secondary)]">
                  {isTr ? "Yeni Şifre" : "New Password"}
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="text-[10px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] flex items-center gap-1 cursor-pointer"
                >
                  {showNewPass ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  <span>{showNewPass ? (isTr ? "Gizle" : "Hide") : (isTr ? "Göster" : "Show")}</span>
                </button>
              </div>
              <TextInput
                type={showNewPass ? "text" : "password"}
                value={newPassword}
                onChange={(e) => onNewPasswordChange(e.target.value)}
                placeholder="••••••••••••"
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[var(--color-text-secondary)] block">
                {isTr ? "Yeni Şifre (Tekrar)" : "Confirm New Password"}
              </label>
              <TextInput
                type={showNewPass ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => onConfirmPasswordChange(e.target.value)}
                placeholder="••••••••••••"
                className="text-xs font-mono"
              />
            </div>
          </div>

          {/* Şifre Güç Göstergesi */}
          {newPassword && (
            <div className="space-y-1.5 p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/20">
              <div className="h-1.5 w-full bg-[var(--color-surface-base)] rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${strengthColor}`}
                  style={{ width: `${(passedCriteria / 4) * 100}%` }}
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[10px]">
                <span className={hasMinLen ? "text-emerald-400" : "text-[var(--color-text-tertiary)]"}>
                  {hasMinLen ? "✓" : "○"} {isTr ? "En az 12 karakter" : "Min 12 chars"}
                </span>
                <span className={hasUpper ? "text-emerald-400" : "text-[var(--color-text-tertiary)]"}>
                  {hasUpper ? "✓" : "○"} {isTr ? "Büyük harf" : "Uppercase"}
                </span>
                <span className={hasNumber ? "text-emerald-400" : "text-[var(--color-text-tertiary)]"}>
                  {hasNumber ? "✓" : "○"} {isTr ? "Rakam" : "Number"}
                </span>
                <span className={hasSpecial ? "text-emerald-400" : "text-[var(--color-text-tertiary)]"}>
                  {hasSpecial ? "✓" : "○"} {isTr ? "Özel karakter" : "Special char"}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={saving || !currentPassword || !newPassword || !confirmPassword}
            className="cursor-pointer text-xs"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                <span>{getSavePasswordButtonLabel(saving, isTr)}</span>
              </>
            ) : (
              <span>{getSavePasswordButtonLabel(saving, isTr)}</span>
            )}
          </Button>
        </div>
      </form>

      {/* 3. Aktif Oturumlar ve Cihazlar */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
            <Laptop className="h-4 w-4 text-emerald-400" />
            <span>{isTr ? "Aktif Cihazlar ve Oturumlar" : "Active Sessions & Devices"}</span>
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogoutOtherSessions}
            disabled={loggingOutOthers}
            className="text-[11px] gap-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
          >
            {loggingOutOthers ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <LogOut className="h-3 w-3" />
            )}
            <span>{isTr ? "Diğer Oturumları Kapat" : "Log out other sessions"}</span>
          </Button>
        </div>

        {loggedOutMessage && (
          <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{loggedOutMessage}</span>
          </div>
        )}

        <div className="p-3.5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--color-text-primary)]">
                  {isTr ? "Mevcut Oturum (Bu Cihaz)" : "Current Session (This Device)"}
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
                {isTr
                  ? "HTTP-Only Güvenli Oturum Çerezi ve CSRF Koruması aktif"
                  : "Protected with HTTP-Only secure cookies and CSRF defense"}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
            {isTr ? "Canlı" : "Active"}
          </Badge>
        </div>
      </div>

      {/* 4. Hesap Güvenlik ve İşlem Günlüğü (Audit Log) */}
      <div className="pt-6 border-t border-[var(--color-border-subtle)] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
              <History className="h-4 w-4 text-blue-400" />
              <span>{isTr ? "Hesap İşlem ve Güvenlik Günlüğü" : "Account Security & Audit Log"}</span>
            </label>
            <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
              {isTr
                ? "Hesabınızda gerçekleştirilen son güvenlik, şifre ve profil değişiklikleri."
                : "Recent authentication, credential, and profile modifications on your account."}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchAuditLogs}
            disabled={logsLoading}
            className="text-[11px] gap-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${logsLoading ? "animate-spin" : ""}`} />
            <span>{isTr ? "Yenile" : "Refresh"}</span>
          </Button>
        </div>

        {logsLoading && auditLogs.length === 0 ? (
          <div className="p-4 text-center text-xs text-[var(--color-text-tertiary)] flex items-center justify-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>{isTr ? "İşlem günlüğü yükleniyor..." : "Loading activity log..."}</span>
          </div>
        ) : auditLogs.length > 0 ? (
          <div className="rounded-2xl border border-[var(--color-border-subtle)] overflow-hidden divide-y divide-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/20">
            {auditLogs.map((log) => {
              const dateStr = new Date(log.createdAt).toLocaleString(isTr ? "tr-TR" : "en-US", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <div key={log.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ShieldCheck className="h-4 w-4 text-blue-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-[var(--color-text-primary)] truncate">
                        {log.label}
                      </div>
                      <div className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
                        IP: {log.ipAddress}
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-[var(--color-text-tertiary)] shrink-0 font-mono">
                    {dateStr}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/20 text-center text-xs text-[var(--color-text-tertiary)]">
            {isTr
              ? "Henüz kaydedilmiş bir güvenlik işlemi bulunmuyor."
              : "No recent security activity recorded yet."}
          </div>
        )}
      </div>
    </div>
  );
}
