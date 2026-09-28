import { NextResponse } from "next/server";
import { CategoryBenchmarkService } from "@/src/modules/categories/benchmark-service";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function GET(req: Request) {
  const isEn = req.headers.get("x-locale") === "en";
  const ip = getClientIp(req);

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "categories:benchmark",
    subject: normalizeIp(ip),
    limit: 120,
    windowMs: 60 * 1000,
    isEn,
  });

  if (!access.allowed) {
    return access.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId") || undefined;
    const categorySlug = searchParams.get("categorySlug") || undefined;
    const currency = searchParams.get("currency") || "TRY";
    const days = Number(searchParams.get("days") || 30);

    const benchmark = await CategoryBenchmarkService.getCategoryMarketBenchmark({
      categoryId,
      categorySlug,
      currency,
      days,
    });

    return NextResponse.json({
      success: true,
      ...benchmark,
    });
  } catch (err: unknown) {
    console.error("Category benchmark error:", err);
    return NextResponse.json(
      {
        error: isEn ? "Failed to load market benchmark" : "Piyasa karşılaştırma verisi yüklenemedi",
      },
      { status: 500 }
    );
  }
}
