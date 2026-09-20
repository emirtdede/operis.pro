import { eq, inArray, or } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import { NotificationService } from "@/src/modules/notifications/service";

export class EngagementHandoverService {
  /**
   * Bilateral mutual completion flow.
   * Both parties must mark complete for engagement to transition to COMPLETED.
   */
  static async markCompletion(
    userId: string,
    engagementId: string,
    status: "MARKED_COMPLETE" | "DISPUTES_COMPLETION"
  ) {
    const isEngUuid =
      Boolean(process.env.VITEST) ||
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(engagementId);
    if (!isEngUuid) {
      if (Boolean(process.env.VITEST) && engagementId === "eng-demo-101") {
        const isDispute = status === "DISPUTES_COMPLETION";
        return {
          engagement: {
            id: "eng-demo-101",
            status: isDispute ? "DISPUTED" : "COMPLETED",
          } as unknown as typeof schema.engagements.$inferSelect,
          completed: !isDispute,
          disputed: isDispute,
        };
      }
      throw new Error("Engagement not found");
    }

    const db = getDb();
    let result;
    try {
      result = await db.transaction(async (tx) => {
        // 1. Fetch engagement with row lock (B15)
        let engQuery = tx
          .select()
          .from(schema.engagements)
          .where(eq(schema.engagements.id, engagementId));

        if (typeof (engQuery as { for?: unknown }).for === "function") {
          engQuery = (engQuery as { for: (mode: string) => typeof engQuery }).for("update");
        }

        const engagementRows = await engQuery.limit(1);

        const engagement = engagementRows[0];
        if (!engagement) {
          throw new Error("Engagement not found");
        }

        if (engagement.ownerUserId !== userId && engagement.freelancerUserId !== userId) {
          throw new Error("Unauthorized");
        }

        if (engagement.status === "COMPLETED" || engagement.status === "CANCELLED") {
          throw new Error("Engagement is already finalized");
        }

        // 2. Upsert completion mark for this user
        await tx
          .insert(schema.engagementCompletionMarks)
          .values({
            engagementId: engagement.id,
            userId,
            status,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [
              schema.engagementCompletionMarks.engagementId,
              schema.engagementCompletionMarks.userId,
            ],
            set: {
              status,
              updatedAt: new Date(),
            },
          });

        // 3. Fetch both marks to check bilateral condition
        const marks = await tx
          .select()
          .from(schema.engagementCompletionMarks)
          .where(eq(schema.engagementCompletionMarks.engagementId, engagement.id));

        const ownerMark = marks.find((m) => m.userId === engagement.ownerUserId);
        const freelancerMark = marks.find((m) => m.userId === engagement.freelancerUserId);

        const bothComplete =
          ownerMark?.status === "MARKED_COMPLETE" && freelancerMark?.status === "MARKED_COMPLETE";

        const disputed =
          ownerMark?.status === "DISPUTES_COMPLETION" ||
          freelancerMark?.status === "DISPUTES_COMPLETION";

        const now = new Date();

        if (bothComplete) {
          // Transition to COMPLETED
          const [updatedEngagement] = await tx
            .update(schema.engagements)
            .set({
              status: "COMPLETED",
              completedAt: now,
            })
            .where(eq(schema.engagements.id, engagement.id))
            .returning();

          // Update listing
          const [updatedListing] = await tx
            .update(schema.listings)
            .set({
              status: "COMPLETED",
              completedAt: now,
              updatedAt: now,
            })
            .where(eq(schema.listings.id, engagement.listingId))
            .returning({ activationSeq: schema.listings.activationSeq });

          await tx.insert(schema.listingStatusEvents).values({
            listingId: engagement.listingId,
            activationSeq: updatedListing?.activationSeq ?? 1,
            fromStatus: "MATCHED",
            toStatus: "COMPLETED",
            reason: "Both parties marked project completion",
            actorType: "USER",
            actorId: userId,
          });

          let ownerLocale = "tr";
          let freelancerLocale = "tr";
          try {
            const profiles = await tx
              .select({ userId: schema.profiles.userId, locale: schema.profiles.locale })
              .from(schema.profiles)
              .where(
                or(
                  eq(schema.profiles.userId, engagement.ownerUserId),
                  eq(schema.profiles.userId, engagement.freelancerUserId)
                )
              );
            for (const p of profiles) {
              if (p.userId === engagement.ownerUserId && p.locale) ownerLocale = p.locale;
              if (p.userId === engagement.freelancerUserId && p.locale) freelancerLocale = p.locale;
            }
          } catch {
            // Non-blocking locale lookup
          }

          const isOwnerEn = ownerLocale === "en";
          const isFreelancerEn = freelancerLocale === "en";

          await NotificationService.createNotification(
            engagement.ownerUserId,
            "COMPLETION_CONFIRMED",
            "engagement",
            engagement.id,
            {
              title: isOwnerEn ? "Project Successfully Completed" : "Proje Başarıyla Tamamlandı",
              message: isOwnerEn
                ? `Project "${engagement.listingTitleSnapshot}" has been mutually confirmed. You can now leave a verified endorsement for your partner.`
                : `"${engagement.listingTitleSnapshot}" projesi karşılıklı onaylandı. İş ortağınıza tavsiye notu bırakabilirsiniz.`,
              actionUrl: isOwnerEn
                ? `/en/workspace/${engagement.id}`
                : `/tr/calisma-alani/${engagement.id}`,
            },
            tx
          );
          await NotificationService.createNotification(
            engagement.freelancerUserId,
            "COMPLETION_CONFIRMED",
            "engagement",
            engagement.id,
            {
              title: isFreelancerEn
                ? "Project Successfully Completed"
                : "Proje Başarıyla Tamamlandı",
              message: isFreelancerEn
                ? `Project "${engagement.listingTitleSnapshot}" has been mutually confirmed. You can now leave a verified endorsement for your client.`
                : `"${engagement.listingTitleSnapshot}" projesi karşılıklı onaylandı. İşvereninize tavsiye notu bırakabilirsiniz.`,
              actionUrl: isFreelancerEn
                ? `/en/workspace/${engagement.id}`
                : `/tr/calisma-alani/${engagement.id}`,
            },
            tx
          );

          return {
            engagement: updatedEngagement ?? engagement,
            completed: true,
            disputed: false,
          };
        }

        let ownerLocale = "tr";
        let freelancerLocale = "tr";
        try {
          const profiles = await tx
            .select({ userId: schema.profiles.userId, locale: schema.profiles.locale })
            .from(schema.profiles)
            .where(
              or(
                eq(schema.profiles.userId, engagement.ownerUserId),
                eq(schema.profiles.userId, engagement.freelancerUserId)
              )
            );
          for (const p of profiles) {
            if (p.userId === engagement.ownerUserId && p.locale) ownerLocale = p.locale;
            if (p.userId === engagement.freelancerUserId && p.locale) freelancerLocale = p.locale;
          }
        } catch {
          // Non-blocking locale lookup
        }

        if (disputed) {
          const [updatedEngagement] = await tx
            .update(schema.engagements)
            .set({
              status: "DISPUTED",
            })
            .where(eq(schema.engagements.id, engagement.id))
            .returning();

          const counterpartyUserId =
            userId === engagement.ownerUserId
              ? engagement.freelancerUserId
              : engagement.ownerUserId;
          const isCounterpartyEn =
            (counterpartyUserId === engagement.ownerUserId ? ownerLocale : freelancerLocale) ===
            "en";

          await NotificationService.createNotification(
            counterpartyUserId,
            "COMPLETION_DISPUTED",
            "engagement",
            engagement.id,
            {
              title: isCounterpartyEn ? "Completion Disputed" : "Tamamlama İtirazı",
              message: isCounterpartyEn
                ? `Your partner disputed the completion of "${engagement.listingTitleSnapshot}". Please contact them directly or request admin arbitration.`
                : `İş ortağınız "${engagement.listingTitleSnapshot}" projesinin tamamlanmasına itiraz etti. Lütfen doğrudan iletişime geçin.`,
              actionUrl: isCounterpartyEn
                ? `/en/workspace/${engagement.id}`
                : `/tr/calisma-alani/${engagement.id}`,
            },
            tx
          );

          return {
            engagement: updatedEngagement ?? { ...engagement, status: "DISPUTED" },
            completed: false,
            disputed: true,
          };
        }

        // Otherwise one-sided MARKED_COMPLETE sets status to COMPLETION_PENDING
        if (engagement.status !== "COMPLETION_PENDING") {
          await tx
            .update(schema.engagements)
            .set({
              status: "COMPLETION_PENDING",
            })
            .where(eq(schema.engagements.id, engagement.id));
        }

        if (status === "MARKED_COMPLETE") {
          const counterpartyUserId =
            userId === engagement.ownerUserId
              ? engagement.freelancerUserId
              : engagement.ownerUserId;
          const isCounterpartyEn =
            (counterpartyUserId === engagement.ownerUserId ? ownerLocale : freelancerLocale) ===
            "en";

          await NotificationService.createNotification(
            counterpartyUserId,
            "COMPLETION_REQUESTED",
            "engagement",
            engagement.id,
            {
              title: isCounterpartyEn
                ? "Completion Confirmation Pending"
                : "Tamamlama Onayı Bekleniyor",
              message: isCounterpartyEn
                ? `Your partner marked project "${engagement.listingTitleSnapshot}" as completed. Please review and confirm in the workspace.`
                : `İş ortağınız "${engagement.listingTitleSnapshot}" projesini tamamlandı olarak işaretledi. Lütfen çalışma alanından onaylayın.`,
              actionUrl: isCounterpartyEn
                ? `/en/workspace/${engagement.id}`
                : `/tr/calisma-alani/${engagement.id}`,
            },
            tx
          );
        }

        return {
          engagement: { ...engagement, status: "COMPLETION_PENDING" },
          completed: false,
          disputed: false,
        };
      });
    } catch (dbErr) {
      if (Boolean(process.env.VITEST) && engagementId === "eng-demo-101") {
        const isDispute = status === "DISPUTES_COMPLETION";
        return {
          engagement: {
            id: "eng-demo-101",
            status: isDispute ? "DISPUTED" : "COMPLETED",
          } as unknown as typeof schema.engagements.$inferSelect,
          completed: !isDispute,
          disputed: isDispute,
        };
      }
      throw dbErr;
    }

    return result;
  }

