"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog } from "../ui/dialog";
import {
  Shield,
  Globe,
  Hash,
  Calculator,
  TrendingUp,
  Scale,
  Sparkles,
  PenTool,
  FileText,
} from "lucide-react";
import type { GeneratedContractResult, ContractLanguage } from "@/src/modules/contracts/types";
import { TaxCalculatorWidget } from "../finance/tax-calculator-widget";
import { InflationCalculatorCard } from "../finance/inflation-calculator-card";
import { DpaWizardModal } from "../contracts/dpa/dpa-wizard-modal";
import type { DpaContractConfig } from "@/src/modules/contracts/dpa-types";
import { SafeHarborWizardModal } from "../contracts/safe-harbor/safe-harbor-wizard-modal";
import type { SafeHarborConfig } from "@/src/modules/contracts/safe-harbor-types";
import { AiGovernanceModal } from "../contracts/ai-governance/ai-governance-modal";
import type { AiGovernanceConfig } from "@/src/modules/contracts/ai-governance-types";
import { SoftwareExportWizardModal } from "../finance/software-export-wizard-modal";
import type { SoftwareExportConfig } from "@/src/modules/finance/software-export-types";
import { UnifiedContractSigningHub } from "../contracts/unified-contract-signing-hub";
import {
  parseInvoiceCurrency,
  getInflationShieldLabel,
  getTaxCalculatorLabel,
  getDpaButtonLabel,
  getSafeHarborButtonLabel,
  getAiGovButtonLabel,
  getSoftwareExportButtonLabel,
  getWhiteLabelButtonLabel,
  ContractBilingualViewer,
  ContractActionsToolbar,
  ContractProtocolBanners,
} from "./contracts";

export interface ContractDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  engagementId: string;
  listingTitle: string;
  category: string;
  matchedAt: string | Date;
  offerMessage: string;
  budgetLabel: string | null;
  timelineLabel: string | null;
  counterparty: {
    displayName: string;
    handle: string;
    email: string;
    phone: string | null;
  };
  currentUser: {
    displayName?: string;
    email?: string;
  };
  isOwner: boolean;
  locale: string;
}

