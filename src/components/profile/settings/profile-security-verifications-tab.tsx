"use client";

import type { FormEvent } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Shield,
  Mail,
  Phone,
  Key,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { CompanyVerificationCard } from "../company-verification-card";

export interface ProfileSecurityVerificationsTabProps {
  email?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  locale: string;
  cooldownSeconds: number;
  isResendingEmail: boolean;
  isResendingPhone: boolean;
  verificationFeedback: { type: "success" | "error"; message: string } | null;
  showPhoneModal: boolean;
  otpCode: string;
  isSubmittingOtp: boolean;
  companyVerificationData: {
    isCompanyVerified?: boolean;
    companyName?: string | null;
    companyType?: string | null;
    taxOffice?: string | null;
    vknMasked?: string | null;
    companyVerifiedAt?: Date | string | null;
  };
  onResendEmail: () => void;
  onResendPhone: () => void;
  onOpenPhoneModal: () => void;
  onClosePhoneModal: () => void;
  onOpenPhoneChangeModal: () => void;
  onOtpCodeChange: (val: string) => void;
  onVerifyPhone: (e: FormEvent) => void;
}

export function ProfileSecurityVerificationsTab({
  email,
  emailVerified,
  phoneVerified,
  locale,
  cooldownSeconds,
  isResendingEmail,
  isResendingPhone,
  verificationFeedback,
  showPhoneModal,
  otpCode,
  isSubmittingOtp,
  companyVerificationData,
  onResendEmail,
  onResendPhone,
  onOpenPhoneModal,
  onClosePhoneModal,
  onOpenPhoneChangeModal,
  onOtpCodeChange,
  onVerifyPhone,
}: ProfileSecurityVerificationsTabProps) {
  const isTr = locale === "tr";

  let emailVerificationButtonLabel = isTr ? "Doğrulama E-postası Gönder" : "Send Verification Email";
  if (cooldownSeconds > 0) {
    emailVerificationButtonLabel = `${isTr ? "Tekrar gönder" : "Resend in"} (${cooldownSeconds}s)`;
  }

  let phoneVerificationHelpText = isTr
    ? "İlan verme ve teklif gönderme işlemleri için telefon doğrulaması zorunludur."
    : "Phone verification is required to publish listings and submit offers.";
  if (phoneVerified) {
    phoneVerificationHelpText = isTr
      ? "Telefon numaranız güvenle şifrelenmiş ve doğrulanmıştır."
      : "Your phone number is encrypted and verified.";
  }

  let phoneResendButtonLabel = isTr ? "Tekrar Kod Gönder" : "Resend Code";
  if (cooldownSeconds > 0) {
    phoneResendButtonLabel = `${isTr ? "Tekrar gönder" : "Resend in"} (${cooldownSeconds}s)`;
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-6 sm:p-7 space-y-5">
      <h2 className="text-base font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
        <Shield className="h-4 w-4 text-emerald-400" aria-hidden="true" />
        <span>
          {isTr ? "Hesap ve Güvenlik Doğrulamaları" : "Account & Security Verifications"}
        </span>
      </h2>

      {verificationFeedback && (
        <div
          className={`flex items-center gap-3 rounded-xl border p-3.5 text-xs ${
            verificationFeedback.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-red-500/20 bg-red-500/10 text-red-400"
          }`}
        >
          {verificationFeedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <span>{verificationFeedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* E-Posta Doğrulama Kartı */}
        <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-400" aria-hidden="true" />
              <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                {isTr ? "E-Posta Adresi" : "Email Address"}
              </span>
            </div>
            {emailVerified ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                <span>{isTr ? "Doğrulandı" : "Verified"}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertCircle className="h-3 w-3" aria-hidden="true" />
                <span>{isTr ? "Doğrulanmadı" : "Unverified"}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] truncate">
            {email || "—"}
          </p>
          {!emailVerified && (
            <div className="pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onResendEmail}
                disabled={cooldownSeconds > 0 || isResendingEmail}
                className="w-full text-xs font-medium gap-1.5 h-8 cursor-pointer"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isResendingEmail ? "animate-spin" : ""}`}
                  aria-hidden="true"
                />
                <span>{emailVerificationButtonLabel}</span>
              </Button>
            </div>
          )}
        </div>

        {/* Telefon Doğrulama Kartı */}
        <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-purple-400" aria-hidden="true" />
              <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                {isTr ? "Telefon Numarası" : "Phone Number"}
              </span>
            </div>
            {phoneVerified ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                <span>{isTr ? "Doğrulandı" : "Verified"}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertCircle className="h-3 w-3" aria-hidden="true" />
                <span>{isTr ? "Doğrulanmadı" : "Unverified"}</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-[var(--color-text-tertiary)]">
            {phoneVerificationHelpText}
          </p>
          {phoneVerified ? (
            <div className="pt-1 flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onOpenPhoneChangeModal}
                className="text-xs font-medium gap-1.5 h-8 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" aria-hidden="true" />
                <span>{isTr ? "Numarayı Güncelle" : "Change Phone"}</span>
              </Button>
            </div>
          ) : (
            <div className="pt-1 flex items-center gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={onOpenPhoneModal}
                className="flex-1 text-xs font-semibold gap-1.5 h-8 cursor-pointer"
              >
                <Key className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{isTr ? "Telefonu Doğrula (SMS OTP)" : "Verify Phone (SMS OTP)"}</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Kurumsal Şirket & Vergi No Doğrulaması Kartı */}
      <CompanyVerificationCard
        initialData={companyVerificationData}
        locale={locale}
      />

      {/* Inline OTP Input Modal/Card */}
      {showPhoneModal && !phoneVerified && (
        <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
              <Key className="h-4 w-4 text-blue-400" aria-hidden="true" />
              <span>
                {isTr
                  ? "SMS ile Gelen 6 Haneli Doğrulama Kodunu Giriniz"
                  : "Enter the 6-digit SMS verification code"}
              </span>
            </span>
            <button
              type="button"
              onClick={onClosePhoneModal}
              className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] cursor-pointer"
            >
              {isTr ? "Vazgeç" : "Cancel"}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={(e) => onOtpCodeChange(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="w-full sm:w-48 h-9 text-center tracking-widest text-base font-mono font-bold rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-[var(--color-text-primary)] focus:outline-none focus:border-blue-500"
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onVerifyPhone}
              disabled={otpCode.length !== 6 || isSubmittingOtp}
              isLoading={isSubmittingOtp}
              className="text-xs font-semibold h-9 px-4 cursor-pointer"
            >
              {isTr ? "Kodu Onayla" : "Confirm Code"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onResendPhone}
              disabled={cooldownSeconds > 0 || isResendingPhone}
              className="text-xs font-medium h-9 px-3 gap-1 cursor-pointer"
            >
              <RefreshCw
                className={`h-3 w-3 ${isResendingPhone ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              <span>{phoneResendButtonLabel}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
