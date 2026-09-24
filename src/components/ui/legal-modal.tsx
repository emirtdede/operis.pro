"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, ShieldCheck, Check, FileText } from "lucide-react";
import { Button } from "./button";
import { LEGAL_DOCUMENTS, LegalDocumentModel } from "@/src/lib/legal/legal-documents-data";

export interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentKey: string | null;
  locale?: "tr" | "en";
  onAccept?: (documentKey: string) => void;
}

export function LegalModal({
  isOpen,
  onClose,
  documentKey,
  locale = "tr",
  onAccept,
}: LegalModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const isTr = locale === "tr";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !documentKey || !mounted) return null;

  const docData: LegalDocumentModel | undefined =
    LEGAL_DOCUMENTS[documentKey]?.[locale] || LEGAL_DOCUMENTS[documentKey]?.["tr"];

  if (!docData) return null;

  const handleAcceptClick = () => {
    onAccept?.(documentKey);
    onClose();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 animate-in fade-in-0 duration-200"
      onClick={(e) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
          onClose();
        }
      }}
    >
      {/* Centered Modal Card */}
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xl shadow-black/30 dark:shadow-black/80 animate-in zoom-in-95 duration-150 overflow-hidden select-text"
      >
        {/* Subtle Ambient Glow */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />

        {/* Modal Header */}
        <div className="relative z-10 flex items-center justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2
                id="legal-modal-title"
                className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight leading-snug truncate"
                title={docData.title}
              >
                {docData.title}
              </h2>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--text-muted)]">
                <span>
                  {isTr ? "Son Güncelleme:" : "Updated:"} {docData.lastUpdated}
                </span>
                <span className="text-[var(--border-strong)]">•</span>
                <span className="font-mono text-[11px] font-semibold text-blue-500">
                  {docData.version}
                </span>
                {docData.contentHash && (
                  <>
                    <span className="text-[var(--border-strong)]">•</span>
                    <span
                      className="font-mono text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-help truncate max-w-[140px]"
                      title={`HMK m. 193 SHA-256 Dijital Doğrulama Özeti: ${docData.contentHash}`}
                    >
                      SHA-256: {docData.contentHash.slice(0, 8)}...
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={isTr ? "Kapat" : "Close"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="relative z-10 flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed overscroll-contain">
          {/* Key Protection Highlight Callout */}
          <div className="flex items-start gap-3 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 p-4">
            <ShieldCheck className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-xs sm:text-sm text-[var(--text-primary)] font-medium leading-relaxed">
              {docData.highlight}
            </div>
          </div>

          {/* Document Sections */}
          <div className="space-y-4 pt-1">
            {docData.sections.map((sec, idx) => (
              <div
                key={idx}
                className="space-y-2 rounded-2xl p-4 border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40"
              >
                <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] tracking-tight">
                  {sec.title}
                </h3>
                {sec.paragraphs.map((p, pIdx) => (
                  <p key={pIdx} className="text-xs text-[var(--text-secondary)]">
                    {p}
                  </p>
                ))}
                {sec.bullets && sec.bullets.length > 0 && (
                  <ul className="list-disc pl-5 space-y-1 text-xs text-[var(--text-secondary)] pt-1">
                    {sec.bullets.map((b, bIdx) => (
                      <li key={bIdx}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="relative z-10 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 sm:p-4 sm:px-6 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0">
          <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs cursor-pointer w-full sm:w-auto justify-center"
            >
              {isTr ? "Kapat" : "Close"}
            </Button>
            {docData.contentHash && (
              <span
                className="hidden sm:inline font-mono text-[10px] text-[var(--text-muted)]"
                title={`Kanonik SHA-256 Özeti: ${docData.contentHash}`}
              >
                Hash: {docData.contentHash.slice(0, 10)}...
              </span>
            )}
          </div>

          {onAccept && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleAcceptClick}
              className="text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20 w-full sm:w-auto"
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isTr ? "Okudum ve Kabul Ediyorum" : "I Read and Accept"}</span>
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
