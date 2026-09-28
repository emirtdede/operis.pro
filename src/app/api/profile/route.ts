import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { ProfileService } from "@/src/modules/profiles/service";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";
import { SecurityAuditService } from "@/src/modules/security/audit-service";

export async function GET(req: Request) {
  const locale = req.headers.get("x-locale") || "tr";
  const isEn = locale === "en";

  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized" : "Yetkisiz erişim" },
        { status: 401 }
      );
    }

    const profile = await ProfileService.getProfileByUserId(session.userId);
    return NextResponse.json({ profile }, { status: 200 });
  } catch (err: unknown) {
    console.error("[Profile API GET Error]:", err);
    return NextResponse.json(
      { error: isEn ? "Failed to get profile" : "Profil bilgileri alınamadı" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const headerLocale = req.headers.get("x-locale");

  try {
    const session = await getSession();
    const body = await req.json();
    const locale = headerLocale || body.locale || "tr";
    const isEn = locale === "en";

    if (!session?.userId) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized" : "Yetkisiz erişim" },
        { status: 401 }
      );
    }

    const ip = getClientIp(req);
    const access = await evaluateSecurityAccessAsync({
      ip,
      purpose: "profile:update",
      subject: `${session.userId}:${normalizeIp(ip)}`,
      limit: 30,
      windowMs: 60 * 1000,
      isEn,
    });
    if (!access.allowed) {
      return access.response;
    }

    await ProfileService.updateProfile(session.userId, body);

    // Determine eventType for audit log
    let eventType:
      "HANDLE_CHANGED" | "AVAILABILITY_CHANGED" | "PREFERENCES_UPDATED" | "PROFILE_UPDATED" =
      "PROFILE_UPDATED";
    if (body.handle) {
      eventType = "HANDLE_CHANGED";
    } else if (
      body.availabilityStatus ||
      body.availabilityHoursPerWeek !== undefined ||
      body.availableFromDate !== undefined
    ) {
      eventType = "AVAILABILITY_CHANGED";
    } else if (body.theme || body.preferredContactChannel || body.timeZone) {
      eventType = "PREFERENCES_UPDATED";
    }

    // Log account-specific audit event (B23)
    await SecurityAuditService.logEvent({
      userId: session.userId,
      eventType,
      ipAddress: ip,
      userAgent: req.headers.get("user-agent"),
      riskMetadata: {
        keys: Object.keys(body),
        handle: body.handle || undefined,
        availabilityStatus: body.availabilityStatus || undefined,
      },
    });

    // Revalidate public profile and settings paths for instant reflection
    try {
      const { revalidatePath } = await import("next/cache");
      const currentProfile = await ProfileService.getProfileByUserId(session.userId);
      const effectiveHandle = body.handle || currentProfile?.handle;
      if (effectiveHandle) {
        revalidatePath(`/tr/u/${effectiveHandle}`);
        revalidatePath(`/en/u/${effectiveHandle}`);
      }
      if (body.handle && currentProfile?.handle && body.handle !== currentProfile.handle) {
        revalidatePath(`/tr/u/${currentProfile.handle}`);
        revalidatePath(`/en/u/${currentProfile.handle}`);
      }
      revalidatePath("/tr/settings");
      revalidatePath("/en/settings");
      revalidatePath("/tr/ayarlar");
      revalidatePath("/en/settings");
      revalidatePath("/tr/ilanlar");
      revalidatePath("/en/listings");
      revalidatePath("/tr/feed");
      revalidatePath("/en/feed");
      revalidatePath("/tr");
      revalidatePath("/en");
    } catch {
      // Non-fatal cache revalidation
    }

    return NextResponse.json(
      {
        success: true,
        message: isEn ? "Profile updated successfully." : "Profil bilgileri güncellendi.",
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const locale = headerLocale || "tr";
    const isEn = locale === "en";

    const KNOWN_VALIDATION_MESSAGES: Record<string, { en: string; tr: string }> = {
      "Display name must be 2-80 characters": {
        en: "Display name must be 2-80 characters and not contain emojis.",
        tr: "Görünen ad 2-80 karakter arasında olmalı ve emoji içermemelidir.",
      },
      "Display name contains inappropriate": {
        en: "Display name contains inappropriate content.",
        tr: "Görünen ad uygunsuz veya yasaklı içerik barındıramaz.",
      },
      "Invalid or reserved handle": {
        en: "Invalid or reserved handle.",
        tr: "Geçersiz veya sistem tarafından ayrılmış kullanıcı adı.",
      },
      "This handle is already taken": {
        en: "This handle is already taken.",
        tr: "Bu kullanıcı adı zaten başka bir kullanıcı tarafından alınmış.",
      },
      "About text cannot exceed 1000 characters": {
        en: "About text cannot exceed 1000 characters and cannot contain emojis.",
        tr: "Hakkında metni 1000 karakteri geçemez ve emoji içeremez.",
      },
      "About text contains inappropriate": {
        en: "About text contains inappropriate content.",
        tr: "Hakkında metni uygunsuz veya yasaklı içerik barındıramaz.",
      },
      "Avatar URL cannot exceed 2000 characters": {
        en: "Avatar URL cannot exceed 2000 characters.",
        tr: "Profil resmi bağlantısı 2000 karakteri geçemez.",
      },
      "Invalid profile picture URL": {
        en: "Invalid profile picture URL. Please enter a valid HTTPS address.",
        tr: "Geçersiz profil resmi bağlantısı. Geçerli bir HTTPS adresi giriniz.",
      },
    };

    if (err instanceof Error) {
      for (const [key, localized] of Object.entries(KNOWN_VALIDATION_MESSAGES)) {
        if (err.message.includes(key)) {
          return NextResponse.json({ error: isEn ? localized.en : localized.tr }, { status: 400 });
        }
      }
    }

    console.error("[Profile API PATCH Error] Internal error:", err);
    return NextResponse.json(
      {
        error: isEn
          ? "An unexpected error occurred while updating profile."
          : "Profil güncellenirken beklenmeyen bir hata oluştu.",
      },
      { status: 500 }
    );
  }
}
