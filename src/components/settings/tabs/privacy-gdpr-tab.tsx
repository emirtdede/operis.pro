"use client";

import Link from "next/link";
import {
  Shield,
  Download,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { getExportDataButtonLabel } from "../types";

export interface PrivacyGdprTabProps {
  exportLoading: boolean;
  exportJobId: string | null;
  exportStatus: string | null;
  exportDownloadUrl?: string | null;
  locale: string;
  onTriggerExport: () => void;
}

export function PrivacyGdprTab({
  exportLoading,
  exportJobId,
  exportStatus,
  exportDownloadUrl,
  locale,
  onTriggerExport,
}: PrivacyGdprTabProps) {
  const isTr = locale === "tr";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          <span>{isTr ? "Veri Gizliliği ve Haklarınız" : "Data privacy"}</span>
        </h2>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          {isTr
            ? "KVKK ve GDPR kapsamındaki veri haklarınızı yönetin ve verilerinizin bir kopyasını indirin."
            : "Manage your GDPR/KVKK rights and download an archive of your personal data."}
        </p>
      </div>

      {/* Verilerimi İndir */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-bold text-[var(--color-text-primary)] block">
              {isTr ? "Verilerinizin Kopyasını İndirin (Export Data)" : "Download Your Data Archive"}
            </label>
            <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
              {isTr
                ? "Profil bilgileriniz, yayınladığınız ilanlar, verdiğiniz teklifler ve geçmişiniz tek bir şifreli JSON dosyasında hazırlanır."
                : "Receive an encrypted JSON export of your listings, bids, messages, and profile."}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onTriggerExport}
            disabled={exportLoading}
          >
            <Download className="h-3.5 w-3.5" />
            <span>{getExportDataButtonLabel(exportLoading, isTr)}</span>
          </Button>
        </div>
        {exportJobId && (
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 mt-2 space-y-2">
            <div className="flex items-center justify-between">
              <span>
                {isTr
                  ? `Veri İşi: #${exportJobId.slice(0, 8)} — Durum: ${
                      exportStatus === "READY"
                        ? "Hazır"
                        : exportStatus === "FAILED"
                        ? "Başarısız"
                        : "Hazırlanıyor"
                    }`
                  : `Job: #${exportJobId.slice(0, 8)} — Status: ${
                      exportStatus === "READY"
                        ? "Ready"
                        : exportStatus === "FAILED"
                        ? "Failed"
                        : "Processing"
                    }`}
              </span>
              {exportDownloadUrl && exportStatus === "READY" && (
                <a
                  href={exportDownloadUrl}
                  download={`operis-data-export-${exportJobId.slice(0, 8)}.json`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-xs shadow-xs transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{isTr ? "İndir" : "Download"}</span>
                </a>
              )}
            </div>
            {exportStatus === "PROCESSING" && (
              <p className="text-[11px] text-blue-300/80">
                {isTr
                  ? "Arşiviniz şifreleniyor ve hazırlanıyor. Bu pencereyi açık tutabilir veya daha sonra tekrar kontrol edebilirsiniz."
                  : "Your archive is being prepared and encrypted. You can keep this tab open or check back later."}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Yasal Belgeler Bağlantısı */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-2">
        <label className="text-xs font-bold text-[var(--color-text-primary)] block">
          {isTr ? "KVKK ve Gizlilik Politikası" : "Legal & Privacy Terms"}
        </label>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            href={isTr ? "/tr/yasal/gizlilik-ve-kvkk" : "/en/legal/privacy"}
            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline"
            target="_blank"
          >
            <span>{isTr ? "Gizlilik ve KVKK Politikası" : "Privacy Policy"}</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
          <Link
            href={isTr ? "/tr/yasal/kullanim-kosullari" : "/en/legal/terms"}
            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline"
            target="_blank"
          >
            <span>{isTr ? "Kullanım Koşulları" : "Terms of Use"}</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
