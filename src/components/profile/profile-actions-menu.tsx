"use client";

import { useState } from "react";
import { MoreHorizontal, ShieldBan, Flag, AlertTriangle, X } from "lucide-react";
import { Button } from "../ui/button";
import { ContextualReportModal } from "../moderation/contextual-report-modal";

interface ProfileActionsMenuProps {
  targetUserId: string;
  targetHandle: string;
  targetDisplayName: string;
  locale?: string;
  isSelf?: boolean;
}

export function ProfileActionsMenu({
  targetUserId,
  targetHandle,
  targetDisplayName,
  locale = "tr",
  isSelf = false,
}: ProfileActionsMenuProps) {
  const isTr = locale === "tr";
  const [isOpen, setIsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (isSelf) return null;

  const handleBlockToggle = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const endpoint = isBlocked
        ? `/api/users/${targetUserId}/unblock`
        : `/api/users/${targetUserId}/block`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isTr ? "İşlem tamamlanamadı." : "Action failed."));
      }

      setIsBlocked(!isBlocked);
      setIsBlockModalOpen(false);
      setMessage(
        !isBlocked
          ? isTr
            ? "Kullanıcı engellendi."
            : "User has been blocked."
          : isTr
            ? "Kullanıcı engeli kaldırıldı."
            : "User has been unblocked."
      );
      setTimeout(() => setMessage(null), 4000);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : isTr ? "Hata oluştu." : "Error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-2">
        {message && (
          <span className="text-xs px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-in fade-in">
            {message}
          </span>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isTr ? "Daha Fazla İşlem" : "More Actions"}
          className="cursor-pointer"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/95 backdrop-blur-xl p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsReportOpen(true);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
            >
              <Flag className="h-3.5 w-3.5 text-amber-400" />
              <span>{isTr ? "Profili Şikayet Et" : "Report Profile"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsBlockModalOpen(true);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <ShieldBan className="h-3.5 w-3.5" />
              <span>
                {isBlocked
                  ? isTr
                    ? "Engeli Kaldır"
                    : "Unblock User"
                  : isTr
                    ? "Kullanıcıyı Engelle"
                    : "Block User"}
              </span>
            </button>
          </div>
        </>
      )}

      {/* Confirmation Modal for Block */}
      {isBlockModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-sm rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-6 shadow-2xl space-y-5">
            <button
              type="button"
              onClick={() => setIsBlockModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                {isBlocked
                  ? isTr
                    ? "Kullanıcı Engelini Kaldır"
                    : "Unblock User"
                  : isTr
                    ? "Kullanıcıyı Engelle"
                    : "Block User"}
              </h3>
            </div>

            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {isBlocked
                ? isTr
                  ? `"${targetDisplayName}" kullanıcısının engelini kaldırmak istediğinize emin misiniz? Kullanıcı ilanlarınıza tekrar teklif verebilecektir.`
                  : `Are you sure you want to unblock "${targetDisplayName}"? They will be able to submit proposals to your listings again.`
                : isTr
                  ? `"${targetDisplayName}" kullanıcısını engellediğinizde sizin ilanlarınıza teklif gönderemez ve doğrudan iletişim kuramaz.`
                  : `Blocking "${targetDisplayName}" prevents them from submitting offers to your listings and contacting you.`}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsBlockModalOpen(false)}
                disabled={isLoading}
              >
                {isTr ? "Vazgeç" : "Cancel"}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleBlockToggle}
                disabled={isLoading}
                className={
                  isBlocked ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"
                }
              >
                {isLoading
                  ? isTr
                    ? "İşleniyor..."
                    : "Processing..."
                  : isBlocked
                    ? isTr
                      ? "Engeli Kaldır"
                      : "Unblock"
                    : isTr
                      ? "Engelle"
                      : "Block"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Contextual Report Modal */}
      <ContextualReportModal
        targetType="profile"
        targetIdentifier={targetHandle}
        targetTitle={targetDisplayName}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        locale={locale}
      />
    </div>
  );
}
