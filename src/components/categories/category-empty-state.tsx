"use client";

import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { Button } from "../ui/button";

export interface CategoryEmptyStateProps {
  selectedSector: string;
  currentSectorLabel: string;
  globalCrossSectorMatchesCount: number;
  searchQuery: string;
  isTr: boolean;
  popularChips: string[];
  onResetSector: () => void;
  onClearSearch: () => void;
  onSelectChip: (chip: string) => void;
}

export function CategoryEmptyState({
  selectedSector,
  currentSectorLabel,
  globalCrossSectorMatchesCount,
  searchQuery,
  isTr,
  popularChips,
  onResetSector,
  onClearSearch,
  onSelectChip,
}: CategoryEmptyStateProps) {
  const trimmedQuery = searchQuery.trim();
  const listingsSearchUrl = isTr
    ? `/tr/ilanlar?q=${encodeURIComponent(trimmedQuery)}`
    : `/en/listings?q=${encodeURIComponent(trimmedQuery)}`;

  return (
    <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/60 p-8 sm:p-12 text-center space-y-6 backdrop-blur-xl shadow-sm animate-in fade-in-50 duration-200">
      {/* Sektör Kısıtlaması Uyarısı ve Hızlı Çözüm Butonu */}
      {selectedSector !== "all" && globalCrossSectorMatchesCount > 0 ? (
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/25 max-w-md mx-auto space-y-3">
          <p className="text-xs text-[var(--color-text-primary)] leading-relaxed">
            {isTr ? (
              <>
                Seçili <strong>&ldquo;{currentSectorLabel}&rdquo;</strong> sektöründe sonuç bulunamadı ancak diğer sektörlerde <strong>{globalCrossSectorMatchesCount}+</strong> uzmanlık alanı mevcut.
              </>
            ) : (
              <>
                No matches in <strong>&ldquo;{currentSectorLabel}&rdquo;</strong>, but found <strong>{globalCrossSectorMatchesCount}+</strong> matching specializations in other sectors.
              </>
            )}
          </p>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onResetSector}
            className="w-full sm:w-auto h-8 text-xs font-semibold gap-1.5 shadow-sm cursor-pointer"
          >
            <span>{isTr ? "Tüm Sektörlerde Göster" : "Show Across All Sectors"}</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            {isTr
              ? "Aramanızla eşleşen kategori bulunamadı."
              : "No categories matched your search criteria."}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {isTr
              ? "Farklı bir anahtar kelime deneyebilir veya aramayı temizleyebilirsiniz."
              : "Try a different query or clear your search."}
          </p>
        </div>
      )}

      {/* Aksiyon Butonları (Temizle ve İlanlarda Ara Köprüsü) */}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <Button
          variant="outline"
          size="sm"
          onClick={onClearSearch}
          className="h-8 text-xs cursor-pointer"
        >
          {isTr ? "Aramayı Temizle" : "Clear Search"}
        </Button>

        {trimmedQuery && (
          <Link href={listingsSearchUrl}>
            <Button
              variant="primary"
              size="sm"
              className="h-8 text-xs gap-1.5 cursor-pointer shadow-sm"
            >
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {isTr
                  ? `"${trimmedQuery}" terimini İlanlar'da ara`
                  : `Search "${trimmedQuery}" in Listings`}
              </span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </Link>
        )}
      </div>

      {/* Akıllı Kurtarma Çipleri (Smart Recovery Chips) */}
      <div className="pt-3 space-y-2.5 border-t border-[var(--color-border-subtle)]/50 max-w-lg mx-auto">
        <p className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">
          {isTr ? "Önerilen Popüler Alanlar" : "Suggested Popular Specializations"}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {popularChips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => onSelectChip(chip)}
              className="px-3 py-1 rounded-xl text-xs font-medium bg-[var(--color-surface-hover)] hover:bg-blue-500/15 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/30 text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)] transition-all cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
