"use client";

import { Bell } from "lucide-react";

export interface NotificationsSettingsTabProps {
  notifyListings: boolean;
  notifyOffers: boolean;
  emailDigest: string;
  locale: string;
  onNotifyListingsChange: (val: boolean) => void;
  onNotifyOffersChange: (val: boolean) => void;
  onEmailDigestChange: (val: string) => void;
}

export function NotificationsSettingsTab({
  notifyListings,
  notifyOffers,
  emailDigest,
  locale,
  onNotifyListingsChange,
  onNotifyOffersChange,
  onEmailDigestChange,
}: NotificationsSettingsTabProps) {
  const isTr = locale === "tr";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-500" />
          <span>{isTr ? "Bildirim Tercihleri" : "Notifications"}</span>
        </h2>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          {isTr
            ? "Yeni ilanlar, teklifler ve sözleşme durumları hakkında nasıl haberdar olmak istediğinizi belirleyin."
            : "Choose how and when you receive updates for listings, proposals, and milestones."}
        </p>
      </div>

      {/* Yeni İlan Bildirimleri */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <label className="text-xs font-bold text-[var(--color-text-primary)] block">
            {isTr ? "Takip Ettiğim Kategorilerde Yeni İlanlar" : "New Listings in Followed Categories"}
          </label>
          <p className="text-[11px] text-[var(--color-text-tertiary)]">
            {isTr
              ? "İlgilendiğiniz sektörlerde yeni bir proje açıldığında anında haberdar olun."
              : "Get notified when new projects match your subscribed categories."}
          </p>
        </div>
        <input
          type="checkbox"
          checked={notifyListings}
          onChange={(e) => onNotifyListingsChange(e.target.checked)}
          className="h-4 w-4 rounded accent-blue-500 cursor-pointer"
        />
      </div>

      {/* Teklif ve Sözleşme Bildirimleri */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <label className="text-xs font-bold text-[var(--color-text-primary)] block">
            {isTr ? "Teklif ve Revize Bildirimleri" : "Proposal & Milestone Updates"}
          </label>
          <p className="text-[11px] text-[var(--color-text-tertiary)]">
            {isTr
              ? "İlanlarınıza gelen yeni teklifler ve mevcut tekliflerinizin durum değişiklikleri."
              : "Alerts when you receive a proposal or an offer is accepted/revised."}
          </p>
        </div>
        <input
          type="checkbox"
          checked={notifyOffers}
          onChange={(e) => onNotifyOffersChange(e.target.checked)}
          className="h-4 w-4 rounded accent-blue-500 cursor-pointer"
        />
      </div>

      {/* E-posta Özet Sıklığı */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[var(--color-text-primary)] block">
            {isTr ? "E-posta Bildirim Sıklığı" : "Email Frequency"}
          </label>
          <select
            value={emailDigest}
            onChange={(e) => onEmailDigestChange(e.target.value)}
            className="rounded-xl bg-surface border border-[var(--color-border-subtle)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="instant">{isTr ? "Anında Gönder" : "Instant"}</option>
            <option value="daily">{isTr ? "Günde 1 Toplu Özet" : "Daily Digest"}</option>
            <option value="critical">{isTr ? "Yalnızca Kritik Güvenlik" : "Critical Only"}</option>
          </select>
        </div>
      </div>
    </div>
  );
}
