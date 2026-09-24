"use client";

import Link from "next/link";
import {
  TrendingUp,
  Sparkles,
  ArrowRight,
  Check,
  Plus,
  PlusCircle,
  Zap,
} from "lucide-react";
import type { CategoryDto } from "@/src/modules/categories/service";
import type { FeedListingItem } from "@/src/modules/listings/feed/service";
import { Button } from "@/src/components/ui/button";
import { getLocalizedRoute } from "@/src/lib/i18n/routes";
import { recordUserAffinity } from "@/src/lib/recommendations/user-affinity";
import { useUserAffinityRecommendations } from "./use-user-affinity-recommendations";
import { TrendingTagItem, getTrendTagBadgeLabel } from "./types";
import type { FeedCustomizationSettings } from "./use-feed-customization";

export interface FeedRightPanelProps {
  isTr: boolean;
  locale: string;
  basePath: string;
  trendingTags: TrendingTagItem[];
  categories: CategoryDto[];
  followedCategoryIds: Set<string>;
  handleToggleCategoryFollow: (categoryId: string) => Promise<void>;
  totalItemsCount: number;
  settings: FeedCustomizationSettings;
  listings?: FeedListingItem[];
}

export function FeedRightPanel({
  isTr,
  locale,
  basePath,
  trendingTags,
  categories,
  followedCategoryIds,
  handleToggleCategoryFollow,
  settings,
  listings = [],
}: FeedRightPanelProps) {
  // Personalized category recommendation engine based on user affinity & cosine similarity
  // Absolutely ZERO hardcoded fallback or arbitrary mock slicing!
  const suggestedCategories = useUserAffinityRecommendations({
    categories,
    listings,
    followedCategoryIds,
    limit: 5,
  });

  return (
    <aside className="hidden xl:flex flex-col gap-3.5 w-[290px] xl:w-[310px] shrink-0 sticky top-20 self-start">
      {/* 1. Publish Listing Action Card (Projeniz mi Var? - Positioned at the very top) */}
      {settings.showPublishCta && (
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-gradient-to-br from-blue-500/10 via-[var(--color-surface-base)] to-purple-500/10 backdrop-blur-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-blue-400">
            <Zap className="h-4 w-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              {isTr ? "Projeniz mi Var?" : "Need Developers?"}
            </h3>
          </div>

          <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
            {isTr
              ? "Ücretsiz ilan oluşturun, gizli ve komisyonsuz teklifler alarak doğrudan eşleşin."
              : "Post your requirements for free and receive commission-free proposals directly."}
          </p>

          <Link href={getLocalizedRoute("newListing", locale)} className="block w-full">
            <Button
              variant="shimmer"
              className="w-full h-9 rounded-2xl font-bold text-xs gap-1.5 shadow-md shadow-blue-500/20"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>{isTr ? "Hemen İlan Yayınla" : "Publish Listing Now"}</span>
            </Button>
          </Link>
        </div>
      )}

      {/* 2. Trending Technologies (#Tags) - Real interaction & search-based time decay */}
      {settings.showTrendingTech && (
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/85 backdrop-blur-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
              <span>{isTr ? "Gündemdeki Teknolojiler" : "Trending Tech"}</span>
            </h3>

            <span className="text-[10px] text-[var(--color-text-tertiary)]">
              {isTr ? "Piyasa Nabzı" : "Market Pulse"}
            </span>
          </div>

          {trendingTags.length > 0 ? (
            <div className="space-y-1">
              {trendingTags.map((t, idx) => (
                <Link
                  key={t.tag}
                  href={`${basePath}?q=${encodeURIComponent(t.tag)}`}
                  onClick={() => {
                    recordUserAffinity({
                      type: "click_tag",
                      tags: [t.tag],
                    });
                  }}
                  className="flex items-center justify-between p-2 rounded-2xl hover:bg-[var(--color-surface-hover)] transition-colors group cursor-pointer"
                  title={`${t.tag} (${t.category})`}
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-xs font-bold text-[var(--color-text-primary)] group-hover:text-blue-400 transition-colors">
                      #{t.tag}
                    </span>
                    <p className="text-[10px] text-[var(--color-text-tertiary)] truncate">
                      {t.category}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20 shrink-0">
                    {getTrendTagBadgeLabel(idx, isTr)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-[var(--color-text-tertiary)] py-1">
              {isTr ? "Henüz aktif teknoloji etiketi bulunmuyor." : "No active tech tags yet."}
            </p>
          )}
        </div>
      )}

      {/* 3. Suggested Categories with 1-Click Follow - Personalized by user affinity */}
      {settings.showSuggestedCategories && (
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/85 backdrop-blur-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>{isTr ? "Önerilen Alanlar" : "Suggested Areas"}</span>
            </h3>

            <Link
              href={getLocalizedRoute("categories", locale)}
              className="text-[11px] font-semibold text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{isTr ? "Tümü" : "All"}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {suggestedCategories.length > 0 ? (
            <div className="space-y-1.5">
              {suggestedCategories.map((cat) => {
                const isFollowed = followedCategoryIds.has(cat.id);
                return (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between gap-2 p-1.5 px-2 rounded-2xl hover:bg-surface/60 transition-colors"
                  >
                    <Link
                      href={`${basePath}?category=${cat.slug}`}
                      onClick={() => {
                        recordUserAffinity({
                          type: "click_listing",
                          categorySlug: cat.slug,
                        });
                      }}
                      className="min-w-0 flex-1 group"
                    >
                      <div className="text-xs font-medium text-[var(--color-text-primary)] group-hover:text-blue-400 transition-colors truncate">
                        {cat.name}
                      </div>
                      <div className="text-[10px] text-[var(--color-text-tertiary)]">
                        {isTr ? "Uzmanlık Alanı" : "Specialization"}
                      </div>
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleToggleCategoryFollow(cat.id)}
                      className={`shrink-0 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                        isFollowed
                          ? "bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
                          : "bg-surface text-[var(--color-text-secondary)] hover:bg-blue-500/10 hover:text-blue-400 border border-[var(--color-border-subtle)]"
                      }`}
                    >
                      {isFollowed ? (
                        <>
                          <Check className="h-3 w-3 text-blue-400" />
                          <span>{isTr ? "Takipte" : "Following"}</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3" />
                          <span>{isTr ? "Takip Et" : "Follow"}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[11px] text-[var(--color-text-tertiary)] py-1">
              {isTr ? "Tüm kategoriler takip ediliyor." : "All categories are followed."}
            </p>
          )}
        </div>
      )}
    </aside>
  );
}
