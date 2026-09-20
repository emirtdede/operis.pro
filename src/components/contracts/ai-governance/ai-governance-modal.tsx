"use client";

import { useState, useMemo } from "react";
import { Dialog } from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Lock,
  FileCheck2,
  Layers,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import type {
  AiGovernanceConfig,
  AiUsageLevel,
  AiToolProvider,
  AiDataPrivacyTier,
} from "@/src/modules/contracts/ai-governance-types";
import { AiGovernanceEngine } from "@/src/modules/contracts/ai-governance-engine";
import { AiGovernanceBadge } from "./ai-governance-badge";

export interface AiGovernanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: AiGovernanceConfig | null) => void;
  initialConfig?: AiGovernanceConfig | null;
  locale?: string;
}

function getRiskSummaryBoxClass(riskLevel: string): string {
  if (riskLevel === "PRISTINE_IP_SAFE") {
    return "bg-emerald-500/10 border-emerald-500/30 text-emerald-200";
  }
  if (riskLevel === "COMMERCIALLY_VIABLE_MONITORED") {
    return "bg-amber-500/10 border-amber-500/30 text-amber-200";
  }
  return "bg-rose-500/10 border-rose-500/30 text-rose-200";
}

function renderRiskIcon(riskLevel: string) {
  if (riskLevel === "PRISTINE_IP_SAFE") {
    return <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />;
  }
  if (riskLevel === "COMMERCIALLY_VIABLE_MONITORED") {
    return <Cpu className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />;
  }
  return <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />;
}

