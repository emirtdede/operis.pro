"use client";

import React, { useState, useMemo } from "react";
import { Dialog } from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Server,
  FileCheck2,
  Clock,
  UserCheck,
  Flame,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import {
  DpaAccessLevel,
  DpaDataCategory,
  DpaSecurityMeasure,
  DpaContractConfig,
} from "@/src/modules/contracts/dpa-types";
import { DpaEngine } from "@/src/modules/contracts/dpa-engine";
import { DpaBadge } from "./dpa-badge";

export interface DpaWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: DpaContractConfig | null) => void;
  initialConfig?: DpaContractConfig | null;
  locale?: string;
}

const ACCESS_LEVEL_OPTIONS: Array<{
  value: DpaAccessLevel;
  titleTr: string;
  titleEn: string;
  descTr: string;
  descEn: string;
  badgeTr: string;
  badgeEn: string;
}> = [
  {
    value: "NO_ACCESS_SYNTHETIC",
    titleTr: "Canlı Veri Erişimi Yok (Yalnızca Simüle / Test Verisi)",
    titleEn: "No Live Data Access (Synthetic / Mock Only)",
    descTr: "Geliştirici yalnızca yerel test ve simülasyon verileriyle çalışır; üretim veri tabanına veya gerçek kullanıcı kayıtlarına erişmez.",
    descEn: "Contractor works exclusively with local mock data, no direct access to production or real user databases.",
    badgeTr: "0 Risk Puanı",
    badgeEn: "0 Risk Multiplier",
  },
  {
    value: "READ_ONLY_STAGING",
    titleTr: "Staging / Test Ortamında Salt-Okunur Erişim",
    titleEn: "Read-Only Staging / Test Environment",
    descTr: "Geliştirici test sunucusunda maskeli veya seçili kayıtlara yalnızca okuma yetkisiyle erişir.",
    descEn: "Contractor accesses staging environment with read-only permissions over masked or test records.",
    badgeTr: "0.6x Risk Çarpanı",
    badgeEn: "0.6x Multiplier",
  },
  {
    value: "FULL_PRODUCTION_ACCESS",
    titleTr: "Canlı Ortam & Tam Veri Tabanı Erişimi (Üretim Ortamı)",
    titleEn: "Live Production & Full Database Access",
    descTr: "Canlı sunucuya, kullanıcı kayıtlarına, sistem günlüklerine ve veri tabanı sorgularına doğrudan okuma/yazma erişimi.",
    descEn: "Direct read/write access to production cloud, user records, query engines, and live logs.",
    badgeTr: "1.0x Risk Çarpanı",
    badgeEn: "1.0x Multiplier",
  },
];

const DATA_CATEGORY_OPTIONS: Array<{
  value: DpaDataCategory;
  nameTr: string;
  nameEn: string;
  examplesTr: string;
  examplesEn: string;
  weight: number;
  isSpecial?: boolean;
}> = [
  {
    value: "IDENTITY_CONTACT",
    nameTr: "Kimlik ve İletişim Verileri",
    nameEn: "Identity & Contact Data",
    examplesTr: "Ad-soyad, TCKN, pasaport no, telefon, e-posta",
    examplesEn: "Full name, national ID, passport, phone, email",
    weight: 15,
  },
  {
    value: "CUSTOMER_ACCOUNT_LOGS",
    nameTr: "Müşteri Hesap ve Sistem Logları",
    nameEn: "Customer Account & System Logs",
    examplesTr: "IP adresi, oturum çerezleri, şifre hashleri, cihaz parmak izi",
    examplesEn: "IP address, session tokens, password hashes, device fingerprint",
    weight: 20,
  },
  {
    value: "FINANCIAL_TRANSACTION",
    nameTr: "Finans ve Ödeme Bilgileri",
    nameEn: "Financial & Transaction Data",
    examplesTr: "IBAN, fatura adresi, ödeme geçmişi, kart sağlayıcı tokenları",
    examplesEn: "IBAN, billing address, payment logs, card token references",
    weight: 30,
  },
  {
    value: "SPECIAL_HEALTH_BIOMETRIC",
    nameTr: "Özel Nitelikli Kişisel Veriler (KVKK m. 6)",
    nameEn: "Special Category Data (GDPR Art. 9)",
    examplesTr: "Sağlık bilgileri, biyometrik veri, adli sicil, sendika üyeliği",
    examplesEn: "Health data, biometric signatures, criminal records, trade union",
    weight: 45,
    isSpecial: true,
  },
  {
    value: "EMPLOYEE_DATA",
    nameTr: "Şirket İçi Personel / İK Kayıtları",
    nameEn: "Internal Personnel & HR Records",
    examplesTr: "Çalışan listeleri, bordro, izin, performans puanları",
    examplesEn: "Staff directory, payroll, leave requests, performance reviews",
    weight: 25,
  },
  {
    value: "LOCATION_DEVICE",
    nameTr: "Konum ve Cihaz Telemetrisi",
    nameEn: "Location & Device Telemetry",
    examplesTr: "Canlı GPS koordinatları, Bluetooth işaretçileri, hücresel veriler",
    examplesEn: "Real-time GPS, Bluetooth beacons, cellular cell location",
    weight: 20,
  },
];

