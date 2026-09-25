import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { uploadAvatarBuffer, isR2Configured } from "@/src/modules/storage/r2-client";
import { ProfileService } from "@/src/modules/profiles/service";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";
import sharp from "sharp";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const locale = req.headers.get("x-locale") || "tr";
  const isEn = locale === "en";

  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized. Please log in." : "Yetkisiz erişim. Lütfen giriş yapın." },
        { status: 401 }
      );
    }

    // Rate limiting: 10 uploads per minute
    const clientIp = normalizeIp(getClientIp(req));
    const access = await evaluateSecurityAccessAsync({
      ip: clientIp,
      purpose: "avatar:upload",
      subject: `${session.userId}:${clientIp}`,
      limit: 10,
      windowMs: 60 * 1000,
      isEn,
    });
    if (!access.allowed) {
      return access.response;
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: isEn ? "Please select a valid image file." : "Lütfen geçerli bir görsel dosyası seçin." },
        { status: 400 }
      );
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: isEn
            ? "File size exceeds the 5MB limit."
            : "Dosya boyutu 5 MB sınırını aşıyor.",
        },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        {
          error: isEn
            ? "Only image files (JPEG, PNG, WebP, AVIF, HEIC) are accepted."
            : "Yalnızca görsel dosyaları (JPEG, PNG, WebP, AVIF, HEIC) kabul edilmektedir.",
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Optimize and convert to WebP format using Sharp
    // Resize to max 512x512, 85% WebP quality, strip metadata
    const webpBuffer = await sharp(inputBuffer)
      .rotate() // auto-orient based on EXIF
      .resize(512, 512, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: 85, effort: 4 })
      .toBuffer();

    // Upload to Cloudflare R2 (10 GB free tier) or local public fallback
    const uploadResult = await uploadAvatarBuffer(session.userId, webpBuffer);

    // Save avatarUrl to profile in DB immediately
    await ProfileService.updateProfile(session.userId, {
      avatarUrl: uploadResult.publicUrl,
    });

    return NextResponse.json(
      {
        success: true,
        avatarUrl: uploadResult.publicUrl,
        format: "webp",
        sizeBytes: webpBuffer.length,
        isCloudflareR2: isR2Configured(),
        message: isEn
          ? "Profile picture updated successfully."
          : "Profil fotoğrafı başarıyla güncellendi.",
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("Avatar upload API error:", err);
    let message = isEn
      ? "Failed to process and upload profile image."
      : "Profil fotoğrafı işlenirken ve yüklenirken hata oluştu.";
    if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
