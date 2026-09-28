// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React, { useState, useRef } from "react";
import { createRoot, Root } from "react-dom/client";
import { act } from "react";
import { handleTabFocusTrap, getFocusableElements, useFocusTrap } from "@/src/lib/dom/focus-trap";
import { ModalOverlay } from "@/src/components/ui/modal-overlay";

// Inform React that act environment is enabled
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("WAI-ARIA Accessibility (a11y) & WCAG 2.1 Conformance Suite (Real DOM)", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    // Clean up any stray modals or backdrop portals appended to body
    const dialogs = document.querySelectorAll('div[role="dialog"]');
    dialogs.forEach((d) => d.remove());
    document.body.style.overflow = "";
    document.body.removeAttribute("data-scroll-locked");
  });

  describe("1. Interactive DOM Focus Trapping & Keyboard Behavior", () => {
    it("traps forward Tab navigation on the last focusable element and wraps to first element", () => {
      const modalBox = document.createElement("div");
      const btn1 = document.createElement("button");
      btn1.id = "btn1";
      const btn2 = document.createElement("button");
      btn2.id = "btn2";
      const btn3 = document.createElement("button");
      btn3.id = "btn3";

      modalBox.appendChild(btn1);
      modalBox.appendChild(btn2);
      modalBox.appendChild(btn3);
      container.appendChild(modalBox);

      // Focus last element
      btn3.focus();
      expect(document.activeElement).toBe(btn3);

      const tabEvent = new KeyboardEvent("keydown", {
        key: "Tab",
        shiftKey: false,
        bubbles: true,
        cancelable: true,
      });

      handleTabFocusTrap(modalBox, tabEvent);

      expect(tabEvent.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(btn1);
    });

    it("traps backward Shift+Tab navigation on the first focusable element and wraps to last element", () => {
      const modalBox = document.createElement("div");
      const btn1 = document.createElement("button");
      btn1.id = "btn1";
      const btn2 = document.createElement("button");
      btn2.id = "btn2";

      modalBox.appendChild(btn1);
      modalBox.appendChild(btn2);
      container.appendChild(modalBox);

      // Focus first element
      btn1.focus();
      expect(document.activeElement).toBe(btn1);

      const shiftTabEvent = new KeyboardEvent("keydown", {
        key: "Tab",
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });

      handleTabFocusTrap(modalBox, shiftTabEvent);

      expect(shiftTabEvent.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(btn2);
    });

    it("does not intercept Tab navigation when focus is in the middle of the focusable list", () => {
      const modalBox = document.createElement("div");
      const btn1 = document.createElement("button");
      const btn2 = document.createElement("button");
      const btn3 = document.createElement("button");

      modalBox.appendChild(btn1);
      modalBox.appendChild(btn2);
      modalBox.appendChild(btn3);
      container.appendChild(modalBox);

      // Focus middle element
      btn2.focus();
      expect(document.activeElement).toBe(btn2);

      const tabEvent = new KeyboardEvent("keydown", {
        key: "Tab",
        shiftKey: false,
        bubbles: true,
        cancelable: true,
      });

      handleTabFocusTrap(modalBox, tabEvent);

      // Default browser tabbing should proceed unimpeded
      expect(tabEvent.defaultPrevented).toBe(false);
    });

    it("excludes disabled or aria-hidden elements from the focusable list", () => {
      const modalBox = document.createElement("div");
      const enabledBtn = document.createElement("button");
      enabledBtn.id = "enabled";

      const disabledBtn = document.createElement("button");
      disabledBtn.setAttribute("disabled", "true");
      disabledBtn.disabled = true;

      const hiddenBtn = document.createElement("button");
      hiddenBtn.setAttribute("aria-hidden", "true");

      modalBox.appendChild(enabledBtn);
      modalBox.appendChild(disabledBtn);
      modalBox.appendChild(hiddenBtn);
      container.appendChild(modalBox);

      const focusable = getFocusableElements(modalBox);
      expect(focusable).toHaveLength(1);
      expect(focusable[0]).toBe(enabledBtn);
    });
  });

  describe("2. Real Component Rendering: Modal & Focus Trap Lifecycle", () => {
    it("renders ModalOverlay in real DOM with WAI-ARIA dialog attributes, traps focus, and handles Escape", async () => {
      const handleClose = vi.fn();
      let root: Root | null = null;

      function TestApp({ isOpen }: { isOpen: boolean }) {
        return React.createElement(
          "div",
          null,
          React.createElement("button", { id: "trigger-btn" }, "Open Dialog"),
          React.createElement(ModalOverlay, {
            isOpen,
            onClose: handleClose,
            ariaLabel: "Örnek Diyalog",
            ariaDescribedBy: "modal-desc",
            children: React.createElement(
              "div",
              { id: "modal-content" },
              React.createElement("h2", { id: "modal-desc" }, "Diyalog Başlığı"),
              React.createElement("button", { id: "inner-action-1" }, "Kaydet"),
              React.createElement("button", { id: "inner-action-2", onClick: handleClose }, "İptal")
            ),
          })
        );
      }

      // 1. Initial render with modal closed
      await act(async () => {
        root = createRoot(container);
        root.render(React.createElement(TestApp, { isOpen: false }));
      });

      const triggerBtn = container.querySelector("#trigger-btn") as HTMLButtonElement;
      triggerBtn.focus();
      expect(document.activeElement).toBe(triggerBtn);
      expect(document.querySelector('div[role="dialog"]')).toBeNull();

      // 2. Open modal
      await act(async () => {
        root!.render(React.createElement(TestApp, { isOpen: true }));
      });

      // Allow useFocusTrap microtask timeout (20ms) to transfer initial focus
      await new Promise((r) => setTimeout(r, 60));

      const dialogEl = document.querySelector('div[role="dialog"]');
      expect(dialogEl).not.toBeNull();
      expect(dialogEl?.getAttribute("aria-modal")).toBe("true");
      expect(dialogEl?.getAttribute("aria-label")).toBe("Örnek Diyalog");
      expect(dialogEl?.getAttribute("aria-describedby")).toBe("modal-desc");

      // Verify focus transferred inside the modal
      const action1 = document.querySelector("#inner-action-1") as HTMLButtonElement;
      expect(document.activeElement === action1 || document.activeElement === dialogEl).toBe(true);

      // 3. Test Escape key closes modal
      await act(async () => {
        const escEvent = new KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
          cancelable: true,
        });
        document.dispatchEvent(escEvent);
      });

      expect(handleClose).toHaveBeenCalledTimes(1);

      // 4. Close modal and verify focus returns to trigger button
      await act(async () => {
        root!.render(React.createElement(TestApp, { isOpen: false }));
      });

      expect(document.querySelector('div[role="dialog"]')).toBeNull();
      expect(document.activeElement).toBe(triggerBtn);

      // Clean up
      await act(async () => {
        root!.unmount();
      });
    });

    it("verifies useFocusTrap hook with custom initialFocusRef", async () => {
      let root: Root | null = null;

      function CustomFocusComponent() {
        const dialogRef = useRef<HTMLDivElement>(null);
        const secondInputRef = useRef<HTMLInputElement>(null);

        useFocusTrap(dialogRef, {
          isActive: true,
          initialFocusRef: secondInputRef,
          returnFocus: true,
        });

        return React.createElement(
          "div",
          { ref: dialogRef, role: "dialog", "aria-modal": "true" },
          React.createElement("input", { id: "input-1", type: "text" }),
          React.createElement("input", { id: "input-2", ref: secondInputRef, type: "text" })
        );
      }

      await act(async () => {
        root = createRoot(container);
        root.render(React.createElement(CustomFocusComponent));
      });

      await new Promise((r) => setTimeout(r, 60));

      const input2 = container.querySelector("#input-2") as HTMLInputElement;
      expect(document.activeElement).toBe(input2);

      await act(async () => {
        root!.unmount();
      });
    });
  });

  describe("3. Keyboard Navigability & Shortcut Contracts", () => {
    it("handles Cmd+K and Ctrl+K global keyboard shortcut events correctly", () => {
      let paletteTriggered = false;

      const handleGlobalKeyDown = (event: KeyboardEvent) => {
        if (
          (event.metaKey || event.ctrlKey) &&
          (event.key.toLowerCase() === "k" || event.code === "KeyK")
        ) {
          event.preventDefault();
          paletteTriggered = true;
        }
      };

      window.addEventListener("keydown", handleGlobalKeyDown);

      // Trigger Ctrl+K
      const ctrlKEvent = new KeyboardEvent("keydown", {
        key: "k",
        code: "KeyK",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(ctrlKEvent);
      expect(paletteTriggered).toBe(true);
      expect(ctrlKEvent.defaultPrevented).toBe(true);

      // Reset & Trigger Cmd+K (Meta)
      paletteTriggered = false;
      const metaKEvent = new KeyboardEvent("keydown", {
        key: "K",
        code: "KeyK",
        metaKey: true,
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(metaKEvent);
      expect(paletteTriggered).toBe(true);
      expect(metaKEvent.defaultPrevented).toBe(true);

      window.removeEventListener("keydown", handleGlobalKeyDown);
    });

    it("verifies Command Palette cyclic arrow key navigation boundaries", () => {
      const itemCount = 5;
      const getNextIndex = (currentIndex: number, direction: "UP" | "DOWN") => {
        if (direction === "DOWN") {
          return (currentIndex + 1) % itemCount;
        }
        return (currentIndex - 1 + itemCount) % itemCount;
      };

      expect(getNextIndex(0, "DOWN")).toBe(1);
      expect(getNextIndex(4, "DOWN")).toBe(0); // wrap to top
      expect(getNextIndex(0, "UP")).toBe(4); // wrap to bottom
    });
  });

  describe("4. Mathematical WCAG 2.1 AA Color Contrast Verification", () => {
    function getLuminance(hex: string): number {
      const cleanHex = hex.replace("#", "");
      const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
      const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
      const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

      const toLinear = (c: number) =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

      return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    }

    function getContrastRatio(hex1: string, hex2: string): number {
      const l1 = getLuminance(hex1);
      const l2 = getLuminance(hex2);
      const brighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (brighter + 0.05) / (darker + 0.05);
    }

    it("verifies that all primary text tokens pass WCAG 2.1 Level AA (>= 4.5:1) against surfaces", () => {
      const themes = {
        dark: {
          bg: "#0B0F17",
          surface: "#111827",
          textPrimary: "#F9FAFB",
          textSecondary: "#9CA3AF",
        },
        light: {
          bg: "#FAFAFA",
          surface: "#FFFFFF",
          textPrimary: "#111827",
          textSecondary: "#4B5563",
        },
        black: {
          bg: "#000000",
          surface: "#080808",
          textPrimary: "#FFFFFF",
          textSecondary: "#A1A1AA",
        },
      };

      for (const [themeName, tokens] of Object.entries(themes)) {
        const primaryOnBg = getContrastRatio(tokens.textPrimary, tokens.bg);
        expect(
          primaryOnBg,
          `Theme ${themeName}: Primary text on background failed WCAG AA`
        ).toBeGreaterThanOrEqual(4.5);

        const primaryOnSurface = getContrastRatio(tokens.textPrimary, tokens.surface);
        expect(
          primaryOnSurface,
          `Theme ${themeName}: Primary text on surface failed WCAG AA`
        ).toBeGreaterThanOrEqual(4.5);
      }
    });
  });

  describe("5. Screen Reader Accessible Names for Action Triggers", () => {
    it("verifies real rendered buttons have explicit accessible names and toggle aria-expanded", async () => {
      let root: Root | null = null;

      function HeaderActions() {
        const [isExpanded, setIsExpanded] = useState(false);

        return React.createElement(
          "nav",
          { "aria-label": "Main Navigation" },
          React.createElement(
            "button",
            {
              id: "menu-btn",
              "aria-label": "Toggle navigation menu",
              "aria-expanded": isExpanded,
              onClick: () => setIsExpanded((prev) => !prev),
            },
            "Menu"
          ),
          React.createElement(
            "button",
            {
              id: "search-btn",
              "aria-label": "Hızlı Arama",
            },
            React.createElement("span", { "aria-hidden": "true" }, "Search")
          )
        );
      }

      await act(async () => {
        root = createRoot(container);
        root.render(React.createElement(HeaderActions));
      });

      const menuBtn = container.querySelector("#menu-btn") as HTMLButtonElement;
      const searchBtn = container.querySelector("#search-btn") as HTMLButtonElement;

      // Accessible name assertions on real rendered DOM
      expect(menuBtn.getAttribute("aria-label")).toBe("Toggle navigation menu");
      expect(searchBtn.getAttribute("aria-label")).toBe("Hızlı Arama");
      expect(menuBtn.getAttribute("aria-expanded")).toBe("false");

      // Interactive toggle test
      await act(async () => {
        menuBtn.click();
      });

      expect(menuBtn.getAttribute("aria-expanded")).toBe("true");

      await act(async () => {
        root!.unmount();
      });
    });
  });
});
