"use client";

import React, { useState, useMemo } from "react";
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Lock,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { TextInput } from "@/src/components/ui/text-input";
import { validateTaxId } from "@/src/modules/companies/vkn-validator";
import { VerifiedCompanyBadge } from "@/src/components/ui/verified-company-badge";

export interface CompanyVerificationCardProps {
  initialData?: {
    isCompanyVerified?: boolean;
    companyName?: string | null;
    companyType?: string | null;
    taxOffice?: string | null;
    vknMasked?: string | null;
    companyVerifiedAt?: Date | string | null;
  };
  locale?: string;
  onSuccess?: (updated: {
    isCompanyVerified: boolean;
    companyName: string;
    companyType: string;
    taxOffice: string;
    vknMasked: string;
    companyVerifiedAt: Date;
  }) => void;
}

function getVerifiedDateLabel(formattedDate: string | null, isTr: boolean): string {
  if (formattedDate) {
    return isTr ? `${formattedDate} tarihinde onaylandı` : `Verified on ${formattedDate}`;
  }
  return isTr ? "Resmi Sicil Onaylı" : "Officially Verified";
}

function getTaxIdValidationSuccessText(type: "VKN" | "TCKN" | null | undefined, isTr: boolean): string {
  if (type === "VKN") {
    return isTr
      ? "Geçerli Tüzel Şirket VKN Formatı (GİB Modül 10/9 Doğrulandı)"
      : "Valid Corporate VKN (GİB Modular Checksum Verified)";
  }
  return isTr
    ? "Geçerli Şahıs Şirketi TCKN Formatı (Modül 10/11 Doğrulandı)"
    : "Valid Sole Proprietor TCKN Verified";
}

function getVerifyCompanyButtonLabel(isSubmitting: boolean, isTr: boolean): string {
  if (isSubmitting) {
    return isTr ? "Doğrulanıyor..." : "Verifying...";
  }
  return isTr ? "🏢 Şirketi Doğrula ve Rozeti Al" : "Verify Company & Get Badge";
}

