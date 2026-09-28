import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import {
  MilestoneService,
  CustomMilestoneInputItem,
} from "@/src/modules/engagements/milestone-service";
import { handleApiError } from "@/src/lib/api/error-response";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const isEn = req.headers.get("x-locale") === "en";
  const ip = getClientIp(req);

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "work:milestones:get",
    subject: normalizeIp(ip),
    limit: 120,
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
    const plan = await MilestoneService.getMilestones(engagementId, session.userId);

    return NextResponse.json({ success: true, ...plan });
  } catch (err: unknown) {
    return handleApiError(
      err,
      {
        en: "Failed to fetch milestones",
        tr: "Aşama planı alınamadı",
      },
      {
        isEn,
        logPrefix: "[Milestones GET Error]",
        status: 500,
        allowedMessages: {
          Yetkisiz: { en: "Unauthorized", tr: "Yetkisiz erişim", status: 403 },
          "Güvenlik ihlali": { en: "Security violation", tr: "Güvenlik ihlali", status: 403 },
          bulunamadı: { en: "Milestone plan not found", tr: "Aşama planı bulunamadı", status: 404 },
        },
      }
    );
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const isEn = req.headers.get("x-locale") === "en";
  const ip = getClientIp(req);

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "work:milestones:post",
    subject: normalizeIp(ip),
    limit: 60,
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
    const body = await req.json();

    const items: CustomMilestoneInputItem[] = body.milestones;
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          error: isEn
            ? "Milestones array is required."
            : "Geçerli bir kilometre taşı listesi gereklidir.",
        },
        { status: 400 }
      );
    }

    const result = await MilestoneService.updateMilestonePlan(
      engagementId,
      items,
      session.userId,
      ip
    );

    return NextResponse.json({
      success: true,
      milestones: result.milestones,
      message: isEn ? result.messageEn : result.messageTr,
    });
  } catch (err: unknown) {
    return handleApiError(
      err,
      {
        en: "Failed to update milestone plan",
        tr: "Aşama planı güncellenemedi",
      },
      {
        isEn,
        logPrefix: "[Milestones POST Error]",
        status: 500,
        allowedMessages: {
          Yetkisiz: { en: "Unauthorized", tr: "Yetkisiz erişim", status: 403 },
          "Güvenlik ihlali": { en: "Security violation", tr: "Güvenlik ihlali", status: 403 },
          bulunamadı: { en: "Milestone plan not found", tr: "Aşama planı bulunamadı", status: 404 },
          "Toplam hakediş yüzdesi": {
            en: "Total milestone percentage must equal 100%.",
            tr: "Toplam hakediş yüzdesi tam olarak %100 olmalıdır.",
            status: 400,
          },
          "En az 1 adet": {
            en: "At least 1 milestone must be defined.",
            tr: "En az 1 adet kilometre taşı tanımlanmalıdır.",
            status: 400,
          },
          "Ödemesi yapılmış": {
            en: "Cannot reorganize milestone plan when payments are already marked or confirmed.",
            tr: "Ödemesi yapılmış veya teyit edilmiş hakedişler varken hakediş planı yeniden düzenlenemez.",
            status: 400,
          },
        },
      }
    );
  }
}
