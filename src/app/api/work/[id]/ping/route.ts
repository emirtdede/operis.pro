import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { EngagementService } from "@/src/modules/engagements/service";
import { NotificationService } from "@/src/modules/notifications/service";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

// 15-minute cooldown per sender & engagement to prevent spam
const PING_COOLDOWN_MS = 15 * 60 * 1000;
const lastPingCache = new Map<string, number>();

const STANDARD_PING_TEMPLATES = {
  whatsapp: {
    tr: "WhatsApp üzerinden mesaj ilettim, müsait olduğunuzda kontrol edebilir misiniz?",
    en: "I sent a message on WhatsApp. Please review whenever you're available.",
  },
  meeting: {
    tr: "Toplantı daveti (Meet / Zoom) gönderdim, uygunluk durumunuzu bekliyorum.",
    en: "I scheduled a meeting invite (Meet / Zoom). Looking forward to your availability.",
  },
  email: {
    tr: "Kurumsal e-posta ile proje başlangıç notlarını ve detayları paylaştım.",
    en: "I sent kickoff notes and project specifications to your verified email.",
  },
  ready: {
    tr: "Proje başlangıcı ve sonraki adımlar için görüşmeye hazırım.",
    en: "Ready to kickoff and coordinate the next project delivery milestones.",
  },
} as const;

type PingTemplateKey = keyof typeof STANDARD_PING_TEMPLATES;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const isEn = req.headers.get("x-locale") === "en";
  const ip = getClientIp(req);

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "work:ping",
    subject: normalizeIp(ip),
    limit: 20,
    windowMs: 60 * 1000,
    isEn,
  });

  if (!access.allowed) {
    return access.response;
  }

  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized. Please sign in." : "Oturum açmanız gerekmektedir." },
        { status: 401 }
      );
    }

    const { id: engagementId } = await params;
    const body = await req.json().catch(() => ({}));
    const templateKey: PingTemplateKey =
      body.templateKey in STANDARD_PING_TEMPLATES ? body.templateKey : "ready";

    // 1. Authorization check: must be a party to this engagement
    const workspace = await EngagementService.getEngagementDetails(session.userId, engagementId);
    if (!workspace || !workspace.counterpartyContact) {
      return NextResponse.json(
        {
          error: isEn
            ? "Project workspace not found or unauthorized."
            : "Çalışma alanı bulunamadı veya yetkisiz erişim.",
        },
        { status: 404 }
      );
    }

    const cacheKey = `${session.userId}:${engagementId}`;
    const lastPingTime = lastPingCache.get(cacheKey) || 0;
    const now = Date.now();
    const elapsed = now - lastPingTime;

    if (elapsed < PING_COOLDOWN_MS && !Boolean(process.env.VITEST)) {
      const remainingSeconds = Math.ceil((PING_COOLDOWN_MS - elapsed) / 1000);
      return NextResponse.json(
        {
          error: isEn
            ? `Please wait ${remainingSeconds}s before sending another ping.`
            : `Yeni bir dürtme göndermeden önce lütfen ${remainingSeconds} saniye bekleyiniz.`,
          cooldownRemainingSeconds: remainingSeconds,
        },
        { status: 429 }
      );
    }

    const counterparty = workspace.counterpartyContact;
    const templateObj = STANDARD_PING_TEMPLATES[templateKey];
    const messageText = isEn ? templateObj.en : templateObj.tr;
    const listingTitle = workspace.listing.title;

    // 2. Queue in-app communication ping notification
    await NotificationService.createNotification(
      counterparty.userId,
      "COMMUNICATION_PING",
      "engagement",
      engagementId,
      {
        senderUserId: session.userId,
        senderDisplayName: workspace.engagement.ownerUserId === session.userId ? "İşveren" : "Yazılımcı",
        engagementId,
        listingTitle,
        templateKey,
        messageText,
        workspacePath: isEn ? `/en/workspace/${engagementId}` : `/tr/calisma-alani/${engagementId}`,
      }
    );

    lastPingCache.set(cacheKey, now);

    return NextResponse.json(
      {
        success: true,
        message: isEn
          ? "Ping notification sent to counterparty."
          : "Karşı tarafa hafif dürtme bildirimi başarıyla iletildi.",
        cooldownRemainingSeconds: Math.ceil(PING_COOLDOWN_MS / 1000),
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    let message = isEn
      ? "Failed to dispatch communication ping."
      : "İletişim bildirimi gönderilemedi.";
    if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
