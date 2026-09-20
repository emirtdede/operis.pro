"use client";

import { BookmarkCheck } from "lucide-react";
import { Button } from "../ui/button";

export interface CategoryMetaBarProps {
  filteredCategoriesCount: number;
  filteredListingCount: number;
  followedCount: number;
  isLoading: boolean;
  isTr: boolean;
  onFollowAll: () => void;
  onUnfollowAll: () => void;
}

export function CategoryMetaBar({
  filteredCategoriesCount,
  filteredListingCount,
  followedCount,
  isLoading,
  isTr,
  onFollowAll,
  onUnfollowAll,
}: CategoryMetaBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 text-xs -mt-2">
      {/* Sol: Canlı İlan ve Uzmanlık Sayacı */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="flex items-center gap-2 text-[var(--color-text-secondary)] font-medium"
      >
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
        <span>
          <strong className="font-bold text-[var(--color-text-primary)]">
            {filteredCategoriesCount}
          </strong>{" "}
          {isTr ? "uzmanlık" : "specializations"}
        </span>
        <span className="opacity-40">•</span>
        <span>
          <strong className="font-bold text-blue-600 dark:text-blue-400">
            {filteredListingCount}
          </strong>{" "}
          {isTr ? "aktif ilan listeleniyor" : "active listings"}
        </span>
      </div>

      {/* Sağ: Takip Durumu & Toplu Aksiyonlar */}
      <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
        <div className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
          <BookmarkCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          <span>
            <strong className="font-semibold text-[var(--color-text-primary)]">
              {followedCount}
            </strong>{" "}
            {isTr ? "takip ediliyor" : "followed"}
          </span>
        </div>

        <div className="h-3.5 w-px bg-[var(--color-border-subtle)] hidden sm:block" />

        <div className="flex items-center gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={onFollowAll}
            disabled={isLoading}
            className="h-7 px-2.5 text-xs font-medium"
          >
            {isTr ? "Tümünü Takip Et" : "Follow All"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onUnfollowAll}
            disabled={isLoading}
            className="h-7 px-2.5 text-xs text-[var(--color-text-tertiary)] hover:text-red-400 font-medium"
          >
            {isTr ? "Tümünü Bırak" : "Unfollow All"}
          </Button>
        </div>
      </div>
    </div>
  );
}
