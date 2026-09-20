"use client";

import { useState } from "react";
import { Dialog } from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Printer, Copy, Check, ShieldCheck, Hash } from "lucide-react";
import { ChangeRequestRecord } from "@/src/modules/engagements/change-request-service";

export interface AddendumViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  changeRequest: ChangeRequestRecord | null;
  locale?: string;
}

function getCopyButtonLabel(copied: boolean, isTr: boolean): string {
  if (copied) {
    return isTr ? "Kopyalandı" : "Copied";
  }
  return isTr ? "Kopyala" : "Copy";
}

export function AddendumViewerModal({
  isOpen,
  onClose,
  changeRequest,
  locale = "tr",
}: AddendumViewerModalProps) {
  const isTr = locale !== "en";
  const [copied, setCopied] = useState(false);

  if (!changeRequest) return null;

  const handleCopy = async () => {
    if (!changeRequest.addendumContentMarkdown) return;
    try {
      await navigator.clipboard.writeText(changeRequest.addendumContentMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const seqPadded = String(changeRequest.sequenceNumber).padStart(2, "0");
  const modalTitle = isTr
    ? `Sözleşme Zeyilnamesi (Ek Protokol No: ${seqPadded})`
    : `Contract Addendum (Protocol No: ${seqPadded})`;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={modalTitle} className="max-w-4xl">
      <div className="p-6 space-y-6 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                  {isTr ? `Sözleşme Zeyilnamesi (Ek Protokol No: ${seqPadded})` : `Contract Addendum (Protocol No: ${seqPadded})`}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
                  {isTr ? "TBK m. 470/480 Uyumlu" : "Legally Executed"}
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] font-mono">
                {changeRequest.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="text-xs gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{getCopyButtonLabel(copied, isTr)}</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-500 text-white"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isTr ? "Yazdır / PDF" : "Print / PDF"}</span>
            </Button>
          </div>
        </div>

        {/* Document Content View */}
        <div className="flex-1 overflow-y-auto space-y-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] p-5 text-xs text-[var(--color-text-primary)] font-sans leading-relaxed">
          {changeRequest.addendumContentMarkdown ? (
            <div className="prose prose-invert max-w-none space-y-3 whitespace-pre-wrap">
              {changeRequest.addendumContentMarkdown}
            </div>
          ) : (
            <p className="text-[var(--color-text-tertiary)] italic">
              {isTr ? "Zeyilname içeriği hazırlanıyor..." : "Addendum content is being prepared..."}
            </p>
          )}

          {/* Cryptographic Proof Box */}
          <div className="mt-6 p-4 rounded-xl border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <Hash className="w-4 h-4" />
              <span>{isTr ? "Kriptografik Zincirleme Dijital Mühür (SHA-256)" : "Cryptographic Chained SHA-256 Seal"}</span>
            </div>
            <div className="font-mono text-[11px] text-[var(--color-text-secondary)] break-all bg-[var(--color-surface-hover)] p-2.5 rounded-lg border border-[var(--color-border-subtle)]">
              {changeRequest.addendumSha256 || "SHA-256-PENDING"}
            </div>
            {changeRequest.parentContractSha256 && (
              <div className="text-[10px] text-[var(--color-text-tertiary)]">
                {isTr ? "Dayanak Ana Sözleşme Parmak İzi: " : "Parent Contract Fingerprint: "}
                <span className="font-mono text-[var(--color-text-secondary)]">{changeRequest.parentContractSha256}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end shrink-0 pt-2 border-t border-[var(--color-border-subtle)]">
          <Button variant="outline" size="sm" onClick={onClose}>
            {isTr ? "Kapat" : "Close"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
