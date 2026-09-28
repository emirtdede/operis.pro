import { installTurnstileFixture } from "../helpers/turnstile-browser";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { assertSafeE2ETestEnvironment } from "@/tests/helpers/test-database";

test.describe("Real UI WAI-ARIA & Axe Accessibility Suite (E2E)", () => {
  test.beforeEach(async ({ context }) => {
    await installTurnstileFixture(context);
    assertSafeE2ETestEnvironment();
  });

  test("runs automated axe-core accessibility audit on landing page including color contrast", async ({
    page,
  }) => {
    await page.goto("/tr", { waitUntil: "domcontentloaded" });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("runs automated axe-core accessibility audit on login page including color contrast", async ({
    page,
  }) => {
    await page.goto("/tr/giris", { waitUntil: "domcontentloaded" });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("verifies modal focus trapping, Tab boundary wrap-around, and Escape return in real browser", async ({
    page,
  }) => {
    await page.goto("/tr", { waitUntil: "domcontentloaded" });

    // 1. Keep a visible pre-open focus target for both anonymous desktop and mobile visitors.
    const searchTrigger = page.locator("header a:visible").first();
    await searchTrigger.focus();
    await expect(searchTrigger).toBeFocused();

    // 2. Open Command Palette with Ctrl+K
    await page.keyboard.press("Control+KeyK");
    const palette = page.locator('div[role="dialog"]');

    // Strict assertion: Dialog MUST be visible (no conditional skip)
    await expect(palette).toBeVisible({ timeout: 5000 });

    // 3. Automated Axe scan scoped to the active dialog
    const modalAxeResults = await new AxeBuilder({ page })
      .include('div[role="dialog"]')
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(modalAxeResults.violations).toEqual([]);

    // 4. Strict focus assertion: active element MUST be inside dialog container
    const isFocusInside = await page.evaluate(() => {
      const dialog = document.querySelector('div[role="dialog"]');
      return Boolean(dialog && dialog.contains(document.activeElement));
    });
    expect(isFocusInside).toBe(true);

    // 5. Query focusable element count inside dialog (must have at least 2 for wrap-around verification)
    const focusableCount = await page.evaluate(() => {
      const dialog = document.querySelector('div[role="dialog"]');
      if (!dialog) return 0;
      const selector =
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true"
      );
      return items.length;
    });
    expect(focusableCount).toBeGreaterThanOrEqual(2);

    // 6. Test forward boundary wrap-around: Focus LAST element -> press Tab -> verify wraps to FIRST element
    await page.evaluate(() => {
      const dialog = document.querySelector('div[role="dialog"]');
      const selector =
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
      const items = Array.from(dialog!.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true"
      );
      items[items.length - 1]?.focus();
    });

    await page.keyboard.press("Tab");

    const isWrappedToFirst = await page.evaluate(() => {
      const dialog = document.querySelector('div[role="dialog"]');
      const selector =
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
      const items = Array.from(dialog!.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true"
      );
      return document.activeElement === items[0];
    });
    expect(isWrappedToFirst).toBe(true);

    // 7. Test backward boundary wrap-around: Focus FIRST element -> press Shift+Tab -> verify wraps to LAST element
    await page.evaluate(() => {
      const dialog = document.querySelector('div[role="dialog"]');
      const selector =
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
      const items = Array.from(dialog!.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true"
      );
      items[0]?.focus();
    });

    await page.keyboard.press("Shift+Tab");

    const isWrappedToLast = await page.evaluate(() => {
      const dialog = document.querySelector('div[role="dialog"]');
      const selector =
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
      const items = Array.from(dialog!.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true"
      );
      return document.activeElement === items[items.length - 1];
    });
    expect(isWrappedToLast).toBe(true);

    // 8. Test Escape key dismisses the dialog
    await page.keyboard.press("Escape");
    await expect(palette).not.toBeVisible({ timeout: 5000 });

    // 9. Verify focus is restored back to the pre-open trigger button
    await expect(searchTrigger).toBeFocused({ timeout: 5000 });
  });
});
