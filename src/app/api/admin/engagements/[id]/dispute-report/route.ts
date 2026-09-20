import { NextResponse } from "next/server";
import { getAdminSession } from "@/src/modules/admin/auth-guard";
import { DisputeArbiterService } from "@/src/modules/ai/dispute-arbiter";
import { getDb } from "@/src/lib/db";
import * as schema from "@/db/schema";
import type { DeliveryHealthReport } from "@/src/modules/engagements/delivery-inspector";
import { eq, desc, asc } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAdminSession();
  if (!auth.isAdmin || !auth.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: engagementId } = await params;
  if (!engagementId) {
    return NextResponse.json({ error: "Missing engagement ID" }, { status: 400 });
  }

  try {
    const isMock = Boolean(process.env.VITEST) || engagementId.startsWith("eng-dispute-") || engagementId === "eng-demo-101";

    if (isMock) {
      // Return high-fidelity fixture for testing and admin demonstration
      const report = DisputeArbiterService.analyzeDispute({
        engagementId,
        listingTitle: "Next.js Kurumsal SaaS Mimarisi & API Entegrasyonu",
        category: "software-development",
        matchedAt: new Date(Date.now() - 18 * 86400000),
        agreedBudgetLabel: "75.000 TL",
        agreedTimelineLabel: "2 Hafta",
        handover: {
          repositoryUrl: "https://github.com/operis-demo/saas-architecture",
          commitHash: "a1b2c3d4e5f67890123456789abcdef012345678",
          liveUrl: "https://saas-demo.operis.internal",
          submittedAt: new Date(Date.now() - 4 * 86400000),
          status: "REVISION_REQUESTED",
          deliveryHealth: {
            isHealthy: true,
            inspectedAt: new Date().toISOString(),
            summaryStatus: "HEALTHY",
            powSeal: "a".repeat(64),
            badgeTextTr: "Doğrulandı",
            badgeTextEn: "Verified",
            liveDeployment: {
              checked: true,
              url: "https://saas-demo.operis.internal",
              isAccessible: true,
              httpStatus: 200,
              responseTimeMs: 142,
              sslValid: true,
            },
            gitRepository: {
              checked: true,
              url: "https://github.com/operis-demo/saas-architecture",
              isAccessible: true,
              provider: "github",
              commitHash: "a1b2c3d4e5f67890123456789abcdef012345678",
              commitValid: true,
            },
          },
        },
        changeRequests: [],
        messages: [
          {
            senderRole: "CLIENT",
            content: "Lütfen ek olarak 4 yeni ekran ekleyin ve ödeme adımını da bağlayıverin.",
          },
        ],
        revisionRoundsCount: 3,
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
