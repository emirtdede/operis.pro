import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/src/modules/auth/session";
import { CategoryService } from "@/src/modules/categories/service";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

const followSchema = z
  .object({
    categoryId: z.string().min(1, "Invalid category ID").optional(),
    categoryIds: z.array(z.string().min(1)).optional(),
    follow: z.boolean().optional(),
    unfollowAll: z.boolean().optional(),
    locale: z.enum(["tr", "en"]).optional(),
  })
  .refine(
    (data) =>
      Boolean(
        data.categoryId ||
          (data.categoryIds && data.categoryIds.length > 0) ||
          data.unfollowAll
      ),
    {
      message: "Either categoryId, categoryIds, or unfollowAll is required.",
    }
  );

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const headerLocale = req.headers.get("x-locale");
  const isEnHeader = headerLocale === "en";

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "cat:follow",
    subject: normalizeIp(ip),
    limit: 30,
    windowMs: 60 * 1000,
    isEn: isEnHeader,
  });
  if (!access.allowed) {
    return access.response;
  }

  let isEn = isEnHeader;
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: isEnHeader ? "Unauthorized. Please sign in." : "Oturum açmanız gerekmektedir." },
        { status: 401 }
      );
    }

    const body = await req.json();
    isEn = body?.locale === "en" || isEnHeader;
    const { categoryId, categoryIds, follow, unfollowAll } = followSchema.parse(body);

    if (unfollowAll) {
      await CategoryService.unfollowAll(session.userId);
      return NextResponse.json({ success: true, count: 0, isFollowed: false }, { status: 200 });
    }

    if (categoryIds && categoryIds.length > 0) {
      if (follow === true) {
        for (const catId of categoryIds) {
          await CategoryService.toggleFollow(session.userId, catId);
        }
        return NextResponse.json(
          { success: true, count: categoryIds.length, isFollowed: true },
          { status: 200 }
        );
      } else {
        const count = await CategoryService.unfollowMultiple(session.userId, categoryIds);
        return NextResponse.json({ success: true, count, isFollowed: false }, { status: 200 });
      }
    }

    if (categoryId) {
      const isFollowed = await CategoryService.toggleFollow(session.userId, categoryId);
      return NextResponse.json({ success: true, isFollowed }, { status: 200 });
    }

    return NextResponse.json({ error: "Missing category identifier" }, { status: 400 });
  } catch (err: unknown) {
    let message = isEn
      ? "Failed to toggle category follow."
      : "Kategori takip durumu değiştirilemedi.";
    if (err instanceof z.ZodError) {
      const fallbackMsg = isEn ? "Invalid category ID." : "Geçersiz kategori kimliği.";
      message = err.issues[0]?.message || fallbackMsg;
    } else if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