export function ContractDraftModal({
  isOpen,
  onClose,
  engagementId,
  listingTitle,
  category: _category,
  matchedAt: _matchedAt,
  offerMessage: _offerMessage,
  budgetLabel,
  timelineLabel: _timelineLabel,
  counterparty: _counterparty,
  currentUser: _currentUser,
  isOwner: _isOwner,
  locale,
}: ContractDraftModalProps) {
  const initialLang: ContractLanguage = locale === "en" ? "en" : "tr";
  const [activeLang, setActiveLang] = useState<ContractLanguage>(initialLang);
  const [activeMainTab, setActiveMainTab] = useState<
    "SIGNING_HUB" | "CONTRACT_TEXT" | "FINANCE_TOOLS"
  >("SIGNING_HUB");
  const [contractData, setContractData] = useState<GeneratedContractResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showTaxCalculator, setShowTaxCalculator] = useState(false);
  const [showInflationShield, setShowInflationShield] = useState(false);
  const [dpaConfig, setDpaConfig] = useState<DpaContractConfig | null>(null);
  const [showDpaWizard, setShowDpaWizard] = useState(false);
  const [showSafeHarborWizard, setShowSafeHarborWizard] = useState(false);
  const [safeHarborConfig, setSafeHarborConfig] = useState<SafeHarborConfig | null>(null);
  const [showAiGovModal, setShowAiGovModal] = useState(false);
  const [aiGovConfig, setAiGovConfig] = useState<AiGovernanceConfig | null>(null);
  const [showExportWizard, setShowExportWizard] = useState(false);
  const [softwareExportConfig, setSoftwareExportConfig] = useState<SoftwareExportConfig | null>(null);
  const [isWhiteLabel, setIsWhiteLabel] = useState(false);

  const isTr = activeLang === "tr" || activeLang === "bilingual";

  // Check if foreign currency or export on mount
  useEffect(() => {
    if (budgetLabel && /[$€£]|USD|EUR|GBP/i.test(budgetLabel)) {
      setSoftwareExportConfig({
        enabled: true,
        clientCountry: locale === "en" ? "United States" : "Yurt Dışı / Global",
        isForeignEntity: true,
        isServiceUtilizedAbroad: true,
        remittanceChannel: "SWIFT_WIRE",
        repatriationDeclared: true,
        invoiceCurrency: parseInvoiceCurrency(budgetLabel),
      });
    }
  }, [budgetLabel, locale]);

  // Fetch official generated contract whenever modal opens or parameters change
  const loadContract = useCallback(
    async (
      lang: ContractLanguage,
      withInflation: boolean = showInflationShield,
      withDpa: DpaContractConfig | null = dpaConfig,
      withSafeHarbor: SafeHarborConfig | null = safeHarborConfig,
      withAiGov: AiGovernanceConfig | null = aiGovConfig,
      withSoftwareExport: SoftwareExportConfig | null = softwareExportConfig,
      whiteLabel: boolean = isWhiteLabel
    ) => {
      if (!engagementId) return;
      setIsLoading(true);
      setFetchError(null);
      try {
        const inflationParam = withInflation ? "&inflationShield=true" : "";
        let dpaParams = "";
        if (withDpa && withDpa.enabled) {
          dpaParams = `&dpa=true&dpaAccessLevel=${withDpa.accessLevel}&dpaCategories=${withDpa.dataCategories.join(",")}&dpaMeasures=${withDpa.securityMeasures.join(",")}&dpaSubProcessor=${withDpa.subProcessorAllowed ? "true" : "false"}&dpaBreachHours=${withDpa.breachNotificationHours || 24}`;
        }
        let safeHarborParams = "";
        if (withSafeHarbor && withSafeHarbor.enabled) {
          safeHarborParams = `&safeHarbor=true&shSchedule=${withSafeHarbor.scheduleAutonomy}&shEquipment=${withSafeHarbor.equipmentOwnership}&shHierarchy=${withSafeHarbor.managementHierarchy}&shExclusivity=${withSafeHarbor.exclusivityStatus}&shInvoicing=${withSafeHarbor.invoicingEntityStatus}&shIntegration=${withSafeHarbor.corporateIntegration}&shSubstitution=${withSafeHarbor.rightOfSubstitutionAllowed ? "true" : "false"}`;
        }
        let aiGovParams = "";
        if (withAiGov && withAiGov.enabled) {
          aiGovParams = `&aiGov=true&aiUsage=${withAiGov.usageLevel}&aiTools=${withAiGov.declaredTools.join(",")}&aiPrivacy=${withAiGov.dataPrivacyTier}&aiHumanLoop=${withAiGov.humanInTheLoopAffirmed ? "true" : "false"}&aiCopyleft=${withAiGov.copyleftFreeWarranted ? "true" : "false"}&aiZeroRetention=${withAiGov.zeroDataRetentionWarranted ? "true" : "false"}&aiDefectLiability=${withAiGov.strictDefectLiabilityAccepted ? "true" : "false"}&aiCodeReview=${withAiGov.codeReviewToolUsed ? "true" : "false"}`;
        }
        let exportParams = "";
        if (withSoftwareExport && withSoftwareExport.enabled) {
          exportParams = `&exportMode=true&exportCountry=${encodeURIComponent(withSoftwareExport.clientCountry || "")}&exportCurrency=${withSoftwareExport.invoiceCurrency || "USD"}&exportChannel=${withSoftwareExport.remittanceChannel || "SWIFT_WIRE"}&exportForeignClient=${withSoftwareExport.isForeignEntity ? "true" : "false"}&exportForeignUse=${withSoftwareExport.isServiceUtilizedAbroad ? "true" : "false"}&exportRepatriation=${withSoftwareExport.repatriationDeclared ? "true" : "false"}`;
        }
        const whiteLabelParam = whiteLabel ? "&whiteLabel=true" : "";
        const res = await fetch(
          `/api/work/${engagementId}/contract?lang=${lang}&format=json${inflationParam}${dpaParams}${safeHarborParams}${aiGovParams}${exportParams}${whiteLabelParam}`
        );
        if (!res.ok) {
          throw new Error(
            isTr ? "Sözleşme taslağı yüklenemedi." : "Failed to load contract draft."
          );
        }
        const data = await res.json();
        if (data.contract) {
          setContractData(data.contract);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error loading contract";
        setFetchError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [
      engagementId,
      isTr,
      showInflationShield,
      dpaConfig,
      safeHarborConfig,
      aiGovConfig,
      softwareExportConfig,
      isWhiteLabel,
    ]
  );

  useEffect(() => {
    if (isOpen) {
      loadContract(
        activeLang,
        showInflationShield,
        dpaConfig,
        safeHarborConfig,
        aiGovConfig,
        softwareExportConfig,
        isWhiteLabel
      );
    }
  }, [
    isOpen,
    activeLang,
    loadContract,
    showInflationShield,
    dpaConfig,
    safeHarborConfig,
    aiGovConfig,
    softwareExportConfig,
    isWhiteLabel,
  ]);

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title={
          isTr
            ? "1-Tıkla Akıllı Hizmet Sözleşmesi & Gizlilik (NDA)"
            : "1-Click Smart Service & Non-Disclosure Contract"
        }
        description={
          isTr
            ? "TBK 470 (Eser Sözleşmesi), FSEK m. 52 (Telif Devri) ve 6325 sayılı kanun (Arabuluculuk) güvenceli resmi taslak."
            : "Official statutory bilateral contract conforming to Turkish Code of Obligations, Copyright Act (FSEK), and Mediation Law."
        }
      >
        <div className="space-y-4">
          {/* Header Controls: Language Toggle & Quick Action Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-[var(--color-text-secondary)]" aria-hidden="true" />
              <span className="text-xs text-[var(--color-text-secondary)] font-medium">
                {isTr ? "Sözleşme Dili:" : "Contract Language:"}
              </span>
              <div className="inline-flex rounded-lg border border-[var(--color-border-subtle)] p-0.5 bg-[var(--color-surface-hover)]">
                <button
                  type="button"
                  onClick={() => setActiveLang("tr")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    activeLang === "tr"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  Türkçe (TR)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLang("en")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    activeLang === "en"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  English (EN)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLang("bilingual")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 ${
                    activeLang === "bilingual"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  }`}
                  title={
                    isTr
                      ? "Sol sütun Türkçe, Sağ sütun İngilizce paralel dizilim"
                      : "Dual-column Turkish and English parallel layout"
                  }
                >
                  <Globe className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span>{isTr ? "Çift Dilli (TR+EN)" : "Bilingual (TR+EN)"}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const next = !showInflationShield;
                  setShowInflationShield(next);
                  loadContract(activeLang, next);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  showInflationShield
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/25 hover:bg-amber-500/15"
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span>{getInflationShieldLabel(showInflationShield, isTr)}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTaxCalculator((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  showTaxCalculator
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm"
                    : "bg-cyan-500/10 text-cyan-400 border-cyan-500/25 hover:bg-cyan-500/15"
                }`}
              >
                <Calculator className="h-3.5 w-3.5" />
                <span>{getTaxCalculatorLabel(showTaxCalculator, isTr)}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDpaWizard(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  dpaConfig && dpaConfig.enabled
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/15"
                }`}
              >
                <Shield className="h-3.5 w-3.5" />
                <span>{getDpaButtonLabel(Boolean(dpaConfig && dpaConfig.enabled), isTr)}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSafeHarborWizard(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  safeHarborConfig && safeHarborConfig.enabled
                    ? "bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm"
                    : "bg-purple-500/10 text-purple-400 border-purple-500/25 hover:bg-purple-500/15"
                }`}
              >
                <Scale className="h-3.5 w-3.5" />
                <span>{getSafeHarborButtonLabel(Boolean(safeHarborConfig && safeHarborConfig.enabled), isTr)}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAiGovModal(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  aiGovConfig && aiGovConfig.enabled
                    ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-sm"
                    : "bg-indigo-500/10 text-indigo-400 border-indigo-500/25 hover:bg-indigo-500/15"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{getAiGovButtonLabel(Boolean(aiGovConfig && aiGovConfig.enabled), isTr)}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExportWizard(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  softwareExportConfig && softwareExportConfig.enabled
                    ? "bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-sm"
                    : "bg-teal-500/10 text-teal-400 border-teal-500/25 hover:bg-teal-500/15"
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                <span>{getSoftwareExportButtonLabel(Boolean(softwareExportConfig && softwareExportConfig.enabled), isTr)}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const next = !isWhiteLabel;
                  setIsWhiteLabel(next);
                  loadContract(
                    activeLang,
                    showInflationShield,
                    dpaConfig,
                    safeHarborConfig,
                    aiGovConfig,
                    softwareExportConfig,
                    next
                  );
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  isWhiteLabel
                    ? "bg-slate-700 text-white border-slate-500 shadow-sm"
                    : "bg-slate-800/40 text-slate-300 border-slate-700/60 hover:bg-slate-800/80"
                }`}
                title={
                  isTr
                    ? "Operis logosu ve marka başlıklarını gizleyerek kurumsal sade format uygular"
                    : "Removes Operis branding and header marks for neutral enterprise formatting"
                }
              >
                <span>{getWhiteLabelButtonLabel(isWhiteLabel, isTr)}</span>
              </button>

              {contractData && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px]">
                  <Hash className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span title={`SHA-256: ${contractData.sha256Fingerprint}`}>
                    Mühür: {contractData.sha256Fingerprint.slice(0, 8)}...
                    {contractData.sha256Fingerprint.slice(-6)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Main Navigation Segmented Tabs */}
          <div className="flex rounded-xl bg-[var(--color-surface-hover)] p-1 border border-[var(--color-border-subtle)]">
            <button
              type="button"
              onClick={() => setActiveMainTab("SIGNING_HUB")}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeMainTab === "SIGNING_HUB"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-[var(--color-text-secondary)] hover:text-white"
              }`}
            >
              <PenTool className="h-3.5 w-3.5" />
              <span>
                {isTr ? "Tek Sayfada E-İmza & Önerilen Paket" : "Single-Sign Hub & Package"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMainTab("CONTRACT_TEXT")}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeMainTab === "CONTRACT_TEXT"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-[var(--color-text-secondary)] hover:text-white"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>{isTr ? "Sözleşme Metni & Önizleme" : "Contract Text & Preview"}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMainTab("FINANCE_TOOLS")}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeMainTab === "FINANCE_TOOLS"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-[var(--color-text-secondary)] hover:text-white"
              }`}
            >
              <Scale className="h-3.5 w-3.5" />
              <span>{isTr ? "Finans & Yasal Araçlar" : "Finance & Legal Tools"}</span>
            </button>
          </div>

          {/* Tab 1: Single-Sign Hub & Smart Recommendations */}
          {activeMainTab === "SIGNING_HUB" && (
            <div className="pt-1">
              <UnifiedContractSigningHub
                engagementId={engagementId}
                isOwner={_isOwner}
                currentUser={_currentUser}
                counterparty={_counterparty}
                locale={activeLang}
                onViewFullText={() => setActiveMainTab("CONTRACT_TEXT")}
              />
            </div>
          )}

          {/* Tab 3: Finance & Legal Tools */}
          {activeMainTab === "FINANCE_TOOLS" && (
            <div className="space-y-4 pt-1">
              <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-[var(--color-border-subtle)]">
                <button
                  type="button"
                  onClick={() => {
                    const next = !showInflationShield;
                    setShowInflationShield(next);
                    loadContract(activeLang, next);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    showInflationShield
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/25 hover:bg-amber-500/15"
                  }`}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>{getInflationShieldLabel(showInflationShield, isTr)}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowTaxCalculator((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    showTaxCalculator
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm"
                      : "bg-cyan-500/10 text-cyan-400 border-cyan-500/25 hover:bg-cyan-500/15"
                  }`}
                >
                  <Calculator className="h-3.5 w-3.5" />
                  <span>{getTaxCalculatorLabel(showTaxCalculator, isTr)}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDpaWizard(true)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    dpaConfig && dpaConfig.enabled
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm"
                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/15"
                  }`}
                >
                  <Shield className="h-3.5 w-3.5" />
                  <span>{getDpaButtonLabel(Boolean(dpaConfig && dpaConfig.enabled), isTr)}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSafeHarborWizard(true)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    safeHarborConfig && safeHarborConfig.enabled
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm"
                      : "bg-purple-500/10 text-purple-400 border-purple-500/25 hover:bg-purple-500/15"
                  }`}
                >
                  <Scale className="h-3.5 w-3.5" />
                  <span>{getSafeHarborButtonLabel(Boolean(safeHarborConfig && safeHarborConfig.enabled), isTr)}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAiGovModal(true)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    aiGovConfig && aiGovConfig.enabled
                      ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-sm"
                      : "bg-indigo-500/10 text-indigo-400 border-indigo-500/25 hover:bg-indigo-500/15"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{getAiGovButtonLabel(Boolean(aiGovConfig && aiGovConfig.enabled), isTr)}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowExportWizard(true)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    softwareExportConfig && softwareExportConfig.enabled
                      ? "bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-sm"
                      : "bg-teal-500/10 text-teal-400 border-teal-500/25 hover:bg-teal-500/15"
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>{getSoftwareExportButtonLabel(Boolean(softwareExportConfig && softwareExportConfig.enabled), isTr)}</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Full Contract Text & Inspection */}
          {activeMainTab === "CONTRACT_TEXT" && (
            <div className="space-y-4 pt-1">
              <ContractProtocolBanners
                dpaConfig={dpaConfig}
                safeHarborConfig={safeHarborConfig}
                aiGovConfig={aiGovConfig}
                softwareExportConfig={softwareExportConfig}
                contractData={contractData}
                activeLang={activeLang}
                isTr={isTr}
                onOpenDpaWizard={() => setShowDpaWizard(true)}
                onOpenSafeHarborWizard={() => setShowSafeHarborWizard(true)}
                onOpenAiGovModal={() => setShowAiGovModal(true)}
                onOpenExportWizard={() => setShowExportWizard(true)}
              />

              {/* Interactive Inflation Shield Drawer */}
              {showInflationShield && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-950/10 p-1 animate-in fade-in zoom-in-95 duration-200">
                  <InflationCalculatorCard
                    initialAmount={
                      budgetLabel ? parseFloat(budgetLabel.replace(/[^0-9.]/g, "")) || 50000 : 50000
                    }
                    currency="TRY"
                    locale={activeLang}
                    compactMode
                    onApplyToContract={() => {
                      loadContract(activeLang, true);
                    }}
                    onClose={() => setShowInflationShield(false)}
                  />
                </div>
              )}

              {/* Interactive Tax Simulator Drawer */}
              {showTaxCalculator && (
                <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/10 p-1 animate-in fade-in zoom-in-95 duration-200">
                  <TaxCalculatorWidget
                    initialAmount={budgetLabel || "50000"}
                    currency="TRY"
                    locale={activeLang}
                    compactMode
                    onClose={() => setShowTaxCalculator(false)}
                  />
                </div>
              )}

              {/* Contract Preview Content */}
              <ContractBilingualViewer
                isLoading={isLoading}
                fetchError={fetchError}
                activeLang={activeLang}
                contractData={contractData}
                listingTitle={listingTitle}
                isTr={isTr}
              />

              {/* Actions Toolbar */}
              <ContractActionsToolbar
                isLoading={isLoading}
                contractData={contractData}
                activeLang={activeLang}
                isTr={isTr}
                engagementId={engagementId}
                isWhiteLabel={isWhiteLabel}
                onClose={onClose}
              />
            </div>
          )}
        </div>
      </Dialog>

      <DpaWizardModal
        isOpen={showDpaWizard}
        onClose={() => setShowDpaWizard(false)}
        initialConfig={dpaConfig}
        locale={activeLang}
        onSave={(newConfig) => {
          setDpaConfig(newConfig);
          loadContract(activeLang, showInflationShield, newConfig, safeHarborConfig);
        }}
      />

      <SafeHarborWizardModal
        isOpen={showSafeHarborWizard}
        onClose={() => setShowSafeHarborWizard(false)}
        initialConfig={safeHarborConfig}
        locale={activeLang}
        onSave={(newConfig) => {
          setSafeHarborConfig(newConfig);
          loadContract(activeLang, showInflationShield, dpaConfig, newConfig, aiGovConfig);
        }}
      />

      <AiGovernanceModal
        isOpen={showAiGovModal}
        onClose={() => setShowAiGovModal(false)}
        initialConfig={aiGovConfig}
        locale={activeLang}
        onSave={(newConfig) => {
          setAiGovConfig(newConfig);
          loadContract(
            activeLang,
            showInflationShield,
            dpaConfig,
            safeHarborConfig,
            newConfig,
            softwareExportConfig
          );
        }}
      />

      <SoftwareExportWizardModal
        isOpen={showExportWizard}
        onClose={() => setShowExportWizard(false)}
        initialConfig={softwareExportConfig}
        clientName={_counterparty?.displayName || (isTr ? "Yurt Dışı Müşteri" : "Foreign Client")}
        contractorName={_currentUser?.displayName || (isTr ? "Yazılım Uzmanı" : "Contractor")}
        budgetLabel={budgetLabel || "5,000 USD"}
        locale={activeLang}
        onSaveConfig={(newConfig) => {
          setSoftwareExportConfig(newConfig);
          loadContract(
            activeLang,
            showInflationShield,
            dpaConfig,
            safeHarborConfig,
            aiGovConfig,
            newConfig
          );
        }}
      />
    </>
  );
}
