import Link from "next/link";
import { TrendingUp, Sparkles, ArrowRight, Check, Plus } from "lucide-react";
import type { CategoryDto } from "@/src/modules/categories/service";
import { getLocalizedRoute } from "@/src/lib/i18n/routes";
import { TrendingTagItem, getTrendTagBadgeLabel } from "./types";

export interface ListingsDiscoverySidebarProps {
  isTr: boolean;
  locale: string;
  basePath: string;
  trendingTags: TrendingTagItem[];
  categories: CategoryDto[];
  followedCategoryIds: Set<string>;
  handleToggleCategoryFollow: (categoryId: string) => Promise<void>;
}

export function ListingsDiscoverySidebar({
  isTr,
  locale,
  basePath,
  trendingTags,
  categories,
  followedCategoryIds,
  handleToggleCategoryFollow,
}: ListingsDiscoverySidebarProps) {
  return (
    <aside className="hidden xl:flex flex-col gap-4 w-[310px] xl:w-[330px] shrink-0 sticky top-20">
      {/* Trending Technologies Widget */}
      <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-surface/75 backdrop-blur-xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
            <span>{isTr ? "Gündemdeki Teknolojiler" : "Trending Tech"}</span>
          </h2>
        </div>

        <div className="space-y-1">
          {trendingTags.map((t, idx) => (
            <Link
              key={t.tag}
              href={`${basePath}?q=${encodeURIComponent(t.tag)}`}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-surface/80 transition-colors group cursor-pointer"
            >
              <div className="min-w-0">
                <span className="text-xs font-semibold text-[var(--color-text-primary)] group-hover:text-blue-600 dark:group-hover:text-sky-300 transition-colors">
                  #{t.tag}
                </span>
                <p className="text-[10px] text-[var(--color-text-tertiary)] truncate">
                  {t.category}
                </p>
              </div>
              <span className="text-[10px] font-medium text-sky-400/90 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 shrink-0">
                {getTrendTagBadgeLabel(idx, isTr)}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Suggested Categories to Follow Card */}
      <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-surface/75 backdrop-blur-xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
            <span>{isTr ? "Önerilen Kategoriler" : "Suggested Categories"}</span>
          </h2>

          <Link
            href={getLocalizedRoute("categories", locale)}
            className="text-[11px] font-semibold text-blue-600 dark:text-sky-400 hover:underline transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>{isTr ? "Tümü" : "All"}</span>
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>

        <div className="space-y-1.5">
          {categories.slice(0, 5).map((cat) => {
            const isFollowed = followedCategoryIds.has(cat.id);
            return (
              <div
                key={cat.id}
                className="flex items-center justify-between gap-2 p-1.5 px-2 rounded-xl hover:bg-surface/60 transition-colors"
              >
                <Link
                  href={`${basePath}?category=${cat.slug}`}
                  className="min-w-0 flex-1 group"
                >
                  <div className="text-xs font-medium text-[var(--color-text-primary)] group-hover:text-blue-600 dark:group-hover:text-sky-300 transition-colors truncate">
                    {cat.name}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-tertiary)]">
                    {isTr ? "Uzmanlık Alanı" : "Specialization"}
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => handleToggleCategoryFollow(cat.id)}
                  className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                    isFollowed
                      ? "bg-blue-500/15 text-blue-700 dark:text-sky-300 border border-blue-500/25 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
                      : "bg-surface/60 text-[var(--color-text-secondary)] hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-sky-300 border border-[var(--color-border-subtle)]"
                  }`}
                >
                  {isFollowed ? (
                    <>
                      <Check className="h-3 w-3 text-blue-500" aria-hidden="true" />
                      <span>{isTr ? "Takipte" : "Following"}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3 w-3" aria-hidden="true" />
                      <span>{isTr ? "Takip Et" : "Follow"}</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
