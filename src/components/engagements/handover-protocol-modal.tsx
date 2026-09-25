"use client";

import { useState, useMemo } from "react";
import {
  X,
  Printer,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  ExternalLink,
  RotateCcw,
  Activity,
  Sparkles,
} from "lucide-react";
import { Button } from "../ui/button";
import { HandoverDetailsResult } from "@/src/modules/engagements/handover-service";
import { AccessTransferChecklist } from "@/src/modules/contracts/types";
import type { DeliveryHealthReport } from "@/src/modules/engagements/delivery-inspector";
import { ScopeSentinelEngine } from "@/src/modules/engagements/scope-sentinel/scope-sentinel-engine";
import {
  CreateChangeRequestModal,
  CreateChangeRequestInitialData,
} from "./change-requests/create-change-request-modal";

export interface HandoverProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  engagementId: string;
  handoverData: HandoverDetailsResult;
  listingTitle?: string;
  category?: string;
  technicalScopeSummary?: string;
  acceptanceCriteria?: string[];
  currency?: string;
  locale?: string;
  onActionSuccess: () => void;
}

function getCopySealButtonLabel(copied: boolean, isTr: boolean): string {
  if (copied) return isTr ? "Mühür Kopyalandı" : "Copied!";
  return isTr ? "Mührü Kopyala" : "Copy Seal";
}

function getCopyTextButtonLabel(copied: boolean, isTr: boolean): string {
  if (copied) return isTr ? "Metin Kopyalandı" : "Copied!";
  return isTr ? "Metni Kopyala" : "Copy Markdown";
}

function getSubmitRevisionButtonLabel(isSubmitting: boolean, isTr: boolean): string {
  if (isSubmitting) return isTr ? "İletiliyor..." : "Submitting...";
  return isTr ? "Revizyon Talebini İlet" : "Send Revision";
}

function getAcceptProtocolButtonLabel(isAccepting: boolean, isTr: boolean): string {
  if (isAccepting) {
    return isTr ? "Kabul Ediliyor & Mühürleniyor..." : "Accepting...";
  }
  return isTr ? "Teslimatı Resmi Olarak Onayla" : "Accept & Seal Protocol";
}

