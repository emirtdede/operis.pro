"use client";

import { useState, type FormEvent } from "react";
import { Trash2, X, Lock, KeyRound } from "lucide-react";
import { Button } from "../../ui/button";
import { TextInput } from "../../ui/text-input";
import { TextArea } from "../../ui/text-area";
import { SecurityFeedback, getErrorMessage } from "../types";

export interface AccountDeleteModalProps {
  isOpen: boolean;
  locale: string;
  is2FAEnabled: boolean;
  onClose: () => void;
  onFeedback: (feedback: SecurityFeedback) => void;
}

export function AccountDeleteModal({
  isOpen,
  locale,
  is2FAEnabled,
  onClose,
  onFeedback,
}: AccountDeleteModalProps) {
  const isTr = locale === "tr";

  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteTotpCode, setDeleteTotpCode] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteModalError, setDeleteModalError] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  if (!isOpen) return null;

  const handleDeleteAccount = async (e: FormEvent) => {
    e.preventDefault();
    setDeleteModalError(null);
    const expectedConfirm = isTr ? "HESABIMI SİL" : "DELETE";
    if (deleteConfirmText.trim() !== expectedConfirm) {
      setDeleteModalError(
        isTr
          ? `Lütfen onaylamak için tam olarak "${expectedConfirm}" yazınız.`
          : `Please type exactly "${expectedConfirm}" to confirm.`
      );
      return;
    }

    if (!deletePassword.trim()) {
      setDeleteModalError(
        isTr
          ? "Hesabınızı silmek için şifrenizi girmeniz zorunludur."
          : "Your account password is required to delete your account."
      );
      return;
    }

    const trimmedTotp = deleteTotpCode.trim();
    if (is2FAEnabled && (!trimmedTotp || (trimmedTotp.length !== 6 && trimmedTotp.length !== 8))) {
      setDeleteModalError(
        isTr
          ? "Lütfen 6 haneli iki aşamalı doğrulama (TOTP) kodunu veya 8 haneli kurtarma kodunuzu giriniz."
          : "Please enter your 6-digit 2FA code or 8-character recovery backup code."
      );
      return;
    }

    setIsDeletingAccount(true);

    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({
          password: deletePassword.trim(),
          totpCode: is2FAEnabled ? deleteTotpCode.trim() : undefined,
          reason: deleteReason.trim(),
          locale,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isTr ? "Hesap silinemedi." : "Failed to delete account."));
      }

      onClose();
      onFeedback({
        type: "success",
        message: isTr
          ? "Hesabınız ve kişisel verileriniz kalıcı olarak silindi. Yönlendiriliyorsunuz..."
          : "Your account and personal data have been permanently deleted. Redirecting...",
      });

      setTimeout(() => {
        window.location.href = isTr ? "/tr" : "/en";
      }, 1200);
    } catch (err: unknown) {
      setDeleteModalError(
        getErrorMessage(err, isTr ? "Hesap silme işlemi başarısız oldu." : "Account deletion failed.")
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const isFormValid =
    !isDeletingAccount &&
    Boolean(deletePassword.trim()) &&
    (!is2FAEnabled || deleteTotpCode.trim().length === 6 || deleteTotpCode.trim().length === 8) &&
    deleteConfirmText.trim() === (isTr ? "HESABIMI SİL" : "DELETE");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={isTr ? "Hesap Silme Onayı" : "Account Deletion Confirmation"}
    >
      <div className="relative w-full max-w-md max-h-[min(92dvh,calc(100dvh-2rem))] flex flex-col overflow-hidden rounded-2xl border border-red-500/30 bg-[var(--color-surface-base)] p-4 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3 shrink-0">
          <div className="flex items-center gap-2.5 text-red-400">
            <div className="h-9 w-9 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center shrink-0">
              <Trash2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                {isTr ? "Hesabınızı Silmek Üzeresiniz" : "Confirm Account Deletion"}
              </h3>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                {isTr ? "Geri Alınamaz İşlem" : "Permanent & Irreversible"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
            aria-label={isTr ? "Kapat" : "Close"}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleDeleteAccount} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto min-h-0 py-3 space-y-4 pr-1">
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {isTr
                ? "Hesabınızı sildiğinizde açık teklifleriniz geri çekilecek, aktif ilanlarınız sonlandırılacak ve profiliniz 'Eski Kullanıcı' olarak anonimleştirilecektir. Devam eden veya uyuşmazlık incelemesindeki projeleriniz varsa silme işlemi engellenecektir."
                : "Deleting your account will withdraw pending proposals, conclude active listings, and anonymize your profile. If you have active or disputed engagements, account deletion will be blocked."}
            </p>

            {deleteModalError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-400">
                {deleteModalError}
              </div>
            )}

            <TextInput
              label={isTr ? "Hesap Şifreniz" : "Account Password"}
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="••••••••••••"
              required
              startIcon={<Lock className="h-4 w-4" aria-hidden="true" />}
            />

            {is2FAEnabled && (
              <TextInput
                label={
                  isTr
                    ? "2FA Kodu veya 8 Haneli Kurtarma Kodu"
                    : "2FA Code or 8-Character Backup Code"
                }
                type="text"
                maxLength={8}
                value={deleteTotpCode}
                onChange={(e) => setDeleteTotpCode(e.target.value.trim().slice(0, 8))}
                placeholder={isTr ? "123456 veya abcd1234" : "123456 or abcd1234"}
                required
                startIcon={<KeyRound className="h-4 w-4" aria-hidden="true" />}
              />
            )}

            <TextArea
              label={isTr ? "Ayrılma Nedeni (İsteğe Bağlı)" : "Reason for Leaving (Optional)"}
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              rows={2}
              placeholder={
                isTr ? "Operis deneyiminizi nasıl geliştirebiliriz?" : "How could we improve?"
              }
            />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                {isTr
                  ? 'Onaylamak için lütfen "HESABIMI SİL" yazınız:'
                  : 'Please type "DELETE" to confirm:'}
              </label>
              <TextInput
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={isTr ? "HESABIMI SİL" : "DELETE"}
                required
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[var(--color-border-subtle)] shrink-0">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isDeletingAccount}
            >
              {isTr ? "Vazgeç" : "Cancel"}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!isFormValid}
              isLoading={isDeletingAccount}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold cursor-pointer"
            >
              {isTr ? "Kalıcı Olarak Sil" : "Permanently Delete"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
