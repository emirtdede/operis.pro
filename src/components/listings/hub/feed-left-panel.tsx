"use client";

import { useState, useRef, useEffect, type Dispatch, type SetStateAction } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Briefcase,
  Sliders,
  User,
  Tags,
  Bookmark,
  Send,
  Inbox,
  ExternalLink,
  ChevronDown,
  Check,
  LogIn,
  X,
} from "lucide-react";
import type { CategoryDto } from "@/src/modules/categories/service";
import { AvatarInitials } from "@/src/components/ui/avatar-initials";
import { Button } from "@/src/components/ui/button";
import { getLocalizedRoute } from "@/src/lib/i18n/routes";
import type { CurrentUserProfileBrief } from "./types";
import type { FeedCustomizationSettings } from "./use-feed-customization";
import type { AvailabilityStatus } from "@/src/modules/profiles/services/availability.service";

interface StatusOption {
  key: AvailabilityStatus;
  labelTr: string;
  labelEn: string;
  dotColor: string;
  textColor: string;
}

const AVAILABILITY_STATUS_OPTIONS: StatusOption[] = [
  {
    key: "AVAILABLE_NOW",
    labelTr: "Hemen Başlayabilir",
    labelEn: "Available Now",
    dotColor: "bg-emerald-400",
    textColor: "text-emerald-400",
  },
  {
    key: "FULL_TIME",
    labelTr: "Tam Zamanlı Açık",
    labelEn: "Open to Full-Time",
    dotColor: "bg-blue-400",
    textColor: "text-blue-400",
  },
  {
    key: "PARTIALLY_AVAILABLE",
    labelTr: "Yarı Zamanlı",
    labelEn: "Part-Time",
    dotColor: "bg-amber-400",
    textColor: "text-amber-400",
  },
  {
    key: "PROJECT_BASED",
    labelTr: "Proje Bazlı / Serbest",
    labelEn: "Project-Based",
    dotColor: "bg-purple-400",
    textColor: "text-purple-400",
  },
  {
    key: "ADVISORY",
    labelTr: "Danışmanlık & Mentorluk",
    labelEn: "Advisory & Mentorship",
    dotColor: "bg-indigo-400",
    textColor: "text-indigo-400",
  },
  {
    key: "VOLUNTEER",
    labelTr: "Gönüllü & Sosyal Fayda",
    labelEn: "Volunteer / Pro Bono",
    dotColor: "bg-teal-400",
    textColor: "text-teal-400",
  },
  {
    key: "INTERNSHIP",
    labelTr: "Staj & Çıraklık",
    labelEn: "Internship",
    dotColor: "bg-sky-400",
    textColor: "text-sky-400",
  },
  {
    key: "BUSY",
    labelTr: "Şu An Meşgul",
    labelEn: "Currently Busy",
    dotColor: "bg-rose-400",
    textColor: "text-rose-400",
  },
];

export interface FeedLeftPanelProps {
  currentUserProfile?: CurrentUserProfileBrief | null;
  isAuthenticated: boolean;
  categories: CategoryDto[];
  categorySlug?: string;
  basePath: string;
  searchQuery?: string;
  mode: "following" | "all";
  view: "stream" | "catalog";
  locale: string;
  isTr: boolean;
  chipLast24h?: boolean;
  setChipLast24h?: Dispatch<SetStateAction<boolean>>;
  chipFixedBudget?: boolean;
  setChipFixedBudget?: Dispatch<SetStateAction<boolean>>;
  followedCategoryIds: Set<string>;
  settings: FeedCustomizationSettings;
  onOpenCustomizationModal: () => void;
}

