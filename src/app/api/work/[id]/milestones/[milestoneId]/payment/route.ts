import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { MilestoneService } from "@/src/modules/engagements/milestone-service";
import { PaymentHandshakeEngine } from "@/src/modules/engagements/payment-handshake/payment-handshake-engine";
import { handleApiError } from "@/src/lib/api/error-response";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  const isEn = req.headers.get("x-locale") === "en";
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized" : "Yetkisiz erişim" },
        { status: 401 }
      );
    }

    const { id: engagementId, milestoneId } = await params;
    const cert = await MilestoneService.getSettlementCertificate(
      engagementId,
      milestoneId,
      session.userId
    );

    if (!cert) {
      return NextResponse.json(
        {
          error: isEn
            ? "Certificate not found or not yet confirmed"
            : "İtfa belgesi bulunamadı veya henüz teyit edilmedi.",
        },
        { status: 404 }
      );
    }

    const markdown = PaymentHandshakeEngine.formatSettlementCertificateMarkdown(cert);

    return NextResponse.json({
      success: true,
      certificate: cert,
      markdown,
    });
  } catch (err: unknown) {
    return handleApiError(
      err,
      {
        en: "Failed to retrieve certificate",
        tr: "Mutabakat belgesi alınamadı",
      },
      {
        isEn,
        logPrefix: "[Milestone Payment Cert GET Error]",
        status: 500,
        allowedMessages: {
          Yetkisiz: { en: "Unauthorized", tr: "Yetkisiz erişim", status: 403 },
          "Güvenlik ihlali": { en: "Security violation", tr: "Güvenlik ihlali", status: 403 },
          bulunamadı: { en: "Certificate not found", tr: "Belge bulunamadı", status: 404 },
        },
      }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  const isEn = req.headers.get("x-locale") === "en";
  const ip = getClientIp(req);

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "work:milestones:payment:post",
    subject: normalizeIp(ip),
    limit: 60,
    windowMs: 60 * 1000,
    isEn,
  });

  if (!access.allowed) {
    return access.response;
  }

  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized. Please sign in." : "Oturum açmanız gerekmektedir." },
        { status: 401 }
      );
    }

    const { id: engagementId, milestoneId } = await params;
    const body = await req.json();
    const action = body.action || "MARK_PAID";

    if (action === "REVERT_PAID") {
      const result = await MilestoneService.revertPayment(
        engagementId,
        milestoneId,
        session.userId
      );
      return NextResponse.json({
        success: true,
        milestone: result.milestone,
        message: isEn ? "Payment mark reverted to unpaid." : "Ödeme işareti geri alındı.",
      });
    }

    if (action === "CONFIRM_PAID") {
      const result = await MilestoneService.confirmPayment(
        engagementId,
        milestoneId,
        {
          invoiceNumber: body.invoiceNumber,
          clientIp: ip,
        },
        session.userId
      );
      return NextResponse.json({
        success: true,
        milestone: result.milestone,
        message: isEn
          ? "Payment receipt confirmed by freelancer."
          : "Ödeme tahsilatı freelancer tarafından teyit edildi.",
      });
    }

    if (action === "DISPUTE_PAID") {
      if (!body.disputeReason) {
        return NextResponse.json(
          { error: isEn ? "Dispute reason is required." : "İtiraz sebebi belirtilmelidir." },
          { status: 400 }
        );
      }
      const result = await MilestoneService.disputePayment(
        engagementId,
        milestoneId,
        {
          disputeReason: body.disputeReason,
          disputeNote: body.disputeNote || "",
          clientIp: ip,
        },
        session.userId
      );
      return NextResponse.json({
        success: true,
        milestone: result.milestone,
        message: isEn
          ? "Payment disputed. Deliverable obligations paused."
          : "Ödeme transferine itiraz edildi. Teslimat yükümlülüğü durduruldu.",
      });
    }

    // Default: MARK_PAID
    const result = await MilestoneService.markPayment(
      engagementId,
      milestoneId,
      {
        paymentReference: body.paymentReference,
        paymentReceiptUrl: body.paymentReceiptUrl,
        senderBank: body.senderBank,
        transferChannel: body.transferChannel,
        declaredAmount: body.declaredAmount,
        currency: body.currency,
        transferDate: body.transferDate,
        transferTime: body.transferTime,
        senderAccountName: body.senderAccountName,
        notes: body.notes,
        clientIp: ip,
      },
      session.userId
    );

    return NextResponse.json({
      success: true,
      milestone: result.milestone,
      message: isEn
        ? "Payment marked as sent by employer."
        : "Ödeme işveren tarafından yapıldı olarak işaretlendi.",
    });
  } catch (err: unknown) {
    return handleApiError(
      err,
      {
        en: "Failed to process milestone payment",
        tr: "Aşama ödemesi işlenemedi",
      },
      {
        isEn,
        logPrefix: "[Milestone Payment POST Error]",
        status: 500,
        allowedMessages: {
          Yetkisiz: { en: "Unauthorized", tr: "Yetkisiz erişim", status: 403 },
          "Güvenlik ihlali": { en: "Security violation", tr: "Güvenlik ihlali", status: 403 },
          bulunamadı: { en: "Milestone not found", tr: "Aşama bulunamadı", status: 404 },
        },
      }
    );
  }
}
