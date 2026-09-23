import { NextResponse } from "next/server";
import { ResendPoolService } from "@/src/modules/email/resend-pool-service";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new NextResponse(
        renderUnsubscribeHtml({
          success: false,
          title: "Geçersiz İstek",
          message: "Abonelikten çıkma bağlantısı geçersiz veya eksik parametre içeriyor.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "X-Robots-Tag": "noindex, nofollow",
          },
        }
      );
    }

    const verified = ResendPoolService.verifyUnsubscribeToken(token);
    if (!verified.valid || !verified.userId) {
      return new NextResponse(
        renderUnsubscribeHtml({
          success: false,
          title: "Doğrulama Başarısız",
          message: "Bağlantının süresi dolmuş veya imza doğrulanamadı.",
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "X-Robots-Tag": "noindex, nofollow",
          },
        }
      );
    }

    await ResendPoolService.optOutUser(verified.userId);

    return new NextResponse(
      renderUnsubscribeHtml({
        success: true,
        title: "Abonelikten Çıkıldı",
        message:
          "Bülten ve platform duyurusu e-posta listesinden başarıyla çıkarıldınız. Hesap güvenliği ve işlem bildirimleriniz etkilenmez.",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "X-Robots-Tag": "noindex, nofollow",
        },
      }
    );
  } catch (error: unknown) {
    console.error("[UNSUBSCRIBE_GET_ERROR]", error);
    return new NextResponse(
      renderUnsubscribeHtml({
        success: false,
        title: "Sistem Hatası",
        message: "İşlem sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "X-Robots-Tag": "noindex, nofollow",
        },
      }
    );
  }
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token") || (await req.json().catch(() => ({}))).token;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const verified = ResendPoolService.verifyUnsubscribeToken(token);
    if (!verified.valid || !verified.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    await ResendPoolService.optOutUser(verified.userId);
    return NextResponse.json({
      success: true,
      unsubscribed: true,
      message: "Unsubscribed from marketing emails",
    });
  } catch (error: unknown) {
    console.error("[UNSUBSCRIBE_POST_ERROR]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to unsubscribe" },
      { status: 500 }
    );
  }
}

function renderUnsubscribeHtml(props: {
  success: boolean;
  title: string;
  message: string;
}): string {
  const statusColor = props.success ? "#10b981" : "#ef4444";
  const icon = props.success
    ? `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${statusColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
    : `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${statusColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${props.title} — Operis</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #0b0f19;
      color: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 16px;
      padding: 40px;
      max-width: 440px;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .icon { margin-bottom: 20px; }
    h1 { font-size: 24px; font-weight: 700; margin: 0 0 12px 0; color: #ffffff; }
    p { font-size: 15px; line-height: 1.6; color: #9ca3af; margin: 0 0 28px 0; }
    a.btn {
      display: inline-block;
      background: #4f46e5;
      color: #ffffff;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 14px;
      transition: background 0.2s;
    }
    a.btn:hover { background: #4338ca; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${props.title}</h1>
    <p>${props.message}</p>
    <a href="/" class="btn">Operis Ana Sayfasına Dön</a>
  </div>
</body>
</html>`;
}
