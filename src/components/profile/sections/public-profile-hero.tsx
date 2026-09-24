"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  ShieldCheck,
  Pencil,
  Plus,
  Calendar,
  Clock,
  Sliders,
  Copy,
  Check,
  Sparkles,
  Briefcase,
  Building2,
} from "lucide-react";
import { AvatarInitials } from "@/src/components/ui/avatar-initials";
import { Button } from "@/src/components/ui/button";
import { ProfileShareButton } from "@/src/components/profile/profile-share-button";
import { ProfileActionsMenu } from "@/src/components/profile/profile-actions-menu";
import type { PublicProfileDto } from "@/src/modules/profiles/service";
import {
  type PersonaMode,
  resolveUserPersonaMode,
  getPersonaBadgeConfig,
} from "@/src/modules/profiles/utils/persona";
import { AvailabilityBadge } from "../availability-badge";
import { VerifiedCompanyBadge } from "@/src/components/ui/verified-company-badge";
import { getRoleBadges } from "./types";

export interface PublicProfileHeroProps {
  profile: PublicProfileDto;
  locale: string;
  isSelf: boolean;
  onOpenHeaderModal: () => void;
  onOpenRolesModal: () => void;
  onOpenAboutModal?: () => void;
  onOpenSkillsModal?: () => void;
  onOpenLinksModal?: () => void;
}

function renderAvailabilityIndicator(
  personaMode: PersonaMode,
  availabilityStatus: string | null | undefined,
  isAvailableForHire: boolean | null | undefined,
  isActivelyHiring: boolean | null | undefined,
  hasActiveListings: boolean,
  isTr: boolean
) {
  const dotClasses =
    "absolute bottom-0 right-0 sm:bottom-0.5 sm:right-0.5 h-4 w-4 sm:h-5 sm:w-5 rounded-full ring-2 ring-[var(--color-surface-base)] shadow-md z-10 pointer-events-none";

  // Employer perspective: Show active hiring status signal
  if (personaMode === "employer") {
    if (isActivelyHiring || hasActiveListings) {
      return (
        <span
          className={`${dotClasses} bg-sky-400 animate-pulse`}
          title={isTr ? "Aktif İşe Alım Yapıyor (Hiring)" : "Actively Hiring"}
        />
      );
    }
    return (
      <span
        className={`${dotClasses} bg-slate-500`}
        title={isTr ? "İşe Alım Kapalı" : "Hiring Inactive"}
      />
    );
  }

  // Freelancer & Hybrid perspective: Show availability
  if (availabilityStatus === "AVAILABLE_NOW") {
    return (
      <span
        className={`${dotClasses} bg-emerald-500 animate-pulse`}
        title={isTr ? "Hemen Başlayabilir" : "Available Now"}
      />
    );
  }
  if (availabilityStatus === "PARTIALLY_AVAILABLE") {
    return (
      <span
        className={`${dotClasses} bg-amber-500`}
        title={isTr ? "Kısmi Zamanlı Müsait" : "Partially Available"}
      />
    );
  }
  if (availabilityStatus === "BUSY") {
    return (
      <span
        className={`${dotClasses} bg-rose-500`}
        title={isTr ? "Şu An Meşgul" : "Currently Busy"}
      />
    );
  }
  if (isAvailableForHire) {
    return (
      <span
        className={`${dotClasses} bg-emerald-500 animate-pulse`}
        title={isTr ? "Projelere Açık" : "Available for Hire"}
      />
    );
  }
  return null;
}