export function AiGovernanceModal({
  isOpen,
  onClose,
  onSave,
  initialConfig,
  locale = "tr",
}: AiGovernanceModalProps) {
  const isTr = locale === "tr";

  const defaultConfig = useMemo(() => AiGovernanceEngine.getDefaultConfig(), []);

  const [usageLevel, setUsageLevel] = useState<AiUsageLevel>(
    initialConfig?.usageLevel || defaultConfig.usageLevel
  );
  const [declaredTools, setDeclaredTools] = useState<AiToolProvider[]>(
    initialConfig?.declaredTools || defaultConfig.declaredTools
  );
  const [dataPrivacyTier, setDataPrivacyTier] = useState<AiDataPrivacyTier>(
    initialConfig?.dataPrivacyTier || defaultConfig.dataPrivacyTier
  );
  const [humanInTheLoopAffirmed, setHumanInTheLoopAffirmed] = useState<boolean>(
    initialConfig?.humanInTheLoopAffirmed ?? defaultConfig.humanInTheLoopAffirmed
  );
  const [copyleftFreeWarranted, setCopyleftFreeWarranted] = useState<boolean>(
    initialConfig?.copyleftFreeWarranted ?? defaultConfig.copyleftFreeWarranted
  );
  const [zeroDataRetentionWarranted, setZeroDataRetentionWarranted] = useState<boolean>(
    initialConfig?.zeroDataRetentionWarranted ?? defaultConfig.zeroDataRetentionWarranted
  );
  const [strictDefectLiabilityAccepted, setStrictDefectLiabilityAccepted] = useState<boolean>(
    initialConfig?.strictDefectLiabilityAccepted ?? defaultConfig.strictDefectLiabilityAccepted
  );
  const [codeReviewToolUsed, setCodeReviewToolUsed] = useState<boolean>(
    initialConfig?.codeReviewToolUsed ?? defaultConfig.codeReviewToolUsed ?? true
  );

  // Toggle tools
  const toggleTool = (tool: AiToolProvider) => {
    if (declaredTools.includes(tool)) {
      setDeclaredTools(declaredTools.filter((t) => t !== tool));
    } else {
      setDeclaredTools([...declaredTools, tool]);
    }
  };

  // Live evaluation calculation
  const currentConfig: AiGovernanceConfig = useMemo(
    () => ({
      enabled: true,
      usageLevel,
      declaredTools,
      dataPrivacyTier,
      humanInTheLoopAffirmed,
      copyleftFreeWarranted,
      zeroDataRetentionWarranted,
      strictDefectLiabilityAccepted,
      codeReviewToolUsed,
    }),
    [
      usageLevel,
      declaredTools,
      dataPrivacyTier,
      humanInTheLoopAffirmed,
      copyleftFreeWarranted,
      zeroDataRetentionWarranted,
      strictDefectLiabilityAccepted,
      codeReviewToolUsed,
    ]
  );

  const evaluation = useMemo(
    () => AiGovernanceEngine.evaluateAiGovernanceRisk(currentConfig),
    [currentConfig]
  );

  const handleApply = () => {
    onSave(currentConfig);
    onClose();
  };

  const handleRemove = () => {
    onSave(null);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        isTr
          ? "🤖 AB Yapay Zeka Yasası & FSEK m. 52 Telif Güvence Kalkanı (EK-4)"
          : "EU AI Act & FSEK Art. 52 AI-Assisted Code IP & Warranty Shield"
      }
      description={
        isTr
          ? "Geliştiricinin kullandığı AI araçlarını şeffaflaştırır, FSEK m. 52 telif devrini insan katkısıyla geçerli kılar ve copyleft/halüsinasyon risklerini sözleşmeye bağlar."
          : "Certifies human-in-the-loop authorship, ensures bulletproof copyright transfer under statutory doctrine, and shields against viral copyleft contamination."
      }
      className="max-w-3xl max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-5 pt-2">
        {/* Top Risk Score Bar */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-semibold text-purple-300">
              {isTr ? "Operis AI-IP Risk Endeksi:" : "Operis AI-IP Risk Index:"}
            </span>
          </div>
          <AiGovernanceBadge
            level={evaluation.riskLevel}
            score={evaluation.riskScore}
            locale={locale}
          />
        </div>

        {/* Real-time Assessment Summary Box */}
        <div
          className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${getRiskSummaryBoxClass(evaluation.riskLevel)}`}
        >
          {renderRiskIcon(evaluation.riskLevel)}
          <div className="space-y-1 text-xs">
            <p className="font-semibold text-[var(--color-text-primary)]">
              {isTr ? evaluation.summaryTr : evaluation.summaryEn}
            </p>
            {evaluation.remedialMitigationsTr.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/10">
                <span className="font-bold text-[11px] block mb-1">
                  {isTr ? "💡 Hukuki ve Teknik Önlemler:" : "💡 Recommended Precautions:"}
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] opacity-90">
                  {(isTr
                    ? evaluation.remedialMitigationsTr
                    : evaluation.remedialMitigationsEn
                  ).map((m, idx) => (
                    <li key={idx}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Section 1: AI Usage Intensity */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-blue-400" />
            <span>{isTr ? "1. Projedeki Yapay Zeka Kullanım Düzeyi" : "1. AI Usage Intensity"}</span>
            <span className="text-[10px] text-blue-400/80 font-normal">
              ({isTr ? "Ağırlık: 35p" : "Weight: 35pts"})
            </span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              {
                val: "AI_FREE_HUMAN_ONLY",
                titleTr: "%100 İnsan Eliyle Kodlama",
                titleEn: "100% Pure Human Coding",
                descTr: "AI kodu yok, saf insan eseri (FSEK tam koruma)",
                descEn: "Zero AI code; pure human authorship",
                pts: "0p (Kusursuz)",
              },
              {
                val: "AI_ASSISTED_HUMAN_REVIEWED",
                titleTr: "İnsan Denetimli AI (Sektör Standardı)",
                titleEn: "Human-in-the-Loop AI Copilot",
                descTr: "Cursor/Copilot destekli, insan mimarisi ve revizyonu",
                descEn: "AI copilot with human review & architecture",
                pts: "15p (Standart)",
              },
              {
                val: "HEAVY_AI_GENERATED",
                titleTr: "Yoğun Otonom AI Üretimi",
                titleEn: "Heavy AI Autonomous Scaffolding",
                descTr: "Büyük kod blokları otonom üretildi",
                descEn: "Major scaffolds generated by LLMs",
                pts: "35p (Riskli)",
              },
            ].map((opt) => (
              <div
                key={opt.val}
                onClick={() => setUsageLevel(opt.val as AiUsageLevel)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  usageLevel === opt.val
                    ? "bg-blue-500/10 border-blue-500 text-[var(--color-text-primary)] shadow-sm"
                    : "bg-[var(--color-surface-hover)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-[var(--color-border)]"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span>{isTr ? opt.titleTr : opt.titleEn}</span>
                  <span className="text-[10px] font-mono opacity-80">{opt.pts}</span>
                </div>
                <p className="text-[11px] leading-tight opacity-80">
                  {isTr ? opt.descTr : opt.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Declared Tools (EU AI Act Transparency) */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5 text-blue-400" />
            <span>{isTr ? "2. Kullanılan Yapay Zeka Araçları (EU AI Act m. 50 Beyanı)" : "2. Declared AI Tools (EU AI Act Disclosure)"}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "CURSOR", label: "Cursor IDE" },
              { id: "GITHUB_COPILOT", label: "GitHub Copilot" },
              { id: "CLAUDE_CODE", label: "Anthropic Claude Code" },
              { id: "CHATGPT_ENTERPRISE", label: "ChatGPT Enterprise" },
              { id: "LOCAL_OFFLINE_LLM", label: "Local / Offline LLM" },
              { id: "CUSTOM_PROPRIETARY", label: "Custom Model" },
            ].map((tool) => {
              const active = declaredTools.includes(tool.id as AiToolProvider);
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => toggleTool(tool.id as AiToolProvider)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                    active
                      ? "bg-purple-500/15 border-purple-500/40 text-purple-200"
                      : "bg-[var(--color-surface-hover)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-[var(--color-border)]"
                  }`}
                >
                  <CheckCircle2
                    className={`h-3 w-3 ${active ? "text-purple-400" : "text-transparent"}`}
                  />
                  <span>{tool.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Data Privacy & Zero Retention */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-blue-400" />
            <span>{isTr ? "3. Müşteri Veri Gizliliği ve Sıfır Saklama (Zero Data Retention)" : "3. Data Privacy & Zero Retention"}</span>
            <span className="text-[10px] text-blue-400/80 font-normal">
              ({isTr ? "Ağırlık: 25p" : "Weight: 25pts"})
            </span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              {
                val: "ENTERPRISE_ZERO_RETENTION",
                titleTr: "Kurumsal Sıfır Saklama",
                titleEn: "Enterprise Zero-Retention",
                descTr: "Müşteri kodları model eğitimine dahil edilmez",
                descEn: "Opted out of all foundation model training",
                pts: "0p (Güvenli)",
              },
              {
                val: "LOCAL_OFFLINE_EXECUTION",
                titleTr: "Yerel Çevrimdışı Çalıştırma",
                titleEn: "Local Air-Gapped LLM",
                descTr: "Kodlar sunucu dışına veya internete çıkmaz",
                descEn: "Runs on local hardware without data egress",
                pts: "0p (Kusursuz)",
              },
              {
                val: "CONSUMER_PUBLIC_TRAINING_RISK",
                titleTr: "Halka Açık Tüketici Sürümü",
                titleEn: "Public Consumer Tier",
                descTr: "Prompt ve kodların eğitime aktarılma riski var",
                descEn: "Data may be used for model training",
                pts: "25p (Riskli)",
              },
            ].map((opt) => (
              <div
                key={opt.val}
                onClick={() => setDataPrivacyTier(opt.val as AiDataPrivacyTier)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  dataPrivacyTier === opt.val
                    ? "bg-blue-500/10 border-blue-500 text-[var(--color-text-primary)] shadow-sm"
                    : "bg-[var(--color-surface-hover)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-[var(--color-border)]"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span>{isTr ? opt.titleTr : opt.titleEn}</span>
                  <span className="text-[10px] font-mono opacity-80">{opt.pts}</span>
                </div>
                <p className="text-[11px] leading-tight opacity-80">
                  {isTr ? opt.descTr : opt.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Legal Warranties & Affirmations */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
            <FileCheck2 className="h-3.5 w-3.5 text-blue-400" />
            <span>{isTr ? "4. Yasal Taahhütler ve Hukuki Güvenceler (FSEK / TBK)" : "4. Legal Warranties & Safeguards"}</span>
          </label>
          <div className="space-y-2">
            {[
              {
                id: "humanLoop",
                checked: humanInTheLoopAffirmed,
                onChange: setHumanInTheLoopAffirmed,
                labelTr: "FSEK m. 52 İnsani Hususiyet (Human-in-the-Loop) Taahhüdü",
                labelEn: "FSEK Art. 52 Human-in-the-Loop Authorship Warranty",
                descTr: "Yüklenici sistem mimarisini ve kodları insan aklıyla denetlediğini, FSEK m. 1/B 'hususiyet' unsurunun tam olduğunu teyit eder. (Eksikse +20p ceza)",
                descEn: "Affirms human engineering oversight ensuring valid copyright assignment under IP law.",
              },
              {
                id: "copyleft",
                checked: copyleftFreeWarranted,
                onChange: setCopyleftFreeWarranted,
                labelTr: "Açık Kaynak ve Copyleft (GPL/AGPL) Lisans Temizliği Garantisi",
                labelEn: "Viral Copyleft (GPL/AGPL) License Cleanliness Warranty",
                descTr: "AI çıktılarının müşterinin ticarî kapalı kaynak yazılımına GPL/AGPL virüsü bulaştırmadığı kesin garanti edilir. (Eksikse +15p ceza)",
                descEn: "Warrants that AI-suggested snippets carry no viral copyleft open-source obligations.",
              },
              {
                id: "zeroRetention",
                checked: zeroDataRetentionWarranted,
                onChange: setZeroDataRetentionWarranted,
                labelTr: "Müşteri Kodlarının AI Eğitimine Aktarılmadığı Taahhüdü",
                labelEn: "Zero Data Retention / Non-Training Guarantee",
                descTr: "Müşterinin ticari sırları, şemaları ve kodları genel yapay zeka eğitim havuzlarına girilmeyecektir.",
                descEn: "Client proprietary code and database schemas will never be fed into public model training.",
              },
              {
                id: "defectLiability",
                checked: strictDefectLiabilityAccepted,
                onChange: setStrictDefectLiabilityAccepted,
                labelTr: "TBK m. 474 Halüsinasyon & Güvenlik Açığı Sorumluluğu",
                labelEn: "TBK Art. 474 AI Hallucination & Defect Liability",
                descTr: "Yapay zeka halüsinasyonları ve güvenlik açıkları doğrudan yüklenicinin ayıbı sayılır ve bila-ücret giderilir. (Eksikse +10p ceza)",
                descEn: "AI hallucinations and security bugs constitute contractor defects under statutory warranty.",
              },
              {
                id: "codeReview",
                checked: codeReviewToolUsed,
                onChange: setCodeReviewToolUsed,
                labelTr: "Otomatik Güvenlik ve Lisans Taraması (SonarQube / Snyk / Trivy)",
                labelEn: "Automated Security & License Audit Tooling",
                descTr: "Kod tabanında otomatik statik analiz ve lisans tarama araçları kullanılmaktadır. (-5p indirim)",
                descEn: "Static application security and license scanning tools deployed.",
              },
            ].map((item) => (
              <label
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] cursor-pointer hover:border-[var(--color-border)] transition-all"
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) => item.onChange(e.target.checked)}
                  className="mt-0.5 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                />
                <div className="space-y-0.5 text-xs">
                  <div className="font-semibold text-[var(--color-text-primary)]">
                    {isTr ? item.labelTr : item.labelEn}
                  </div>
                  <p className="text-[11px] text-[var(--color-text-secondary)] leading-tight">
                    {isTr ? item.descTr : item.descEn}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
          <div>
            {initialConfig && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isTr ? "Kalkanı Kaldır" : "Remove Shield"}</span>
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              {isTr ? "İptal" : "Cancel"}
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isTr ? "Uygula & EK-4'ü Sözleşmeye Ekle" : "Apply & Attach Annex-4"}</span>
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
