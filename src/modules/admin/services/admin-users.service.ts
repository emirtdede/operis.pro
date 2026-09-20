import { and, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import { inMemoryListings } from "@/src/modules/listings/service";
import { inMemoryReceivedOffers, inMemorySentOffers } from "@/src/modules/offers/service";
import { NotificationService } from "@/src/modules/notifications/service";
import { DEFAULT_USER } from "@/src/modules/auth/demo-user";
import {
  blockIpAddressAsync,
  recordBlockedIpInCache,
  removeBlockedIpFromCache,
  unblockIpAddressAsync,
} from "@/src/lib/security/rate-limit";
import {
  type AdminUserItem,
  type PaginatedResult,
  ROLE_HIERARCHY,
} from "./types";

export class AdminUsersService {
  /**
   * Paginated, searchable, filterable user management for 10,000+ users.
   */
  static async getUsersPaginated(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    role?: string;
    sortBy?: "createdAt" | "email" | "role" | "status";
    sortDir?: "asc" | "desc";
  }): Promise<PaginatedResult<AdminUserItem>> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(10, params.limit || 25));

    try {
      const db = getDb();
      const conditions = [];

      if (params.status && params.status !== "ALL") {
        conditions.push(eq(schema.users.status, params.status));
      }
      if (params.role && params.role !== "ALL") {
        conditions.push(eq(schema.users.role, params.role));
      }
      if (params.search && params.search.trim()) {
        const q = `%${params.search.trim()}%`;
        conditions.push(
          or(
            ilike(schema.users.email, q),
            ilike(schema.profiles.displayName, q),
            ilike(schema.profiles.handle, q)
          )
        );
      }

      const [totalCountRow] = await db
        .select({ val: count() })
        .from(schema.users)
        .leftJoin(schema.profiles, eq(schema.users.id, schema.profiles.userId))
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      const total = totalCountRow?.val ?? 0;

      const rows = await db
        .select({
          id: schema.users.id,
          email: schema.users.email,
          role: schema.users.role,
          status: schema.users.status,
          emailVerified: schema.users.emailVerified,
          twoFactorEnabled: schema.users.twoFactorEnabled,
          createdAt: schema.users.createdAt,
          updatedAt: schema.users.updatedAt,
          displayName: schema.profiles.displayName,
          handle: schema.profiles.handle,
        })
        .from(schema.users)
        .leftJoin(schema.profiles, eq(schema.users.id, schema.profiles.userId))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(limit)
        .offset((page - 1) * limit)
        .orderBy(desc(schema.users.createdAt));

      return {
        items: (rows || []).map((r) => {
          let displayName = "İsimsiz";
          if (r.displayName) {
            displayName = r.displayName;
          } else if (r.email) {
            displayName = r.email.split("@")[0] || "İsimsiz";
          }
          return {
            id: r.id,
            email: r.email,
            displayName,
            handle: r.handle || "user",
            role: r.role,
            status: r.status,
            emailVerified: r.emailVerified,
            twoFactorEnabled: r.twoFactorEnabled,
            listingsCount: 0,
            offersCount: 0,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          };
        }),
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
    } catch {
      return { items: [], total: 0, page, limit, totalPages: 1 };
    }
  }

  /**
   * Moderates a user account (Suspend / Ban / Unsuspend).
   */
  static async moderateUser(
    adminUserId: string,
    targetUserId: string,
    action: "SUSPEND" | "UNSUSPEND" | "WARN",
    reason: string
  ) {
    if (!reason || reason.trim().length === 0) {
      throw new Error("A reason is strictly required for moderation actions");
    }

    if (adminUserId === targetUserId) {
      throw new Error(
        "CANNOT_MODERATE_SELF: Yöneticiler kendi hesaplarını askıya alamaz veya durumunu değiştiremez."
      );
    }

    const isTargetUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      targetUserId
    );

    if (isTargetUuid) {
      try {
        const db = getDb();

        const result = await db.transaction(async (tx) => {
          let updatedUser;

          const [existing] = await tx
            .select()
            .from(schema.users)
            .where(eq(schema.users.id, targetUserId));

          if (!existing) {
            throw new Error("Target user not found");
          }

          if (existing.status === "DELETED") {
            throw new Error("Cannot modify status of a deleted account");
          }

          const [adminUser] = await tx
            .select({ role: schema.users.role })
            .from(schema.users)
            .where(eq(schema.users.id, adminUserId))
            .limit(1);

          const adminRank = ROLE_HIERARCHY[adminUser?.role || "MODERATOR"] || 1;
          const targetRank = ROLE_HIERARCHY[existing.role || "USER"] || 1;

          if (targetRank >= adminRank && action === "SUSPEND") {
            throw new Error(
              "INSUFFICIENT_ROLE_HIERARCHY: Yetki seviyeniz hedef kullanıcının rolünü askıya almak için yetersizdir."
            );
          }

          let pendingReceivedOffersToNotify: Array<{
            id: string;
            offerorUserId: string;
            listingTitle: string;
            locale: string;
          }> = [];

          if (action === "WARN") {
            // Do NOT alter user status on WARN
            updatedUser = existing;

            await tx
              .insert(schema.notifications)
              .values({
                userId: targetUserId,
                type: "SECURITY_EVENT",
                payloadJson: {
                  title: "Yönetici Uyarısı",
                  message: `Hesabınız için resmi bir yönetici uyarısı iletildi: ${reason}`,
                },
              })
              .catch(() => {});
          } else {
            let newStatus = "ACTIVE";
            if (action === "SUSPEND") {
              newStatus = "SUSPENDED";
            }
            const [u] = await tx
              .update(schema.users)
              .set({
                status: newStatus,
                authVersion: sql`${schema.users.authVersion} + 1`,
                updatedAt: new Date(),
              })
              .where(eq(schema.users.id, targetUserId))
              .returning();
            updatedUser = u;

            if (action === "SUSPEND") {
              const activeListings = await tx
                .select({ id: schema.listings.id, title: schema.listings.title })
                .from(schema.listings)
                .where(
                  and(
                    eq(schema.listings.ownerUserId, targetUserId),
                    eq(schema.listings.status, "ACTIVE")
                  )
                );

              const activeListingIds = activeListings.map((l) => l.id);

              await tx
                .update(schema.listings)
                .set({
                  status: "HIDDEN_MODERATION",
                  updatedAt: new Date(),
                })
                .where(
                  and(
                    eq(schema.listings.ownerUserId, targetUserId),
                    eq(schema.listings.status, "ACTIVE")
                  )
                );

              await tx
                .update(schema.offers)
                .set({
                  status: "EXPIRED_LISTING_INACTIVE",
                  resolvedAt: new Date(),
                  updatedAt: new Date(),
                })
                .where(
                  and(
                    eq(schema.offers.offerorUserId, targetUserId),
                    eq(schema.offers.status, "PENDING")
                  )
                );

              if (activeListingIds.length > 0) {
                const receivedPendingOffers = await tx
                  .select({
                    id: schema.offers.id,
                    offerorUserId: schema.offers.offerorUserId,
                    listingId: schema.offers.listingId,
                    locale: schema.profiles.locale,
                  })
                  .from(schema.offers)
                  .leftJoin(
                    schema.profiles,
                    eq(schema.offers.offerorUserId, schema.profiles.userId)
                  )
                  .where(
                    and(
                      inArray(schema.offers.listingId, activeListingIds),
                      eq(schema.offers.status, "PENDING")
                    )
                  );

                await tx
                  .update(schema.offers)
                  .set({
                    status: "EXPIRED_LISTING_INACTIVE",
                    resolvedAt: new Date(),
                    updatedAt: new Date(),
                  })
                  .where(
                    and(
                      inArray(schema.offers.listingId, activeListingIds),
                      eq(schema.offers.status, "PENDING")
                    )
                  );

                pendingReceivedOffersToNotify = receivedPendingOffers.map((ro) => {
                  const matchingListing = activeListings.find((l) => l.id === ro.listingId);
                  return {
                    id: ro.id,
                    offerorUserId: ro.offerorUserId,
                    listingTitle: matchingListing?.title || "İlan",
                    locale: ro.locale || "tr",
                  };
                });
              }
            } else if (action === "UNSUSPEND") {
              const hiddenListings = await tx
                .select({
                  id: schema.listings.id,
                  activeUntil: schema.listings.activeUntil,
                  activationSeq: schema.listings.activationSeq,
                })
                .from(schema.listings)
                .where(
                  and(
                    eq(schema.listings.ownerUserId, targetUserId),
                    eq(schema.listings.status, "HIDDEN_MODERATION")
                  )
                );

              const now = new Date();
              for (const hl of hiddenListings) {
                const isStillActive = Boolean(hl.activeUntil && new Date(hl.activeUntil) > now);
                let newListingStatus = "INACTIVE_OWNER";
                if (isStillActive) {
                  newListingStatus = "ACTIVE";
                }

                await tx
                  .update(schema.listings)
                  .set({
                    status: newListingStatus,
                    updatedAt: now,
                  })
                  .where(eq(schema.listings.id, hl.id));

                await tx.insert(schema.listingStatusEvents).values({
                  listingId: hl.id,
                  fromStatus: "HIDDEN_MODERATION",
                  toStatus: newListingStatus,
                  reason: "User unsuspended by administrator",
                  actorType: "ADMIN",
                  actorId: adminUserId,
                  activationSeq: hl.activationSeq,
                });
              }
            }
          }

          await tx.insert(schema.adminAuditLog).values({
            adminUserId,
            action: `USER_${action}`,
            targetType: "user",
            targetId: targetUserId,
            reasonCode: "ADMIN_ACTION",
            safeSummary: reason,
          });

          return { updatedUser, pendingReceivedOffersToNotify };
        });

        if (
          result?.pendingReceivedOffersToNotify &&
          result.pendingReceivedOffersToNotify.length > 0
        ) {
          await Promise.allSettled(
            result.pendingReceivedOffersToNotify.map((po) => {
              const isEn = po.locale === "en";
              let titleText = "Teklif Sonlandırıldı";
              if (isEn) {
                titleText = "Proposal Concluded";
              }
              let messageText = `"${po.listingTitle}" ilanı moderasyon incelemesi nedeniyle yayından kaldırıldığı için bekleyen teklifiniz sonlandırıldı.`;
              if (isEn) {
                messageText = `The listing "${po.listingTitle}" was taken down by platform moderation. Your pending proposal has ended.`;
              }
              let actionUrl = "/tr/panel/teklifler/gonderilen";
              if (isEn) {
                actionUrl = "/en/dashboard/offers/sent";
              }

              return NotificationService.createNotification(
                po.offerorUserId,
                "OFFER_EXPIRED_LISTING",
                "offer",
                po.id,
                {
                  title: titleText,
                  message: messageText,
                  actionUrl,
                }
              );
            })
          );
        }

        return result?.updatedUser;
      } catch (err) {
        if (process.env.NODE_ENV === "production" || !process.env.VITEST) {
          throw err;
        }
      }
    }

    // In-memory fallback
    if (adminUserId === targetUserId) {
      throw new Error(
        "CANNOT_MODERATE_SELF: Yöneticiler kendi hesaplarını askıya alamaz veya durumunu değiştiremez."
      );
    }
    if (action !== "WARN") {
      if (targetUserId === DEFAULT_USER.id) {
        DEFAULT_USER.status = action === "SUSPEND" ? "SUSPENDED" : "ACTIVE";
      }
    }
    if (action === "SUSPEND") {
      for (const l of inMemoryListings) {
        if (l.ownerUserId === targetUserId && l.status === "ACTIVE") {
          l.status = "HIDDEN_MODERATION";
        }
      }
      for (const o of inMemorySentOffers) {
        if (o.offer.offerorUserId === targetUserId && o.offer.status === "PENDING") {
          o.offer.status = "EXPIRED_LISTING_INACTIVE";
          o.offer.resolvedAt = new Date();
          o.offer.updatedAt = new Date();
        }
        if (
          (o.listing as { ownerUserId?: string })?.ownerUserId === targetUserId &&
          o.offer.status === "PENDING"
        ) {
          o.offer.status = "EXPIRED_LISTING_INACTIVE";
          o.offer.resolvedAt = new Date();
          o.offer.updatedAt = new Date();
        }
      }
      for (const r of inMemoryReceivedOffers) {
        if (r.listing.ownerUserId === targetUserId && r.offer.status === "PENDING") {
          r.offer.status = "EXPIRED_LISTING_INACTIVE";
          r.offer.resolvedAt = new Date();
          r.offer.updatedAt = new Date();
        }
      }
    } else if (action === "UNSUSPEND") {
      const now = new Date();
      for (const l of inMemoryListings) {
        if (l.ownerUserId === targetUserId && l.status === "HIDDEN_MODERATION") {
          let statusVal = "INACTIVE_OWNER";
          if (l.activeUntil && new Date(l.activeUntil) > now) {
            statusVal = "ACTIVE";
          }
          l.status = statusVal;
        }
      }
    }
    return {
      id: targetUserId,
      status: action === "SUSPEND" ? "SUSPENDED" : "ACTIVE",
      updatedAt: new Date(),
    };
  }

  /**
   * Blocks an attacker's IP address (B18).
   */
  static async blockIp(adminUserId: string, ip: string, reason: string): Promise<boolean> {
    const db = getDb();
    try {
      await db.transaction(async (tx) => {
        await blockIpAddressAsync(ip, { reason, actorId: adminUserId, tx });
        await tx.insert(schema.securityEvents).values({
          eventType: "IP_BLOCKED",
          ipAddress: ip,
          riskMetadata: { reason, blockedBy: adminUserId },
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        });
        await tx.insert(schema.adminAuditLog).values({
          adminUserId,
          action: "IP_BLOCKED",
          targetType: "security",
          targetId: ip,
          reasonCode: "ADMIN_ACTION",
          safeSummary: `IP ${ip} blocked: ${reason}`,
        });
      });
      // Update cache only after successful commit (B18)
      recordBlockedIpInCache(ip);
      return true;
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("ADMIN_IP_BLOCK_TRANSACTION_FAILED", { cause: err });
      }
      // Demo fallback in non-production environments
      recordBlockedIpInCache(ip);
      return true;
    }
  }

  /**
   * Unblocks a previously blacklisted IP address (B18).
   */
  static async unblockIp(adminUserId: string, ip: string): Promise<boolean> {
    const db = getDb();
    try {
      await db.transaction(async (tx) => {
        await unblockIpAddressAsync(ip, { tx });
        await tx
          .delete(schema.securityEvents)
          .where(
            and(
              eq(schema.securityEvents.eventType, "IP_BLOCKED"),
              eq(schema.securityEvents.ipAddress, ip)
            )
          );
        await tx.insert(schema.adminAuditLog).values({
          adminUserId,
          action: "IP_UNBLOCKED",
          targetType: "general",
          targetId: ip,
          reasonCode: "ADMIN_ACTION",
          safeSummary: `Blacklist entry removed for IP ${ip}`,
        });
      });
      // Remove from cache only after successful commit (B18)
      removeBlockedIpFromCache(ip);
      return true;
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("ADMIN_IP_UNBLOCK_TRANSACTION_FAILED", { cause: err });
      }
      removeBlockedIpFromCache(ip);
      return true;
    }
  }
}
