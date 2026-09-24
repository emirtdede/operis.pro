"use client";

import type { FormEvent } from "react";
import { Smartphone } from "lucide-react";
import { Button } from "../../ui/button";
import { TextInput } from "../../ui/text-input";

export interface TwoFactorSetupModalProps {
  isOpen: boolean;
  locale: string;
  setupSecret: string;
  setupTotpCode: string;
  setupError: string | null;
  is2FALoading: boolean;
  onCodeChange: (code: string) => void;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
}

export function TwoFactorSetupModal({
  isOpen,
  locale,
  setupSecret,
  setupTotpCode,
  setupError,
  is2FALoading,
  onCodeChange,
  onClose,
  onSubmit,
}: TwoFactorSetupModalProps) {
  if (!isOpen) return null;

  const isTr = locale === "tr";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200"
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
                onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
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
              disabled={setupTotpCode.length !== 6}
            >
              {isTr ? "Doğrula ve Etkinleştir" : "Verify & Enable"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
