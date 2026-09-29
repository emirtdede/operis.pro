import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Custom file-based avatar uploads are permanently decommissioned.
 * Operis now strictly synchronizes verified Google OAuth profile photos via /api/profile/sync-avatar.
 */
export async function POST(req: Request) {
  const locale = req.headers.get("x-locale") || "tr";
  const isEn = locale === "en";

  return NextResponse.json(
    {
      error: isEn
        ? "Direct avatar file uploads have been disabled. Profile pictures are automatically synchronized from your Google account."
        : "Doğrudan dosya yükleme ile profil fotoğrafı değiştirme kapatılmıştır. Profil fotoğrafları Google hesabınız üzerinden senkronize edilir.",
      code: "UPLOAD_DECOMMISSIONED",
    },
    { status: 410 }
  );
}
