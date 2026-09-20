import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import {
  isR2Configured,
  createAvatarPresignedUploadUrl,
} from "@/src/modules/storage/r2-client";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function POST(req: Request) {
  const locale = req.headers.get("x-locale") || "tr";
  const isEn = locale === "en";

  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized" : "Yetkisiz erişim. Lütfen giriş yapın." },
        { status: 401 }
      );
    }

    // Rate limit check
    const clientIp = normalizeIp(getClientIp(req));
    const access = await evaluateSecurityAccessAsync({
      ip: clientIp,
      purpose: "avatar:upload",
      subject: `${session.userId}:${clientIp}`,
      limit: 5,
      windowMs: 60 * 1000,
      isEn,
    });
    if (!access.allowed) {
      return access.response;
    }

    // Check if Cloudflare R2 is configured
    if (!isR2Configured()) {
      return NextResponse.json(
        {
          error: isEn
            ? "Cloudflare R2 storage is not configured. Please contact administrator."
            : "Cloudflare R2 depolama servisi henüz yapılandırılmamış. Lütfen yöneticiyle iletişime geçin.",
          isConfigured: false,
        },
        { status: 503 }
      );
    }

    const presigned = await createAvatarPresignedUploadUrl(session.userId);

    return NextResponse.json(
      {
        success: true,
        ...presigned,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    let message = isEn
      ? "Failed to generate avatar upload URL."
      : "Profil fotoğrafı yükleme bağlantısı oluşturulamadı.";
    if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
