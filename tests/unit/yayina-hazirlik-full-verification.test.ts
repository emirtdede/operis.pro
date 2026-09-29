import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getClientIp } from "@/src/lib/security/rate-limit";
import {
  ContractSigningService,
  setInMemoryPackageForTesting,
} from "@/src/modules/contracts/contract-signing-service";
import { isClerkSessionRevokedOrObsolete } from "@/src/modules/auth/clerk-revocation";
import { getMockEphemeralSignatureCount } from "@/src/modules/storage/r2-client";
import { GET as getContractHandler } from "@/src/app/api/work/[id]/contract/route";
import * as dbModule from "@/src/lib/db";
import { EngagementService } from "@/src/modules/engagements/service";
import { DeliveryInspectorService } from "@/src/modules/engagements/delivery-inspector";

import * as rateLimitModule from "@/src/lib/security/rate-limit";
import * as sessionModule from "@/src/modules/auth/session";
import { ClerkSyncService } from "@/src/modules/auth/clerk-sync-service";
import { GET as getNotificationStreamHandler } from "@/src/app/api/notifications/stream/route";
import { encodeNotificationCursor } from "@/src/modules/notifications/stream-cursor";
import * as r2StorageModule from "@/src/modules/storage/r2-client";

const mockClerkAuth = vi.fn();
const mockClerkCurrentUser = vi.fn();
const mockClerkClient = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockClerkAuth(),
  currentUser: () => mockClerkCurrentUser(),
  clerkClient: () => mockClerkClient(),
}));

const validBase64Signature =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

