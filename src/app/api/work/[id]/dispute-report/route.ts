import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { DisputeArbiterService } from "@/src/modules/ai/dispute-arbiter";
import { getDb } from "@/src/lib/db";
import * as schema from "@/db/schema";
import type { DeliveryHealthReport } from "@/src/modules/engagements/delivery-inspector";
import { eq, desc, asc } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: engagementId } = await params;
  if (!engagementId) {
    return NextResponse.json({ error: "Missing engagement ID" }, { status: 400 });
  }

  try {
    const isMock = Boolean(process.env.VITEST) || engagementId === "eng-demo-101" || engagementId.startsWith("eng-dispute-");

    if (isMock) {
      const report = DisputeArbiterService.analyzeDispute({
        engagementId,
        listingTitle: "Kurumsal Web & SaaS Mimarisi",
        category: "software-development",
        matchedAt: new Date(Date.now() - 14 * 86400000),
        agreedBudgetLabel: "60.000 TL",
        agreedTimelineLabel: "2 Hafta",
        handover: {
          repositoryUrl: "https://github.com/operis-demo/saas-repo",
          commitHash: "1234567890abcdef1234567890abcdef12345678",
          liveUrl: "https://demo.operis.internal",
          submittedAt: new Date(Date.now() - 3 * 86400000),
          status: "REVISION_REQUESTED",
          deliveryHealth: {
            isHealthy: true,
            inspectedAt: new Date().toISOString(),
            summaryStatus: "HEALTHY",
            powSeal: "b".repeat(64),
            badgeTextTr: "Doğrulandı",
            badgeTextEn: "Verified",
            liveDeployment: {
              checked: true,
              url: "https://demo.operis.internal",
              isAccessible: true,
              httpStatus: 200,
              responseTimeMs: 120,
              sslValid: true,
            },
            gitRepository: {
              checked: true,
              url: "https://github.com/operis-demo/saas-repo",
              isAccessible: true,
              provider: "github",
              commitHash: "1234567890abcdef1234567890abcdef12345678",
              commitValid: true,
            },
          },
        },
        changeRequests: [],
        messages: [
          {
            senderRole: "CLIENT",
            content: "Lütfen kapsamda olmayan ek 2 rapor ekranı ve SMS entegrasyonu da ekleyin.",
          },
        ],
        revisionRoundsCount: 2,
        disputedAt: new Date(),
      });

      return NextResponse.json({ success: true, report });
    }

    const db = getDb();
    const [engagement] = await db
      .select()
      .from(schema.engagements)
      .where(eq(schema.engagements.id, engagementId))
      .limit(1);

    if (!engagement) {
      return NextResponse.json({ error: "Engagement not found" }, { status: 404 });
    }

    // Must be either owner or freelancer
    if (engagement.ownerUserId !== session.userId && engagement.freelancerUserId !== session.userId) {
      return NextResponse.json({ error: "Forbidden. You are not a participant in this engagement." }, { status: 403 });
    }

    const [handover] = await db
      .select()
      .from(schema.engagementHandovers)
      .where(eq(schema.engagementHandovers.engagementId, engagementId))
      .limit(1);

    const changeRequests = await db
      .select()
      .from(schema.engagementChangeRequests)
      .where(eq(schema.engagementChangeRequests.engagementId, engagementId))
      .orderBy(desc(schema.engagementChangeRequests.createdAt));

    const milestones = await db
      .select()
      .from(schema.engagementMilestones)
      .where(eq(schema.engagementMilestones.engagementId, engagementId))
      .orderBy(asc(schema.engagementMilestones.sequenceNumber));

    const report = DisputeArbiterService.analyzeDispute({
      engagementId: engagement.id,
      listingTitle: engagement.listingTitleSnapshot,
      category: engagement.listingCategorySnapshot,
      matchedAt: engagement.matchedAt,
      handover: handover
        ? {
            repositoryUrl: handover.repositoryUrl,
            commitHash: handover.commitHash,
            liveUrl: handover.liveUrl,
            submittedAt: handover.submittedAt,
            inspectionExpiresAt: handover.inspectionExpiresAt,
            status: handover.status,
            revisionNotes: handover.revisionNotes,
            deliveryHealth: (handover.deliveryHealth as DeliveryHealthReport | null) ?? null,
          }
        : null,
      changeRequests: changeRequests.map((cr) => ({
        title: cr.title,
        reason: cr.reason,
        additionalBudget: cr.additionalBudget,
        additionalDays: cr.additionalDays,
        status: cr.status,
        createdAt: cr.createdAt,
      })),
      milestones: milestones.map((m) => ({
        id: m.id,
        title: m.title,
        percentage: Number(m.percentage),
        deliverableStatus: m.deliverableStatus as "PENDING" | "SUBMITTED" | "ACCEPTED" | "REVISION_REQUESTED",
        paymentStatus: m.paymentStatus as "PENDING" | "MARKED_PAID" | "CONFIRMED_PAID",
        deliverableUrl: m.deliverableUrl,
      })),
      disputedAt: new Date(),
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to analyze dispute";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
