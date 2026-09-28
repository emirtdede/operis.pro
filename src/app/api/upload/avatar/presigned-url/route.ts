import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const isEn = req.headers.get("x-locale") === "en";
  return NextResponse.json(
    {
      error: isEn
        ? "Direct presigned avatar upload has been disabled for security hardening. Please use /api/upload/avatar."
        : "Güvenlik sertleştirmesi kapsamında doğrudan presigned avatar yüklemesi kapatılmıştır. Lütfen /api/upload/avatar kullanınız.",
    },
    { status: 410 }
  );
}
