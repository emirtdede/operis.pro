"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  LogIn,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Scale,
  FileWarning,
  ExternalLink,
  Info,
  Building2,
} from "lucide-react";
import { Button } from "../ui/button";
import { TextInput } from "../ui/text-input";
import { TextArea } from "../ui/text-area";
import Link from "next/link";

export interface ReportFormProps {
  locale: string;
  defaultTargetType?: string;
  defaultTargetIdentifier?: string;
  hasSession?: boolean;
}

interface ReasonConfig {
  value: string;
  labelTr: string;
  labelEn: string;
  badgeTr: string;
  badgeEn: string;
  slaTr: string;
  slaEn: string;
  evidenceTr: string;
  evidenceEn: string;
  icon: React.ComponentType<{ className?: string }>;
}

const REASON_CONFIGS: ReasonConfig[] = [
  {
    value: "SCAM_FRAUD",
    labelTr: "Dolandırıcılık veya Sahte İlan / Teklif",
    labelEn: "Fraud, Scam or Fake Listing / Proposal",
    badgeTr: "Finansal Güvenlik",
    badgeEn: "Financial Safety",
    slaTr: "< 2-4 Saat",
    slaEn: "< 2-4 Hours",
    evidenceTr:
      "Platform dışı IBAN/kripto talepleri, şüpheli harici mesajlaşma ekran alıntıları veya sahte portföy bağlantıları.",
    evidenceEn:
      "Off-platform wire/crypto requests, external chat screenshots, or counterfeit portfolio links.",
    icon: ShieldAlert,
  },
  {
    value: "HARASSMENT_ABUSE",
    labelTr: "Kötüye Kullanım, Tehdit veya Taciz",
    labelEn: "Abuse, Threat or Harassment",
    badgeTr: "Topluluk Güvenliği",
    badgeEn: "Community Safety",
    slaTr: "< 4 Saat",
    slaEn: "< 4 Hours",
    evidenceTr:
      "Kişisel hakları zedeleyen ifadeler, şantaj, hakaret veya platform dışı baskı içeren yazışma kayıtları.",
    evidenceEn:
      "Extortion, defamatory remarks, harassment logs, or persistent unsolicited off-platform intimidation.",
    icon: AlertCircle,
  },
  {
    value: "INTELLECTUAL_PROPERTY",
    labelTr: "Fikri Mülkiyet & Telif Hakkı (FSEK / Lisans)",
    labelEn: "Intellectual Property / Copyright Infringement",
    badgeTr: "Hukuki Koruma",
    badgeEn: "Legal Protection",
    slaTr: "< 12 İş Saati",
    slaEn: "< 12 Business Hours",
    evidenceTr:
      "Orijinal kaynak kod deposu (GitHub vb.), tescilli marka/tasarım numarası veya noter onaylı devir sözleşmesi.",
    evidenceEn:
      "Original public repository commit history, registered trademark certificate, or proof of copyright ownership.",
    icon: Scale,
  },
  {
    value: "PROHIBITED_SERVICE",
    labelTr: "Yasaklanmış İçerik veya Kısıtlı Hizmet",
    labelEn: "Prohibited Content or Restricted Service",
    badgeTr: "Mevzuat & Uyum",
    badgeEn: "Policy & Compliance",
    slaTr: "< 6 Saat",
    slaEn: "< 6 Hours",
    evidenceTr:
      "5651 sayılı kanuna veya Operis Hizmet Şartlarına aykırı içerik, yetkisiz veri kazıma (scraping) veya tersine mühendislik.",
    evidenceEn:
      "Unauthorized web scraping, malware distribution, or services violating local cyber laws and terms.",
    icon: FileWarning,
  },
  {
    value: "SPAM",
    labelTr: "İstenmeyen İçerik, Bot veya Toplu Reklam",
    labelEn: "Spam, Bot Activity or Bulk Advertising",
    badgeTr: "Platform Hijyeni",
    badgeEn: "Platform Hygiene",
    slaTr: "< 6 Saat",
    slaEn: "< 6 Hours",
    evidenceTr:
      "Tekrarlanan kopya teklifler, otomatik bot mesajları veya yanıltıcı tanıtım bağlantıları.",
    evidenceEn:
      "Identical duplicate proposals, unsolicited commercial solicitations, or automated bot activities.",
    icon: Clock,
  },
  {
    value: "OTHER",
    labelTr: "Diğer Kural & Sözleşme Uyuşmazlığı",
    labelEn: "Other Policy or Contractual Dispute",
    badgeTr: "Genel Denetim",
    badgeEn: "General Audit",
    slaTr: "< 24 Saat",
    slaEn: "< 24 Hours",
    evidenceTr:
      "Şartnameye aykırı teslimatlar, onay geciktirmeleri veya ihlale ilişkin somut tarafsız olgular.",
    evidenceEn:
      "Milestone specification deviations, unjustified approval freezes, or relevant contextual records.",
    icon: ShieldCheck,
  },
];

