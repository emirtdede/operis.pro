"use client";

import {
  AlertTriangle,
  Bell,
  Mail,
  MessageCircle,
  Moon,
  ShieldCheck,
  Video,
  X,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { ContractDraftModal } from "@/src/components/engagements/contract-draft-modal";
import {
  type CounterpartyInfo,
  type CurrentUserInfo,
  type CounterpartyLocalTimeInfo,
  getCancelButtonLabel,
  getSendPingButtonLabel,
} from "../types";

export interface MatchActionModalsProps {
  // Contract Modal Props
  contractModalOpen: boolean;
  onCloseContractModal: () => void;
  engagementId: string;
  listingTitle: string;
  category: string;
  matchedAt: string | Date;
  offerMessage: string;
  budgetLabel: string | null;
  timelineLabel: string | null;
  counterparty: CounterpartyInfo;
  currentUser?: CurrentUserInfo;
  isOwner: boolean;
  locale: string;
  isTr: boolean;

  // Cancel Modal Props
  cancelModalOpen: boolean;
  onCloseCancelModal: () => void;
  cancelReason: string;
  setCancelReason: (val: string) => void;
  isCancelling: boolean;
  cancelFeedback: string | null;
  onCancelEngagement: () => void;

  // Ping Modal Props
  pingModalOpen: boolean;
  onClosePingModal: () => void;
  pingTemplate: "whatsapp" | "meeting" | "email" | "ready";
  setPingTemplate: (val: "whatsapp" | "meeting" | "email" | "ready") => void;
  isPinging: boolean;
  pingFeedback: {
    type: "success" | "error";
    message: string;
  } | null;
  onSendPing: () => void;

  // Night Call Modal Props
  showNightCallModal: boolean;
  onCloseNightCallModal: () => void;
  counterpartyTime: CounterpartyLocalTimeInfo;
  waUrl: string | null;
  telUrl: string | null;
}

export function MatchActionModals({
  contractModalOpen,
  onCloseContractModal,
  engagementId,
  listingTitle,
  category,
  matchedAt,
  offerMessage,
  budgetLabel,
  timelineLabel,
  counterparty,
  currentUser,
  isOwner,
  locale,
  isTr,

  cancelModalOpen,
  onCloseCancelModal,
  cancelReason,
  setCancelReason,
  isCancelling,
  cancelFeedback,
  onCancelEngagement,

  pingModalOpen,
  onClosePingModal,
  pingTemplate,
  setPingTemplate,
  isPinging,
  pingFeedback,
  onSendPing,

  showNightCallModal,
  onCloseNightCallModal,
  counterpartyTime,
  waUrl,
  telUrl,
}: MatchActionModalsProps) {
  return (
    <>
      {/* Contract Modal */}
      <ContractDraftModal
        isOpen={contractModalOpen}
        onClose={onCloseContractModal}
        engagementId={engagementId}
        listingTitle={listingTitle}
        category={category}
        matchedAt={matchedAt}
        offerMessage={offerMessage}
        budgetLabel={budgetLabel}
        timelineLabel={timelineLabel}
        counterparty={counterparty}
        currentUser={currentUser || { displayName: undefined, email: undefined }}
        isOwner={isOwner}
        locale={locale}
      />

      {/* Cancel Engagement Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-in fade-in">
          <div className="relative w-full max-w-md max-h-[min(92dvh,calc(100dvh-2rem))] flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3 shrink-0">
              <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm sm:text-base">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <h3>{isTr ? "İş Birliğini İptal Et" : "Cancel Engagement"}</h3>
              </div>
              <button
                type="button"
                onClick={onCloseCancelModal}
                className="p-1 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
                aria-label={isTr ? "Kapat" : "Close"}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 py-3 space-y-4 pr-1">
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {isTr
                  ? "Bu işlemi onayladığınızda iş birliği sonlandırılacak ve ilan 'Yayında Değil' statüsüne alınacaktır. İlan sahibi dilediği zaman ilanı panelinden tekrar yayına alabilir."
                  : "Confirming this will terminate the collaboration and move the listing to inactive. The listing owner can reactivate it from their dashboard at any time."}
              </p>

              {cancelFeedback && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300 font-medium">
                  {cancelFeedback}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                  {isTr ? "İptal Gerekçesi (Opsiyonel)" : "Cancellation Reason (Optional)"}
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder={
                    isTr
                      ? "Örn: Zamanlama uyuşmazlığı, karşılıklı mutabakat vb."
                      : "e.g. Timeline mismatch, mutual agreement, etc."
                  }
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] p-3 text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-rose-500/50 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--color-border-subtle)] shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={onCloseCancelModal}
                disabled={isCancelling}
              >
                {isTr ? "Vazgeç" : "Keep Active"}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={onCancelEngagement}
                disabled={isCancelling}
                className="bg-rose-600 hover:bg-rose-500 border-rose-600 text-white font-semibold cursor-pointer"
              >
                {getCancelButtonLabel(isCancelling, isTr)}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Ping Modal */}
      {pingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-in fade-in">
          <div className="relative w-full max-w-lg max-h-[min(92dvh,calc(100dvh-2rem))] flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3 shrink-0">
              <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm sm:text-base">
                <Bell className="h-5 w-5 shrink-0" />
                <h3>{isTr ? "Platform İçi Hafif Dürtme Gönder" : "Send In-Platform Quick Ping"}</h3>
              </div>
              <button
                type="button"
                onClick={onClosePingModal}
                className="p-1 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
                aria-label={isTr ? "Kapat" : "Close"}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 py-3 space-y-4 pr-1">
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {isTr
                  ? "Eşleştiğiniz tarafa platform içi bildirim zili üzerinden saygılı ve hazır bir hatırlatma iletin. Taciz ve spam'i önlemek için gönderim sonrası 15 dakikalık bekleme süresi (cooldown) uygulanır."
                  : "Send a polite, pre-composed reminder to counterparty's in-app notification bell. A 15-minute anti-spam cooldown applies after each ping."}
              </p>

              {pingFeedback && (
                <div
                  className={`rounded-xl border p-3 text-xs font-medium ${
                    pingFeedback.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                      : "bg-rose-500/10 border-rose-500/20 text-rose-300"
                  }`}
                >
                  {pingFeedback.message}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                  {isTr ? "Dürtme Şablonu Seçin" : "Select Ping Template"}
                </label>
                <div className="space-y-2">
                  {[
                    {
                      key: "whatsapp" as const,
                      icon: MessageCircle,
                      title: isTr ? "WhatsApp Mesajı İletildi" : "WhatsApp Message Sent",
                      text: isTr
                        ? "WhatsApp üzerinden mesaj ilettim, müsait olduğunuzda kontrol edebilir misiniz?"
                        : "I sent you a WhatsApp message, could you please check when available?",
                    },
                    {
                      key: "meeting" as const,
                      icon: Video,
                      title: isTr ? "Toplantı Daveti Gönderildi" : "Meeting Invite Sent",
                      text: isTr
                        ? "Google Meet / Zoom toplantı daveti gönderdim, takviminizi bekliyorum."
                        : "I sent a Google Meet / Zoom invite, awaiting your schedule.",
                    },
                    {
                      key: "email" as const,
                      icon: Mail,
                      title: isTr ? "E-Posta Notları Paylaşıldı" : "Email Notes Sent",
                      text: isTr
                        ? "Kurumsal e-posta ile proje başlangıç notlarını paylaştım."
                        : "I shared the project kickoff notes via corporate email.",
                    },
                    {
                      key: "ready" as const,
                      icon: ShieldCheck,
                      title: isTr ? "Görüşmeye Hazırım" : "Ready to Connect",
                      text: isTr
                        ? "Proje başlangıcı ve sonraki adımlar için görüşmeye hazırım."
                        : "I am ready to connect for project kickoff and next steps.",
                    },
                  ].map((tpl) => {
                    const isSelected = pingTemplate === tpl.key;
                    const Icon = tpl.icon;
                    return (
                      <button
                        key={tpl.key}
                        type="button"
                        onClick={() => setPingTemplate(tpl.key)}
                        className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "border-amber-500 bg-amber-500/10 text-[var(--color-text-primary)] shadow-sm shadow-amber-500/10"
                            : "border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]"
                        }`}
                      >
                        <div className="flex items-center gap-2 font-semibold text-xs text-[var(--color-text-primary)] mb-1">
                          <Icon
                            className={`h-3.5 w-3.5 ${
                              isSelected ? "text-amber-400" : "text-[var(--color-text-tertiary)]"
                            }`}
                          />
                          <span>{tpl.title}</span>
                          {isSelected && (
                            <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                              {isTr ? "Seçildi" : "Selected"}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed italic">
                          &ldquo;{tpl.text}&rdquo;
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--color-border-subtle)] shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={onClosePingModal}
                disabled={isPinging}
              >
                {isTr ? "Vazgeç" : "Cancel"}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={onSendPing}
                disabled={isPinging}
                className="bg-amber-600 hover:bg-amber-500 border-amber-600 text-white font-semibold cursor-pointer shadow-md shadow-amber-600/20"
              >
                {getSendPingButtonLabel(isPinging, isTr)}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Late Night Call Courtesy Notice Modal */}
      {showNightCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-in fade-in">
          <div className="relative w-full max-w-md max-h-[min(92dvh,calc(100dvh-2rem))] flex flex-col overflow-hidden rounded-2xl border border-purple-500/30 bg-[var(--color-surface-base)] p-4 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3 shrink-0">
              <div className="flex items-center gap-2.5 text-purple-400 font-bold text-sm sm:text-base">
                <Moon className="h-5 w-5 shrink-0" />
                <h3>{isTr ? "Gece Araması Nezaket Uyarısı" : "Night Call Courtesy Notice"}</h3>
              </div>
              <button
                type="button"
                onClick={onCloseNightCallModal}
                className="p-1 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
                aria-label={isTr ? "Kapat" : "Close"}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="py-3 space-y-3">
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {isTr ? (
                  <>
                    Karşı tarafın yerel saati şu an{" "}
                    <strong className="text-purple-300 font-mono">
                      {counterpartyTime.timeStr}
                    </strong>{" "}
                    ({counterpartyTime.tz}) ve gece/dinlenme saatlerindedir.
                    <br />
                    <br />
                    Doğrudan telefon araması yerine{" "}
                    <strong className="text-white">WhatsApp</strong> veya{" "}
                    <strong className="text-white">Kurumsal E-Posta</strong> ile mesaj bırakmanız tavsiye edilir.
                  </>
                ) : (
                  <>
                    Counterparty&apos;s local time is currently{" "}
                    <strong className="text-purple-300 font-mono">
                      {counterpartyTime.timeStr}
                    </strong>{" "}
                    ({counterpartyTime.tz}) (Night / Resting hours).
                    <br />
                    <br />
                    We recommend leaving a message via{" "}
                    <strong className="text-white">WhatsApp</strong> or{" "}
                    <strong className="text-white">Email</strong> instead of placing an urgent phone call.
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--color-border-subtle)] shrink-0">
              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onCloseNightCallModal}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                >
                  {isTr ? "WhatsApp Aç" : "Open WhatsApp"}
                </a>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onCloseNightCallModal();
                  if (telUrl) {
                    window.location.href = telUrl;
                  }
                }}
                className="text-xs border-purple-500/40 text-purple-300 hover:bg-purple-500/10 cursor-pointer"
              >
                {isTr ? "Yine de Ara" : "Call Anyway"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
