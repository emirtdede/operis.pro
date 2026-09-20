"use client";

import { useState, useMemo } from "react";
import {
  Globe,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Download,
  FileText,
  Landmark,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import { TextInput } from "../ui/text-input";
import type {
  SoftwareExportConfig,
  ForeignRemittanceChannel,
  SoftwareExportEvaluation,
} from "@/src/modules/finance/software-export-types";
import { SoftwareExportEngine } from "@/src/modules/finance/software-export-engine";
import { SoftwareExportBadge } from "./software-export-badge";

export interface SoftwareExportWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialConfig?: SoftwareExportConfig | null;
  clientName?: string;
  contractorName?: string;
  budgetLabel?: string;
  locale?: string;
  onSaveConfig?: (config: SoftwareExportConfig) => void;
}

function getEligibilityBannerClass(fullTax: boolean, vatZero: boolean): string {
  if (fullTax && vatZero) {
    return "bg-emerald-500/10 border-emerald-500/30 text-emerald-300";
  }
  if (vatZero) {
    return "bg-amber-500/10 border-amber-500/30 text-amber-300";
  }
  return "bg-rose-500/10 border-rose-500/30 text-rose-300";
}

function getEligibilityStatusTitle(status: string, isTr: boolean): string {
  if (status === "FULLY_ELIGIBLE") {
    return isTr
      ? "Mükemmel! %100 Gelir Vergisi İndirimi ve %0 KDV İstisnası Geçerlidir"
      : "Fully Qualified! 100% Tax Deduction & 0% VAT Apply";
  }
  if (status === "CONDITIONALLY_ELIGIBLE") {
    return isTr
      ? "KDV %0 Uygulanabilir; Ancak %100 Gelir Vergisi İndirimi İçin Döviz Bankaya Getirilmelidir"
      : "0% VAT Applies; Full Tax Deduction Requires Repatriation to TR Bank";
  }
  return isTr
    ? "Yurt İçi Hizmet veya Eksik Kloz: İhracat Rejimi Uygulanamaz"
    : "Domestic or Non-Compliant: Software Export Ineligible";
}

function getExportModeLabel(enabled: boolean, isTr: boolean): string {
  if (enabled) {
    return isTr ? "İhracat Rejimi Aktif" : "Export Mode Active";
  }
  return isTr ? "Pasif" : "Disabled";
}

