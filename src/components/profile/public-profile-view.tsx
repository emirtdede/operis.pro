"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  CheckCircle2,
  Star,
  Check,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import type { PublicProfileDto } from "@/src/modules/profiles/service";
import { resolveUserPersonaMode } from "@/src/modules/profiles/utils/persona";
import {
  HeaderEditModal,
  RolesEditModal,
  AboutEditModal,
  SkillsEditModal,
  LinksEditModal,
} from "./profile-edit-modals";
import { ProfileLinkItem } from "./profile-settings-form";
import { PublicProfileHero } from "./sections/public-profile-hero";
import { PublicProfileSidebar } from "./sections/public-profile-sidebar";
import { PublicProfilePortfolio } from "./sections/public-profile-portfolio";
import { PublicProfileReviews } from "./sections/public-profile-reviews";
import { PublicProfileViewProps } from "./sections/types";

export * from "./sections/types";

export function PublicProfileView({
  initialProfile,
  locale,
  isSelf,
}: PublicProfileViewProps) {
  const isTr = locale === "tr";
  const router = useRouter();
  const [profile, setProfile] = useState<PublicProfileDto>(initialProfile);
  const [activeTab, setActiveTab] = useState<"listings" | "projects" | "endorsements" | "reviews">("listings");

  // Notification / Toast Feedback
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Modal visibility states
  const [headerModalOpen, setHeaderModalOpen] = useState(false);
  const [rolesModalOpen, setRolesModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [linksModalOpen, setLinksModalOpen] = useState(false);

  // Save handler for profile fields (Single Source of Truth)
  const handleSaveProfileFields = async (fields: Record<string, unknown>) => {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-locale": locale },
      body: JSON.stringify(fields),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const errMsg = data.error || (isTr ? "Profil güncellenemedi." : "Failed to update profile.");
      showToast(errMsg, "error");
      throw new Error(errMsg);
    }

    setProfile((prev) => ({
      ...prev,
      ...fields,
    }));

    showToast(isTr ? "Profiliniz başarıyla güncellendi." : "Profile updated successfully.", "success");

    // If handle changed, update browser URL gracefully
    if (fields.handle && typeof fields.handle === "string" && fields.handle !== profile.handle) {
      const newPath = isTr ? `/tr/u/${fields.handle}` : `/en/u/${fields.handle}`;
      window.history.replaceState(null, "", newPath);
      router.refresh();
    }
  };

  // Save handler for links
  const handleSaveLinks = async (newLinks: ProfileLinkItem[]) => {
    const res = await fetch("/api/profile/links", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-locale": locale },
      body: JSON.stringify({ links: newLinks }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const errMsg = data.error || (isTr ? "Bağlantılar kaydedilemedi." : "Failed to update links.");
      showToast(errMsg, "error");
      throw new Error(errMsg);
    }

    setProfile((prev) => ({
      ...prev,
      links: newLinks.map((l, i) => ({ id: `link-${i}`, ...l })),
    }));

    showToast(isTr ? "Dış bağlantılarınız güncellendi." : "External links updated successfully.", "success");
  };

  const activeListings = profile.activeListings || [];
  const completedWork = profile.completedWork || [];
  const endorsements = profile.endorsements || [];
  const reviewsSummary = profile.reviewsSummary;

  let reviewsCount = endorsements.length;
  if (reviewsSummary) {
    reviewsCount = reviewsSummary.receivedReviewsCount + reviewsSummary.givenReviewsCount;
  }

  const isReviewsActive = activeTab === "reviews" || activeTab === "endorsements";

  const personaMode =
    profile.personaMode ||
    resolveUserPersonaMode({
      roles: profile.roles,
      isAvailableForHire: profile.isAvailableForHire,
      isActivelyHiring: profile.isActivelyHiring,
      isCompanyVerified: profile.isCompanyVerified,
      activeListingsCount: activeListings.length,
    });
  const [hybridPerspective, setHybridPerspective] = useState<"ALL" | "EMPLOYER" | "FREELANCER">("ALL");

  return (
    <div className="space-y-6">
      {/* Toast Feedback Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-xl text-xs font-semibold backdrop-blur-xl animate-in slide-in-from-bottom-3 duration-200 ${
            toast.type === "success"
              ? "bg-emerald-950/85 border-emerald-500/30 text-emerald-300 shadow-emerald-950/40"
              : "bg-rose-950/85 border-rose-500/30 text-rose-300 shadow-rose-950/40"
          }`}
        >
          {toast.type === "success" ? (
            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. HERO PROFILE CONTAINER (Avatar-Only, Zero Cover Banner) */}
      <PublicProfileHero
        profile={profile}
        locale={locale}
        isSelf={isSelf}
        onOpenHeaderModal={() => setHeaderModalOpen(true)}
        onOpenRolesModal={() => setRolesModalOpen(true)}
        onOpenAboutModal={() => setAboutModalOpen(true)}
        onOpenSkillsModal={() => setSkillsModalOpen(true)}
        onOpenLinksModal={() => setLinksModalOpen(true)}
      />

      {/* 2. ASYMMETRIC TWO-COLUMN BENTO WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Identity, Bio, Skills, Platform Links, Verification */}
        <PublicProfileSidebar
          profile={profile}
          locale={locale}
          isSelf={isSelf}
          onOpenAboutModal={() => setAboutModalOpen(true)}
          onOpenSkillsModal={() => setSkillsModalOpen(true)}
          onOpenLinksModal={() => setLinksModalOpen(true)}
        />

        {/* RIGHT COLUMN: Portfolio & Activity Tabs */}
        <main className="lg:col-span-8 space-y-5">
          {/* Hybrid Perspective Switcher (Dual Identity Perspective Sieve) */}
          {personaMode === "hybrid" && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 backdrop-blur-md shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 pl-2">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isTr ? "Hibrit Görünüm:" : "Perspective:"}</span>
              </div>
              <div className="flex items-center gap-1 self-end sm:self-auto">
                {(["ALL", "EMPLOYER", "FREELANCER"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setHybridPerspective(mode);
                      if (mode === "EMPLOYER") setActiveTab("listings");
                      if (mode === "FREELANCER") setActiveTab("projects");
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      hybridPerspective === mode
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                    }`}
                  >
                    {mode === "ALL" && (isTr ? "🌟 Tümü (Hibrit)" : "🌟 Overview")}
                    {mode === "EMPLOYER" && (isTr ? "💼 İşveren İlanları" : "💼 Client Briefs")}
                    {mode === "FREELANCER" && (isTr ? "🛠️ Uzman Portfolyosu" : "🛠️ Specialist Work")}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Segmented Tab Navigation */}
          <div
            id="profile-tabs"
            className="flex items-center gap-1.5 p-1.5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/85 backdrop-blur-xl shadow-xs scroll-mt-20"
          >
            <button
              type="button"
              onClick={() => setActiveTab("listings")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "listings"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>
                {personaMode === "employer"
                  ? isTr
                    ? "Açık Proje İlanları"
                    : "Project Postings"
                  : personaMode === "hybrid"
                    ? isTr
                      ? "İlanlar & Hizmetler"
                      : "Listings & Briefs"
                    : isTr
                      ? "Aktif İlanları"
                      : "Active Listings"}
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === "listings"
                    ? "bg-white/20 text-white"
                    : "bg-surface border border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)]"
                }`}
              >
                {activeListings.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("projects")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "projects"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{isTr ? "Tamamlanan Projeler" : "Completed Work"}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === "projects"
                    ? "bg-white/20 text-white"
                    : "bg-surface border border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)]"
                }`}
              >
                {completedWork.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("reviews")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isReviewsActive
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>{isTr ? "Değerlendirmeler & Yorumlar" : "Reviews & Ratings"}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isReviewsActive
                    ? "bg-white/20 text-white"
                    : "bg-surface border border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)]"
                }`}
              >
                {reviewsCount}
              </span>
            </button>
          </div>

          {/* Tab 1: Listings & Tab 2: Projects */}
          {(activeTab === "listings" || activeTab === "projects") && (
            <PublicProfilePortfolio
              profile={profile}
              locale={locale}
              isSelf={isSelf}
              activeTab={activeTab}
              personaMode={personaMode}
            />
          )}

          {/* Tab 3: Bilateral Reviews & Ratings */}
          {isReviewsActive && (
            <PublicProfileReviews profile={profile} locale={locale} />
          )}
        </main>
      </div>

      {/* 3. IN-PLACE EDIT MODALS (Instant live customization) */}
      {isSelf && (
        <>
          <HeaderEditModal
            isOpen={headerModalOpen}
            onClose={() => setHeaderModalOpen(false)}
            initialDisplayName={profile.displayName}
            initialHeadline={profile.headline || ""}
            initialAvatarUrl={profile.avatarUrl || ""}
            initialAvatarSource={profile.avatarSource || "oauth"}
            locale={locale}
            onSave={async (data) => {
              await handleSaveProfileFields(data);
            }}
          />

          <RolesEditModal
            isOpen={rolesModalOpen}
            onClose={() => setRolesModalOpen(false)}
            initialRoles={profile.roles || []}
            initialIsAvailableForHire={profile.isAvailableForHire}
            initialIsActivelyHiring={profile.isActivelyHiring}
            initialAvailabilityStatus={profile.availabilityStatus}
            initialAvailabilityHoursPerWeek={profile.availabilityHoursPerWeek}
            initialAvailableFromDate={profile.availableFromDate}
            initialAvailabilityNotice={profile.availabilityNotice}
            locale={locale}
            onSave={async (data) => {
              await handleSaveProfileFields(data);
            }}
          />

          <AboutEditModal
            isOpen={aboutModalOpen}
            onClose={() => setAboutModalOpen(false)}
            initialAbout={profile.about || ""}
            locale={locale}
            onSave={async (about) => {
              await handleSaveProfileFields({ about });
            }}
          />

          <SkillsEditModal
            isOpen={skillsModalOpen}
            onClose={() => setSkillsModalOpen(false)}
            initialSkills={profile.trackedSkills || []}
            locale={locale}
            onSave={async (trackedSkills) => {
              await handleSaveProfileFields({ trackedSkills });
            }}
          />

          <LinksEditModal
            isOpen={linksModalOpen}
            onClose={() => setLinksModalOpen(false)}
            initialLinks={profile.links || []}
            locale={locale}
            onSave={async (newLinks) => {
              await handleSaveLinks(newLinks);
            }}
          />
        </>
      )}
    </div>
  );
}
