"use client";

import { useState } from "react";
import {
  Briefcase,
  CheckCircle2,
  Star,
} from "lucide-react";
import { PublicProfileDto } from "@/src/modules/profiles/service";
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
  const [profile, setProfile] = useState<PublicProfileDto>(initialProfile);
  const [activeTab, setActiveTab] = useState<"listings" | "projects" | "endorsements" | "reviews">("listings");

  // Modal visibility states
  const [headerModalOpen, setHeaderModalOpen] = useState(false);
  const [rolesModalOpen, setRolesModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [linksModalOpen, setLinksModalOpen] = useState(false);

  // Save handler for profile fields
  const handleSaveProfileFields = async (fields: Record<string, unknown>) => {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-locale": locale },
      body: JSON.stringify(fields),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to update profile");
    }
    setProfile((prev) => ({
      ...prev,
      ...fields,
    }));
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
      throw new Error(data.error || "Failed to update links");
    }
    setProfile((prev) => ({
      ...prev,
      links: newLinks.map((l, i) => ({ id: `link-${i}`, ...l })),
    }));
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

  return (
    <div className="space-y-6">
      {/* 1. HERO & BANNER PROFILE CONTAINER */}
      <PublicProfileHero
        profile={profile}
        locale={locale}
        isSelf={isSelf}
        onOpenHeaderModal={() => setHeaderModalOpen(true)}
        onOpenRolesModal={() => setRolesModalOpen(true)}
      />

      {/* 2. ASYMMETRIC TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Identity, Bio, Skills, Platform Links */}
        <PublicProfileSidebar
          profile={profile}
          locale={locale}
          isSelf={isSelf}
          onOpenAboutModal={() => setAboutModalOpen(true)}
          onOpenSkillsModal={() => setSkillsModalOpen(true)}
          onOpenLinksModal={() => setLinksModalOpen(true)}
        />

        {/* RIGHT COLUMN: Tabs & Dynamic Content */}
        <main className="lg:col-span-8 space-y-5">
          {/* Segmented Tab Navigation */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-xl shadow-xs">
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
              <span>{isTr ? "Aktif İlanları" : "Active Listings"}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === "listings" ? "bg-white/20 text-white" : "bg-surface border border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)]"
              }`}>
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
              <span>{isTr ? "Tamamlanan Projeler" : "Completed"}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === "projects" ? "bg-white/20 text-white" : "bg-surface border border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)]"
              }`}>
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
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isReviewsActive ? "bg-white/20 text-white" : "bg-surface border border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)]"
              }`}>
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
            />
          )}

          {/* Tab 3: Bilateral Reviews & Ratings */}
          {isReviewsActive && (
            <PublicProfileReviews profile={profile} locale={locale} />
          )}
        </main>
      </div>

      {/* 3. IN-PLACE EDIT MODALS */}
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
