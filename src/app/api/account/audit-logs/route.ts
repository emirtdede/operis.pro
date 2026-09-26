import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { SecurityAuditService } from "@/src/modules/security/audit-service";
import { evaluateSecurityAccessAsync, getClientIp } from "@/src/lib/security/rate-limit";

export async function GET(req: Request) {
  const headerLocale = req.headers.get("x-locale");
  const isEn = headerLocale === "en";
  const ip = getClientIp(req);

  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized" : "Yetkisiz erişim" },
        { status: 401 }
      );
    }

    const access = await evaluateSecurityAccessAsync({
      ip,
      purpose: "account:audit-logs",
      subject: session.userId,
      limit: 60,
      windowMs: 60 * 1000,
      isEn,
    });
    if (!access.allowed) {
      return access.response;
    }

    const rawLogs = await SecurityAuditService.getUserAuditLogs(session.userId, 15);

    // Human-readable labels for events
    const logs = rawLogs.map((log) => {
      let labelTr: string;
      let labelEn: string;

      switch (log.eventType) {
        case "LOGIN_SUCCESS":
          labelTr = "Başarılı Oturum Açma";
          labelEn = "Successful Sign-in";
          break;
        case "PASSWORD_CHANGED":
          labelTr = "Şifre Değiştirildi";
          labelEn = "Password Changed";
          break;
        case "HANDLE_CHANGED":
          labelTr = "Kullanıcı Adı Güncellendi";
          labelEn = "Username Updated";
          break;
        case "PROFILE_UPDATED":
          labelTr = "Profil Bilgileri Güncellendi";
          labelEn = "Profile Details Updated";
          break;
        case "AVAILABILITY_CHANGED":
          labelTr = "Müsaitlik Tercihleri Güncellendi";
          labelEn = "Availability Preferences Updated";
          break;
        case "LINKS_UPDATED":
          labelTr = "Sosyal & Portföy Bağlantıları Güncellendi";
          labelEn = "Social & Portfolio Links Updated";
          break;
        case "BILLING_UPDATED":
          labelTr = "Fatura ve Ödeme Bilgileri Güncellendi";
          labelEn = "Billing & Payout Details Updated";
          break;
        case "PREFERENCES_UPDATED":
          labelTr = "Hesap ve Bildirim Tercihleri Güncellendi";
          labelEn = "Account & Notification Preferences Updated";
          break;
        case "SESSIONS_TERMINATED":
          labelTr = "Diğer Aktif Oturumlar Kapatıldı";
          labelEn = "Other Active Sessions Terminated";
          break;
        case "TOTP_ENABLED":
          labelTr = "İki Aşamalı Doğrulama (2FA) Açıldı";
          labelEn = "2FA Enabled";
          break;
        case "TOTP_DISABLED":
          labelTr = "İki Aşamalı Doğrulama (2FA) Kapatıldı";
          labelEn = "2FA Disabled";
          break;
        case "EMAIL_VERIFIED":
          labelTr = "E-posta Adresi Doğrulandı";
          labelEn = "Email Address Verified";
          break;
        case "PHONE_VERIFIED":
          labelTr = "Telefon Numarası Doğrulandı";
          labelEn = "Phone Number Verified";
          break;
        default:
          labelTr = log.eventType || "Hesap İşlemi";
          labelEn = log.eventType || "Account Activity";
      }

      return {
        id: log.id,
        eventType: log.eventType,
        label: isEn ? labelEn : labelTr,
        ipAddress: log.ipAddress || (isEn ? "Internal" : "Sistem"),
        createdAt: log.createdAt,
        metadata: log.riskMetadata,
      };
    });

    return NextResponse.json({ logs }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load audit logs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
