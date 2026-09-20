"use client";

import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "../../ui/button";
import { AccountDeleteModal } from "../modals/account-delete-modal";
import { SecurityFeedback } from "../types";

export interface DangerZoneSectionProps {
  locale: string;
  is2FAEnabled: boolean;
  onFeedback: (feedback: SecurityFeedback) => void;
}

export function DangerZoneSection({
  locale,
  is2FAEnabled,
  onFeedback,
}: DangerZoneSectionProps) {
  const isTr = locale === "tr";
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  return (
    <>
      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 backdrop-blur-xl p-6 sm:p-7 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" aria-hidden="true" />
              <span>
                {isTr
                  ? "Tehlikeli Bölge: Hesabı ve Verileri Sil"
                  : "Danger Zone: Delete Account & Data"}
              </span>
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed max-w-xl">
              {isTr
                ? "KVKK ve GDPR gereğince profil bilgileriniz, şifreli kimlik kayıtlarınız ve taslak ilanlarınız kalıcı olarak temizlenir. Bu işlem geri alınamaz."
                : "Under GDPR and KVKK, your public profile, encrypted identity records, and draft listings will be permanently purged. This action cannot be undone."}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteModalOpen(true)}
            className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500/60 text-xs font-semibold gap-1.5 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isTr ? "Hesabımı Sil" : "Delete My Account"}</span>
          </Button>
        </div>
      </div>

      <AccountDeleteModal
        isOpen={isDeleteModalOpen}
        locale={locale}
        is2FAEnabled={is2FAEnabled}
        onClose={() => setIsDeleteModalOpen(false)}
        onFeedback={onFeedback}
      />
    </>
  );
}