export function SoftwareExportWizardModal({
  isOpen,
  onClose,
  initialConfig,
  clientName = "Yurt Dışı Müşteri / Foreign Client",
  contractorName = "Yazılım Uzmanı / Contractor",
  budgetLabel = "5,000 USD",
  locale = "tr",
  onSaveConfig,
}: SoftwareExportWizardModalProps) {
  const isTr = locale === "tr";

  // Form State
  const [enabled, setEnabled] = useState<boolean>(initialConfig?.enabled ?? true);
  const [clientCountry, setClientCountry] = useState<string>(
    initialConfig?.clientCountry || (isTr ? "Amerika Birleşik Devletleri" : "United States")
  );
  const [isForeignEntity, setIsForeignEntity] = useState<boolean>(
    initialConfig?.isForeignEntity ?? true
  );
  const [isServiceUtilizedAbroad, setIsServiceUtilizedAbroad] = useState<boolean>(
    initialConfig?.isServiceUtilizedAbroad ?? true
  );
  const [remittanceChannel, setRemittanceChannel] = useState<ForeignRemittanceChannel>(
    initialConfig?.remittanceChannel || "SWIFT_WIRE"
  );
  const [repatriationDeclared, setRepatriationDeclared] = useState<boolean>(
    initialConfig?.repatriationDeclared ?? true
  );
  const [invoiceCurrency, setInvoiceCurrency] = useState<string>(
    initialConfig?.invoiceCurrency || "USD"
  );

  // Active Tab
  const [activeTab, setActiveTab] = useState<"checklist" | "invoice" | "bank" | "annex">("checklist");
  const [copiedInvoice, setCopiedInvoice] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);
  const [copiedAnnex, setCopiedAnnex] = useState(false);

  // Current Config
  const currentConfig: SoftwareExportConfig = useMemo(() => {
    return {
      enabled,
      clientCountry,
      isForeignEntity,
      isServiceUtilizedAbroad,
      remittanceChannel,
      repatriationDeclared,
      invoiceCurrency,
    };
  }, [
    enabled,
    clientCountry,
    isForeignEntity,
    isServiceUtilizedAbroad,
    remittanceChannel,
    repatriationDeclared,
    invoiceCurrency,
  ]);

  // Evaluation
  const evaluation: SoftwareExportEvaluation = useMemo(() => {
    return SoftwareExportEngine.evaluateExportEligibility(currentConfig);
  }, [currentConfig]);

  // Generated Texts
  const invoiceNote = useMemo(() => {
    return SoftwareExportEngine.generateInvoiceNote(currentConfig, locale);
  }, [currentConfig, locale]);

  const bankDeclaration = useMemo(() => {
    return SoftwareExportEngine.generateBankRemittanceDeclaration(
      currentConfig,
      locale,
      clientName,
      contractorName,
      budgetLabel
    );
  }, [currentConfig, locale, clientName, contractorName, budgetLabel]);

  const annexMarkdown = useMemo(() => {
    return SoftwareExportEngine.generateExportAnnexMarkdown(
      currentConfig,
      locale === "en" ? "en" : "tr",
      clientName,
      contractorName
    );
  }, [currentConfig, locale, clientName, contractorName]);

  const handleCopyInvoice = async () => {
    await navigator.clipboard.writeText(invoiceNote);
    setCopiedInvoice(true);
    setTimeout(() => setCopiedInvoice(false), 2000);
  };

  const handleCopyBank = async () => {
    await navigator.clipboard.writeText(bankDeclaration);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const handleCopyAnnex = async () => {
    await navigator.clipboard.writeText(annexMarkdown);
    setCopiedAnnex(true);
    setTimeout(() => setCopiedAnnex(false), 2000);
  };

  const handleDownloadBank = () => {
    const blob = new Blob([bankDeclaration], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Banka_Doviz_Beyan_Dilekcesi_GVK89_13.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    if (onSaveConfig) {
      onSaveConfig(currentConfig);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-cyan-500/30 bg-[#0c121e] text-[var(--color-text-primary)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-transparent">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">
                  {isTr
                    ? "Yazılım İhracatı %100 Vergi İndirimi & KDV İstisnası Sihirbazı"
                    : "Software Export 100% Tax Deduction & Zero-VAT Wizard"}
                </h2>
                <SoftwareExportBadge config={currentConfig} locale={locale} compact />
              </div>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                {isTr
                  ? "193 s. GVK m. 89/13 (7491 s. Kanun) & 3065 s. KDVK m. 11/1-a (GİB Kod 302)"
                  : "Statutory Cross-Border Tech Export Incentives & Tax Exemption Engine"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-cyan-500/15 bg-black/20 px-6 gap-2 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("checklist")}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "checklist"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{isTr ? "1. Uygunluk & Risk Testi" : "1. Eligibility & Audit Shield"}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("invoice")}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "invoice"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>{isTr ? "2. GİB Fatura Notu (Kod 302)" : "2. GİB Invoice Note (Code 302)"}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bank")}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "bank"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
            }`}
          >
            <Landmark className="h-4 w-4" />
            <span>{isTr ? "3. Banka Döviz Tevsik Dilekçesi" : "3. Bank Repatriation Letter"}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("annex")}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "annex"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
            }`}
          >
            <Globe className="h-4 w-4" />
            <span>{isTr ? "4. Sözleşme Şartnamesi (EK-5)" : "4. Contract Addendum (ANNEX-5)"}</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: CHECKLIST & ELIGIBILITY */}
          {activeTab === "checklist" && (
            <div className="space-y-6">
              {/* Summary Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-start gap-4 ${getEligibilityBannerClass(
                  evaluation.isEligibleForFullTaxDeduction,
                  evaluation.isEligibleForVatZero
                )}`}
              >
                {evaluation.isEligibleForFullTaxDeduction ? (
                  <CheckCircle2 className="h-6 w-6 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-6 w-6 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-sm">
                    {getEligibilityStatusTitle(evaluation.status, isTr)}
                  </div>
                  <p className="opacity-90 leading-relaxed">
                    {isTr
                      ? "7491 sayılı Kanun ve 2026/11257 sayılı Cumhurbaşkanı Kararı ile yazılım ihracatı gelir vergisi istisnası %100'e çıkarılmıştır. KDVK 11/1-a uyarınca faturada %0 KDV hesaplanır, stopaj kesilmez."
                      : "Under Law No. 7491 and Decree 11257, cross-border software export earns 100% tax deduction. Invoicing is 0% VAT and 0% withholding."}
                  </p>
                </div>
              </div>

              {/* Form Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 p-4 rounded-2xl bg-black/20 border border-[var(--color-border-subtle)]">
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
                    {isTr ? "Müşteri Mukim Olunan Ülke" : "Client Jurisdiction"}
                  </label>
                  <TextInput
                    value={clientCountry}
                    onChange={(e) => setClientCountry(e.target.value)}
                    placeholder="örn. Almanya, ABD, İngiltere, Hollanda"
                    className="text-xs"
                  />
                  <p className="text-[11px] text-[var(--color-text-tertiary)]">
                    {isTr
                      ? "Müşterinin kanuni ve iş merkezinin Türkiye dışında olması şarttır."
                      : "The client must have its legal domicile outside Turkey."}
                  </p>
                </div>

                <div className="space-y-2 p-4 rounded-2xl bg-black/20 border border-[var(--color-border-subtle)]">
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
                    {isTr ? "Fatura / Hakediş Para Birimi" : "Invoicing Currency"}
                  </label>
                  <select
                    value={invoiceCurrency}
                    onChange={(e) => setInvoiceCurrency(e.target.value)}
                    aria-label={isTr ? "Fatura Para Birimi" : "Invoicing Currency"}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] cursor-pointer"
                  >
                    <option value="USD">USD ($) - Amerikan Doları</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - İngiliz Sterlini</option>
                    <option value="CAD">CAD ($) - Kanada Doları</option>
                    <option value="CHF">CHF (Fr) - İsviçre Frangı</option>
                    <option value="TRY">TRY (₺) - Türk Lirası</option>
                  </select>
                  <p className="text-[11px] text-[var(--color-text-tertiary)]">
                    {isTr
                      ? "GVK 89/13 teşviki için dövizin Türkiye'deki banka hesabına transferi esastır."
                      : "Foreign currency transfer into a Turkish bank is mandatory for GVK 89/13."}
                  </p>
                </div>
              </div>

              {/* Statutory Conditions Checklist */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  {isTr ? "Yasal Zorunluluk Kontrol Listesi" : "Statutory Requirements Checklist"}
                </h4>

                <div className="space-y-2">
                  {/* Item 1 */}
                  <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-black/30 border border-[var(--color-border-subtle)] hover:border-cyan-500/30 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isForeignEntity}
                      onChange={(e) => setIsForeignEntity(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-cyan-500/50 text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                    <div className="text-xs space-y-0.5">
                      <div className="font-semibold text-[var(--color-text-primary)]">
                        {isTr
                          ? "1. Yurt Dışı Müşteri (Türkiye'de Şube/Temsilcilik Yoktur)"
                          : "1. Foreign Client (No branch or establishment in Turkey)"}
                      </div>
                      <p className="text-[11px] text-[var(--color-text-tertiary)]">
                        {isTr
                          ? "Hizmet verilen gerçek veya tüzel kişinin kanuni ve iş merkezi Türkiye dışında bulunmalıdır (GVK m. 89/13)."
                          : "The recipient must be a non-resident entity with no permanent establishment in Turkey."}
                      </p>
                    </div>
                  </label>

                  {/* Item 2 */}
                  <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-black/30 border border-[var(--color-border-subtle)] hover:border-cyan-500/30 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isServiceUtilizedAbroad}
                      onChange={(e) => setIsServiceUtilizedAbroad(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-cyan-500/50 text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                    <div className="text-xs space-y-0.5">
                      <div className="font-semibold text-[var(--color-text-primary)]">
                        {isTr
                          ? "2. Münhasıran Yurt Dışında Faydalanma (KDVK 11/1-a & 12/2)"
                          : "2. Exclusive Foreign Utilization (Deliverables consumed outside Turkey)"}
                      </div>
                      <p className="text-[11px] text-[var(--color-text-tertiary)]">
                        {isTr
                          ? "Geliştirilen yazılım Türkiye'deki kullanıcılara değil, münhasıran yurt dışındaki müşterinin küresel operasyonlarına hizmet etmelidir."
                          : "Deliverables must be deployed and consumed exclusively outside Turkey to bar retroactive VAT claims."}
                      </p>
                    </div>
                  </label>

                  {/* Item 3 */}
                  <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-black/30 border border-[var(--color-border-subtle)] hover:border-cyan-500/30 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      checked={repatriationDeclared}
                      onChange={(e) => setRepatriationDeclared(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-cyan-500/50 text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                    <div className="text-xs space-y-0.5">
                      <div className="font-semibold text-[var(--color-text-primary)]">
                        {isTr
                          ? "3. Döviz Bedelinin Türkiye'deki Bankaya Getirilmesi (GVK 89/13 %100 Şartı)"
                          : "3. Foreign Remittance Repatriated to Turkish Bank (GVK 89/13 condition)"}
                      </div>
                      <p className="text-[11px] text-[var(--color-text-tertiary)]">
                        {isTr
                          ? "Kazancın tamamı (%100) yıllık gelir vergisi beyannamesinin verilmesi gereken tarihe kadar Türkiye'deki banka hesabına transfer edilmelidir."
                          : "100% of proceeds must be remitted into a Turkish bank account prior to annual tax return filing."}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Remittance Channel Selector */}
              <div className="space-y-2 p-4 rounded-2xl bg-black/20 border border-[var(--color-border-subtle)]">
                <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
                  {isTr ? "Döviz Transfer Kanalı (Tevsik Şekli)" : "Remittance Channel"}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {(
                    [
                      { id: "SWIFT_WIRE", label: "SWIFT / Havale" },
                      { id: "WISE", label: "Wise" },
                      { id: "STRIPE", label: "Stripe" },
                      { id: "PAYONEER", label: "Payoneer" },
                    ] as const
                  ).map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setRemittanceChannel(ch.id)}
                      className={`p-2.5 rounded-xl border text-center font-medium transition-all cursor-pointer ${
                        remittanceChannel === ch.id
                          ? "border-cyan-400 bg-cyan-500/10 text-cyan-300"
                          : "border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-white/5"
                      }`}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Statutory Warnings & Audit Shield Points */}
              <div className="space-y-2">
                {evaluation.missingRequirements.length > 0 && (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-2 text-xs text-rose-300">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{isTr ? "Eksik Şartlar & Riskler:" : "Missing Requirements & Risks:"}</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 opacity-90 text-[11px]">
                      {evaluation.missingRequirements.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 space-y-2 text-xs text-cyan-300">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" />
                    <span>{isTr ? "Operis Yasal Güvence Notu:" : "Operis Statutory Protection:"}</span>
                  </div>
                  <p className="opacity-90 leading-relaxed text-[11px]">
                    {isTr
                      ? "Vergi müfettişlerinin yazılım ihracatı incelemelerinde en çok aradığı iki kanıt; (1) Sözleşmede münhasıran yurt dışında faydalanıldığına dair açık hüküm bulunması, (2) Bedelin yurt dışından Türkiye'deki banka hesabına girdiğinin tevsik edilmesidir. Operis, bu iki kanıtı deterministik olarak üretir ve HMK m. 193 adli delil paketine dahil eder."
                      : "Tax audits primarily demand: (1) An explicit contractual clause certifying foreign consumption, (2) Documentary proof that funds were received from abroad into Turkish bank accounts. Operis builds both exhibits deterministically into the evidentiary dossier."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INVOICE NOTE */}
          {activeTab === "invoice" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                    {isTr
                      ? "GİB e-Fatura / e-SMM İstisna Notu (İstisna Kodu: 302)"
                      : "Statutory Tax Invoice Exemption Text (Code: 302)"}
                  </h3>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    {isTr
                      ? "Faturayı keserken veya mali müşavirinize iletirken aşağıdaki yasal şerhi doğrudan kopyalayıp açıklama alanına yapıştırın."
                      : "Copy this statutory text into your e-Invoice or send to your CPA."}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyInvoice}
                  className="flex items-center gap-1.5 text-xs text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/10 cursor-pointer"
                >
                  {copiedInvoice ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{isTr ? "Kopyalandı!" : "Copied!"}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>{isTr ? "Şerhi Kopyala" : "Copy Note"}</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-cyan-500/20 font-mono text-xs text-cyan-200/90 whitespace-pre-wrap leading-relaxed select-all">
                {invoiceNote}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-black/20 border border-[var(--color-border-subtle)] space-y-1">
                  <div className="text-[var(--color-text-tertiary)] text-[10px] uppercase font-bold">
                    GİB İstisna Kodu
                  </div>
                  <div className="text-cyan-400 font-bold font-mono">302 - Hizmet İhracatı</div>
                </div>
                <div className="p-3 rounded-xl bg-black/20 border border-[var(--color-border-subtle)] space-y-1">
                  <div className="text-[var(--color-text-tertiary)] text-[10px] uppercase font-bold">
                    KDV Oranı
                  </div>
                  <div className="text-emerald-400 font-bold font-mono">%0 (Sıfır KDV)</div>
                </div>
                <div className="p-3 rounded-xl bg-black/20 border border-[var(--color-border-subtle)] space-y-1">
                  <div className="text-[var(--color-text-tertiary)] text-[10px] uppercase font-bold">
                    Gelir Vergisi İndirimi
                  </div>
                  <div className="text-emerald-400 font-bold font-mono">%100 (GVK 89/13)</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BANK REMITTANCE DECLARATION */}
          {activeTab === "bank" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                    {isTr
                      ? "Banka Döviz Tevsik & İhracat Bedeli Kabul Dilekçesi"
                      : "Bank Foreign Remittance Declaration Letter"}
                  </h3>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    {isTr
                      ? "Yurt dışından gelen dövizin banka tarafından DAB/İBKB veya ihracat bedeli olarak kaydedilmesi için şubenize verebileceğiniz hazır dilekçe."
                      : "Template letter for your bank branch confirming cross-border software export remittance."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyBank}
                    className="flex items-center gap-1.5 text-xs text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/10 cursor-pointer"
                  >
                    {copiedBank ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{isTr ? "Kopyalandı!" : "Copied!"}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>{isTr ? "Kopyala" : "Copy"}</span>
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadBank}
                    className="flex items-center gap-1.5 text-xs text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/10 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>{isTr ? "İndir (.txt)" : "Download"}</span>
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-cyan-500/20 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed select-all">
                {bankDeclaration}
              </div>
            </div>
          )}

          {/* TAB 4: CONTRACT ANNEX (EK-5) */}
          {activeTab === "annex" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                    {isTr
                      ? "EK-5: Yazılım İhracatı ve Vergi İstisnası Şartnamesi"
                      : "ANNEX-5: Cross-Border Software Export & Tax Exemption Addendum"}
                  </h3>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    {isTr
                      ? "Bu ek sözleşmeye ayrılmaz bir parça olarak dahil edilir ve SHA-256 adli delil mührüyle kriptografik olarak imzalanır."
                      : "This statutory addendum is appended to the contract and bound into the SHA-256 evidence fingerprint."}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyAnnex}
                  className="flex items-center gap-1.5 text-xs text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/10 cursor-pointer"
                >
                  {copiedAnnex ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{isTr ? "Kopyalandı!" : "Copied!"}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>{isTr ? "Kopyala" : "Copy"}</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-cyan-500/20 font-mono text-xs text-cyan-100/90 whitespace-pre-wrap leading-relaxed max-h-[360px] overflow-y-auto">
                {annexMarkdown}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-cyan-500/20 bg-black/30">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-text-tertiary)] hidden sm:inline">
              {isTr
                ? "Sözleşmede 'Yazılım Hizmet İhracatı Rejimi' aktif edilsin mi?"
                : "Enable Software Export Regime in Contract?"}
            </span>
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-cyan-500/50 text-cyan-500 focus:ring-0 cursor-pointer"
              />
              <span className={enabled ? "text-cyan-400" : "text-[var(--color-text-tertiary)]"}>
                {getExportModeLabel(enabled, isTr)}
              </span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] cursor-pointer"
            >
              {isTr ? "Vazgeç" : "Cancel"}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSave}
              className="text-xs bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold px-4 py-2 rounded-xl shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              {isTr ? "Ayarları Uygula ve Kaydet" : "Apply & Save to Contract"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
