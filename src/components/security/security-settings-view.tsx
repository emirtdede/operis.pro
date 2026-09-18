"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Lock,
  Shield,
  Smartphone,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Laptop,
  Trash2,
  AlertTriangle,
  X,
  Copy,
  Download,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "../ui/button";
import { TextInput } from "../ui/text-input";
import { TextArea } from "../ui/text-area";
import { Badge } from "../ui/badge";

export interface SecuritySettingsViewProps {
  locale: string;
  twoFactorEnabled: boolean;
}

interface ExportJobState {
  jobId: string;
  status: "QUEUED" | "PENDING" | "PROCESSING" | "READY" | "FAILED" | "EXPIRED";
  progressPercent: number;
  downloadUrl?: string;
  fileSizeBytes?: number;
  sha256Checksum?: string;
}

export function SecuritySettingsView({ locale, twoFactorEnabled }: SecuritySettingsViewProps) {
  const isTr = locale === "tr";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);

  const [is2FAEnabled, setIs2FAEnabled] = useState(twoFactorEnabled);
  const [is2FALoading, setIs2FALoading] = useState(false);
  const [is2FASetupModalOpen, setIs2FASetupModalOpen] = useState(false);
  const [is2FADisableModalOpen, setIs2FADisableModalOpen] = useState(false);
  const [setupSecret, setSetupSecret] = useState("");
  const [_setupOtpUri, setSetupOtpUri] = useState("");
  const [setupTotpCode, setSetupTotpCode] = useState("");
  const [disableAuthInput, setDisableAuthInput] = useState("");
  const [setupError, setSetupError] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isBackupCodesModalOpen, setIsBackupCodesModalOpen] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteTotpCode, setDeleteTotpCode] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteModalError, setDeleteModalError] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);
  const [exportJob, setExportJob] = useState<ExportJobState | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollAbortControllerRef = useRef<AbortController | null>(null);
  const consecutivePollErrorsRef = useRef(0);
  const isPollingInFlightRef = useRef(false);

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (pollAbortControllerRef.current) {
      pollAbortControllerRef.current.abort();
      pollAbortControllerRef.current = null;
    }
    isPollingInFlightRef.current = false;
  };

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setFeedback({
        type: "error",
        message: isTr ? "Yeni şifreler eşleşmiyor." : "New passwords do not match.",
      });
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({ currentPassword, newPassword, locale }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.error || (isTr ? "Şifre değiştirilemedi." : "Failed to change password.")
        );

      setFeedback({
        type: "success",
        message: isTr ? "Şifreniz başarıyla değiştirildi." : "Password successfully updated.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error ? err.message : isTr ? "İşlem başarısız oldu." : "Operation failed.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle2FA = async () => {
    if (is2FAEnabled) {
      setDisableAuthInput("");
      setSetupError(null);
      setIs2FADisableModalOpen(true);
      return;
    }

    setIs2FALoading(true);
    setSetupError(null);
    try {
      const res = await fetch("/api/auth/2fa", {
        headers: { "x-locale": locale },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "2FA kurulumu başlatılamadı.");

      setSetupSecret(data.secret);
      setSetupOtpUri(data.otpAuthUri || "");
      setSetupTotpCode("");
      setIs2FASetupModalOpen(true);
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "2FA kurulum bilgisi alınamadı.",
      });
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleConfirmEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupTotpCode.trim() || setupTotpCode.trim().length !== 6) {
      setSetupError(
        isTr ? "Lütfen 6 haneli doğrulama kodunu giriniz." : "Please enter the 6-digit code."
      );
      return;
    }

    setIs2FALoading(true);
    setSetupError(null);

    try {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({
          enabled: true,
          secret: setupSecret,
          totpCode: setupTotpCode.trim(),
          locale,
        }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || (isTr ? "2FA doğrulanamadı." : "Failed to verify 2FA."));

      setIs2FAEnabled(true);
      setIs2FASetupModalOpen(false);
      if (Array.isArray(data.backupCodes) && data.backupCodes.length > 0) {
        setBackupCodes(data.backupCodes);
        setIsBackupCodesModalOpen(true);
      }
      setFeedback({
        type: "success",
        message: isTr
          ? "İki aşamalı doğrulama (2FA) başarıyla aktif edildi."
          : "Two-factor authentication enabled successfully.",
      });
    } catch (err: unknown) {
      setSetupError(err instanceof Error ? err.message : "Doğrulama hatası.");
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleCopyBackupCodes = () => {
    if (backupCodes.length === 0) return;
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2500);
  };

  const handleDownloadBackupCodes = () => {
    if (backupCodes.length === 0) return;
    const content = `OPERIS - 2FA ACIL DURUM YEDEK KURTARMA KODLARI\nOlusturulma Tarihi: ${new Date().toISOString()}\n\nHer kod tek kullanimliktir. Authenticator uygulamaniza erisemediginizde bu kodlardan biriyle giris yapabilirsiniz:\n\n${backupCodes.map((c, i) => `${i + 1}. ${c}`).join("\n")}\n\nLutfen bu dosyayi guvenli bir yerde saklayiniz.`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "operis-2fa-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disableAuthInput.trim()) {
      setSetupError(
        isTr
          ? "Lütfen şifrenizi veya 2FA kodunuzu giriniz."
          : "Please enter your password or 2FA code."
      );
      return;
    }

    setIs2FALoading(true);
    setSetupError(null);

    try {
      const isOtp = /^\d{6}$/.test(disableAuthInput.trim());
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({
          enabled: false,
          password: !isOtp ? disableAuthInput.trim() : undefined,
          totpCode: isOtp ? disableAuthInput.trim() : undefined,
          locale,
        }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || (isTr ? "2FA kapatılamadı." : "Failed to disable 2FA."));

      setIs2FAEnabled(false);
      setIs2FADisableModalOpen(false);
      setFeedback({
        type: "success",
        message: isTr
          ? "İki aşamalı doğrulama devre dışı bırakıldı."
          : "Two-factor authentication disabled.",
      });
    } catch (err: unknown) {
      setSetupError(err instanceof Error ? err.message : "Doğrulama hatası.");
    } finally {
      setIs2FALoading(false);
    }
  };

  const startPolling = (jobId: string) => {
    stopPolling();
    consecutivePollErrorsRef.current = 0;

    const poll = async () => {
      if (isPollingInFlightRef.current) return;
      isPollingInFlightRef.current = true;

      const abortController = new AbortController();
      pollAbortControllerRef.current = abortController;

      try {
        const res = await fetch(`/api/account/export?jobId=${encodeURIComponent(jobId)}`, {
          headers: { "x-locale": locale },
          signal: abortController.signal,
        });

        // 401 / 403: Stop polling immediately (unauthorized)
        if (res.status === 401 || res.status === 403) {
          stopPolling();
          setIsExportingData(false);
          setFeedback({
            type: "error",
            message: isTr
              ? "Oturum süreniz doldu. Lütfen tekrar giriş yapınız."
              : "Session expired. Please sign in again.",
          });
          return;
        }

        // 429: Respect Retry-After
        if (res.status === 429) {
          const retryAfterHeader = res.headers.get("Retry-After");
          const retrySeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 5;
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          pollTimerRef.current = setInterval(poll, Math.max(3000, retrySeconds * 1000));
          return;
        }

        if (!res.ok) {
          consecutivePollErrorsRef.current++;
          const errData = await res.json().catch(() => ({}));
          if (consecutivePollErrorsRef.current >= 5) {
            stopPolling();
            setIsExportingData(false);
            setFeedback({
              type: "error",
              message:
                errData.error ||
                (isTr
                  ? "Sunucu bağlantısı sağlanamadı. Lütfen daha sonra tekrar deneyiniz."
                  : "Unable to connect to server. Please try again later."),
            });
            return;
          }
          throw new Error(errData.error || "Failed to poll export status");
        }

        consecutivePollErrorsRef.current = 0;

        const data = await res.json();
        const job = data.job || data;
        const currentJobId = job.jobId || job.id;
        if (!currentJobId) return;

        const currentStatus = job.status as ExportJobState["status"];
        const progress = job.progressPercent ?? job.progress ?? 0;
        const downloadUrl =
          job.downloadUrl ||
          (currentStatus === "READY"
            ? `/api/account/export?jobId=${encodeURIComponent(currentJobId)}&download=1`
            : undefined);
        const sha256Checksum = job.sha256Checksum || job.checksumSha256;

        setExportJob({
          jobId: currentJobId,
          status: currentStatus,
          progressPercent: progress,
          downloadUrl,
          fileSizeBytes: job.fileSizeBytes,
          sha256Checksum,
        });

        if (currentStatus === "READY") {
          stopPolling();
          setIsExportingData(false);
          setFeedback({
            type: "success",
            message: isTr
              ? "Veri aktarım arşiviniz hazırlandı. İndirme başlatılıyor..."
              : "Data export archive prepared. Starting download...",
          });
          if (downloadUrl) {
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = `operis-data-export-${currentJobId}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        } else if (currentStatus === "FAILED") {
          stopPolling();
          setIsExportingData(false);
          setFeedback({
            type: "error",
            message:
              data.error ||
              (isTr
                ? "Veri aktarımı başarısız oldu. Lütfen tekrar deneyin."
                : "Data export failed. Please try again."),
          });
        } else if (currentStatus === "EXPIRED") {
          stopPolling();
          setIsExportingData(false);
          setFeedback({
            type: "warning",
            message: isTr
              ? "Veri aktarım dosyasının süresi doldu. Lütfen yeni bir istek başlatın."
              : "Data export expired. Please start a new request.",
          });
        }
      } catch {
        if (abortController.signal.aborted) return;
        consecutivePollErrorsRef.current++;
        if (consecutivePollErrorsRef.current >= 5) {
          stopPolling();
          setIsExportingData(false);
          setFeedback({
            type: "error",
            message: isTr
              ? "Bağlantı hatası: Durum sorgulanamıyor. Lütfen tekrar deneyiniz."
              : "Network error: Unable to check status. Please try again.",
          });
        }
      } finally {
        isPollingInFlightRef.current = false;
      }
    };

    poll();
    pollTimerRef.current = setInterval(poll, 2500);
  };

  const handleCancelExport = async () => {
    if (!exportJob?.jobId) return;
    const targetJobId = exportJob.jobId;
    stopPolling();
    setIsExportingData(false);

    try {
      const res = await fetch(`/api/account/export?jobId=${encodeURIComponent(targetJobId)}`, {
        method: "DELETE",
        headers: { "x-locale": locale },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || (isTr ? "İptal işlemi başarısız oldu." : "Failed to cancel export.")
        );
      }

      setExportJob((prev) => (prev ? { ...prev, status: "FAILED" } : null));
      setFeedback({
        type: "success",
        message: isTr
          ? "Veri aktarım işi başarıyla iptal edildi."
          : "Export job cancelled successfully.",
      });
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error ? err.message : isTr ? "İptal edilemedi." : "Cancellation failed.",
      });
    }
  };

  const handleExportData = async () => {
    setIsExportingData(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/account/export", {
        method: "POST",
        headers: { "x-locale": locale },
      });
      const data = await res.json();
      if (!res.ok && res.status !== 202 && res.status !== 409) {
        throw new Error(
          data.error || (isTr ? "Veri aktarımı başlatılamadı." : "Failed to initiate data export.")
        );
      }

      const jobId = data.jobId || data.job?.id;
      if (!jobId) {
        throw new Error(isTr ? "Geçersiz iş kimliği alındı." : "Invalid job id received.");
      }

      setExportJob({
        jobId,
        status: (data.status as ExportJobState["status"]) || "PENDING",
        progressPercent: data.progressPercent ?? data.progress ?? 0,
      });

      setFeedback({
        type: "success",
        message: data.alreadyRunning
          ? isTr
            ? "Mevcut veri aktarım görevi takip ediliyor..."
            : "Tracking existing active export job..."
          : isTr
            ? "Veri aktarım görevi sıraya alındı. Hazırlandığında otomatik indirilecektir."
            : "Data export job queued. It will download automatically once ready.",
      });

      startPolling(jobId);
    } catch (err: unknown) {
      setIsExportingData(false);
      setFeedback({
        type: "error",
        message:
          err instanceof Error ? err.message : isTr ? "Veri indirme hatası." : "Export failed.",
      });
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteModalError(null);
    const expectedConfirm = isTr ? "HESABIMI SİL" : "DELETE";
    if (deleteConfirmText.trim() !== expectedConfirm) {
      setDeleteModalError(
        isTr
          ? `Lütfen onaylamak için tam olarak "${expectedConfirm}" yazınız.`
          : `Please type exactly "${expectedConfirm}" to confirm.`
      );
      return;
    }

    if (!deletePassword.trim()) {
      setDeleteModalError(
        isTr
          ? "Hesabınızı silmek için şifrenizi girmeniz zorunludur."
          : "Your account password is required to delete your account."
      );
      return;
    }

    const trimmedTotp = deleteTotpCode.trim();
    if (is2FAEnabled && (!trimmedTotp || (trimmedTotp.length !== 6 && trimmedTotp.length !== 8))) {
      setDeleteModalError(
        isTr
          ? "Lütfen 6 haneli iki aşamalı doğrulama (TOTP) kodunu veya 8 haneli kurtarma kodunuzu giriniz."
          : "Please enter your 6-digit 2FA code or 8-character recovery backup code."
      );
      return;
    }

    setIsDeletingAccount(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({
          password: deletePassword.trim(),
          totpCode: is2FAEnabled ? deleteTotpCode.trim() : undefined,
          reason: deleteReason.trim(),
          locale,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isTr ? "Hesap silinemedi." : "Failed to delete account."));
      }

      setIsDeleteModalOpen(false);
      setFeedback({
        type: "success",
        message: isTr
          ? "Hesabınız ve kişisel verileriniz kalıcı olarak silindi. Yönlendiriliyorsunuz..."
          : "Your account and personal data have been permanently deleted. Redirecting...",
      });

      setTimeout(() => {
        window.location.href = isTr ? "/tr" : "/en";
      }, 1200);
    } catch (err: unknown) {
      setDeleteModalError(
        err instanceof Error
          ? err.message
          : isTr
            ? "Hesap silme işlemi başarısız oldu."
            : "Account deletion failed."
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-8">
      {feedback && (
        <div
          className={`flex items-center gap-3 rounded-2xl border p-4 text-xs ${
            feedback.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : feedback.type === "warning"
                ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                : "border-red-500/20 bg-red-500/10 text-red-400"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Section 1: Password Change */}
      <form
        onSubmit={handlePasswordChange}
        className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-6 sm:p-7 space-y-4 shadow-sm"
      >
        <h2 className="text-base font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <Lock className="h-4 w-4 text-blue-400" aria-hidden="true" />
          <span>{isTr ? "Şifre Değiştir" : "Change Password"}</span>
        </h2>

        <div className="space-y-3 max-w-md">
          <TextInput
            label={isTr ? "Mevcut Şifreniz" : "Current Password"}
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            startIcon={<KeyRound className="h-4 w-4" aria-hidden="true" />}
          />

          <TextInput
            label={isTr ? "Yeni Şifre" : "New Password"}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            startIcon={<Lock className="h-4 w-4" aria-hidden="true" />}
          />

          <TextInput
            label={isTr ? "Yeni Şifre (Tekrar)" : "Confirm New Password"}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            startIcon={<Lock className="h-4 w-4" aria-hidden="true" />}
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="font-semibold text-xs px-6"
            isLoading={isLoading}
          >
            {isTr ? "Şifreyi Güncelle" : "Update Password"}
          </Button>
        </div>
      </form>

      {/* Section 2: Two-Factor Authentication (2FA) */}
      <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-6 sm:p-7 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-purple-400" aria-hidden="true" />
              <span>
                {isTr ? "İki Aşamalı Doğrulama (2FA - TOTP)" : "Two-Factor Authentication (2FA)"}
              </span>
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed max-w-xl">
              {isTr
                ? "Giriş yaparken şifrenize ek olarak Google Authenticator veya 1Password uygulamanızdan 6 haneli tek kullanımlık kod istenir."
                : "Require a 6-digit TOTP verification code from your authenticator app on every login."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant={is2FAEnabled ? "primary" : "outline"} size="sm">
              {is2FAEnabled ? (isTr ? "AKTİF" : "ENABLED") : isTr ? "DEVRE DIŞI" : "DISABLED"}
            </Badge>

            <Button
              type="button"
              variant={is2FAEnabled ? "outline" : "primary"}
              size="sm"
              onClick={handleToggle2FA}
              isLoading={is2FALoading}
              className="text-xs font-semibold"
            >
              {is2FAEnabled
                ? isTr
                  ? "Devre Dışı Bırak"
                  : "Disable 2FA"
                : isTr
                  ? "2FA Kur & Etkinleştir"
                  : "Setup 2FA"}
            </Button>
          </div>
        </div>
      </div>

      {/* Section 3: Active Sessions & Audit */}
      <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-6 sm:p-7 space-y-4 shadow-sm">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <Laptop className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          <span>
            {isTr ? "Aktif Oturum ve Güvenlik Durumu" : "Active Session & Security Status"}
          </span>
        </h2>

        <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Shield className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-[var(--color-text-primary)]">
                {isTr ? "Mevcut Oturum (Bu Cihaz)" : "Current Session (This Device)"}
              </p>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                {isTr
                  ? "HTTP-Only Güvenli Oturum Çerezi ile korunuyor"
                  : "Secured with HTTP-Only cookie"}
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{isTr ? "Canlı" : "Active"}</span>
          </span>
        </div>
      </div>

      {/* Section 4: KVKK & GDPR Data Portability */}
      <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-6 sm:p-7 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <Download className="h-4 w-4 text-[var(--color-brand-primary)]" aria-hidden="true" />
              <span>
                {isTr ? "KVKK & GDPR: Kişisel Veri İndirme" : "KVKK & GDPR: Data Portability"}
              </span>
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed max-w-xl">
              {isTr
                ? "Operis üzerindeki profil, kimlik doğrulama, ilan, teklif, eşleşme ve güvenlik günlüğü kayıtlarınızın tamamını JSON formatında indirebilirsiniz."
                : "Download a machine-readable JSON copy of all your personal profile, encrypted identity, listings, proposals, matches, and security audit records."}
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleExportData}
            isLoading={isExportingData}
            disabled={isExportingData}
            className="text-xs font-semibold gap-1.5 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isTr ? "Verilerimi İndir (.json)" : "Download My Data (.json)"}</span>
          </Button>
        </div>

        {exportJob && (
          <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/50 p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {exportJob.status === "QUEUED" ||
                exportJob.status === "PENDING" ||
                exportJob.status === "PROCESSING" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--color-brand-primary)]" />
                ) : exportJob.status === "READY" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                )}
                <span className="font-medium text-[var(--color-text-primary)]">
                  {exportJob.status === "QUEUED" || exportJob.status === "PENDING"
                    ? isTr
                      ? "Dışa aktarım sıraya alındı..."
                      : "Export queued..."
                    : exportJob.status === "PROCESSING"
                      ? isTr
                        ? `Veriler hazırlanıyor (%${exportJob.progressPercent})...`
                        : `Preparing data (${exportJob.progressPercent}%)...`
                      : exportJob.status === "READY"
                        ? isTr
                          ? "Veri aktarımı tamamlandı ve hazır."
                          : "Data export ready."
                        : exportJob.status === "EXPIRED"
                          ? isTr
                            ? "Dosya süresi doldu."
                            : "Export expired."
                          : isTr
                            ? "Dışa aktarım başarısız oldu."
                            : "Export failed."}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {exportJob.fileSizeBytes !== undefined && (
                  <span className="text-[var(--color-text-secondary)]">
                    {(exportJob.fileSizeBytes / 1024).toFixed(1)} KB
                  </span>
                )}
                {(exportJob.status === "QUEUED" ||
                  exportJob.status === "PENDING" ||
                  exportJob.status === "PROCESSING") && (
                  <button
                    type="button"
                    onClick={handleCancelExport}
                    className="text-[11px] font-medium text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    {isTr ? "İptal Et" : "Cancel"}
                  </button>
                )}
              </div>
            </div>

            {exportJob.status === "PROCESSING" && (
              <div className="w-full bg-[var(--color-border-subtle)] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[var(--color-brand-primary)] h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(5, exportJob.progressPercent)}%` }}
                />
              </div>
            )}

            {exportJob.status === "READY" && exportJob.downloadUrl && (
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-[var(--color-text-tertiary)] truncate max-w-xs">
                  SHA-256:{" "}
                  {exportJob.sha256Checksum
                    ? `${exportJob.sha256Checksum.slice(0, 16)}...`
                    : isTr
                      ? "Doğrulandı"
                      : "Verified"}
                </span>
                <a
                  href={exportJob.downloadUrl}
                  download={`operis-data-export-${exportJob.jobId}.json`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-brand-primary)] hover:underline"
                >
                  <Download className="h-3.5 w-3.5" />
                  {isTr ? "Tekrar İndir" : "Download Again"}
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 5: Danger Zone - Account Deletion */}
      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 backdrop-blur-xl p-6 sm:p-7 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" aria-hidden="true" />
              <span>
                {isTr
                  ? "Tehlikeli Bölge: Hesabı ve Verileri Sil"
                  : "Danger Zone: Delete Account & Data"}
              </span>
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed max-w-xl">
              {isTr
                ? "KVKK ve GDPR gereğince profil bilgileriniz, şifreli kimlik kayıtlarınız ve taslak ilanlarınız kalıcı olarak temizlenir. Bu işlem geri alınamaz."
                : "Under GDPR and KVKK, your public profile, encrypted identity records, and draft listings will be permanently purged. This action cannot be undone."}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setIsDeleteModalOpen(true);
              setDeleteConfirmText("");
              setDeletePassword("");
              setDeleteTotpCode("");
              setDeleteReason("");
              setDeleteModalError(null);
            }}
            className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500/60 text-xs font-semibold gap-1.5 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isTr ? "Hesabımı Sil" : "Delete My Account"}</span>
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label={isTr ? "Hesap Silme Onayı" : "Account Deletion Confirmation"}
        >
          <div className="relative w-full max-w-md max-h-[min(92dvh,calc(100dvh-2rem))] flex flex-col overflow-hidden rounded-2xl border border-red-500/30 bg-[var(--color-surface-base)] p-4 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3 shrink-0">
              <div className="flex items-center gap-2.5 text-red-400">
                <div className="h-9 w-9 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center shrink-0">
                  <Trash2 className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                    {isTr ? "Hesabınızı Silmek Üzeresiniz" : "Confirm Account Deletion"}
                  </h3>
                  <p className="text-[11px] text-[var(--color-text-tertiary)]">
                    {isTr ? "Geri Alınamaz İşlem" : "Permanent & Irreversible"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="p-1 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
                aria-label={isTr ? "Kapat" : "Close"}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleDeleteAccount} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto min-h-0 py-3 space-y-4 pr-1">
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {isTr
                    ? "Hesabınızı sildiğinizde açık teklifleriniz geri çekilecek, aktif ilanlarınız sonlandırılacak ve profiliniz 'Eski Kullanıcı' olarak anonimleştirilecektir. Devam eden veya uyuşmazlık incelemesindeki projeleriniz varsa silme işlemi engellenecektir."
                    : "Deleting your account will withdraw pending proposals, conclude active listings, and anonymize your profile. If you have active or disputed engagements, account deletion will be blocked."}
                </p>

                {deleteModalError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-400">
                    {deleteModalError}
                  </div>
                )}

                <TextInput
                  label={isTr ? "Hesap Şifreniz" : "Account Password"}
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  startIcon={<Lock className="h-4 w-4" aria-hidden="true" />}
                />

                {is2FAEnabled && (
                  <TextInput
                    label={
                      isTr
                        ? "2FA Kodu veya 8 Haneli Kurtarma Kodu"
                        : "2FA Code or 8-Character Backup Code"
                    }
                    type="text"
                    maxLength={8}
                    value={deleteTotpCode}
                    onChange={(e) => setDeleteTotpCode(e.target.value.trim().slice(0, 8))}
                    placeholder={isTr ? "123456 veya abcd1234" : "123456 or abcd1234"}
                    required
                    startIcon={<KeyRound className="h-4 w-4" aria-hidden="true" />}
                  />
                )}

                <TextArea
                  label={isTr ? "Ayrılma Nedeni (İsteğe Bağlı)" : "Reason for Leaving (Optional)"}
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  rows={2}
                  placeholder={
                    isTr ? "Operis deneyiminizi nasıl geliştirebiliriz?" : "How could we improve?"
                  }
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                    {isTr
                      ? 'Onaylamak için lütfen "HESABIMI SİL" yazınız:'
                      : 'Please type "DELETE" to confirm:'}
                  </label>
                  <TextInput
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={isTr ? "HESABIMI SİL" : "DELETE"}
                    required
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[var(--color-border-subtle)] shrink-0">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeletingAccount}
                >
                  {isTr ? "Vazgeç" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={
                    isDeletingAccount ||
                    !deletePassword.trim() ||
                    (is2FAEnabled &&
                      deleteTotpCode.trim().length !== 6 &&
                      deleteTotpCode.trim().length !== 8) ||
                    deleteConfirmText.trim() !== (isTr ? "HESABIMI SİL" : "DELETE")
                  }
                  isLoading={isDeletingAccount}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold cursor-pointer"
                >
                  {isTr ? "Kalıcı Olarak Sil" : "Permanently Delete"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {is2FASetupModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label={isTr ? "2FA Kurulumu" : "2FA Setup"}
        >
          <div className="relative w-full max-w-md max-h-[min(92dvh,calc(100dvh-2rem))] flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3 shrink-0">
              <div className="flex items-center gap-2.5 text-purple-400">
                <Smartphone className="h-5 w-5" aria-hidden="true" />
                <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">
                  {isTr ? "İki Aşamalı Doğrulama Kurulumu" : "Two-Factor Authentication Setup"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIs2FASetupModalOpen(false)}
                className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmEnable2FA} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto min-h-0 py-3 space-y-4 pr-1">
                {setupError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                    {setupError}
                  </div>
                )}

                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {isTr
                    ? "Google Authenticator veya 1Password uygulamanıza aşağıdaki gizli anahtarı manuel ekleyin veya taratın:"
                    : "Add the following secret key to your Authenticator app (Google Authenticator, 1Password):"}
                </p>

                <div className="p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] font-mono text-center text-sm tracking-wider text-purple-400 select-all break-all">
                  {setupSecret}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                    {isTr ? "Uygulamadaki 6 Haneli Kod" : "6-Digit Authenticator Code"}
                  </label>
                  <TextInput
                    value={setupTotpCode}
                    onChange={(e) => setSetupTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    required
                    className="text-center font-mono text-base tracking-widest"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[var(--color-border-subtle)] shrink-0">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIs2FASetupModalOpen(false)}
                  disabled={is2FALoading}
                >
                  {isTr ? "Vazgeç" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={is2FALoading}
                  disabled={setupTotpCode.length !== 6}
                >
                  {isTr ? "Doğrula ve Etkinleştir" : "Verify & Enable"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2FA Backup Codes Display Modal */}
      {isBackupCodesModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label={isTr ? "2FA Kurtarma Kodları" : "2FA Backup Codes"}
        >
          <div className="relative w-full max-w-lg max-h-[min(92dvh,calc(100dvh-2rem))] flex flex-col overflow-hidden rounded-2xl border border-emerald-500/30 bg-[var(--color-surface-base)] p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-4 shrink-0">
              <div className="flex items-center gap-2.5 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">
                  {isTr ? "2FA Acil Durum Kurtarma Kodları" : "Emergency Backup Codes"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBackupCodesModalOpen(false)}
                className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 py-4 space-y-4 pr-1">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">
                    {isTr ? "Bu kodları güvenli bir yerde saklayınız!" : "Save these codes securely!"}
                  </p>
                  <p className="opacity-90 leading-relaxed">
                    {isTr
                      ? "Telefonunuzu kaybeder veya Authenticator uygulamanıza erişemezseniz hesabınıza bu 8 haneli tek kullanımlık kodlarla giriş yapabilirsiniz. Her kod yalnızca 1 kez geçerlidir."
                      : "If you lose your phone or cannot access your Authenticator app, you can log in using these single-use codes. Each code can be used only once."}
                  </p>
                </div>
              </div>

              {/* 10 Backup Codes Grid */}
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                {backupCodes.map((code, idx) => (
                  <div
                    key={idx}
                    className="font-mono text-xs font-semibold tracking-wider text-slate-200 bg-slate-900/90 py-1.5 px-3 rounded border border-slate-800 text-center select-all"
                  >
                    <span className="text-slate-500 text-[10px] mr-1.5">{idx + 1}.</span>
                    {code}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex flex-wrap items-center justify-between gap-2.5 border-t border-[var(--color-border-subtle)] shrink-0">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyBackupCodes}
                  className="inline-flex items-center gap-1.5 text-xs flex-1 sm:flex-none"
                >
                  {copiedCodes ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">{isTr ? "Kopyalandı!" : "Copied!"}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>{isTr ? "Kopyala" : "Copy Codes"}</span>
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleDownloadBackupCodes}
                  className="inline-flex items-center gap-1.5 text-xs flex-1 sm:flex-none"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{isTr ? "İndir (.txt)" : "Download (.txt)"}</span>
                </Button>
              </div>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setIsBackupCodesModalOpen(false)}
                className="w-full sm:w-auto"
              >
                {isTr ? "Kodları Kaydettim, Tamamla" : "I've Saved Them, Done"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Disable Modal (Re-authentication required) */}
      {is2FADisableModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label={isTr ? "2FA Kapatma Onayı" : "Disable 2FA Confirmation"}
        >
          <div className="relative w-full max-w-md max-h-[min(92dvh,calc(100dvh-2rem))] flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3 shrink-0">
              <div className="flex items-center gap-2.5 text-amber-400">
                <Shield className="h-5 w-5" aria-hidden="true" />
                <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">
                  {isTr ? "2FA Devre Dışı Bırakma" : "Disable Two-Factor Authentication"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIs2FADisableModalOpen(false)}
                className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmDisable2FA} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto min-h-0 py-3 space-y-4 pr-1">
                {setupError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                    {setupError}
                  </div>
                )}

                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {isTr
                    ? "Güvenliğiniz için iki aşamalı doğrulamayı kapatmadan önce hesap şifrenizi veya güncel 6 haneli 2FA kodunuzu giriniz:"
                    : "For security reasons, please enter your current account password or active 6-digit TOTP code to disable 2FA:"}
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                    {isTr ? "Şifre veya 6 Haneli 2FA Kodu" : "Password or 6-digit 2FA Code"}
                  </label>
                  <TextInput
                    type="password"
                    value={disableAuthInput}
                    onChange={(e) => setDisableAuthInput(e.target.value)}
                    placeholder={
                      isTr ? "Mevcut şifreniz veya 2FA kodu" : "Current password or 2FA code"
                    }
                    required
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[var(--color-border-subtle)] shrink-0">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIs2FADisableModalOpen(false)}
                  disabled={is2FALoading}
                >
                  {isTr ? "Vazgeç" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={is2FALoading}
                  disabled={!disableAuthInput.trim()}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {isTr ? "Onayla ve Kapat" : "Confirm & Disable"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
