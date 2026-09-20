"use client";

import { useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";

function getCopyButtonLabel(copied: boolean, isTr: boolean): string {
  if (copied) {
    return isTr ? "Kopyalandı" : "Copied";
  }
  return isTr ? "Kopyala" : "Copy";
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [isEn, setIsEn] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.location.pathname.startsWith("/en")) {
        setIsEn(true);
      }
      try {
        Sentry.captureException(error);
      } catch {
        // Fail-safe if Sentry client is not initialized
      }
    }
  }, [error]);

  const isTr = !isEn;
  const homePath = isEn ? "/en" : "/tr";
  const referenceCode = error?.digest || "OPR-CRIT-SYS";

  const handleCopyCode = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(referenceCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <html lang={isEn ? "en" : "tr"} dir="ltr">
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#07090e",
          color: "#f1f5f9",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <main
          role="alert"
          style={{
            maxWidth: "480px",
            width: "90%",
            margin: "40px auto",
            padding: "32px 24px",
            borderRadius: "20px",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(244, 63, 94, 0.2)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            textAlign: "center",
          }}
        >
          {/* Warning Icon Badge */}
          <div
            style={{
              width: "56px",
              height: "56px",
              margin: "0 auto 20px",
              borderRadius: "16px",
              background: "rgba(244, 63, 94, 0.1)",
              border: "1px solid rgba(244, 63, 94, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fb7185",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          <div
            style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: "9999px",
              fontSize: "11px",
              fontWeight: "600",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              background: "rgba(244, 63, 94, 0.1)",
              color: "#fb7185",
              border: "1px solid rgba(244, 63, 94, 0.2)",
              marginBottom: "12px",
            }}
          >
            CRITICAL ERROR &bull; 500
          </div>

          <h1
            style={{
              fontSize: "22px",
              fontWeight: "700",
              margin: "0 0 8px",
              color: "#ffffff",
            }}
          >
            {isTr ? "Uygulama Başlatılamadı" : "Application Failed to Initialize"}
          </h1>

          <p
            style={{
              fontSize: "14px",
              lineHeight: "1.6",
              color: "#94a3b8",
              margin: "0 0 24px",
            }}
          >
            {isTr
              ? "Kök katmanda beklenmeyen bir sorun algılandı. Lütfen sayfayı yenilemeyi veya ana sayfaya dönmeyi deneyin."
              : "An unexpected root-level error occurred. Please try reloading or returning to the home page."}
          </p>

          {/* Reference code */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px 16px",
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              marginBottom: "24px",
              fontFamily: "monospace",
              fontSize: "12px",
            }}
          >
            <span style={{ color: "#64748b" }}>{isTr ? "Referans:" : "Ref:"}</span>
            <span style={{ color: "#f8fafc", fontWeight: "bold" }}>{referenceCode}</span>
            <button
              type="button"
              onClick={handleCopyCode}
              style={{
                background: "transparent",
                border: "none",
                color: copied ? "#34d399" : "#94a3b8",
                cursor: "pointer",
                padding: "2px 6px",
                borderRadius: "4px",
                fontSize: "11px",
              }}
              title={isTr ? "Kopyala" : "Copy"}
            >
              {getCopyButtonLabel(copied, isTr)}
            </button>
          </div>

          {/* Action buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                padding: "10px 20px",
                borderRadius: "10px",
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
                transition: "opacity 0.2s",
              }}
            >
              {isTr ? "Uygulamayı Yenile" : "Reload Application"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = homePath;
                }
              }}
              style={{
                padding: "10px 20px",
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.08)",
                color: "#f8fafc",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                fontWeight: "500",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              {isTr ? "Ana Sayfa" : "Home Page"}
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
