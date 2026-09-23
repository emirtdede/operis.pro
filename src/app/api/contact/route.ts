import { NextResponse } from "next/server";
import { z } from "zod";
import { EmailAdapter } from "@/src/lib/email";
import { getDb, schema } from "@/src/lib/db";
import { EMOJI_REGEX, validateContentAppropriateness } from "@/src/lib/security/content-moderator";
import { evaluateSecurityAccessAsync, getClientIp } from "@/src/lib/security/rate-limit";
import { verifyTurnstileToken } from "@/src/lib/security/turnstile";

const createContactSchema = (isEn: boolean) =>
  z.object({
    name: z
      .string()
      .min(2, isEn ? "Please enter your full name." : "Lütfen adınızı ve soyadınızı giriniz.")
      .refine(
        (val) => !EMOJI_REGEX.test(val),
        isEn ? "Name cannot contain emojis." : "İsim alanı emoji içeremez."
      ),
    email: z
      .string()
      .email(isEn ? "Please enter a valid email address." : "Geçerli bir e-posta adresi giriniz."),
    subject: z
      .string()
      .min(3, isEn ? "Please specify a subject." : "Lütfen bir konu belirtiniz.")
      .refine(
        (val) => !EMOJI_REGEX.test(val),
        isEn ? "Subject cannot contain emojis." : "Konu alanı emoji içeremez."
      )
      .refine(
        (val) => validateContentAppropriateness(val).isValid,
        isEn ? "Subject contains inappropriate content." : "Konu uygunsuz ifadeler içeremez."
      ),
    message: z
      .string()
      .min(
        10,
        isEn
          ? "Please enter at least 10 characters."
          : "Lütfen en az 10 karakterlik bir mesaj yazınız."
      )
      .refine(
        (val) => !EMOJI_REGEX.test(val),
        isEn ? "Message cannot contain emojis." : "Mesaj alanı emoji içeremez."
      )
      .refine(
        (val) => validateContentAppropriateness(val).isValid,
        isEn
          ? "Message violates community guidelines."
          : "Mesajınız topluluk kurallarımıza aykırı ifadeler içeremez."
      ),
    locale: z.enum(["tr", "en"]).optional().default("tr"),
    attachmentName: z.string().max(255).optional(),
    attachmentSize: z.string().max(50).optional(),
  });

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const headerLocale = req.headers.get("x-locale");
  const isEnHeader = headerLocale === "en";

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "contact",
    limit: 5,
    windowMs: 10 * 60 * 1000,
    isEn: isEnHeader,
  });
  if (!access.allowed) {
    return access.response;
  }

  let isEn = isEnHeader;
  try {
    const body = await req.json();

    // Verify Cloudflare Turnstile token (fail-open in dev/testing)
    const turnstileResult = await verifyTurnstileToken(body?.turnstileToken, ip);
    if (!turnstileResult.success) {
      return NextResponse.json(
        {
          error:
            turnstileResult.error ||
            (isEnHeader
              ? "Bot verification failed. Please refresh."
              : "Bot doğrulaması başarısız oldu. Lütfen yenileyiniz."),
        },
        { status: 403 }
      );
    }

    isEn = body?.locale === "en" || isEnHeader;
    const { name, email, subject, message: rawText, attachmentName, attachmentSize } = createContactSchema(isEn).parse(body);

    let attachmentNote = "";
    if (attachmentName) {
      const cleanName = attachmentName.replace(/[\r\n]+/g, " ").trim();
      const defaultSize = isEn ? "Verified < 5 MB" : "Doğrulandı < 5 MB";
      const cleanSize = (attachmentSize || defaultSize).replace(/[\r\n]+/g, " ").trim();
      attachmentNote = isEn
        ? `\n\n[Attachment]: ${cleanName} (${cleanSize})`
        : `\n\n[Ek Dosya]: ${cleanName} (${cleanSize})`;
    }
    const text = rawText + attachmentNote;

    try {
      const db = getDb();
      await db.insert(schema.contactMessages).values({
        name,
        email,
        subject,
        message: text,
        locale: isEn ? "en" : "tr",
        ipAddress: ip,
        status: "NEW",
      });
    } catch (dbErr: unknown) {
      console.error("[Contact API] Database persistence error (non-blocking):", dbErr);
    }

    const supportEmail = process.env.LEGAL_SUPPORT_EMAIL || "support@vellium.dev";
    const sent = await EmailAdapter.sendTransactionalEmail({
      to: supportEmail,
      replyTo: email,
      subject: isEn
        ? `[Contact Form] ${subject} - ${name}`
        : `[İletişim Formu] ${subject} - ${name}`,
      body: isEn
        ? `Sender: ${name} (${email})\nSubject: ${subject}\n\nMessage:\n${text}`
        : `Gönderen: ${name} (${email})\nKonu: ${subject}\n\nMesaj:\n${text}`,
      template: "contact_form",
      locale: isEn ? "en" : "tr",
    });

    if (!sent && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          error: isEn
            ? "Failed to deliver message to support email service. Please try again later."
            : "Mesaj destek e-posta servisine iletilemedi. Lütfen daha sonra tekrar deneyiniz.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: isEn
          ? "Your message has been successfully delivered to Operis support. We will respond shortly."
          : "Mesajınız Operis destek ekibine başarıyla iletildi. En kısa sürede yanıtlanacaktır.",
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      const validationMessage =
        err.issues[0]?.message ||
        (isEn
          ? "Please fill in all form fields correctly."
          : "Lütfen form alanlarını eksiksiz doldurunuz.");
      return NextResponse.json({ error: validationMessage }, { status: 400 });
    }

    console.error("[Contact API] Unexpected error processing request:", err);
    const errorMessage = isEn ? "Failed to send message." : "Mesaj gönderilemedi.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
