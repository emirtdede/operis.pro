"use client";

import { useState } from "react";
import {
  Bell,
  Zap,
  FileCheck,
  MessageSquare,
  TrendingUp,
  Sparkles,
  Loader2,
  Volume2,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";

export interface NotificationsSettingsTabProps {
  initialNotifyListings: boolean;
  initialNotifyOffers: boolean;
  initialEmailDigest: string;
  marketingConsent: boolean;
  locale: string;
  saving: boolean;
  onSaveNotifications: (fields: Record<string, unknown>) => Promise<void>;
  onMarketingConsentChange: (consent: boolean) => Promise<void>;
}

export function NotificationsSettingsTab({
  initialNotifyListings,
  initialNotifyOffers,
  initialEmailDigest,
  marketingConsent,
  locale,
  saving,
  onSaveNotifications,
  onMarketingConsentChange,
}: NotificationsSettingsTabProps) {
  const isTr = locale === "tr";

  const [notifyListings, setNotifyListings] = useState(initialNotifyListings);
  const [notifyOffers, setNotifyOffers] = useState(initialNotifyOffers);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [notifyMilestones, setNotifyMilestones] = useState(true);
  const [emailDigest, setEmailDigest] = useState(initialEmailDigest || "daily");
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleSave = async () => {
    await onSaveNotifications({
      notifyListings,
      notifyOffers,
      notifyMessages,
      notifyMilestones,
      emailDigest,
      soundEnabled,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-500" />
          <span>{isTr ? "Bildirim Tercihleri Matrisi" : "Notification Matrix"}</span>
        </h2>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          {isTr
            ? "Hangi olaylarda ve hangi sıklıkla e-posta veya platform içi bildirim alacağınızı yapılandırın."
            : "Configure when and how often you receive email and real-time in-app notifications."}
        </p>
      </div>

      {/* 1. İlan & Radar Eşleşmeleri */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-amber-400" />
          <span>{isTr ? "İlan ve Radar Eşleşmeleri" : "Listings & Radar Matching"}</span>
        </label>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30">
            <div>
              <span className="text-xs font-bold text-[var(--color-text-primary)] block">
                {isTr ? "Yeni Eşleşen İlanlar" : "New Matching Listings"}
              </span>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                {isTr
                  ? "Takip ettiğiniz kategorilerde ve radarınızla uyumlu yeni yazılım ilanları açıldığında bildirilir."
                  : "Notified when jobs matching your stack and followed categories are published."}
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifyListings}
              onChange={(e) => setNotifyListings(e.target.checked)}
              className="h-4 w-4 rounded accent-blue-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30">
            <div>
              <span className="text-xs font-bold text-[var(--color-text-primary)] block">
                {isTr ? "E-posta İlan Özeti Sıklığı" : "Listing Digest Frequency"}
              </span>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                {isTr
                  ? "İlan bildirimlerinin toplu bülten olarak gönderilme aralığı."
                  : "Select how often you wish to receive job digest emails."}
              </p>
            </div>
            <select
              value={emailDigest}
              onChange={(e) => setEmailDigest(e.target.value)}
              className="rounded-xl bg-surface border border-[var(--color-border-subtle)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="realtime">{isTr ? "Anında (Gerçek Zamanlı)" : "Instant (Realtime)"}</option>
              <option value="daily">{isTr ? "Günlük Özet" : "Daily Digest"}</option>
              <option value="weekly">{isTr ? "Haftalık Özet" : "Weekly Digest"}</option>
              <option value="never">{isTr ? "E-posta Gönderme" : "Never"}</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Teklifler & Sözleşmeler */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-3">
        <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
          <FileCheck className="h-4 w-4 text-emerald-400" />
          <span>{isTr ? "Teklifler ve Sözleşme Süreci" : "Offers & Contract Lifecycle"}</span>
        </label>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30">
            <div>
              <span className="text-xs font-bold text-[var(--color-text-primary)] block">
                {isTr ? "Gelen Teklifler ve Karşı Teklifler" : "Incoming & Counter Proposals"}
              </span>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                {isTr
                  ? "İlanlarınıza teklif geldiğinde veya gönderdiğiniz teklif güncellendiğinde anında bildirim gönderilir."
                  : "Immediate notice when proposals are placed, countered, or accepted."}
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifyOffers}
              onChange={(e) => setNotifyOffers(e.target.checked)}
              className="h-4 w-4 rounded accent-blue-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30">
            <div>
              <span className="text-xs font-bold text-[var(--color-text-primary)] block">
                {isTr ? "Kilometre Taşı ve Ödeme Onayları" : "Milestones & Handover Releases"}
              </span>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                {isTr
                  ? "Kod teslimatı incelendiğinde veya hakediş transferi onaylandığında kritik uyarı gönderilir."
                  : "Critical alerts when code handovers are verified or payout funds are released."}
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifyMilestones}
              onChange={(e) => setNotifyMilestones(e.target.checked)}
              className="h-4 w-4 rounded accent-blue-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 3. Mesajlar & Görüşmeler */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-3">
        <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
          <MessageSquare className="h-4 w-4 text-cyan-400" />
          <span>{isTr ? "Doğrudan Mesajlar ve Görüşmeler" : "Direct Chats & Handovers"}</span>
        </label>

        <div className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30">
          <div>
            <span className="text-xs font-bold text-[var(--color-text-primary)] block">
              {isTr ? "Sohbet Mesajı Bildirimleri" : "Direct Message Alerts"}
            </span>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">
              {isTr
                ? "Müşteri veya yazılımcı size mesaj gönderdiğinde anında uyarı verilir."
                : "Notify immediately when an engagement partner sends you a message."}
            </p>
          </div>
          <input
            type="checkbox"
            checked={notifyMessages}
            onChange={(e) => setNotifyMessages(e.target.checked)}
            className="h-4 w-4 rounded accent-blue-500 cursor-pointer"
          />
        </div>
      </div>

      {/* 4. Piyasa Bülteni & Ticari İletiler */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-3">
        <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-purple-400" />
          <span>{isTr ? "Piyasa Bülteni ve Analizler" : "Market Insights & Commercial Notice"}</span>
        </label>

        <div className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30">
          <div>
            <span className="text-xs font-bold text-[var(--color-text-primary)] block">
              {isTr ? "Haftalık Yazılım Piyasası & Fiyat Endeksi Bülteni" : "Weekly Software Index & Rates Digest"}
            </span>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">
              {isTr
                ? "Operis ekosistemindeki yazılım fiyat endeksi, en çok aranan teknolojiler ve piyasa analizleri."
                : "Weekly technology salary/rate benchmarks and freelance software trends."}
            </p>
          </div>
          <input
            type="checkbox"
            checked={marketingConsent}
            onChange={(e) => onMarketingConsentChange(e.target.checked)}
            className="h-4 w-4 rounded accent-blue-500 cursor-pointer"
          />
        </div>
      </div>

      {/* 5. Bildirim Sesleri */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-3">
        <div className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30">
          <div className="flex items-center gap-3">
            <Volume2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-[var(--color-text-primary)] block">
                {isTr ? "Platform İçi Bildirim Sesleri" : "In-App Notification Sounds"}
              </span>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                {isTr
                  ? "Yeni teklif veya mesaj geldiğinde hafif bir sesli uyarı çalınır."
                  : "Play subtle audio cues when new proposals or chats arrive."}
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={(e) => setSoundEnabled(e.target.checked)}
            className="h-4 w-4 rounded accent-blue-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Kaydet Butonu */}
      <div className="pt-6 border-t border-[var(--color-border-subtle)] flex items-center justify-end">
        <Button onClick={handleSave} disabled={saving} className="cursor-pointer gap-2">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{isTr ? "Kaydediliyor..." : "Saving..."}</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>{isTr ? "Bildirim Tercihlerini Kaydet" : "Save Notification Preferences"}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
