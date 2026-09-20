"use client";

import { useState } from "react";
import { CheckCircle2, AlertTriangle, Check, Copy, Download } from "lucide-react";
import { Button } from "../../ui/button";

export interface TwoFactorBackupCodesModalProps {
  isOpen: boolean;
  locale: string;
  backupCodes: string[];
  onClose: () => void;
}

export function TwoFactorBackupCodesModal({
  isOpen,
  locale,
  backupCodes,
  onClose,
}: TwoFactorBackupCodesModalProps) {
  const [copiedCodes, setCopiedCodes] = useState(false);

  if (!isOpen) return null;

  const isTr = locale === "tr";

  const handleCopyBackupCodes = () => {
    if (backupCodes.length === 0) return;
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2500);
  };

  const handleDownloadBackupCodes = () => {
    if (backupCodes.length === 0) return;
    const content = `OPERIS - 2FA ACIL DURUM YEDEK KURTARMA KODLARI\nOlusturulma Tarihi: ${new Date().toISOString()}\n\nHer kod tek kullanimliktir. Authenticator uygulamaniza erisemediginizde bu kodlardan biriyle giris yapabilirsiniz:\n\n${backupCodes.map((c, i) => `${i + 1}. ${c}`).join("\n")}\n\nLutfen bu dosyayi guvenli bir yerde saklayiniz.`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "operis-2fa-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={isTr ? "2FA Kurtarma Kodları" : "2FA Backup Codes"}
    >
      <div className="relative w-full max-w-lg max-h-[min(92dvh,calc(100dvh-2rem))] flex flex-col overflow-hidden rounded-2xl border border-emerald-500/30 bg-[var(--color-surface-base)] p-5 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-4 shrink-0">
          <div className="flex items-center gap-2.5 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">
              {isTr ? "2FA Acil Durum Kurtarma Kodları" : "Emergency Backup Codes"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 py-4 space-y-4 pr-1">
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">
                {isTr ? "Bu kodları güvenli bir yerde saklayınız!" : "Save these codes securely!"}
              </p>
              <p className="opacity-90 leading-relaxed">
                {isTr
                  ? "Telefonunuzu kaybeder veya Authenticator uygulamanıza erişemezseniz hesabınıza bu 8 haneli tek kullanımlık kodlarla giriş yapabilirsiniz. Her kod yalnızca 1 kez geçerlidir."
                  : "If you lose your phone or cannot access your Authenticator app, you can log in using these single-use codes. Each code can be used only once."}
              </p>
            </div>
          </div>

          {/* Backup Codes Grid */}
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 p-3 bg-slate-950/80 rounded-xl border border-slate-800">
            {backupCodes.map((code, idx) => (
              <div
                key={idx}
                className="font-mono text-xs font-semibold tracking-wider text-slate-200 bg-slate-900/90 py-1.5 px-3 rounded border border-slate-800 text-center select-all"
              >
                <span className="text-slate-500 text-[10px] mr-1.5">{idx + 1}.</span>
                {code}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 flex flex-wrap items-center justify-between gap-2.5 border-t border-[var(--color-border-subtle)] shrink-0">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCopyBackupCodes}
              className="inline-flex items-center gap-1.5 text-xs flex-1 sm:flex-none"
            >
              {copiedCodes ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">{isTr ? "Kopyalandı!" : "Copied!"}</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>{isTr ? "Kopyala" : "Copy Codes"}</span>
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleDownloadBackupCodes}
              className="inline-flex items-center gap-1.5 text-xs flex-1 sm:flex-none"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isTr ? "İndir (.txt)" : "Download (.txt)"}</span>
            </Button>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            {isTr ? "Kodları Kaydettim, Tamamla" : "I've Saved Them, Done"}
          </Button>
        </div>
      </div>
    </div>
  );
}
