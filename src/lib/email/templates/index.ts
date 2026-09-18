import { wrapInEmailLayout } from "./layout";
import type { EmailTemplateKey } from "../index";
import type { Locale } from "@/src/lib/i18n/config";

export interface RenderTemplateOptions {
  template: EmailTemplateKey;
  locale: Locale;
  variables: Record<string, string>;
}

export interface RenderTemplateResult {
  html: string;
  text: string;
  subject: string;
}

/**
 * Renders a bulletproof, high-contrast, modern CTA button that works
 * across Outlook desktop (MSO VML), Outlook web, Gmail, Apple Mail, and mobile.
 */
function renderButton(href: string, text: string): string {
  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 28px auto;">
      <tr>
        <td align="center" bgcolor="#2563eb" style="border-radius: 8px; background-color: #2563eb;">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:44px;v-text-anchor:middle;width:240px;" arcsize="18%" stroke="f" fillcolor="#2563eb">
            <w:anchorlock/>
            <center style="color:#ffffff;font-family:Segoe UI, sans-serif;font-size:14px;font-weight:600;">${text}</center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-->
          <a href="${href}" target="_blank" style="display: inline-block; padding: 13px 34px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; background-color: #2563eb; line-height: 100%; text-align: center;">
            ${text}
          </a>
          <!--<![endif]-->
        </td>
      </tr>
    </table>
  `;
}

/**
 * Renders a subtle, non-intrusive notification callout card.
 */
function renderInfoBox(title: string, message: string, accentColor = "#38bdf8"): string {
  return `
    <div style="background-color: #0b1120; border-left: 3px solid ${accentColor}; border-radius: 6px; padding: 14px 18px; margin: 24px 0 8px 0; text-align: left;">
      <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #94a3b8;">
        <strong style="color: #e2e8f0;">${title}:</strong> ${message}
      </p>
    </div>
  `;
}

export function renderEmailTemplate({
  template,
  locale,
  variables,
}: RenderTemplateOptions): RenderTemplateResult {
  const isTr = locale === "tr";
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://operis.pro";

  switch (template) {
    case "verify_email": {
      const verificationUrl =
        variables.verificationUrl ||
        `${appUrl}/api/auth/verify-email?token=${encodeURIComponent(variables.token || "")}`;
      const subject =
        variables.subject ||
        (isTr ? "Operis - E-posta Adresinizi Doğrulayın" : "Operis - Verify Your Email Address");

      const contentHtml = `
        <h1 style="margin: 0 0 14px 0; font-size: 21px; font-weight: 700; color: #f8fafc; text-align: center; letter-spacing: -0.3px;">
          ${isTr ? "E-posta Adresinizi Doğrulayın" : "Verify Your Email Address"}
        </h1>

        <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #94a3b8; text-align: center;">
          ${
            isTr
              ? "Operis topluluğuna hoş geldiniz. Hesabınızı güvenle aktifleştirmek için lütfen aşağıdaki butona tıklayarak e-posta adresinizi onaylayın:"
              : "Welcome to Operis. To securely activate your account, please click the button below to verify your email address:"
          }
        </p>

        ${renderButton(verificationUrl, isTr ? "E-posta Adresimi Doğrula" : "Verify My Email")}

        ${renderInfoBox(
          isTr ? "Geçerlilik Süresi" : "Validity Window",
          isTr
            ? "Bu doğrulama bağlantısı güvenlik kurallarımız gereği 24 saat boyunca geçerlidir."
            : "This verification link is valid for 24 hours per platform security policies.",
          "#38bdf8"
        )}
      `;

      const text = isTr
        ? `Merhaba,\n\nOperis e-posta adresinizi doğrulamak için aşağıdaki bağlantıya tıklayın:\n${verificationUrl}\n\nBu bağlantı 24 saat geçerlidir.\n\nOperis Ekibi`
        : `Hello,\n\nPlease verify your Operis email address by clicking the link below:\n${verificationUrl}\n\nThis link is valid for 24 hours.\n\nOperis Team`;

      return {
        html: wrapInEmailLayout({
          title: subject,
          previewText: isTr
            ? "Operis hesabınızı doğrulamak için tıklayın."
            : "Verify your Operis account to get started.",
          contentHtml,
          locale,
        }),
        text: variables.body || text,
        subject,
      };
    }

    case "password_reset": {
      const resetLink =
        variables.resetLink ||
        variables.verificationUrl ||
        `${appUrl}/${isTr ? "tr/sifre-sifirla" : "en/reset-password"}?token=${encodeURIComponent(variables.token || "")}`;
      const subject =
        variables.subject ||
        (isTr ? "Operis - Şifre Sıfırlama Talebi" : "Operis - Password Reset Request");

      const contentHtml = `
        <h1 style="margin: 0 0 14px 0; font-size: 21px; font-weight: 700; color: #f8fafc; text-align: center; letter-spacing: -0.3px;">
          ${isTr ? "Şifre Sıfırlama Talebi" : "Password Reset Request"}
        </h1>

        <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #94a3b8; text-align: center;">
          ${
            isTr
              ? "Operis hesabınız için yeni bir şifre belirleme talebinde bulunuldu. Yeni şifrenizi güvenle belirlemek için aşağıdaki butona tıklayın:"
              : "A password reset request was received for your Operis account. Click the button below to set a new password:"
          }
        </p>

        ${renderButton(resetLink, isTr ? "Yeni Şifre Belirle" : "Set New Password")}

        ${renderInfoBox(
          isTr ? "Güvenlik Hatırlatması" : "Security Notice",
          isTr
            ? "Bu bağlantı 1 saat boyunca geçerlidir. Talebi siz yapmadıysanız şifreniz değişmeyecektir."
            : "This link is valid for 1 hour. If you did not make this request, your password remains secure.",
          "#f59e0b"
        )}
      `;

      const text = isTr
        ? `Merhaba,\n\nHesabınız için bir şifre sıfırlama talebinde bulunuldu. Şifrenizi yenilemek için tıklayın:\n${resetLink}\n\nBu bağlantı 1 saat geçerlidir.\n\nOperis Ekibi`
        : `Hello,\n\nA request has been made to reset your password. Click the link to proceed:\n${resetLink}\n\nThis link is valid for 1 hour.\n\nOperis Team`;

      return {
        html: wrapInEmailLayout({
          title: subject,
          previewText: isTr
            ? "Operis şifrenizi güvenle yenileyin."
            : "Reset your Operis account password securely.",
          contentHtml,
          locale,
        }),
        text: variables.body || text,
        subject,
      };
    }

    case "new_offer_received": {
      const offerUrl = variables.offerUrl || `${appUrl}/${isTr ? "tr/dashboard" : "en/dashboard"}`;
      const subject =
        variables.subject ||
        (isTr ? "Operis - İlanınıza Yeni Teklif Geldi" : "Operis - New Offer Received for Listing");

      const freelancerName = variables.freelancerName || (isTr ? "Bir Uzman" : "A Specialist");
      const listingTitle = variables.listingTitle || (isTr ? "İlanınız" : "Your Listing");
      const budgetText = variables.budget || (isTr ? "Görüşülebilir" : "Negotiable");

      const contentHtml = `
        <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #f8fafc; text-align: center; letter-spacing: -0.3px;">
          ${isTr ? "İlanınıza Yeni Teklif Geldi" : "New Proposal Received"}
        </h1>

        <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #94a3b8; text-align: center;">
          ${
            isTr
              ? `<strong>${listingTitle}</strong> başlıklı ilanınız için yeni bir iş teklifi aldınız.`
              : `You received a new proposal for <strong>${listingTitle}</strong>.`
          }
        </p>

        <div style="background-color: #0b1120; border: 1px solid #1e293b; border-radius: 10px; padding: 16px 18px; margin: 20px 0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="font-size: 13px; color: #64748b; padding-bottom: 8px;">${isTr ? "Teklif Veren" : "Specialist"}:</td>
              <td align="right" style="font-size: 13px; font-weight: 600; color: #f8fafc; padding-bottom: 8px;">${freelancerName}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #64748b;">${isTr ? "Teklif Tutarı" : "Offer Amount"}:</td>
              <td align="right" style="font-size: 14px; font-weight: 700; color: #38bdf8;">${budgetText}</td>
            </tr>
          </table>
        </div>

        ${renderButton(offerUrl, isTr ? "Teklifi İncele" : "Review Proposal")}
      `;

      return {
        html: wrapInEmailLayout({
          title: subject,
          previewText: isTr
            ? `${listingTitle} için yeni bir teklif aldınız.`
            : `New offer received for ${listingTitle}.`,
          contentHtml,
          locale,
        }),
        text: variables.body || `${subject}\n${offerUrl}`,
        subject,
      };
    }

    case "offer_accepted": {
      const matchUrl = variables.matchUrl || `${appUrl}/${isTr ? "tr/dashboard" : "en/dashboard"}`;
      const subject =
        variables.subject ||
        (isTr
          ? "Operis - Tebrikler! Teklifiniz Kabul Edildi"
          : "Operis - Congratulations! Offer Accepted");

      const contentHtml = `
        <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #f8fafc; text-align: center; letter-spacing: -0.3px;">
          ${isTr ? "Tebrikler, İşbirliği Başladı!" : "Congratulations, Collaboration Started!"}
        </h1>

        <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #94a3b8; text-align: center;">
          ${
            isTr
              ? "İlan sahibi teklifinizi onayladı ve Çalışma Odası erişime açıldı. Detayları incelemek ve iş birliğini başlatmak için odaya giriş yapabilirsiniz:"
              : "The client accepted your proposal. The Work Room has been unlocked. You can now coordinate directly and initiate the project delivery:"
          }
        </p>

        ${renderButton(matchUrl, isTr ? "Çalışma Odasına Git" : "Open Work Room")}
      `;

      return {
        html: wrapInEmailLayout({
          title: subject,
          previewText: isTr
            ? "Teklifiniz kabul edildi, çalışma odası hazır."
            : "Your offer was accepted, work room is ready.",
          contentHtml,
          locale,
        }),
        text: variables.body || `${subject}\n${matchUrl}`,
        subject,
      };
    }

    case "listing_expiring": {
      const renewUrl =
        variables.renewUrl ||
        `${appUrl}/${isTr ? "tr/dashboard/listings" : "en/dashboard/listings"}`;
      const subject =
        variables.subject ||
        (isTr ? "Operis - İlanınızın 7 Günlük Süresi Doluyor" : "Operis - Listing Expiring Soon");

      const contentHtml = `
        <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #f8fafc; text-align: center; letter-spacing: -0.3px;">
          ${isTr ? "İlan Süreniz Dolmak Üzere" : "Listing Expiring Soon"}
        </h1>

        <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #94a3b8; text-align: center;">
          ${
            isTr
              ? "İlanınızın 7 günlük süresi 24 saat sonra tamamlanacak. Teklif almaya devam etmek için ilanınızı tek tıkla yenileyebilirsiniz:"
              : "To maintain active marketplace quality, listings remain fresh for 7 days. Renew it now to keep receiving proposals:"
          }
        </p>

        ${renderButton(renewUrl, isTr ? "İlanı 7 Gün Yenile" : "Renew for 7 Days")}
      `;

      return {
        html: wrapInEmailLayout({
          title: subject,
          previewText: isTr
            ? "İlanınızın 7 günlük süresi doluyor, tek tıkla yenileyin."
            : "Your listing is expiring soon, renew in one click.",
          contentHtml,
          locale,
        }),
        text: variables.body || `${subject}\n${renewUrl}`,
        subject,
      };
    }

    default: {
      // Generic branded platform notification
      const subject = variables.subject || (isTr ? "Operis Bildirimi" : "Operis Notification");
      const title = variables.title || subject;
      const bodyText =
        variables.body ||
        (isTr
          ? "Hesabınızla ilgili yeni bir platform bildirimi bulunmaktadır."
          : "You have a new notification regarding your Operis account.");

      const actionUrl =
        variables.actionUrl || `${appUrl}/${isTr ? "tr/dashboard" : "en/dashboard"}`;
      const actionText = variables.actionText || (isTr ? "Detayları Görüntüle" : "View Details");

      const formattedParagraphs = bodyText
        .split("\n\n")
        .map(
          (p) =>
            `<p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #94a3b8; text-align: center;">${p.replace(/\n/g, "<br>")}</p>`
        )
        .join("");

      const contentHtml = `
        <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #f8fafc; text-align: center; letter-spacing: -0.3px;">
          ${title}
        </h1>
        ${formattedParagraphs}

        ${renderButton(actionUrl, actionText)}
      `;

      return {
        html: wrapInEmailLayout({
          title: subject,
          previewText: bodyText.slice(0, 100),
          contentHtml,
          locale,
        }),
        text: bodyText,
        subject,
      };
    }
  }
}