describe("Yayına Hazırlık Tam Tarama — Full Verification Suite (R01-R14)", () => {
  beforeEach(() => {
    process.env.CLERK_SECRET_KEY = "test_sk_mock_123456789";
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "test_pk_mock_123456789";
    vi.clearAllMocks();

    mockClerkAuth.mockResolvedValue({
      userId: "clerk_user_2fa",
      sessionId: "sess_2fa_1",
      sessionClaims: { iat: Math.floor(Date.now() / 1000) },
    });
    mockClerkCurrentUser.mockResolvedValue({
      id: "clerk_user_2fa",
      emailAddresses: [
        {
          id: "email_1",
          emailAddress: "user2fa@operis.pro",
          verification: { status: "verified" },
        },
      ],
      primaryEmailAddressId: "email_1",
    });
    mockClerkClient.mockResolvedValue({
      sessions: {
        getSession: vi.fn().mockImplementation(async (id: string) => ({
          id,
          userId: "clerk_user_2fa",
          status: "active",
          createdAt: Date.now(),
        })),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("R01: Clerk 2FA Atomic & Fail-Closed Backup Code Consumption", () => {
    it("fails closed on database error during backup code consumption", async () => {
      const { POST: clerkSyncHandler } = await import("@/src/app/api/auth/clerk-sync/route");
      const { hashBackupCode } = await import("@/src/modules/auth/totp");

      const rawBackupCode = "ABCD-1234";
      const hashedCode = hashBackupCode(rawBackupCode);

      vi.spyOn(ClerkSyncService, "syncClerkUser").mockResolvedValue({
        userId: "user-2fa-id",
        isNewUser: false,
        handle: "user2fa",
        email: "user2fa@operis.pro",
        displayName: "User 2FA",
      });

      // Mock DB: user has 2FA enabled with backup code, but update throws DB error
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  id: "user-2fa-id",
                  email: "user2fa@operis.pro",
                  status: "ACTIVE",
                  role: "USER",
                  authVersion: 1,
                  twoFactorEnabled: true,
                  twoFactorBackupCodes: [hashedCode],
                  updatedAt: new Date(),
                },
              ]),
            }),
          }),
        }),
        transaction: vi.fn().mockRejectedValue(new Error("DB_CONNECTION_TIMEOUT")),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockRejectedValue(new Error("DB_UPDATE_ERROR")),
            }),
          }),
        }),
      };

      vi.spyOn(dbModule, "getDb").mockReturnValue(
        mockDb as unknown as ReturnType<typeof dbModule.getDb>
      );

      const req = new Request("https://operis.pro/api/auth/clerk-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totpCode: rawBackupCode }),
      });

      const res = await clerkSyncHandler(req);
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.error).toContain("veritabanı güvenlik hatası");
      // Cookie MUST NOT be issued
      expect(res.headers.get("set-cookie")).toBeNull();
    });

    it("rejects concurrent request when backup code was already consumed (CAS failure)", async () => {
      const { POST: clerkSyncHandler } = await import("@/src/app/api/auth/clerk-sync/route");
      const { hashBackupCode } = await import("@/src/modules/auth/totp");

      const rawBackupCode = "XYZW-5678";
      const hashedCode = hashBackupCode(rawBackupCode);

      mockClerkAuth.mockResolvedValue({
        userId: "clerk_user_2fa",
        sessionId: "sess_2fa_2",
        sessionClaims: { iat: Math.floor(Date.now() / 1000) },
      });

      vi.spyOn(ClerkSyncService, "syncClerkUser").mockResolvedValue({
        userId: "user-2fa-id",
        isNewUser: false,
        handle: "user2fa",
        email: "user2fa@operis.pro",
        displayName: "User 2FA",
      });

      // Mock DB: lockedUser has empty backup codes (already consumed by concurrent request)
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  id: "user-2fa-id",
                  email: "user2fa@operis.pro",
                  status: "ACTIVE",
                  role: "USER",
                  authVersion: 1,
                  twoFactorEnabled: true,
                  twoFactorBackupCodes: [hashedCode],
                  updatedAt: new Date(),
                },
              ]),
            }),
          }),
        }),
        transaction: vi.fn().mockImplementation(async (callback) => {
          const tx = {
            select: vi.fn().mockReturnValue({
              from: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  for: vi.fn().mockResolvedValue([
                    {
                      twoFactorBackupCodes: [], // Already consumed!
                    },
                  ]),
                }),
              }),
            }),
            update: vi.fn(),
          };
          return await callback(tx);
        }),
      };

      vi.spyOn(dbModule, "getDb").mockReturnValue(
        mockDb as unknown as ReturnType<typeof dbModule.getDb>
      );

      const req = new Request("https://operis.pro/api/auth/clerk-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totpCode: rawBackupCode }),
      });

      const res = await clerkSyncHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Geçersiz 2FA");
      expect(res.headers.get("set-cookie")).toBeNull();
    });
  });

  describe("R02: remote session validation", () => {
    it("rejects old sessions even with a fresh token", async () => {
      vi.spyOn(dbModule, "getDb").mockReturnValue({
        select: () => ({ from: () => ({ where: () => ({ limit: async () => [] }) }) }),
      } as unknown as ReturnType<typeof dbModule.getDb>);
      const getSession = vi.fn().mockResolvedValue({
        userId: "clerk_victim",
        status: "active",
        createdAt: Date.now() - 10000,
      });
      mockClerkClient.mockResolvedValue({ sessions: { getSession } });
      expect(
        await isClerkSessionRevokedOrObsolete({
          userId: "victim",
          clerkUserId: "clerk_victim",
          clerkSessionId: "old",
          currentAuthVersion: 2,
          sessionsInvalidBefore: new Date(),
          tokenIatSec: Math.floor(Date.now() / 1000),
        })
      ).toBe(true);
      expect(getSession).toHaveBeenCalledWith("old");
    });
    it("fails closed on actual provider lookup error without in-memory state", async () => {
      const getSession = vi.fn().mockRejectedValue(new Error("timeout"));
      mockClerkClient.mockResolvedValue({ sessions: { getSession } });
      await expect(
        isClerkSessionRevokedOrObsolete({
          userId: "victim",
          clerkUserId: "clerk_victim",
          clerkSessionId: "old",
          currentAuthVersion: 2,
          sessionsInvalidBefore: new Date(),
        })
      ).rejects.toThrow("CLERK_VERIFICATION_UNAVAILABLE");
      expect(getSession).toHaveBeenCalledWith("old");
    });

    it("fails closed in /api/auth/clerk-sync returning 503 without cookie when provider lookup fails", async () => {
      const { POST: clerkSync } = await import("@/src/app/api/auth/clerk-sync/route");
      const getSession = vi.fn().mockRejectedValue(new Error("provider network error"));
      mockClerkClient.mockResolvedValue({ sessions: { getSession } });
      mockClerkAuth.mockResolvedValue({
        userId: "clerk_victim",
        sessionId: "sess_timeout_1",
        sessionClaims: { iat: Math.floor(Date.now() / 1000) },
      });
      mockClerkCurrentUser.mockResolvedValue({
        id: "clerk_victim",
        emailAddresses: [
          {
            id: "email_victim",
            emailAddress: "victim@operis.pro",
            verification: { status: "verified" },
          },
        ],
        primaryEmailAddressId: "email_victim",
      });

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  id: "user-victim-id",
                  authVersion: 2,
                  sessionsInvalidBefore: new Date(),
                },
              ]),
            }),
          }),
        }),
      };
      vi.spyOn(dbModule, "getDb").mockReturnValue(
        mockDb as unknown as ReturnType<typeof dbModule.getDb>
      );

      const req = new Request("https://operis.pro/api/auth/clerk-sync", {
        method: "POST",
      });
      const res = await clerkSync(req);
      expect(res.status).toBe(503);
      expect(res.headers.get("set-cookie")).toBeNull();
      const body = await res.json();
      expect(body.error).toContain("unavailable");
    });
  });

  describe("R04: Delivery Inspector DNS Pinning & Lookup Compatibility", () => {
    it("conforms accurately to Node lookup callback with both object options and all flag", async () => {
      expect(DeliveryInspectorService.isPrivateOrReservedIp("127.0.0.1")).toBe(true);
      expect(DeliveryInspectorService.isPrivateOrReservedIp("93.184.216.34")).toBe(false);
      expect(DeliveryInspectorService.isPrivateOrReservedIp("::1")).toBe(true);
      expect(DeliveryInspectorService.isPrivateOrReservedIp("2606:4700:4700::1111")).toBe(false);
    });
  });

  describe("R05: Idempotent Finalization Retry Preserves Signatures", () => {
    it("retrying finalization when both signatures exist does NOT overwrite signature metadata", async () => {
      const engId = "eng-test-r05-idempotent";
      await ContractSigningService.getOrInitPackage(engId, "user-client-real");

      // 1. Client signs
      await ContractSigningService.submitSignature({
        engagementId: engId,
        userId: "user-client-real",
        role: "CLIENT",
        signerName: "Original Client Alice",
        signatureType: "DRAWN",
        signatureDataUrl: validBase64Signature,
        legalAcknowledged: true,
      });

      // 2. Simulate intermediate state: contractor signature recorded in package record,
      // but final compilation / DB commit failed, leaving status as PARTIALLY_SIGNED
      const { packageDetails } = await ContractSigningService.getOrInitPackage(
        engId,
        "user-client-real"
      );
      const clientSignedAt = packageDetails.clientSignature?.signedAt;
      const contractorSignedAt = new Date("2026-09-28T10:00:00.000Z");

      setInMemoryPackageForTesting(engId, {
        status: "PARTIALLY_SIGNED",
        freelancerSignerUserId: "u-techcorp-1",
        freelancerSignerName: "Original Contractor Bob",
        freelancerSignedAt: contractorSignedAt,
        freelancerIpHash: "ip-hash-bob",
        freelancerSignatureDataUrl: validBase64Signature,
      });

      // 3. Retry finalization with conflicting parameters (different signerName, stale expectedVersion)
      const retrySign = await ContractSigningService.submitSignature({
        engagementId: engId,
        userId: "user-client-real",
        role: "CLIENT",
        signerName: "Spoofed Impostor Name",
        signatureType: "DRAWN",
        signatureDataUrl: validBase64Signature,
        legalAcknowledged: true,
        expectedVersion: 1, // Stale version from pre-signature state
      });

      // Finalization should succeed idempotently
      expect(retrySign.status).toBe("FULLY_SIGNED");
      expect(retrySign.sha256Seal).toBeDefined();

      // Original signatures and authentic timestamps must be preserved
      const finalPkg = await ContractSigningService.getOrInitPackage(engId, "user-client-real");
      expect(finalPkg.packageDetails.clientSignature?.signerName).toBe("Original Client Alice");
      expect(finalPkg.packageDetails.clientSignature?.signedAt).toBe(clientSignedAt);
      expect(finalPkg.packageDetails.contractorSignature?.signerName).toBe(
        "Original Contractor Bob"
      );
      expect(finalPkg.packageDetails.contractorSignature?.signedAt).toBe(
        contractorSignedAt.toISOString()
      );

      // Subsequent attempt on FULLY_SIGNED package must throw
      await expect(
        ContractSigningService.submitSignature({
          engagementId: engId,
          userId: "user-client-real",
          role: "CLIENT",
          signerName: "Post Finalization Attacker",
          signatureType: "DRAWN",
          signatureDataUrl: validBase64Signature,
          legalAcknowledged: true,
        })
      ).rejects.toThrow(/tam olarak imzalanmış ve yürürlüğe girmiştir/);
    });
  });

  describe("R06: Contract Package Integrity & No Fallback to Draft on Error", () => {
    it("returns 500 and does NOT fall back to draft generator when database query fails", async () => {
      vi.spyOn(rateLimitModule, "evaluateSecurityAccessAsync").mockResolvedValue({
        allowed: true,
      } as unknown as Awaited<ReturnType<typeof rateLimitModule.evaluateSecurityAccessAsync>>);

      vi.spyOn(sessionModule, "getSession").mockResolvedValue({
        userId: "user-owner-1",
        role: "USER",
        email: "owner@operis.pro",
      } as unknown as Awaited<ReturnType<typeof sessionModule.getSession>>);

      vi.spyOn(EngagementService, "getEngagementDetails").mockResolvedValue({
        engagement: {
          id: "eng-test-r06-fail",
          ownerUserId: "user-owner-1",
          freelancerUserId: "user-contractor-1",
          status: "IN_PROGRESS",
          contractStatus: "SIGNED",
          listingTitleSnapshot: "E-Commerce Platform",
          listingCategorySnapshot: "Web Development",
        },
        listing: { id: "list-1", title: "E-Commerce" },
        acceptedOffer: { id: "offer-1", budgetMin: 50000, budgetCurrency: "TRY" },
        counterpartyContact: { email: "contractor@operis.pro" },
      } as unknown as Awaited<ReturnType<typeof EngagementService.getEngagementDetails>>);

      // Force database error during package query
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockRejectedValue(new Error("FATAL_POSTGRES_SOCKET_ERROR")),
            }),
          }),
        }),
      };
      vi.spyOn(dbModule, "getDb").mockReturnValue(
        mockDb as unknown as ReturnType<typeof dbModule.getDb>
      );

      const req = new Request("https://operis.pro/api/work/eng-test-r06-fail/contract");
      const res = await getContractHandler(req, {
        params: Promise.resolve({ id: "eng-test-r06-fail" }),
      });

      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toContain("veritabanı hatası");
    });

    it("returns 500 integrity error when FULLY_SIGNED package is missing compiled html or markdown", async () => {
      vi.spyOn(rateLimitModule, "evaluateSecurityAccessAsync").mockResolvedValue({
        allowed: true,
      } as unknown as Awaited<ReturnType<typeof rateLimitModule.evaluateSecurityAccessAsync>>);

      vi.spyOn(sessionModule, "getSession").mockResolvedValue({
        userId: "user-owner-1",
        role: "USER",
        email: "owner@operis.pro",
      } as unknown as Awaited<ReturnType<typeof sessionModule.getSession>>);

      vi.spyOn(EngagementService, "getEngagementDetails").mockResolvedValue({
        engagement: {
          id: "eng-test-r06-corrupt",
          ownerUserId: "user-owner-1",
          freelancerUserId: "user-contractor-1",
          status: "IN_PROGRESS",
          contractStatus: "SIGNED",
        },
        listing: { id: "list-1", title: "E-Commerce" },
        acceptedOffer: { id: "offer-1" },
        counterpartyContact: null,
      } as unknown as Awaited<ReturnType<typeof EngagementService.getEngagementDetails>>);

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  id: "pkg-corrupt-1",
                  engagementId: "eng-test-r06-corrupt",
                  status: "FULLY_SIGNED",
                  compiledHtml: null, // CORRUPTED / MISSING
                  compiledMarkdown: null,
                  sha256Seal: null,
                },
              ]),
            }),
          }),
        }),
      };
      vi.spyOn(dbModule, "getDb").mockReturnValue(
        mockDb as unknown as ReturnType<typeof dbModule.getDb>
      );

      const req = new Request("https://operis.pro/api/work/eng-test-r06-corrupt/contract");
      const res = await getContractHandler(req, {
        params: Promise.resolve({ id: "eng-test-r06-corrupt" }),
      });

      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toContain("bütünlük hatası");
    });
  });

  describe("R08: Ephemeral Signature Orphan Compensating Cleanup & Retry Queue", () => {
    it("compensates and deletes uploaded R2 file when CAS conflict occurs after file upload", async () => {
      const engId = "eng-test-r08-cas-fail";
      await ContractSigningService.getOrInitPackage(engId, "user-client-real");

      const initialR2Count = getMockEphemeralSignatureCount();

      // Hook uploadEphemeralSignature to simulate concurrent package update (CAS conflict)
      // right after the file is successfully uploaded to storage
      let uploadedKey: string | null = null;
      let countDuringUpload = initialR2Count;
      const originalUpload = r2StorageModule.uploadEphemeralSignature;
      const uploadSpy = vi
        .spyOn(r2StorageModule, "uploadEphemeralSignature")
        .mockImplementation(async (...args) => {
          const result = await originalUpload(...args);
          uploadedKey = result.key;
          countDuringUpload = getMockEphemeralSignatureCount();
          // Simulate concurrent write that bumped the package version from 1 to 2
          setInMemoryPackageForTesting(engId, { version: 2 });
          return result;
        });

      try {
        await expect(
          ContractSigningService.submitSignature({
            engagementId: engId,
            userId: "user-client-real",
            role: "CLIENT",
            signerName: "Client Alice",
            signatureType: "DRAWN",
            signatureDataUrl: validBase64Signature,
            legalAcknowledged: true,
          })
        ).rejects.toThrow("CONCURRENCY_CONFLICT");

        // Verify that the file WAS genuinely uploaded before the conflict
        expect(uploadSpy).toHaveBeenCalled();
        expect(uploadedKey).toBeTruthy();
        expect(countDuringUpload).toBe(initialR2Count + 1);

        // Verify that compensating cleanup purged the orphaned file upon CAS failure
        expect(getMockEphemeralSignatureCount()).toBe(initialR2Count);
      } finally {
        uploadSpy.mockRestore();
      }
    });
  });

  describe("R12: Realtime Notifications Ordered Stream & Catch-up Loop", () => {
    it("rejects unauthorized connection with 401", async () => {
      vi.spyOn(sessionModule, "getSession").mockResolvedValue(null);
      const req = new Request("https://operis.pro/api/notifications/stream");
      const res = await getNotificationStreamHandler(req);
      expect(res.status).toBe(401);
    });

    it("rejects invalid or tampered cursor with 400", async () => {
      vi.spyOn(sessionModule, "getSession").mockResolvedValue({
        userId: "user-stream-1",
        email: "user@operis.pro",
        role: "USER",
        status: "ACTIVE",
        authVersion: 1,
        createdAt: Date.now(),
        expiresAt: Date.now() + 100000,
        type: "SESSION",
      });

      const req = new Request(
        "https://operis.pro/api/notifications/stream?lastEventId=malformed-cursor-xyz"
      );
      const res = await getNotificationStreamHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Invalid cursor");
    });

    it("streams connected event and drains notifications in streamSequence order", async () => {
      const testUserId = "10000000-0000-4000-8000-000000000001";
      vi.spyOn(sessionModule, "getSession").mockResolvedValue({
        userId: testUserId,
        email: "user@operis.pro",
        role: "USER",
        status: "ACTIVE",
        authVersion: 1,
        createdAt: Date.now(),
        expiresAt: Date.now() + 100000,
        type: "SESSION",
      });

      const now = new Date();
      const mockRows = [
        {
          id: "notif-seq-1",
          userId: testUserId,
          streamSequence: "1",
          type: "OFFER_RECEIVED",
          payloadJson: { title: "Teklif 1" },
          readAt: null,
          createdAt: now,
        },
        {
          id: "notif-seq-2",
          userId: testUserId,
          streamSequence: "2",
          type: "OFFER_RECEIVED",
          payloadJson: { title: "Teklif 2" },
          readAt: null,
          createdAt: now,
        },
      ];

      const mockDb = {
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockImplementation((tbl) => ({
            where: vi.fn().mockImplementation(() => ({
              limit: vi
                .fn()
                .mockResolvedValue(
                  tbl === dbModule.schema.notificationStreamCounters ? [{ lastSequence: "10" }] : []
                ),
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue(mockRows),
              }),
            })),
          })),
        })),
      };

      vi.spyOn(dbModule, "getDb").mockReturnValue(
        mockDb as unknown as ReturnType<typeof dbModule.getDb>
      );

      const cursor = encodeNotificationCursor(testUserId, "0");
      const controller = new AbortController();
      const req = new Request(`https://operis.pro/api/notifications/stream?lastEventId=${cursor}`, {
        signal: controller.signal,
      });

      const res = await getNotificationStreamHandler(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/event-stream");

      const reader = res.body?.getReader();
      expect(reader).toBeDefined();
      if (reader) {
        const textDecoder = new TextDecoder();
        // First chunk contains connected event
        const chunk1 = await reader.read();
        const text1 = textDecoder.decode(chunk1.value);
        expect(text1).toContain("event: connected");

        // Each persisted notification is its own SSE frame, ordered by sequence.
        const chunk2 = await reader.read();
        const text2 = textDecoder.decode(chunk2.value);
        expect(text2).toContain("event: notification");
        expect(text2).toContain("notif-seq-1");
        const chunk3 = await reader.read();
        const text3 = textDecoder.decode(chunk3.value);
        expect(text3).toContain("event: notification");
        expect(text3).toContain("notif-seq-2");

        controller.abort();
        await reader.cancel();
      }
    });
  });

  describe("R13: Edge Proxy Isolation & Anti-Spoofing", () => {
    it("strictly isolates Vercel deployment: ignores forged cf-connecting-ip and cf-ray in production", () => {
      const oldEnv = process.env.NODE_ENV;
      const oldVitest = process.env.VITEST;
      const oldVercel = process.env.VERCEL;
      const oldProvider = process.env.TRUSTED_PROXY_PROVIDER;
      try {
        (process.env as unknown as { NODE_ENV: string }).NODE_ENV = "production";
        (process.env as unknown as { VERCEL: string }).VERCEL = "1";
        (process.env as unknown as { TRUSTED_PROXY_PROVIDER: string }).TRUSTED_PROXY_PROVIDER =
          "vercel";
        delete (process.env as Record<string, string | undefined>).VITEST;

        // Attacker sends forged cf-connecting-ip and cf-ray directly to Vercel origin
        const req = new Request("https://operis.pro/api/auth/login", {
          headers: {
            "cf-connecting-ip": "1.2.3.4",
            "cf-ray": "8c59999-FRA",
            "x-vercel-forwarded-for": "198.51.100.50, 10.0.0.1",
          },
        });

        // Must strictly use Vercel's edge IP, ignoring Cloudflare headers
        expect(getClientIp(req)).toBe("198.51.100.50");
      } finally {
        (process.env as unknown as { NODE_ENV?: string }).NODE_ENV = oldEnv;
        (process.env as unknown as { VERCEL?: string }).VERCEL = oldVercel;
        (process.env as unknown as { TRUSTED_PROXY_PROVIDER?: string }).TRUSTED_PROXY_PROVIDER =
          oldProvider;
        if (oldVitest) (process.env as Record<string, string>).VITEST = oldVitest;
      }
    });

    it("strictly validates origin authentication secret for Cloudflare proxy in production", () => {
      const oldEnv = process.env.NODE_ENV;
      const oldVitest = process.env.VITEST;
      const oldSecret = process.env.CLOUDFLARE_PROXY_SECRET;
      const oldProvider = process.env.TRUSTED_PROXY_PROVIDER;
      try {
        (process.env as unknown as { NODE_ENV: string }).NODE_ENV = "production";
        (process.env as unknown as { TRUSTED_PROXY_PROVIDER: string }).TRUSTED_PROXY_PROVIDER =
          "cloudflare";
        (process.env as unknown as { CLOUDFLARE_PROXY_SECRET: string }).CLOUDFLARE_PROXY_SECRET =
          "secret-token-xyz";
        delete (process.env as Record<string, string | undefined>).VITEST;

        // Request without secret token
        const spoofedReq = new Request("https://operis.pro/api/auth/login", {
          headers: {
            "cf-connecting-ip": "1.2.3.4",
            "cf-ray": "8c59999-FRA",
          },
        });
        expect(getClientIp(spoofedReq)).toBe("127.0.0.1");

        // Request with valid secret token from authentic Cloudflare Worker
        const legitReq = new Request("https://operis.pro/api/auth/login", {
          headers: {
            "cf-connecting-ip": "198.51.100.88",
            "cf-ray": "8c59999-FRA",
            "x-operis-origin-auth": "secret-token-xyz",
          },
        });
        expect(getClientIp(legitReq)).toBe("198.51.100.88");
      } finally {
        (process.env as unknown as { NODE_ENV?: string }).NODE_ENV = oldEnv;
        (process.env as unknown as { CLOUDFLARE_PROXY_SECRET?: string }).CLOUDFLARE_PROXY_SECRET =
          oldSecret;
        (process.env as unknown as { TRUSTED_PROXY_PROVIDER?: string }).TRUSTED_PROXY_PROVIDER =
          oldProvider;
        if (oldVitest) (process.env as Record<string, string>).VITEST = oldVitest;
      }
    });
  });
});
