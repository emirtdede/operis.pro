"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  FileCheck2,
  ShieldAlert,
  Download,
  Printer,
  Copy,
  Check,
  Clock,
  PenTool,
  Loader2,
  RefreshCw,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "../ui/button";
import { ContractRecommendationCard } from "./contract-recommendation-card";
import { SignaturePadModal } from "./signature-pad-modal";
import { ConfettiCanvas } from "../ui/confetti-canvas";
import type { ContractPackageDetails } from "@/src/modules/contracts/signing-types";
import type { ContractRecommendationItem } from "@/src/modules/contracts/recommendation-types";

interface UnifiedContractSigningHubProps {
  engagementId: string;
  isOwner: boolean;
  currentUser: {
    displayName?: string;
    email?: string;
  };
  counterparty: {
    displayName: string;
    email: string;
  };
  locale?: string;
  onViewFullText?: () => void;
}

function getCopyTextLabel(copied: boolean, isTr: boolean): string {
  if (copied) {
    return isTr ? "Kopyalandı" : "Copied";
  }
  return isTr ? "Metni Kopyala" : "Copy Text";
}

function getSigningHubTitle(hasSigned: boolean, isTr: boolean): string {
  if (hasSigned) {
    return isTr
      ? "İmzanız Kaydedildi (Karşı Taraf Bekleniyor)"
      : "Your Signature Recorded (Awaiting Counterparty)";
  }
  return isTr
    ? "Tek Sayfada Tüm Sözleşmeleri İmzala"
    : "Sign All Agreements on a Single Page";
}

function getSigningHubDescription(hasSigned: boolean, isTr: boolean): string {
  if (hasSigned) {
    return isTr
      ? "Karşı taraf da imzasını sisteme yüklediğinde tüm sözleşmeler otomatik olarak imzalanacaktır."
      : "As soon as counterparty signs, all agreements will execute automatically.";
  }
  return isTr
    ? "Sözleşmeleri tek tek imzalamak yerine, imzanızı bir kez yükleyerek seçili tüm sözleşmeleri onaylayın."
    : "Sign once to execute all selected agreements simultaneously.";
}

