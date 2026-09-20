"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Rocket,
  Search,
  X,
  ArrowUpRight,
  Clock,
  Coins,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  UserCheck,
  ShieldCheck,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { EmptyState } from "../ui/empty-state";
import { getLocalizedWorkspacePath, getLocalizedProfilePath } from "@/src/lib/i18n/routes";
import { filterAndSortByRelevance } from "@/src/lib/search/token-matcher";

export interface ActiveEngagementItem {
  id: string;
  listingId: string;
  listingSlug: string;
  listingTitle: string;
  listingSummary: string;
  status: "MATCHED" | "COMPLETION_PENDING" | "COMPLETED" | "CANCELLED";
  myRole: "owner" | "freelancer";
  matchedAt: string | Date;
  completedAt: string | Date | null;
  cancelledAt: string | Date | null;
  budgetCurrency: string;
  budgetMin: string | null;
  budgetMax: string | null;
  categoryTitle: string;
  counterparty: {
    userId: string;
    handle: string;
    displayName: string;
    avatarUrl: string | null;
  };
  hasMyCompletionMark: boolean;
}

export interface ActiveEngagementsDashboardProps {
  initialEngagements: ActiveEngagementItem[];
  locale: string;
}

type RoleFilter = "all" | "freelancer" | "owner";
type StatusFilter = "active" | "completed" | "all";

const CURRENCY_SYMBOLS: Record<string, string> = {
  TRY: "₺",
  USD: "$",
  EUR: "€",
};

function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}

function getStatusFilterLabel(st: "active" | "completed" | "all", activeCount: number, isTr: boolean): string {
  if (st === "active") {
    return isTr ? `Devam Edenler (${activeCount})` : `Active (${activeCount})`;
  }
  if (st === "completed") {
    return isTr ? "Tamamlananlar" : "Completed";
  }
  return isTr ? "Tümü" : "All";
}

function getRoleFilterLabel(r: "all" | "freelancer" | "owner", isTr: boolean): string {
  if (r === "all") {
    return isTr ? "Tüm Roller" : "All Roles";
  }
  if (r === "freelancer") {
    return isTr ? "Freelancer" : "As Specialist";
  }
  return isTr ? "İşveren" : "As Employer";
}

function getEmptyStateTitle(searchQuery: string, statusFilter: string, isTr: boolean): string {
  if (searchQuery) {
    return isTr ? "Aramanıza uygun aktif proje bulunamadı" : "No projects match your search";
  }
  if (statusFilter === "completed") {
    return isTr ? "Henüz tamamlanmış projeniz bulunmuyor" : "No completed projects yet";
  }
  return isTr ? "Şu anda devam eden aktif bir projeniz yok" : "No ongoing projects right now";
}

function getEmptyStateDescription(searchQuery: string, isTr: boolean): string {
  if (searchQuery) {
    return isTr
      ? "Farklı anahtar kelimeler ile aramayı veya filtreleri sıfırlamayı deneyebilirsiniz."
      : "Try searching with other terms or resetting your filters.";
  }
  return isTr
    ? "Bir ilana verdiğiniz teklif kabul edildiğinde veya yayınladığınız ilandaki bir teklifi kabul ettiğinizde burada listelenecektir."
    : "When an offer is accepted on a listing, your private workspace and project tracker will activate here.";
}

function getEngagementRoleBadgeText(isOwner: boolean, isTr: boolean): string {
  if (isOwner) {
    return isTr ? "İşveren Rolü" : "Employer";
  }
  return isTr ? "Freelancer / Uzman Rolü" : "Specialist";
}

