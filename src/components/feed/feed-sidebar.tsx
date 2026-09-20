"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Clock,
  ShieldCheck,
  Lock,
  Plus,
  BookmarkCheck,
  ArrowRight,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import { CategoryDto } from "@/src/modules/categories/service";
import { getLocalizedRoute } from "@/src/lib/i18n/routes";

export interface FeedSidebarProps {
  categories: CategoryDto[];
  locale: string;
  initialFollowedCategoryIds?: string[];
  onToggleCategoryFollow?: (categoryId: string) => Promise<void> | void;
}

function getFollowCategoryButtonTitle(isFollowed: boolean, isTr: boolean): string {
  if (isFollowed) {
    return isTr ? "Takipten çık" : "Unfollow";
  }
  return isTr ? "Kategoriyi takip et" : "Follow";
}

export function FeedSidebar({
  categories,
  locale,
  initialFollowedCategoryIds = [],
  onToggleCategoryFollow,
}: FeedSidebarProps) {
  const isTr = locale === "tr";
  const [followedIds, setFollowedIds] = useState<Set<string>>(
    new Set(initialFollowedCategoryIds)
  );
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const popularCategories = categories.slice(0, 6);

  const handleToggle = async (catId: string) => {
    if (pendingIds.has(catId)) return;
    const isFollowed = followedIds.has(catId);

    // Optimistic update
    const updated = new Set(followedIds);
    if (isFollowed) {
      updated.delete(catId);
    } else {
      updated.add(catId);
    }
    setFollowedIds(updated);

    // Notify parent stream if callback provided
    if (onToggleCategoryFollow) {
      onToggleCategoryFollow(catId);
    }

    setPendingIds((prev) => new Set(prev).add(catId));
    try {
      await fetch("/api/categories/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: catId,
          action: isFollowed ? "unfollow" : "follow",
        }),
      });
    } catch {
      // Revert on failure
      setFollowedIds(followedIds);
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(catId);
        return next;
      });
    }
  };

  return (
    <aside className="w-80 shrink-0 hidden lg:flex flex-col gap-6 sticky top-24 self-start">
      {/* 1. Freshness Radar & Trust Card */}
      <div className="rounded-3xl border border-blue-500/20 bg-blue-500/5 backdrop-blur-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)]">
          <Clock className="h-4 w-4 text-blue-400" />
          <span>{isTr ? "7 Günlük Canlılık Radarı" : "7-Day Freshness Radar"}</span>
        </div>

        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          {isTr
            ? "Akıştaki tüm ilanlar en fazla 1 hafta önce yayınlanmış veya yenilenmiştir. Yanıt alamayacağınız eski veya pasif işler akışta yer almaz."
            : "All listings in this feed were published or reactivated within the last week. No dead or expired postings."}
        </p>

        <div className="space-y-2 pt-1 border-t border-blue-500/15 text-xs">
          <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{isTr ? "%0 Komisyon — Ücret kesintisi yok" : "0% Commission — Direct deals"}</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
            <Lock className="h-4 w-4 text-indigo-400 shrink-0" />
            <span>{isTr ? "AES-256 Şifreli Doğrudan Teklif" : "AES-256 Encrypted proposals"}</span>
          </div>
        </div>
      </div>

      {/* 2. Recommended Categories to Follow */}
      <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)]">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <span>{isTr ? "Önerilen Kategoriler" : "Suggested Categories"}</span>
          </div>
          <Link
            href={getLocalizedRoute("categories", locale)}
            className="text-[11px] font-semibold text-blue-500 hover:text-blue-400 flex items-center gap-0.5 transition-colors"
          >
            <span>{isTr ? "Tümü" : "All"}</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <p className="text-xs text-[var(--color-text-tertiary)]">
          {isTr
            ? "İlginizi çeken kategorileri takip ederek akışınızı kişiselleştirin."
            : "Follow categories to curate your personal activity stream."}
        </p>

        <div className="space-y-2.5 pt-1">
          {popularCategories.map((cat) => {
            const isFollowed = followedIds.has(cat.id);
            const isPending = pendingIds.has(cat.id);

            return (
              <div
                key={cat.id}
                className="flex items-center justify-between gap-3 p-2 rounded-2xl hover:bg-[var(--color-surface-hover)] transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate group-hover:text-blue-400 transition-colors">
                    {cat.name}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-tertiary)]">
                    {cat.listingCount ?? 0} {isTr ? "aktif ilan" : "active"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle(cat.id)}
                  disabled={isPending}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                    isFollowed
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/25"
                      : "bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] hover:bg-blue-500/10 hover:text-blue-400 border border-[var(--color-border-subtle)]"
                  }`}
                  title={getFollowCategoryButtonTitle(isFollowed, isTr)}
                >
                  {isFollowed ? (
                    <>
                      <BookmarkCheck className="h-3.5 w-3.5" />
                      <span>{isTr ? "Takipte" : "Following"}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      <span>{isTr ? "Takip Et" : "Follow"}</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Quick Tips */}
      <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/50 backdrop-blur-xl p-5 space-y-2 text-xs text-[var(--color-text-secondary)] shadow-sm">
        <div className="flex items-center gap-2 font-bold text-[var(--color-text-primary)]">
          <Lightbulb className="h-4 w-4 text-amber-400 shrink-0" />
          <span>{isTr ? "İpucu" : "Tip"}</span>
        </div>
        <p className="leading-relaxed text-[11px] text-[var(--color-text-tertiary)]">
          {isTr
            ? "Teklif verirken detaylı teslimat planı ve geçmiş referanslarınızı eklemek kabul şansınızı 2 katına çıkarır."
            : "Adding milestone deliverables and past work references doubles proposal acceptance rates."}
        </p>
      </div>
    </aside>
  );
}
