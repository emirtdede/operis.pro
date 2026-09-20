"use client";

import Link from "next/link";
import { ArrowRight, Check, Plus, Code2 } from "lucide-react";
import { Button } from "../ui/button";
import { SpotlightCard } from "../ui/spotlight-card";
import { CATEGORY_ICONS } from "./category-icons-map";

export interface CategoryItem {
  id: string;
  slug: string;
  name: string;
  sectorKey?: string;
  description?: string | null;
  isFollowed?: boolean;
  listingCount?: number;
  key?: string;
}

export interface CategoryGridCardProps {
  cat: CategoryItem;
  isFollowed: boolean;
  isTr: boolean;
  onToggle: (id: string) => void;
}

export function CategoryGridCard({
  cat,
  isFollowed,
  isTr,
  onToggle,
}: CategoryGridCardProps) {
  const Icon = CATEGORY_ICONS[cat.slug] || Code2;
  const listingCount = cat.listingCount || 0;
  const feedUrl = isTr ? `/tr/akis?category=${cat.slug}` : `/en/feed?category=${cat.slug}`;

  let listingBadgeClass = "bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] border-[var(--color-border-subtle)]";
  if (listingCount > 0) {
    listingBadgeClass = "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30";
  }

  return (
    <SpotlightCard className="h-full p-4 sm:p-6 transition-all duration-300 hover:-translate-y-1 group">
      <div className="flex flex-col flex-1">
        <div className="flex items-start justify-between mb-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500/20 group-hover:scale-105 transition-all shrink-0">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${listingBadgeClass}`}>
              {listingCount} {isTr ? "ilan" : "listings"}
            </span>
            <span className="font-mono text-[11px] text-[var(--color-text-tertiary)] bg-[var(--color-surface-hover)] px-2 py-0.5 rounded-md">
              /{cat.slug}
            </span>
          </div>
        </div>

        <div className="flex flex-col flex-1">
          <div className="min-h-[2.75rem] flex items-center">
            <Link
              href={feedUrl}
              className="font-bold text-base text-[var(--color-text-primary)] hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2 leading-snug"
              title={cat.name}
            >
              {cat.name}
            </Link>
          </div>
          <div className="pt-1.5 min-h-[2.5rem] flex items-start">
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">
              {cat.description || ""}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between pt-4 border-t border-[var(--color-border-subtle)]/60 shrink-0">
        <Link
          href={feedUrl}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          <span>{isTr ? `İlanlar (${listingCount})` : `Listings (${listingCount})`}</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>

        <Button
          variant={isFollowed ? "secondary" : "primary"}
          size="sm"
          onClick={() => onToggle(cat.id)}
          className="gap-1.5 shrink-0"
        >
          {isFollowed ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              <span>{isTr ? "Takipte" : "Following"}</span>
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isTr ? "Takip Et" : "Follow"}</span>
            </>
          )}
        </Button>
      </div>
    </SpotlightCard>
  );
}
