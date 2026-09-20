import type { Dispatch, SetStateAction } from "react";
import Link from "next/link";
import { Flame, Briefcase, PlusCircle } from "lucide-react";
import type { CategoryDto } from "@/src/modules/categories/service";
import { CategoryFilterBar } from "@/src/components/categories/category-filter-bar";
import { Button } from "@/src/components/ui/button";
import { getLocalizedRoute } from "@/src/lib/i18n/routes";

export interface ListingsFilterSidebarProps {
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
}

export function ListingsFilterSidebar({
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
}: ListingsFilterSidebarProps) {
  const extraQuery: Record<string, string> = {};
  if (mode === "following") {
    extraQuery.mode = "following";
  }
  if (view === "stream") {
    extraQuery.view = "stream";
  } else {
    extraQuery.view = "catalog";
  }

  return (
    <aside className="hidden lg:flex flex-col gap-3 w-[240px] xl:w-[250px] shrink-0 sticky top-20">
      <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-surface/75 backdrop-blur-xl p-3.5 shadow-xs space-y-3.5">
        {/* Kategori ve Sektör Gezgini */}
        <CategoryFilterBar
          categories={categories}
          selectedCategory={categorySlug}
          basePath={basePath}
          searchQuery={searchQuery}
          extraQuery={extraQuery}
          locale={locale}
          variant="sidebar"
        />

        <div className="h-px bg-[var(--color-border-subtle)]/60" />

        {/* Hızlı Filtreler */}
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => setChipLast24h((prev) => !prev)}
            aria-pressed={chipLast24h}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer border ${
              chipLast24h
                ? "bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-2xs font-semibold"
                : "bg-surface/50 border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:bg-surface hover:text-[var(--color-text-primary)]"
            }`}
          >
            <div className="flex items-center gap-2">
              <Flame
                className={`h-3.5 w-3.5 ${chipLast24h ? "text-amber-400" : "text-[var(--color-text-tertiary)]"}`}
                aria-hidden="true"
              />
              <span>{isTr ? "Son 24s" : "Last 24h"}</span>
            </div>
            <span className="text-[9px] font-mono opacity-60">24h</span>
          </button>

          <button
            type="button"
            onClick={() => setChipFixedBudget((prev) => !prev)}
            aria-pressed={chipFixedBudget}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer border ${
              chipFixedBudget
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-2xs font-semibold"
                : "bg-surface/50 border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:bg-surface hover:text-[var(--color-text-primary)]"
            }`}
          >
            <div className="flex items-center gap-2">
              <Briefcase
                className={`h-3.5 w-3.5 ${chipFixedBudget ? "text-emerald-400" : "text-[var(--color-text-tertiary)]"}`}
                aria-hidden="true"
              />
              <span>{isTr ? "Bütçesi Belirli" : "Specific Budget"}</span>
            </div>
            <span className="text-[9px] font-mono opacity-60">TRY</span>
          </button>
        </div>

        <div className="h-px bg-[var(--color-border-subtle)]/60" />

        {/* Primary Action Button */}
        <Link href={getLocalizedRoute("newListing", locale)} className="w-full block">
          <Button
            variant="shimmer"
            className="w-full py-2.5 h-10 rounded-xl font-bold text-xs sm:text-sm gap-2 shadow-md shadow-blue-500/20"
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            <span>{isTr ? "İlan Yayınla" : "Publish Listing"}</span>
          </Button>
        </Link>
      </div>
    </aside>
  );
}
