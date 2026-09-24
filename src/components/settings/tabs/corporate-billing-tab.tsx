"use client";

import { useState } from "react";
import {
  Building2,
  ShieldCheck,
  CreditCard,
  FileText,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { TextInput } from "@/src/components/ui/text-input";
import { Badge } from "@/src/components/ui/badge";
import { CompanyVerificationCard } from "@/src/components/profile/company-verification-card";

export interface CorporateBillingTabProps {
  companyData: {
    isCompanyVerified?: boolean;
    companyName?: string | null;
    companyType?: string | null;
    taxOffice?: string | null;
    vknMasked?: string | null;
    companyVerifiedAt?: Date | string | null;
  };
  initialInvoiceAddress?: string | null;
  initialIban?: string | null;
  initialBankName?: string | null;
  initialAccountHolder?: string | null;
  locale: string;
  saving: boolean;
  onSaveBilling: (fields: Record<string, unknown>) => Promise<void>;
}

export function CorporateBillingTab({
  companyData,
  initialInvoiceAddress,
  initialIban,
  initialBankName,
  initialAccountHolder,
  locale,
  saving,
  onSaveBilling,
}: CorporateBillingTabProps) {
  const isTr = locale === "tr";

  const [invoiceAddress, setInvoiceAddress] = useState(initialInvoiceAddress || "");
  const [iban, setIban] = useState(initialIban || "");
  const [bankName, setBankName] = useState(initialBankName || "");
  const [accountHolder, setAccountHolder] = useState(initialAccountHolder || "");

  // TR IBAN format helper
  const handleIbanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!raw.startsWith("TR") && raw.length > 0) {
      raw = `TR${raw.replace(/^TR/g, "")}`;
    }
    // Limit to TR + 24 digits = 26 chars
    raw = raw.slice(0, 26);
    // Format in blocks of 4
    const formatted = raw.replace(/(.{4})/g, "$1 ").trim();
    setIban(formatted);
  };

  const isIbanValid = iban.replace(/\s/g, "").length === 26 && iban.startsWith("TR");

  const handleSave = async () => {
    await onSaveBilling({
      invoiceAddress: invoiceAddress.trim() || null,
      iban: iban.replace(/\s/g, "").trim() || null,
      bankName: bankName.trim() || null,
      accountHolder: accountHolder.trim() || null,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-500" />
          <span>{isTr ? "Kurumsal ve Fatura Bilgileri" : "Corporate & Billing Information"}</span>
        </h2>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          {isTr
            ? "Resmi şirket doğrulaması, vergi bilgileri, fatura adresi ve hakediş transfer IBAN hesabınızı yönetin."
            : "Manage official GİB corporate verification, tax identity, billing address, and payout IBAN."}
        </p>
      </div>

      {/* 1. GİB Şirket Doğrulama Kartı */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>{isTr ? "Resmi Şirket & Vergi Doğrulaması (GİB)" : "Official Tax Verification"}</span>
          </label>
          {companyData.isCompanyVerified ? (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {isTr ? "Kurumsal Onaylı Şirket" : "Verified Corporate Entity"}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">
              <AlertCircle className="h-3 w-3 mr-1" />
              {isTr ? "Henüz Doğrulanmadı" : "Unverified"}
            </Badge>
          )}
        </div>

        {/* Kurumsal Doğrulama Bileşeni */}
        <CompanyVerificationCard
          initialData={companyData}
          locale={locale}
        />
      </div>

      {/* 2. Resmi Fatura Adresi */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-3">
        <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
          <FileText className="h-4 w-4 text-cyan-400" />
          <span>{isTr ? "Resmi Fatura Adresi" : "Official Invoice Address"}</span>
        </label>
        <textarea
          rows={3}
          value={invoiceAddress}
          onChange={(e) => setInvoiceAddress(e.target.value)}
          placeholder={
            isTr
              ? "Örn: Maslak Mah. Büyükdere Cad. No: 123 Kat: 4, Sarıyer / İstanbul"
              : "Enter full legal billing address..."
          }
          className="w-full rounded-2xl bg-surface border border-[var(--color-border-subtle)] p-3 text-xs text-[var(--color-text-primary)] outline-none focus:border-blue-500 transition-colors"
        />
        <p className="text-[11px] text-[var(--color-text-tertiary)]">
          {isTr
            ? "Tamamlanan projelerin hakediş makbuzları ve e-faturaları bu adrese düzenlenecektir."
            : "Receipts and commercial invoices will be addressed to this legal location."}
        </p>
      </div>

      {/* 3. Hakediş ve Banka (IBAN) Bilgileri */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
            <CreditCard className="h-4 w-4 text-purple-400" />
            <span>{isTr ? "Hakediş Ödeme Transfer Hesabı (IBAN)" : "Payout Bank Account (IBAN)"}</span>
          </label>
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            {isTr ? "%0 Komisyon Doğrudan Transfer" : "0% Commission Direct Payout"}
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[var(--color-text-secondary)] block">
                {isTr ? "Banka Adı" : "Bank Name"}
              </label>
              <TextInput
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder={isTr ? "Örn: Garanti BBVA, Akbank, İş Bankası" : "Bank Name"}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[var(--color-text-secondary)] block">
                {isTr ? "Hesap Sahibi (Ad Soyad / Şirket Ünvanı)" : "Account Holder"}
              </label>
              <TextInput
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder={isTr ? "Vergi levhası veya kimlikle eşleşmeli" : "Legal account holder name"}
                className="text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-[var(--color-text-secondary)] block">
                {isTr ? "Türkiye IBAN Numarası" : "Turkey IBAN Number"}
              </label>
              {iban && (
                <span
                  className={`text-[10px] font-bold ${
                    isIbanValid ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {isIbanValid
                    ? isTr
                      ? "✓ Geçerli IBAN Biçimi"
                      : "✓ Valid Format"
                    : isTr
                    ? "26 karakter (TR ile başlamalı)"
                    : "26 characters (Must start with TR)"}
                </span>
              )}
            </div>
            <TextInput
              value={iban}
              onChange={handleIbanChange}
              placeholder="TR00 0000 0000 0000 0000 0000 00"
              className="text-xs font-mono font-bold tracking-wider"
            />
          </div>

          <p className="text-[11px] text-[var(--color-text-tertiary)] leading-relaxed">
            {isTr
              ? "Operis, hakediş ödemelerinizde aracı komisyonu kesmez. Proje kilometre taşları (milestone) müşteri tarafından onaylandığında tutar doğrudan bu banka hesabınıza transfer edilir."
              : "Operis does not deduct commission fees. Once engagement deliverables are approved, funds are wired directly to this IBAN."}
          </p>
        </div>
      </div>

      {/* Kaydet Butonu */}
      <div className="pt-6 border-t border-[var(--color-border-subtle)] flex items-center justify-end">
        <Button onClick={handleSave} disabled={saving} className="cursor-pointer gap-2">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{isTr ? "Kaydediliyor..." : "Saving..."}</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>{isTr ? "Fatura & IBAN Bilgilerini Kaydet" : "Save Billing & Payout"}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
