"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog } from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import {
  Scale,
  ShieldCheck,
  Printer,
  Copy,
  Check,
  FileText,
  FileCode,
  FolderArchive,
  AlertCircle,
  Loader2,
  ExternalLink,
  Hash,
} from "lucide-react";
import type { LegalDossierManifest, EvidenceFileItem } from "@/src/modules/contracts/dossier-types";

export interface EvidenceDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  engagementId: string;
  locale?: string;
}

function getCopyButtonLabel(isCopied: boolean, isTr: boolean): string {
  if (isCopied) {
    return isTr ? "Kopyalandı" : "Copied";
  }
  return isTr ? "Kopyala" : "Copy";
}

function renderDocIcon(mimeType: string, path: string) {
  if (mimeType === "application/json") {
    return <FileCode className="h-3.5 w-3.5 text-purple-400 shrink-0" />;
  }
  if (path.endsWith(".html")) {
    return <ExternalLink className="h-3.5 w-3.5 text-blue-400 shrink-0" />;
  }
  return <FileText className="h-3.5 w-3.5 text-cyan-400 shrink-0" />;
}

function getCopyManifestLabel(copied: boolean, isTr: boolean): string {
  if (copied) {
    return isTr ? "Kopyalandı" : "Copied";
  }
  return isTr ? "Dizini Kopyala" : "Copy Manifest";
}

function getDownloadZipLabel(isDownloading: boolean, isTr: boolean): string {
  if (isDownloading) {
    return isTr ? "İndiriliyor..." : "Downloading...";
  }
  return isTr ? "Tek Tıkla Delil Paketini İndir (.zip)" : "Download Dossier (.zip)";
}