export function PublicProfileHero({
  profile,
  locale,
  isSelf,
  onOpenHeaderModal,
  onOpenRolesModal,
  onOpenAboutModal,
  onOpenSkillsModal,
  onOpenLinksModal,
}: PublicProfileHeroProps) {
  const isTr = locale === "tr";
  const roleBadges = getRoleBadges(isTr);
  const currentRoles = (profile.roles || []).filter(Boolean);
  const activeListings = profile.activeListings || [];
  const completedWork = profile.completedWork || [];
  const endorsements = profile.endorsements || [];

  const personaMode =
    profile.personaMode ||
    resolveUserPersonaMode({
      roles: profile.roles,
      isAvailableForHire: profile.isAvailableForHire,
      isActivelyHiring: profile.isActivelyHiring,
      isCompanyVerified: profile.isCompanyVerified,
      activeListingsCount: activeListings.length,
    });
  const personaBadgeConfig = getPersonaBadgeConfig(
    personaMode,
    Boolean(profile.isCompanyVerified),
    isTr
  );

  const [copiedHandle, setCopiedHandle] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  const joinDate = profile.createdAt ? new Date(profile.createdAt) : new Date("2026-01-01");
  const formattedJoinDate = new Intl.DateTimeFormat(isTr ? "tr-TR" : "en-US", {
    year: "numeric",
    month: "short",
  }).format(joinDate);

  let availabilityFallbackStatus: "AVAILABLE_NOW" | "BUSY" = "BUSY";
  if (profile.isAvailableForHire) {
    availabilityFallbackStatus = "AVAILABLE_NOW";
  }
  const effectiveAvailabilityStatus = profile.availabilityStatus || availabilityFallbackStatus;

  // Local Time computation from timezone
  const getTimeInZone = () => {
    try {
      const now = new Date();
      return new Intl.DateTimeFormat(isTr ? "tr-TR" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Europe/Istanbul",
      }).format(now);
    } catch {
      return null;
    }
  };

  const localTime = getTimeInZone();

  const handleCopyHandle = async () => {
    try {
      await navigator.clipboard.writeText(`@${profile.handle}`);
      setCopiedHandle(true);
      setTimeout(() => setCopiedHandle(false), 2000);
    } catch {
      // Non-blocking fallback
    }
  };

  return (
    <article className="relative overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/90 backdrop-blur-2xl shadow-xl transition-all">
      {/* Subtle top accent gradient line (Clean & Non-distracting, NO cover banner) */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 opacity-90" />

      {/* Main Avatar-First Hero Body */}
      <div className="p-6 sm:p-8 lg:p-10 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          {/* Left: Avatar + Identity Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 sm:gap-6 flex-1 min-w-0">
            {/* 1. Avatar Container (Only visual photo, high-res & highlighted) */}
            <div className="relative shrink-0">
              <div className="relative rounded-full p-1 bg-gradient-to-tr from-blue-500/40 via-purple-500/25 to-indigo-500/40 shadow-xl ring-1 ring-white/10 group">
                <div className="rounded-full overflow-hidden bg-[var(--color-surface-base)] flex items-center justify-center">
                  <AvatarInitials
                    name={profile.displayName}
                    size="2xl"
                    avatarUrl={profile.avatarUrl}
                    className="border-0"
                  />
                </div>
                {/* Active Availability / Hiring Dot */}
                {renderAvailabilityIndicator(
                  personaMode,
                  profile.availabilityStatus,
                  profile.isAvailableForHire,
                  profile.isActivelyHiring,
                  activeListings.length > 0,
                  isTr
                )}

                {/* In-Place Quick Avatar/Header Edit Trigger for Self */}
                {isSelf && (
                  <button
                    type="button"
                    onClick={onOpenHeaderModal}
                    className="absolute inset-1 flex flex-col items-center justify-center rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs text-white cursor-pointer z-20"
                    title={isTr ? "Fotoğrafı Değiştir" : "Change Photo"}
                    aria-label={isTr ? "Profil fotoğrafını değiştir" : "Change profile picture"}
                  >
                    <Pencil className="h-5 w-5 mb-1" />
                    <span className="text-[10px] font-semibold">{isTr ? "Düzenle" : "Edit"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* 2. User Details */}
            <div className="space-y-2.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
                  {profile.displayName}
                </h1>

                {/* Verification Badges (Adaptive to Employer / Specialist / Hybrid) */}
                {profile.isCompanyVerified ? (
                  <VerifiedCompanyBadge
                    companyName={profile.companyName}
                    taxOffice={profile.taxOffice}
                    vknMasked={profile.vknMasked}
                    companyType={profile.companyType}
                    size="md"
                    isEn={!isTr}
                  />
                ) : (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-2xs ${personaBadgeConfig.colorClasses}`}
                    title={personaBadgeConfig.sublabel}
                  >
                    {personaMode === "employer" ? (
                      <Building2 className="h-3.5 w-3.5" />
                    ) : personaMode === "hybrid" ? (
                      <Sparkles className="h-3.5 w-3.5" />
                    ) : (
                      <ShieldCheck className="h-3.5 w-3.5" />
                    )}
                    <span>{personaBadgeConfig.badgeText}</span>
                  </span>
                )}

                {isSelf && (
                  <button
                    type="button"
                    onClick={onOpenHeaderModal}
                    className="p-1.5 rounded-xl text-[var(--color-text-tertiary)] hover:text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
                    title={isTr ? "Başlığı ve Fotoğrafı Düzenle" : "Edit Intro"}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Handle & Interactive Copy Badge */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={handleCopyHandle}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-mono font-medium text-blue-400 bg-blue-500/5 hover:bg-blue-500/15 border border-blue-500/20 transition-all cursor-pointer group"
                  title={isTr ? "Kullanıcı adını kopyala" : "Copy handle"}
                >
                  <span>@{profile.handle}</span>
                  {copiedHandle ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3 text-blue-400/60 group-hover:text-blue-400 transition-colors" />
                  )}
                </button>

                {profile.isActivelyHiring && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border border-sky-500/30 bg-sky-500/10 text-sky-400 shadow-2xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
                    <span>{isTr ? "İş Veren • Aktif İlanlar" : "Client • Hiring"}</span>
                  </span>
                )}
              </div>

              {/* Value-Proposition Headline */}
              {profile.headline ? (
                <p className="text-sm sm:text-base font-medium text-[var(--color-text-primary)] leading-relaxed max-w-2xl">
                  {profile.headline}
                </p>
              ) : isSelf ? (
                <button
                  type="button"
                  onClick={onOpenHeaderModal}
                  className="text-xs text-[var(--color-text-tertiary)] hover:text-blue-400 transition-colors italic flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>
                    {isTr
                      ? "+ Mesleki unvan / pozisyon ekleyin (örn: Kıdemli Full-Stack Mimar)"
                      : "+ Add professional headline"}
                  </span>
                </button>
              ) : null}

              {/* Persona Tags & Availability Pill Row */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                {/* Role Badges */}
                {currentRoles.map((roleKey) => {
                  const b = roleBadges.find((r) => r.id === roleKey);
                  if (!b) return null;
                  const Icon = b.icon;
                  return (
                    <span
                      key={b.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border ${b.color} shadow-2xs`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{b.label}</span>
                    </span>
                  );
                })}

                {/* Status Indicator Badge (Persona-Adaptive) */}
                {personaMode === "employer" ? (
                  profile.isActivelyHiring || activeListings.length > 0 ? (
                    <div
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium shadow-xs transition-all bg-sky-500/10 text-sky-400 border-sky-500/30"
                      title={isTr ? "Aktif İşe Alım Yapıyor" : "Actively Hiring"}
                    >
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-sky-400" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400" />
                      </span>
                      <span className="font-semibold">{isTr ? "Aktif İşe Alım Yapıyor" : "Actively Hiring"}</span>
                      {activeListings.length > 0 && (
                        <>
                          <span className="opacity-40">•</span>
                          <span className="opacity-90 font-mono text-[11px]">
                            {activeListings.length} {isTr ? "Açık İlan" : "Active Postings"}
                          </span>
                        </>
                      )}
                    </div>
                  ) : (
                    <div
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium shadow-xs bg-slate-500/10 text-slate-400 border-slate-500/20"
                      title={isTr ? "İşe Alım Kapalı" : "Hiring Inactive"}
                    >
                      <span className="h-2 w-2 rounded-full bg-slate-400" />
                      <span className="font-semibold">{isTr ? "İşe Alım Kapalı" : "Not Hiring"}</span>
                    </div>
                  )
                ) : personaMode === "hybrid" ? (
                  <>
                    <AvailabilityBadge
                      status={effectiveAvailabilityStatus}
                      hoursPerWeek={profile.availabilityHoursPerWeek}
                      availableFromDate={profile.availableFromDate}
                      notice={profile.availabilityNotice}
                      isStale={profile.isAvailabilityStale}
                      locale={locale}
                      variant="pill"
                      showHours={true}
                    />
                    {(profile.isActivelyHiring || activeListings.length > 0) && (
                      <div
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium shadow-xs transition-all bg-sky-500/10 text-sky-400 border-sky-500/30"
                        title={isTr ? "İşveren: Aktif İşe Alım Yapıyor" : "Client: Actively Hiring"}
                      >
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-sky-400" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400" />
                        </span>
                        <span className="font-semibold">{isTr ? "İşe Alım Yapıyor" : "Actively Hiring"}</span>
                        {activeListings.length > 0 && (
                          <>
                            <span className="opacity-40">•</span>
                            <span className="opacity-90 font-mono text-[11px]">
                              {activeListings.length} {isTr ? "İlan" : "Postings"}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <AvailabilityBadge
                    status={effectiveAvailabilityStatus}
                    hoursPerWeek={profile.availabilityHoursPerWeek}
                    availableFromDate={profile.availableFromDate}
                    notice={profile.availabilityNotice}
                    isStale={profile.isAvailabilityStale}
                    locale={locale}
                    variant="pill"
                    showHours={true}
                  />
                )}

                {isSelf && (
                  <button
                    type="button"
                    onClick={onOpenRolesModal}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] border border-dashed border-[var(--color-border-subtle)] transition-colors cursor-pointer"
                    title={isTr ? "Müsaitlik ve Rolleri Yönet" : "Manage Availability & Roles"}
                  >
                    <Pencil className="h-3 w-3" />
                    <span>{isTr ? "Müsaitliği Düzenle" : "Edit Status"}</span>
                  </button>
                )}
              </div>

              {/* Meta Row: Location, Timezone, Join Date */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-5 gap-y-2 text-xs text-[var(--color-text-secondary)] pt-2 border-t border-[var(--color-border-subtle)]/70">
                {profile.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
                    <span>
                      {profile.location.city}, {profile.location.countryCode}
                    </span>
                  </div>
                )}

                {localTime && (
                  <div className="flex items-center gap-1.5" title="Yerel Saat">
                    <Clock className="h-3.5 w-3.5 text-blue-400" />
                    <span>
                      {isTr ? "Yerel Saat:" : "Local Time:"}{" "}
                      <strong className="text-[var(--color-text-primary)] font-mono">
                        {localTime}
                      </strong>
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-[var(--color-text-tertiary)]">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {isTr ? "Üyelik:" : "Member Since:"} {formattedJoinDate}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Actions & Customization Hub */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-center sm:items-end justify-center gap-3 shrink-0 self-stretch sm:self-auto border-t lg:border-t-0 pt-4 lg:pt-0 border-[var(--color-border-subtle)]">
            {/* Primary Action Buttons */}
            <div className="relative flex items-center gap-2 w-full sm:w-auto">
              {isSelf ? (
                <>
                  <Link
                    href={isTr ? "/tr/ayarlar?tab=identity" : "/en/settings?tab=identity"}
                    className="w-full sm:w-auto"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto gap-2 border-[var(--color-border-subtle)] hover:border-blue-500/40"
                    >
                      <Sliders className="h-3.5 w-3.5 text-blue-400" />
                      <span>{isTr ? "Hesap Ayarları" : "Account Settings"}</span>
                    </Button>
                  </Link>

                  <div className="relative w-full sm:w-auto">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsCustomizeOpen(!isCustomizeOpen)}
                      className="w-full sm:w-auto gap-2 shadow-xs"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{isTr ? "Profili Özelleştir" : "Customize Profile"}</span>
                    </Button>

                    {/* Popover Menu for Self-Customization */}
                    {isCustomizeOpen && (
                      <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] shadow-2xl py-2 z-50 animate-in fade-in-50 zoom-in-95">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomizeOpen(false);
                            onOpenHeaderModal();
                          }}
                          className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] flex items-center gap-2.5 cursor-pointer transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5 text-blue-400" />
                          <span>{isTr ? "Fotoğraf, İsim & Başlık" : "Photo, Name & Headline"}</span>
                        </button>

                        {onOpenAboutModal && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomizeOpen(false);
                              onOpenAboutModal();
                            }}
                            className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] flex items-center gap-2.5 cursor-pointer transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5 text-indigo-400" />
                            <span>{isTr ? "Hakkımda & Biyografi" : "About & Bio"}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomizeOpen(false);
                            onOpenRolesModal();
                          }}
                          className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] flex items-center gap-2.5 cursor-pointer transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5 text-emerald-400" />
                          <span>{isTr ? "Müsaitlik & Roller" : "Availability & Roles"}</span>
                        </button>

                        {onOpenSkillsModal && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomizeOpen(false);
                              onOpenSkillsModal();
                            }}
                            className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] flex items-center gap-2.5 cursor-pointer transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5 text-amber-400" />
                            <span>{isTr ? "Yetenekler & Uzmanlık" : "Skills & Stack"}</span>
                          </button>
                        )}

                        {onOpenLinksModal && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomizeOpen(false);
                              onOpenLinksModal();
                            }}
                            className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] flex items-center gap-2.5 cursor-pointer transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5 text-purple-400" />
                            <span>{isTr ? "Sosyal & Portfolyo Linkleri" : "Links & Portfolio"}</span>
                          </button>
                        )}

                        <div className="my-1.5 border-t border-[var(--color-border-subtle)]" />

                        <Link
                          href={isTr ? "/tr/ayarlar" : "/en/settings"}
                          className="w-full px-4 py-2 text-left text-xs font-medium text-[var(--color-text-secondary)] hover:text-blue-400 hover:bg-[var(--color-surface-hover)] flex items-center gap-2.5 transition-colors"
                          onClick={() => setIsCustomizeOpen(false)}
                        >
                          <Sliders className="h-3.5 w-3.5" />
                          <span>{isTr ? "Tüm Ayarları Yönet" : "Manage All Settings"}</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              ) : personaMode === "employer" ? (
                activeListings.length > 0 ? (
                  <a href="#profile-tabs" className="w-full sm:w-auto">
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full sm:w-auto shadow-xs gap-2 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 text-white"
                    >
                      <Briefcase className="h-3.5 w-3.5" />
                      <span>
                        {isTr
                          ? `Açık İlanları İncele (${activeListings.length})`
                          : `View Open Postings (${activeListings.length})`}
                      </span>
                    </Button>
                  </a>
                ) : (
                  <Link
                    href={isTr ? `/tr/iletisim?to=${profile.handle}` : `/en/contact?to=${profile.handle}`}
                    className="w-full sm:w-auto"
                  >
                    <Button variant="primary" size="sm" className="w-full sm:w-auto shadow-xs gap-2">
                      <Briefcase className="h-3.5 w-3.5" />
                      <span>{isTr ? "İletişime Geç" : "Contact Client"}</span>
                    </Button>
                  </Link>
                )
              ) : personaMode === "hybrid" ? (
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {activeListings.length > 0 && (
                    <a href="#profile-tabs" className="w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto gap-1.5 border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
                      >
                        <Briefcase className="h-3.5 w-3.5" />
                        <span>
                          {isTr
                            ? `İlanları Gör (${activeListings.length})`
                            : `Postings (${activeListings.length})`}
                        </span>
                      </Button>
                    </a>
                  )}
                  <Link
                    href={isTr ? "/tr/ilanlar/yeni" : "/en/listings/new"}
                    className="w-full sm:w-auto"
                  >
                    <Button variant="primary" size="sm" className="w-full sm:w-auto shadow-xs gap-2">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{isTr ? "Projeye Davet Et" : "Invite to Project"}</span>
                    </Button>
                  </Link>
                </div>
              ) : (
                <Link href={isTr ? "/tr/ilanlar/yeni" : "/en/listings/new"} className="w-full sm:w-auto">
                  <Button variant="primary" size="sm" className="w-full sm:w-auto shadow-xs gap-2">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{isTr ? "Projeye Davet Et" : "Invite to Project"}</span>
                  </Button>
                </Link>
              )}
            </div>

            {/* Secondary Toolbar (Share, Report/Block) */}
            <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
              <ProfileShareButton locale={locale} />
              <ProfileActionsMenu
                targetUserId={profile.userId}
                targetHandle={profile.handle}
                targetDisplayName={profile.displayName}
                locale={locale}
                isSelf={isSelf}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bento Stat Strip (Unified credibility metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/60 divide-x divide-[var(--color-border-subtle)] text-center">
        <div className="p-3.5 space-y-0.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-tertiary)] block">
            {isTr ? "Güven Skoru" : "Trust Level"}
          </span>
          <span className="text-sm font-extrabold text-blue-400">
            {isTr ? "%100 Doğrulanmış" : "100% Verified"}
          </span>
        </div>
        <div className="p-3.5 space-y-0.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-tertiary)] block">
            {isTr ? "Açık İlanlar" : "Active Listings"}
          </span>
          <span className="text-sm font-extrabold text-[var(--color-text-primary)]">
            {activeListings.length}
          </span>
        </div>
        <div className="p-3.5 space-y-0.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-tertiary)] block">
            {isTr ? "Tamamlanan İş" : "Completed Projects"}
          </span>
          <span className="text-sm font-extrabold text-[var(--color-text-primary)]">
            {completedWork.length}
          </span>
        </div>
        <div className="p-3.5 space-y-0.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-tertiary)] block">
            {isTr ? "Değerlendirme & Yorum" : "Reviews & Stars"}
          </span>
          <span className="text-sm font-extrabold text-amber-400">
            {profile.reviewsSummary && profile.reviewsSummary.receivedReviewsCount > 0
              ? `★ ${profile.reviewsSummary.rawAverageRating.toFixed(1)} (${profile.reviewsSummary.receivedReviewsCount})`
              : endorsements.length > 0
                ? `${endorsements.length} ${isTr ? "Tavsiye" : "Endorsements"}`
                : isTr
                  ? "Yeni Üye"
                  : "New Member"}
          </span>
        </div>
      </div>
    </article>
  );
}
