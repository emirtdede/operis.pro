"use client";

import { useState, useMemo } from "react";
import { Dialog } from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Laptop,
  Users2,
  Briefcase,
  Receipt,
  Mail,
  Scale,
  Sparkles,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import {
  ScheduleAutonomy,
  EquipmentOwnership,
  ManagementHierarchy,
  ExclusivityStatus,
  InvoicingEntityStatus,
  CorporateIntegration,
  SafeHarborConfig,
} from "@/src/modules/contracts/safe-harbor-types";
import { SafeHarborEngine } from "@/src/modules/contracts/safe-harbor-engine";
import { SafeHarborBadge } from "./safe-harbor-badge";

export interface SafeHarborWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: SafeHarborConfig | null) => void;
  initialConfig?: SafeHarborConfig | null;
  locale?: string;
}

function getSafeHarborRiskBoxClass(riskLevel: string): string {
  if (riskLevel === "SAFE_HARBOR") {
    return "bg-emerald-500/10 border-emerald-500/30 text-emerald-200";
  }
  if (riskLevel === "MODERATE_WARNING") {
    return "bg-amber-500/10 border-amber-500/30 text-amber-200";
  }
  return "bg-rose-500/10 border-rose-500/30 text-rose-200";
}

function renderSafeHarborRiskIcon(riskLevel: string) {
  if (riskLevel === "SAFE_HARBOR") {
    return <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />;
  }
  if (riskLevel === "MODERATE_WARNING") {
    return <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />;
  }
  return <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />;
}

