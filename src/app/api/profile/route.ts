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
    let message = isEn ? "Failed to get profile" : "Profil bilgileri alınamadı";
    if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
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
    let eventType: "HANDLE_CHANGED" | "AVAILABILITY_CHANGED" | "PREFERENCES_UPDATED" | "PROFILE_UPDATED" = "PROFILE_UPDATED";
    if (body.handle) {
      eventType = "HANDLE_CHANGED";
    } else if (body.availabilityStatus || body.availabilityHoursPerWeek !== undefined || body.availableFromDate !== undefined) {
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
    let message = isEn ? "Failed to update profile" : "Güncelleme başarısız oldu";
    if (err instanceof Error) {
      message = err.message;
    }

    if (!isEn) {
      if (message.includes("Display name must be 2-80 characters")) {
        message = "Görünen ad 2-80 karakter arasında olmalı ve emoji içermemelidir.";
      } else if (message.includes("Display name contains inappropriate")) {
        message = "Görünen ad uygunsuz veya yasaklı içerik barındıramaz.";
      } else if (message.includes("Invalid or reserved handle")) {
        message = "Geçersiz veya sistem tarafından ayrılmış kullanıcı adı.";
      } else if (message.includes("This handle is already taken")) {
        message = "Bu kullanıcı adı zaten başka bir kullanıcı tarafından alınmış.";
      } else if (message.includes("About text cannot exceed 1000 characters")) {
        message = "Hakkında metni 1000 karakteri geçemez ve emoji içeremez.";
      } else if (message.includes("About text contains inappropriate")) {
        message = "Hakkında metni uygunsuz veya yasaklı içerik barındıramaz.";
      } else if (message.includes("Avatar URL cannot exceed 2000 characters")) {
        message = "Profil resmi bağlantısı 2000 karakteri geçemez.";
      } else if (message.includes("Invalid profile picture URL")) {
        message = "Geçersiz profil resmi bağlantısı. Geçerli bir HTTPS adresi giriniz.";
      }
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