export function EvidenceDossierModal({
  isOpen,
  onClose,
  engagementId,
  locale = "tr",
}: EvidenceDossierModalProps) {
  const isTr = locale === "tr";
  const [manifest, setManifest] = useState<LegalDossierManifest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedManifest, setCopiedManifest] = useState(false);

  const fetchDossierData = useCallback(async () => {
    if (!engagementId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/work/${engagementId}/dossier?format=json&lang=${locale}`);
      if (!res.ok) {
        throw new Error(
          isTr
            ? "Adli delil dosyası oluşturulamadı veya erişim yetkiniz yok."
            : "Failed to generate legal evidence dossier."
        );
      }
      const data = await res.json();
      if (data.manifest) {
        setManifest(data.manifest);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading dossier");
    } finally {
      setIsLoading(false);
    }
  }, [engagementId, locale, isTr]);

  useEffect(() => {
    if (isOpen) {
      fetchDossierData();
    }
  }, [isOpen, fetchDossierData]);

  const handleDownloadZip = () => {
    setIsDownloadingZip(true);
    try {
      const downloadUrl = `/api/work/${engagementId}/dossier?format=zip&lang=${locale}`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `Operis_Adli_Delil_Dosyasi_${manifest?.dossierRef || "HMK193"}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setTimeout(() => setIsDownloadingZip(false), 1500);
    }
  };

  const handlePrintReport = async () => {
    try {
      const res = await fetch(`/api/work/${engagementId}/dossier?format=html&lang=${locale}`);
      if (!res.ok) throw new Error("Failed to load report HTML");
      const html = await res.text();

      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const blobUrl = URL.createObjectURL(blob);
      const printWindow = window.open(blobUrl, "_blank");
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
          URL.revokeObjectURL(blobUrl);
        };
      } else {
        URL.revokeObjectURL(blobUrl);
        window.print();
      }
    } catch {
      window.print();
    }
  };

  const handleCopyMasterHash = async () => {
    if (!manifest?.masterDossierSha256) return;
    await navigator.clipboard.writeText(manifest.masterDossierSha256);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleCopyManifestSummary = async () => {
    if (!manifest) return;
    const summary = `OPERIS ADLİ DELİL DOSYASI (HMK m. 193)
Referans: ${manifest.dossierRef}
Master SHA-256 Kök Parmak İzi: ${manifest.masterDossierSha256}
İş Sahibi: ${manifest.client.displayName} (${manifest.client.email})
Yüklenici: ${manifest.contractor.displayName} (${manifest.contractor.email})
Toplam Delil Sayısı: ${manifest.totalDocumentsCount}
Doğrulama Komutu: sha256sum -c checksums.sha256`;

    await navigator.clipboard.writeText(summary);
    setCopiedManifest(true);
    setTimeout(() => setCopiedManifest(false), 2000);
  };

  const getCategoryBadge = (category: EvidenceFileItem["category"]) => {
    switch (category) {
      case "CONTRACT_AND_ANNEXES":
        return (
          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-semibold">
            Sözleşme
          </span>
        );
      case "ACCEPTANCE_TESTS_DOD":
        return (
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
            Kabul & BDD
          </span>
        );
      case "SCOPE_CHANGE_REVISIONS":
        return (
          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold">
            Zeyilname
          </span>
        );
      case "HANDOVER_PROTOCOL":
        return (
          <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-semibold">
            Teslimat
          </span>
        );
      case "MILESTONES_LEDGER":
        return (
          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-semibold">
            Hakediş
          </span>
        );
      case "AUDIT_TRAIL_LOGS":
        return (
          <span className="px-2 py-0.5 rounded bg-slate-500/10 text-slate-300 border border-slate-500/20 text-[10px] font-semibold">
            Adli Log
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        isTr
          ? "HMK m. 193 Resmi Delil Paketi & Arabulucu Dosyası"
          : "HMK Art. 193 Legal Evidence & Mediation Dossier"
      }
      description={
        isTr
          ? "6100 sayılı HMK m. 193 (Delil Sözleşmesi) ve 6325 sayılı Arabuluculuk Kanunu uyarınca mahkemelerin doğrudan kabul edeceği resmi adli delil klasörü."
          : "Statutory legal evidence dossier conforming to HMK Art. 193 with cryptographic master root seal and audit exhibits."
      }
      className="max-w-4xl max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-6 pt-2">
        {/* Loading State */}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-[var(--color-text-secondary)]">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-xs">
              {isTr
                ? "Sözleşmeler, teslimat tutanakları ve adli denetim logları derleniyor..."
                : "Compiling contracts, delivery protocols, and cryptographic audit exhibits..."}
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-start gap-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{isTr ? "Hata Oluştu" : "Error Occurred"}</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {manifest && !isLoading && (
          <>
            {/* Master Dossier Integrity Banner */}
            <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/20 via-[var(--color-surface-base)] to-cyan-950/20 p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] pb-3">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-blue-400 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    {isTr
                      ? "HMK m. 193 Münhasır Delil Manifestosu"
                      : "HMK Art. 193 Evidentiary Manifest"}
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-[var(--color-text-primary)]">
                  {manifest.dossierRef}
                </span>
              </div>

              {/* Master Root Hash */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>
                      {isTr ? "Doğrulanmış Dijital Mühür Kodu:" : "Master Cryptographic Digest:"}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyMasterHash}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedHash ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{getCopyButtonLabel(copiedHash, isTr)}</span>
                  </button>
                </div>
                <code className="block p-2.5 rounded-lg bg-black/40 border border-emerald-500/25 font-mono text-[11px] text-emerald-300 break-all select-all">
                  {manifest.masterDossierSha256}
                </code>
              </div>

              {/* Parties summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                <div className="p-2.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] space-y-0.5">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-text-tertiary)]">
                    {isTr ? "İş Sahibi (Müşteri)" : "Client"}
                  </div>
                  <div className="font-semibold text-[var(--color-text-primary)]">
                    {manifest.client.displayName}
                  </div>
                  <div className="text-[11px] text-[var(--color-text-secondary)] truncate">
                    {manifest.client.email}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] space-y-0.5">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-text-tertiary)]">
                    {isTr ? "Yüklenici (Geliştirici)" : "Contractor"}
                  </div>
                  <div className="font-semibold text-[var(--color-text-primary)]">
                    {manifest.contractor.displayName}
                  </div>
                  <div className="text-[11px] text-[var(--color-text-secondary)] truncate">
                    {manifest.contractor.email}
                  </div>
                </div>
              </div>
            </div>

            {/* Evidence Exhibits Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-bold text-[var(--color-text-primary)]">
                    {isTr ? "Paket İçeriğindeki Delil Belgeleri" : "Exhibits in Evidence Dossier"}
                  </span>
                </div>
                <span className="text-xs text-[var(--color-text-secondary)] font-mono">
                  {manifest.totalDocumentsCount} {isTr ? "resmi evrak" : "exhibits"}
                </span>
              </div>

              <div className="border border-[var(--color-border-subtle)] rounded-xl overflow-hidden bg-[var(--color-surface)]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[var(--color-surface-hover)] border-b border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] font-semibold">
                      <th className="p-3 w-12 text-center">#</th>
                      <th className="p-3">
                        {isTr ? "Belge Başlığı & Dosya Yolu" : "Exhibit & Path"}
                      </th>
                      <th className="p-3 w-28">{isTr ? "Kategori" : "Category"}</th>
                      <th className="p-3 w-40">{isTr ? "Yasal Dayanak" : "Statutory Basis"}</th>
                      <th className="p-3 w-32 font-mono text-[11px]">
                        {isTr ? "SHA-256 Özeti" : "SHA-256"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-subtle)]">
                    {manifest.documents.map((doc, idx) => (
                      <tr
                        key={doc.path}
                        className="hover:bg-[var(--color-surface-hover)]/40 transition-colors"
                      >
                        <td className="p-3 text-center font-bold text-[var(--color-text-tertiary)]">
                          {idx + 1}
                        </td>
                        <td className="p-3 space-y-0.5">
                          <div className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                            {renderDocIcon(doc.mimeType, doc.path)}
                            <span>{doc.title}</span>
                          </div>
                          <div className="font-mono text-[10px] text-[var(--color-text-tertiary)]">
                            {doc.path}
                          </div>
                        </td>
                        <td className="p-3">{getCategoryBadge(doc.category)}</td>
                        <td className="p-3 text-[11px] text-[var(--color-text-secondary)]">
                          {isTr ? doc.legalGroundTr : doc.legalGroundEn}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-emerald-400/90 truncate">
                          {doc.sha256.slice(0, 10)}...{doc.sha256.slice(-4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Forensic CLI Verification Notice */}
            <div className="p-3 rounded-xl border border-slate-700/50 bg-slate-900/40 text-xs text-[var(--color-text-secondary)] space-y-1.5">
              <div className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5 text-xs">
                <Hash className="h-3.5 w-3.5 text-blue-400" />
                <span>
                  {isTr
                    ? "Bilirkişi ve Mahkeme Heyeti Doğrulama Komutu:"
                    : "Forensic Terminal Verification Command:"}
                </span>
              </div>
              <code className="block p-2 rounded bg-black/60 font-mono text-[11px] text-cyan-300 select-all border border-cyan-500/20">
                sha256sum -c checksums.sha256
              </code>
              <p className="text-[10px] text-[var(--color-text-tertiary)] leading-relaxed">
                {isTr
                  ? "ZIP paketi içerisindeki tüm dosyaların hash değerleri otomatik eşleştirilir; 1 bitlik dahi değişiklik varsa sistem hata verir."
                  : "All exhibit hashes inside the archive are validated deterministically against tampering."}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyManifestSummary}
                  className="gap-1.5 text-xs"
                >
                  {copiedManifest ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>{getCopyManifestLabel(copiedManifest, isTr)}</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePrintReport}
                  className="gap-1.5 text-xs text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>{isTr ? "Raporu Yazdır / PDF" : "Print Court Report"}</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-xs"
                >
                  {isTr ? "Kapat" : "Close"}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleDownloadZip}
                  disabled={isDownloadingZip}
                  className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-md shadow-blue-600/20 text-xs"
                >
                  <FolderArchive className="h-4 w-4" />
                  <span>{getDownloadZipLabel(isDownloadingZip, isTr)}</span>
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
