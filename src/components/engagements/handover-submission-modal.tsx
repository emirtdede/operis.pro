"use client";

import { useState } from "react";
import {
  X,
  GitBranch,
  Globe,
  Key,
  FileText,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Activity,
  RefreshCw,
} from "lucide-react";
import { Button } from "../ui/button";
import { AccessTransferChecklist } from "@/src/modules/contracts/types";
import type { DeliveryHealthReport } from "@/src/modules/engagements/delivery-inspector";

interface HandoverSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  engagementId: string;
  listingTitle: string;
  locale?: string;
  onSuccess: () => void;
}

function getInspectButtonLabel(isInspecting: boolean, isTr: boolean): string {
  if (isInspecting) {
    return isTr ? "Denetleniyor..." : "Inspecting...";
  }
  return isTr ? "Canlılığı & Depoyu Denetle" : "Inspect Deliverables";
}

function getSubmitButtonLabel(isSubmitting: boolean, isTr: boolean): string {
  if (isSubmitting) {
    return isTr ? "Teslim Ediliyor & Mühürleniyor..." : "Submitting & Sealing...";
  }
  return isTr ? "Teslimatı Tamamla ve Sayacı Başlat" : "Complete Handover & Start Timer";
}

export function HandoverSubmissionModal({
  isOpen,
  onClose,
  engagementId,
  listingTitle,
  locale = "tr",
  onSuccess,
}: HandoverSubmissionModalProps) {
  const isTr = locale === "tr";

  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [commitHash, setCommitHash] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [documentationNotes, setDocumentationNotes] = useState("");
  const [checklist, setChecklist] = useState<AccessTransferChecklist>({
    dnsTransferred: false,
    hostingTransferred: false,
    adminAccountsTransferred: false,
    apiKeysTransferred: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
  const [healthReport, setHealthReport] = useState<DeliveryHealthReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCheckboxChange = (key: keyof AccessTransferChecklist) => {
    setChecklist((prev: AccessTransferChecklist) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleInspect = async () => {
    if (!repositoryUrl.trim()) {
      setErrorMessage(
        isTr
          ? "Denetim için önce geçerli bir Git depo URL'si girilmelidir."
          : "Please enter Git repository URL first."
      );
      return;
    }

    setIsInspecting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/work/${engagementId}/handover/inspect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({
          repositoryUrl: repositoryUrl.trim(),
          commitHash: commitHash.trim() || null,
          liveUrl: liveUrl.trim() || null,
          locale: isTr ? "tr" : "en",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || (isTr ? "Denetim başarısız oldu." : "Inspection failed."));
      }

      setHealthReport(data.report);
    } catch (err: unknown) {
      const defaultErr = isTr ? "Denetim sırasında hata oluştu." : "Inspection failed.";
      setErrorMessage(err instanceof Error ? err.message : defaultErr);
    } finally {
      setIsInspecting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!repositoryUrl || !/^https?:\/\/.+/i.test(repositoryUrl.trim())) {
      setErrorMessage(
        isTr
          ? "Lütfen geçerli bir kaynak kod deposu (GitHub / GitLab / Bitbucket vb.) bağlantısı girin."
          : "Please enter a valid Git repository URL (e.g. GitHub, GitLab, Bitbucket)."
      );
      return;
    }

    if (!documentationNotes.trim() || documentationNotes.trim().length < 10) {
      setErrorMessage(
        isTr
          ? "Lütfen en az 10 karakter uzunluğunda kurulum ve teknik devir notu ekleyin."
          : "Please enter handover/setup documentation notes (at least 10 characters)."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/work/${engagementId}/handover`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({
          action: "SUBMIT",
          repositoryUrl: repositoryUrl.trim(),
          commitHash: commitHash.trim() || null,
          liveUrl: liveUrl.trim() || null,
          documentationNotes: documentationNotes.trim(),
          accessChecklist: checklist,
          lang: isTr ? "tr" : "en",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isTr ? "Teslimat gönderilemedi." : "Failed to submit handover."));
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const defaultErr = isTr ? "Bir hata oluştu." : "An error occurred.";
      setErrorMessage(err instanceof Error ? err.message : defaultErr);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-cyan-500/30 bg-[var(--color-surface-base)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border-subtle)] bg-cyan-950/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <GitBranch className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]">
                {isTr ? "Resmi İş Teslimatını Başlat (TBK m. 474)" : "Submit Official Handover (TBK Art. 474)"}
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] truncate max-w-md">
                {listingTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto p-6 space-y-5">
          {/* Statutory Legal Notice Box */}
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-4 flex gap-3 text-xs text-[var(--color-text-secondary)] leading-relaxed">
            <ShieldAlert className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-cyan-300 block mb-1">
                {isTr ? "Yasal Zırh & 7 İş Günü Muayene Süresi:" : "Statutory 7-Business-Day Inspection Notice:"}
              </span>
              {isTr ? (
                <>
                  Teslimatı gönderdiğiniz an sistem üzerinde SHA-256 dijital teslimat mührü oluşturulur ve Türk Borçlar Kanunu (TBK m. 474) uyarınca İşveren için <strong>7 iş günü yasal muayene ve ayıp bildirim süresi</strong> başlar. Süre bitiminde itiraz edilmediği takdirde eser kanunen zımnen kabul edilmiş sayılır (TBK m. 477).
                </>
              ) : (
                <>
                  Upon submission, a SHA-256 digital proof seal is generated and a <strong>7-business-day statutory inspection window</strong> (TBK Art. 474) begins for the client. If no dispute is lodged within this period, the work is legally deemed accepted by statute (TBK Art. 477).
                </>
              )}
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Repository URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
              <GitBranch className="h-3.5 w-3.5 text-cyan-400" />
              <span>{isTr ? "Kaynak Kod Deposu (Git Repository URL) *" : "Git Repository URL *"}</span>
            </label>
            <input
              type="url"
              required
              placeholder="https://github.com/organization/project-name"
              value={repositoryUrl}
              onChange={(e) => setRepositoryUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
            />
          </div>

          {/* Commit Hash & Live Deployment URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-cyan-400" />
                <span>{isTr ? "Commit Hash / Sürüm Tag'i" : "Commit Hash / Tag"}</span>
              </label>
              <input
                type="text"
                placeholder="Örn: 9a7b1c3 veya v1.0.0-prod"
                value={commitHash}
                onChange={(e) => setCommitHash(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-cyan-400" />
                <span>{isTr ? "Çalışır Canlı / Demo Bağlantısı" : "Live Deployment URL"}</span>
              </label>
              <input
                type="url"
                placeholder="https://app.proje-adiniz.com"
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
              />
            </div>
          </div>

          {/* PoW Delivery Health Inspector Trigger & Result Box */}
          <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-bold text-[var(--color-text-primary)]">
                  {isTr ? "Proof-of-Work (PoW) Canlılık Denetçisi" : "Proof-of-Work (PoW) Health Inspector"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleInspect}
                disabled={isInspecting || !repositoryUrl.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-3 w-3 ${isInspecting ? "animate-spin" : ""}`} />
                <span>{getInspectButtonLabel(isInspecting, isTr)}</span>
              </button>
            </div>

            {healthReport ? (
              <div className="space-y-2 pt-1 border-t border-[var(--color-border-subtle)] text-xs">
                {/* Live Deployment Status */}
                {healthReport.liveDeployment.checked ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
                    <div className="flex items-center gap-2">
                      {healthReport.liveDeployment.isAccessible && healthReport.liveDeployment.httpStatus === 200 ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                      )}
                      <div>
                        <span className="font-semibold text-[var(--color-text-primary)] block">
                          {isTr ? "Canlı Demo Durumu:" : "Live Status:"}
                        </span>
                        <span className="text-[11px] text-[var(--color-text-tertiary)] font-mono truncate max-w-xs block">
                          {healthReport.liveDeployment.url}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {healthReport.liveDeployment.httpStatus && (
                        <span
                          className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold ${
                            healthReport.liveDeployment.httpStatus >= 200 && healthReport.liveDeployment.httpStatus < 300
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          HTTP {healthReport.liveDeployment.httpStatus}
                        </span>
                      )}
                      {healthReport.liveDeployment.responseTimeMs !== undefined && (
                        <span className="text-[11px] font-mono text-cyan-300">
                          {healthReport.liveDeployment.responseTimeMs} ms
                        </span>
                      )}
                      {healthReport.liveDeployment.sslValid && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                          SSL ✓
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-[var(--color-text-tertiary)] italic">
                    {isTr ? "Canlı link belirtilmedi (Depo bazlı teslimat yapılacak)." : "No live URL provided (Source repo handover)."}
                  </div>
                )}

                {/* Git Repository Status */}
                {healthReport.gitRepository.checked && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-cyan-400 shrink-0" />
                      <div>
                        <span className="font-semibold text-[var(--color-text-primary)] block">
                          {healthReport.gitRepository.provider.toUpperCase()} Reposu
                        </span>
                        <span className="text-[11px] text-[var(--color-text-tertiary)] font-mono truncate max-w-xs block">
                          {healthReport.gitRepository.url}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {healthReport.gitRepository.commitHash && (
                        <span
                          className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold ${
                            healthReport.gitRepository.commitValid !== false
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          Commit {healthReport.gitRepository.commitValid !== false ? "✓" : "⚠️"}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                        {healthReport.gitRepository.isPublic ? "Herkese Açık" : "Erişim Yetkili"}
                      </span>
                    </div>
                  </div>
                )}

                {/* PoW Stamp Notice */}
                <div className="flex items-center justify-between text-[11px] text-[var(--color-text-secondary)] pt-1">
                  <span className="text-emerald-400 font-medium">
                    {isTr ? healthReport.badgeTextTr : healthReport.badgeTextEn}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]" title="Proof-of-Work SHA-256">
                    PoW: {healthReport.powSeal.slice(0, 16)}...
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                {isTr
                  ? "İşverenin teslimatı güvenle onaylayabilmesi için canlı URL ve Git deposunu sunucu üzerinden test edebilirsiniz."
                  : "Validate your live deployment and repository accessibility to reassure the client before submission."}
              </p>
            )}
          </div>

          {/* Access & Credentials Handover Checklist */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-cyan-400" />
              <span>{isTr ? "Erişim ve Hesap Devir Kontrol Listesi" : "Credentials & Access Handover Checklist"}</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  key: "dnsTransferred" as const,
                  labelTr: "Alan adı / DNS yetkileri devredildi",
                  labelEn: "Domain & DNS access transferred",
                },
                {
                  key: "hostingTransferred" as const,
                  labelTr: "Sunucu / Bulut barındırma devredildi",
                  labelEn: "Hosting & Cloud permissions transferred",
                },
                {
                  key: "adminAccountsTransferred" as const,
                  labelTr: "Yönetici (Admin) süper hesapları devredildi",
                  labelEn: "Admin superuser accounts transferred",
                },
                {
                  key: "apiKeysTransferred" as const,
                  labelTr: "API gizli anahtarları ve .env güvenle paylaşıldı",
                  labelEn: "API secret keys & .env securely transferred",
                },
              ].map((item) => (
                <label
                  key={item.key}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    checklist[item.key]
                      ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200"
                      : "border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checklist[item.key]}
                    onChange={() => handleCheckboxChange(item.key)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-600 text-cyan-500 focus:ring-cyan-400 cursor-pointer"
                  />
                  <span className="text-xs font-medium">
                    {isTr ? item.labelTr : item.labelEn}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Documentation & Installation Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-cyan-400" />
              <span>{isTr ? "Teknik Devir & Kurulum Notları (README) *" : "Handover & Setup Notes *"}</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder={
                isTr
                  ? "Projenin nasıl derleneceği, gerekli ortam değişkenleri, veritabanı migration adımları ve devir detayları..."
                  : "How to build the project, required environment variables, database migrations, and handover notes..."
              }
              value={documentationNotes}
              onChange={(e) => setDocumentationNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border-subtle)] shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              {isTr ? "Vazgeç" : "Cancel"}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold shadow-lg shadow-cyan-600/20"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{getSubmitButtonLabel(isSubmitting, isTr)}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
