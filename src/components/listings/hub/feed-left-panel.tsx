"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import Link from "next/link";
import {
  Flame,
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
  SlidersHorizontal,
} from "lucide-react";
import type { CategoryDto } from "@/src/modules/categories/service";
import { AvatarInitials } from "@/src/components/ui/avatar-initials";
import { Button } from "@/src/components/ui/button";
import { getLocalizedRoute } from "@/src/lib/i18n/routes";
import type { CurrentUserProfileBrief } from "./types";
import type { FeedCustomizationSettings } from "./use-feed-customization";

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
  chipLast24h: boolean;
  setChipLast24h: Dispatch<SetStateAction<boolean>>;
  chipFixedBudget: boolean;
  setChipFixedBudget: Dispatch<SetStateAction<boolean>>;
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
  chipLast24h,
  setChipLast24h,
  chipFixedBudget,
  setChipFixedBudget,
  followedCategoryIds,
  settings,
  onOpenCustomizationModal,
}: FeedLeftPanelProps) {
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<"AVAILABLE_NOW" | "PARTIALLY_AVAILABLE" | "BUSY">(
    currentUserProfile?.availabilityStatus || "AVAILABLE_NOW"
  );
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Status Change Handler with Optimistic UI & Settings Sync
  const handleSelectStatus = async (newStatus: "AVAILABLE_NOW" | "PARTIALLY_AVAILABLE" | "BUSY") => {
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
    switch (currentStatus) {
      case "AVAILABLE_NOW":
        return {
          label: isTr ? "Hemen Başlayabilir" : "Available Now",
          dotColor: "bg-emerald-400",
          textColor: "text-emerald-400",
          bg: "bg-emerald-500/10 border-emerald-500/25",
        };
      case "PARTIALLY_AVAILABLE":
        return {
          label: isTr ? "Kısmi Zamanlı" : "Partially Available",
          dotColor: "bg-amber-400",
          textColor: "text-amber-400",
          bg: "bg-amber-500/10 border-amber-500/25",
        };
      case "BUSY":
        return {
          label: isTr ? "Şu An Meşgul" : "Currently Busy",
          dotColor: "bg-rose-400",
          textColor: "text-rose-400",
          bg: "bg-rose-500/10 border-rose-500/25",
        };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <aside className="hidden lg:flex flex-col gap-3.5 w-[250px] xl:w-[270px] shrink-0 sticky top-20 self-start">
      {/* 1. Mini Profile & Live Availability Card */}
      {settings.showProfileCard && (
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/85 backdrop-blur-xl p-4 shadow-sm space-y-3.5 transition-all">
          {isAuthenticated && currentUserProfile ? (
            <>
              {/* Profile Identity Row */}
              <div className="flex items-start gap-3">
                <Link
                  href={`/${locale}/u/${currentUserProfile.handle}`}
                  className="relative shrink-0 group block"
                  title={isTr ? "Profili Görüntüle" : "View Profile"}
                >
                  <div className="rounded-2xl overflow-hidden ring-2 ring-blue-500/30 group-hover:ring-blue-500 transition-all">
                    <AvatarInitials
                      name={currentUserProfile.displayName}
                      size="md"
                      avatarUrl={currentUserProfile.avatarUrl}
                    />
                  </div>
                  {/* Status Indicator Dot */}
                  <span
                    className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full ring-2 ring-[var(--color-surface-base)] ${statusBadge.dotColor} ${
                      currentStatus === "AVAILABLE_NOW" ? "animate-pulse" : ""
                    }`}
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/${locale}/u/${currentUserProfile.handle}`}
                    className="block font-bold text-xs text-[var(--color-text-primary)] hover:text-blue-400 transition-colors truncate"
                  >
                    {currentUserProfile.displayName}
                  </Link>
                  <p className="text-[11px] font-mono text-blue-400 truncate">
                    @{currentUserProfile.handle}
                  </p>
                  {currentUserProfile.headline && (
                    <p className="text-[10px] text-[var(--color-text-tertiary)] truncate mt-0.5">
                      {currentUserProfile.headline}
                    </p>
                  )}
                </div>
              </div>

              {/* In-Place Live Availability Switcher Popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                  disabled={isUpdatingStatus}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${statusBadge.bg}`}
                  title={isTr ? "Müsaitlik durumunu değiştir" : "Change availability status"}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className={`h-2 w-2 rounded-full ${statusBadge.dotColor}`} />
                    <span className={statusBadge.textColor}>{statusBadge.label}</span>
                  </div>
                  <ChevronDown className={`h-3.5 w-3.5 text-[var(--color-text-tertiary)] transition-transform ${isStatusMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {isStatusMenuOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 rounded-2xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] shadow-2xl py-1.5 z-30 animate-in fade-in-50 zoom-in-95">
                    <button
                      type="button"
                      onClick={() => handleSelectStatus("AVAILABLE_NOW")}
                      className="w-full px-3 py-1.5 text-left text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        <span>{isTr ? "Hemen Başlayabilir" : "Available Now"}</span>
                      </div>
                      {currentStatus === "AVAILABLE_NOW" && <Check className="h-3 w-3 text-emerald-400" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectStatus("PARTIALLY_AVAILABLE")}
                      className="w-full px-3 py-1.5 text-left text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        <span>{isTr ? "Kısmi Zamanlı" : "Partially Available"}</span>
                      </div>
                      {currentStatus === "PARTIALLY_AVAILABLE" && <Check className="h-3 w-3 text-amber-400" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectStatus("BUSY")}
                      className="w-full px-3 py-1.5 text-left text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-rose-400" />
                        <span>{isTr ? "Şu An Meşgul" : "Currently Busy"}</span>
                      </div>
                      {currentStatus === "BUSY" && <Check className="h-3 w-3 text-rose-400" />}
                    </button>

                    <div className="my-1 border-t border-[var(--color-border-subtle)]" />

                    <Link
                      href={isTr ? "/tr/ayarlar?tab=work" : "/en/settings?tab=work"}
                      className="w-full px-3 py-1 text-left text-[11px] text-[var(--color-text-tertiary)] hover:text-blue-400 flex items-center justify-between"
                      onClick={() => setIsStatusMenuOpen(false)}
                    >
                      <span>{isTr ? "Detaylı Çalışma Ayarları" : "Detailed Work Settings"}</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Quick Navigation into Profile & Account Settings */}
              <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-[var(--color-border-subtle)]/70">
                <Link
                  href={`/${locale}/u/${currentUserProfile.handle}`}
                  className="px-2 py-1.5 rounded-xl text-center text-[11px] font-semibold text-[var(--color-text-secondary)] hover:text-blue-400 hover:bg-surface transition-colors border border-[var(--color-border-subtle)] flex items-center justify-center gap-1"
                >
                  <User className="h-3 w-3" />
                  <span>{isTr ? "Profilim" : "My Profile"}</span>
                </Link>

                <Link
                  href={isTr ? "/tr/ayarlar?tab=identity" : "/en/settings?tab=identity"}
                  className="px-2 py-1.5 rounded-xl text-center text-[11px] font-semibold text-[var(--color-text-secondary)] hover:text-blue-400 hover:bg-surface transition-colors border border-[var(--color-border-subtle)] flex items-center justify-center gap-1"
                >
                  <Sliders className="h-3.5 w-3.5" />
                  <span>{isTr ? "Ayarlar" : "Settings"}</span>
                </Link>
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
                  {isTr ? "Kişisel Akışınızı Oluşturun" : "Create Your Custom Feed"}
                </h4>
                <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                  {isTr
                    ? "İlgi duyduğunuz kategorileri takip edin ve doğrudan teklif sunun."
                    : "Follow your specializations and submit direct proposals."}
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

      {/* 2. Followed Categories (Takip Ettiğim Kategoriler) */}
      {settings.showFollowedCategories && (
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/85 backdrop-blur-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-1.5">
              <Tags className="h-3.5 w-3.5 text-emerald-400" />
              <span>{isTr ? "Takip Ettiğim Alanlar" : "Followed Specializations"}</span>
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
            <div className="py-2 text-center space-y-2">
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                {isTr ? "Henüz uzmanlık alanı takip etmediniz." : "You haven't followed any categories yet."}
              </p>
              <Link
                href={getLocalizedRoute("categories", locale)}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 hover:underline"
              >
                <span>{isTr ? "Alanları Keşfet" : "Discover Categories"}</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* 3. Smart Quick Filter Chips */}
      {settings.showQuickFilters && (
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/85 backdrop-blur-xl p-4 shadow-sm space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-amber-400" />
            <span>{isTr ? "Hızlı Filtreler" : "Quick Filters"}</span>
          </h3>

          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => setChipLast24h((prev) => !prev)}
              aria-pressed={chipLast24h}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer border ${
                chipLast24h
                  ? "bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-2xs font-bold"
                  : "bg-surface/50 border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:bg-surface hover:text-[var(--color-text-primary)]"
              }`}
            >
              <div className="flex items-center gap-2">
                <Flame className={`h-3.5 w-3.5 ${chipLast24h ? "text-amber-400" : "text-[var(--color-text-tertiary)]"}`} />
                <span>{isTr ? "Son 24 Saat (Taze)" : "Last 24 Hours"}</span>
              </div>
              <span className="text-[10px] font-mono opacity-70">24h</span>
            </button>

            <button
              type="button"
              onClick={() => setChipFixedBudget((prev) => !prev)}
              aria-pressed={chipFixedBudget}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer border ${
                chipFixedBudget
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-2xs font-bold"
                  : "bg-surface/50 border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:bg-surface hover:text-[var(--color-text-primary)]"
              }`}
            >
              <div className="flex items-center gap-2">
                <Briefcase className={`h-3.5 w-3.5 ${chipFixedBudget ? "text-emerald-400" : "text-[var(--color-text-tertiary)]"}`} />
                <span>{isTr ? "Bütçesi Belirli" : "Specific Budget"}</span>
              </div>
              <span className="text-[10px] font-mono opacity-70">TRY</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Workspace Shortcuts (İlanlarım, Tekliflerim, Kaydedilenler) */}
      {settings.showWorkspaceShortcuts && isAuthenticated && (
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/85 backdrop-blur-xl p-4 shadow-sm space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-1.5">
            <Bookmark className="h-3.5 w-3.5 text-purple-400" />
            <span>{isTr ? "Çalışma Alanım" : "Workspace"}</span>
          </h3>

          <div className="space-y-1">
            <Link
              href={isTr ? "/tr/dashboard/listings" : "/en/dashboard/listings"}
              className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-[var(--color-text-secondary)] hover:text-blue-400 hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <Briefcase className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
              <span>{isTr ? "Aktif İlanlarım" : "My Listings"}</span>
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
              <span>{isTr ? "Kaydedilen İlanlar" : "Saved Bookmarks"}</span>
            </Link>
          </div>
        </div>
      )}

      {/* 5. Customize Feed Panels Button */}
      <button
        type="button"
        onClick={onOpenCustomizationModal}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border border-dashed border-[var(--color-border-subtle)] text-xs font-semibold text-[var(--color-text-tertiary)] hover:text-blue-400 hover:border-blue-500/40 hover:bg-[var(--color-surface-hover)] transition-all cursor-pointer"
        title={isTr ? "Akış panellerini özelleştir" : "Customize feed panels"}
      >
        <Sliders className="h-3.5 w-3.5" />
        <span>{isTr ? "Akışı Özelleştir" : "Customize Feed"}</span>
      </button>
    </aside>
  );
}
