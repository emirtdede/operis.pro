import { getBaseUrl } from "@/src/lib/config/url";

export interface EmailLayoutProps {
  title: string;
  previewText?: string;
  contentHtml: string;
  locale: "tr" | "en";
}

/**
 * Generates a sleek, bulletproof HTML email layout with authentic Operis brand identity.
 * Compatible across Gmail, Outlook (desktop & web), Apple Mail, and mobile clients.
 */
export function wrapInEmailLayout({
  title,
  previewText,
  contentHtml,
  locale,
}: EmailLayoutProps): string {
  const isTr = locale === "tr";
  const appUrl = getBaseUrl();

  const securityNote = isTr
    ? "Bu e-postayı siz talep etmediyseniz, hiçbir işlem yapmanıza gerek yoktur. Hesabınız tamamen güvendedir."
    : "If you did not request this email, no action is required. Your account is completely secure.";

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  ${previewText ? `<div style="display:none;font-size:1px;color:#090d16;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${previewText}</div>` : ""}
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #090d16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    @media only screen and (max-width: 560px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .content-card { padding: 28px 20px !important; border-radius: 12px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #090d16; color: #e2e8f0;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #090d16;">
    <tr>
      <td align="center" style="padding: 44px 16px;">
        <!-- Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 480px; margin: 0 auto;">
          
          <!-- Header: Authentic Operis Brand Mark (Centered, Bulletproof) -->
          <tr>
            <td align="center" style="padding-bottom: 28px;">
              <a href="${appUrl}" target="_blank" style="text-decoration: none !important; color: #ffffff !important; display: inline-block;">
                <img src="cid:operis-logo" width="130" height="42" alt="Operis" border="0" style="display: block; margin: 0 auto; width: 130px; height: 42px; max-width: 130px; border: 0; outline: none; text-decoration: none; color: #ffffff !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; text-align: center;" />
              </a>
            </td>
          </tr>

          <!-- Main Content Card: Deep Slate Navy, Crisp 1px Border -->
          <tr>
            <td>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="content-card" style="background-color: #0f172a; border-radius: 16px; border: 1px solid #1e293b; padding: 36px 32px; box-shadow: 0 16px 36px -12px rgba(0, 0, 0, 0.45);">
                <tr>
                  <td style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                    ${contentHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer: Calming, Trustworthy, Minimalist -->
          <tr>
            <td style="padding-top: 28px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; line-height: 1.5; color: #64748b;">
                ${securityNote}
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                &copy; 2026 Operis &bull;
                <a href="${appUrl}" target="_blank" style="color: #64748b; text-decoration: none;">operis.pro</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
