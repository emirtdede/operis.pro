"use client";

import Link from "next/link";
import {
  Plus,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { EmptyState } from "@/src/components/ui/empty-state";
import { Button } from "@/src/components/ui/button";
import { PublicProfileDto } from "@/src/modules/profiles/service";
import {
  getEmptyListingsDescription,
  formatListingBudget,
} from "./types";

export interface PublicProfilePortfolioProps {
  profile: PublicProfileDto;
  locale: string;
  isSelf: boolean;
  activeTab: "listings" | "projects";
}

export function PublicProfilePortfolio({
  profile,
  locale,
  isSelf,
  activeTab,
}: PublicProfilePortfolioProps) {
  const isTr = locale === "tr";
  const activeListings = profile.activeListings || [];
  const completedWork = profile.completedWork || [];

  if (activeTab === "listings") {
    return (
      <div className="space-y-4">
        {activeListings.length === 0 ? (
          <EmptyState
            title={isTr ? "Şu an yayında aktif ilanı bulunmuyor" : "No active listings"}
            description={getEmptyListingsDescription(isSelf, isTr)}
            action={
              isSelf ? (
                <Link href={isTr ? "/tr/ilanlar/yeni" : "/en/listings/new"}>
                  <Button variant="primary" size="sm">
                    <Plus className="h-4 w-4" />
                    <span>{isTr ? "Yeni İlan Yayınla" : "Publish Listing"}</span>
                  </Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {activeListings.map((listing) => {
              const hasBudget = Boolean(listing.budgetMin || listing.budgetMax);
              const formattedBudget = formatListingBudget(
                hasBudget,
                listing.budgetMin,
                listing.budgetMax,
                listing.budgetCurrency,
                isTr
              );

              return (
                <div
                  key={listing.id}
                  className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 hover:border-blue-500/30 p-5 transition-all space-y-3 group shadow-xs"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                        {isTr ? "Aktif İlan" : "Active Listing"}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] group-hover:text-blue-500 transition-colors">
                        {listing.title}
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-[var(--color-text-primary)] bg-surface px-3 py-1 rounded-xl border border-[var(--color-border-subtle)] shrink-0">
                      {formattedBudget}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border-subtle)] text-xs text-[var(--color-text-tertiary)]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {new Intl.DateTimeFormat(isTr ? "tr-TR" : "en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }).format(new Date(listing.createdAt))}
                      </span>
                    </div>

                    <Link
                      href={isTr ? `/tr/ilanlar/${listing.slug}` : `/en/listings/${listing.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-500 hover:text-blue-400 transition-colors"
                    >
                      <span>{isTr ? "İlanı İncele" : "View Listing"}</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // TAB 2: COMPLETED PROJECTS
  return (
    <div className="space-y-4">
      {completedWork.length === 0 ? (
        <EmptyState
          title={isTr ? "Henüz tamamlanmış proje kaydı bulunmuyor" : "No completed projects yet"}
          description={
            isTr
              ? "Yalnızca her iki tarafça karşılıklı onaylanan başarıyla tamamlanmış işler burada listelenir. Satın alınamaz veya sahte oluşturulamaz."
              : "Only mutually confirmed completed engagements appear here. Cryptographically verifiable, cannot be faked."
          }
          action={
            <Link href={isTr ? "/tr/ilanlar/yeni" : "/en/listings/new"}>
              <Button variant="secondary" size="sm">
                {isTr ? "İlk Projeyi Başlat" : "Start Collaboration"}
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {completedWork.map((work) => {
            const compDate = new Date(work.completedAt);
            const formattedDate = new Intl.DateTimeFormat(isTr ? "tr-TR" : "en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }).format(compDate);

            return (
              <div
                key={work.engagementId}
                className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 p-5 space-y-2.5 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-[var(--color-text-primary)]">
                    {work.title}
                  </span>
                  <Badge variant="outline" size="sm">
                    {work.category}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)] pt-1">
                  <span>
                    {isTr ? "Tamamlanma:" : "Completed:"} {formattedDate}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[var(--color-text-tertiary)]">
                      {isTr ? "İş Ortağı:" : "Counterparty:"}
                    </span>
                    <span className="font-semibold text-blue-400">
                      {work.counterparty.displayName}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
