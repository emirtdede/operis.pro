"use client";

import { useState, useEffect } from "react";
import {
  Scale,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Zap,
  Activity,
  Award,
} from "lucide-react";
import type { DisputeArbitrationReport } from "@/src/modules/ai/dispute-arbiter";

interface DisputeArbiterCardProps {
  engagementId: string;
  report?: DisputeArbitrationReport | null;
  isAdmin?: boolean;
  locale?: string;
  onAutofillDecision?: (decision: "FORCE_COMPLETE" | "FORCE_CANCEL", suggestedNotes: string) => void;
}

function getRepositoryDeliveryStatus(delivered: boolean, isTr: boolean): string {
  if (delivered) {
    return isTr ? "✅ Teslim Edildi" : "✅ Delivered";
  }
  return isTr ? "❌ Teslim Edilmedi" : "❌ Missing";
}

function getPowSealStatus(verified: boolean, isTr: boolean): string {
  if (verified) {
    return isTr ? "✅ Doğrulandı" : "✅ Verified";
  }
  return isTr ? "Beklemede" : "Pending";
}

function getBreachPartyLabel(isClient: boolean, isTr: boolean): string {
  if (isClient) {
    return isTr ? "İşveren İhlali" : "Client Breach";
  }
  return isTr ? "Yüklenici İhlali" : "Contractor Breach";
}

function getSeverityBadgeClass(isCritical: boolean, severity: string): string {
  if (isCritical) {
    return "bg-rose-500/20 text-rose-300 border border-rose-500/30";
  }
  if (severity === "MODERATE") {
    return "bg-amber-500/20 text-amber-300 border border-amber-500/30";
  }
  return "bg-slate-800 text-slate-400";
}

