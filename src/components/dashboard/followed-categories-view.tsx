"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderTree, BookmarkCheck, ArrowRight, Bell, BellOff, SlidersHorizontal, DollarSign } from "lucide-react";
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
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);

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
      }
    } catch {
      // Fallback
    } finally {
      setLoadingId(null);
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
      <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-8 sm:p-12 text-center shadow-sm">
        <EmptyState
          title={isTr ? "Henüz Bir Kategori Takip Etmiyorsunuz" : "No Followed Categories Yet"}
          description={
            isTr
              ? "İlgi duyduğunuz teknoloji kategorilerini takip ederek yeni açılan ilanlardan anında haberdar olabilirsiniz."
              : "Follow tech categories to get notified of newly published projects on our radar."
          }
          action={
            <Link href={isTr ? "/tr/kategoriler" : "/en/categories"}>
              <Button variant="primary" size="md" className="gap-2">
                <FolderTree className="h-4 w-4" aria-hidden="true" />
                <span>{isTr ? "Kategorileri İncele & Takip Et" : "Explore Categories"}</span>
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((cat) => {
          const emailActive = cat.emailAlerts !== false;
          return (
            <div
              key={cat.id}
              className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-5 sm:p-6 shadow-sm hover:border-blue-500/30 transition-all duration-300 flex flex-col justify-between h-full"
            >
              <div className="flex flex-col flex-1">
                {/* Header row with tags and badges */}
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <span className="text-xs font-mono text-blue-400 font-semibold uppercase tracking-wider">
                    {cat.key}
                  </span>
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
              <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-[var(--color-border-subtle)]/60 shrink-0 flex-wrap">
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
    </>
  );
}
