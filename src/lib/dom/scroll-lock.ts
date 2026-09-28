/**
 * Global Scroll Lock Reference Counter
 *
 * Safely manages `document.body.style.overflow = "hidden"` across multiple
 * concurrently mounted or nested modals to prevent race conditions where closing
 * a secondary confirmation modal prematurely unlocks scrolling for the primary modal.
 */

let activeModals = 0;
let previousOverflow: string | null = null;

export function lockScroll(): void {
  if (typeof document === "undefined") return;

  if (activeModals === 0) {
    previousOverflow = document.body.style.overflow || "";
    document.body.style.overflow = "hidden";
  }
  activeModals++;
}

export function unlockScroll(): void {
  if (typeof document === "undefined") return;

  activeModals = Math.max(0, activeModals - 1);
  if (activeModals === 0) {
    document.body.style.overflow = previousOverflow ?? "";
    previousOverflow = null;
  }
}

export function getActiveModalCount(): number {
  return activeModals;
}
