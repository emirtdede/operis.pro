"use client";

import { useState, useEffect, useMemo, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  Search,
  X,
} from "lucide-react";
import {
  SettingsCategory,
  SettingsViewProps,
  ProfileLinkItem,
  getMarketingConsentFeedback,
  getSettingsCategories,
  normalizeCategory,
} from "./types";

import { ProfileIdentityTab } from "./tabs/profile-identity-tab";
import { WorkAvailabilityTab } from "./tabs/work-availability-tab";
import { AccountSettingsTab } from "./tabs/account-settings-tab";
import { CorporateBillingTab } from "./tabs/corporate-billing-tab";
import { SecuritySettingsTab } from "./tabs/security-settings-tab";
import { NotificationsSettingsTab } from "./tabs/notifications-settings-tab";
import { PrivacyGdprTab } from "./tabs/privacy-gdpr-tab";

export * from "./types";

export function SettingsView({
  initialProfile,
  twoFactorEnabled,
  locale,
}: SettingsViewProps) {
  const isTr = locale === "tr";
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialCat = normalizeCategory(searchParams.get("tab"));
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>(initialCat);
  const [searchQuery, setSearchQuery] = useState("");

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
  const [allowSearchIndex, setAllowSearchIndex] = useState(
    initialProfile.allowSearchIndex ?? true
  );

  // Marketing consent state
  const [marketingConsent, setMarketingConsent] = useState(false);

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
  const [exportDownloadUrl, setExportDownloadUrl] = useState<string | null>(null);

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
      .catch(() => {});
  }, []);

  // Poll export job status until completed (READY or FAILED) (WP-34)
  useEffect(() => {
    if (!exportJobId || exportStatus === "READY" || exportStatus === "FAILED") {
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`/api/account/export?jobId=${encodeURIComponent(exportJobId)}`, {
          headers: { "x-locale": locale },
        });
        if (!res.ok) return;

        const data = await res.json();
        const job = data.job || data;
        const status = job.status;
        if (status) {
          setExportStatus(status);
        }
        if (status === "READY") {
          const downloadUrl =
            job.downloadUrl || `/api/account/export?jobId=${encodeURIComponent(exportJobId)}&download=1`;
          setExportDownloadUrl(downloadUrl);
          showFeedback(
            "success",
            isTr
              ? "Veri aktarım dosyanız hazırlandı. İndirebilirsiniz."
              : "Data export archive is ready for download."
          );
        } else if (status === "FAILED") {
          showFeedback(
            "error",
            isTr ? "Veri aktarım işlemi başarısız oldu." : "Data export processing failed."
          );
        }
      } catch {
        // Retry on next interval tick
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [exportJobId, exportStatus, isTr, locale]);

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
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLinks = async (links: ProfileLinkItem[]) => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile/links", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-locale": locale },
        body: JSON.stringify({ links }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Save links failed");
      }
      showFeedback("success", isTr ? "Bağlantılarınız güncellendi." : "Links saved successfully.");
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
    if (newPassword.length < 12) {
      showFeedback(
        "error",
        isTr ? "Şifre en az 12 karakter olmalıdır." : "Password must be at least 12 characters."
      );
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      showFeedback(
        "error",
        isTr
          ? "Şifre en az bir büyük harf ve bir rakam içermelidir."
          : "Password must contain at least one uppercase letter and one number."
      );
      return;
    }
    if (currentPassword === newPassword) {
      showFeedback(
        "error",
        isTr
          ? "Yeni şifre mevcut şifrenizle aynı olamaz."
          : "New password cannot be the same as current password."
      );
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-locale": isTr ? "tr" : "en" },
        body: JSON.stringify({ currentPassword, newPassword, locale: isTr ? "tr" : "en" }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || (isTr ? "Şifre değiştirilemedi." : "Password change failed."));
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
    setExportDownloadUrl(null);
    try {
      const res = await fetch("/api/account/export", {
        method: "POST",
        headers: { "x-locale": isTr ? "tr" : "en" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Export failed");
      const jobId = data.jobId || data.id;
      setExportJobId(jobId);
      setExportStatus("PROCESSING");
      showFeedback(
        "success",
        isTr
          ? "Veri aktarım talebiniz oluşturuldu. Dosya hazırlandığında indirme butonu görünecektir."
          : "Data export initiated. Download link will appear once ready."
      );
    } catch (err: unknown) {
      showFeedback("error", err instanceof Error ? err.message : "Export error");
    } finally {
      setExportLoading(false);
    }
  };

  const allCategories = getSettingsCategories(isTr);

  // Search filtering
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return allCategories;
    const q = searchQuery.toLowerCase().trim();
    return allCategories.filter(
      (cat) =>
        cat.label.toLowerCase().includes(q) ||
        cat.desc.toLowerCase().includes(q) ||
        cat.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [allCategories, searchQuery]);

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
          className="lg:col-span-4 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-xl p-3 shadow-xs space-y-2 sticky top-24"
        >
          {/* Arama Kutusu (Search Filter) */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isTr ? "Ayarlarda ara... (örn: şifre, iban)" : "Search settings..."}
              className="w-full rounded-xl bg-surface border border-[var(--color-border-subtle)] pl-8 pr-7 py-1.5 text-xs text-[var(--color-text-primary)] outline-none focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {filteredCategories.length > 0 ? (
            filteredCategories.map((cat) => {
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
                  className={`w-full flex items-start gap-3 p-2.5 rounded-2xl text-left transition-all cursor-pointer ${itemClasses}`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${iconBoxClasses}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="text-xs font-bold leading-tight flex items-center justify-between">
                      <span>{cat.label}</span>
                    </div>
                    <div className={`text-[11px] truncate mt-0.5 ${descClasses}`}>
                      {cat.desc}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-4 text-center text-xs text-[var(--color-text-tertiary)]">
              {isTr ? "Eşleşen bir ayar bulunamadı." : "No matching settings found."}
            </div>
          )}
        </nav>

        {/* RIGHT CONTENT PANE */}
        <div className="lg:col-span-8 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-xl p-6 sm:p-8 shadow-xs min-h-[500px]">
          {/* TAB 1: PROFILE & IDENTITY */}
          {activeCategory === "profile" && (
            <ProfileIdentityTab
              initialDisplayName={initialProfile.displayName}
              initialHandle={initialProfile.handle}
              initialHeadline={initialProfile.headline || ""}
              initialAbout={initialProfile.about || ""}
              initialAvatarUrl={initialProfile.avatarUrl || ""}
              initialLinks={initialProfile.links || []}
              locale={locale}
              saving={saving}
              onSaveProfile={handleSaveProfileField}
              onSaveLinks={handleSaveLinks}
            />
          )}

          {/* TAB 2: AVAILABILITY & WORK PREFERENCES */}
          {activeCategory === "work" && (
            <WorkAvailabilityTab
              initialAvailabilityStatus={
                initialProfile.availabilityStatus ||
                (initialProfile.isAvailableForHire ? "AVAILABLE_NOW" : "BUSY")
              }
              initialAvailabilityHoursPerWeek={initialProfile.availabilityHoursPerWeek || 40}
              initialAvailableFromDate={initialProfile.availableFromDate || ""}
              initialAvailabilityNotice={initialProfile.availabilityNotice || ""}
              initialIsAvailableForHire={initialProfile.isAvailableForHire ?? true}
              initialIsActivelyHiring={initialProfile.isActivelyHiring ?? false}
              initialRoles={initialProfile.roles || ["freelancer"]}
              locale={locale}
              saving={saving}
              onSaveWorkPreferences={handleSaveProfileField}
            />
          )}

          {/* TAB 3: ACCOUNT & REGIONAL PREFERENCES */}
          {activeCategory === "account" && (
            <AccountSettingsTab
              email={initialProfile.email}
              emailVerified={initialProfile.emailVerified}
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
            />
          )}

          {/* TAB 4: CORPORATE & INVOICING */}
          {activeCategory === "corporate" && (
            <CorporateBillingTab
              companyData={{
                isCompanyVerified: initialProfile.isCompanyVerified,
                companyName: initialProfile.companyName,
                companyType: initialProfile.companyType,
                taxOffice: initialProfile.taxOffice,
                vknMasked: initialProfile.vknMasked,
                companyVerifiedAt: initialProfile.companyVerifiedAt,
              }}
              initialInvoiceAddress={initialProfile.invoiceAddress}
              initialIban={initialProfile.iban}
              initialBankName={initialProfile.bankName}
              initialAccountHolder={initialProfile.accountHolder}
              locale={locale}
              saving={saving}
              onSaveBilling={handleSaveProfileField}
            />
          )}

          {/* TAB 5: SIGN IN & SECURITY */}
          {activeCategory === "security" && (
            <SecuritySettingsTab
              twoFactorEnabled={twoFactorEnabled}
              locale={locale}
              saving={saving}
              currentPassword={currentPassword}
              newPassword={newPassword}
              confirmPassword={confirmPassword}
              onCurrentPasswordChange={setCurrentPassword}
              onNewPasswordChange={setNewPassword}
              onConfirmPasswordChange={setConfirmPassword}
              onPasswordSubmit={handlePasswordChange}
            />
          )}

          {/* TAB 6: NOTIFICATIONS MATRIX */}
          {activeCategory === "notifications" && (
            <NotificationsSettingsTab
              initialNotifyListings={notifyListings}
              initialNotifyOffers={notifyOffers}
              initialEmailDigest={emailDigest}
              marketingConsent={marketingConsent}
              locale={locale}
              saving={saving}
              onSaveNotifications={async (fields) => {
                if (fields.notifyListings !== undefined) setNotifyListings(Boolean(fields.notifyListings));
                if (fields.notifyOffers !== undefined) setNotifyOffers(Boolean(fields.notifyOffers));
                if (fields.emailDigest !== undefined) setEmailDigest(String(fields.emailDigest));
                await handleSaveProfileField(fields);
              }}
              onMarketingConsentChange={handleMarketingConsentChange}
            />
          )}

          {/* TAB 7: PRIVACY, KVKK & DANGER ZONE */}
          {activeCategory === "privacy" && (
            <PrivacyGdprTab
              showLocation={showLocation}
              revealPhoneAfterMatch={revealPhoneAfterMatch}
              allowSearchIndex={allowSearchIndex}
              exportLoading={exportLoading}
              exportJobId={exportJobId}
              exportStatus={exportStatus}
              exportDownloadUrl={exportDownloadUrl}
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
                    ? "Arama motoru indeksleme tercihi güncellendi."
                    : "Search engine indexing preference updated."
                );
              }}
              onTriggerExport={handleTriggerExport}
              onCloseAccountClick={() => {
                router.push(isTr ? "/tr/panel/guvenlik" : "/en/dashboard/security");
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