export function CompanyVerificationCard({
  initialData,
  locale = "tr",
  onSuccess,
}: CompanyVerificationCardProps) {
  const isTr = locale === "tr";

  const [isVerified, setIsVerified] = useState(Boolean(initialData?.isCompanyVerified));
  const [companyName, setCompanyName] = useState(initialData?.companyName || "");
  const [companyType, setCompanyType] = useState<string>(initialData?.companyType || "LIMITED");
  const [taxOffice, setTaxOffice] = useState(initialData?.taxOffice || "");
  const [taxId, setTaxId] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [vknMasked, setVknMasked] = useState(initialData?.vknMasked || "");
  const [verifiedAt, setVerifiedAt] = useState<Date | string | null>(
    initialData?.companyVerifiedAt || null
  );

  const [showEditForm, setShowEditForm] = useState(!initialData?.isCompanyVerified);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Live client-side tax ID validation
  const validationStatus = useMemo(() => {
    const clean = taxId.trim().replace(/[\s-]/g, "");
    if (!clean) return null;
    return validateTaxId(clean);
  }, [taxId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const cleanTaxId = taxId.trim().replace(/[\s-]/g, "");
    if (!validationStatus?.isValid) {
      setFeedback({
        type: "error",
        message:
          validationStatus?.error ||
          (isTr
            ? "Lütfen geçerli bir 10 haneli VKN veya 11 haneli TCKN giriniz."
            : "Please enter a valid 10-digit VKN or 11-digit TCKN."),
      });
      return;
    }

    if (!companyName.trim()) {
      setFeedback({
        type: "error",
        message: isTr ? "Lütfen resmi şirket unvanını giriniz." : "Please enter legal company title.",
      });
      return;
    }

    if (!taxOffice.trim()) {
      setFeedback({
        type: "error",
        message: isTr ? "Lütfen bağlı olduğunuz Vergi Dairesini giriniz." : "Please enter your Tax Office.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/profile/company-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({
          companyName: companyName.trim(),
          taxId: cleanTaxId,
          taxOffice: taxOffice.trim(),
          companyType,
          websiteUrl: websiteUrl.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            (isTr
              ? "Doğrulama işlemi gerçekleştirilemedi."
              : "Verification could not be processed.")
        );
      }

      setIsVerified(true);
      setCompanyName(data.data.companyName);
      setCompanyType(data.data.companyType);
      setTaxOffice(data.data.taxOffice);
      setVknMasked(data.data.vknMasked);
      setVerifiedAt(data.data.companyVerifiedAt);
      setShowEditForm(false);
      setTaxId("");

      setFeedback({
        type: "success",
        message:
          data.message ||
          (isTr
            ? "Kurumsal şirket doğrulaması başarıyla tamamlandı!"
            : "Corporate company verified successfully!"),
      });

      if (onSuccess) {
        onSuccess(data.data);
      }
    } catch (err: unknown) {
      const defaultErr = isTr
        ? "Doğrulama sırasında bir hata oluştu."
        : "An error occurred during verification.";
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : defaultErr,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedVerifiedDate = verifiedAt
    ? new Intl.DateTimeFormat(isTr ? "tr-TR" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(verifiedAt))
    : null;

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30 space-y-4">
      {/* Card Header */}
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <span>{isTr ? "Kurumsal Şirket & Vergi No Doğrulaması" : "Company & Tax ID Verification"}</span>
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {isTr
                ? "GİB resmi algoritmasıyla şirket unvanınızı ve vergi numaranızı doğrulayın."
                : "Verify your legal company title and Tax ID using official Revenue Administration algorithms."}
            </p>
          </div>
        </div>

        {/* Verification Status Badge */}
        {isVerified ? (
          <VerifiedCompanyBadge
            companyName={companyName}
            taxOffice={taxOffice}
            vknMasked={vknMasked}
            companyType={companyType}
            size="md"
            isEn={!isTr}
          />
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isTr ? "Doğrulanmadı" : "Unverified"}</span>
          </span>
        )}
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          role="alert"
          className={`p-3 rounded-xl text-xs flex items-center gap-2 font-medium border ${
            feedback.type === "success"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-red-500/10 text-red-400 border-red-500/20"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* When Already Verified and not editing */}
      {isVerified && !showEditForm && (
        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[var(--color-text-tertiary)] block text-[11px]">
                {isTr ? "Doğrulanmış Şirket Unvanı" : "Verified Company Title"}
              </span>
              <span className="font-semibold text-[var(--color-text-primary)] block mt-0.5">
                {companyName}
              </span>
            </div>

            <div>
              <span className="text-[var(--color-text-tertiary)] block text-[11px]">
                {isTr ? "Vergi Kimlik No (VKN)" : "Tax ID (Masked)"}
              </span>
              <span className="font-mono font-medium text-blue-400 block mt-0.5">
                {vknMasked || "—"}
              </span>
            </div>

            <div>
              <span className="text-[var(--color-text-tertiary)] block text-[11px]">
                {isTr ? "Bağlı Vergi Dairesi" : "Tax Office"}
              </span>
              <span className="font-medium text-[var(--color-text-primary)] block mt-0.5">
                {taxOffice ? `${taxOffice} V.D.` : "—"}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-blue-500/15 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-tertiary)]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{getVerifiedDateLabel(formattedVerifiedDate, isTr)}</span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowEditForm(true)}
              className="text-xs h-7 px-3 gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              <span>{isTr ? "Bilgileri Güncelle" : "Update Company Info"}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Verification / Update Form */}
      {showEditForm && (
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/15 flex items-start gap-2.5 text-xs text-[var(--color-text-secondary)] leading-relaxed">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[var(--color-text-primary)] block mb-0.5">
                {isTr
                  ? "Neden Kurumsal Doğrulama Yapmalısınız?"
                  : "Why complete Corporate Verification?"}
              </span>
              <span>
                {isTr
                  ? "Doğrulanmış şirket rozetine sahip işverenlerin ilanları, freelancer'lar tarafından 2.8 kat daha fazla teklif almakta ve nitelikli uzmanların güvenini kazanmaktadır."
                  : "Listings posted by verified employers receive 2.8x more bids from senior specialists and build unmatched client credibility."}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Şirket Unvanı */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
                {isTr ? "Resmi Şirket Unvanı" : "Legal Company Title"} <span className="text-red-400">*</span>
              </label>
              <TextInput
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={isTr ? "Örn: Acme Yazılım ve Bilişim Hizmetleri A.Ş." : "e.g. Acme Tech Solutions Ltd."}
                required
              />
            </div>

            {/* Vergi Kimlik No (VKN / TCKN) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-text-secondary)] flex items-center justify-between">
                <span>
                  {isTr ? "Vergi Kimlik No (VKN / TCKN)" : "Tax Identification Number"} <span className="text-red-400">*</span>
                </span>
                <span className="text-[10px] text-[var(--color-text-tertiary)] font-normal">
                  {isTr ? "10 veya 11 Hane" : "10 or 11 digits"}
                </span>
              </label>
              <TextInput
                value={taxId}
                onChange={(e) => setTaxId(e.target.value.replace(/[^\d\s-]/g, ""))}
                placeholder={isTr ? "Örn: 8790017566" : "e.g. 8790017566"}
                maxLength={14}
                required
              />

              {/* Real-time validation feedback */}
              {taxId.trim() && (
                <div className="pt-1 text-[11px]">
                  {validationStatus?.isValid ? (
                    <div className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{getTaxIdValidationSuccessText(validationStatus.type, isTr)}</span>
                    </div>
                  ) : (
                    <div className="text-amber-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{validationStatus?.error || (isTr ? "Geçersiz kontrol basamağı" : "Invalid checksum")}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bağlı Vergi Dairesi */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
                {isTr ? "Bağlı Bulunulan Vergi Dairesi" : "Tax Office"} <span className="text-red-400">*</span>
              </label>
              <TextInput
                value={taxOffice}
                onChange={(e) => setTaxOffice(e.target.value)}
                placeholder={isTr ? "Örn: Boğaziçi, Marmara..." : "e.g. Central"}
                required
              />
            </div>

            {/* Şirket Türü */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
                {isTr ? "Şirket Türü" : "Company Type"}
              </label>
              <select
                value={companyType}
                onChange={(e) => setCompanyType(e.target.value)}
                className="w-full rounded-xl bg-surface border border-[var(--color-border-subtle)] px-3 py-2 text-xs text-[var(--color-text-primary)] outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="LIMITED">{isTr ? "Limited Şirket (Ltd. Şti.)" : "Limited Liability (Ltd.)"}</option>
                <option value="ANONIM">{isTr ? "Anonim Şirket (A.Ş.)" : "Joint-Stock Company (Corp.)"}</option>
                <option value="SAHIS">{isTr ? "Şahıs Şirketi (Bireysel İşletme)" : "Sole Proprietorship"}</option>
                <option value="KOOPERATIF">{isTr ? "Kooperatif" : "Cooperative"}</option>
              </select>
            </div>

            {/* Şirket Web Sitesi */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
                {isTr ? "Şirket Web Sitesi (İsteğe Bağlı)" : "Company Website (Optional)"}
              </label>
              <TextInput
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Privacy and Security Notice */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-tertiary)] leading-snug">
            <Lock className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <span>
              {isTr
                ? "KVKK & Güvenlik Güvencesi: Vergi numaranız asla açık şekilde ilanlarda veya profilde yayınlanmaz. Yalnızca maskeli biçimde (örn: 879***7566) ve kurumsal güvenilirlik rozeti olarak gösterilir."
                : "Privacy Guarantee: Your Tax ID is never revealed in plain text. Only a masked preview (e.g., 879***7566) and verified badge will be displayed."}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-1">
            {isVerified && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowEditForm(false)}
                disabled={isSubmitting}
                className="text-xs h-8 px-3 cursor-pointer"
              >
                <span>{isTr ? "Vazgeç" : "Cancel"}</span>
              </Button>
            )}

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting || (taxId.trim().length > 0 && !validationStatus?.isValid)}
              isLoading={isSubmitting}
              className="text-xs font-semibold h-8 px-4 gap-1.5 cursor-pointer shadow-xs"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{getVerifyCompanyButtonLabel(isSubmitting, isTr)}</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
