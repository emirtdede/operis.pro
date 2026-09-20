"use client";

import { useState, type FormEvent } from "react";
import { Smartphone } from "lucide-react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { TwoFactorSetupModal } from "../modals/two-factor-setup-modal";
import { TwoFactorBackupCodesModal } from "../modals/two-factor-backup-codes-modal";
import { TwoFactorDisableModal } from "../modals/two-factor-disable-modal";
import {
  SecurityFeedback,
  get2FABadgeLabel,
  get2FAButtonLabel,
} from "../types";

export interface TwoFactorAuthSectionProps {
  locale: string;
  twoFactorEnabled: boolean;
  onFeedback: (feedback: SecurityFeedback) => void;
}

export function TwoFactorAuthSection({
  locale,
  twoFactorEnabled,
  onFeedback,
}: TwoFactorAuthSectionProps) {
  const isTr = locale === "tr";

  const [is2FAEnabled, setIs2FAEnabled] = useState(twoFactorEnabled);
  const [is2FALoading, setIs2FALoading] = useState(false);
  const [is2FASetupModalOpen, setIs2FASetupModalOpen] = useState(false);
  const [is2FADisableModalOpen, setIs2FADisableModalOpen] = useState(false);
  const [setupSecret, setSetupSecret] = useState("");
  const [setupTotpCode, setSetupTotpCode] = useState("");
  const [disableAuthInput, setDisableAuthInput] = useState("");
  const [setupError, setSetupError] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isBackupCodesModalOpen, setIsBackupCodesModalOpen] = useState(false);

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
      if (!res.ok) {
        throw new Error(data.error || "2FA kurulumu başlatılamadı.");
      }

      setSetupSecret(data.secret);
      setSetupTotpCode("");
      setIs2FASetupModalOpen(true);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "2FA kurulum bilgisi alınamadı.";
      onFeedback({
        type: "error",
        message: errorMsg,
      });
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleConfirmEnable2FA = async (e: FormEvent) => {
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
      if (!res.ok) {
        throw new Error(data.error || (isTr ? "2FA doğrulanamadı." : "Failed to verify 2FA."));
      }

      setIs2FAEnabled(true);
      setIs2FASetupModalOpen(false);
      if (Array.isArray(data.backupCodes) && data.backupCodes.length > 0) {
        setBackupCodes(data.backupCodes);
        setIsBackupCodesModalOpen(true);
      }
      onFeedback({
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

  const handleConfirmDisable2FA = async (e: FormEvent) => {
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
      if (!res.ok) {
        throw new Error(data.error || (isTr ? "2FA kapatılamadı." : "Failed to disable 2FA."));
      }

      setIs2FAEnabled(false);
      setIs2FADisableModalOpen(false);
      onFeedback({
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

  return (
    <>
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
              {get2FABadgeLabel(is2FAEnabled, isTr)}
            </Badge>

            <Button
              type="button"
              variant={is2FAEnabled ? "outline" : "primary"}
              size="sm"
              onClick={handleToggle2FA}
              isLoading={is2FALoading}
              className="text-xs font-semibold"
            >
              {get2FAButtonLabel(is2FAEnabled, isTr)}
            </Button>
          </div>
        </div>
      </div>

      <TwoFactorSetupModal
        isOpen={is2FASetupModalOpen}
        locale={locale}
        setupSecret={setupSecret}
        setupTotpCode={setupTotpCode}
        setupError={setupError}
        is2FALoading={is2FALoading}
        onCodeChange={setSetupTotpCode}
        onClose={() => setIs2FASetupModalOpen(false)}
        onSubmit={handleConfirmEnable2FA}
      />

      <TwoFactorBackupCodesModal
        isOpen={isBackupCodesModalOpen}
        locale={locale}
        backupCodes={backupCodes}
        onClose={() => setIsBackupCodesModalOpen(false)}
      />

      <TwoFactorDisableModal
        isOpen={is2FADisableModalOpen}
        locale={locale}
        disableAuthInput={disableAuthInput}
        setupError={setupError}
        is2FALoading={is2FALoading}
        onInputChange={setDisableAuthInput}
        onClose={() => setIs2FADisableModalOpen(false)}
        onSubmit={handleConfirmDisable2FA}
      />
    </>
  );
}
