import crypto from "node:crypto";
import { and, desc, eq, inArray, isNull, lte, or, sql, gt } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import { EmailAdapter } from "@/src/lib/email";

import { inMemoryFallbackNotifications } from "./in-memory";
import { notificationPubSub } from "./pubsub";

export type NotificationType =
  | "EMAIL_VERIFIED"
  | "PHONE_VERIFIED"
  | "OFFER_RECEIVED"
  | "OFFER_UPDATED"
  | "OFFER_REJECTED"
  | "OFFER_ACCEPTED"
  | "OFFER_REJECTED_OTHER_SELECTED"
  | "OFFER_EXPIRED_LISTING"
  | "LISTING_EXPIRING_SOON"
  | "LISTING_EXPIRED"
  | "LISTING_PUBLISHED"
  | "LISTING_REACTIVATED"
  | "LISTING_UPDATED"
  | "CATEGORY_FOLLOW_MATCH"
  | "COMPLETION_REQUESTED"
  | "COMPLETION_CONFIRMED"
  | "COMPLETION_DISPUTED"
  | "MATCH_MUTUALLY_CANCELLED"
  | "SECURITY_EVENT"
  | "MODERATION_ACTION"
  | "RADAR_MATCH"
  | "ENDORSEMENT_RECEIVED"
  | "COMMUNICATION_PING"
  | "OFFER_WITHDRAWN"
  | "OFFER_COUNTERED"
  | "REVIEWS_REVEALED"
  | "REVIEW_PENDING_COUNTERPARTY"
  | "HANDOVER_DELIVERED"
  | "HANDOVER_ACCEPTED"
  | "HANDOVER_REVISION_REQUESTED"
  | "CHANGE_REQUEST_CREATED"
  | "CHANGE_REQUEST_APPROVED"
  | "CHANGE_REQUEST_REJECTED"
  | "PAYMENT_DECLARED"
  | "PAYMENT_REVERTED"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_DISPUTED"
  | "CONTRACT_PACKAGE_SIGNED"
  | "CONTRACT_PACKAGE_FULLY_EXECUTED";

type TransactionContext = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