export function DisputeArbiterCard({
  engagementId,
  report: initialReport,
  isAdmin = false,
  locale = "tr",
  onAutofillDecision,
}: DisputeArbiterCardProps) {
  const isTr = locale === "tr";
  const [report, setReport] = useState<DisputeArbitrationReport | null>(initialReport ?? null);
  const [isLoading, setIsLoading] = useState(!initialReport);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filterParty, setFilterParty] = useState<"ALL" | "CLIENT" | "CONTRACTOR">("ALL");
  const [showLegalGrounds, setShowLegalGrounds] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  useEffect(() => {
    if (initialReport) {
      setReport(initialReport);
      return;
    }

    let isMounted = true;
    const fetchUrl = isAdmin
      ? `/api/admin/engagements/${engagementId}/dispute-report`
      : `/api/work/${engagementId}/dispute-report`;

    setIsLoading(true);
    fetch(fetchUrl)
      .then((res) => {
        if (!res.ok) {
          throw new Error(isTr ? "Tahkim raporu yüklenemedi." : "Failed to load arbitration report.");
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted && data.report) {
          setReport(data.report);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setFetchError(err.message || "Network error");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [engagementId, initialReport, isAdmin, isTr]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-5 space-y-3 animate-pulse">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
          <Scale className="h-4 w-4 animate-spin" />
          <span>{isTr ? "⚖️ Operis AI Tahkim Motoru delilleri analiz ediyor..." : "⚖️ Operis AI Arbiter is analyzing evidence..."}</span>
        </div>
        <div className="h-4 bg-indigo-900/40 rounded w-3/4"></div>
        <div className="h-3 bg-indigo-900/30 rounded w-1/2"></div>
      </div>
    );
  }

  if (fetchError || !report) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          {fetchError || (isTr ? "Tahkim raporu henüz hazır değil." : "Arbitration report not available.")}
        </span>
      </div>
    );
  }

  const {
    freelancerEntitlementPercent,
    clientRefundPercent,
    verdictRecommendation,
    verdictSummaryTr,
    verdictSummaryEn,
    identifiedBreaches,
    evidenceSummary,
    recommendedActionTr,
    recommendedActionEn,
    statutoryLegalGroundsTr,
    statutoryLegalGroundsEn,
    markdownReportTr,
    markdownReportEn,
  } = report;

  const filteredBreaches = identifiedBreaches.filter((b) => {
    if (filterParty === "ALL") return true;
    return b.party === filterParty;
  });

  const handleCopyReport = () => {
    const textToCopy = isTr ? markdownReportTr : markdownReportEn;
    navigator.clipboard.writeText(textToCopy);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  const getVerdictBadge = () => {
    switch (verdictRecommendation) {
      case "FORCE_COMPLETE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {isTr ? "YÜKLENİCİ LEHİNE TAMAMLAMA (FORCE COMPLETE)" : "FAVOR CONTRACTOR (FORCE COMPLETE)"}
          </span>
        );
      case "FORCE_CANCEL":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <XCircle className="h-3.5 w-3.5" />
            {isTr ? "İŞVEREN LEHİNE İPTAL & İADE (FORCE CANCEL)" : "FAVOR CLIENT (FORCE CANCEL)"}
          </span>
        );
      case "RECOMMENDED_COMPROMISE":
      case "SPLIT_EQUAL":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <Scale className="h-3.5 w-3.5" />
            {isTr
              ? `UZLAŞMA TAVSİYESİ (%${freelancerEntitlementPercent} Yüklenici / %${clientRefundPercent} İade)`
              : `COMPROMISE (%${freelancerEntitlementPercent} Contractor / %${clientRefundPercent} Refund)`}
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-slate-950 p-4 sm:p-6 shadow-xl space-y-5 text-slate-200">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-500/20 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
              <Scale className="h-4 w-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
              <span>{isTr ? "⚖️ Operis AI: Tarafsız Tahkim ve Delil Raporu" : "⚖️ Operis AI: Neutral Arbitration & Evidence Report"}</span>
            </h3>
          </div>
          <p className="text-[11px] text-slate-400">
            {isTr
              ? "TBK m. 470/474/480, FSEK ve 6325 sayılı Doğrudan Arabuluculuk uyarınca algoritmik delil analizi."
              : "Algorithmic evidence arbiter compliant with TBK Art. 470/474/480 and Mediation Law No. 6325."}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {getVerdictBadge()}
          <button
            type="button"
            onClick={handleCopyReport}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
            title={isTr ? "Raporu Kopyala" : "Copy Report"}
          >
            {copiedReport ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Dual Ratio Meter (Haklılık ve Paylaşım Dağılımı) */}
      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-emerald-400 flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5" />
            {isTr ? "Yazılımcı Hakediş Oranı" : "Contractor Entitlement"}: %{freelancerEntitlementPercent}
          </span>
          <span className="text-sky-400 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            {isTr ? "İşveren İade / Bakiye Oranı" : "Client Refund Ratio"}: %{clientRefundPercent}
          </span>
        </div>

        {/* Visual Dual Color Progress Bar */}
        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${freelancerEntitlementPercent}%` }}
            className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full transition-all duration-500"
            title={`Yüklenici: %${freelancerEntitlementPercent}`}
          />
          <div
            style={{ width: `${clientRefundPercent}%` }}
            className="bg-gradient-to-r from-sky-500 to-indigo-600 h-full transition-all duration-500"
            title={`İşveren: %${clientRefundPercent}`}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Executive Summary & Recommendation */}
      <div className="space-y-2">
        <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs leading-relaxed space-y-1.5">
          <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-indigo-400" />
            <span>{isTr ? "Hakem Karar Özeti & Formülü" : "Arbitration Verdict Summary"}</span>
          </div>
          <p className="text-slate-300">
            {isTr ? verdictSummaryTr : verdictSummaryEn}
          </p>
          <div className="pt-1.5 border-t border-indigo-500/20 text-[11px] text-indigo-200">
            <strong>{isTr ? "Önerilen Hüküm:" : "Recommended Decree:"}</strong>{" "}
            {isTr ? recommendedActionTr : recommendedActionEn}
          </div>
        </div>
      </div>

      {/* Proof-of-Work (PoW) & Technical Delivery Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Repo & Demo Health */}
        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
            {isTr ? "Teslimat & PoW Sağlık Durumu" : "Delivery & PoW Health"}
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{isTr ? "Kaynak Kod Deposu:" : "Repository:"}</span>
              <span className={evidenceSummary.repositoryDelivered ? "text-emerald-400 font-medium" : "text-rose-400 font-medium"}>
                {getRepositoryDeliveryStatus(evidenceSummary.repositoryDelivered, isTr)}
              </span>
            </div>

            {evidenceSummary.liveDemoUrl && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{isTr ? "Canlı Demo (HTTP):" : "Live Demo:"}</span>
                <span className={evidenceSummary.liveDemoStatus === 200 ? "text-emerald-400 font-medium" : "text-rose-400 font-medium"}>
                  {evidenceSummary.liveDemoStatus === 200 ? `HTTP 200 OK (${evidenceSummary.liveDemoLatencyMs ?? 0}ms)` : `HTTP ${evidenceSummary.liveDemoStatus || "ERR"}`}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-slate-400">{isTr ? "HMK m. 193 Mührü:" : "HMK Art. 193 Seal:"}</span>
              <span className={evidenceSummary.powSealVerified ? "text-emerald-400 font-medium" : "text-amber-400 font-medium"}>
                {getPowSealStatus(evidenceSummary.powSealVerified, isTr)}
              </span>
            </div>
          </div>
        </div>

        {/* Statutory Inspection & Revision Round */}
        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            {isTr ? "TBK m. 474 Muayene & Revizyon" : "Statutory Inspection & Revisions"}
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{isTr ? "Geçen Muayene Süresi:" : "Inspection Elapsed:"}</span>
              <span className="text-slate-200 font-mono">
                {evidenceSummary.inspectionDaysElapsed} {isTr ? "takvim günü" : "days"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{isTr ? "Talep Edilen Revizyon:" : "Revision Rounds:"}</span>
              <span className={evidenceSummary.revisionRoundsCount > 2 ? "text-rose-400 font-bold" : "text-slate-200 font-mono"}>
                {evidenceSummary.revisionRoundsCount} / 2 {isTr ? "(Madde 4.3 sınırı)" : "(Clause 4.3 cap)"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{isTr ? "Scope Shield Ek Talepler:" : "Scope Shield CRs:"}</span>
              <span className="text-slate-200 font-mono">
                {evidenceSummary.changeRequestsCount} {isTr ? "talep" : "items"} ({evidenceSummary.approvedAddendumsCount} {isTr ? "onaylı" : "approved"})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Identified Breaches Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            {isTr ? "Tespit Edilen Sözleşme İhlalleri" : "Identified Contract Breaches"} ({identifiedBreaches.length})
          </span>

          {/* Party Filter Chips */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
            <button
              type="button"
              onClick={() => setFilterParty("ALL")}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                filterParty === "ALL" ? "bg-indigo-600 text-white font-semibold" : "text-slate-400 hover:text-white"
              }`}
            >
              {isTr ? "Tümü" : "All"}
            </button>
            <button
              type="button"
              onClick={() => setFilterParty("CLIENT")}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                filterParty === "CLIENT" ? "bg-indigo-600 text-white font-semibold" : "text-slate-400 hover:text-white"
              }`}
            >
              {isTr ? "İşveren" : "Client"}
            </button>
            <button
              type="button"
              onClick={() => setFilterParty("CONTRACTOR")}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                filterParty === "CONTRACTOR" ? "bg-indigo-600 text-white font-semibold" : "text-slate-400 hover:text-white"
              }`}
            >
              {isTr ? "Yüklenici" : "Contractor"}
            </button>
          </div>
        </div>

        {filteredBreaches.length === 0 ? (
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 text-center">
            {isTr ? "Seçilen filtrede tespit edilmiş sözleşme ihlali bulunmamaktadır." : "No contractual breaches found for selected party."}
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {filteredBreaches.map((item, idx) => {
              const isClient = item.party === "CLIENT";
              const isCritical = item.severity === "CRITICAL";
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs space-y-1.5 transition-colors ${
                    isCritical
                      ? "bg-rose-950/20 border-rose-800/40"
                      : "bg-slate-900/60 border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isClient
                            ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                            : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                        }`}
                      >
                        {getBreachPartyLabel(isClient, isTr)}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 font-bold">{item.clause}</span>
                    </div>

                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${getSeverityBadgeClass(isCritical, item.severity)}`}
                    >
                      {item.severity}
                    </span>
                  </div>

                  <div className="font-semibold text-white">{isTr ? item.titleTr : item.titleEn}</div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {isTr ? item.descriptionTr : item.descriptionEn}
                  </p>

                  {item.evidenceSnippet && (
                    <div className="p-2 rounded-lg bg-black/40 border border-slate-800/80 text-[10px] text-slate-400 font-mono italic">
                      &ldquo;{item.evidenceSnippet}&rdquo;
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Statutory Legal Grounds Accordion */}
      <div className="border-t border-slate-800 pt-3">
        <button
          type="button"
          onClick={() => setShowLegalGrounds(!showLegalGrounds)}
          className="flex items-center justify-between w-full text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-indigo-400" />
            {isTr ? "Hukuki ve Yasal Dayanaklar (TBK / FSEK / Arabuluculuk)" : "Statutory & Legal Grounds"}
          </span>
          {showLegalGrounds ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showLegalGrounds && (
          <div className="mt-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] space-y-1.5 animate-in fade-in">
            {(isTr ? statutoryLegalGroundsTr : statutoryLegalGroundsEn).map((ground, gIdx) => (
              <div key={gIdx} className="flex items-start gap-1.5 text-slate-300">
                <span className="text-indigo-400 font-bold">•</span>
                <span>{ground}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Official HMK m. 193 Evidence Dossier Export */}
      <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[11px] text-slate-400">
          {isTr
            ? "Resmi arabulucu ve mahkemelere sunulmak üzere tanzim edilmiş kriptografik delil paketi:"
            : "Cryptographic evidentiary dossier compiled for court & mediation authorities:"}
        </div>
        <a
          href={`/api/work/${engagementId}/dossier?format=zip&lang=${locale}`}
          download
          className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Scale className="h-3.5 w-3.5 text-indigo-400" />
          <span>{isTr ? "⚖️ HMK 193 Delil Paketini İndir (.zip)" : "⚖️ Download HMK 193 Dossier (.zip)"}</span>
        </a>
      </div>

      {/* Admin 1-Click Action Autofill Button (Only shown in Admin Panel) */}
      {isAdmin && onAutofillDecision && (
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] text-slate-400">
            {isTr
              ? "Tahkim motorunun gerekçeli karar metnini yönetici karar formuna aktarın:"
              : "Autofill arbitration decree reasoning into the admin notes form:"}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const targetDecision =
                  verdictRecommendation === "FORCE_CANCEL" ? "FORCE_CANCEL" : "FORCE_COMPLETE";
                const notes = isTr
                  ? `[Operis AI Tahkim Raporu Gerekçesi]\n${verdictSummaryTr}\n\nHüküm: ${recommendedActionTr}\n\nHukuki Dayanaklar:\n${statutoryLegalGroundsTr.map((g) => `- ${g}`).join("\n")}`
                  : `[Operis AI Arbitration Report Decree]\n${verdictSummaryEn}\n\nVerdict: ${recommendedActionEn}\n\nStatutory Grounds:\n${statutoryLegalGroundsEn.map((g) => `- ${g}`).join("\n")}`;
                onAutofillDecision(targetDecision, notes);
              }}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>{isTr ? "Tahkim Kararını Forma Aktar (1-Tıkla)" : "Autofill Decree to Form"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
