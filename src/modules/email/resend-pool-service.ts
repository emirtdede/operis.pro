import crypto from "node:crypto";
import { eq, and, sql, desc, asc } from "drizzle-orm";
import { getDb } from "@/src/lib/db";
import { mapConcurrent } from "@/src/lib/async/concurrency";
import { resendContactPool } from "@/db/schema";
import { getEnv } from "@/src/config/env";

export const MAX_RESEND_FREE_CONTACTS = 1000;

interface ResendContactResponse {
  id: string;
  object: "contact";
}

export class ResendPoolService {
  private static getResendConfig() {
    const apiKey = process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY || "";
    const baseUrl = (process.env.RESEND_BASE_URL || "https://api.resend.com").replace(/\/+$/, "");
    return { apiKey, baseUrl };
  }

  private static isTestMode(): boolean {
    return process.env.NODE_ENV === "test" || process.env.TEST_PROD === "1";
  }

  private static async callResendApi(
    endpoint: string,
    method: "GET" | "POST" | "DELETE",
    body?: Record<string, unknown>
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    if (this.isTestMode()) {
      // Stub in test mode to prevent external egress
      if (method === "POST") {
        return { success: true, data: { id: `mock_contact_${crypto.randomUUID()}` } };
      }
      return { success: true };
    }

    const { apiKey, baseUrl } = this.getResendConfig();
    if (!apiKey) {
      return { success: false, error: "RESEND_API_KEY is not configured" };
    }

    try {
      const res = await fetch(`${baseUrl}${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        const errJson = (await res.json().catch(() => ({}))) as { message?: string };
        return { success: false, error: errJson.message || `HTTP ${res.status}` };
      }

      const data = method !== "DELETE" ? await res.json().catch(() => ({})) : undefined;
      return { success: true, data };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Network error contacting Resend API",
      };
    }
  }

  /**
   * Registers or updates a user's marketing email consent.
   * If there are open slots in the 1,000-contact quota, adds to Resend and marks IN_POOL.
   * Otherwise, queues the user as PENDING.
   */
  static async optInUser(
    userId: string,
    email: string
  ): Promise<{ inPool: boolean; status: "IN_POOL" | "PENDING" }> {
    const db = getDb();
    const normalizedEmail = email.trim().toLowerCase();

    // Check current in-pool count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(resendContactPool)
      .where(eq(resendContactPool.status, "IN_POOL"));

    const activeCount = countResult?.count ?? 0;
    const hasOpenSlot = activeCount < MAX_RESEND_FREE_CONTACTS;

    let resendContactId: string | null = null;
    let finalStatus: "IN_POOL" | "PENDING" = "PENDING";

    if (hasOpenSlot) {
      const apiRes = await this.callResendApi("/contacts", "POST", {
        email: normalizedEmail,
        unsubscribed: false,
      });

      if (apiRes.success && apiRes.data) {
        const contactData = apiRes.data as ResendContactResponse;
        resendContactId = contactData.id;
        finalStatus = "IN_POOL";
      }
    }

    const now = new Date();
    await db
      .insert(resendContactPool)
      .values({
        userId,
        email: normalizedEmail,
        status: finalStatus,
        resendContactId,
        consentGivenAt: now,
        syncedAt: finalStatus === "IN_POOL" ? now : null,
        lastActiveAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: resendContactPool.userId,
        set: {
          email: normalizedEmail,
          status: finalStatus,
          resendContactId,
          consentGivenAt: now,
          syncedAt: finalStatus === "IN_POOL" ? now : null,
          unsubscribedAt: null,
          bouncedAt: null,
          bounceReason: null,
          lastActiveAt: now,
          updatedAt: now,
        },
      });

    return { inPool: finalStatus === "IN_POOL", status: finalStatus };
  }

  /**
   * Removes user from the marketing contact pool (Opt-out/Unsubscribe).
   * If they held a slot in Resend, removes the contact and refills the opened slot.
   */
  static async optOutUser(userId: string): Promise<{ success: boolean }> {
    const db = getDb();
    const [existing] = await db
      .select()
      .from(resendContactPool)
      .where(eq(resendContactPool.userId, userId))
      .limit(1);

    if (!existing) {
      return { success: true };
    }

    if (existing.resendContactId) {
      await this.callResendApi(`/contacts/${existing.resendContactId}`, "DELETE");
    }

    const now = new Date();
    await db
      .update(resendContactPool)
      .set({
        status: "OPTED_OUT",
        resendContactId: null,
        unsubscribedAt: now,
        updatedAt: now,
      })
      .where(eq(resendContactPool.userId, userId));

    // Recycle slot: refill from pending queue
    await this.refillPoolSlots();

    return { success: true };
  }

  /**
   * Handles a bounce or spam complaint for an email address.
   * Marks as BOUNCED, drops from Resend, and refills slot with next active candidate.
   */
  static async handleBounceOrComplaint(
    email: string,
    type: "bounced" | "complained",
    reason?: string
  ): Promise<{ affected: boolean }> {
    const db = getDb();
    const normalizedEmail = email.trim().toLowerCase();

    const [existing] = await db
      .select()
      .from(resendContactPool)
      .where(eq(resendContactPool.email, normalizedEmail))
      .limit(1);

    if (existing?.resendContactId) {
      await this.callResendApi(`/contacts/${existing.resendContactId}`, "DELETE");
    }

    const now = new Date();
    if (existing) {
      await db
        .update(resendContactPool)
        .set({
          status: "BOUNCED",
          resendContactId: null,
          bouncedAt: now,
          bounceReason: reason || type,
          updatedAt: now,
        })
        .where(eq(resendContactPool.id, existing.id));
    }

    // Refill the opened slot
    await this.refillPoolSlots();

    return { affected: Boolean(existing) };
  }

  /**
   * Fills any open slots in the 1,000 quota with top candidates from PENDING queue.
   */
  static async refillPoolSlots(): Promise<{ promotedCount: number }> {
    const db = getDb();

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(resendContactPool)
      .where(eq(resendContactPool.status, "IN_POOL"));

    const activeCount = countResult?.count ?? 0;
    const openSlots = Math.max(0, MAX_RESEND_FREE_CONTACTS - activeCount);

    if (openSlots <= 0) {
      return { promotedCount: 0 };
    }

    const candidates = await db
      .select()
      .from(resendContactPool)
      .where(eq(resendContactPool.status, "PENDING"))
      .orderBy(desc(resendContactPool.lastActiveAt), asc(resendContactPool.consentGivenAt))
      .limit(openSlots);

    let promotedCount = 0;
    const now = new Date();

    const CHUNK_SIZE = 5;
    await mapConcurrent(candidates, CHUNK_SIZE, async (candidate) => {
      const apiRes = await this.callResendApi("/contacts", "POST", {
        email: candidate.email,
        unsubscribed: false,
      });

      if (apiRes.success && apiRes.data) {
        const contactData = apiRes.data as ResendContactResponse;
        await db
          .update(resendContactPool)
          .set({
            status: "IN_POOL",
            resendContactId: contactData.id,
            syncedAt: now,
            updatedAt: now,
          })
          .where(eq(resendContactPool.id, candidate.id));

        promotedCount++;
      }
    });

    return { promotedCount };
  }

  /**
   * Returns whether an email address is flagged as BOUNCED.
   */
  static async isEmailBounced(email: string): Promise<boolean> {
    const db = getDb();
    const normalizedEmail = email.trim().toLowerCase();

    const [entry] = await db
      .select({ status: resendContactPool.status })
      .from(resendContactPool)
      .where(
        and(eq(resendContactPool.email, normalizedEmail), eq(resendContactPool.status, "BOUNCED"))
      )
      .limit(1);

    return Boolean(entry);
  }

  /**
   * Checks if user currently has active marketing consent.
   */
  static async getUserConsentStatus(
    userId: string
  ): Promise<{ hasConsent: boolean; status: string | null }> {
    const db = getDb();
    const [entry] = await db
      .select()
      .from(resendContactPool)
      .where(eq(resendContactPool.userId, userId))
      .limit(1);

    if (!entry) return { hasConsent: false, status: null };
    const hasConsent = entry.status === "IN_POOL" || entry.status === "PENDING";
    return { hasConsent, status: entry.status };
  }

  /**
   * Generates a tamper-proof 1-click unsubscribe token.
   */
  static generateUnsubscribeToken(userId: string, email: string): string {
    const secret = getEnv().AUTH_SECRET;
    const hmac = crypto
      .createHmac("sha256", secret)
      .update(`unsubscribe:${userId}:${email.toLowerCase().trim()}`)
      .digest("hex");

    const payload = JSON.stringify({ u: userId, e: email.toLowerCase().trim(), h: hmac });
    return Buffer.from(payload).toString("base64url");
  }

  /**
   * Validates a 1-click unsubscribe token.
   */
  static verifyUnsubscribeToken(token: string): {
    valid: boolean;
    userId?: string;
    email?: string;
  } {
    try {
      const decoded = Buffer.from(token, "base64url").toString("utf8");
      const { u, e, h } = JSON.parse(decoded) as { u: string; e: string; h: string };
      if (!u || !e || !h) return { valid: false };

      const secret = getEnv().AUTH_SECRET;
      const expectedHmac = crypto
        .createHmac("sha256", secret)
        .update(`unsubscribe:${u}:${e}`)
        .digest("hex");

      const hmacBuf = Buffer.from(h, "hex");
      const expectedBuf = Buffer.from(expectedHmac, "hex");

      if (hmacBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(hmacBuf, expectedBuf)) {
        return { valid: false };
      }

      return { valid: true, userId: u, email: e };
    } catch {
      return { valid: false };
    }
  }

  /**
   * Touches user's lastActiveAt timestamp to prioritize active users during slot recycling.
   */
  static async recordActivity(userId: string): Promise<void> {
    try {
      const db = getDb();
      await db
        .update(resendContactPool)
        .set({ lastActiveAt: new Date() })
        .where(eq(resendContactPool.userId, userId));
    } catch {
      // Non-fatal
    }
  }
}
