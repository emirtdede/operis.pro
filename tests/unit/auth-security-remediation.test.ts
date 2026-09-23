import { describe, it, expect, vi, beforeEach } from "vitest";
import { ClerkSyncService } from "@/src/modules/auth/clerk-sync-service";
import * as dbModule from "@/src/lib/db";
import { createSessionToken, verifySessionToken } from "@/src/modules/auth/session";

describe("WP-23 to WP-26: Auth, Admin Session & Clerk Sync Security Remediation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("WP-23: Admin Session authVersion Propagation", () => {
    it("creates a session token with the user's specific authVersion from the database", () => {
      const token = createSessionToken({
        id: "admin-uuid-1",
        email: "admin@operis.pro",
        role: "ADMIN",
        status: "ACTIVE",
        authVersion: 3,
      });

      const payload = verifySessionToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.authVersion).toBe(3);
      expect(payload?.userId).toBe("admin-uuid-1");
      expect(payload?.role).toBe("ADMIN");
    });
  });

  describe("WP-24: Clerk Email Changes & Conflict Protection", () => {
    it("atomically updates email, emailVerified, and encryption fields when Clerk email changes", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: "user-123" }]),
        }),
      });

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  user: {
                    id: "user-123",
                    email: "old-email@operis.pro",
                    status: "ACTIVE",
                    role: "USER",
                    emailVerified: true,
                    clerkUserId: "clerk-user-123",
                    emailEnc: "old_enc",
                    emailHmac: "old_hmac",
                  },
                  profile: {
                    displayName: "User One",
                    handle: "userone",
                    avatarUrl: null,
                    avatarSource: "custom",
                  },
                },
              ]),
            }),
          }),
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]), // No conflicting user with the new email
          }),
        }),
      });

      const mockDb = {
        select: mockSelect,
        update: mockUpdate,
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue([]),
        }),
      };

      vi.spyOn(dbModule, "getDb").mockReturnValue(
        mockDb as unknown as ReturnType<typeof dbModule.getDb>
      );

      const result = await ClerkSyncService.syncClerkUser({
        clerkUserId: "clerk-user-123",
        email: "new-verified-email@operis.pro",
        emailVerified: true,
      });

      expect(result.email).toBe("new-verified-email@operis.pro");
      expect(mockUpdate).toHaveBeenCalled();
    });

    it("throws a conflict error if updated Clerk email belongs to another Operis account", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  user: {
                    id: "user-123",
                    email: "current@operis.pro",
                    status: "ACTIVE",
                    role: "USER",
                    emailVerified: true,
                    clerkUserId: "clerk-user-123",
                  },
                  profile: { displayName: "User", handle: "user" },
                },
              ]),
            }),
          }),
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: "another-user-456" }]), // Conflict exists!
          }),
        }),
      });

      const mockDb = {
        select: mockSelect,
        update: vi.fn(),
        insert: vi.fn(),
      };

      vi.spyOn(dbModule, "getDb").mockReturnValue(
        mockDb as unknown as ReturnType<typeof dbModule.getDb>
      );

      await expect(
        ClerkSyncService.syncClerkUser({
          clerkUserId: "clerk-user-123",
          email: "taken@operis.pro",
          emailVerified: true,
        })
      ).rejects.toThrow("Hesap çakışması");
    });
  });

  describe("WP-25: Atomic User Creation & Self-Healing Missing Profile", () => {
    it("executes new user creation inside a database transaction", async () => {
      const transactionFn = vi.fn().mockImplementation(async (callback) => {
        const mockTx = {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ id: "tx-user-id" }]),
            }),
          }),
        };
        return await callback(mockTx);
      });

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([]), // No existing user
              }),
            }),
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
        transaction: transactionFn,
      };

      vi.spyOn(dbModule, "getDb").mockReturnValue(
        mockDb as unknown as ReturnType<typeof dbModule.getDb>
      );

      const result = await ClerkSyncService.syncClerkUser({
        clerkUserId: "clerk-tx-user",
        email: "tx-user@operis.pro",
        firstName: "Tx",
        lastName: "User",
      });

      expect(transactionFn).toHaveBeenCalled();
      expect(result.userId).toBe("tx-user-id");
      expect(result.isNewUser).toBe(true);
    });

    it("self-heals a missing profile when user exists by clerkUserId but profile is null", async () => {
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue([]),
      });

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([
                  {
                    user: {
                      id: "orphaned-user-id",
                      email: "orphan@operis.pro",
                      status: "ACTIVE",
                      role: "USER",
                      emailVerified: true,
                      clerkUserId: "clerk-orphan",
                      emailEnc: "enc",
                      emailHmac: "hmac",
                    },
                    profile: null, // MISSING PROFILE!
                  },
                ]),
              }),
            }),
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]), // No handle collision
            }),
          }),
        }),
        insert: mockInsert,
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      };

      vi.spyOn(dbModule, "getDb").mockReturnValue(
        mockDb as unknown as ReturnType<typeof dbModule.getDb>
      );

      const result = await ClerkSyncService.syncClerkUser({
        clerkUserId: "clerk-orphan",
        email: "orphan@operis.pro",
        firstName: "Orphan",
      });

      expect(result.userId).toBe("orphaned-user-id");
      expect(result.isNewUser).toBe(false);
      // Ensure profile was self-healed and inserted
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  describe("WP-26: Legal Consent Separation", () => {
    it("does NOT record legal acceptances when legalConsent is omitted or false", async () => {
      const insertedTables: unknown[] = [];
      const mockInsert = vi.fn().mockImplementation((table) => {
        insertedTables.push(table);
        return {
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: "no-consent-user" }]),
          }),
        };
      });

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([]),
              }),
            }),
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
        insert: mockInsert,
      };

      vi.spyOn(dbModule, "getDb").mockReturnValue(
        mockDb as unknown as ReturnType<typeof dbModule.getDb>
      );

      await ClerkSyncService.syncClerkUser({
        clerkUserId: "webhook-user",
        email: "webhook@operis.pro",
        firstName: "Webhook",
        lastName: "Sync",
        // legalConsent omitted (e.g. background Clerk webhook user.created)
      });

      // legalAcceptances table should NOT have been inserted into
      expect(insertedTables).not.toContain(dbModule.schema.legalAcceptances);
    });

    it("records legal acceptances when legalConsent.accepted is explicitly true", async () => {
      const insertedTables: unknown[] = [];
      const mockInsert = vi.fn().mockImplementation((table) => {
        insertedTables.push(table);
        return {
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: "consent-user" }]),
          }),
        };
      });

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([]),
              }),
            }),
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
        insert: mockInsert,
      };

      vi.spyOn(dbModule, "getDb").mockReturnValue(
        mockDb as unknown as ReturnType<typeof dbModule.getDb>
      );

      await ClerkSyncService.syncClerkUser({
        clerkUserId: "consenting-user",
        email: "consent@operis.pro",
        firstName: "Consenting",
        legalConsent: {
          accepted: true,
          locale: "tr",
          documentVersions: { terms: "v1", privacy: "v1" },
        },
      });

      // legalAcceptances table MUST have been inserted into
      expect(insertedTables).toContain(dbModule.schema.legalAcceptances);
    });
  });
});
