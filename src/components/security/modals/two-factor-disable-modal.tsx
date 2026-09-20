"use client";

import type { FormEvent } from "react";
import { Shield } from "lucide-react";
import { Button } from "../../ui/button";
import { TextInput } from "../../ui/text-input";

export interface TwoFactorDisableModalProps {
  isOpen: boolean;
  locale: string;
  disableAuthInput: string;
  setupError: string | null;
  is2FALoading: boolean;
  onInputChange: (val: string) => void;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
}

export function TwoFactorDisableModal({
  isOpen,
  locale,
  disableAuthInput,
  setupError,
  is2FALoading,
  onInputChange,
  onClose,
  onSubmit,
}: TwoFactorDisableModalProps) {
  if (!isOpen) return null;

  const isTr = locale === "tr";

  return (
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
            onClick={onClose}
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
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
                onChange={(e) => onInputChange(e.target.value)}
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
              onClick={onClose}
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
  );
}
