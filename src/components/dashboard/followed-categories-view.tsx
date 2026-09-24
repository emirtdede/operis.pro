"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FolderTree,
  BookmarkCheck,
  ArrowRight,
  Bell,
  BellOff,
  SlidersHorizontal,
  DollarSign,
  Search,
  X,
  Check,
  Square,
  CheckSquare,
  Trash2,
} from "lucide-react";
import { Button } from "../ui/button";
import { EmptyState } from "../ui/empty-state";
import { CategoryDto } from "@/src/modules/categories/service";
import { CategoryAlertSettingsModal } from "./category-alert-settings-modal";

export interface FollowedCategoriesViewProps {
  categories: CategoryDto[];
  locale: string;
}

export function FollowedCategoriesView({ categories, locale }: FollowedCategoriesViewProps) {
  const isTr = locale === "tr";
  const [items, setItems] = useState<CategoryDto[]>(categories);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);

  const query = searchQuery.trim().toLowerCase();
  const filtered = items.filter((cat) => {
    if (!query) return true;
    return (
      cat.name.toLowerCase().includes(query) ||
      cat.key.toLowerCase().includes(query) ||
      (cat.description && cat.description.toLowerCase().includes(query)) ||
      (cat.sectorKey && cat.sectorKey.toLowerCase().includes(query))
    );
  });

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((c) => next.delete(c.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((c) => next.add(c.id));
        return next;
      });
    }
  };

  const toggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggle = async (cat: CategoryDto) => {
    setLoadingId(cat.id);
    try {
      const res = await fetch("/api/categories/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: cat.id,
          follow: false,
        }),
      });

      if (res.ok) {
        setItems((prev) => prev.filter((c) => c.id !== cat.id));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(cat.id);
          return next;
        });
        window.dispatchEvent(
          new CustomEvent("operis:badge-update", {
            detail: { key: "categories", delta: -1 },
          })
        );
      }
    } catch {
      // Fallback
    } finally {
      setLoadingId(null);
    }
  };

  const handleBulkUnfollow = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkLoading(true);
    const targetIds = Array.from(selectedIds);
    try {
      const res = await fetch("/api/categories/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryIds: targetIds,
        }),
      });

      if (res.ok) {
        setItems((prev) => prev.filter((c) => !selectedIds.has(c.id)));
        setSelectedIds(new Set());
        window.dispatchEvent(
          new CustomEvent("operis:badge-update", {
            detail: { key: "categories", delta: -targetIds.length },
          })
        );
      }
    } catch {
      // Fallback
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handlePreferencesSaved = (catId: string, prefs: { emailAlerts: boolean; minBudget: number | null }) => {
    setItems((prev) =>
      prev.map((c) =>
        c.id === catId
          ? {
              ...c,
              emailAlerts: prefs.emailAlerts,
              minBudget: prefs.minBudget,
            }
          : c
      )
    );
  };

  if (items.length === 0) {
    return (
      <EmptyState
        variant="card"
        icon={<FolderTree className="h-7 w-7 text-blue-400" />}
        title={isTr ? "Henüz Bir Kategori Takip Etmiyorsunuz" : "No Followed Categories Yet"}
        description={
          isTr
            ? "İlgi duyduğunuz teknoloji kategorilerini takip ederek yeni açılan ilanlardan anında haberdar olabilirsiniz."
            : "Follow tech categories to get notified of newly published projects on our radar."
        }
        action={
          <Link href={isTr ? "/tr/kategoriler" : "/en/categories"}>
            <Button variant="shimmer" size="md" className="gap-2 shadow-lg shadow-blue-500/15">
              <FolderTree className="h-4 w-4" aria-hidden="true" />
              <span>{isTr ? "Kategorileri İncele & Takip Et" : "Explore Categories"}</span>
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Unified Toolbar: Full-width Search Input + Bulk Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-2">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isTr ? "Kategorilerde ara..." : "Search categories..."}
            className="w-full pl-10 pr-9 py-2 rounded-xl text-xs sm:text-sm bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all truncate"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] cursor-pointer"
              aria-label={isTr ? "Aramayı Temizle" : "Clear Search"}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Select All Toggle Button */}
          {filtered.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSelectAll}
              className={`gap-1.5 text-xs border rounded-xl px-3 py-2 cursor-pointer h-auto transition-all ${
                allVisibleSelected
                  ? "border-blue-500/40 bg-blue-500/10 text-blue-400 font-medium"
                  : "border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              {allVisibleSelected ? (
                <CheckSquare className="h-3.5 w-3.5 text-blue-400" />
              ) : (
                <Square className="h-3.5 w-3.5" />
              )}
              <span>
                {allVisibleSelected
                  ? (isTr ? "Seçimi Kaldır" : "Deselect All")
                  : (isTr ? "Tümünü Seç" : "Select All")}
              </span>
              <span className="text-[10px] opacity-75 font-mono">({filtered.length})</span>
            </Button>
          )}

          {/* Bulk Unfollow Action Button */}
          {selectedIds.size > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBulkUnfollow}
              isLoading={isBulkLoading}
              className="gap-1.5 text-xs bg-red-500/15 hover:bg-red-500/25 text-red-400 hover:text-red-300 border border-red-500/30 rounded-xl px-3 py-2 cursor-pointer h-auto transition-all shadow-sm"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>
                {isTr
                  ? `Toplu Takibi Bırak (${selectedIds.size})`
                  : `Bulk Unfollow (${selectedIds.size})`}
              </span>
            </Button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          variant="card"
          icon={<Search className="h-7 w-7 text-blue-400" />}
          title={isTr ? "Aramanızla Eşleşen Kategori Bulunamadı" : "No Matching Categories Found"}
          description={
            isTr
              ? `"${searchQuery}" aramasıyla eşleşen herhangi bir takip edilen kategori bulunamadı.`
              : `No followed categories matched your search "${searchQuery}".`
          }
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="cursor-pointer"
            >
              {isTr ? "Aramayı Temizle" : "Clear Search"}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cat) => {
            const emailActive = cat.emailAlerts !== false;
            const isSelected = selectedIds.has(cat.id);

            return (
              <div
                key={cat.id}
                onClick={(e) => toggleSelectOne(cat.id, e)}
                className={`rounded-2xl border p-5 sm:p-6 backdrop-blur-xl transition-all duration-300 flex flex-col justify-between h-full cursor-pointer relative ${
                  isSelected
                    ? "border-blue-500/60 ring-2 ring-blue-500/30 bg-blue-500/[0.05] shadow-md shadow-blue-500/5"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 hover:border-blue-500/30 shadow-sm"
                }`}
              >
                <div className="flex flex-col flex-1">
                  {/* Header row with checkbox, tags and badges */}
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => toggleSelectOne(cat.id, e)}
                        className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? "bg-blue-600 border-blue-500 text-white shadow-sm"
                            : "border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/60 text-transparent hover:border-blue-400"
                        }`}
                        aria-label={
                          isSelected
                            ? isTr
                              ? "Seçimi kaldır"
                              : "Deselect"
                            : isTr
                            ? "Seç"
                            : "Select"
                        }
                      >
                        <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                      </button>
                      <span className="text-xs font-mono text-blue-400 font-semibold uppercase tracking-wider">
                        {cat.key}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <BookmarkCheck className="h-3 w-3" aria-hidden="true" />
                        <span>{isTr ? "Takipte" : "Followed"}</span>
                      </span>

                      {emailActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                          <Bell className="h-3 w-3" aria-hidden="true" />
                          <span>{isTr ? "Alarm Açık" : "Alert On"}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 bg-zinc-500/10 px-2 py-0.5 rounded-full border border-zinc-500/20">
                          <BellOff className="h-3 w-3" aria-hidden="true" />
                          <span>{isTr ? "Alarm Kapalı" : "Alert Off"}</span>
                        </span>
                      )}

                      {cat.minBudget && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-mono">
                          <DollarSign className="h-2.5 w-2.5" aria-hidden="true" />
                          <span>{cat.minBudget.toLocaleString()} ₺+</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="min-h-[2.5rem] flex items-center">
                    <h3 className="text-base font-semibold text-[var(--color-text-primary)] leading-snug line-clamp-2">
                      {cat.name}
                    </h3>
                  </div>

                  <div className="pt-1 min-h-[2.5rem] flex items-start">
                    <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                      {cat.description || ""}
                    </p>
                  </div>
                </div>

                {/* Bottom Actions Row */}
                <div
                  className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-[var(--color-border-subtle)]/60 shrink-0 flex-wrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link
                    href={isTr ? `/tr/akis?category=${cat.key}` : `/en/feed?category=${cat.key}`}
                    className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1 hover:underline"
                  >
                    <span>{isTr ? "İlanları Gör" : "View Listings"}</span>
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </Link>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingCategory(cat)}
                      className="text-xs text-[var(--color-text-secondary)] hover:text-blue-400 cursor-pointer h-7 px-2 gap-1"
                      title={isTr ? "Alarm Ayarları" : "Alert Settings"}
                    >
                      <SlidersHorizontal className="h-3 w-3" aria-hidden="true" />
                      <span>{isTr ? "Alarm Ayarları" : "Alerts"}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(cat)}
                      disabled={loadingId === cat.id}
                      className="text-xs text-[var(--color-text-tertiary)] hover:text-red-400 cursor-pointer h-7 px-2"
                    >
                      {isTr ? "Takipten Çık" : "Unfollow"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Per-Category Alert Settings Modal */}
      {editingCategory && (
        <CategoryAlertSettingsModal
          category={editingCategory}
          locale={locale}
          isOpen={Boolean(editingCategory)}
          onClose={() => setEditingCategory(null)}
          onSaved={(prefs) => handlePreferencesSaved(editingCategory.id, prefs)}
        />
      )}
    </div>
  );
}
