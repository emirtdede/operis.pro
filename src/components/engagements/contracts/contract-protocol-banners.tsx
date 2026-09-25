"use client";

import { Shield, Layers, Scale, Bot, Globe, ScrollText } from "lucide-react";
import type { GeneratedContractResult, ContractLanguage } from "@/src/modules/contracts/types";
import { DpaBadge } from "@/src/components/contracts/dpa/dpa-badge";
import { DpaEngine } from "@/src/modules/contracts/dpa-engine";
import type { DpaContractConfig } from "@/src/modules/contracts/dpa-types";
import { SafeHarborBadge } from "@/src/components/contracts/safe-harbor/safe-harbor-badge";
import type { SafeHarborConfig } from "@/src/modules/contracts/safe-harbor-types";
import { AiGovernanceBadge } from "@/src/components/contracts/ai-governance/ai-governance-badge";
import type { AiGovernanceConfig } from "@/src/modules/contracts/ai-governance-types";
import { SoftwareExportBadge } from "@/src/components/finance/software-export-badge";
import type { SoftwareExportConfig } from "@/src/modules/finance/software-export-types";
import { SquadProposalBadge } from "@/src/components/offers/squad/squad-proposal-badge";

export interface ContractProtocolBannersProps {
  dpaConfig: DpaContractConfig | null;
  safeHarborConfig: SafeHarborConfig | null;
  aiGovConfig: AiGovernanceConfig | null;
  softwareExportConfig: SoftwareExportConfig | null;
  contractData: GeneratedContractResult | null;
  activeLang: ContractLanguage;
  isTr: boolean;
  onOpenDpaWizard: () => void;
  onOpenSafeHarborWizard: () => void;
  onOpenAiGovModal: () => void;
  onOpenExportWizard: () => void;
}

