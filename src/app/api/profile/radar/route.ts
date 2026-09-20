import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { ProfileService } from "@/src/modules/profiles/service";
import { EMOJI_REGEX, validateContentAppropriateness } from "@/src/lib/security/content-moderator";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function GET(req: Request) {
  const locale = req.headers.get("x-locale") || "tr";
  const isEn = locale === "en";

  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized" : "Yetkisiz erişim" },
        { status: 401 }
      );
    }

    const profile = await ProfileService.getProfileByUserId(session.userId);
    return NextResponse.json({
      trackedSkills: profile?.trackedSkills ?? [],
    });
  } catch (err: unknown) {
    let message = isEn ? "Failed to fetch radar skills" : "Radar teknolojileri alınamadı";
    if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const headerLocale = req.headers.get("x-locale");
  const isEnHeader = headerLocale === "en";

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "profile:radar",
    subject: normalizeIp(ip),
    limit: 20,
    windowMs: 60 * 1000,
    isEn: isEnHeader,
  });
  if (!access.allowed) {
    return access.response;
  }

  try {
    const session = await getSession();
    const body = await req.json();
    const locale = headerLocale || body.locale || "tr";
    const isEn = locale === "en";

    if (!session) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized" : "Yetkisiz erişim" },
        { status: 401 }
      );
    }

    if (!body || !Array.isArray(body.skills)) {
      return NextResponse.json(
        {
          error: isEn
            ? "A valid list of technologies must be provided."
            : "Geçerli bir teknoloji listesi gönderilmelidir.",
        },
        { status: 400 }
      );
    }

    const sanitizedSkills = body.skills
      .filter((s: unknown): s is string => typeof s === "string")
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0 && s.length <= 40 && !EMOJI_REGEX.test(s));

    if (sanitizedSkills.length > 5) {
      return NextResponse.json(
        {
          error: isEn
            ? "You can add up to 5 technologies to your radar."
            : "En fazla 5 teknoloji radara eklenebilir.",
        },
        { status: 400 }
      );
    }

    const hasInappropriateSkill = sanitizedSkills.some(
      (s: string) => !validateContentAppropriateness(s).isValid
    );
    if (hasInappropriateSkill) {
      return NextResponse.json(
        {
          error: isEn
            ? "Radar technology keywords contain inappropriate or prohibited language."
            : "Radar teknolojisi uygunsuz veya yasaklı ifadeler içeremez.",
        },
        { status: 400 }
      );
    }

    await ProfileService.updateProfile(session.userId, {
      trackedSkills: sanitizedSkills,
    });

    const updatedProfile = await ProfileService.getProfileByUserId(session.userId);

    return NextResponse.json({
      success: true,
      trackedSkills: updatedProfile?.trackedSkills ?? [],
    });
  } catch (err: unknown) {
    const isEn = headerLocale === "en";
    let message = isEn ? "Could not update radar" : "Radar güncellenemedi";
    if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
