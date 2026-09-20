"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle } from "lucide-react";
import {
  SettingsCategory,
  SettingsViewProps,
  getMarketingConsentFeedback,
  getSettingsCategories,
} from "./types";
import { AccountSettingsTab } from "./tabs/account-settings-tab";
import { SecuritySettingsTab } from "./tabs/security-settings-tab";
import { VisibilitySettingsTab } from "./tabs/visibility-settings-tab";
import { PrivacyGdprTab } from "./tabs/privacy-gdpr-tab";
import { AdvertisingSettingsTab } from "./tabs/advertising-settings-tab";
import { NotificationsSettingsTab } from "./tabs/notifications-settings-tab";

export * from "./types";

export function SettingsView({
  initialProfile,
  twoFactorEnabled,
  locale,
}: SettingsViewProps) {
  const isTr = locale === "tr";
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialCat = (searchParams.get("tab") as SettingsCategory) || "account";
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>(initialCat);

  // Profile preferences state
  const [prefLocale, setPrefLocale] = useState(initialProfile.locale || "tr");
  const [theme, setTheme] = useState(initialProfile.theme || "dark");
  const [timeZone, setTimeZone] = useState(initialProfile.timeZone || "Europe/Istanbul");
  const [contactChannel, setContactChannel] = useState(
    initialProfile.preferredContactChannel || "any"
  );

  // Visibility state
  const [showLocation, setShowLocation] = useState(initialProfile.showLocation ?? true);
  const [revealPhoneAfterMatch, setRevealPhoneAfterMatch] = useState(
    initialProfile.revealPhoneAfterMatch ?? false
  );
  const [availabilityStatus, setAvailabilityStatus] = useState<"AVAILABLE_NOW" | "PARTIALLY_AVAILABLE" | "BUSY">(
    initialProfile.availabilityStatus || (initialProfile.isAvailableForHire ? "AVAILABLE_NOW" : "BUSY")
  );
  const [availabilityHoursPerWeek, setAvailabilityHoursPerWeek] = useState<number>(
    initialProfile.availabilityHoursPerWeek ?? 40
  );
  const [availableFromDate, setAvailableFromDate] = useState<string>(
    initialProfile.availableFromDate || ""
  );
  const [availabilityNotice, setAvailabilityNotice] = useState<string>(
    initialProfile.availabilityNotice || ""
  );
  const [allowSearchIndex, setAllowSearchIndex] = useState(true);

  // Marketing consent state
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [personalizedAds, setPersonalizedAds] = useState(true);
  const [loadingConsent, setLoadingConsent] = useState(true);

  // Notification state
  const [notifyListings, setNotifyListings] = useState(true);
  const [notifyOffers, setNotifyOffers] = useState(true);
  const [emailDigest, setEmailDigest] = useState("daily");

  // Security password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Data export state
  const [exportLoading, setExportLoading] = useState(false);
  const [exportJobId, setExportJobId] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  // Status feedback
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Load initial marketing consent
  useEffect(() => {
    fetch("/api/profile/marketing-consent")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.consent) {
          setMarketingConsent(Boolean(data.consent.hasConsent));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingConsent(false));
  }, []);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  const handleSaveProfileField = async (fields: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-locale": locale },
        body: JSON.stringify(fields),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Save failed");
      }
      showFeedback("success", isTr ? "Ayarlarınız kaydedildi." : "Settings updated successfully.");
    } catch (err: unknown) {
      showFeedback("error", err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  const handleMarketingConsentChange = async (consent: boolean) => {
    setMarketingConsent(consent);
    try {
      const res = await fetch("/api/profile/marketing-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-locale": locale },
        body: JSON.stringify({ consent }),
      });
      if (res.ok) {
        showFeedback("success", getMarketingConsentFeedback(consent, isTr));
      }
    } catch {
      showFeedback("error", isTr ? "Hata oluştu" : "Failed to update consent");
    }
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showFeedback("error", isTr ? "Yeni şifreler uyuşmuyor." : "Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      showFeedback("error", isTr ? "Şifre en az 8 karakter olmalıdır." : "Password must be at least 8 chars.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Password change failed");
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showFeedback("success", isTr ? "Şifreniz başarıyla değiştirildi." : "Password updated successfully.");
    } catch (err: unknown) {
      showFeedback("error", err instanceof Error ? err.message : "Password error");
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerExport = async () => {
    setExportLoading(true);
    try {
      const res = await fetch("/api/account/export", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Export failed");
      setExportJobId(data.jobId);
      setExportStatus("PROCESSING");
      showFeedback(
        "success",
        isTr
          ? "Veri aktarım talebiniz oluşturuldu. Hazır olduğunda dosyanız indirilebilir."
          : "Data export initiated. Your file will be available shortly."
      );
    } catch (err: unknown) {
      showFeedback("error", err instanceof Error ? err.message : "Export error");
    } finally {
      setExportLoading(false);
    }
  };

  const categories = getSettingsCategories(isTr);

  return (
    <div className="space-y-6">
      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center gap-3 p-4 rounded-2xl border text-xs font-semibold shadow-xs animate-in fade-in-0 duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main 2-Column Settings Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT SIDEBAR NAVIGATION */}
        <nav
          aria-label={isTr ? "Ayarlar Kategorileri" : "Settings Categories"}
          className="lg:col-span-4 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-xl p-3 shadow-xs space-y-1 sticky top-24"
        >
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.id;
            const itemClasses = isSelected
              ? "bg-blue-600 text-white shadow-xs"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]";
            const iconBoxClasses = isSelected
              ? "bg-white/20 text-white"
              : "bg-surface border border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)]";
            const descClasses = isSelected
              ? "text-white/80"
              : "text-[var(--color-text-tertiary)]";

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  router.replace(`?tab=${cat.id}`, { scroll: false });
                }}
                className={`w-full flex items-start gap-3.5 p-3 rounded-2xl text-left transition-all cursor-pointer ${itemClasses}`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${iconBoxClasses}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="text-xs font-bold leading-tight">{cat.label}</div>
                  <div className={`text-[11px] truncate mt-0.5 ${descClasses}`}>
                    {cat.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* RIGHT CONTENT PANE */}
        <div className="lg:col-span-8 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-xl p-6 sm:p-8 shadow-xs">
          {/* CATEGORY 1: ACCOUNT PREFERENCES */}
          {activeCategory === "account" && (
            <AccountSettingsTab
              prefLocale={prefLocale}
              theme={theme}
              timeZone={timeZone}
              contactChannel={contactChannel}
              locale={locale}
              onPrefLocaleChange={(val) => {
                setPrefLocale(val);
                handleSaveProfileField({ locale: val });
              }}
              onThemeChange={(val) => {
                setTheme(val);
                handleSaveProfileField({ theme: val });
              }}
              onTimeZoneChange={(val) => {
                setTimeZone(val);
                handleSaveProfileField({ timeZone: val });
              }}
              onContactChannelChange={(val) => {
                setContactChannel(val);
                handleSaveProfileField({ preferredContactChannel: val });
              }}
              onCloseAccountClick={() => {
                alert(
                  isTr
                    ? "Hesap silme işlemi için Güvenlik sekmesindeki silme onayını kullanabilirsiniz."
                    : "Please use the Security tab to confirm account deletion."
                );
              }}
            />
          )}

          {/* CATEGORY 2: SIGN IN & SECURITY */}
          {activeCategory === "security" && (
            <SecuritySettingsTab
              email={initialProfile.email}
              twoFactorEnabled={twoFactorEnabled}
              locale={locale}
              saving={saving}
              currentPassword={currentPassword}
              newPassword={newPassword}
              confirmPassword={confirmPassword}
              companyData={{
                isCompanyVerified: initialProfile.isCompanyVerified,
                companyName: initialProfile.companyName,
                companyType: initialProfile.companyType,
                taxOffice: initialProfile.taxOffice,
                vknMasked: initialProfile.vknMasked,
                companyVerifiedAt: initialProfile.companyVerifiedAt,
              }}
              onCurrentPasswordChange={setCurrentPassword}
              onNewPasswordChange={setNewPassword}
              onConfirmPasswordChange={setConfirmPassword}
              onPasswordSubmit={handlePasswordChange}
            />
          )}

          {/* CATEGORY 3: VISIBILITY */}
          {activeCategory === "visibility" && (
            <VisibilitySettingsTab
              showLocation={showLocation}
              revealPhoneAfterMatch={revealPhoneAfterMatch}
              allowSearchIndex={allowSearchIndex}
              availabilityStatus={availabilityStatus}
              availabilityHoursPerWeek={availabilityHoursPerWeek}
              availableFromDate={availableFromDate}
              availabilityNotice={availabilityNotice}
              locale={locale}
              onShowLocationChange={(val) => {
                setShowLocation(val);
                handleSaveProfileField({ showLocation: val });
              }}
              onRevealPhoneChange={(val) => {
                setRevealPhoneAfterMatch(val);
                handleSaveProfileField({ revealPhoneAfterMatch: val });
              }}
              onAllowSearchIndexChange={(val) => {
                setAllowSearchIndex(val);
                showFeedback(
                  "success",
                  isTr
                    ? "Arama motoru tercihi güncellendi."
                    : "Indexing preferences saved."
                );
              }}
              onAvailabilityStatusChange={(tierId) => {
                setAvailabilityStatus(tierId);
                const isForHire = tierId !== "BUSY";
                handleSaveProfileField({
                  availabilityStatus: tierId,
                  isAvailableForHire: isForHire,
                });
              }}
              onAvailabilityHoursChange={(hours) => {
                setAvailabilityHoursPerWeek(hours);
                handleSaveProfileField({ availabilityHoursPerWeek: hours });
              }}
              onAvailableFromDateChange={(dateStr) => {
                setAvailableFromDate(dateStr);
                handleSaveProfileField({ availableFromDate: dateStr || null });
              }}
              onAvailabilityNoticeChange={setAvailabilityNotice}
              onAvailabilityNoticeBlur={() => {
                handleSaveProfileField({
                  availabilityNotice: availabilityNotice.trim() || null,
                });
              }}
            />
          )}

          {/* CATEGORY 4: DATA PRIVACY */}
          {activeCategory === "privacy" && (
            <PrivacyGdprTab
              exportLoading={exportLoading}
              exportJobId={exportJobId}
              exportStatus={exportStatus}
              locale={locale}
              onTriggerExport={handleTriggerExport}
            />
          )}

          {/* CATEGORY 5: ADVERTISING & MARKETING DATA */}
          {activeCategory === "advertising" && (
            <AdvertisingSettingsTab
              marketingConsent={marketingConsent}
              loadingConsent={loadingConsent}
              personalizedAds={personalizedAds}
              locale={locale}
              onMarketingConsentChange={handleMarketingConsentChange}
              onPersonalizedAdsChange={(val) => {
                setPersonalizedAds(val);
                showFeedback(
                  "success",
                  isTr
                    ? "Eşleştirme tercihi güncellendi."
                    : "Recommendation preferences saved."
                );
              }}
            />
          )}

          {/* CATEGORY 6: NOTIFICATIONS */}
          {activeCategory === "notifications" && (
            <NotificationsSettingsTab
              notifyListings={notifyListings}
              notifyOffers={notifyOffers}
              emailDigest={emailDigest}
              locale={locale}
              onNotifyListingsChange={(val) => {
                setNotifyListings(val);
                showFeedback("success", isTr ? "Bildirim tercihi kaydedildi." : "Notification saved.");
              }}
              onNotifyOffersChange={(val) => {
                setNotifyOffers(val);
                showFeedback("success", isTr ? "Bildirim tercihi kaydedildi." : "Notification saved.");
              }}
              onEmailDigestChange={(val) => {
                setEmailDigest(val);
                showFeedback("success", isTr ? "E-posta sıklığı güncellendi." : "Email frequency saved.");
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