export class NotificationService {
  /**
   * Creates an in-app notification and queues an idempotent outbox event for delivery.
   */
  static async createNotification(
    userId: string,
    type: NotificationType,
    aggregateType: string,
    aggregateId: string,
    payload: Record<string, unknown>,
    txContext?: unknown,
    deliveryKey?: string
  ) {
    const execute = async (tx: TransactionContext) => {
      const { eq } = await import("drizzle-orm");
      const activationSeq = typeof payload.activationSeq === "number" ? payload.activationSeq : 1;
      const effectiveDeliveryKey =
        deliveryKey ||
        (aggregateType === "listing" && (type === "RADAR_MATCH" || type === "CATEGORY_FOLLOW_MATCH")
          ? `listing:${aggregateId}:act:${activationSeq}:user:${userId}`
          : undefined);

      const enrichedPayload = {
        ...payload,
        listingId: payload.listingId || (aggregateType === "listing" ? aggregateId : undefined),
        activationSeq,
      };

      let notification: typeof schema.notifications.$inferSelect | undefined;

      if (effectiveDeliveryKey) {
        // B16: DB-level uniqueness via ON CONFLICT DO NOTHING on deliveryKey
        const inserted = await tx
          .insert(schema.notifications)
          .values({
            userId,
            type,
            payloadJson: enrichedPayload,
            deliveryKey: effectiveDeliveryKey,
          })
          .onConflictDoNothing({
            target: schema.notifications.deliveryKey,
            where: sql`delivery_key IS NOT NULL`,
          })
          .returning();

        if (inserted.length > 0) {
          notification = inserted[0];
        } else {
          // Already delivered! Retrieve existing record to return idempotently without duplicate outbox event
          const [existing] = await tx
            .select()
            .from(schema.notifications)
            .where(eq(schema.notifications.deliveryKey, effectiveDeliveryKey))
            .limit(1);

          return existing ?? null;
        }
      } else {
        const [inserted] = await tx
          .insert(schema.notifications)
          .values({
            userId,
            type,
            payloadJson: enrichedPayload,
          })
          .returning();
        notification = inserted;
      }

      if (!notification) {
        throw new Error("Failed to create notification");
      }

      await tx.insert(schema.outboxEvents).values({
        type,
        aggregateType,
        aggregateId,
        deliveryKey: effectiveDeliveryKey ?? null,
        payloadJson: {
          ...enrichedPayload,
          recipientUserId: userId,
          notificationId: notification.id,
          ...(effectiveDeliveryKey ? { deliveryKey: effectiveDeliveryKey } : {}),
        },
        status: "PENDING",
        attemptCount: 0,
        nextAttemptAt: new Date(),
      });

      return notification;
    };

    try {
      let result: typeof schema.notifications.$inferSelect | null;
      if (txContext && typeof (txContext as Record<string, unknown>).insert === "function") {
        result = await execute(txContext as TransactionContext);
      } else {
        const db = getDb();
        result = await db.transaction(execute);

        // Immediate sub-second outbox dispatch via Inngest (fail-open)
        import("@/src/lib/inngest/client")
          .then(({ sendInngestEvent }) => {
            sendInngestEvent("operis/outbox.process", {
              triggeredBy: "notification_created",
            }).catch(() => {});
          })
          .catch(() => {});
      }
      if (result) {
        notificationPubSub.emitNotification(userId, {
          id: result.id,
          userId: result.userId,
          type: result.type,
          payloadJson: (result.payloadJson as Record<string, unknown>) || {},
          readAt: result.readAt ? result.readAt.toISOString() : null,
          createdAt: result.createdAt instanceof Date ? result.createdAt.toISOString() : String(result.createdAt),
        });
      }
      return result;
    } catch (err) {
      if (txContext || process.env.NODE_ENV === "production") {
        throw err;
      }
      const newNotif = {
        id: `notif-dyn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId,
        type,
        payloadJson: payload,
        readAt: null,
        createdAt: new Date().toISOString(),
      };
      inMemoryFallbackNotifications.unshift(newNotif);
      notificationPubSub.emitNotification(userId, {
        id: newNotif.id,
        userId: newNotif.userId,
        type: newNotif.type,
        payloadJson: (newNotif.payloadJson as Record<string, unknown>) || {},
        readAt: null,
        createdAt: newNotif.createdAt,
      });
      return {
        id: newNotif.id,
        userId,
        type,
        payloadJson: payload,
        readAt: null,
        createdAt: new Date(newNotif.createdAt),
      };
    }
  }

  /**
   * Retrieves notifications for a user with unread filter and pagination.
   */
  static async getUserNotifications(userId: string, unreadOnly = false, limit = 20) {
    try {
      const db = getDb();

      const conditions = [eq(schema.notifications.userId, userId)];
      if (unreadOnly) {
        conditions.push(isNull(schema.notifications.readAt));
      }

      const rows = await db
        .select()
        .from(schema.notifications)
        .where(and(...conditions))
        .orderBy(desc(schema.notifications.createdAt))
        .limit(limit);

      return rows;
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        throw err;
      }
      let list = inMemoryFallbackNotifications;
      if (unreadOnly) {
        list = list.filter((n) => !n.readAt);
      }
      return list.slice(0, limit).map((n) => ({
        id: n.id,
        userId,
        type: n.type,
        payloadJson: n.payloadJson,
        readAt: n.readAt ? new Date(n.readAt) : null,
        createdAt: new Date(n.createdAt),
      }));
    }
  }

  /**
   * Marks a notification as read.
   */
  static async markAsRead(userId: string, notificationId: string) {
    try {
      const db = getDb();

      const [updated] = await db
        .update(schema.notifications)
        .set({ readAt: new Date() })
        .where(
          and(eq(schema.notifications.id, notificationId), eq(schema.notifications.userId, userId))
        )
        .returning();

      return updated ?? null;
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        throw err;
      }
      const item = inMemoryFallbackNotifications.find((n) => n.id === notificationId);
      if (item) {
        item.readAt = new Date().toISOString();
        return {
          id: item.id,
          userId,
          type: item.type,
          payloadJson: item.payloadJson,
          readAt: new Date(item.readAt),
          createdAt: new Date(item.createdAt),
        };
      }
      return null;
    }
  }

  /**
   * Marks all unread notifications as read for a user.
   */
  static async markAllAsRead(userId: string) {
    try {
      const db = getDb();

      await db
        .update(schema.notifications)
        .set({ readAt: new Date() })
        .where(and(eq(schema.notifications.userId, userId), isNull(schema.notifications.readAt)));

      return true;
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        throw err;
      }
      const nowIso = new Date().toISOString();
      for (const n of inMemoryFallbackNotifications) {
        if (!n.readAt) {
          n.readAt = nowIso;
        }
      }
      return true;
    }
  }

  /**
   * Worker job to process outbox events using exponential backoff.
   * Dispatches transactional emails via EmailAdapter with zero PII leakage.
   */
  static async processOutboxBatch(batchSize = 25) {
    try {
      const db = getDb();
      const now = new Date();
      const leaseDurationMs = 5 * 60 * 1000; // 5-minute lease timeout

      const pendingEvents = await db
        .select()
        .from(schema.outboxEvents)
        .where(
          or(
            and(
              eq(schema.outboxEvents.status, "PENDING"),
              lte(schema.outboxEvents.nextAttemptAt, now)
            ),
            and(
              eq(schema.outboxEvents.status, "PROCESSING"),
              or(isNull(schema.outboxEvents.leaseUntil), lte(schema.outboxEvents.leaseUntil, now))
            )
          )
        )
        .limit(batchSize);

      let processedCount = 0;

      for (const event of pendingEvents) {
        const workerLeaseToken = crypto.randomUUID();
        const leaseUntil = new Date(Date.now() + leaseDurationMs);

        // Atomically claim the event with leaseToken fencing
        const claimResult = await db
          .update(schema.outboxEvents)
          .set({
            status: "PROCESSING",
            leaseToken: workerLeaseToken,
            leaseUntil,
            nextAttemptAt: now,
          })
          .where(
            and(
              eq(schema.outboxEvents.id, event.id),
              or(
                eq(schema.outboxEvents.status, "PENDING"),
                and(
                  eq(schema.outboxEvents.status, "PROCESSING"),
                  or(
                    isNull(schema.outboxEvents.leaseUntil),
                    lte(schema.outboxEvents.leaseUntil, now)
                  )
                )
              )
            )
          )
          .returning({ id: schema.outboxEvents.id });

        if (claimResult.length === 0) {
          // Another worker claimed this event concurrently, skip it
          continue;
        }

        try {
          const payload = event.payloadJson as Record<string, unknown>;

          if (event.type === "LISTING_PUBLISHED" || event.type === "LISTING_REACTIVATED") {
            const { processFanoutEvent } = await import("./fanout");
            const result = await processFanoutEvent(event.id, workerLeaseToken);
            if (result === "COMPLETED") {
              processedCount++;
            } else if (result === "ERROR") {
              const nextAttempts = event.attemptCount + 1;
              const isDead = nextAttempts >= 3;
              const nextAttemptAt = new Date(Date.now() + 30000);

              await db
                .update(schema.outboxEvents)
                .set({
                  status: isDead ? "DEAD" : "PENDING",
                  attemptCount: nextAttempts,
                  nextAttemptAt,
                  leaseToken: null,
                  leaseUntil: null,
                })
                .where(
                  and(
                    eq(schema.outboxEvents.id, event.id),
                    eq(schema.outboxEvents.leaseToken, workerLeaseToken),
                    eq(schema.outboxEvents.status, "PROCESSING")
                  )
                );
            }
            continue;
          }

          const recipientUserId = payload.recipientUserId as string | undefined;

          if (!recipientUserId) {
            // Missing recipient: Mark FAILED immediately, DO NOT mark SENT
            await db
              .update(schema.outboxEvents)
              .set({
                status: "FAILED",
                leaseToken: null,
                leaseUntil: null,
              })
              .where(
                and(
                  eq(schema.outboxEvents.id, event.id),
                  eq(schema.outboxEvents.leaseToken, workerLeaseToken)
                )
              );
            continue;
          }

          // Fetch recipient email and locale (supporting both encrypted and legacy email)
          const userRows = await db
            .select({
              email: schema.users.email,
              emailEnc: schema.users.emailEnc,
              locale: schema.profiles.locale,
            })
            .from(schema.users)
            .leftJoin(schema.profiles, eq(schema.users.id, schema.profiles.userId))
            .where(eq(schema.users.id, recipientUserId))
            .limit(1);

          const user = userRows[0];
          let recipientEmail: string | null = null;
          if (user?.emailEnc) {
            try {
              const { decryptEnvelopeV2 } = await import("@/src/lib/crypto/envelope");
              recipientEmail = decryptEnvelopeV2(user.emailEnc, {
                table: "users",
                primaryKey: recipientUserId,
                column: "email_enc",
              });
            } catch {
              // Fail closed: do not fallback to plaintext if ciphertext cannot be decrypted
              recipientEmail = null;
            }
          } else if (user?.email) {
            recipientEmail = user.email;
          }

          if (!user || !recipientEmail) {
            // Recipient user not found or has no email: Mark FAILED, DO NOT mark SENT
            await db
              .update(schema.outboxEvents)
              .set({
                status: "FAILED",
                leaseToken: null,
                leaseUntil: null,
              })
              .where(
                and(
                  eq(schema.outboxEvents.id, event.id),
                  eq(schema.outboxEvents.leaseToken, workerLeaseToken)
                )
              );
            continue;
          }

          const locale = user.locale === "en" ? "en" : "tr";
          const customTitle = typeof payload.title === "string" ? payload.title : null;
          const customMessage = typeof payload.message === "string" ? payload.message : null;

          const subject =
            customTitle ||
            (locale === "tr"
              ? `Platform Bildirimi: ${event.type}`
              : `Platform Notification: ${event.type}`);

          const isTr = locale === "tr";
          let body = "";
          if (customMessage) {
            body = isTr
              ? `Merhaba,\n\n${customMessage}\n\nDetayları Operis platformu üzerinden görüntüleyebilirsiniz.`
              : `Hello,\n\n${customMessage}\n\nYou can view full details on the Operis platform.`;
          } else {
            body = isTr
              ? `Merhaba,\n\nHesabınızda yeni bir işlem gerçekleşti: ${event.type}.\nDetayları platform üzerinden görüntüleyebilirsiniz.`
              : `Hello,\n\nA new activity occurred on your account: ${event.type}.\nYou can view details on the platform.`;
          }

          // Sliding-Window Frequency Capping for CATEGORY_FOLLOW_MATCH job alerts
          if (event.type === "CATEGORY_FOLLOW_MATCH") {
            const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
            const recentSentRows = await db
              .select({ id: schema.outboxEvents.id })
              .from(schema.outboxEvents)
              .where(
                and(
                  eq(schema.outboxEvents.type, "CATEGORY_FOLLOW_MATCH"),
                  eq(schema.outboxEvents.status, "SENT"),
                  sql`(${schema.outboxEvents.payloadJson}->>'recipientUserId') = ${recipientUserId}`,
                  sql`COALESCE((${schema.outboxEvents.payloadJson}->>'skippedReason'), '') = ''`,
                  gt(schema.outboxEvents.createdAt, fourHoursAgo)
                )
              )
              .limit(3);

            if (recentSentRows.length >= 3) {
              // Frequency capped: skip email delivery, retain in-app notification
              await db
                .update(schema.outboxEvents)
                .set({
                  status: "SENT",
                  attemptCount: event.attemptCount + 1,
                  leaseToken: null,
                  leaseUntil: null,
                  payloadJson: {
                    ...payload,
                    skippedReason: "FREQUENCY_CAPPED_4H",
                  },
                })
                .where(
                  and(
                    eq(schema.outboxEvents.id, event.id),
                    eq(schema.outboxEvents.leaseToken, workerLeaseToken)
                  )
                );
              processedCount++;
              continue;
            }
          }

          const sentOk = await EmailAdapter.sendTransactionalEmail({
            to: recipientEmail,
            subject,
            body,
            template: event.type.toLowerCase(),
            locale,
            idempotencyKey: event.deliveryKey
              ? `outbox_${event.deliveryKey}`
              : `outbox_${event.id}`,
            variables: {
              subject,
              body,
              title: customTitle || subject,
              listingTitle: typeof payload.title === "string" ? payload.title : "",
              categoryName: typeof payload.categoryName === "string" ? payload.categoryName : "",
              budget: typeof payload.budget === "string" ? payload.budget : "",
              timeline: typeof payload.timeline === "string" ? payload.timeline : "",
              summary: typeof payload.summary === "string" ? payload.summary : "",
              tags: typeof payload.tags === "string" ? payload.tags : "",
              relevanceBadge: typeof payload.relevanceBadge === "string" ? payload.relevanceBadge : "",
              actionUrl: typeof payload.actionUrl === "string" ? payload.actionUrl : "",
            },
          });

          if (!sentOk) {
            throw new Error(`Email provider failed for outbox event ${event.id}`);
          }

          // Mark SENT conditioned on leaseToken
          await db
            .update(schema.outboxEvents)
            .set({
              status: "SENT",
              attemptCount: event.attemptCount + 1,
              leaseToken: null,
              leaseUntil: null,
            })
            .where(
              and(
                eq(schema.outboxEvents.id, event.id),
                eq(schema.outboxEvents.leaseToken, workerLeaseToken)
              )
            );

          processedCount++;
        } catch (deliveryErr: unknown) {
          const errMsg = deliveryErr instanceof Error ? deliveryErr.message : String(deliveryErr);
          const nextAttempts = event.attemptCount + 1;
          const isDead = nextAttempts >= 5;

          // Exponential backoff in seconds: 2^attempt * 30s
          const backoffSeconds = Math.pow(2, nextAttempts) * 30;
          const nextAttemptAt = new Date(Date.now() + backoffSeconds * 1000);

          console.error(
            `[outbox-worker] Delivery failure for event ${event.id} (attempt ${nextAttempts}/5, isDead=${isDead}): ${errMsg}`
          );

          const currentPayload = (event.payloadJson as Record<string, unknown>) || {};
          const updatedPayload = {
            ...currentPayload,
            lastDeliveryError: errMsg,
            failedAt: new Date().toISOString(),
            attemptCount: nextAttempts,
          };

          await db
            .update(schema.outboxEvents)
            .set({
              status: isDead ? "DEAD" : "PENDING",
              attemptCount: nextAttempts,
              nextAttemptAt,
              payloadJson: updatedPayload,
              leaseToken: null,
              leaseUntil: null,
            })
            .where(
              and(
                eq(schema.outboxEvents.id, event.id),
                eq(schema.outboxEvents.leaseToken, workerLeaseToken)
              )
            );
        }
      }

      return processedCount;
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        throw err;
      }
      return 0;
    }
  }

  /**
   * Resurrects DEAD outbox events back to PENDING so they can be retried by the outbox processor.
   * Resets nextAttemptAt to now and clears attemptCount for a fresh backoff cycle.
   */
  static async reviveDeadOutboxEvents(maxLimit = 100): Promise<number> {
    try {
      const db = getDb();
      const now = new Date();

      const deadEvents = await db
        .select({ id: schema.outboxEvents.id })
        .from(schema.outboxEvents)
        .where(eq(schema.outboxEvents.status, "DEAD"))
        .limit(maxLimit);

      if (deadEvents.length === 0) {
        return 0;
      }

      const deadIds = deadEvents.map((e) => e.id);
      await db
        .update(schema.outboxEvents)
        .set({
          status: "PENDING",
          nextAttemptAt: now,
          attemptCount: 0,
        })
        .where(inArray(schema.outboxEvents.id, deadIds));

      return deadIds.length;
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        throw err;
      }
      return 0;
    }
  }
}
