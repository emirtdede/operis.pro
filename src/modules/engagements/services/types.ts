import { schema } from "@/src/lib/db";
import { DEFAULT_USER } from "@/src/modules/auth/demo-user";

export interface CounterpartyContactInfo {
  userId: string;
  handle: string;
  displayName: string;
  email: string;
  phone: string | null;
  preferredContactChannel?: string | null;
  timeZone?: string | null;
  city?: string | null;
}

export function getDemoEngagement(
  viewerUserId: string,
  requestedEngagementId: string = "eng-demo-101"
) {
  const isFreelancer = viewerUserId === "u-techcorp-1";
  const ownerUserId = isFreelancer ? DEFAULT_USER.id : viewerUserId;
  const freelancerUserId = isFreelancer ? viewerUserId : "u-techcorp-1";
  const isOwner = !isFreelancer;
  return {
    engagement: {
      id: requestedEngagementId,
      listingId: "sample-listing-001",
      acceptedOfferId: "offer-demo-101",
      ownerUserId,
      freelancerUserId,
      status: "COMPLETED",
      listingTitleSnapshot: "Next.js Kurumsal SaaS Mimarisi & API Entegrasyonu",
      matchedAt: new Date("2026-08-01T10:00:00Z"),
      completedAt: new Date("2026-08-15T14:30:00Z"),
      createdAt: new Date("2026-08-01T10:00:00Z"),
      updatedAt: new Date("2026-08-15T14:30:00Z"),
    } as unknown as typeof schema.engagements.$inferSelect,
    listing: {
      id: "sample-listing-001",
      slug: "nextjs-ve-tailwind-ile-modern-e-ticaret-arayuzu-gelistirilmesi-a1b2c3",
      title: "Next.js Kurumsal SaaS Mimarisi & API Entegrasyonu",
      summary: "Operis platformu için yüksek performanslı ve güvenli modern mimari geliştirilecek.",
      scope:
        "Next.js 15 App Router, Tailwind CSS ve TypeScript kullanılarak modern bir arayüz ve API motoru kodlanacaktır.",
      budgetMode: "FIXED_RANGE",
      budgetCurrency: "TRY",
      budgetMin: "35000",
      budgetMax: "50000",
      status: "COMPLETED",
    } as unknown as typeof schema.listings.$inferSelect,
    acceptedOffer: {
      id: "offer-demo-101",
      listingId: "sample-listing-001",
      offerorUserId: "u-techcorp-1",
      message: "Deneyimli ekibimizle projeyi taahhüt edilen sürede teslim etmeye hazırız.",
      budgetMin: "40000",
      budgetMax: "45000",
      budgetCurrency: "TRY",
      estimatedDurationValue: 2,
      estimatedDurationUnit: "WEEKS",
      status: "ACCEPTED",
      createdAt: new Date("2026-08-01T12:00:00Z"),
    } as unknown as typeof schema.offers.$inferSelect,
    counterpartyContact: isOwner
      ? {
          userId: "u-techcorp-1",
          handle: "ahmetyilmaz",
          displayName: "Ahmet Yılmaz",
          email: "ahmet@techcorp.com",
          phone: "+905321112233",
          preferredContactChannel: "whatsapp",
          timeZone: "Europe/Istanbul",
          city: "İstanbul",
        }
      : {
          userId: DEFAULT_USER.id,
          handle: DEFAULT_USER.profile.handle,
          displayName: DEFAULT_USER.profile.displayName,
          email: DEFAULT_USER.email,
          phone: "+905329998877",
          preferredContactChannel: DEFAULT_USER.profile.preferredContactChannel || "whatsapp",
          timeZone: DEFAULT_USER.profile.timeZone || "Europe/Istanbul",
          city: "İstanbul",
        },
    completionMarks: [
      {
        id: "mark-1",
        engagementId: "eng-demo-101",
        userId: DEFAULT_USER.id,
        status: "MARKED_COMPLETE",
        createdAt: new Date("2026-08-15T14:00:00Z"),
      },
      {
        id: "mark-2",
        engagementId: "eng-demo-101",
        userId: "u-techcorp-1",
        status: "MARKED_COMPLETE",
        createdAt: new Date("2026-08-15T14:30:00Z"),
      },
    ] as unknown as Array<typeof schema.engagementCompletionMarks.$inferSelect>,
    endorsements: [
      {
        id: "endorsement-demo-1",
        engagementId: "eng-demo-101",
        authorUserId: "u-techcorp-1",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ] as unknown as Array<typeof schema.endorsements.$inferSelect>,
  };
}
