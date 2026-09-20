import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/src/modules/auth/session";
import { OfferService } from "@/src/modules/offers/service";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale") || (req.headers.get("x-locale") === "en" ? "en" : "tr");
  const isEn = locale === "en";

  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        {
          error: isEn
            ? "Sign in to view your templates."
            : "Şablonlarınızı görebilmek için oturum açın.",
        },
        { status: 401 }
      );
    }

    const templates = await OfferService.getUserOfferTemplates(session.userId);
    return NextResponse.json({ templates }, { status: 200 });
  } catch (err: unknown) {
    let message = isEn
      ? "Failed to fetch templates."
      : "Şablonlar yüklenirken bir sorun oluştu.";
    if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const headerLocale = req.headers.get("x-locale");
  let isEn = headerLocale === "en";

  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: isEn ? "Sign in to save templates." : "Şablon kaydedebilmek için oturum açın." },
        { status: 401 }
      );
    }

    const access = await evaluateSecurityAccessAsync({
      ip,
      purpose: "offer:templates",
      subject: `${session.userId}:${normalizeIp(ip)}`,
      limit: 30,
      windowMs: 60 * 1000,
      isEn,
    });
    if (!access.allowed) {
      return access.response;
    }

    const body = await req.json();
    if (body?.locale === "en") isEn = true;
    const template = await OfferService.saveOfferTemplateAsync(session.userId, body);

    return NextResponse.json({ success: true, template }, { status: 200 });
  } catch (err: unknown) {
    let message = isEn ? "Failed to save template." : "Şablon kaydedilemedi.";

    if (err instanceof z.ZodError) {
      const rawMsg = err.issues[0]?.message || "";
      if (isEn) {
        if (rawMsg.includes("en az 2")) {
          message = "Template name must be at least 2 characters.";
        } else if (rawMsg.includes("en az 50")) {
          message = "Template message must be at least 50 characters.";
        } else if (rawMsg.includes("uygunsuz")) {
          message = "Template content contains prohibited or inappropriate language.";
        } else if (rawMsg.includes("Emojis are strictly prohibited")) {
          message = "Template cannot contain emojis. Please use plain text.";
        } else {
          message = rawMsg || "Invalid template format.";
        }
      } else {
        if (rawMsg.includes("Emojis are strictly prohibited")) {
          message = "Şablon emoji içeremez. Lütfen profesyonel metin kullanınız.";
        } else if (rawMsg.includes("Invalid budget format")) {
          message = "Geçersiz bütçe formatı.";
        } else if (rawMsg.includes("Minimum budget cannot exceed")) {
          message = "Minimum bütçe, maksimum bütçeden büyük olamaz.";
        } else {
          message = rawMsg || "Geçersiz şablon formatı.";
        }
      }
    } else if (err instanceof Error) {
      message = err.message;
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const isEn = req.headers.get("x-locale") === "en" || searchParams.get("locale") === "en";
  const ip = getClientIp(req);

  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: isEn ? "Sign in to delete templates." : "Şablon silebilmek için oturum açın." },
        { status: 401 }
      );
    }

    const access = await evaluateSecurityAccessAsync({
      ip,
      purpose: "offer:templates:del",
      subject: `${session.userId}:${normalizeIp(ip)}`,
      limit: 30,
      windowMs: 60 * 1000,
      isEn,
    });
    if (!access.allowed) {
      return access.response;
    }

    let templateId = searchParams.get("id");
    if (!templateId) {
      try {
        const body = await req.json();
        if (body && typeof body.id === "string") {
          templateId = body.id;
        }
      } catch {
        // No json body provided
      }
    }

    if (!templateId) {
      return NextResponse.json(
        { error: isEn ? "Invalid template ID." : "Geçersiz şablon ID." },
        { status: 400 }
      );
    }

    const deleted = await OfferService.deleteOfferTemplateAsync(session.userId, templateId);
    if (!deleted) {
      return NextResponse.json(
        { error: isEn ? "Template not found." : "Şablon bulunamadı." },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    let message = isEn
      ? "Failed to delete template."
      : "Şablon silinemedi.";
    if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
