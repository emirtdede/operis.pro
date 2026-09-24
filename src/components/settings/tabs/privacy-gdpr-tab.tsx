"use client";

import Link from "next/link";
import {
  Shield,
  Download,
  ExternalLink,
  MapPin,
  Phone,
  Search,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { getExportDataButtonLabel } from "../types";

export interface PrivacyGdprTabProps {
  showLocation: boolean;
  revealPhoneAfterMatch: boolean;
  allowSearchIndex: boolean;
  exportLoading: boolean;
  exportJobId: string | null;
  exportStatus: string | null;
  exportDownloadUrl?: string | null;
  locale: string;
  onShowLocationChange: (val: boolean) => void;
  onRevealPhoneChange: (val: boolean) => void;
  onAllowSearchIndexChange: (val: boolean) => void;
  onTriggerExport: () => void;
  onCloseAccountClick: () => void;
}

export function PrivacyGdprTab({
  showLocation,
  revealPhoneAfterMatch,
  allowSearchIndex,
  exportLoading,
  exportJobId,
  exportStatus,
  exportDownloadUrl,
  locale,
  onShowLocationChange,
  onRevealPhoneChange,
  onAllowSearchIndexChange,
  onTriggerExport,
  onCloseAccountClick,
}: PrivacyGdprTabProps) {
  const isTr = locale === "tr";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          <span>{isTr ? "Gizlilik, KVKK ve Veri Hakları" : "Privacy, KVKK & Data Rights"}</span>
        </h2>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          {isTr
            ? "Kişisel verilerinizin platformdaki görünürlüğünü, arama motoru indekslemesini ve KVKK haklarınızı yönetin."
            : "Manage your visibility, search engine index permission, data export archive, and account closure."}
        </p>
      </div>

      {/* 1. Görünürlük Tercihleri */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-[var(--color-text-primary)] block">
          {isTr ? "Profil Gizlilik Seviyeleri" : "Profile Privacy Levels"}
        </label>

        <div className="space-y-2">
          {/* Konum Görünürlüğü */}
          <div className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-cyan-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-[var(--color-text-primary)] block">
                  {isTr ? "Konum Bilgisini Profilde Göster" : "Show Location on Profile"}
                </span>
                <p className="text-[11px] text-[var(--color-text-tertiary)]">
                  {isTr
                    ? "Şehir ve ülke bilginiz genel profilinizde yer alır."
                    : "Your city and country are displayed on your public developer card."}
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={showLocation}
              onChange={(e) => onShowLocationChange(e.target.checked)}
              className="h-4 w-4 rounded accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Telefon Gizliliği */}
          <div className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-purple-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-[var(--color-text-primary)] block">
                  {isTr ? "Telefon Numarasını Yalnızca Eşleşmede Göster" : "Reveal Phone Only After Match"}
                </span>
                <p className="text-[11px] text-[var(--color-text-tertiary)]">
                  {isTr
                    ? "Telefon numaranız profilinizde gizli kalır; yalnızca iki tarafın karşılıklı onayladığı projelerde görünür."
                    : "Your phone remains masked until a mutual project proposal is signed."}
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={revealPhoneAfterMatch}
              onChange={(e) => onRevealPhoneChange(e.target.checked)}
              className="h-4 w-4 rounded accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Arama Motoru İndeksleme */}
          <div className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30">
            <div className="flex items-center gap-3">
              <Search className="h-4 w-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-[var(--color-text-primary)] block">
                  {isTr ? "Arama Motorlarında İndekslenme İzni (SEO)" : "Search Engine Indexing"}
                </span>
                <p className="text-[11px] text-[var(--color-text-tertiary)]">
                  {isTr
                    ? "Profilinizin Google, Yandex ve Bing gibi arama motorlarında bulunmasına izin verin."
                    : "Allow search engines to index your public developer profile."}
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={allowSearchIndex}
              onChange={(e) => onAllowSearchIndexChange(e.target.checked)}
              className="h-4 w-4 rounded accent-blue-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 2. KVKK Verilerini İndirme */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-3">
        <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
          <Download className="h-4 w-4 text-blue-400" />
          <span>{isTr ? "Verilerinizin Kopyasını İndirin (KVKK / GDPR)" : "Download Data Archive"}</span>
        </label>

        <div className="p-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-[var(--color-text-primary)] block">
                {isTr ? "Kişisel Veri Portabilitesi (JSON Arşivi)" : "Personal Data Portability"}
              </span>
              <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
                {isTr
                  ? "Profil bilgileriniz, ilanlarınız, teklifleriniz ve mesaj geçmişiniz tek bir şifreli arşivde hazırlanır."
                  : "Export your complete account history, listings, and bids into an encrypted archive."}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onTriggerExport}
              disabled={exportLoading}
              className="cursor-pointer gap-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{getExportDataButtonLabel(exportLoading, isTr)}</span>
            </Button>
          </div>

          {exportJobId && (
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 space-y-2">
              <div className="flex items-center justify-between">
                <span>
                  {isTr
                    ? `Veri İşi: #${exportJobId.slice(0, 8)} — Durum: ${
                        exportStatus === "READY"
                          ? "Hazır"
                          : exportStatus === "FAILED"
                          ? "Başarısız"
                          : "Hazırlanıyor..."
                      }`
                    : `Job: #${exportJobId.slice(0, 8)} — Status: ${
                        exportStatus === "READY"
                          ? "Ready"
                          : exportStatus === "FAILED"
                          ? "Failed"
                          : "Processing..."
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
            </div>
          )}
        </div>
      </div>

      {/* 3. Yasal Belgeler & Aydınlatma Metinleri */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-2">
        <label className="text-xs font-bold text-[var(--color-text-primary)] block">
          {isTr ? "Yasal Politika ve Belgeler" : "Legal Terms & Policies"}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <Link
            href={`/${locale}/legal/terms`}
            target="_blank"
            className="p-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30 hover:border-blue-500 flex items-center justify-between transition-colors"
          >
            <span>{isTr ? "Kullanım Koşulları ve Sözleşmeler" : "Terms of Service"}</span>
            <ExternalLink className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
          </Link>
          <Link
            href={`/${locale}/legal/privacy`}
            target="_blank"
            className="p-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30 hover:border-blue-500 flex items-center justify-between transition-colors"
          >
            <span>{isTr ? "KVKK & Gizlilik Aydınlatma Metni" : "Privacy Policy"}</span>
            <ExternalLink className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
          </Link>
        </div>
      </div>

      {/* 4. Tehlike Bölgesi (Danger Zone) */}
      <div className="pt-6 border-t border-red-500/20 space-y-3">
        <label className="text-xs font-bold text-red-400 flex items-center gap-1.5">
          <AlertTriangle className="h-4 w-4" />
          <span>{isTr ? "Tehlike Bölgesi" : "Danger Zone"}</span>
        </label>
        <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-red-400 block">
              {isTr ? "Hesabı Dondur veya Kalıcı Olarak Kapat" : "Deactivate or Delete Account"}
            </span>
            <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
              {isTr
                ? "Hesabınızı dondurabilir veya tüm verilerinizi geri alınamaz şekilde kalıcı olarak silebilirsiniz."
                : "Temporarily freeze your profile or permanently erase all associated personal data."}
            </p>
          </div>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onCloseAccountClick}
            className="cursor-pointer gap-1.5 text-xs shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{isTr ? "Hesabı Yönet / Kapat" : "Delete Account"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
