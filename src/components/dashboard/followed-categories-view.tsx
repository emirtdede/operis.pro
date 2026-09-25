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
  AlertTriangle,
} from "lucide-react";
import { Button } from "../ui/button";
import { EmptyState } from "../ui/empty-state";
import { CategoryDto } from "@/src/modules/categories/service";
import { CategoryAlertSettingsModal } from "./category-alert-settings-modal";

export interface FollowedCategoriesViewProps {
  categories: CategoryDto[];
  allCategories?: CategoryDto[];
  locale: string;
}

export function FollowedCategoriesView({
  categories,
  locale,
}: FollowedCategoriesViewProps) {
  const isTr = locale === "tr";
  const [items, setItems] = useState<CategoryDto[]>(categories);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [showConfirmAllModal, setShowConfirmAllModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);

  const query = searchQuery.trim().toLowerCase();

  // Followed Categories Filtered by Search
  const filteredFollowed = items.filter((cat) => {
    if (!query) return true;
    return (
      cat.name.toLowerCase().includes(query) ||
      cat.key.toLowerCase().includes(query) ||
      (cat.description && cat.description.toLowerCase().includes(query)) ||
      (cat.sectorKey && cat.sectorKey.toLowerCase().includes(query))
    );
  });

  // Selection states
  const allVisibleFollowedSelected =
    filteredFollowed.length > 0 && filteredFollowed.every((c) => selectedIds.has(c.id));

  const toggleSelectAllFollowed = () => {
    if (allVisibleFollowedSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredFollowed.forEach((c) => next.delete(c.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredFollowed.forEach((c) => next.add(c.id));
        return next;
      });
    }
  };

  const toggleSelectOneFollowed = (id: string, e: React.MouseEvent) => {
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

  // Single Unfollow
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

  // Bulk Unfollow ONLY Selected
  const handleBulkUnfollowSelected = async () => {
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

  // Bulk Unfollow ALL Categories
  const handleUnfollowAll = async () => {
    if (items.length === 0) return;
    setIsBulkLoading(true);
    const count = items.length;
    try {
      const res = await fetch("/api/categories/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unfollowAll: true,
        }),
      });

      if (res.ok) {
        setItems([]);
        setSelectedIds(new Set());
        setShowConfirmAllModal(false);
        window.dispatchEvent(
          new CustomEvent("operis:badge-update", {
            detail: { key: "categories", delta: -count },
          })
        );
      }
    } catch {
      // Fallback
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handlePreferencesSaved = (
    catId: string,
    prefs: { emailAlerts: boolean; minBudget: number | null }
  ) => {
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

  return (
    <div className="space-y-6">
      {/* 1. Flat Toolbar (Search + Selection + Bulk Actions) - Always visible like other dashboard pages */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Arama Çubuğu (Search Bar) */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={items.length === 0}
            placeholder={
              isTr
                ? "Takip ettiğiniz kategorilerde ara..."
                : "Search followed categories..."
            }
            className="w-full pl-10 pr-9 py-2 rounded-xl text-xs sm:text-sm bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all truncate disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* Toolbar Selection & Bulk Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Seçim Butonu: Tümünü Seç / Seçimi Kaldır */}
          <Button
            variant="ghost"
            size="sm"
            disabled={items.length === 0}
            onClick={toggleSelectAllFollowed}
            className={`gap-1.5 text-xs border rounded-xl px-3 py-2 h-auto transition-all ${
              items.length === 0
                ? "border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)] opacity-50 cursor-not-allowed"
                : allVisibleFollowedSelected
                ? "border-blue-500/40 bg-blue-500/15 text-blue-400 font-semibold cursor-pointer"
                : "border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-blue-500/30 cursor-pointer"
            }`}
            title={isTr ? "Tümünü seç veya seçimi kaldır" : "Select or deselect all"}
          >
            {allVisibleFollowedSelected ? (
              <CheckSquare className="h-3.5 w-3.5 text-blue-400" />
            ) : (
              <Square className="h-3.5 w-3.5" />
            )}
            <span>
              {allVisibleFollowedSelected
                ? isTr
                  ? "Seçimi Kaldır"
                  : "Deselect All"
                : isTr
                ? "Tümünü Seç"
                : "Select All"}
            </span>
            <span className="text-[10px] opacity-75 font-mono">({filteredFollowed.length})</span>
          </Button>

          {/* Sadece Seçtiklerini Takibi Bırak Butonu */}
          {selectedIds.size > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBulkUnfollowSelected}
              isLoading={isBulkLoading}
              className="gap-1.5 text-xs bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 border border-rose-500/30 rounded-xl px-3 py-2 cursor-pointer h-auto transition-all shadow-sm"
              title={isTr ? "Sadece işaretlediğiniz kategorileri takipten çıkar" : "Unfollow only selected"}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>
                {isTr
                  ? `Seçilenleri Takibi Bırak (${selectedIds.size})`
                  : `Unfollow Selected (${selectedIds.size})`}
              </span>
            </Button>
          )}

          {/* Toplu Takibi Bırak (Tümünü Bırak) Butonu */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowConfirmAllModal(true)}
            disabled={items.length === 0 || isBulkLoading}
            className={`gap-1.5 text-xs border border-[var(--color-border-subtle)] rounded-xl px-3 py-2 h-auto transition-all ${
              items.length === 0
                ? "text-[var(--color-text-tertiary)] opacity-50 cursor-not-allowed"
                : "text-[var(--color-text-tertiary)] hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 cursor-pointer"
            }`}
            title={isTr ? "Takip ettiğiniz tüm kategorileri tek tıkla takipten çıkar" : "Unfollow all categories"}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{isTr ? "Tümünü Takibi Bırak" : "Unfollow All"}</span>
          </Button>
        </div>
      </div>

      {/* 2. Content Area: Followed Categories Grid or Standard Empty State Card */}
      {items.length === 0 ? (
        <EmptyState
          variant="card"
          icon={<FolderTree className="h-7 w-7 text-blue-400" />}
          title={isTr ? "Henüz Bir Kategori Takip Etmiyorsunuz" : "No Followed Categories Yet"}
          description={
            isTr
              ? "İlgi duyduğunuz teknoloji kategorilerini takip ederek yeni açılan ilanlardan anında haberdar olabilir ve akışınızı özelleştirebilirsiniz."
              : "Follow tech categories to get notified of newly published projects on our radar."
          }
          action={
            <Link href={isTr ? "/tr/kategoriler" : "/en/categories"}>
              <Button
                variant="shimmer"
                size="md"
                className="gap-2 shadow-lg shadow-blue-500/15 font-semibold cursor-pointer"
              >
                <FolderTree className="h-4 w-4" aria-hidden="true" />
                <span>{isTr ? "Kategorileri İncele & Takip Et" : "Explore & Follow Categories"}</span>
              </Button>
            </Link>
          }
        />
      ) : filteredFollowed.length === 0 ? (
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFollowed.map((cat) => {
            const emailActive = cat.emailAlerts !== false;
            const isSelected = selectedIds.has(cat.id);

            return (
              <div
                key={cat.id}
                onClick={(e) => toggleSelectOneFollowed(cat.id, e)}
                className={`rounded-2xl border p-5 sm:p-6 backdrop-blur-xl transition-all duration-200 flex flex-col justify-between h-full cursor-pointer relative ${
                  isSelected
                    ? "border-blue-500/60 ring-2 ring-blue-500/30 bg-blue-500/[0.06] shadow-md shadow-blue-500/10"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 hover:border-blue-500/30 shadow-xs"
                }`}
              >
                <div className="flex flex-col flex-1">
                  {/* Header row with Checkbox and Status Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => toggleSelectOneFollowed(cat.id, e)}
                        className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? "bg-blue-600 border-blue-500 text-white shadow-xs"
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
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
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
                    href={isTr ? `/tr/ilanlar?category=${cat.key}` : `/en/listings?category=${cat.key}`}
                    className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1 hover:underline cursor-pointer"
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
                      className="text-xs text-[var(--color-text-tertiary)] hover:text-rose-400 cursor-pointer h-7 px-2"
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

      {/* 3. Confirmation Modal for "Tümünü Takibi Bırak" */}
      {showConfirmAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/15 text-rose-400 shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                  {isTr ? "Tüm Kategorileri Takipten Çıkar" : "Unfollow All Categories"}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  {isTr
                    ? `Takip ettiğiniz tüm kategorileri (${items.length}) takipten çıkarmak istediğinize emin misiniz?`
                    : `Are you sure you want to unfollow all ${items.length} categories?`}
                </p>
              </div>
            </div>

            <p className="text-xs text-[var(--color-text-tertiary)] leading-relaxed">
              {isTr
                ? "Bu işlem sonrasında kişiselleştirilmiş 'Sana Özel' akışınız sıfırlanacak ve genel popüler ilanlar gösterilecektir. Dilediğiniz zaman kategorileri tekrar takibe alabilirsiniz."
                : "This action will reset your personalized 'For You' stream and show general listings. You can re-follow categories anytime."}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--color-border-subtle)]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirmAllModal(false)}
                disabled={isBulkLoading}
                className="cursor-pointer text-xs"
              >
                {isTr ? "Vazgeç" : "Cancel"}
              </Button>

              <Button
                variant="danger"
                size="sm"
                onClick={handleUnfollowAll}
                isLoading={isBulkLoading}
                className="bg-rose-600 hover:bg-rose-500 text-white cursor-pointer text-xs font-semibold px-4"
              >
                {isTr ? "Evet, Tümünü Bırak" : "Yes, Unfollow All"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Per-Category Alert Settings Modal */}
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