function renderHandoverFooterStatus(
  isAccepted: boolean,
  status: string,
  acceptanceType: string | null | undefined,
  isTr: boolean
) {
  if (isAccepted) {
    let label = isTr ? "Açık Kabul Beyanı ile İmzalandı" : "Expressly Accepted by Client";
    if (acceptanceType === "TACIT") {
      label = isTr
        ? "TBK m. 477/2 Zımni Yasal Kabul ile Yürürlükte"
        : "Enforced via TBK Art. 477/2 Tacit Acceptance";
    }

    return (
      <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
        <CheckCircle2 className="h-4 w-4" />
        <span>{label}</span>
      </div>
    );
  }

  if (status === "REVISION_REQUESTED") {
    return (
      <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
        <RotateCcw className="h-4 w-4" />
        <span>
          {isTr ? "Revizyon Aşamasında (Düzeltme Bekleniyor)" : "Revision Requested"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
      <Clock className="h-4 w-4" />
      <span>
        {isTr
          ? "TBK m. 474 Yasal Muayene ve İtiraz Sürecinde"
          : "Statutory Inspection Window Active"}
      </span>
    </div>
  );
}

export function HandoverProtocolModal({
  isOpen,
  onClose,
  engagementId,
  handoverData,
  listingTitle,
  category,
  technicalScopeSummary,
  acceptanceCriteria,
  currency = "TRY",
  locale = "tr",
  onActionSuccess,
}: HandoverProtocolModalProps) {
  const isTr = locale === "tr";

  const { handover, protocol, canAccept, canRequestRevision } = handoverData;

  const [copiedSeal, setCopiedSeal] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [activeTab, setActiveTab] = useState<"protocol" | "deliverables">("protocol");

  // Client Action states
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRevisionMode, setIsRevisionMode] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Scope Creep Sentinel & Addendum Drafter State
  const [addendumModalOpen, setAddendumModalOpen] = useState(false);
  const [addendumInitialData, setAddendumInitialData] =
    useState<CreateChangeRequestInitialData | null>(null);

  const scopeAnalysis = useMemo(() => {
    if (!revisionNotes || revisionNotes.trim().length < 5) return null;
    return ScopeSentinelEngine.analyze({
      candidateText: revisionNotes,
      baseline: {
        listingTitle: listingTitle || protocol?.protocolRef || "Proje Hakedişi",
        category,
        technicalScopeSummary: technicalScopeSummary || protocol?.markdown,
        acceptanceCriteria,
      },
      currency,
      locale: isTr ? "tr" : "en",
    });
  }, [
    revisionNotes,
    listingTitle,
    category,
    technicalScopeSummary,
    protocol?.markdown,
    protocol?.protocolRef,
    acceptanceCriteria,
    currency,
    isTr,
  ]);

  if (!isOpen || !handover || !protocol) return null;

  const handleCopySeal = async () => {
    try {
      await navigator.clipboard.writeText(protocol.sha256Seal);
      setCopiedSeal(true);
      setTimeout(() => setCopiedSeal(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(protocol.markdown);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch {
      // fallback
    }
  };

  const handlePrint = () => {
    const printWindow = window.open(
      `/api/work/${engagementId}/handover/export?format=html&lang=${locale}`,
      "_blank"
    );
    if (printWindow) {
      printWindow.focus();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleDownloadMarkdown = () => {
    window.location.href = `/api/work/${engagementId}/handover/export?format=md&lang=${locale}`;
  };

  const handleAcceptHandover = async () => {
    if (
      !confirm(
        isTr
          ? "Teslim edilen çıktılar incelendi ve eksiksiz kabul edilsin mi?"
          : "Accept the delivered work and seal the protocol?"
      )
    ) {
      return;
    }

    setIsAccepting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/work/${engagementId}/handover`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({
          action: "ACCEPT",
          lang: isTr ? "tr" : "en",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || (isTr ? "Kabul işlemi tamamlanamadı." : "Failed to accept handover.")
        );
      }

      onActionSuccess();
      onClose();
    } catch (err: unknown) {
      const defaultErr = isTr ? "Hata oluştu." : "Error occurred.";
      setActionError(err instanceof Error ? err.message : defaultErr);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRequestRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionNotes.trim() || revisionNotes.trim().length < 10) {
      setActionError(
        isTr
          ? "Lütfen en az 10 karakter uzunluğunda revizyon gerekçesi belirtin."
          : "Please enter at least 10 characters describing the required revision."
      );
      return;
    }

    setIsSubmittingRevision(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/work/${engagementId}/handover`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({
          action: "REVISION",
          revisionNotes: revisionNotes.trim(),
          lang: isTr ? "tr" : "en",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || (isTr ? "Revizyon iletilemedi." : "Failed to request revision.")
        );
      }

      setIsRevisionMode(false);
      onActionSuccess();
      onClose();
    } catch (err: unknown) {
      const defaultErr = isTr ? "Hata oluştu." : "Error occurred.";
      setActionError(err instanceof Error ? err.message : defaultErr);
    } finally {
      setIsSubmittingRevision(false);
    }
  };

  const isAccepted = handover.status === "ACCEPTED_EXPRESS" || handover.status === "ACCEPTED_TACIT";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-cyan-500/40 bg-[var(--color-surface-base)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-[var(--color-border-subtle)] bg-gradient-to-r from-cyan-950/30 via-[var(--color-surface-base)] to-blue-950/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]">
                  {isTr
                    ? "Resmi İş Teslim-Tesellüm Tutanağı"
                    : "Proof of Delivery & Handover Protocol"}
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  {protocol.protocolRef}
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {isTr
                  ? "TBK m. 474 / 477 & FSEK m. 52 Uyarınca Hukuken Geçerli Resmi Tutanak"
                  : "Statutory Protocol under Turkish Code of Obligations (TBK Art. 474/477)"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>{isTr ? "PDF / Yazdır" : "Print PDF"}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadMarkdown}
              className="gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>.md</span>
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Cryptographic Seal Banner */}
        <div className="px-6 py-2.5 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-blue-500/10 border-b border-[var(--color-border-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-emerald-300">
              {isTr
                ? "HMK m. 193 Dijital Teslimat Mührü (SHA-256):"
                : "Cryptographic Seal (SHA-256):"}
            </span>
            <code className="font-mono text-[11px] text-[var(--color-text-primary)] bg-black/30 px-2 py-0.5 rounded border border-emerald-500/20 max-w-[200px] sm:max-w-xs truncate">
              {protocol.sha256Seal}
            </code>
          </div>
          <button
            type="button"
            onClick={handleCopySeal}
            className="flex items-center gap-1 text-[11px] font-medium text-emerald-300 hover:text-emerald-200 transition-colors"
          >
            {copiedSeal ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{getCopySealButtonLabel(copiedSeal, isTr)}</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/40 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("protocol")}
            className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === "protocol"
                ? "border-cyan-500 text-cyan-300 bg-cyan-500/5"
                : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {isTr ? "Resmi Tutanak Metni" : "Official Legal Protocol"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("deliverables")}
            className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === "deliverables"
                ? "border-cyan-500 text-cyan-300 bg-cyan-500/5"
                : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {isTr ? "Teslim Edilen Çıktılar & Devir" : "Deliverables & Access"}
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {actionError && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 flex items-center gap-2.5 text-xs text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* TAB 1: PROTOCOL TEXT */}
          {activeTab === "protocol" && (
            <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-6 space-y-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-subtle)]">
                <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  {isTr ? "Resmi Yasal Tutanak Önizleme" : "Legal Protocol Markdown Preview"}
                </span>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  {copiedText ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>{getCopyTextButtonLabel(copiedText, isTr)}</span>
                </button>
              </div>

              <div className="prose prose-invert max-w-none text-xs leading-relaxed font-mono whitespace-pre-wrap select-text bg-black/20 p-4 rounded-xl border border-[var(--color-border-subtle)]/60 text-[var(--color-text-secondary)]">
                {protocol.markdown}
              </div>
            </div>
          )}

          {/* TAB 2: DELIVERABLES SUMMARY */}
          {activeTab === "deliverables" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 space-y-2">
                  <span className="text-xs font-bold text-[var(--color-text-primary)] block">
                    {isTr ? "Kaynak Kod Deposu (Git)" : "Source Code Repository"}
                  </span>
                  <a
                    href={handover.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1.5 break-all"
                  >
                    <span>{handover.repositoryUrl}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                  {handover.commitHash && (
                    <div className="text-[11px] text-[var(--color-text-secondary)] font-mono">
                      Commit: <span className="text-cyan-300">{handover.commitHash}</span>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 space-y-2">
                  <span className="text-xs font-bold text-[var(--color-text-primary)] block">
                    {isTr ? "Canlı / Demo Yayını" : "Live Deployment URL"}
                  </span>
                  {handover.liveUrl ? (
                    <a
                      href={handover.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1.5 break-all"
                    >
                      <span>{handover.liveUrl}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-xs text-[var(--color-text-tertiary)] italic">
                      {isTr ? "Belirtilmedi (Doğrudan repo üzerinden teslim)" : "Not specified"}
                    </span>
                  )}
                </div>
              </div>

              {/* Proof-of-Work (PoW) Health & Uptime Verification Card */}
              {(() => {
                const report = (handoverData.deliveryHealth ||
                  (handover as unknown as { deliveryHealth?: DeliveryHealthReport })
                    .deliveryHealth) as DeliveryHealthReport | null | undefined;
                if (!report) return null;
                return (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 sm:p-5 space-y-3 shadow-lg shadow-emerald-500/5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <Activity className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[var(--color-text-primary)] block">
                            {isTr
                              ? "Proof-of-Work (PoW) Canlılık ve Sistem Sağlık Raporu"
                              : "Proof-of-Work (PoW) Delivery Health Report"}
                          </span>
                          <span className="text-[11px] text-emerald-400 font-medium block">
                            {isTr ? report.badgeTextTr : report.badgeTextEn}
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                        {isTr ? "SİSTEM ONAYLI" : "VERIFIED"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                      <div className="p-2.5 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] space-y-1">
                        <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-semibold block">
                          {isTr ? "HTTP Durumu" : "HTTP Status"}
                        </span>
                        <div className="font-mono font-bold text-emerald-400">
                          {report.liveDeployment.httpStatus
                            ? `HTTP ${report.liveDeployment.httpStatus} OK`
                            : "—"}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] space-y-1">
                        <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-semibold block">
                          {isTr ? "Yanıt Süresi & SSL" : "Latency & SSL"}
                        </span>
                        <div className="font-mono font-semibold text-cyan-300">
                          {report.liveDeployment.responseTimeMs !== undefined
                            ? `${report.liveDeployment.responseTimeMs} ms`
                            : "—"}{" "}
                          {report.liveDeployment.sslValid ? "• SSL ✓" : ""}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] space-y-1">
                        <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-semibold block">
                          {isTr ? "PoW Mührü" : "PoW Seal"}
                        </span>
                        <div
                          className="font-mono text-[10px] text-[var(--color-text-secondary)] truncate"
                          title={report.powSeal}
                        >
                          {report.powSeal.slice(0, 16)}...
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Access Checklist */}
              {(() => {
                const checklist = (handover.accessChecklist ||
                  {}) as Partial<AccessTransferChecklist>;
                return (
                  <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 space-y-3">
                    <span className="text-xs font-bold text-[var(--color-text-primary)] block">
                      {isTr ? "Devir Kontrol Durumu" : "Access & Credentials Checklist"}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        {
                          labelTr: "Alan Adı / DNS Yetkileri Devri",
                          labelEn: "DNS & Domain Management",
                          done: Boolean(checklist.dnsTransferred),
                        },
                        {
                          labelTr: "Sunucu / Cloud Barındırma Devri",
                          labelEn: "Hosting & Cloud Permissions",
                          done: Boolean(checklist.hostingTransferred),
                        },
                        {
                          labelTr: "Yönetici (Admin) Hesapları Devri",
                          labelEn: "Admin Superuser Accounts",
                          done: Boolean(checklist.adminAccountsTransferred),
                        },
                        {
                          labelTr: "API Gizli Anahtarları & .env",
                          labelEn: "API Keys & Environment Secrets",
                          done: Boolean(checklist.apiKeysTransferred),
                        },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--color-surface-hover)] text-xs"
                        >
                          {item.done ? (
                            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-rose-400 shrink-0" />
                          )}
                          <span className="font-medium text-[var(--color-text-secondary)]">
                            {isTr ? item.labelTr : item.labelEn}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Documentation Notes */}
              <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 space-y-2">
                <span className="text-xs font-bold text-[var(--color-text-primary)] block">
                  {isTr ? "Teknik Devir & Kurulum Notları" : "Handover & Technical Notes"}
                </span>
                <p className="text-xs text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">
                  {handover.documentationNotes}
                </p>
              </div>

              {/* Revision Notes if any */}
              {handover.revisionNotes && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
                  <span className="text-xs font-bold text-amber-300 block">
                    {isTr
                      ? "İşveren Tarafından Bildirilen Revizyon / Ayıp Notu:"
                      : "Client Revision / Defect Notice:"}
                  </span>
                  <p className="text-xs text-amber-200 whitespace-pre-wrap leading-relaxed">
                    {handover.revisionNotes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* REVISION FORM (Inline mode) */}
          {isRevisionMode && (
            <form
              onSubmit={handleRequestRevision}
              className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3"
            >
              <span className="text-xs font-bold text-amber-300 block">
                {isTr
                  ? "TBK m. 474 Kapsamında Revizyon / Eksik İş Bildirimi"
                  : "Formal Revision / Defect Notice (TBK Art. 474)"}
              </span>
              <textarea
                required
                rows={3}
                placeholder={
                  isTr
                    ? "Teslim edilen çıktılarda tespit ettiğiniz eksik, ayıp veya sözleşmeye aykırılık gerekçelerini detaylandırın..."
                    : "Describe the defects, missing components, or non-compliance with the agreed specifications..."
                }
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                className="w-full p-3 rounded-xl border border-amber-500/30 bg-[var(--color-surface-base)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-amber-400"
              />

              {/* AI Scope Creep Sentinel Warning Card */}
              {scopeAnalysis?.isScopeCreep && (
                <div className="rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent p-3.5 space-y-3 shadow-sm animate-in fade-in duration-200">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-amber-300">
                        {isTr
                          ? "Kapsam Dışı Ek İş Uyarısı (AI Destekli)"
                          : "Out-of-Scope Work Notice (AI-Assisted)"}
                      </div>
                      <p className="text-xs text-amber-200/95 leading-relaxed">
                        {isTr
                          ? scopeAnalysis.warningCardMessageTr
                          : scopeAnalysis.warningCardMessageEn}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-500/20">
                    <span className="text-[11px] text-amber-300/70 font-mono">
                      {isTr
                        ? "Dayanak: TBK m. 480/2 Kapsam Aşımı"
                        : "Basis: TBK Art. 480/2 Scope Expansion"}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (scopeAnalysis.quickAddendumDraft) {
                          setAddendumInitialData(scopeAnalysis.quickAddendumDraft);
                          setAddendumModalOpen(true);
                        }
                      }}
                      className="gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>
                        {isTr
                          ? "Tek Tıkla Resmi Ek Sözleşme (Zeyilname) Oluştur"
                          : "1-Click Draft Official Addendum"}
                      </span>
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRevisionMode(false)}
                >
                  {isTr ? "Vazgeç" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingRevision}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
                >
                  {getSubmitRevisionButtonLabel(isSubmittingRevision, isTr)}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Footer with Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] shrink-0">
          <div className="text-xs text-[var(--color-text-secondary)]">
            {renderHandoverFooterStatus(isAccepted, handover.status, handover.acceptanceType, isTr)}
          </div>

          <div className="flex items-center gap-2.5">
            {canRequestRevision && !isRevisionMode && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsRevisionMode(true)}
                className="text-xs text-amber-400 hover:text-amber-300 border-amber-500/30"
              >
                {isTr ? "Revizyon İste (TBK m. 474)" : "Request Revision"}
              </Button>
            )}

            {canAccept && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleAcceptHandover}
                disabled={isAccepting}
                className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-600/20"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{getAcceptProtocolButtonLabel(isAccepting, isTr)}</span>
              </Button>
            )}

            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              {isTr ? "Kapat" : "Close"}
            </Button>
          </div>
        </div>
      </div>

      {/* 1-Click Contract Addendum Modal Triggered by Scope Sentinel */}
      {addendumModalOpen && (
        <CreateChangeRequestModal
          isOpen={addendumModalOpen}
          onClose={() => setAddendumModalOpen(false)}
          engagementId={engagementId}
          currency={currency}
          locale={locale}
          initialData={addendumInitialData}
          onSuccess={() => {
            setAddendumModalOpen(false);
            setIsRevisionMode(false);
            onActionSuccess();
          }}
        />
      )}
    </div>
  );
}
