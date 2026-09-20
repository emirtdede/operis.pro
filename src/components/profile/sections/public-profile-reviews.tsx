"use client";

import { useState } from "react";
import {
  Star,
  ShieldCheck,
  Quote,
  Sparkles,
  HeartHandshake,
} from "lucide-react";
import { AvatarInitials } from "@/src/components/ui/avatar-initials";
import { EmptyState } from "@/src/components/ui/empty-state";
import { PublicProfileDto } from "@/src/modules/profiles/service";
import { getReviewsRoleFilterLabel } from "./types";

export interface PublicProfileReviewsProps {
  profile: PublicProfileDto;
  locale: string;
}

export function PublicProfileReviews({ profile, locale }: PublicProfileReviewsProps) {
  const isTr = locale === "tr";
  const [reviewsSubTab, setReviewsSubTab] = useState<"received" | "given">("received");
  const [reviewsRoleFilter, setReviewsRoleFilter] = useState<"ALL" | "EMPLOYER" | "FREELANCER">("ALL");

  const endorsements = profile.endorsements || [];
  const reviewsSummary = profile.reviewsSummary;

  const renderReceivedReviewsContent = () => {
    if (reviewsSummary && reviewsSummary.receivedReviewsCount > 0) {
      return (
        <>
          {/* Rating Stats Summary Card */}
          <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 p-6 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Overall + Bayesian Score */}
            <div className="space-y-2 flex flex-col justify-center border-b md:border-b-0 md:border-r border-[var(--color-border-subtle)] pb-4 md:pb-0 md:pr-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-[var(--color-text-primary)] font-mono">
                  {reviewsSummary.rawAverageRating.toFixed(1)}
                </span>
                <div className="flex items-center text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => {
                    const isFilled = s <= Math.round(reviewsSummary.rawAverageRating);
                    const starClass = isFilled ? "fill-amber-400 text-amber-400" : "text-[var(--color-border-subtle)]";
                    return (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${starClass}`}
                      />
                    );
                  })}
                </div>
              </div>
              <span className="text-xs text-[var(--color-text-secondary)]">
                {reviewsSummary.receivedReviewsCount} {isTr ? "doğrulanmış iş birliği puanı" : "verified ratings"}
              </span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold w-fit mt-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{isTr ? "Bayesyen İtibar Skoru:" : "Bayesian Score:"} {reviewsSummary.bayesianScore.toFixed(1)}</span>
              </div>
            </div>

            {/* Category Averages */}
            <div className="space-y-3 flex flex-col justify-center border-b md:border-b-0 md:border-r border-[var(--color-border-subtle)] pb-4 md:pb-0 md:pr-4 text-xs">
              <span className="font-bold text-[var(--color-text-secondary)] uppercase tracking-wider text-[10px]">
                {isTr ? "Kategori Kırılımları" : "Category Breakdown"}
              </span>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-secondary)]">{isTr ? "İletişim & Şeffaflık" : "Communication"}</span>
                  <span className="font-mono font-bold text-[var(--color-text-primary)]">{reviewsSummary.communicationAvg.toFixed(1)} / 5.0</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(reviewsSummary.communicationAvg / 5) * 100}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-secondary)]">{isTr ? "İş Kalitesi & Kapsam Uyumu" : "Work Quality"}</span>
                  <span className="font-mono font-bold text-[var(--color-text-primary)]">{reviewsSummary.qualityAvg.toFixed(1)} / 5.0</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(reviewsSummary.qualityAvg / 5) * 100}%` }} />
                </div>
              </div>
            </div>

            {/* Star Distribution Breakdown */}
            <div className="space-y-1.5 flex flex-col justify-center text-xs">
              <span className="font-bold text-[var(--color-text-secondary)] uppercase tracking-wider text-[10px] mb-1">
                {isTr ? "Yıldız Dağılımı" : "Star Distribution"}
              </span>
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = reviewsSummary.ratingDistribution[stars as 1 | 2 | 3 | 4 | 5] || 0;
                let pct = 0;
                if (reviewsSummary.receivedReviewsCount > 0) {
                  pct = (count / reviewsSummary.receivedReviewsCount) * 100;
                }
                return (
                  <div key={stars} className="flex items-center gap-2 text-[11px]">
                    <span className="w-4 font-mono font-medium text-[var(--color-text-tertiary)]">{stars}★</span>
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-5 text-right font-mono text-[var(--color-text-tertiary)]">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Role Filter Chips */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-[var(--color-text-tertiary)] font-medium mr-1">
              {isTr ? "Filtrele:" : "Filter:"}
            </span>
            {(["ALL", "EMPLOYER", "FREELANCER"] as const).map((r) => {
              const isActive = reviewsRoleFilter === r;
              const buttonClass = isActive
                ? "bg-blue-600 text-white border-blue-600 font-semibold"
                : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]";

              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReviewsRoleFilter(r)}
                  className={`text-xs px-3 py-1 rounded-xl border transition-all cursor-pointer ${buttonClass}`}
                >
                  {getReviewsRoleFilterLabel(r, isTr)}
                </button>
              );
            })}
          </div>

          {/* Reviews Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {reviewsSummary.receivedReviews
              .filter((item) => {
                if (reviewsRoleFilter === "ALL") return true;
                if (reviewsRoleFilter === "FREELANCER") {
                  return item.authorRole === "EMPLOYER";
                }
                return item.authorRole === "FREELANCER";
              })
              .map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 p-5 space-y-3.5 flex flex-col justify-between hover:border-blue-500/30 transition-all shadow-xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => {
                            const isFilled = s <= item.overallRating;
                            const starClass = isFilled ? "fill-amber-400 text-amber-400" : "text-[var(--color-border-subtle)]";
                            return (
                              <Star
                                key={s}
                                className={`h-3.5 w-3.5 ${starClass}`}
                              />
                            );
                          })}
                        </div>
                        <span className="font-mono text-xs font-bold text-[var(--color-text-primary)]">
                          {item.overallRating}.0
                        </span>
                      </div>

                      <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">
                        {new Date(item.createdAt).toLocaleDateString(isTr ? "tr-TR" : "en-US", {
                          year: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>

                    <div className="relative pl-3.5 text-xs text-[var(--color-text-primary)] leading-relaxed border-l-2 border-amber-500/40 py-0.5">
                      "{item.comment}"
                    </div>

                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.tags.map((t) => (
                          <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {item.endorsedSkills && item.endorsedSkills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-0.5 text-[10px] text-[var(--color-text-tertiary)]">
                        <Sparkles className="h-3 w-3 text-amber-400" />
                        <span>{isTr ? "Onaylanan:" : "Endorsed:"}</span>
                        {item.endorsedSkills.map((s) => (
                          <span key={s} className="px-1.5 py-0.2 rounded bg-surface border border-[var(--color-border-subtle)] font-medium text-[var(--color-text-secondary)]">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[var(--color-border-subtle)] pt-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <AvatarInitials name={item.authorDisplayName || "User"} size="sm" />
                      <div>
                        <span className="font-medium text-[var(--color-text-primary)] block text-xs">
                          {item.authorDisplayName}
                        </span>
                        <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">
                          @{item.authorHandle}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] text-[var(--color-text-tertiary)] max-w-[140px] truncate text-right font-medium">
                      {item.projectTitleSnapshot}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </>
      );
    }

    if (endorsements.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {endorsements.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 p-5 space-y-3 flex flex-col justify-between group hover:border-amber-500/30 transition-all shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <ShieldCheck className="h-3 w-3" />
                    {isTr ? "Doğrulanmış İş Birliği" : "Verified Engagement"}
                  </span>
                </div>
                <div className="relative pl-4 text-xs text-[var(--color-text-primary)] leading-relaxed italic border-l-2 border-amber-500/40 py-0.5">
                  <Quote className="h-3 w-3 text-amber-400/50 absolute -left-1.5 -top-1" />
                  "{item.content}"
                </div>
              </div>
              <div className="border-t border-[var(--color-border-subtle)] pt-3 flex items-center justify-between text-xs">
                <span className="font-medium text-[var(--color-text-primary)]">{item.authorDisplayName}</span>
                <span className="text-[10px] text-[var(--color-text-tertiary)]">{item.projectTitle}</span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <EmptyState
        title={isTr ? "Henüz doğrulanmış değerlendirme bulunmuyor" : "No verified reviews yet"}
        description={
          isTr
            ? "Yalnızca başarıyla tamamlanan ve karşılıklı onaylanan iş birlikleri sonrasında yapılan değerlendirmeler burada sergilenir."
            : "Only mutually confirmed completed projects yield verified reviews here."
        }
      />
    );
  };

  let receivedCount = endorsements.length;
  if (reviewsSummary) {
    receivedCount = reviewsSummary.receivedReviewsCount;
  }
  const givenCount = reviewsSummary?.givenReviewsCount ?? 0;

  return (
    <div className="space-y-5">
      {/* Dual Sub-Tab Switcher: Aldığı Yorumlar vs Yaptığı Yorumlar */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border-subtle)] pb-3">
        <button
          type="button"
          onClick={() => setReviewsSubTab("received")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            reviewsSubTab === "received"
              ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] border border-transparent"
          }`}
        >
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span>{isTr ? "Aldığı Değerlendirmeler" : "Reviews Received"}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface border border-[var(--color-border-subtle)] font-mono">
            {receivedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setReviewsSubTab("given")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            reviewsSubTab === "given"
              ? "bg-blue-500/15 text-blue-300 border border-blue-500/30 shadow-xs"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] border border-transparent"
          }`}
        >
          <HeartHandshake className="h-3.5 w-3.5 text-blue-400" />
          <span>{isTr ? "Yaptığı Değerlendirmeler" : "Reviews Given"}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface border border-[var(--color-border-subtle)] font-mono">
            {givenCount}
          </span>
        </button>
      </div>

      {/* VIEW A: ALDIĞI DEĞERLENDİRMELER */}
      {reviewsSubTab === "received" && (
        <div className="space-y-4">
          {renderReceivedReviewsContent()}
        </div>
      )}

      {/* VIEW B: YAPTIĞI DEĞERLENDİRMELER */}
      {reviewsSubTab === "given" && (
        <div className="space-y-4">
          {/* Generosity Index Banner */}
          <div className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-5 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <HeartHandshake className="h-5 w-5 text-blue-400" />
                <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                  {isTr ? "Topluluk Değerlendirme & Cömertlik Endeksi" : "Rater Generosity Index"}
                </h4>
              </div>
              {reviewsSummary && reviewsSummary.givenReviewsCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-500/15 text-blue-300 border border-blue-500/25 text-xs font-bold font-mono w-fit">
                  <Star className="h-3.5 w-3.5 fill-blue-400 text-blue-400" />
                  <span>{isTr ? "Ortalama Verdiği:" : "Avg Given:"} {reviewsSummary.generosityIndex.toFixed(1)} / 5.0</span>
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {isTr
                ? "Operis'te değerlendirme şeffaflığı çift yönlüdür. Kullanıcının iş ortakları için bıraktığı değerlendirmeler ve verdiği puanlar, ne kadar adil, yapıcı ve profesyonel bir yaklaşımı olduğunu ortaya koyar."
                : "Transparency is bilateral on Operis. Reviews and ratings given by this user demonstrate their fairness, constructiveness, and professional standards."}
            </p>
          </div>

          {reviewsSummary && reviewsSummary.givenReviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviewsSummary.givenReviews.map((item) => {
                const compDate = new Date(item.createdAt);
                const formattedDate = new Intl.DateTimeFormat(isTr ? "tr-TR" : "en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }).format(compDate);

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 p-5 space-y-3.5 flex flex-col justify-between group hover:border-blue-500/30 transition-all shadow-xs"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 text-blue-400 font-bold text-xs font-mono">
                          <Star className="h-3.5 w-3.5 fill-blue-400" />
                          <span>{item.overallRating}.0 {isTr ? "Verildi" : "Awarded"}</span>
                        </div>
                        <span className="text-[10px] text-[var(--color-text-tertiary)]">
                          {formattedDate}
                        </span>
                      </div>

                      <div className="relative pl-4 text-xs text-[var(--color-text-primary)] leading-relaxed italic border-l-2 border-blue-500/40 py-0.5">
                        <Quote className="h-3 w-3 text-blue-400/50 absolute -left-1.5 -top-1" />
                        "{item.comment}"
                      </div>

                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {item.tags.map((t) => (
                            <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 font-medium">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-[var(--color-border-subtle)] pt-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <AvatarInitials name={item.recipientDisplayName || "Partner"} size="sm" />
                        <div>
                          <span className="text-[10px] text-[var(--color-text-tertiary)] block">
                            {isTr ? "Değerlendirilen Ortak:" : "Reviewed Partner:"}
                          </span>
                          <span className="font-semibold text-[var(--color-text-primary)] text-xs">
                            {item.recipientDisplayName} (@{item.recipientHandle})
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] text-[var(--color-text-tertiary)] max-w-[130px] truncate text-right font-medium">
                        {item.projectTitleSnapshot}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title={isTr ? "Henüz başka bir kullanıcı için yapılmış değerlendirme yok" : "No reviews given yet"}
              description={
                isTr
                  ? "Bu kullanıcı henüz tamamlanan bir projede iş ortağı için puan veya yorum kaydetmemiştir."
                  : "This user has not yet submitted a review for a project counterparty."
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