const TARGET_TYPES = [
  { value: "listing", labelTr: "İlan", labelEn: "Listing", hintTr: "İlan URL veya Başlığı", hintEn: "Listing URL or Title" },
  { value: "profile", labelTr: "Kullanıcı / Ajans Profili", labelEn: "User / Agency Profile", hintTr: "Kullanıcı Adı (@kullanici)", hintEn: "Handle (@username)" },
  { value: "offer", labelTr: "Teklif / Özel Mesaj", labelEn: "Offer / Message", hintTr: "Teklif Kimliği veya İlan", hintEn: "Offer ID or Listing" },
  { value: "general", labelTr: "Genel Sistem / Güvenlik", labelEn: "System / Platform Security", hintTr: "İlgili Bölüm / URL", hintEn: "Endpoint / Context" },
];

const URGENCY_LEVELS = [
  {
    value: "NORMAL",
    labelTr: "Standart İnceleme",
    labelEn: "Standard Review",
    slaTr: "Olağan Kuyruk",
    slaEn: "Regular Queue",
    color: "text-blue-400 border-blue-500/20 bg-blue-500/5",
  },
  {
    value: "HIGH",
    labelTr: "Yüksek Öncelik",
    labelEn: "High Priority",
    slaTr: "Hızlandırılmış İnceleme",
    slaEn: "Expedited Queue",
    color: "text-amber-400 border-amber-500/20 bg-amber-500/5",
  },
  {
    value: "CRITICAL",
    labelTr: "Acil Müdahale",
    labelEn: "Critical / Emergency",
    slaTr: "Finansal Tehlike & 7/24 Müdahale",
    slaEn: "Financial Risk & 24/7 Triage",
    color: "text-rose-400 border-rose-500/20 bg-rose-500/10",
  },
];

// Anti-emoji check matching server route
const EMOJI_REGEX =
  /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/u;

function getTargetPlaceholder(targetType: string, isTr: boolean): string {
  if (targetType === "profile") {
    return isTr ? "@kullaniciadi veya profil bağlantısı" : "@username or profile link";
  }
  if (targetType === "listing") {
    return isTr
      ? "https://operis.pro/tr/ilanlar/... veya ilan başlığı"
      : "https://operis.pro/en/listings/... or listing title";
  }
  return isTr ? "İlgili teklif, mesaj veya sayfa URL'si" : "Offer ID, message snippet or URL";
}

