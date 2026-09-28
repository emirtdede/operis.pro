"use client";

import { useEffect, useRef } from "react";

export const FOCUSABLE_ELEMENTS_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Returns all visible and interactive focusable elements inside a container element.
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS_SELECTOR));

  return elements.filter((el) => {
    // Check if element is visible and not hidden
    return (
      !el.hasAttribute("disabled") &&
      el.getAttribute("aria-hidden") !== "true" &&
      (el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0)
    );
  });
}

/**
 * Traps Tab and Shift+Tab key navigation within a dialog or modal container.
 * Wraps around from first to last and last to first.
 */
export function handleTabFocusTrap(container: HTMLElement, event: KeyboardEvent): void {
  if (event.key !== "Tab") return;

  const focusable = getFocusableElements(container);
  if (focusable.length === 0) {
    event.preventDefault();
    container.focus();
    return;
  }

  const firstElement = focusable[0];
  const lastElement = focusable[focusable.length - 1];

  if (!firstElement || !lastElement) {
    return;
  }

  if (event.shiftKey) {
    // Shift + Tab (backward)
    if (document.activeElement === firstElement || document.activeElement === container) {
      event.preventDefault();
      lastElement.focus();
    }
  } else {
    // Tab (forward)
    if (document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
}

export interface UseFocusTrapOptions {
  isActive: boolean;
  onEscape?: () => void;
  returnFocus?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  preventScroll?: boolean;
}

/**
 * React hook implementing W3C WAI-ARIA modal dialog focus management:
 * 1. Saves previously active element before opening.
 * 2. Transits focus to first focusable element (or specified ref) on mount.
 * 3. Enforces focus trap within container boundaries on Tab / Shift+Tab.
 * 4. Listens for Escape key to close.
 * 5. Returns focus back to trigger element upon closing.
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  options: UseFocusTrapOptions
) {
  const { isActive, onEscape, returnFocus = true, initialFocusRef } = options;
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    if (typeof document !== "undefined") {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
    }

    const timer = setTimeout(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else if (containerRef.current) {
        const focusable = getFocusableElements(containerRef.current);
        const first = focusable[0];
        if (first) {
          first.focus();
        } else {
          containerRef.current.focus();
        }
      }
    }, 20);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return;

      if (e.key === "Escape" && onEscape) {
        e.preventDefault();
        e.stopPropagation();
        onEscape();
      } else if (e.key === "Tab") {
        handleTabFocusTrap(containerRef.current, e);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);

      if (returnFocus && previousActiveElementRef.current) {
        try {
          previousActiveElementRef.current.focus();
        } catch {
          // Ignore if previous active element is no longer in DOM
        }
      }
    };
  }, [isActive, onEscape, returnFocus, initialFocusRef, containerRef]);
}