export function SafeHarborWizardModal({
  isOpen,
  onClose,
  onSave,
  initialConfig,
  locale = "tr",
}: SafeHarborWizardModalProps) {
  const isTr = locale === "tr";

  const defaultConfig = useMemo(() => SafeHarborEngine.getDefaultConfig(), []);

  const [scheduleAutonomy, setScheduleAutonomy] = useState<ScheduleAutonomy>(
    initialConfig?.scheduleAutonomy || defaultConfig.scheduleAutonomy
  );
  const [equipmentOwnership, setEquipmentOwnership] = useState<EquipmentOwnership>(
    initialConfig?.equipmentOwnership || defaultConfig.equipmentOwnership
  );
  const [managementHierarchy, setManagementHierarchy] = useState<ManagementHierarchy>(
    initialConfig?.managementHierarchy || defaultConfig.managementHierarchy
  );
  const [exclusivityStatus, setExclusivityStatus] = useState<ExclusivityStatus>(
    initialConfig?.exclusivityStatus || defaultConfig.exclusivityStatus
  );
  const [invoicingEntityStatus, setInvoicingEntityStatus] = useState<InvoicingEntityStatus>(
    initialConfig?.invoicingEntityStatus || defaultConfig.invoicingEntityStatus
  );
  const [corporateIntegration, setCorporateIntegration] = useState<CorporateIntegration>(
    initialConfig?.corporateIntegration || defaultConfig.corporateIntegration
  );
  const [rightOfSubstitutionAllowed, setRightOfSubstitutionAllowed] = useState<boolean>(
    initialConfig?.rightOfSubstitutionAllowed ?? defaultConfig.rightOfSubstitutionAllowed ?? true
  );

  // Live evaluation calculation
  const currentConfig: SafeHarborConfig = useMemo(
    () => ({
      enabled: true,
      scheduleAutonomy,
      equipmentOwnership,
      managementHierarchy,
      exclusivityStatus,
      invoicingEntityStatus,
      corporateIntegration,
      rightOfSubstitutionAllowed,
    }),
    [
      scheduleAutonomy,
      equipmentOwnership,
      managementHierarchy,
      exclusivityStatus,
      invoicingEntityStatus,
      corporateIntegration,
      rightOfSubstitutionAllowed,
    ]
  );

  const evaluation = useMemo(
    () => SafeHarborEngine.evaluateMisclassificationRisk(currentConfig),
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
          ? "4857 Sayılı İş Kanunu m. 8 Bağımsız Yüklenici Kalkanı"
          : "Labor Law Art. 8 Safe Harbor & Misclassification Shield"
      }
      description={
        isTr
          ? "Yargıtay 9. ve 22. HD emsal kararlarına göre gizli istihdam, kıdem tazminatı ve SGK prim cezası riskini analiz eder ve sözleşmeye koruyucu EK-3 hükmünü ekler."
          : "Analyzes worker misclassification liabilities and embeds an ironclad Independent Contractor Addendum (Annex-3)."
      }
      className="max-w-3xl max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-5 pt-2">
        {/* Top Risk Score Bar */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-semibold text-purple-300">
              {isTr ? "Yargıtay Risk Değerlendirmesi:" : "Risk Evaluation Score:"}
            </span>
          </div>
          <SafeHarborBadge
            level={evaluation.riskLevel}
            score={evaluation.riskScore}
            locale={locale}
          />
        </div>
          {/* Real-time Risk Assessment Box */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${getSafeHarborRiskBoxClass(evaluation.riskLevel)}`}
          >
            {renderSafeHarborRiskIcon(evaluation.riskLevel)}
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-[var(--color-text-primary)]">
                {isTr ? evaluation.summaryTr : evaluation.summaryEn}
              </p>
              {evaluation.remedialMitigationsTr.length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/10">
                  <span className="font-bold text-[11px] block mb-1">
                    {isTr ? "💡 Hukuki Tavsiyeler (Riski Düşürmek İçin):" : "💡 Recommended Mitigations:"}
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

          {/* Question 1: Schedule Autonomy */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-blue-400" />
              <span>{isTr ? "1. Çalışma Saatleri ve Mesai Serbestisi" : "1. Schedule & Working Hours"}</span>
              <span className="text-[10px] text-blue-400/80 font-normal">
                ({isTr ? "Ağırlık: 25p" : "Weight: 25pts"})
              </span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                {
                  val: "FLEXIBLE_RESULT_ORIENTED",
                  titleTr: "Tam Esnek (Çıktı Odaklı)",
                  titleEn: "Fully Autonomous Output",
                  descTr: "Saat sınırı yok, yalnızca teslim tarihi",
                  descEn: "No schedule, deadline-only",
                  pts: "0p (Güvenli)",
                },
                {
                  val: "CORE_HOURS_OVERLAP",
                  titleTr: "Çekirdek Saat Örtüşmesi",
                  titleEn: "Core Hours Standup",
                  descTr: "Günde 2-3 saat iletişim penceresi",
                  descEn: "2-3h daily communication",
                  pts: "10p",
                },
                {
                  val: "FIXED_BUSINESS_HOURS",
                  titleTr: "Sabit Mesai (09:00-18:00)",
                  titleEn: "Fixed Shift (9 to 5)",
                  descTr: "Haftalık zorunlu çevrimiçi saat",
                  descEn: "Mandatory daily presence",
                  pts: "25p (Riskli)",
                },
              ].map((opt) => (
                <div
                  key={opt.val}
                  onClick={() => setScheduleAutonomy(opt.val as ScheduleAutonomy)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    scheduleAutonomy === opt.val
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

          {/* Question 2: Equipment Ownership */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
              <Laptop className="h-3.5 w-3.5 text-blue-400" />
              <span>{isTr ? "2. Araç, Donanım ve Lisans Sahipliği (BYOD)" : "2. Hardware & Tools (BYOD)"}</span>
              <span className="text-[10px] text-blue-400/80 font-normal">
                ({isTr ? "Ağırlık: 15p" : "Weight: 15pts"})
              </span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                {
                  val: "CONTRACTOR_OWN_TOOLS",
                  titleTr: "Kendi Donanımı (BYOD)",
                  titleEn: "Own Hardware (BYOD)",
                  descTr: "Kendi bilgisayarı ve IDE'sini kullanır",
                  descEn: "Uses personal laptop & tools",
                  pts: "0p (Güvenli)",
                },
                {
                  val: "MIXED_TOOLS",
                  titleTr: "Hibrit / Şirket Lisansı",
                  titleEn: "Hybrid Software Access",
                  descTr: "Kendi cihazı + müşteri yazılım hesabı",
                  descEn: "Own device + client tool seat",
                  pts: "7p",
                },
                {
                  val: "EMPLOYER_MANDATORY_HARDWARE",
                  titleTr: "Şirket Bilgisayarı Şart",
                  titleEn: "Mandatory Client Laptop",
                  descTr: "Zimmetli dizüstü bilgisayar zorunlu",
                  descEn: "Mandatory corporate hardware",
                  pts: "15p (Riskli)",
                },
              ].map((opt) => (
                <div
                  key={opt.val}
                  onClick={() => setEquipmentOwnership(opt.val as EquipmentOwnership)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    equipmentOwnership === opt.val
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

          {/* Question 3: Management Hierarchy */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
              <Users2 className="h-3.5 w-3.5 text-blue-400" />
              <span>{isTr ? "3. Hiyerarşik Amir ve Süreç Denetimi" : "3. Management Hierarchy"}</span>
              <span className="text-[10px] text-blue-400/80 font-normal">
                ({isTr ? "Ağırlık: 20p" : "Weight: 20pts"})
              </span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                {
                  val: "AUTONOMOUS_DELIVERABLE",
                  titleTr: "Tam Özerk (Yalnızca Kabul)",
                  titleEn: "Autonomous Deliverable",
                  descTr: "İşveren yalnızca çıktıyı inceler",
                  descEn: "Client inspects output only",
                  pts: "0p (Güvenli)",
                },
                {
                  val: "COLLABORATIVE_AGILE",
                  titleTr: "Agile Sprint Katılımı",
                  titleEn: "Collaborative Agile",
                  descTr: "Planlama toplantılarına eşlik eder",
                  descEn: "Participates in sprint rituals",
                  pts: "8p",
                },
                {
                  val: "DIRECT_SUPERVISOR_SUBORDINATION",
                  titleTr: "Doğrudan İdari Amir",
                  titleEn: "Direct Line Manager",
                  descTr: "Günlük görev ve amir talimatı",
                  descEn: "Daily operational commands",
                  pts: "20p (Riskli)",
                },
              ].map((opt) => (
                <div
                  key={opt.val}
                  onClick={() => setManagementHierarchy(opt.val as ManagementHierarchy)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    managementHierarchy === opt.val
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

          {/* Question 4: Exclusivity */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-blue-400" />
              <span>{isTr ? "4. Münhasırlık ve Başka Müşteri Özgürlüğü" : "4. Exclusivity & Other Clients"}</span>
              <span className="text-[10px] text-blue-400/80 font-normal">
                ({isTr ? "Ağırlık: 20p" : "Weight: 20pts"})
              </span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                {
                  val: "OPEN_MARKET_MULTIPLE_CLIENTS",
                  titleTr: "Çoklu Müşteriye Açık",
                  titleEn: "Multiple Concurrent Clients",
                  descTr: "Serbest piyasada başkalarına iş yapabilir",
                  descEn: "Free to serve any third party",
                  pts: "0p (Güvenli)",
                },
                {
                  val: "NON_COMPETE_ONLY",
                  titleTr: "Dar Rekabet Yasağı",
                  titleEn: "Narrow Non-Compete",
                  descTr: "Yalnızca doğrudan rakip ürünler kısıtlı",
                  descEn: "Direct competitors excluded only",
                  pts: "5p",
                },
                {
                  val: "STRICT_EXCLUSIVITY_FULL_TIME",
                  titleTr: "Tam Münhasırlık (Tekel)",
                  titleEn: "Strict Exclusivity",
                  descTr: "Başka hiçbir müşteriyle çalışamaz",
                  descEn: "Barred from all other clients",
                  pts: "20p (Riskli)",
                },
              ].map((opt) => (
                <div
                  key={opt.val}
                  onClick={() => setExclusivityStatus(opt.val as ExclusivityStatus)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    exclusivityStatus === opt.val
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

          {/* Question 5: Invoicing Entity Status */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
              <Receipt className="h-3.5 w-3.5 text-blue-400" />
              <span>{isTr ? "5. Vergi Mükellefiyeti ve Fatura Düzeni" : "5. Tax Status & Invoicing"}</span>
              <span className="text-[10px] text-blue-400/80 font-normal">
                ({isTr ? "Ağırlık: 10p" : "Weight: 10pts"})
              </span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                {
                  val: "REGISTERED_COMPANY_INVOICE",
                  titleTr: "Şirket / e-SMM / e-Fatura",
                  titleEn: "Registered Entity / Invoice",
                  descTr: "Vergi mükellefi, resmi B2B fatura",
                  descEn: "Tax registered, legal B2B invoices",
                  pts: "0p (Güvenli)",
                },
                {
                  val: "FREELANCE_TAX_EXEMPT_OR_GVK20B",
                  titleTr: "GVK 20/B İstisna Hesabı",
                  titleEn: "GVK 20/B Exemption",
                  descTr: "Banka stopajlı yasal istisna hesabı",
                  descEn: "Statutory bank withholding",
                  pts: "4p",
                },
                {
                  val: "INDIVIDUAL_NO_TAX_ID",
                  titleTr: "Vergi Kaydı Yok (Şahsi)",
                  titleEn: "Individual No Tax ID",
                  descTr: "Kişisel hesaba doğrudan transfer",
                  descEn: "Personal transfer without entity",
                  pts: "10p (Riskli)",
                },
              ].map((opt) => (
                <div
                  key={opt.val}
                  onClick={() => setInvoicingEntityStatus(opt.val as InvoicingEntityStatus)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    invoicingEntityStatus === opt.val
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

          {/* Question 6: Corporate Integration */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-blue-400" />
              <span>{isTr ? "6. Kurumsal Temsil ve E-Posta Entegrasyonu" : "6. Corporate Identity & Email"}</span>
              <span className="text-[10px] text-blue-400/80 font-normal">
                ({isTr ? "Ağırlık: 10p" : "Weight: 10pts"})
              </span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                {
                  val: "EXTERNAL_CONSULTANT_IDENTITY",
                  titleTr: "Dış Yüklenici Kimliği",
                  titleEn: "External Contractor Identity",
                  descTr: "Şirket e-postası ve unvanı yok",
                  descEn: "No corporate email or title",
                  pts: "0p (Güvenli)",
                },
                {
                  val: "GUEST_ACCESS_SLACK_ONLY",
                  titleTr: "Slack/Teams Misafir Hesabı",
                  titleEn: "Guest Slack / Teams Account",
                  descTr: "Yalnızca iç mesajlaşma misafir hesabı",
                  descEn: "Internal chat guest pass only",
                  pts: "3p",
                },
                {
                  val: "INTERNAL_EMAIL_AND_TITLE",
                  titleTr: "Şirket E-Postası (@sirket.com)",
                  titleEn: "Corporate Domain Email",
                  descTr: "Kurumsal e-posta ve iç unvan tahsisi",
                  descEn: "Company email & internal title",
                  pts: "10p (Riskli)",
                },
              ].map((opt) => (
                <div
                  key={opt.val}
                  onClick={() => setCorporateIntegration(opt.val as CorporateIntegration)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    corporateIntegration === opt.val
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

          {/* Right of Substitution Toggle */}
          <div className="p-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-primary)]">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <span>
                  {isTr ? "İkame Hakkı (Right of Substitution)" : "Right of Substitution"}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  -5 Puan İndirimi
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-text-secondary)]">
                {isTr
                  ? "Yüklenicinin kendi sorumluluğunda başka bir yazılım uzmanını veya squad üyesini göreve dahil edebilme serbestisi (TBK m. 471/3)."
                  : "Contractor retains legal right to assign squad assistants or subcontractors under their own responsibility."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRightOfSubstitutionAllowed((prev) => !prev)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                rightOfSubstitutionAllowed ? "bg-emerald-500" : "bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  rightOfSubstitutionAllowed ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--color-border-subtle)]">
          <div>
            {initialConfig && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleRemove}
                className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                {isTr ? "Güvenli Liman Klozunu Kaldır" : "Remove Safe Harbor"}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs"
            >
              {isTr ? "Vazgeç" : "Cancel"}
            </Button>
            <Button
              type="button"
              onClick={handleApply}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>
                {isTr
                  ? "Sözleşmeye Güvenli Liman Klozunu (EK-3) Ekle"
                  : "Attach Safe Harbor Addendum (Annex-3)"}
              </span>
            </Button>
          </div>
        </div>
    </Dialog>
  );
}