export function ActiveEngagementsDashboard({
  initialEngagements,
  locale,
}: ActiveEngagementsDashboardProps) {
  const isTr = locale === "tr";
  const [engagements] = useState<ActiveEngagementItem[]>(initialEngagements);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");

  // 1. Role and Status Filter
  const filteredByControls = useMemo(() => {
    return engagements.filter((item) => {
      // Role match
      if (roleFilter !== "all" && item.myRole !== roleFilter) {
        return false;
      }
      // Status match
      if (statusFilter === "active") {
        return item.status === "MATCHED" || item.status === "COMPLETION_PENDING";
      }
      if (statusFilter === "completed") {
        return item.status === "COMPLETED";
      }
      return true;
    });
  }, [engagements, roleFilter, statusFilter]);

  // 2. Turkish-Aware Token Search
  const displayEngagements = useMemo(() => {
    if (!searchQuery.trim()) {
      return filteredByControls;
    }
    return filterAndSortByRelevance(filteredByControls, searchQuery, (item) => [
      { text: item.listingTitle, weight: 10 },
      { text: item.listingSummary, weight: 4 },
      { text: item.categoryTitle, weight: 4 },
      { text: item.counterparty.displayName, weight: 3 },
      { text: item.counterparty.handle, weight: 3 },
    ]);
  }, [filteredByControls, searchQuery]);

  // Active count for badge preview
  const activeCount = useMemo(() => {
    return engagements.filter(
      (e) => e.status === "MATCHED" || e.status === "COMPLETION_PENDING"
    ).length;
  }, [engagements]);

  // Format currency
  const formatBudget = (currency: string, min: string | null, max: string | null) => {
    if (!min && !max) return isTr ? "Anlaşmalı" : "Agreed";
    const curr = getCurrencySymbol(currency);
    if (min && max) {
      return `${curr}${Number(min).toLocaleString("tr-TR")} - ${curr}${Number(max).toLocaleString("tr-TR")}`;
    }
    return `${curr}${Number(min || max).toLocaleString("tr-TR")}`;
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] p-4 rounded-2xl shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isTr
                ? "Aktif projelerde ara (proje başlığı, karşı taraf adı)..."
                : "Search active projects (title, counterparty)..."
            }
            className="w-full pl-10 pr-9 py-2 rounded-xl text-xs sm:text-sm bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
              aria-label={isTr ? "Aramayı Temizle" : "Clear Search"}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Role & Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-xs">
            {(["active", "completed", "all"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  statusFilter === st
                    ? "bg-blue-600 text-white shadow-sm font-semibold"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                {getStatusFilterLabel(st, activeCount, isTr)}
              </button>
            ))}
          </div>

          {/* Role Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-xs">
            {(["all", "freelancer", "owner"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  roleFilter === r
                    ? "bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] font-semibold shadow-xs"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                {getRoleFilterLabel(r, isTr)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Concurrent Work Summary Banner */}
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
            <Rocket className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
              {isTr
                ? "Çoklu Aktif İlan & Eşzamanlı Proje Takibi"
                : "Concurrent Active Projects Hub"}
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
              {isTr
                ? "Aynı anda birden fazla ilanda çalışabilir veya projeler yürütebilirsiniz. Her projenin çalışma alanına tek tıkla ulaşabilirsiniz."
                : "Manage and collaborate across multiple active engagements seamlessly. Enter workspace channels in one click."}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>{isTr ? "Gizli İletişim Kanalları" : "Protected Workspaces"}</span>
        </div>
      </div>

      {/* Engagements List */}
      {displayEngagements.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-6 w-6" />}
          title={getEmptyStateTitle(searchQuery, statusFilter, isTr)}
          description={getEmptyStateDescription(searchQuery, isTr)}
          action={
            !searchQuery && (
              <Link href={isTr ? "/tr/ilanlar" : "/en/listings"}>
                <Button variant="shimmer" size="sm">
                  {isTr ? "Yeni İlanları Keşfet" : "Browse Opportunities"}
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {displayEngagements.map((item) => {
            const workspaceUrl = getLocalizedWorkspacePath(item.id, locale);
            const counterpartyProfileUrl = getLocalizedProfilePath(item.counterparty.handle, locale);
            const isOwner = item.myRole === "owner";
            const dateStr = new Date(item.matchedAt).toLocaleDateString(isTr ? "tr-TR" : "en-US");

            return (
              <div
                key={item.id}
                className="group relative flex flex-col md:flex-row md:items-center justify-between gap-5 p-5 sm:p-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] hover:border-blue-500/40 hover:shadow-lg transition-all duration-200"
              >
                {/* Left Side: Information */}
                <div className="space-y-3 flex-1">
                  {/* Top line: Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Role badge */}
                    <Badge variant="outline" className="text-[10px] font-semibold py-0.5">
                      {getEngagementRoleBadgeText(isOwner, isTr)}
                    </Badge>

                    {/* Category */}
                    <Badge variant="secondary" className="text-[10px] font-medium py-0.5">
                      {item.categoryTitle}
                    </Badge>

                    {/* Status badge */}
                    {item.status === "MATCHED" && (
                      <Badge variant="outline" className="text-[10px] font-semibold py-0.5 text-emerald-400 border-emerald-500/30 bg-emerald-500/10 gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{isTr ? "Devam Ediyor" : "In Progress"}</span>
                      </Badge>
                    )}

                    {item.status === "COMPLETION_PENDING" && (
                      <Badge variant="outline" className="text-[10px] font-semibold py-0.5 text-amber-400 border-amber-500/30 bg-amber-500/10 gap-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>{isTr ? "Tamamlama Onayı Bekleniyor" : "Pending Completion"}</span>
                      </Badge>
                    )}

                    {item.status === "COMPLETED" && (
                      <Badge variant="outline" className="text-[10px] font-semibold py-0.5 text-blue-400 border-blue-500/30 bg-blue-500/10 gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{isTr ? "Tamamlandı" : "Completed"}</span>
                      </Badge>
                    )}

                    {item.status === "CANCELLED" && (
                      <Badge variant="danger" className="text-[10px] font-semibold py-0.5">
                        {isTr ? "İptal Edildi" : "Cancelled"}
                      </Badge>
                    )}

                    <span className="text-[11px] text-[var(--color-text-tertiary)] flex items-center gap-1 ml-auto">
                      <Clock className="h-3 w-3" />
                      <span>{isTr ? "Başlangıç:" : "Started:"} {dateStr}</span>
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] group-hover:text-blue-500 transition-colors">
                    <Link href={workspaceUrl} className="hover:underline flex items-center gap-1.5">
                      <span>{item.listingTitle}</span>
                      <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 shrink-0" />
                    </Link>
                  </h3>

                  {/* Summary */}
                  {item.listingSummary && (
                    <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                      {item.listingSummary}
                    </p>
                  )}

                  {/* Counterparty and Financials */}
                  <div className="flex flex-wrap items-center gap-4 pt-1 text-xs border-t border-[var(--color-border-subtle)]">
                    {/* Counterparty card */}
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-blue-600/20 text-blue-400 font-semibold flex items-center justify-center text-[10px] uppercase">
                        {item.counterparty.displayName.charAt(0)}
                      </div>
                      <Link
                        href={counterpartyProfileUrl}
                        className="hover:underline text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1 font-medium"
                      >
                        <span>{item.counterparty.displayName}</span>
                        <span className="text-[var(--color-text-tertiary)] text-[10px]">
                          (@{item.counterparty.handle})
                        </span>
                      </Link>
                    </div>

                    {/* Agreed Budget */}
                    <div className="flex items-center gap-1 font-semibold text-emerald-400">
                      <Coins className="h-3.5 w-3.5" />
                      <span>{formatBudget(item.budgetCurrency, item.budgetMin, item.budgetMax)}</span>
                    </div>

                    {/* Completion mark indicator */}
                    {item.hasMyCompletionMark && (
                      <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>{isTr ? "Tamamlama onayınız verildi" : "You marked complete"}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Action CTA */}
                <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                  <Link href={workspaceUrl}>
                    <Button variant="shimmer" size="md" className="gap-2 text-xs font-semibold">
                      <span>{isTr ? "Çalışma Alanına Git" : "Enter Workspace"}</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
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
