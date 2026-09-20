"use client";

import { useState, useEffect, useRef } from "react";
import { Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "../../ui/button";
import {
  ExportJobState,
  SecurityFeedback,
  getErrorMessage,
  getExportInitiatedMessage,
  getExportJobStatusMessage,
  getExportChecksumLabel,
} from "../types";

export interface DataExportSectionProps {
  locale: string;
  onFeedback: (feedback: SecurityFeedback) => void;
}

function renderExportJobIcon(status: string) {
  if (status === "QUEUED" || status === "PENDING" || status === "PROCESSING") {
    return <Loader2 className="h-4 w-4 animate-spin text-[var(--color-brand-primary)]" />;
  }
  if (status === "READY") {
    return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  }
  return <AlertCircle className="h-4 w-4 text-amber-400" />;
}

export function DataExportSection({ locale, onFeedback }: DataExportSectionProps) {
  const isTr = locale === "tr";

  const [isExportingData, setIsExportingData] = useState(false);
  const [exportJob, setExportJob] = useState<ExportJobState | null>(null);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollAbortControllerRef = useRef<AbortController | null>(null);
  const consecutivePollErrorsRef = useRef(0);
  const isPollingInFlightRef = useRef(false);

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (pollAbortControllerRef.current) {
      pollAbortControllerRef.current.abort();
      pollAbortControllerRef.current = null;
    }
    isPollingInFlightRef.current = false;
  };

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  const startPolling = (jobId: string) => {
    stopPolling();
    consecutivePollErrorsRef.current = 0;

    const poll = async () => {
      if (isPollingInFlightRef.current) return;
      isPollingInFlightRef.current = true;

      const abortController = new AbortController();
      pollAbortControllerRef.current = abortController;

      try {
        const res = await fetch(`/api/account/export?jobId=${encodeURIComponent(jobId)}`, {
          headers: { "x-locale": locale },
          signal: abortController.signal,
        });

        // 401 / 403: Stop polling immediately (unauthorized)
        if (res.status === 401 || res.status === 403) {
          stopPolling();
          setIsExportingData(false);
          onFeedback({
            type: "error",
            message: isTr
              ? "Oturum süreniz doldu. Lütfen tekrar giriş yapınız."
              : "Session expired. Please sign in again.",
          });
          return;
        }

        // 429: Respect Retry-After
        if (res.status === 429) {
          const retryAfterHeader = res.headers.get("Retry-After");
          const retrySeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 5;
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          pollTimerRef.current = setInterval(poll, Math.max(3000, retrySeconds * 1000));
          return;
        }

        if (!res.ok) {
          consecutivePollErrorsRef.current++;
          const errData = await res.json().catch(() => ({}));
          if (consecutivePollErrorsRef.current >= 5) {
            stopPolling();
            setIsExportingData(false);
            onFeedback({
              type: "error",
              message:
                errData.error ||
                (isTr
                  ? "Sunucu bağlantısı sağlanamadı. Lütfen daha sonra tekrar deneyiniz."
                  : "Unable to connect to server. Please try again later."),
            });
            return;
          }
          throw new Error(errData.error || "Failed to poll export status");
        }

        consecutivePollErrorsRef.current = 0;

        const data = await res.json();
        const job = data.job || data;
        const currentJobId = job.jobId || job.id;
        if (!currentJobId) return;

        const currentStatus = job.status as ExportJobState["status"];
        const progress = job.progressPercent ?? job.progress ?? 0;
        let downloadUrl = job.downloadUrl;
        if (!downloadUrl && currentStatus === "READY") {
          downloadUrl = `/api/account/export?jobId=${encodeURIComponent(currentJobId)}&download=1`;
        }
        const sha256Checksum = job.sha256Checksum || job.checksumSha256;

        setExportJob({
          jobId: currentJobId,
          status: currentStatus,
          progressPercent: progress,
          downloadUrl,
          fileSizeBytes: job.fileSizeBytes,
          sha256Checksum,
        });

        if (currentStatus === "READY") {
          stopPolling();
          setIsExportingData(false);
          onFeedback({
            type: "success",
            message: isTr
              ? "Veri aktarım arşiviniz hazırlandı. İndirme başlatılıyor..."
              : "Data export archive prepared. Starting download...",
          });
          if (downloadUrl) {
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = `operis-data-export-${currentJobId}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        } else if (currentStatus === "FAILED") {
          stopPolling();
          setIsExportingData(false);
          onFeedback({
            type: "error",
            message:
              data.error ||
              (isTr
                ? "Veri aktarımı başarısız oldu. Lütfen tekrar deneyin."
                : "Data export failed. Please try again."),
          });
        } else if (currentStatus === "EXPIRED") {
          stopPolling();
          setIsExportingData(false);
          onFeedback({
            type: "warning",
            message: isTr
              ? "Veri aktarım dosyasının süresi doldu. Lütfen yeni bir istek başlatın."
              : "Data export expired. Please start a new request.",
          });
        }
      } catch {
        if (abortController.signal.aborted) return;
        consecutivePollErrorsRef.current++;
        if (consecutivePollErrorsRef.current >= 5) {
          stopPolling();
          setIsExportingData(false);
          onFeedback({
            type: "error",
            message: isTr
              ? "Bağlantı hatası: Durum sorgulanamıyor. Lütfen tekrar deneyiniz."
              : "Network error: Unable to check status. Please try again.",
          });
        }
      } finally {
        isPollingInFlightRef.current = false;
      }
    };

    poll();
    pollTimerRef.current = setInterval(poll, 2500);
  };

  const handleCancelExport = async () => {
    if (!exportJob?.jobId) return;
    const targetJobId = exportJob.jobId;
    stopPolling();
    setIsExportingData(false);

    try {
      const res = await fetch(`/api/account/export?jobId=${encodeURIComponent(targetJobId)}`, {
        method: "DELETE",
        headers: { "x-locale": locale },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || (isTr ? "İptal işlemi başarısız oldu." : "Failed to cancel export.")
        );
      }

      setExportJob((prev) => (prev ? { ...prev, status: "FAILED" } : null));
      onFeedback({
        type: "success",
        message: isTr
          ? "Veri aktarım işi başarıyla iptal edildi."
          : "Export job cancelled successfully.",
      });
    } catch (err: unknown) {
      onFeedback({
        type: "error",
        message: getErrorMessage(err, isTr ? "İptal edilemedi." : "Cancellation failed."),
      });
    }
  };

  const handleExportData = async () => {
    setIsExportingData(true);
    try {
      const res = await fetch("/api/account/export", {
        method: "POST",
        headers: { "x-locale": locale },
      });
      const data = await res.json();
      if (!res.ok && res.status !== 202 && res.status !== 409) {
        throw new Error(
          data.error || (isTr ? "Veri aktarımı başlatılamadı." : "Failed to initiate data export.")
        );
      }

      const jobId = data.jobId || data.job?.id;
      if (!jobId) {
        throw new Error(isTr ? "Geçersiz iş kimliği alındı." : "Invalid job id received.");
      }

      setExportJob({
        jobId,
        status: (data.status as ExportJobState["status"]) || "PENDING",
        progressPercent: data.progressPercent ?? data.progress ?? 0,
      });

      onFeedback({
        type: "success",
        message: getExportInitiatedMessage(Boolean(data.alreadyRunning), isTr),
      });

      startPolling(jobId);
    } catch (err: unknown) {
      setIsExportingData(false);
      onFeedback({
        type: "error",
        message: getErrorMessage(err, isTr ? "Veri indirme hatası." : "Export failed."),
      });
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-6 sm:p-7 space-y-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            <Download className="h-4 w-4 text-[var(--color-brand-primary)]" aria-hidden="true" />
            <span>
              {isTr ? "KVKK & GDPR: Kişisel Veri İndirme" : "KVKK & GDPR: Data Portability"}
            </span>
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed max-w-xl">
            {isTr
              ? "Operis üzerindeki profil, kimlik doğrulama, ilan, teklif, eşleşme ve güvenlik günlüğü kayıtlarınızın tamamını JSON formatında indirebilirsiniz."
              : "Download a machine-readable JSON copy of all your personal profile, encrypted identity, listings, proposals, matches, and security audit records."}
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleExportData}
          isLoading={isExportingData}
          disabled={isExportingData}
          className="text-xs font-semibold gap-1.5 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{isTr ? "Verilerimi İndir (.json)" : "Download My Data (.json)"}</span>
        </Button>
      </div>

      {exportJob && (
        <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/50 p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {renderExportJobIcon(exportJob.status)}
              <span className="font-medium text-[var(--color-text-primary)]">
                {getExportJobStatusMessage(exportJob.status, exportJob.progressPercent, isTr)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {exportJob.fileSizeBytes !== undefined && (
                <span className="text-[var(--color-text-secondary)]">
                  {(exportJob.fileSizeBytes / 1024).toFixed(1)} KB
                </span>
              )}
              {(exportJob.status === "QUEUED" ||
                exportJob.status === "PENDING" ||
                exportJob.status === "PROCESSING") && (
                <button
                  type="button"
                  onClick={handleCancelExport}
                  className="text-[11px] font-medium text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors cursor-pointer"
                >
                  {isTr ? "İptal Et" : "Cancel"}
                </button>
              )}
            </div>
          </div>

          {exportJob.status === "PROCESSING" && (
            <div className="w-full bg-[var(--color-border-subtle)] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[var(--color-brand-primary)] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(5, exportJob.progressPercent)}%` }}
              />
            </div>
          )}

          {exportJob.status === "READY" && exportJob.downloadUrl && (
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-[var(--color-text-tertiary)] truncate max-w-xs">
                SHA-256: {getExportChecksumLabel(exportJob.sha256Checksum, isTr)}
              </span>
              <a
                href={exportJob.downloadUrl}
                download={`operis-data-export-${exportJob.jobId}.json`}
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-brand-primary)] hover:underline"
              >
                <Download className="h-3.5 w-3.5" />
                {isTr ? "Tekrar İndir" : "Download Again"}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