export function UnifiedContractSigningHub({
  engagementId,
  isOwner,
  currentUser,
  counterparty,
  locale = "tr",
  onViewFullText,
}: UnifiedContractSigningHubProps) {
  const isTr = locale === "tr";
  const myRole: "CLIENT" | "CONTRACTOR" = isOwner ? "CLIENT" : "CONTRACTOR";

  const [packageDetails, setPackageDetails] = useState<ContractPackageDetails | null>(null);
  const [allContracts, setAllContracts] = useState<ContractRecommendationItem[]>([]);
  const [selectedContractIds, setSelectedContractIds] = useState<string[]>(["CORE_SERVICE"]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingSelection, setIsUpdatingSelection] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [tamperWarning, setTamperWarning] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [liveToastMessage, setLiveToastMessage] = useState<string | null>(null);

  const prevStatusRef = useRef<string | null>(null);

  // Fetch package state & smart recommendations
  const loadPackageData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);

    try {
      const res = await fetch(
        `/api/work/${engagementId}/contract/recommendations?locale=${locale}`
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error || (isTr ? "Sözleşme paketi yüklenemedi." : "Failed to load contract package.")
        );
      }

      setPackageDetails(data.package);
      if (data.recommendations?.allContracts) {
        setAllContracts(data.recommendations.allContracts);
      }
      if (data.package?.selectedContracts) {
        setSelectedContractIds(data.package.selectedContracts);
      }
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [engagementId, locale, isTr]);

  useEffect(() => {
    loadPackageData();
  }, [loadPackageData]);

  // Real-time synchronization via SSE stream & BroadcastChannel (H-RTSC)
  useEffect(() => {
    if (typeof window === "undefined") return;

    let es: EventSource | null = null;
    let broadcastChannel: BroadcastChannel | null = null;

    if ("BroadcastChannel" in window) {
      try {
        broadcastChannel = new BroadcastChannel(`operis_contract_${engagementId}`);
        broadcastChannel.onmessage = (e) => {
          if (e.data?.type === "REFRESH_PACKAGE") {
            loadPackageData();
          }
        };
      } catch {
        // BroadcastChannel unavailable
      }
    }

    try {
      es = new EventSource(`/api/work/${engagementId}/contract/stream`);

      es.addEventListener("contract_event", (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === "CONTRACT_SIGNED") {
            loadPackageData();
            const signerRole = payload.signerRole;
            const isCounterparty =
              (myRole === "CLIENT" && signerRole === "CONTRACTOR") ||
              (myRole === "CONTRACTOR" && signerRole === "CLIENT");

            if (isCounterparty) {
              if (typeof document !== "undefined" && document.visibilityState === "visible") {
                setShowConfetti(true);
              }
              setLiveToastMessage(
                isTr
                  ? `🎉 Harika haber! ${payload.signerName || "Karşı taraf"} sözleşmeyi imzaladı! Sıra sizde — Lütfen siz de imzanızı ekleyin.`
                  : `🎉 Great news! ${payload.signerName || "Counterparty"} has signed the contract! Awaiting your signature.`
              );
            }
          } else if (payload.type === "CONTRACT_FULLY_EXECUTED") {
            loadPackageData();
            if (document.visibilityState === "visible") {
              setShowConfetti(true);
            }
            setLiveToastMessage(
              isTr
                ? "🎉 Tüm sözleşmeler her iki tarafça başarıyla imzalandı ve SHA-256 ile mühürlendi!"
                : "🎉 All agreements have been executed and cryptographically sealed by both parties!"
            );
          } else if (payload.type === "CONTRACT_SIGNATURES_INVALIDATED") {
            loadPackageData();
            setTamperWarning(
              isTr
                ? payload.noticeTr ||
                    "Sözleşme seçimi değiştiği için önceden atılmış olan imza(lar) güvenlik amacıyla sıfırlandı."
                : payload.noticeEn ||
                    "Contract selection changed; prior signatures were invalidated."
            );
          } else if (payload.type === "CONTRACT_SELECTION_UPDATED") {
            loadPackageData();
          }
        } catch {
          // Non-critical parse error
        }
      });
    } catch {
      // SSE connection error fallback
    }

    // Adaptive fallback polling every 6 seconds while not fully executed
    const pollInterval = setInterval(() => {
      if (packageDetails?.status !== "FULLY_SIGNED") {
        loadPackageData();
      }
    }, 6000);

    return () => {
      if (es) {
        es.close();
      }
      if (broadcastChannel) {
        broadcastChannel.close();
      }
      clearInterval(pollInterval);
    };
  }, [engagementId, loadPackageData, myRole, isTr, packageDetails?.status]);

  // Track status transition for celebration
  useEffect(() => {
    if (
      prevStatusRef.current &&
      prevStatusRef.current !== "FULLY_SIGNED" &&
      packageDetails?.status === "FULLY_SIGNED"
    ) {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        setShowConfetti(true);
      }
    }
    prevStatusRef.current = packageDetails?.status || null;
  }, [packageDetails?.status]);

  // Handle toggling contracts in the package
  const handleToggleContract = async (contractId: string) => {
    if (packageDetails?.status === "FULLY_SIGNED" || isUpdatingSelection) return;

    // TAMPER PROTECTION CONFIRMATION
    const hasAnySigned = Boolean(
      packageDetails?.clientSignature || packageDetails?.contractorSignature
    );
    if (hasAnySigned) {
      const confirmMsg = isTr
        ? "DİKKAT: Sözleşme kapsamını değiştirmek daha önce atılmış olan imzaları geçersiz kılar ve her iki tarafın yeniden imzalamasını gerektirir.\n\nDevam etmek istiyor musunuz?"
        : "WARNING: Changing contract selection will invalidate existing signature(s) and require both parties to re-sign.\n\nDo you want to proceed?";
      if (!window.confirm(confirmMsg)) return;
    }

    const newSelection = selectedContractIds.includes(contractId)
      ? selectedContractIds.filter((id) => id !== contractId)
      : [...selectedContractIds, contractId];

    // Ensure CORE_SERVICE is always selected
    if (!newSelection.includes("CORE_SERVICE")) {
      newSelection.unshift("CORE_SERVICE");
    }

    setSelectedContractIds(newSelection);
    setIsUpdatingSelection(true);

    try {
      const res = await fetch(`/api/work/${engagementId}/contract/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedContracts: newSelection }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.package) {
        setPackageDetails(data.package);
        if (data.signaturesInvalidated) {
          setTamperWarning(
            isTr
              ? data.noticeTr ||
                  "Sözleşme seçimi değiştiği için önceden atılmış olan imza(lar) güvenlik amacıyla sıfırlandı. Lütfen güncel paketi yeniden imzalayın."
              : data.noticeEn ||
                  "Contract selection changed; prior signature(s) were invalidated. Please review and re-sign."
          );
        } else {
          setTamperWarning(null);
        }
      }
    } catch {
      // Revert on error
      setSelectedContractIds(packageDetails?.selectedContracts || ["CORE_SERVICE"]);
    } finally {
      setIsUpdatingSelection(false);
    }
  };

  const isFullySigned = packageDetails?.status === "FULLY_SIGNED";
  const hasClientSigned = Boolean(packageDetails?.clientSignature);
  const hasFreelancerSigned = Boolean(packageDetails?.contractorSignature);
  const hasCurrentUserSigned = isOwner ? hasClientSigned : hasFreelancerSigned;

  const handleCopy = () => {
    if (packageDetails?.compiledMarkdown) {
      navigator.clipboard.writeText(packageDetails.compiledMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.open(`/api/work/${engagementId}/contract?format=html`, "_blank");
  };

  const handleDownloadMarkdown = () => {
    window.open(`/api/work/${engagementId}/contract?format=markdown`, "_blank");
  };

  const handleDownloadBundle = () => {
    if (!packageDetails?.compiledMarkdown) return;
    const bundleData = {
      engagementId,
      packageId: packageDetails.id,
      signedAt: packageDetails.signedAt,
      sha256Seal: packageDetails.sha256Seal,
      selectedContracts: packageDetails.selectedContracts,
      version: packageDetails.version,
      tamperResetCount: packageDetails.tamperResetCount,
      clientSigner: packageDetails.clientSignature?.signerName,
      contractorSigner: packageDetails.contractorSignature?.signerName,
      legalDisclaimer:
        "Operis platformu 5651 sayılı Kanun kapsamında yalnızca yer sağlayıcı olup sözleşmenin tarafı değildir (TBK m. 26/115, HMK m. 193/199).",
      markdown: packageDetails.compiledMarkdown,
    };

    const blob = new Blob([JSON.stringify(bundleData, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `operis-contract-bundle-${engagementId.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
        <p className="text-xs text-[var(--color-text-muted)]">
          {isTr ? "Akıllı sözleşme önerileri yükleniyor..." : "Loading contract recommendations..."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {fetchError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{fetchError}</span>
        </div>
      )}

      {tamperWarning && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
          <span>{tamperWarning}</span>
        </div>
      )}

      {/* Live Real-Time Push Toast (H-RTSC) */}
      {liveToastMessage && (
        <div className="flex items-center justify-between rounded-xl border border-indigo-500/40 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-emerald-500/20 p-3 text-xs text-white shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 font-medium">
            <Sparkles className="h-4 w-4 text-amber-300 animate-pulse shrink-0" />
            <span>{liveToastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setLiveToastMessage(null)}
            className="text-[11px] text-zinc-400 hover:text-white ml-3 px-1.5 py-0.5 rounded hover:bg-white/10"
          >
            ✕
          </button>
        </div>
      )}

      {/* Confetti Celebration */}
      {showConfetti && <ConfettiCanvas onComplete={() => setShowConfetti(false)} />}

      {/* Top Banner & Status Cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Client (Employer) Status */}
        <div
          className={`rounded-xl border p-3.5 space-y-1.5 transition-all ${
            hasClientSigned
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
              {isTr ? "İşveren (Müşteri)" : "Client (Employer)"}
            </span>
            {hasClientSigned ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                <Check className="h-3 w-3 stroke-[3]" />
                {isTr ? "İmzalandı" : "Signed"}
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                <Clock className="h-3 w-3" />
                {isTr ? "İmza Bekleniyor" : "Awaiting Signature"}
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-[var(--color-text-primary)]">
            {packageDetails?.clientSignature?.signerName ||
              (isOwner ? currentUser.displayName : counterparty.displayName)}
          </p>
          {packageDetails?.clientSignature && (
            <p className="text-[10px] text-[var(--color-text-muted)]">
              {new Date(packageDetails.clientSignature.signedAt).toLocaleString(
                isTr ? "tr-TR" : "en-US",
                {
                  dateStyle: "short",
                  timeStyle: "short",
                }
              )}
            </p>
          )}
        </div>

        {/* Freelancer Status */}
        <div
          className={`rounded-xl border p-3.5 space-y-1.5 transition-all ${
            hasFreelancerSigned
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
              {isTr ? "Yüklenici (Serbest Çalışan)" : "Contractor (Freelancer)"}
            </span>
            {hasFreelancerSigned ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                <Check className="h-3 w-3 stroke-[3]" />
                {isTr ? "İmzalandı" : "Signed"}
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                <Clock className="h-3 w-3" />
                {isTr ? "İmza Bekleniyor" : "Awaiting Signature"}
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-[var(--color-text-primary)]">
            {packageDetails?.contractorSignature?.signerName ||
              (!isOwner ? currentUser.displayName : counterparty.displayName)}
          </p>
          {packageDetails?.contractorSignature && (
            <p className="text-[10px] text-[var(--color-text-muted)]">
              {new Date(packageDetails.contractorSignature.signedAt).toLocaleString(
                isTr ? "tr-TR" : "en-US",
                {
                  dateStyle: "short",
                  timeStyle: "short",
                }
              )}
            </p>
          )}
        </div>
      </div>

      {/* FULLY SIGNED CELEBRATORY BANNER & BACKUP DOWNLOAD PROMPT */}
      {isFullySigned ? (
        <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 via-teal-500/5 to-transparent p-5 space-y-4 shadow-lg shadow-emerald-500/10">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-emerald-300">
                {isTr
                  ? "🎉 Sözleşme Paketi Her İki Tarafça İmzalandı!"
                  : "🎉 Contract Package Bilaterally Executed!"}
              </h4>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {isTr
                  ? "Tüm seçili sözleşmeler ve ekler dijital olarak tanzim edilmiş, tarafların imzaları işlenmiş ve kriptografik SHA-256 mührüyle arşivlenmiştir."
                  : "All selected agreements have been digitally executed with verified signatures and SHA-256 cryptographic seal."}
              </p>
            </div>
          </div>

          {/* Offline Backup Advisory */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200/90 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>
                {isTr
                  ? "Önemli Hukuki Tavsiye (Çevrimdışı Yedek Alın):"
                  : "Legal Advisory (Download Backup):"}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-200/80">
              {isTr
                ? "Operis platformu sözleşmenin tarafı veya garantörü değildir. Olası bir hukuki ihtilafta veya mahkeme sürecinde kendi haklarınızı ispatlayabilmeniz için imzalı sözleşme nüshanızı (.pdf veya .md) hemen indirmenizi önemle tavsiye ederiz."
                : "Operis is not a party to this agreement. To protect your legal rights in any future dispute, we strongly advise downloading an offline signed copy (.pdf or .md) right now."}
            </p>
          </div>

          {/* Action Download Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                const url = `/api/work/${engagementId}/contract/pdf?lang=bilingual&download=true`;
                window.open(url, "_blank");
              }}
              className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 text-xs"
            >
              <FileCheck2 className="h-4 w-4" />
              <span>
                {isTr ? "Çift Dilli Vektörel PDF (.pdf)" : "Download Bilingual PDF (.pdf)"}
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-2 text-xs border-[var(--color-border-subtle)]"
            >
              <Printer className="h-4 w-4" />
              <span>{isTr ? "Yazdır / Önizle" : "Print / Preview"}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadMarkdown}
              className="gap-2 text-xs border-[var(--color-border-subtle)]"
            >
              <Download className="h-4 w-4" />
              <span>{isTr ? "Markdown İndir (.md)" : "Download Markdown (.md)"}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadBundle}
              className="gap-2 text-xs border-[var(--color-border-subtle)] text-indigo-300 hover:text-indigo-200"
            >
              <Download className="h-4 w-4 text-indigo-400" />
              <span>{isTr ? "Denetim Paketi (.json)" : "Audit Bundle (.json)"}</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="gap-2 text-xs text-[var(--color-text-muted)] hover:text-white"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span>
                {getCopyTextLabel(copied, isTr)}
              </span>
            </Button>

            {onViewFullText && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onViewFullText}
                className="text-xs text-indigo-400 hover:text-indigo-300 ml-auto"
              >
                {isTr ? "Tam Metni İncele →" : "View Full Text →"}
              </Button>
            )}
          </div>
        </div>
      ) : (
        /* PENDING SIGNATURE ACTION AREA */
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
              {getSigningHubTitle(hasCurrentUserSigned, isTr)}
            </h4>
            <p className="text-xs text-[var(--color-text-muted)]">
              {getSigningHubDescription(hasCurrentUserSigned, isTr)}
            </p>
          </div>

          {!hasCurrentUserSigned ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsSignModalOpen(true)}
              className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 shadow-md shadow-indigo-500/20 text-xs px-4 py-2"
            >
              <PenTool className="h-4 w-4" />
              <span>{isTr ? "İmzamı Ekle & Onayla" : "Add Signature & Approve"}</span>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsSignModalOpen(true)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                {isTr ? "İmzayı Güncelle" : "Update Signature"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={loadPackageData}
                className="text-xs text-zinc-400 hover:text-white gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                <span>{isTr ? "Yenile" : "Refresh"}</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Interactive Recommendation Checklist */}
      <div className="border-t border-[var(--color-border-subtle)] pt-4">
        <ContractRecommendationCard
          allContracts={allContracts}
          selectedContractIds={selectedContractIds}
          onToggleContract={handleToggleContract}
          isReadOnly={isFullySigned}
          locale={locale}
        />
      </div>

      {/* Signature Modal */}
      <SignaturePadModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        engagementId={engagementId}
        role={myRole}
        defaultSignerName={currentUser.displayName || (isOwner ? "İşveren" : "Yüklenici")}
        selectedContracts={selectedContractIds}
        expectedVersion={packageDetails?.version}
        locale={locale}
        onSignatureSuccess={() => {
          loadPackageData();
          if (typeof window !== "undefined" && "BroadcastChannel" in window) {
            try {
              const bc = new BroadcastChannel(`operis_contract_${engagementId}`);
              bc.postMessage({ type: "REFRESH_PACKAGE" });
              bc.close();
            } catch {
              // Ignore
            }
          }
        }}
      />
    </div>
  );
}