export function FeedLeftPanel({
  currentUserProfile,
  isAuthenticated,
  categories,
  categorySlug,
  basePath,
  searchQuery,
  mode,
  view,
  locale,
  isTr,
  followedCategoryIds,
  settings,
  onOpenCustomizationModal,
}: FeedLeftPanelProps) {
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<AvailabilityStatus>(
    currentUserProfile?.availabilityStatus || "AVAILABLE_NOW"
  );
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAvatarZoomOpen, setIsAvatarZoomOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const statusMenuRef = useRef<HTMLDivElement | null>(null);

  // Close status menu when clicking outside
  useEffect(() => {
    if (!isStatusMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setIsStatusMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isStatusMenuOpen]);

  // Close avatar zoom modal on Escape
  useEffect(() => {
    if (!isAvatarZoomOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsAvatarZoomOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAvatarZoomOpen]);

  // Status Change Handler with Optimistic UI & Settings Sync
  const handleSelectStatus = async (newStatus: AvailabilityStatus) => {
    if (newStatus === currentStatus || isUpdatingStatus) return;
    const oldStatus = currentStatus;
    setCurrentStatus(newStatus);
    setIsStatusMenuOpen(false);
    setIsUpdatingStatus(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({ availabilityStatus: newStatus }),
      });
      if (!res.ok) throw new Error("Status update failed");
    } catch {
      setCurrentStatus(oldStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Followed categories list
  const followedCategories = categories.filter((c) => followedCategoryIds.has(c.id));

  const getStatusBadge = () => {
    const found = AVAILABILITY_STATUS_OPTIONS.find((s) => s.key === currentStatus);
    if (found) {
      return {
        label: isTr ? found.labelTr : found.labelEn,
        dotColor: found.dotColor,
        textColor: found.textColor,
      };
    }
    return {
      label: isTr ? "Hemen Başlayabilir" : "Available Now",
      dotColor: "bg-emerald-400",
      textColor: "text-emerald-400",
    };
  };

  const statusBadge = getStatusBadge();

  return (
    <aside className="hidden lg:flex flex-col gap-3.5 w-[250px] xl:w-[270px] shrink-0 sticky top-20 self-start">
      {/* 1. Mini Profile & Live Availability Card (High Z-Index so popover floats above Workspace card) */}
      {settings.showProfileCard && (
        <div
          className={`rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/85 backdrop-blur-xl p-4 shadow-sm space-y-3 transition-all relative ${
            isStatusMenuOpen ? "z-40" : "z-20"
          }`}
        >
          {isAuthenticated && currentUserProfile ? (
            <>
              {/* Profile Identity Row */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAvatarZoomOpen(true)}
                  className="relative shrink-0 group block cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full"
                  title={isTr ? "Profil fotoğrafını büyüt" : "Enlarge profile photo"}
                >
                  <div className="relative w-11 h-11 rounded-full flex items-center justify-center ring-2 ring-blue-500/30 group-hover:ring-blue-500 group-hover:scale-105 transition-all">
                    <AvatarInitials
                      name={currentUserProfile.displayName}
                      size="md"
                      avatarUrl={currentUserProfile.avatarUrl}
                      className="w-11 h-11 border-0"
                    />
                    {/* Status Indicator Dot positioned cleanly on bottom-right corner */}
                    <span
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-[var(--color-surface-base)] ${statusBadge.dotColor} ${
                        currentStatus === "AVAILABLE_NOW" ? "animate-pulse" : ""
                      }`}
                    />
                  </div>
                </button>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/${locale}/u/${currentUserProfile.handle}`}
                    className="block font-bold text-xs text-[var(--color-text-primary)] hover:text-blue-400 hover:underline transition-colors truncate"
                    title={isTr ? "Profili Görüntüle" : "View Profile"}
                  >
                    {currentUserProfile.displayName}
                  </Link>
                  <Link
                    href={`/${locale}/u/${currentUserProfile.handle}`}
                    className="inline-block text-[11px] font-mono text-blue-400 hover:text-blue-300 hover:underline transition-colors truncate"
                    title={isTr ? "Profili Görüntüle" : "View Profile"}
                  >
                    @{currentUserProfile.handle}
                  </Link>
                  {currentUserProfile.headline && (
                    <p className="text-[10px] text-[var(--color-text-tertiary)] truncate mt-0.5">
                      {currentUserProfile.headline}
                    </p>
                  )}
                </div>
              </div>

              {/* In-Place Live Availability Switcher Popover */}
              <div className="relative" ref={statusMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                  disabled={isUpdatingStatus}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--color-surface-hover)]/50 hover:bg-[var(--color-surface-hover)] text-[11px] font-medium transition-colors cursor-pointer group"
                  title={isTr ? "Müsaitlik durumunu değiştir" : "Change availability status"}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${statusBadge.dotColor}`} />
                    <span className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">
                      {statusBadge.label}
                    </span>
                  </div>
                  <ChevronDown className={`h-3.5 w-3.5 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-secondary)] transition-transform duration-200 ${isStatusMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {isStatusMenuOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 rounded-2xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] shadow-2xl py-1.5 z-50 animate-in fade-in-50 zoom-in-95 max-h-72 overflow-y-auto">
                    {AVAILABILITY_STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleSelectStatus(opt.key)}
                        className="w-full px-3 py-2 text-left text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate pr-1">
                          <span className={`h-2 w-2 rounded-full shrink-0 ${opt.dotColor}`} />
                          <span className="truncate">{isTr ? opt.labelTr : opt.labelEn}</span>
                        </div>
                        {currentStatus === opt.key && <Check className="h-3.5 w-3.5 text-blue-400 shrink-0" />}
                      </button>
                    ))}

                    <div className="my-1 border-t border-[var(--color-border-subtle)]" />

                    <Link
                      href={isTr ? "/tr/ayarlar?tab=work" : "/en/settings?tab=work"}
                      className="w-full px-3 py-1.5 text-left text-[11px] text-[var(--color-text-tertiary)] hover:text-blue-400 flex items-center justify-between transition-colors"
                      onClick={() => setIsStatusMenuOpen(false)}
                    >
                      <span>{isTr ? "Çalışma Tercihlerini Düzenle" : "Edit Work Preferences"}</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Customize Panels Action Button (Replaced Profilim & Ayarlar) */}
              <div className="pt-2.5 border-t border-[var(--color-border-subtle)]">
                <button
                  type="button"
                  onClick={onOpenCustomizationModal}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[var(--color-surface-hover)]/40 hover:bg-[var(--color-surface-hover)] text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer"
                  title={isTr ? "Akış panellerini özelleştir" : "Customize feed panels"}
                >
                  <Sliders className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
                  <span>{isTr ? "Panelleri Özelleştir" : "Customize Panels"}</span>
                </button>
              </div>
            </>
          ) : (
            /* Unauthenticated Prompt */
            <div className="space-y-3 text-center">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 mx-auto w-fit">
                <LogIn className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[var(--color-text-primary)]">
                  {isTr ? "Size Özel İş Akışı" : "Create Your Custom Feed"}
                </h4>
                <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                  {isTr
                    ? "İlgi alanlarınızı belirleyin, yeni ilanları ve fırsatları anında yakalayın."
                    : "Follow your specializations and explore personalized job opportunities."}
                </p>
              </div>
              <Link href={isTr ? "/tr/giris" : "/en/login"} className="block w-full">
                <Button variant="primary" size="sm" className="w-full text-xs font-bold h-8">
                  {isTr ? "Giriş Yap / Kaydol" : "Log In / Sign Up"}
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* 2. Workspace Shortcuts (İlanlarım, Tekliflerim, Kaydedilenler) - Positioned directly below Profile Card */}
      {settings.showWorkspaceShortcuts && isAuthenticated && (
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/85 backdrop-blur-xl p-4 shadow-sm space-y-2 relative z-10">
          <h3 className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
            <Bookmark className="h-3.5 w-3.5 text-purple-400" />
            <span>{isTr ? "Çalışma Alanım" : "Workspace"}</span>
          </h3>

          <div className="space-y-0.5">
            <Link
              href={isTr ? "/tr/dashboard/listings" : "/en/dashboard/listings"}
              className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-[var(--color-text-secondary)] hover:text-blue-400 hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <Briefcase className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
              <span>{isTr ? "İlanlarım" : "My Listings"}</span>
            </Link>

            <Link
              href={isTr ? "/tr/dashboard/offers/sent" : "/en/dashboard/offers/sent"}
              className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-[var(--color-text-secondary)] hover:text-blue-400 hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <Send className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
              <span>{isTr ? "Verdiğim Teklifler" : "Sent Proposals"}</span>
            </Link>

            <Link
              href={isTr ? "/tr/dashboard/offers/received" : "/en/dashboard/offers/received"}
              className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-[var(--color-text-secondary)] hover:text-blue-400 hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <Inbox className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
              <span>{isTr ? "Gelen Teklifler" : "Received Offers"}</span>
            </Link>

            <Link
              href={isTr ? "/tr/dashboard/saved" : "/en/dashboard/saved"}
              className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-[var(--color-text-secondary)] hover:text-blue-400 hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <Bookmark className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
              <span>{isTr ? "Kaydedilenler" : "Saved Bookmarks"}</span>
            </Link>
          </div>
        </div>
      )}

      {/* 3. Followed Categories (Takip Ettiğim Alanlar) */}
      {settings.showFollowedCategories && (
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/85 backdrop-blur-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
              <Tags className="h-3.5 w-3.5 text-emerald-400" />
              <span>{isTr ? "Takip Ettiğim Alanlar" : "Followed Categories"}</span>
            </h3>

            <Link
              href={isTr ? "/tr/dashboard/categories" : "/en/dashboard/categories"}
              className="text-[11px] font-semibold text-blue-400 hover:underline flex items-center gap-1"
              title={isTr ? "Kategorileri Yönet" : "Manage Categories"}
            >
              <span>{isTr ? "Yönet" : "Manage"}</span>
            </Link>
          </div>

          {followedCategories.length > 0 ? (
            <div className="space-y-1">
              {followedCategories.slice(0, 6).map((cat) => {
                const isSelected = categorySlug === cat.slug;
                const qPart = searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : "";
                const filterUrl = `${basePath}?category=${cat.slug}${mode === "following" ? "&mode=following" : ""}${view === "catalog" ? "&view=catalog" : ""}${qPart}`;
                return (
                  <Link
                    key={cat.id}
                    href={filterUrl}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium transition-colors cursor-pointer group ${
                      isSelected
                        ? "bg-blue-500/15 text-blue-400 border border-blue-500/30 font-bold"
                        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                    }`}
                  >
                    <span className="truncate flex-1 pr-1">{cat.name}</span>
                    {typeof cat.listingCount === "number" && cat.listingCount > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] group-hover:text-blue-400">
                        {cat.listingCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-2.5 text-center space-y-2">
              <p className="text-xs text-[var(--color-text-tertiary)] leading-relaxed">
                {isTr
                  ? "İlgi duyduğunuz alanları takip ederek ana akışınızı kişiselleştirebilirsiniz."
                  : "Follow categories you're interested in to customize your main feed."}
              </p>
              <Link
                href={getLocalizedRoute("categories", locale)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:underline"
              >
                <span>{isTr ? "Kategorileri Keşfet" : "Explore Categories"}</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* 5. Customize Feed Panels Button (Shown only if top card is hidden or user unauthenticated) */}
      {(!isAuthenticated || !settings.showProfileCard) && (
        <button
          type="button"
          onClick={onOpenCustomizationModal}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/50 hover:bg-[var(--color-surface-hover)] text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer shadow-xs"
          title={isTr ? "Akış panellerini özelleştir" : "Customize feed panels"}
        >
          <Sliders className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
          <span>{isTr ? "Panelleri Özelleştir" : "Customize Panels"}</span>
        </button>
      )}

      {/* 6. Avatar Zoom / Lightbox Modal rendered at root via Portal */}
      {isMounted && isAvatarZoomOpen && currentUserProfile && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
              role="dialog"
              aria-modal="true"
              onClick={() => setIsAvatarZoomOpen(false)}
            >
              <div
                className="relative max-w-xs sm:max-w-sm w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setIsAvatarZoomOpen(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-full text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
                  aria-label={isTr ? "Kapat" : "Close"}
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Enlarged Avatar */}
                <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full overflow-hidden ring-4 ring-blue-500/30 shadow-2xl flex items-center justify-center bg-[var(--color-surface-base)] mt-1">
                  {currentUserProfile.avatarUrl ? (
                    <img
                      src={currentUserProfile.avatarUrl}
                      alt={currentUserProfile.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <AvatarInitials
                      name={currentUserProfile.displayName}
                      size="lg"
                      className="w-full h-full text-5xl font-bold border-0"
                    />
                  )}
                  {/* Status Indicator Dot on Zoomed Avatar */}
                  <span
                    className={`absolute bottom-3 right-3 h-5 w-5 rounded-full ring-4 ring-[var(--color-surface-elevated)] ${statusBadge.dotColor} ${
                      currentStatus === "AVAILABLE_NOW" ? "animate-pulse" : ""
                    }`}
                    title={statusBadge.label}
                  />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                    {currentUserProfile.displayName}
                  </h3>
                  <p className="text-xs font-mono text-blue-400">
                    @{currentUserProfile.handle}
                  </p>
                  {currentUserProfile.headline && (
                    <p className="text-xs text-[var(--color-text-tertiary)] pt-1 max-w-xs leading-relaxed">
                      {currentUserProfile.headline}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 w-full">
                  <Link
                    href={`/${locale}/u/${currentUserProfile.handle}`}
                    onClick={() => setIsAvatarZoomOpen(false)}
                    className="flex-1 h-9 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{isTr ? "Profili Görüntüle" : "View Profile"}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsAvatarZoomOpen(false)}
                    className="flex-1 h-9 px-3 rounded-xl border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)] text-xs font-medium text-[var(--color-text-secondary)] transition-colors cursor-pointer flex items-center justify-center"
                  >
                    {isTr ? "Kapat" : "Close"}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </aside>
  );
}
