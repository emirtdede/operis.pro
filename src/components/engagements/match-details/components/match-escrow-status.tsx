"use client";

import { Award, Check, Quote, Send, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { type EndorsementItem, getEndorseButtonLabel } from "../types";

export interface MatchEscrowStatusProps {
  offerMessage: string;
  budgetLabel: string | null;
  timelineLabel: string | null;
  isTr: boolean;
  currentStatus: string;
  completed: boolean;
  myMark: string;
  isLoading: boolean;
  feedback: string | null;
  counterpartyCompletionStatus?: string | null;
  counterpartyDisplayName: string;
  onMarkComplete: () => void;
  onDispute: () => void;
  onOpenCancelModal: () => void;
  endorsements: EndorsementItem[];
  endorsementText: string;
  setEndorsementText: (text: string) => void;
  isSubmittingEndorsement: boolean;
  endorsementFeedback: string | null;
  onSubmitEndorsement: (e: React.FormEvent) => void;
  currentUserId: string;
}

export function MatchEscrowStatus({
  offerMessage,
  budgetLabel,
  timelineLabel,
  isTr,
  currentStatus,
  completed,
  myMark,
  isLoading,
  feedback,
  counterpartyCompletionStatus,
  counterpartyDisplayName,
  onMarkComplete,
  onDispute,
  onOpenCancelModal,
  endorsements,
  endorsementText,
  setEndorsementText,
  isSubmittingEndorsement,
  endorsementFeedback,
  onSubmitEndorsement,
  currentUserId,
}: MatchEscrowStatusProps) {
  const existingMyEndorsement = endorsements.find((e) => e.authorUserId === currentUserId);

  const renderMutualCompletionBody = () => {
    if (currentStatus === "CANCELLED") {
      return (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
          {isTr
            ? "İş birliği iptal edildiğinden tamamlama ve uyuşmazlık onayları devre dışı bırakılmıştır."
            : "Completion and dispute confirmation actions are disabled because this engagement has been cancelled."}
        </div>
      );
    }

    if (completed) {
      return (
        <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] p-4 text-xs text-[var(--color-text-secondary)]">
          {isTr
            ? "Her iki taraf da işin tamamlandığını onaylamıştır. Bu proje genel profillerinizde başarıyla tamamlanan iş olarak listelenmektedir."
            : "Both parties have confirmed completion. This project is now published under completed work on your public profiles."}
        </div>
      );
    }

    let markCompleteButtonText = isTr ? "İşi Tamamlandı Olarak Onayla" : "Confirm Work as Completed";
    if (myMark === "MARKED_COMPLETE") {
      markCompleteButtonText = isTr ? "Tamamlandı Olarak İşaretlendi" : "Marked Complete";
    }

    return (
      <div className="space-y-4">
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          {isTr
            ? "Proje bittiğinde her iki taraf da onay verdiğinde süreç tamamlanmış sayılır ve profilinize işlenir."
            : "When the work is done, both parties must confirm for the project to be verified on your profile."}
        </p>

        {counterpartyCompletionStatus === "MARKED_COMPLETE" && (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 w-fit">
            <Check className="h-3.5 w-3.5" />
            <span>
              {isTr
                ? `${counterpartyDisplayName} tamamlandı onayını verdi. Sizin onayınız bekleniyor.`
                : `${counterpartyDisplayName} confirmed completion. Awaiting your confirmation.`}
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant={myMark === "MARKED_COMPLETE" ? "secondary" : "primary"}
            onClick={onMarkComplete}
            disabled={isLoading || myMark === "MARKED_COMPLETE"}
            className="gap-2"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            <span>{markCompleteButtonText}</span>
          </Button>

          <Button
            variant="ghost"
            onClick={onDispute}
            disabled={isLoading || myMark === "DISPUTES_COMPLETION"}
            className="text-xs text-rose-400 hover:text-rose-300"
          >
            {isTr ? "İş Tamamlanmadı (Uyuşmazlık)" : "Work Incomplete (Dispute)"}
          </Button>

          <Button
            variant="ghost"
            onClick={onOpenCancelModal}
            disabled={isLoading}
            className="text-xs text-[var(--color-text-tertiary)] hover:text-rose-400 gap-1.5 cursor-pointer ml-auto"
          >
            <XCircle className="h-3.5 w-3.5" />
            <span>{isTr ? "İş Birliğini İptal Et" : "Cancel Engagement"}</span>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Agreed Offer Proposal Summary */}
      <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
          {isTr ? "Kabul Edilen Teklif Detayları" : "Accepted Proposal Details"}
        </h2>

        {(budgetLabel || timelineLabel) && (
          <div className="flex flex-wrap items-center gap-6 text-xs text-[var(--color-text-secondary)] border-b border-[var(--color-border-subtle)] pb-3">
            {budgetLabel && (
              <div>
                <strong>{isTr ? "Önerilen Bütçe:" : "Budget:"}</strong> {budgetLabel}
              </div>
            )}
            {timelineLabel && (
              <div>
                <strong>{isTr ? "Tahmini Süre:" : "Timeline:"}</strong> {timelineLabel}
              </div>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/70 p-5 text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
          {offerMessage}
        </div>
      </div>

      {/* 3-Step Direct Payment & Dispute Safety Card */}
      <div className="rounded-3xl border border-emerald-500/25 bg-emerald-500/5 backdrop-blur-xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          <span>
            {isTr
              ? "Operis Komisyonsuz İş Birliği & Güvenlik Protokolü"
              : "Zero-Commission Collaboration & Safety Protocol"}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="space-y-1.5 p-3.5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
            <span className="text-xs font-bold text-[var(--color-text-primary)] block">
              {isTr ? "1. Doğrudan Banka Havalesi" : "1. Direct Bank Transfer"}
            </span>
            <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
              {isTr
                ? "Ödemeleri platform araya girmeden, doğrudan karşı tarafın IBAN adresine açıklama yazarak iletin."
                : "Transfer funds directly via bank wire/IBAN without intermediary platform escrow holds."}
            </p>
          </div>
          <div className="space-y-1.5 p-3.5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
            <span className="text-xs font-bold text-[var(--color-text-primary)] block">
              {isTr ? "2. Resmi Sözleşme Taslağı" : "2. Official Contract Draft"}
            </span>
            <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
              {isTr
                ? "Haklarınızı güvenceye almak için yukarıdaki 'Sözleşme Taslağı' butonundaki yasal şablonu kullanın."
                : "Protect your IP and deliverables using the legal draft template provided in the header."}
            </p>
          </div>
          <div className="space-y-1.5 p-3.5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
            <span className="text-xs font-bold text-[var(--color-text-primary)] block">
              {isTr ? "3. Karşılıklı Tamamlama" : "3. Bilateral Confirmation"}
            </span>
            <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
              {isTr
                ? "İş teslim edildiğinde ve ödeme alındığında aşağıdaki butondan karşılıklı tamamlama teyidi verin."
                : "Once work is delivered and payment settled, submit bilateral completion confirmation below."}
            </p>
          </div>
        </div>
      </div>

      {/* Bilateral Mutual Completion Section */}
      <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
          {isTr ? "İş Tamamlanma Teyidi" : "Mutual Completion Confirmation"}
        </h2>

        {feedback && (
          <div className="rounded-lg bg-[var(--color-surface-hover)] p-4 text-xs text-[var(--color-text-primary)] font-medium">
            {feedback}
          </div>
        )}

        {renderMutualCompletionBody()}
      </div>

      {/* Bilateral Verified Endorsement Section (Topluluk Tavsiye Notları) */}
      {completed && (
        <div className="rounded-3xl border border-amber-500/25 bg-gradient-to-br from-amber-500/5 via-[var(--color-surface-base)] to-transparent backdrop-blur-xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-3">
            <div className="flex items-center gap-2 font-bold text-base text-[var(--color-text-primary)]">
              <Award className="h-5 w-5 text-amber-400" aria-hidden="true" />
              <span>
                {isTr ? "Doğrulanmış Topluluk Tavsiye Mektubu" : "Verified Community Endorsement"}
              </span>
            </div>
            <span className="text-xs text-amber-400 font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
              {isTr
                ? "Sıfır Yıldız Puanı / %100 Gerçek Yorum"
                : "Zero Star Revenge / 100% Real Vouch"}
            </span>
          </div>

          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            {isTr
              ? "Manipülatif yıldız puanlamaları yerine, başarıyla tamamlanan iş birliğinize ilişkin 1 paragraflık doğrulanmış tavsiye mektubu bırakın. Bu mektup iş ortağınızın profilinde kalıcı bir güven kanıtı olarak sergilenir."
              : "Instead of revenge star ratings, leave a verified 1-paragraph testimonial letter for your collaboration. It is displayed permanently on your partner's public profile."}
          </p>

          {endorsementFeedback && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-[var(--color-text-primary)] font-medium">
              {endorsementFeedback}
            </div>
          )}

          {existingMyEndorsement ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4" />
                  {isTr ? "Tavsiye Notunuz Yayınlandı" : "Your Endorsement is Published"}
                </span>
                <span className="text-[10px] text-[var(--color-text-tertiary)]">
                  {new Date(existingMyEndorsement.createdAt).toLocaleDateString(
                    isTr ? "tr-TR" : "en-US"
                  )}
                </span>
              </div>
              <div className="relative pl-6 text-xs text-[var(--color-text-primary)] leading-relaxed italic border-l-2 border-emerald-500/40 my-2">
                <Quote className="h-3.5 w-3.5 text-emerald-400/50 absolute -left-1.5 -top-1" />
                &ldquo;{existingMyEndorsement.content}&rdquo;
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmitEndorsement} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
                  {isTr
                    ? `${counterpartyDisplayName} için 1 Paragraflık Tavsiye Notu (20 - 500 Karakter)`
                    : `1-Paragraph Recommendation for ${counterpartyDisplayName} (20 - 500 Chars)`}
                </label>
                <textarea
                  value={endorsementText}
                  onChange={(e) => setEndorsementText(e.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder={
                    isTr
                      ? `${counterpartyDisplayName} ile projemizde çalıştık, API mimarisini taahhüt ettiği tarihten önce sıfır hatayla teslim etti...`
                      : `Worked with ${counterpartyDisplayName} on our project, delivered the core architecture ahead of schedule with zero defects...`
                  }
                  className="w-full rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] p-3 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all resize-none"
                />
                <div className="flex items-center justify-between text-[11px] text-[var(--color-text-tertiary)] px-1 mt-1">
                  <span>
                    {isTr
                      ? "Platform kuralları gereği emoji kullanılamaz."
                      : "Emojis are prohibited."}
                  </span>
                  <span className={endorsementText.length > 500 ? "text-red-400 font-bold" : ""}>
                    {endorsementText.length} / 500
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSubmittingEndorsement || endorsementText.trim().length < 20}
                className="gap-2 bg-amber-600 hover:bg-amber-500 border-amber-600 text-white shadow-md shadow-amber-500/20"
              >
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{getEndorseButtonLabel(isSubmittingEndorsement, isTr)}</span>
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