const SECURITY_MEASURE_OPTIONS: Array<{
  value: DpaSecurityMeasure;
  nameTr: string;
  nameEn: string;
  descTr: string;
  descEn: string;
}> = [
  {
    value: "TLS_ENCRYPTION",
    nameTr: "TLS 1.3 Uçtan Uca Şifreleme",
    nameEn: "TLS 1.3 In-Transit Encryption",
    descTr: "Ağ üzerinden veri transferinde en az TLS 1.3 protokolü",
    descEn: "Mandatory TLS 1.3 cipher suites for all network transmissions",
  },
  {
    value: "LOCAL_STORAGE_PROHIBITED",
    nameTr: "Geliştirici Cihazına Ham Veri İndirme Yasağı",
    nameEn: "No Local Data Export to Developer Machine",
    descTr: "Müşteri verileri geliştiricinin şahsi diskine asla indirilemez",
    descEn: "Client data may never be exported or dumped to personal devices",
  },
  {
    value: "MFA_ACCESS",
    nameTr: "Çok Faktörlü Kimlik Doğrulama (2FA / MFA)",
    nameEn: "Multi-Factor Authentication (MFA)",
    descTr: "Sunucu ve veritabanı erişimlerinde donanımsal veya TOTP 2FA",
    descEn: "Enforced hardware token or TOTP 2FA for all server/DB access",
  },
  {
    value: "AES256_AT_REST",
    nameTr: "AES-256 Disk Seviyesinde Şifreleme",
    nameEn: "AES-256 At-Rest Encryption",
    descTr: "Veritabanı tabloları ve yedeklerde AES-256 şifreleme",
    descEn: "Database and cloud volume level AES-256 encryption",
  },
  {
    value: "IP_RESTRICTION",
    nameTr: "Sabit IP & Bastion / VPN Kısıtlaması",
    nameEn: "Static IP & Bastion / VPN Restriction",
    descTr: "Yalnızca onaylanmış IP adreslerinden SSH/DB erişimi",
    descEn: "SSH and DB connections strictly whitelisted to approved IP/VPN",
  },
  {
    value: "AUDIT_LOGGING",
    nameTr: "Değiştirilemez Erişim ve Sorgu Denetim İzi (Audit Log)",
    nameEn: "Immutable Audit Logging",
    descTr: "Her SQL sorgusu ve veri erişiminin zaman damgalı kaydı",
    descEn: "Timestamped, tamper-evident logging of all queries and accesses",
  },
  {
    value: "ANONYMIZATION_MASKING",
    nameTr: "Dinamik Veri Maskeleme ve Pseudonimizasyon",
    nameEn: "Dynamic Anonymization & Pseudonymization",
    descTr: "Geliştirme arayüzlerinde gerçek verilerin dinamik maskelenmesi",
    descEn: "Automatic masking of sensitive identifiers in dev interfaces",
  },
];

