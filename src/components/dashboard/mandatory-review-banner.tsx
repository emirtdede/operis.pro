"use client";

import { useEffect, useState } from "react";
import { Award, ArrowRight } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { PendingMandatoryReviewDto, ReviewDto } from "@/src/modules/reviews/types";
import { ReviewSubmissionModal } from "@/src/components/engagements/review-submission-modal";

export interface MandatoryReviewBannerProps {
  locale?: string;
  initialPending?: PendingMandatoryReviewDto[];
}

export function MandatoryReviewBanner({
  locale = "tr",
  initialPending = [],
}: MandatoryReviewBannerProps) {
  const isTr = locale === "tr";
  const [pendingList, setPendingList] = useState<PendingMandatoryReviewDto[]>(initialPending);
  const [activeReviewModal, setActiveReviewModal] = useState<PendingMandatoryReviewDto | null>(null);

  useEffect(() => {
    if (initialPending.length === 0) {
      fetch("/api/users/me/pending-reviews")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.pending) {
            setPendingList(data.pending);
          }
        })
        .catch(() => {});
    }
  }, [initialPending.length]);

  if (pendingList.length === 0 || !pendingList[0]) return null;

  const item = pendingList[0];

  return (
    <>
      <section
        role="region"
        aria-label={isTr ? "Zorunlu Değerlendirme Bildirimi" : "Mandatory Review Notice"}
        className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 sm:p-5 transition-all shadow-sm space-y-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25 shrink-0">
              <Award className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  {isTr ? "Zorunlu Puanlama & Değerlendirme" : "Mandatory Review Required"}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                  {item.daysRemaining} {isTr ? "gün kaldı" : "days left"}
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">
                "{item.projectTitle}" {isTr ? "iş birliğinizi değerlendirin" : "review your engagement"}
              </h4>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {isTr
                  ? `Sistem kuralları gereği yeni teklif verebilmek veya ilan açabilmek için ${item.counterpartyName} ile çalışmanızı puanlamanız gerekmektedir.`
                  : `Please evaluate your work with ${item.counterpartyName} to continue publishing listings or submitting offers.`}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setActiveReviewModal(item)}
            className="gap-2 shrink-0 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border-none shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <span>{isTr ? "Değerlendirmeyi Yap (60 Sn)" : "Complete Review (60s)"}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {activeReviewModal && (
        <ReviewSubmissionModal
          isOpen={true}
          onClose={() => setActiveReviewModal(null)}
          engagementId={activeReviewModal.engagementId}
          counterpartyName={activeReviewModal.counterpartyName}
          projectTitle={activeReviewModal.projectTitle}
          counterpartyRole={activeReviewModal.counterpartyRole}
          locale={locale}
          onSuccess={(_rev: ReviewDto) => {
            setPendingList((prev) =>
              prev.filter((p) => p.engagementId !== activeReviewModal.engagementId)
            );
            setActiveReviewModal(null);
          }}
        />
      )}
    </>
  );
}
