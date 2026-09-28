"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { lockScroll, unlockScroll } from "@/src/lib/dom/scroll-lock";
import { useFocusTrap } from "@/src/lib/dom/focus-trap";

export interface ModalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  backdropClassName?: string;
  zIndex?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}

export function ModalOverlay({
  isOpen,
  onClose,
  children,
  className,
  backdropClassName = "bg-black/80 backdrop-blur-xs",
  zIndex = "z-[100]",
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  closeOnBackdropClick = true,
  closeOnEscape = true,
}: ModalOverlayProps) {
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Body scroll lock with reference-counted stack
  useEffect(() => {
    if (!isOpen) return;
    lockScroll();
    return () => {
      unlockScroll();
    };
  }, [isOpen]);

  // WAI-ARIA Focus Trap, initial focus transfer, Escape listener, and return focus
  useFocusTrap(containerRef, {
    isActive: isOpen && isMounted,
    onEscape: closeOnEscape ? onClose : undefined,
    returnFocus: true,
  });

  if (!isOpen) return null;
  if (!isMounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={containerRef}
      tabIndex={-1}
      className={twMerge(
        clsx(
          "fixed inset-0 flex items-center justify-center p-3 sm:p-6 overflow-y-auto outline-none",
          zIndex,
          className
        )
      )}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
    >
      {/* Backdrop overlay */}
      <div
        className={twMerge(
          clsx(
            "fixed inset-0 transition-opacity animate-in fade-in duration-200",
            backdropClassName
          )
        )}
        onClick={closeOnBackdropClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Content wrapper with pointer-events protection */}
      <div
        className="relative z-10 w-full flex items-center justify-center pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