export function ReportForm({
  locale,
  defaultTargetType = "listing",
  defaultTargetIdentifier = "",
  hasSession = true,
}: ReportFormProps) {
  const isTr = locale === "tr";

  const [targetType, setTargetType] = useState(defaultTargetType);
  const [targetIdentifier, setTargetIdentifier] = useState(defaultTargetIdentifier);
  const [reasonCode, setReasonCode] = useState(REASON_CONFIGS[0]!.value);
  const [urgency, setUrgency] = useState("NORMAL");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [details, setDetails] = useState("");
  const [confidentialityChecked, setConfidentialityChecked] = useState(true);

  const [trackingCode, setTrackingCode] = useState<string>("");
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedReason =
    REASON_CONFIGS.find((r) => r.value === reasonCode) || REASON_CONFIGS[0]!;
  const currentTargetMeta =
    TARGET_TYPES.find((t) => t.value === targetType) || TARGET_TYPES[0]!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Client-side emoji warning
    if (EMOJI_REGEX.test(details)) {
      setError(
        isTr
          ? "Resmi denetim loglarının bütünlüğü için bildirim açıklamasında emoji kullanılamaz."
          : "For audit integrity, emojis are not permitted in report descriptions."
      );
      setIsLoading(false);
      return;
    }

    if (details.trim().length < 10) {
      setError(
        isTr
          ? "Lütfen en az 10 karakterlik açıklayıcı bilgi giriniz."
          : "Please provide at least 10 characters of explanation."
      );
      setIsLoading(false);
      return;
    }

    try {
      // Build structured details without emojis
      const urgencyLabelMap: Record<string, string> = {
        CRITICAL: "ACIL-FINANSAL",
        HIGH: "YUKSEK-ONCELIK",
      };
      const urgencyLabel = urgencyLabelMap[urgency] || "STANDART";

      let composedDetails = `[Oncelik: ${urgencyLabel}]`;
      if (evidenceUrl.trim()) {
        composedDetails += ` [KanitBaglantisi: ${evidenceUrl.trim()}]`;
      }
      composedDetails += ` ${details.trim()}`;

      // Enforce 2000 char limit safely
      if (composedDetails.length > 1950) {
        composedDetails = composedDetails.slice(0, 1950);
      }

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({
          targetType,
          targetIdentifier: targetIdentifier.trim(),
          reasonCode,
          details: composedDetails,
          locale,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || (isTr ? "Bildirim iletilemedi." : "Failed to submit report.")
        );
      }

      const generatedCode =
        data.reportId ?? `OPR-REP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      setTrackingCode(generatedCode);
      setIsSuccess(true);
    } catch (err: unknown) {
      const defaultErr = isTr
        ? "İşlem başarısız oldu. Lütfen tekrar deneyiniz."
        : "Report could not be submitted.";
      setError(err instanceof Error ? err.message : defaultErr);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!trackingCode) return;
    navigator.clipboard.writeText(trackingCode);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  // SUCCESS VIEW
  if (isSuccess) {
    return (
      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-6 sm:p-8 space-y-6 text-center shadow-xl backdrop-blur-xl">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-inner">
          <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
        </div>

        <div className="space-y-2 max-w-lg mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 uppercase">
            {isTr ? "Resmi Vaka Kaydı Açıldı" : "Formal Incident Ticket Created"}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">
            {isTr ? "Bildiriminiz Güvenlik Masasına İletildi" : "Report Dispatched to Security Desk"}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {isTr
              ? "Bildiriminiz kriptografik olarak zaman damgalandı ve soruşturma kuyruğuna alındı. Tarafsız denetmenlerimiz delilleri ivedilikle inceleyecektir."
              : "Your report has been cryptographically timestamped and queued for audit. Our neutral moderators will inspect the evidence promptly."}
          </p>
        </div>

        {/* Tracking Code Box */}
        {trackingCode && (
          <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-3 p-3.5 rounded-2xl border border-emerald-500/30 bg-[var(--color-surface-base)] shadow-sm">
            <span className="text-xs font-mono text-[var(--color-text-secondary)]">
              {isTr ? "Resmi Takip & Referans Kodu:" : "Official Tracking & Audit ID:"}
            </span>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono font-extrabold text-emerald-400 tracking-wider">
                {trackingCode}
              </code>
              <button
                type="button"
                onClick={handleCopyCode}
                aria-label={isTr ? "Takip kodunu kopyala" : "Copy tracking ID"}
                className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-[var(--color-text-tertiary)] hover:text-emerald-400 transition-colors cursor-pointer"
                title={isTr ? "Kopyala" : "Copy"}
              >
                {copiedTracking ? (
                  <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Resolution stages preview */}
        <div className="max-w-xl mx-auto grid grid-cols-3 gap-2 pt-2 text-[11px] text-left">
          <div className="p-3 rounded-xl bg-[var(--color-surface-base)]/80 border border-emerald-500/20 space-y-1">
            <span className="font-bold text-emerald-400 block">1. {isTr ? "Kayıt & Triage" : "Logging & Triage"}</span>
            <span className="text-[10px] text-[var(--color-text-tertiary)]">
              {isTr ? "Deliller indekslendi" : "Evidence indexed"}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[var(--color-surface-base)]/80 border border-[var(--color-border-subtle)] space-y-1 opacity-75">
            <span className="font-bold text-[var(--color-text-secondary)] block">2. {isTr ? "Moderatör İncelemesi" : "Audit Review"}</span>
            <span className="text-[10px] text-[var(--color-text-tertiary)]">
              {selectedReason.slaTr}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[var(--color-surface-base)]/80 border border-[var(--color-border-subtle)] space-y-1 opacity-75">
            <span className="font-bold text-[var(--color-text-secondary)] block">3. {isTr ? "Nihai Yaptırım" : "Enforcement"}</span>
            <span className="text-[10px] text-[var(--color-text-tertiary)]">
              {isTr ? "Kalıcı aksiyon" : "Final action"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setIsSuccess(false);
              setDetails("");
              setEvidenceUrl("");
            }}
            className="text-xs"
          >
            {isTr ? "Yeni Bir İhbar Gönder" : "Submit Another Report"}
          </Button>
          <Link href={`/${locale}/sss`}>
            <Button type="button" variant="secondary" size="sm" className="text-xs">
              {isTr ? "Güvenlik Rehberi & SSS" : "Trust Center & FAQ"}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // NON-AUTHENTICATED STATE (Enterprise dual-track portal)
  if (!hasSession) {
    const returnUrl = isTr ? "/tr/sikayet-bildir" : "/en/report";
    const loginUrl = isTr
      ? `/tr/giris?returnUrl=${encodeURIComponent(returnUrl)}`
      : `/en/login?returnUrl=${encodeURIComponent(returnUrl)}`;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card A: Account Login Route */}
          <div className="rounded-3xl border border-blue-500/30 bg-blue-500/5 p-6 sm:p-7 flex flex-col justify-between space-y-5 shadow-lg relative overflow-hidden">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 uppercase">
                {isTr ? "Tavsiye Edilen / Öncelikli Kanal" : "Recommended / Priority Queue"}
              </div>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <LogIn className="h-5 w-5 text-blue-400" />
                <span>{isTr ? "Operis Hesabıyla Bildir" : "Log In & File Verified Report"}</span>
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {isTr
                  ? "Oturum açarak yapacağınız bildirimler, anında kriptografik Takip Kodu (Audit ID) alır, doğrudan kıdemli denetmen sırasına girer ve sonuç bildirim panonuza iletilir."
                  : "Authenticated reports receive an immutable Tracking Audit ID, enter priority moderation triage, and notify you directly once resolved."}
              </p>
              <ul className="text-xs text-[var(--color-text-tertiary)] space-y-1.5 pt-1">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-blue-400" />
                  <span>{isTr ? "< 2 Saat Öncelikli Triage Kuyruğu" : "< 2-Hour Expedited Triage"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-blue-400" />
                  <span>{isTr ? "İki Taraflı Uyuşmazlık Hakemliği" : "Bilateral Dispute Resolution"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-blue-400" />
                  <span>{isTr ? "Canlı Bildirim ve Karar Raporu" : "Live Status & Enforcement Ledger"}</span>
                </li>
              </ul>
            </div>

            <div className="pt-2">
              <Link href={loginUrl} className="w-full block">
                <Button variant="primary" size="md" className="w-full gap-2 shadow-lg shadow-blue-500/20 font-semibold text-xs">
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  <span>{isTr ? "Giriş Yaparak Öncelikli Bildir" : "Log In to File Report"}</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Card B: External & Statutory Notice Desk */}
          <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 p-6 sm:p-7 flex flex-col justify-between space-y-5 shadow-sm">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 uppercase">
                {isTr ? "Resmi Yasal & Dış Hak Sahipleri" : "Statutory & External Rights Holders"}
              </div>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-400" />
                <span>{isTr ? "Hesapsız Resmi İhbar Masası" : "Notice & Takedown Desk"}</span>
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {isTr
                  ? "Operis üyesi olmayan marka/telif sahipleri (FSEK), vekiller veya adli makamlar resmi kanallardan doğrudan başvurabilir:"
                  : "Copyright owners (DMCA / FSEK), law enforcement, or external parties without an Operis account may file directly:"}
              </p>

              <div className="space-y-2 pt-1 text-xs">
                <div className="p-2.5 rounded-xl bg-[var(--color-surface-hover)]/60 border border-[var(--color-border-subtle)] flex items-center justify-between">
                  <span className="text-[var(--color-text-secondary)] font-medium">
                    {isTr ? "Telif & Fikri Hak Masası:" : "Copyright & IP Desk:"}
                  </span>
                  <a
                    href="mailto:legal@vellium.dev"
                    className="font-mono font-semibold text-purple-400 hover:underline"
                  >
                    legal@vellium.dev
                  </a>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--color-surface-hover)]/60 border border-[var(--color-border-subtle)] flex items-center justify-between">
                  <span className="text-[var(--color-text-secondary)] font-medium">
                    {isTr ? "Resmi KEP Tebligatı:" : "Registered KEP:"}
                  </span>
                  <span className="font-mono text-[11px] text-[var(--color-text-primary)]">
                    vellium@hs01.kep.tr
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="mailto:legal@vellium.dev?subject=Resmi%20Ihlal%20Bildirimi"
                className="w-full block"
              >
                <Button variant="outline" size="md" className="w-full gap-2 text-xs font-semibold">
                  <Mail className="h-4 w-4 text-purple-400" />
                  <span>{isTr ? "Resmi E-Posta ile İhbar Gönder" : "Email Statutory Desk"}</span>
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="p-4 rounded-2xl bg-[var(--color-surface-hover)]/40 border border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-tertiary)] flex items-center gap-2.5">
          <Info className="h-4 w-4 text-blue-400 shrink-0" />
          <span>
            {isTr
              ? "5651 Sayılı Kanun ve KVKK uyarınca, kötü niyetli asılsız ihbarları ve karalama girişimlerini önlemek amacıyla platform içi bildirimlerde kullanıcı kimlik doğrulaması zorunludur."
              : "In accordance with relevant statutes and cyber regulations, verified account authentication is required for in-platform reports to prevent malicious defamatory abuse."}
          </span>
        </div>
      </div>
    );
  }

  // AUTHENTICATED FORM VIEW
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-400">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-0.5">
            <span className="font-bold block">{isTr ? "Bildirim Hatası" : "Submission Error"}</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Target Type Selector Buttons */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
          {isTr ? "1. İhlal Edilen İçerik Türü" : "1. Target Category"}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TARGET_TYPES.map((t) => {
            const isSelected = targetType === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTargetType(t.value)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "border-blue-500/60 bg-blue-500/10 shadow-sm ring-1 ring-blue-500/40"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] hover:border-[var(--color-border-strong)]"
                }`}
              >
                <span
                  className={`text-xs font-semibold ${
                    isSelected ? "text-blue-400 font-bold" : "text-[var(--color-text-primary)]"
                  }`}
                >
                  {isTr ? t.labelTr : t.labelEn}
                </span>
                <span className="text-[10px] text-[var(--color-text-tertiary)] mt-1">
                  {isTr ? t.hintTr : t.hintEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Identifier */}
      <TextInput
        label={
          isTr
            ? `${currentTargetMeta.labelTr} Bağlantısı veya Kimliği`
            : `${currentTargetMeta.labelEn} URL or Identifier`
        }
        value={targetIdentifier}
        onChange={(e) => setTargetIdentifier(e.target.value)}
        placeholder={getTargetPlaceholder(targetType, isTr)}
        required
      />

      {/* Reason Category Grid */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
          {isTr ? "2. İhlal Nedeni & Kapsamı" : "2. Policy Violation Reason"}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {REASON_CONFIGS.map((r) => {
            const isSelected = reasonCode === r.value;
            const Icon = r.icon;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => setReasonCode(r.value)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex items-start gap-3 ${
                  isSelected
                    ? "border-blue-500/60 bg-blue-500/10 shadow-sm ring-1 ring-blue-500/40"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] hover:border-[var(--color-border-strong)]"
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    isSelected ? "bg-blue-500/20 text-blue-400" : "bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-xs font-semibold truncate ${
                        isSelected ? "text-blue-400 font-bold" : "text-[var(--color-text-primary)]"
                      }`}
                    >
                      {isTr ? r.labelTr : r.labelEn}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] shrink-0">
                      {isTr ? r.slaTr : r.slaEn}
                    </span>
                  </div>
                  <span className="text-[11px] text-[var(--color-text-tertiary)] block">
                    {isTr ? r.badgeTr : r.badgeEn}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Evidence Guidance Box based on selected category */}
      <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
          <Info className="h-4 w-4 shrink-0" />
          <span>{isTr ? "Bu İhlal Türü İçin İstenen Deliller & SLA:" : "Expected Evidence & SLA:"}</span>
        </div>
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          {isTr ? selectedReason.evidenceTr : selectedReason.evidenceEn}
        </p>
        <div className="flex items-center gap-2 pt-1 text-[11px] text-blue-400 font-mono">
          <Clock className="h-3.5 w-3.5" />
          <span>
            {isTr ? "Taahhüt Edilen Triage Yanıtı:" : "Committed Triage SLA:"}{" "}
            <strong>{isTr ? selectedReason.slaTr : selectedReason.slaEn}</strong>
          </span>
        </div>
      </div>

      {/* Urgency Level Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
          {isTr ? "3. Aciliyet Düzeyi" : "3. Urgency Level"}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {URGENCY_LEVELS.map((u) => {
            const isSelected = urgency === u.value;
            return (
              <button
                key={u.value}
                type="button"
                onClick={() => setUrgency(u.value)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? `${u.color} ring-1 ring-current font-bold`
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-[var(--color-text-secondary)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{isTr ? u.labelTr : u.labelEn}</span>
                </div>
                <span className="text-[10px] opacity-80 block mt-1">
                  {isTr ? u.slaTr : u.slaEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* External Evidence URL */}
      <TextInput
        label={isTr ? "Kanıt / Ekran Görüntüsü Bağlantısı (İsteğe Bağlı)" : "Evidence / Screenshot Link (Optional)"}
        value={evidenceUrl}
        onChange={(e) => setEvidenceUrl(e.target.value)}
        placeholder={isTr ? "Google Drive, GitHub commit veya bulut depolama bağlantısı..." : "Google Drive, Cloud storage or repo URL..."}
        startIcon={<ExternalLink className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />}
        hint={isTr ? "Deliller denetmen ekibimizin vakayı anında doğrulamasına yardımcı olur." : "Direct links help moderators verify incident claims faster."}
      />

      {/* Detailed Chronology */}
      <TextArea
        label={isTr ? "4. Olayın Detaylı Açıklaması ve Kronolojisi" : "4. Detailed Incident Chronology"}
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        placeholder={
          isTr
            ? "Lütfen olayın ne zaman başladığını, hangi vaatlerin veya sözleşme maddelerinin ihlal edildiğini ve karşı tarafın tutumunu kronolojik olarak yazınız (Emoji kullanmayınız)..."
            : "Detail the chronological sequence of events, specific contractual violations, and counterparty communications (Emojis not allowed)..."
        }
        required
        rows={5}
        maxLength={1900}
        hint={
          isTr
            ? "Asgari 10 karakter. Resmi audit günlüğü için emoji kullanımı engellenmiştir."
            : "Minimum 10 chars. Emojis are disabled for audit logging standards."
        }
      />

      {/* Confidentiality Lock Toggle */}
      <div className="p-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] flex items-start gap-3">
        <input
          id="confidentiality-toggle"
          type="checkbox"
          checked={confidentialityChecked}
          onChange={(e) => setConfidentialityChecked(e.target.checked)}
          className="h-4 w-4 mt-0.5 rounded border-[var(--color-border-strong)] text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
        <label htmlFor="confidentiality-toggle" className="text-xs text-[var(--color-text-secondary)] leading-relaxed cursor-pointer select-none">
          <strong className="text-[var(--color-text-primary)] block font-semibold">
            {isTr ? "Tam Gizlilik & Muhbirlik Koruması (Whistleblower Protection)" : "Whistleblower Confidentiality Protection"}
          </strong>
          {isTr
            ? "Kimliğim, kullanıcı adım ve şikayet gerekçelerim şikayet edilen tarafa hiçbir koşulda açıklanmasın. İnceleme Operis Denetim Kurulu tarafından bağımsız yürütülsün."
            : "My identity and specific report details shall never be disclosed to the reported entity. The review will be performed autonomously by Operis moderation."}
        </label>
      </div>

      {/* Submit Action */}
      <div className="space-y-3 pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full text-sm font-semibold cursor-pointer shadow-lg shadow-blue-500/20"
          isLoading={isLoading}
        >
          {isTr ? "Resmi İhlal Bildirimini Güvenlik Masasına İlet" : "Submit Incident Report to Security Desk"}
        </Button>

        <p className="text-[11px] text-center text-[var(--color-text-tertiary)]">
          {isTr
            ? "Bildirim göndererek, beyan ettiğiniz bilgilerin doğruluğunu ve kötü niyetli olmadığını taahhüt edersiniz."
            : "By submitting, you certify that all information provided is accurate and not intended for defamatory abuse."}
        </p>
      </div>
    </form>
  );
}