export function ContractProtocolBanners({
  dpaConfig,
  safeHarborConfig,
  aiGovConfig,
  softwareExportConfig,
  contractData,
  activeLang,
  isTr,
  onOpenDpaWizard,
  onOpenSafeHarborWizard,
  onOpenAiGovModal,
  onOpenExportWizard,
}: ContractProtocolBannersProps) {
  return (
    <>
      {/* Active DPA Protocol Banner */}
      {dpaConfig && dpaConfig.enabled && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
            <span className="font-semibold text-emerald-300">
              {isTr
                ? "EK-2: Bilişim Veri İşleme Protokolü Sözleşmeye Dahil Edildi"
                : "ANNEX-2: Data Processing Addendum Attached"}
            </span>
            {(() => {
              const evalResult = DpaEngine.evaluateDpaRisk(dpaConfig);
              return (
                <DpaBadge
                  level={evalResult.riskLevel}
                  score={evalResult.riskScore}
                  locale={activeLang}
                  onClick={onOpenDpaWizard}
                />
              );
            })()}
          </div>
          <button
            type="button"
            onClick={onOpenDpaWizard}
            className="text-emerald-400 hover:text-emerald-300 underline font-medium text-[11px] cursor-pointer"
          >
            {isTr ? "Protokolü Yapılandır" : "Configure DPA"}
          </button>
        </div>
      )}

      {/* Active Safe Harbor Protocol Banner */}
      {safeHarborConfig && safeHarborConfig.enabled && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Scale className="w-3.5 h-3.5 text-purple-400 shrink-0" aria-hidden="true" />
            <span className="font-semibold text-purple-300">
              {isTr
                ? "EK-3: İş Kanunu Madde 8 Güvenli Liman Sözleşmeye Dahil Edildi"
                : "ANNEX-3: Labor Code Safe Harbor Attached"}
            </span>
            <SafeHarborBadge
              config={safeHarborConfig}
              locale={activeLang}
              onClick={onOpenSafeHarborWizard}
            />
          </div>
          <button
            type="button"
            onClick={onOpenSafeHarborWizard}
            className="text-purple-400 hover:text-purple-300 underline font-medium text-[11px] cursor-pointer"
          >
            {isTr ? "Kalkanı Yapılandır" : "Configure Safe Harbor"}
          </button>
        </div>
      )}

      {/* Active AI Governance Protocol Banner */}
      {aiGovConfig && aiGovConfig.enabled && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Bot className="w-3.5 h-3.5 text-indigo-400 shrink-0" aria-hidden="true" />
            <span className="font-semibold text-indigo-300">
              {isTr
                ? "EK-4: Yapay Zeka Telif Devri ve Lisans Temizliği Şartnamesi Dahil Edildi"
                : "ANNEX-4: AI-Assisted Code IP & Warranty Protocol Attached"}
            </span>
            <AiGovernanceBadge
              config={aiGovConfig}
              locale={activeLang}
              onClick={onOpenAiGovModal}
            />
          </div>
          <button
            type="button"
            onClick={onOpenAiGovModal}
            className="text-indigo-400 hover:text-indigo-300 underline font-medium text-[11px] cursor-pointer"
          >
            {isTr ? "Kalkanı Yapılandır" : "Configure AI Shield"}
          </button>
        </div>
      )}

      {/* Active Software Export Regime Banner */}
      {softwareExportConfig && softwareExportConfig.enabled && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-teal-950/20 border border-teal-500/30 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-teal-400 shrink-0" aria-hidden="true" />
            <span className="font-semibold text-teal-300">
              {isTr
                ? "EK-5: Yazılım İhracatı %100 Vergi İndirimi & %0 KDV Şartnamesi Dahil Edildi"
                : "ANNEX-5: Software Export 100% Tax Deduction & Zero-VAT Attached"}
            </span>
            <SoftwareExportBadge
              config={softwareExportConfig}
              locale={activeLang}
              onClick={onOpenExportWizard}
            />
          </div>
          <button
            type="button"
            onClick={onOpenExportWizard}
            className="text-teal-400 hover:text-teal-300 underline font-medium text-[11px] cursor-pointer"
          >
            {isTr ? "İstisna Notu & Dilekçe Görüntüle →" : "View Invoice Note & Letter →"}
          </button>
        </div>
      )}

      {/* Legal Armor Explanation */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-3.5 text-xs text-[var(--color-text-secondary)] leading-relaxed">
        <Shield className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <span className="font-semibold text-[var(--color-text-primary)]">
            {isTr
              ? "Hukuki Koruma ve Hak Devir Güvencesi: "
              : "Statutory IP Transfer & Escrow Waiver: "}
          </span>
          {isTr
            ? "Operis emanet para tutmaz. FSEK m. 52 uyarınca telif hakları ancak son ödeme eksiksiz yapıldığında devredilir. Kapsam kaymasına karşı en fazla 2 revizyon ve 30 gün hata garantisi taahhüt edilmiştir."
            : "Operis operates zero escrow. Under FSEK Art. 52, IP economic rights transfer only upon full settlement. Scope creep protection limits revisions to 2 rounds with a 30-day warranty."}
        </div>
      </div>

      {/* Squad Consortium Contract Callout */}
      {contractData?.isSquadContract && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-[var(--color-surface-base)] to-purple-950/30 p-3.5 text-xs">
          <SquadProposalBadge
            memberCount={contractData.squadMembers?.length}
            squadTitle={contractData.squadTitle}
            locale={activeLang}
            size="sm"
          />
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-300">
            <ScrollText className="w-3.5 h-3.5 text-indigo-400 shrink-0" aria-hidden="true" />
            {isTr
              ? "TBK m. 620 Adi Ortaklık / Konsorsiyum Şartları Uygulanmaktadır"
              : "Under TBK Art. 620 & Joint Consortium Terms"}
          </span>
        </div>
      )}

      {/* 3-Step Milestone Recommendation */}
      <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold text-xs text-[var(--color-text-primary)]">
            <Layers className="h-4 w-4 text-blue-400" aria-hidden="true" />
            <span>
              {isTr ? "3 Aşamalı Kilometre Taşı Çizelgesi" : "3-Stage Milestone Schedule"}
            </span>
          </div>
          <span className="text-[10px] text-[var(--color-text-tertiary)]">
            {isTr ? "TBK 470 Uyumlu" : "Statutory Model"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5 space-y-0.5">
            <div className="flex items-center justify-between font-bold text-emerald-400 text-xs">
              <span>{isTr ? "1. Aşama" : "Phase 1"}</span>
              <span className="px-1 py-0.5 rounded bg-emerald-500/20 font-mono text-[10px]">
                %30
              </span>
            </div>
            <div className="font-semibold text-[var(--color-text-primary)] text-[11px]">
              {isTr ? "Tasarım & Mimari Onayı" : "Design & Architecture"}
            </div>
            <p className="text-[10px] text-[var(--color-text-secondary)] leading-normal">
              {isTr
                ? "Arayüz ve altyapı onayı sonrası avans."
                : "Initial advance upon architecture sign-off."}
            </p>
          </div>

          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-2.5 space-y-0.5">
            <div className="flex items-center justify-between font-bold text-blue-400 text-xs">
              <span>{isTr ? "2. Aşama" : "Phase 2"}</span>
              <span className="px-1 py-0.5 rounded bg-blue-500/20 font-mono text-[10px]">
                %40
              </span>
            </div>
            <div className="font-semibold text-[var(--color-text-primary)] text-[11px]">
              {isTr ? "Fonksiyonel Demo & Test" : "Functional Demo & Test"}
            </div>
            <p className="text-[10px] text-[var(--color-text-secondary)] leading-normal">
              {isTr
                ? "Çalışan prototip kabulüyle ara hak ediş."
                : "Interim payment on working prototype."}
            </p>
          </div>

          <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-2.5 space-y-0.5">
            <div className="flex items-center justify-between font-bold text-purple-400 text-xs">
              <span>{isTr ? "3. Aşama" : "Phase 3"}</span>
              <span className="px-1 py-0.5 rounded bg-purple-500/20 font-mono text-[10px]">
                %30
              </span>
            </div>
            <div className="font-semibold text-[var(--color-text-primary)] text-[11px]">
              {isTr ? "Kod & FSEK Mülkiyet Devri" : "Handover & IP Transfer"}
            </div>
            <p className="text-[10px] text-[var(--color-text-secondary)] leading-normal">
              {isTr
                ? "Canlıya alma ve mülkiyet devriyle son ödeme."
                : "Final settlement and IP assignment."}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
