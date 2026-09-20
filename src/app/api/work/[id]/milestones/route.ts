import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { MilestoneService, CustomMilestoneInputItem } from "@/src/modules/engagements/milestone-service";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const message = err instanceof Error ? err.message : "Failed to fetch milestones";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: isEn ? "Milestones array is required." : "Geçerli bir kilometre taşı listesi gereklidir." },
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
    const message = err instanceof Error ? err.message : "Failed to update milestone plan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