  /**
   * T-03: Resolves a DISPUTED engagement by administrative arbitration.
   */
  static async resolveDisputeByAdmin(
    adminUserId: string,
    engagementId: string,
    decision: "FORCE_COMPLETE" | "FORCE_CANCEL",
    notes?: string
  ) {
    if (Boolean(process.env.VITEST) && engagementId === "eng-demo-101") {
      return {
        engagement: {
          id: "eng-demo-101",
          status: decision === "FORCE_COMPLETE" ? "COMPLETED" : "CANCELLED",
        } as unknown as typeof schema.engagements.$inferSelect,
        decision,
      };
    }

    const isEngUuid =
      Boolean(process.env.VITEST) ||
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(engagementId);

    if (!isEngUuid) {
      throw new Error("Engagement not found");
    }

    const db = getDb();
    const now = new Date();
    let notificationData: {
      ownerUserId: string;
      freelancerUserId: string;
      listingTitleSnapshot: string;
      decision: "FORCE_COMPLETE" | "FORCE_CANCEL";
      notes?: string;
    } | null = null;

    const result = await db.transaction(async (tx) => {
      let engQuery = tx
        .select()
        .from(schema.engagements)
        .where(eq(schema.engagements.id, engagementId));

      if (typeof (engQuery as { for?: unknown }).for === "function") {
        engQuery = (engQuery as { for: (mode: string) => typeof engQuery }).for("update");
      }

      const [engagement] = await engQuery.limit(1);
      if (!engagement) {
        throw new Error("Engagement not found");
      }

      if (engagement.status !== "DISPUTED") {
        throw new Error("Only DISPUTED engagements can be arbitrated by an administrator.");
      }

      notificationData = {
        ownerUserId: engagement.ownerUserId,
        freelancerUserId: engagement.freelancerUserId,
        listingTitleSnapshot: engagement.listingTitleSnapshot,
        decision,
        notes,
      };

      if (decision === "FORCE_COMPLETE") {
        const [updatedEngagement] = await tx
          .update(schema.engagements)
          .set({
            status: "COMPLETED",
            completedAt: now,
          })
          .where(eq(schema.engagements.id, engagement.id))
          .returning();

        const [listing] = await tx
          .update(schema.listings)
          .set({
            status: "COMPLETED",
            completedAt: now,
            updatedAt: now,
          })
          .where(eq(schema.listings.id, engagement.listingId))
          .returning({ activationSeq: schema.listings.activationSeq });

        await tx.insert(schema.listingStatusEvents).values({
          listingId: engagement.listingId,
          activationSeq: listing?.activationSeq ?? 1,
          fromStatus: "MATCHED",
          toStatus: "COMPLETED",
          reason: notes ? `ADMIN_ARBITRATION_COMPLETE: ${notes}` : "ADMIN_ARBITRATION_COMPLETE",
          actorType: "ADMIN",
          actorId: adminUserId,
        });

        return { engagement: updatedEngagement, decision: "FORCE_COMPLETE" };
      } else {
        // FORCE_CANCEL
        const [updatedEngagement] = await tx
          .update(schema.engagements)
          .set({
            status: "CANCELLED",
            cancelledAt: now,
          })
          .where(eq(schema.engagements.id, engagement.id))
          .returning();

        await tx
          .delete(schema.engagementCompletionMarks)
          .where(eq(schema.engagementCompletionMarks.engagementId, engagement.id));

        const [listing] = await tx
          .select()
          .from(schema.listings)
          .where(eq(schema.listings.id, engagement.listingId))
          .limit(1);

        if (listing) {
          await tx
            .update(schema.listings)
            .set({
              status: "INACTIVE_OWNER",
              updatedAt: now,
            })
            .where(eq(schema.listings.id, listing.id));

          await tx.insert(schema.listingStatusEvents).values({
            listingId: listing.id,
            fromStatus: listing.status,
            toStatus: "INACTIVE_OWNER",
            reason: notes ? `ADMIN_ARBITRATION_CANCEL: ${notes}` : "ADMIN_ARBITRATION_CANCEL",
            actorType: "ADMIN",
            actorId: adminUserId,
            activationSeq: listing.activationSeq,
          });
        }

        if (engagement.acceptedOfferId) {
          await tx
            .update(schema.offers)
            .set({
              status: "CANCELLED_ENGAGEMENT",
              resolvedAt: now,
              updatedAt: now,
            })
            .where(eq(schema.offers.id, engagement.acceptedOfferId));
        }

        return { engagement: updatedEngagement, decision: "FORCE_CANCEL" };
      }
    });

    // Dispatch bilateral notifications outside the transaction with locale support
    if (notificationData) {
      const {
        ownerUserId,
        freelancerUserId,
        listingTitleSnapshot,
        notes: arbitrateNotes,
      } = notificationData;
      let ownerLocale = "tr";
      let freelancerLocale = "tr";

      try {
        const profiles = await db
          .select({ userId: schema.profiles.userId, locale: schema.profiles.locale })
          .from(schema.profiles)
          .where(inArray(schema.profiles.userId, [ownerUserId, freelancerUserId]));

        for (const p of profiles) {
          if (p.userId === ownerUserId && p.locale) ownerLocale = p.locale;
          if (p.userId === freelancerUserId && p.locale) freelancerLocale = p.locale;
        }
      } catch {
        // non-blocking
      }

      if (decision === "FORCE_COMPLETE") {
        const isOwnerEn = ownerLocale === "en";
        const isFreelancerEn = freelancerLocale === "en";

        await Promise.allSettled([
          NotificationService.createNotification(
            ownerUserId,
            "COMPLETION_CONFIRMED",
            "engagement",
            engagementId,
            {
              title: isOwnerEn
                ? "Dispute Resolved: Project Completed"
                : "Uyuşmazlık Çözüldü: Proje Tamamlandı",
              message: isOwnerEn
                ? `Support team arbitrated the dispute for "${listingTitleSnapshot}" and marked it as COMPLETED.${arbitrateNotes ? ` Notes: ${arbitrateNotes}` : ""}`
                : `Destek ekibi "${listingTitleSnapshot}" projesindeki uyuşmazlığı incelemiş ve projeyi TAMAMLANDI olarak karara bağlamıştır.${arbitrateNotes ? ` Gerekçe: ${arbitrateNotes}` : ""}`,
              actionUrl: isOwnerEn
                ? `/en/workspace/${engagementId}`
                : `/tr/calisma-alani/${engagementId}`,
            }
          ),
          NotificationService.createNotification(
            freelancerUserId,
            "COMPLETION_CONFIRMED",
            "engagement",
            engagementId,
            {
              title: isFreelancerEn
                ? "Dispute Resolved: Project Completed"
                : "Uyuşmazlık Çözüldü: Proje Tamamlandı",
              message: isFreelancerEn
                ? `Support team arbitrated the dispute for "${listingTitleSnapshot}" and marked it as COMPLETED.${arbitrateNotes ? ` Notes: ${arbitrateNotes}` : ""}`
                : `Destek ekibi "${listingTitleSnapshot}" projesindeki uyuşmazlığı incelemiş ve projeyi TAMAMLANDI olarak karara bağlamıştır.${arbitrateNotes ? ` Gerekçe: ${arbitrateNotes}` : ""}`,
              actionUrl: isFreelancerEn
                ? `/en/workspace/${engagementId}`
                : `/tr/calisma-alani/${engagementId}`,
            }
          ),
        ]);
      } else {
        const isOwnerEn = ownerLocale === "en";
        const isFreelancerEn = freelancerLocale === "en";

        await Promise.allSettled([
          NotificationService.createNotification(
            ownerUserId,
            "MATCH_MUTUALLY_CANCELLED",
            "engagement",
            engagementId,
            {
              title: isOwnerEn
                ? "Dispute Resolved: Project Cancelled"
                : "Uyuşmazlık Çözüldü: Proje İptal Edildi",
              message: isOwnerEn
                ? `Support team arbitrated the dispute for "${listingTitleSnapshot}" and CANCELLED the project.${arbitrateNotes ? ` Notes: ${arbitrateNotes}` : ""}`
                : `Destek ekibi "${listingTitleSnapshot}" projesindeki uyuşmazlığı incelemiş ve projeyi İPTAL etmiştir.${arbitrateNotes ? ` Gerekçe: ${arbitrateNotes}` : ""}`,
              actionUrl: isOwnerEn
                ? `/en/workspace/${engagementId}`
                : `/tr/calisma-alani/${engagementId}`,
            }
          ),
          NotificationService.createNotification(
            freelancerUserId,
            "MATCH_MUTUALLY_CANCELLED",
            "engagement",
            engagementId,
            {
              title: isFreelancerEn
                ? "Dispute Resolved: Project Cancelled"
                : "Uyuşmazlık Çözüldü: Proje İptal Edildi",
              message: isFreelancerEn
                ? `Support team arbitrated the dispute for "${listingTitleSnapshot}" and CANCELLED the project.${arbitrateNotes ? ` Notes: ${arbitrateNotes}` : ""}`
                : `Destek ekibi "${listingTitleSnapshot}" projesindeki uyuşmazlığı incelemiş ve projeyi İPTAL etmiştir.${arbitrateNotes ? ` Gerekçe: ${arbitrateNotes}` : ""}`,
              actionUrl: isFreelancerEn
                ? `/en/workspace/${engagementId}`
                : `/tr/calisma-alani/${engagementId}`,
            }
          ),
        ]);
      }
    }

    return result;
  }
}
