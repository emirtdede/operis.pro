"use client";

import React, { useEffect, useRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ isOpen, onClose, title, description, children, className }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement as HTMLElement;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    // Focus modal content
    dialogRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previousActiveElement.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby={description ? "dialog-desc" : undefined}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog Surface */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={twMerge(
          clsx(
            "relative w-full max-w-lg max-h-[min(90dvh,calc(100vh-2rem))] flex flex-col rounded-3xl bg-[var(--color-surface-elevated)] p-5 sm:p-8 shadow-2xl border border-[var(--color-border-subtle)] overflow-hidden focus:outline-none z-10",
            "animate-in fade-in-0 zoom-in-95 duration-200",
            className
          )
        )}
      >
        {/* Ambient Top Glows */}
        <div
          className="pointer-events-none absolute -top-24 -left-24 w-52 h-52 rounded-full bg-blue-500/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 -right-24 w-52 h-52 rounded-full bg-purple-500/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent"
          aria-hidden="true"
        />

        <div className="relative z-10 flex items-start justify-between gap-4 mb-4 shrink-0">
          <div>
            <h2
              id="dialog-title"
              className="text-lg sm:text-xl font-bold tracking-tight text-[var(--color-text-primary)]"
            >
              {title}
            </h2>
            {description && (
              <p
                id="dialog-desc"
                className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1.5 leading-relaxed"
              >
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-full p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] border border-transparent hover:border-[var(--color-border-subtle)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 shrink-0"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="relative z-10 mt-1 flex-1 overflow-y-auto min-h-0 pr-1 overscroll-contain">{children}</div>
      </div>
    </div>
  );
}
