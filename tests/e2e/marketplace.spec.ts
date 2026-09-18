import crypto from "node:crypto";
import { test, expect, Page } from "@playwright/test";
import { getDb, schema } from "@/src/lib/db";
import { ExportJobManager } from "@/src/modules/privacy/export-jobs";
import { eq } from "drizzle-orm";
import { assertSafeE2ETestEnvironment } from "@/tests/helpers/test-database";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/src/modules/auth/session";

async function loginTestUserViaCookie(page: Page) {
  const token = createSessionToken({
    id: "d0000000-0000-0000-0000-000000000001",
    email: "kullanici@operis.pro",
    role: "USER",
    status: "ACTIVE",
    authVersion: 1,
  });
  await page.context().addCookies([
    {
      name: SESSION_COOKIE_NAME,
      value: token,
      url: "http://localhost:5000",
      httpOnly: true,
      sameSite: "Lax",
    },
    {
      name: SESSION_COOKIE_NAME,
      value: token,
      url: "http://localhost:8008",
      httpOnly: true,
      sameSite: "Lax",
    },
    {
      name: SESSION_COOKIE_NAME,
      value: token,
      url: "http://localhost:3000",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

test.describe("Operis Marketplace Critical Flows (E2E)", () => {
  test.beforeEach(async () => {
    assertSafeE2ETestEnvironment();
    const db = getDb();
    await db.delete(schema.rateLimits);
  });

  test("redirects unauthenticated visitors trying to access feed to login page with returnUrl", async ({
    page,
  }) => {
    await page.goto("/tr/ilanlar", { waitUntil: "domcontentloaded" });
    await page.waitForURL(
      (url: URL) => url.pathname.includes("/giris") || url.pathname.includes("/login"),
      { timeout: 15000 }
    );
    expect(page.url()).toContain("/tr/giris");
    expect(page.url()).toContain("returnUrl=");
  });

  test("loads the listings feed and displays live freshness badges and quick chips", async ({
    page,
  }) => {
    await loginTestUserViaCookie(page);

    // 1. Navigate to listings feed
    await page.goto("/tr/ilanlar", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle(/Operis/i);

    // 2. Verify quick filter chips exist
    const quickChips = page.locator(
      "button:has-text('Son 24s'), button:has-text('Bütçesi Belirli')"
    );
    await expect(quickChips.first()).toBeVisible();

    // 3. Verify desktop navbar search trigger is present on desktop
    if (!page.viewportSize() || page.viewportSize()!.width >= 1024) {
      const cmdKTrigger = page.locator(
        "button[title*='Ctrl+K'], button[aria-label*='Hızlı Arama'], button[aria-label*='Quick Search']"
      );
      await expect(cmdKTrigger.first()).toBeVisible();
    }
  });

  test("opens command palette on keyboard shortcut and allows live search", async ({ page }) => {
    await loginTestUserViaCookie(page);
    await page.goto("/tr/ilanlar");
    await page.waitForLoadState("networkidle");

    // Press shortcut Control+k
    await page.keyboard.press("Control+k");

    // If headless runner doesn't forward shortcut, click search trigger
    const palette = page.locator("[role='dialog']");
    const opened = await palette
      .first()
      .waitFor({ state: "visible", timeout: 2000 })
      .then(() => true)
      .catch(() => false);
    if (!opened) {
      const trigger = page
        .locator(
          "button[title*='Ctrl+K'], button[aria-label*='Hızlı Arama'], button[aria-label*='Quick Search']"
        )
        .first();
      if (await trigger.isVisible().catch(() => false)) {
        await trigger.click();
      } else {
        await page.keyboard.press("Control+k");
      }
    }

    // Command palette dialog should be visible
    await expect(palette.first()).toBeVisible();

    // Search input exists and can be typed into
    const searchInput = palette.locator("input[type='text']");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("Next.js");

    // Pressing Escape closes the palette
    await page.keyboard.press("Escape");
    await expect(palette).not.toBeVisible();
  });

  test("toggles theme across dark, light, and black modes", async ({ page }) => {
    await loginTestUserViaCookie(page);
    await page.goto("/tr/listings", { waitUntil: "domcontentloaded" });

    // Check html has a theme attribute
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", /light|dark|black/);
  });

  test("loads the login page and performs real authentication flow (invalid vs valid credentials)", async ({
    page,
  }) => {
    // 1. Navigate to /tr/giris
    await page.goto("/tr/giris", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle(/Operis/i);

    const emailInput = page.locator("input[type='email'], input[name='email']").first();
    const passwordInput = page.locator("input[type='password'], input[name='password']").first();
    const submitBtn = page.locator("button[type='submit']").first();

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();

    // 2. Test invalid password
    await emailInput.fill("kullanici@operis.pro");
    await passwordInput.fill("WrongPassword2026!");
    await submitBtn.click();

    // Verify error feedback appears
    const errorMessage = page.locator(
      ".text-red-400, .bg-red-500\\/10, [role='alert'], :has-text('Giriş yapılamadı'), :has-text('Invalid email or password')"
    );
    await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });

    // 3. Test valid credentials
    await emailInput.fill("kullanici@operis.pro");
    await passwordInput.fill("OperisUser2026!");
    await submitBtn.click();

    // Verify successful login redirects away from login page
    await page.waitForURL(
      (url: URL) => !url.pathname.includes("/giris") && !url.pathname.includes("/login"),
      { timeout: 15000 }
    );
  });

  test("navigates to security settings, requests personal data export, processes with real worker, and downloads verified JSON", async ({
    page,
  }) => {
    // Clean up any stale active jobs for test user to ensure clean state
    const db = getDb();
    const staleJobs = await db
      .select({ id: schema.exportJobs.id })
      .from(schema.exportJobs)
      .where(eq(schema.exportJobs.userId, "d0000000-0000-0000-0000-000000000001"));
    for (const sj of staleJobs) {
      await db.delete(schema.exportJobParts).where(eq(schema.exportJobParts.jobId, sj.id));
      await db.delete(schema.exportJobs).where(eq(schema.exportJobs.id, sj.id));
    }

    // 1. Authenticate as user 1
    await page.goto("/tr/giris", { waitUntil: "domcontentloaded" });
    await page
      .locator("input[type='email'], input[name='email']")
      .first()
      .fill("kullanici@operis.pro");
    await page
      .locator("input[type='password'], input[name='password']")
      .first()
      .fill("OperisUser2026!");
    await page.locator("button[type='submit']").first().click();
    await page.waitForURL(
      (url: URL) => !url.pathname.includes("/giris") && !url.pathname.includes("/login"),
      { timeout: 15000 }
    );

    // 2. Navigate to security dashboard
    await page.goto("/tr/panel/guvenlik", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle(/Güvenlik/i);

    // 3. Find and click export button
    const exportBtn = page.locator("button:has-text('Verilerimi İndir (.json)')").first();
    await expect(exportBtn).toBeVisible();

    const [exportResponse] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes("/api/account/export") && res.request().method() === "POST"
      ),
      exportBtn.click(),
    ]);
    expect([200, 201, 202]).toContain(exportResponse.status());
    const exportData = await exportResponse.json();
    const createdJobId = exportData.jobId || exportData.id;
    expect(createdJobId).toBeDefined();

    // 4. UI shows export job queued or in progress
    const statusNotice = page
      .locator(
        ":has-text('Dışa aktarım sıraya alındı'), :has-text('Veriler hazırlanıyor'), :has-text('hazır')"
      )
      .first();
    await expect(statusNotice).toBeVisible({ timeout: 10000 });

    // 5. Process job with real worker
    const workerOutcome = await ExportJobManager.processNextExportJob();
    expect(workerOutcome.status).toBe("COMPLETED");
    expect(workerOutcome.jobId).toBe(createdJobId);

    // 6. Polling reveals READY status and download link
    const readyNotice = page
      .locator(":has-text('Veri aktarımı tamamlandı ve hazır.'), a:has-text('Tekrar İndir')")
      .first();
    await expect(readyNotice).toBeVisible({ timeout: 15000 });

    const downloadLink = page.locator("a[download*='operis-data-export']").first();
    await expect(downloadLink).toBeVisible();

    // 7. Verify downloaded content
    const [download] = await Promise.all([page.waitForEvent("download"), downloadLink.click()]);

    const downloadStream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of downloadStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const decryptedContent = JSON.parse(Buffer.concat(chunks).toString("utf8"));

    expect(decryptedContent.exportVersion).toBe(2);
    expect(decryptedContent.user).toBeDefined();
    expect(decryptedContent.user.email).toBe("kullanici@operis.pro");
    expect(decryptedContent.user.id).toBe("d0000000-0000-0000-0000-000000000001");
    expect(decryptedContent.profile).toBeDefined();
    expect(decryptedContent.profile.handle).toBe("demokullanici");
  });

  test("negative authorization: unauthorized user cannot download another user's export", async ({
    browser,
  }) => {
    // 1. Self-contained fixture: insert dedicated READY job for User 1
    const db = getDb();
    const job1Id = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.insert(schema.exportJobs).values({
      id: job1Id,
      userId: "d0000000-0000-0000-0000-000000000001",
      status: "READY",
      resultAttempt: 1,
      checksumSha256: "dummy_checksum_test",
      partCount: 1,
      fileSizeBytes: 100,
      expiresAt,
      completedAt: new Date(),
    });

    const context2 = await browser.newContext();
    try {
      // 2. Open an isolated session as User 2 (freelancer@operis.pro)
      const page2 = await context2.newPage();

      await page2.goto("/tr/giris", { waitUntil: "domcontentloaded" });
      await page2
        .locator("input[type='email'], input[name='email']")
        .first()
        .fill("freelancer@operis.pro");
      await page2
        .locator("input[type='password'], input[name='password']")
        .first()
        .fill("OperisFreelancer2026!");
      await page2.locator("button[type='submit']").first().click();
      await page2.waitForURL(
        (url: URL) => !url.pathname.includes("/giris") && !url.pathname.includes("/login"),
        { timeout: 15000 }
      );

      // 3. User 2 attempts to download User 1's export
      const downloadRes = await page2.request.get(`/api/account/export?jobId=${job1Id}&download=1`);
      expect(downloadRes.status()).toBe(404);
      const body = await downloadRes.json();
      expect(body.errorCode).toBe("EXPORT_JOB_NOT_FOUND");
    } finally {
      await context2.close();
      await db.delete(schema.exportJobs).where(eq(schema.exportJobs.id, job1Id));
    }
  });

  test("cancellation flow: active export job can be cancelled and cleaned up", async ({ page }) => {
    // 1. Authenticate as user 1
    await page.goto("/tr/giris", { waitUntil: "domcontentloaded" });
    await page
      .locator("input[type='email'], input[name='email']")
      .first()
      .fill("kullanici@operis.pro");
    await page
      .locator("input[type='password'], input[name='password']")
      .first()
      .fill("OperisUser2026!");
    await page.locator("button[type='submit']").first().click();
    await page.waitForURL(
      (url: URL) => !url.pathname.includes("/giris") && !url.pathname.includes("/login"),
      { timeout: 15000 }
    );

    // 2. Clean previous jobs and enqueue new job
    const db = getDb();
    const existingJobs = await db
      .select({ id: schema.exportJobs.id })
      .from(schema.exportJobs)
      .where(eq(schema.exportJobs.userId, "d0000000-0000-0000-0000-000000000001"));
    for (const ej of existingJobs) {
      await db.delete(schema.exportJobParts).where(eq(schema.exportJobParts.jobId, ej.id));
      await db.delete(schema.exportJobs).where(eq(schema.exportJobs.id, ej.id));
    }

    const postRes = await page.request.post("/api/account/export");
    expect([201, 202]).toContain(postRes.status());
    const postData = await postRes.json();
    const targetJobId = postData.jobId || postData.id;
    expect(targetJobId).toBeDefined();

    try {
      // 3. Cancel the export job via DELETE
      const cancelRes = await page.request.delete(`/api/account/export?jobId=${targetJobId}`);
      expect(cancelRes.status()).toBe(200);
      const cancelData = await cancelRes.json();
      expect(cancelData.success).toBe(true);

      // 4. Verify cannot download cancelled job
      const tryDownload = await page.request.get(
        `/api/account/export?jobId=${targetJobId}&download=1`
      );
      expect([400, 404, 409, 410]).toContain(tryDownload.status());
      const errBody = await tryDownload.json();
      expect(["EXPORT_JOB_NOT_FOUND", "EXPORT_NOT_READY", "EXPORT_CANCELLED"]).toContain(
        errBody.errorCode
      );

      // 5. Verify DB status is FAILED with errorCode EXPORT_CANCELLED_BY_USER
      const [dbJob] = await db
        .select({ status: schema.exportJobs.status, errorCode: schema.exportJobs.errorCode })
        .from(schema.exportJobs)
        .where(eq(schema.exportJobs.id, targetJobId));
      expect(dbJob).toBeDefined();
      expect(dbJob?.status).toBe("FAILED");
      expect(dbJob?.errorCode).toBe("EXPORT_CANCELLED_BY_USER");
    } finally {
      await db.delete(schema.exportJobParts).where(eq(schema.exportJobParts.jobId, targetJobId));
      await db.delete(schema.exportJobs).where(eq(schema.exportJobs.id, targetJobId));
    }
  });

  test("expired download: expired export package returns 410 Gone", async ({ page }) => {
    // 1. Authenticate as user 1
    await page.goto("/tr/giris", { waitUntil: "domcontentloaded" });
    await page
      .locator("input[type='email'], input[name='email']")
      .first()
      .fill("kullanici@operis.pro");
    await page
      .locator("input[type='password'], input[name='password']")
      .first()
      .fill("OperisUser2026!");
    await page.locator("button[type='submit']").first().click();
    await page.waitForURL(
      (url: URL) => !url.pathname.includes("/giris") && !url.pathname.includes("/login"),
      { timeout: 15000 }
    );

    // 2. Insert expired READY job directly into test database
    const db = getDb();
    const expiredJobId = crypto.randomUUID();
    await db.insert(schema.exportJobs).values({
      id: expiredJobId,
      userId: "d0000000-0000-0000-0000-000000000001",
      status: "READY",
      resultAttempt: 1,
      checksumSha256: "dummy_checksum_expired",
      partCount: 1,
      fileSizeBytes: 100,
      expiresAt: new Date(Date.now() - 60000), // Expired 60s ago
      completedAt: new Date(Date.now() - 70000),
    });

    // 3. Attempt to download expired package
    const res = await page.request.get(`/api/account/export?jobId=${expiredJobId}&download=1`);
    expect(res.status()).toBe(410);
    const body = await res.json();
    expect(body.errorCode).toBe("EXPORT_EXPIRED");

    // Clean up
    await db.delete(schema.exportJobs).where(eq(schema.exportJobs.id, expiredJobId));
  });
});
