"use client";

import Link from "next/link";
import {
  MapPin,
  ShieldCheck,
  Pencil,
  Plus,
  Calendar,
} from "lucide-react";
import { AvatarInitials } from "@/src/components/ui/avatar-initials";
import { Button } from "@/src/components/ui/button";
import { ProfileShareButton } from "@/src/components/profile/profile-share-button";
import { ProfileActionsMenu } from "@/src/components/profile/profile-actions-menu";
import { PublicProfileDto } from "@/src/modules/profiles/service";
import { AvailabilityBadge } from "../availability-badge";
import { VerifiedCompanyBadge } from "@/src/components/ui/verified-company-badge";
import { getRoleBadges } from "./types";

export interface PublicProfileHeroProps {
  profile: PublicProfileDto;
  locale: string;
  isSelf: boolean;
  onOpenHeaderModal: () => void;
  onOpenRolesModal: () => void;
}

function renderAvailabilityIndicator(
  availabilityStatus: string | null | undefined,
  isAvailableForHire: boolean | null | undefined,
  isTr: boolean
) {
  if (availabilityStatus === "AVAILABLE_NOW") {
    return (
      <span
        className="absolute bottom-2 right-2 h-4 w-4 rounded-full bg-emerald-500 ring-3 ring-[var(--color-surface-base)] shadow-md animate-pulse"
        title={isTr ? "Hemen Başlayabilir" : "Available Now"}
      />
    );
  }
  if (availabilityStatus === "PARTIALLY_AVAILABLE") {
    return (
      <span
        className="absolute bottom-2 right-2 h-4 w-4 rounded-full bg-amber-500 ring-3 ring-[var(--color-surface-base)] shadow-md"
        title={isTr ? "Kısmi Zamanlı Müsait" : "Partially Available"}
      />
    );
  }
  if (availabilityStatus === "BUSY") {
    return (
      <span
        className="absolute bottom-2 right-2 h-4 w-4 rounded-full bg-rose-500 ring-3 ring-[var(--color-surface-base)] shadow-md"
        title={isTr ? "Şu An Meşgul" : "Currently Busy"}
      />
    );
  }
  if (isAvailableForHire) {
    return (
      <span
        className="absolute bottom-2 right-2 h-4 w-4 rounded-full bg-emerald-500 ring-3 ring-[var(--color-surface-base)] shadow-md animate-pulse"
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
}: PublicProfileHeroProps) {
  const isTr = locale === "tr";
  const roleBadges = getRoleBadges(isTr);
  const currentRoles = (profile.roles || []).filter(Boolean);
  const activeListings = profile.activeListings || [];
  const completedWork = profile.completedWork || [];
  const endorsements = profile.endorsements || [];

  const joinDate = profile.createdAt ? new Date(profile.createdAt) : new Date("2026-01-01");
  const formattedJoinDate = new Intl.DateTimeFormat(isTr ? "tr-TR" : "en-US", {
    year: "numeric",
    month: "long",
  }).format(joinDate);

  let availabilityFallbackStatus: "AVAILABLE_NOW" | "BUSY" = "BUSY";
  if (profile.isAvailableForHire) {
    availabilityFallbackStatus = "AVAILABLE_NOW";
  }
  const effectiveAvailabilityStatus = profile.availabilityStatus || availabilityFallbackStatus;

  return (
    <article className="relative overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-xl shadow-xl">
      {/* Cover Canvas / Mesh Gradient Banner */}
      <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40 border-b border-[var(--color-border-subtle)]">
        {/* Ambient SVG pattern overlay */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />
        {/* Subtle Glows */}
        <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

        {/* Quick self-edit banner action */}
        {isSelf && (
          <button
            type="button"
            onClick={onOpenHeaderModal}
            className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/10 text-xs font-semibold text-white/90 transition-all cursor-pointer shadow-sm"
            title={isTr ? "Profil Tanıtımını Düzenle" : "Edit Profile Intro"}
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>{isTr ? "Profili Düzenle" : "Edit Profile"}</span>
          </button>
        )}
      </div>

      {/* Profile Details (Overlapping avatar) */}
      <div className="relative px-6 sm:px-10 pb-8 pt-0">
        {/* Avatar Row */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-5">
          <div className="relative inline-block">
            <div className="rounded-full p-1.5 bg-[var(--color-surface-base)] ring-2 ring-[var(--color-border-subtle)] shadow-2xl inline-block">
              <AvatarInitials
                name={profile.displayName}
                size="lg"
                avatarUrl={profile.avatarUrl}
              />
            </div>
            {/* Online / Active status pulse */}
            {renderAvailabilityIndicator(profile.availabilityStatus, profile.isAvailableForHire, isTr)}
          </div>

          {/* Actions Toolbar */}
          <div className="flex items-center gap-2.5 self-start sm:self-end">
            <ProfileShareButton locale={locale} />
            <ProfileActionsMenu
              targetUserId={profile.userId}
              targetHandle={profile.handle}
              targetDisplayName={profile.displayName}
              locale={locale}
              isSelf={isSelf}
            />
            {!isSelf && (
              <Link href={isTr ? "/tr/ilanlar/yeni" : "/en/listings/new"}>
                <Button variant="primary" size="sm" className="shadow-xs">
                  <span>{isTr ? "Projeye Davet Et" : "Invite to Project"}</span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Name & Headline */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
              {profile.displayName}
            </h1>
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
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                <span>{isTr ? "Doğrulanmış" : "Verified"}</span>
              </span>
            )}
            {isSelf && (
              <button
                type="button"
                onClick={onOpenHeaderModal}
                className="p-1 rounded-lg text-[var(--color-text-tertiary)] hover:text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
                title={isTr ? "Başlığı Düzenle" : "Edit Headline"}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-blue-400">
            <span>@{profile.handle}</span>
          </div>

          {/* Headline / Tagline */}
          {profile.headline && (
            <p className="text-sm font-medium text-[var(--color-text-primary)] leading-relaxed max-w-2xl pt-0.5">
              {profile.headline}
            </p>
          )}
          {!profile.headline && isSelf && (
            <button
              type="button"
              onClick={onOpenHeaderModal}
              className="text-xs text-[var(--color-text-tertiary)] hover:text-blue-400 transition-colors italic flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isTr ? "+ Mesleki unvan / pozisyon ekleyin (örn: Kıdemli Full-Stack Mimar)" : "+ Add headline"}</span>
            </button>
          )}

          {/* Persona & Status Badges Row */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {/* Dynamic Role Badges */}
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

            {/* Status Indicator Badges */}
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

            {profile.isActivelyHiring && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border border-sky-500/30 bg-sky-500/10 text-sky-400 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
                <span>{isTr ? "Aktif İlanları Var" : "Actively Hiring"}</span>
              </span>
            )}

            {isSelf && (
              <button
                type="button"
                onClick={onOpenRolesModal}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] border border-dashed border-[var(--color-border-subtle)] transition-colors cursor-pointer"
                title={isTr ? "Rolleri Düzenle" : "Edit Roles"}
              >
                <Pencil className="h-3 w-3" />
                <span>{isTr ? "Rolleri Yönet" : "Manage Roles"}</span>
              </button>
            )}
          </div>

          {/* Meta Attributes (Location, Registration) */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--color-text-secondary)] pt-3 border-t border-[var(--color-border-subtle)]/70">
            {profile.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
                <span>
                  {profile.location.city}, {profile.location.countryCode}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[var(--color-text-tertiary)]">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {isTr ? "Üyelik:" : "Joined:"} {formattedJoinDate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/60 divide-x divide-[var(--color-border-subtle)] text-center">
        <div className="p-3.5 space-y-0.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-tertiary)] block">
            {isTr ? "Güvenilirlik" : "Trust Level"}
          </span>
          <span className="text-sm font-extrabold text-blue-400">
            {isTr ? "%100 Doğrulanmış" : "Verified 100%"}
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
            {isTr ? "Tamamlanan İş" : "Completed"}
          </span>
          <span className="text-sm font-extrabold text-[var(--color-text-primary)]">
            {completedWork.length}
          </span>
        </div>
        <div className="p-3.5 space-y-0.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-tertiary)] block">
            {isTr ? "Tavsiye Mektubu" : "Endorsements"}
          </span>
          <span className="text-sm font-extrabold text-amber-400">
            {endorsements.length}
          </span>
        </div>
      </div>
    </article>
  );
}