function getDataCategoryItemClass(checked: boolean, isSpecial?: boolean): string {
  if (!checked) {
    return "bg-[var(--color-surface)] border-[var(--color-border-subtle)] hover:border-[var(--color-border)]";
  }
  if (isSpecial) {
    return "bg-rose-500/10 border-rose-500/50";
  }
  return "bg-blue-600/10 border-blue-500/50";
}

function getSubProcessorPermissionLabel(allowed: boolean, isTr: boolean): string {
  if (allowed) {
    return isTr ? "⚠️ Alt-Yüklenici İzni Verildi" : "⚠️ Sub-processors Allowed";
  }
  return isTr ? "🛡️ Alt-İşleyen Kesinlikle Yasak (Önerilen)" : "🛡️ Sub-processors Prohibited (Recommended)";
}

export function DpaWizardModal({
  isOpen,
  onClose,
  onSave,
  initialConfig,
  locale = "tr",
}: DpaWizardModalProps) {
  const isTr = locale === "tr";

  // Form State
  const [accessLevel, setAccessLevel] = useState<DpaAccessLevel>(
    initialConfig?.accessLevel || "FULL_PRODUCTION_ACCESS"
  );
  const [dataCategories, setDataCategories] = useState<DpaDataCategory[]>(
    initialConfig?.dataCategories || ["IDENTITY_CONTACT", "CUSTOMER_ACCOUNT_LOGS"]
  );
  const [securityMeasures, setSecurityMeasures] = useState<DpaSecurityMeasure[]>(
    initialConfig?.securityMeasures || [
      "TLS_ENCRYPTION",
      "LOCAL_STORAGE_PROHIBITED",
      "MFA_ACCESS",
      "AUDIT_LOGGING",
    ]
  );
  const [breachNotificationHours, setBreachNotificationHours] = useState<number>(
    initialConfig?.breachNotificationHours ?? 24
  );
  const [subProcessorAllowed, setSubProcessorAllowed] = useState<boolean>(
    initialConfig?.subProcessorAllowed ?? false
  );

  // Re-sync when modal opens or initialConfig changes
  React.useEffect(() => {
    if (initialConfig) {
      setAccessLevel(initialConfig.accessLevel);
      setDataCategories(initialConfig.dataCategories);
      setSecurityMeasures(initialConfig.securityMeasures);
      setBreachNotificationHours(initialConfig.breachNotificationHours ?? 24);
      setSubProcessorAllowed(initialConfig.subProcessorAllowed ?? false);
    }
  }, [initialConfig, isOpen]);

  // Real-time Risk Assessment via deterministic DpaEngine
  const currentConfig: DpaContractConfig = useMemo(
    () => ({
      enabled: true,
      accessLevel,
      dataCategories,
      securityMeasures,
      breachNotificationHours,
      subProcessorAllowed,
      dataRetentionDaysAfterTermination: 0,
    }),
    [accessLevel, dataCategories, securityMeasures, breachNotificationHours, subProcessorAllowed]
  );

  const evaluation = useMemo(() => {
    return DpaEngine.evaluateDpaRisk(currentConfig);
  }, [currentConfig]);

  // Ensure mandatory measures are always included
  React.useEffect(() => {
    if (evaluation.mandatoryMeasures.length > 0) {
      setSecurityMeasures((prev) => {
        const set = new Set(prev);
        let changed = false;
        for (const m of evaluation.mandatoryMeasures) {
          if (!set.has(m)) {
            set.add(m);
            changed = true;
          }
        }
        return changed ? Array.from(set) : prev;
      });
    }
  }, [evaluation.mandatoryMeasures]);

  const toggleCategory = (cat: DpaDataCategory) => {
    setDataCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleMeasure = (m: DpaSecurityMeasure) => {
    // If mandatory, cannot uncheck
    if (evaluation.mandatoryMeasures.includes(m)) return;
    setSecurityMeasures((prev) =>
      prev.includes(m) ? prev.filter((item) => item !== m) : [...prev, m]
    );
  };

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
          ? "🛡️ KVKK m. 12 & GDPR m. 28 Bilişim Veri İşleme Protokolü (DPA)"
          : "🛡️ Data Processing Addendum (DPA) Configurator"
      }
      description={
        isTr
          ? "Geliştiricinin veri işleyen statüsünü yasal güvenceye alan, 24 saat ihlal SLA'sı ve kanıtlı imha şartlarını içeren resmi EK-2 protokolü."
          : "Statutory bilateral data processing schedule conforming to KVKK Art. 12 and GDPR Art. 28 with 24h breach notification SLA."
      }
      className="max-w-4xl max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-6 pt-2">
        {/* Real-time Risk Assessment Banner */}
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  {isTr ? "Deterministik Risk Değerlendirmesi" : "Deterministic Risk Evaluation"}
                </span>
                <DpaBadge
                  level={evaluation.riskLevel}
                  score={evaluation.riskScore}
                  locale={locale}
                />
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {isTr ? evaluation.summaryTr : evaluation.summaryEn}
              </p>
            </div>

            {evaluation.requiresDpia && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold shrink-0">
                <ShieldAlert className="h-4 w-4" />
                <span>{isTr ? "DİEB / DPIA Zorunlu" : "DPIA Required"}</span>
              </div>
            )}
          </div>
        </div>

        {/* Section 1: Access Level */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
            <Server className="h-4 w-4 text-blue-400" />
            <span>
              {isTr ? "1. Geliştirici Erişim Seviyesi" : "1. Developer Access Level"}
            </span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {ACCESS_LEVEL_OPTIONS.map((opt) => {
              const selected = accessLevel === opt.value;
              return (
                <div
                  key={opt.value}
                  onClick={() => setAccessLevel(opt.value)}
                  className={`relative p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    selected
                      ? "bg-blue-600/10 border-blue-500 shadow-sm"
                      : "bg-[var(--color-surface)] border-[var(--color-border-subtle)] hover:border-[var(--color-border)]"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                        {isTr ? opt.titleTr : opt.titleEn}
                      </span>
                      {selected && <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 ml-1" />}
                    </div>
                    <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                      {isTr ? opt.descTr : opt.descEn}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[var(--color-border-subtle)]">
                    <span className="text-[10px] font-mono font-medium text-blue-400">
                      {isTr ? opt.badgeTr : opt.badgeEn}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Personal Data Categories */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
              <Lock className="h-4 w-4 text-blue-400" />
              <span>
                {isTr ? "2. İşlenecek Kişisel Veri Türleri" : "2. Personal Data Categories Processed"}
              </span>
            </label>
            <span className="text-xs text-[var(--color-text-secondary)]">
              {dataCategories.length}{" "}
              {isTr ? "kategori seçildi" : "categories selected"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {DATA_CATEGORY_OPTIONS.map((cat) => {
              const checked = dataCategories.includes(cat.value);
              return (
                <div
                  key={cat.value}
                  onClick={() => toggleCategory(cat.value)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${getDataCategoryItemClass(checked, cat.isSpecial)}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {}} // Handled by container
                    className="mt-0.5 rounded border-[var(--color-border)] text-blue-600 focus:ring-blue-500"
                  />
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                        {isTr ? cat.nameTr : cat.nameEn}
                      </span>
                      {cat.isSpecial && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                          {isTr ? "Özel Nitelikli" : "Special Category"}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--color-text-secondary)]">
                      {isTr ? cat.examplesTr : cat.examplesEn}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Technical & Organizational Measures */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>
              {isTr
                ? "3. Bilgi Güvenliği & Teknik Tedbirler (KVKK Rehberi)"
                : "3. Technical & Organizational Measures"}
            </span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {SECURITY_MEASURE_OPTIONS.map((measure) => {
              const checked = securityMeasures.includes(measure.value);
              const isMandatory = evaluation.mandatoryMeasures.includes(measure.value);

              return (
                <div
                  key={measure.value}
                  onClick={() => toggleMeasure(measure.value)}
                  className={`p-3 rounded-lg border transition-all ${
                    isMandatory ? "cursor-default" : "cursor-pointer"
                  } flex items-start gap-3 ${
                    checked
                      ? "bg-emerald-500/5 border-emerald-500/40"
                      : "bg-[var(--color-surface)] border-[var(--color-border-subtle)]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={isMandatory}
                    onChange={() => {}}
                    className="mt-0.5 rounded border-[var(--color-border)] text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                        {isTr ? measure.nameTr : measure.nameEn}
                      </span>
                      {isMandatory && (
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          {isTr ? "Zorunlu" : "Mandatory"}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--color-text-secondary)]">
                      {isTr ? measure.descTr : measure.descEn}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4: Legal SLA & Obligations */}
        <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
            {isTr ? "Hukuki Şartlar & Yasal Süreler" : "Statutory SLA & Safeguards"}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Breach Notification SLA */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-blue-400" />
                <span>
                  {isTr ? "Veri İhlali Bildirim Süresi (SLA)" : "Breach Notification SLA"}
                </span>
              </label>
              <select
                value={breachNotificationHours}
                onChange={(e) => setBreachNotificationHours(parseInt(e.target.value, 10))}
                className="w-full text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] p-2 text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={12}>
                  {isTr ? "12 Saat (Kritik / Finans - En Sıkı)" : "12 Hours (Ultra Strict)"}
                </option>
                <option value={24}>
                  {isTr ? "24 Saat (Önerilen - KVKK 72h Uyumlu)" : "24 Hours (Recommended)"}
                </option>
                <option value={48}>
                  {isTr ? "48 Saat (Genişletilmiş Süre)" : "48 Hours (Extended)"}
                </option>
              </select>
              <p className="text-[10px] text-[var(--color-text-secondary)]">
                {isTr
                  ? "KVKK Kurulu'na azami 72 saatte bildirim yapılabilmesi için geliştiricinin işverene 24 saatte haber vermesi tavsiye edilir."
                  : "Ensures Client has sufficient time to report to data protection authorities within statutory limits."}
              </p>
            </div>

            {/* Sub-processors Permission */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-blue-400" />
                <span>
                  {isTr ? "Alt-İşleyen (Sub-Processor) İzni" : "Sub-Processor Authorization"}
                </span>
              </label>
              <div
                onClick={() => setSubProcessorAllowed((prev) => !prev)}
                className={`p-2 rounded-lg border cursor-pointer flex items-center justify-between text-xs font-medium transition-all ${
                  subProcessorAllowed
                    ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                    : "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                }`}
              >
                <span>
                  {getSubProcessorPermissionLabel(subProcessorAllowed, isTr)}
                </span>
                <input
                  type="checkbox"
                  checked={subProcessorAllowed}
                  onChange={() => {}}
                  className="rounded border-[var(--color-border)]"
                />
              </div>
              <p className="text-[10px] text-[var(--color-text-secondary)]">
                {isTr
                  ? "Kapalı tutulması halinde geliştirici veriyi 3. taraflarla veya taşeronlarla paylaşamaz."
                  : "When disabled, Contractor cannot subcontract any personal data processing."}
              </p>
            </div>
          </div>

          {/* Guaranteed Certified Destruction Notice */}
          <div className="p-3 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] flex items-start gap-2.5">
            <Flame className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              <strong className="text-[var(--color-text-primary)]">
                {isTr ? "Kanıtlı Veri İmhası Garantisi: " : "Certified Data Destruction: "}
              </strong>
              {isTr
                ? "Sözleşme ifa edildiğinde veya feshedildiğinde, Yüklenici yerel önbellek ve kopyaları silmekle yükümlüdür. Operis sistemi üzerinden SHA-256 dijital imzalı İmha Tutanağı (Destruction Certificate) tanzim edilir."
                : "Upon project completion, all local mirrors/logs must be crypto-shredded. A cryptographically signed destruction certificate is provided."}
            </p>
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
                {isTr ? "DPA Protokolünü Kaldır" : "Remove DPA Schedule"}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onClose} size="sm">
              {isTr ? "Vazgeç" : "Cancel"}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleApply}
              size="sm"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold"
            >
              <FileCheck2 className="h-4 w-4 mr-1.5" />
              {isTr ? "Sözleşmeye EK-2 Olarak Ekle" : "Attach as ANNEX-2 to Contract"}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
