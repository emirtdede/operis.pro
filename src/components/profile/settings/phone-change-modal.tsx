"use client";

import type { FormEvent } from "react";
import { Phone, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export interface PhoneChangeModalProps {
  isOpen: boolean;
  locale: string;
  phoneChangeStep: 1 | 2;
  newPhone: string;
  phoneChangeOtp: string;
  isPhoneChanging: boolean;
  phoneChangeError: string | null;
  phoneChangeSuccess: string | null;
  onClose: () => void;
  onNewPhoneChange: (val: string) => void;
  onPhoneChangeOtpChange: (val: string) => void;
  onStepChange: (step: 1 | 2) => void;
  onRequestPhoneChange: (e: FormEvent) => void;
  onVerifyPhoneChange: (e: FormEvent) => void;
}

export function PhoneChangeModal({
  isOpen,
  locale,
  phoneChangeStep,
  newPhone,
  phoneChangeOtp,
  isPhoneChanging,
  phoneChangeError,
  phoneChangeSuccess,
  onClose,
  onNewPhoneChange,
  onPhoneChangeOtpChange,
  onStepChange,
  onRequestPhoneChange,
  onVerifyPhoneChange,
}: PhoneChangeModalProps) {
  if (!isOpen) return null;
  const isTr = locale === "tr";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={isTr ? "Telefon Numarası Güncelleme" : "Update Phone Number"}
    >
      <div className="relative w-full max-w-md max-h-[min(92dvh,calc(100dvh-2rem))] flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3 shrink-0">
          <div className="flex items-center gap-2 text-blue-400">
            <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
            <h3 className="font-semibold text-sm text-[var(--color-text-primary)] truncate">
              {isTr ? "Telefon Numarası Güncelleme" : "Update Phone Number"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] p-1 rounded-lg"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 py-3 space-y-4 pr-1">
          {phoneChangeError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              {phoneChangeError}
            </div>
          )}

          {phoneChangeSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{phoneChangeSuccess}</span>
            </div>
          )}

          {phoneChangeStep === 1 ? (
            <form onSubmit={onRequestPhoneChange} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                  {isTr ? "Yeni Telefon Numarası" : "New Phone Number"}
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => onNewPhoneChange(e.target.value.trim())}
                  placeholder="+905551234567"
                  required
                  className="w-full h-10 px-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-xs text-[var(--color-text-primary)] font-mono focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-[var(--color-text-tertiary)]">
                  {isTr
                    ? "Uluslararası E.164 formatında (ülke kodu ile) giriniz. Örn: +905551234567"
                    : "Enter in international E.164 format with country code. E.g. +905551234567"}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border-subtle)]">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={onClose}
                  disabled={isPhoneChanging}
                >
                  {isTr ? "Vazgeç" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!newPhone.trim()}
                  isLoading={isPhoneChanging}
                >
                  {isTr ? "SMS Kodu Gönder" : "Send SMS Code"}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={onVerifyPhoneChange} className="space-y-4">
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                <strong className="text-white">{newPhone}</strong>{" "}
                {isTr
                  ? "numarasına gönderilen 6 haneli doğrulama kodunu giriniz:"
                  : "enter the 6-digit verification code sent to this number:"}
              </p>

              <div className="space-y-1.5">
                <input
                  type="text"
                  maxLength={6}
                  value={phoneChangeOtp}
                  onChange={(e) =>
                    onPhoneChangeOtpChange(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  required
                  className="w-full h-11 text-center tracking-widest text-lg font-mono font-bold rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-[var(--color-text-primary)] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-[var(--color-border-subtle)]">
                <button
                  type="button"
                  onClick={() => onStepChange(1)}
                  className="text-xs text-blue-400 hover:underline cursor-pointer"
                >
                  {isTr ? "Numarayı Değiştir" : "Change Number"}
                </button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={phoneChangeOtp.length !== 6}
                  isLoading={isPhoneChanging}
                >
                  {isTr ? "Doğrula ve Güncelle" : "Verify & Update"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
