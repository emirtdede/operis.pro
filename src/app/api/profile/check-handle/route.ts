import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { RESERVED_HANDLES } from "@/src/modules/auth/validation";
import { getDb, schema } from "@/src/lib/db";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawHandle = searchParams.get("handle");
  const locale = req.headers.get("x-locale") || "tr";
  const isTr = locale === "tr";

  if (!rawHandle) {
    return NextResponse.json(
      {
        available: false,
        reason: "empty",
        message: isTr ? "Kullanıcı adı boş olamaz." : "Handle cannot be empty.",
      },
      { status: 400 }
    );
  }

  const handle = rawHandle.toLowerCase().trim();

  // Length check (3-30)
  if (handle.length < 3 || handle.length > 30) {
    return NextResponse.json({
      available: false,
      reason: "length",
      message: isTr
        ? "Kullanıcı adı 3 ile 30 karakter arasında olmalıdır."
        : "Handle must be between 3 and 30 characters.",
    });
  }

  // Format check
  if (!/^[a-z0-9_-]+$/.test(handle)) {
    return NextResponse.json({
      available: false,
      reason: "format",
      message: isTr
        ? "Yalnızca küçük harfler, rakamlar, tire ve alt çizgi kullanılabilir."
        : "Only lowercase letters, numbers, hyphens, and underscores are allowed.",
    });
  }

  // Reserved handles check
  if (RESERVED_HANDLES.has(handle)) {
    return NextResponse.json({
      available: false,
      reason: "reserved",
      message: isTr
        ? "Bu kullanıcı adı sistem tarafından ayrılmıştır."
        : "This handle is reserved by the system.",
    });
  }

  // Database uniqueness check
  try {
    const session = await getSession();
    const db = getDb();
    const [existing] = await db
      .select({ userId: schema.profiles.userId })
      .from(schema.profiles)
      .where(eq(schema.profiles.handle, handle))
      .limit(1);

    if (existing) {
      if (session?.userId && existing.userId === session.userId) {
        return NextResponse.json({
          available: true,
          isCurrent: true,
          message: isTr
            ? "Bu sizin mevcut kullanıcı adınız."
            : "This is your current handle.",
        });
      }
      return NextResponse.json({
        available: false,
        reason: "taken",
        message: isTr
          ? "Bu kullanıcı adı başka bir kullanıcı tarafından alınmış."
          : "This handle is already taken.",
      });
    }

    return NextResponse.json({
      available: true,
      message: isTr
        ? "Bu kullanıcı adı kullanılabilir!"
        : "This handle is available!",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        available: false,
        reason: "error",
        message: isTr ? "Kontrol edilirken hata oluştu." : "Failed to check handle.",
      },
      { status: 500 }
    );
  }
}
