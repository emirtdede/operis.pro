"use client";

import { useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import "@/src/styles/tokens.css";

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
      <body className="m-0 p-0 bg-[#07090e] text-slate-100 font-sans min-h-screen flex items-center justify-center">
        <main
          role="alert"
          className="max-w-[480px] w-[90%] my-10 mx-auto py-8 px-6 rounded-2xl bg-white/[0.03] border border-rose-500/20 shadow-2xl text-center"
        >
          {/* Warning Icon Badge */}
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
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

          <div className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-3">
            CRITICAL ERROR &bull; 500
          </div>

          <h1 className="text-[22px] font-bold m-0 mb-2 text-white">
            {isTr ? "Uygulama Başlatılamadı" : "Application Failed to Initialize"}
          </h1>

          <p className="text-sm leading-relaxed text-slate-400 m-0 mb-6">
            {isTr
              ? "Kök katmanda beklenmeyen bir sorun algılandı. Lütfen sayfayı yenilemeyi veya ana sayfaya dönmeyi deneyin."
              : "An unexpected root-level error occurred. Please try reloading or returning to the home page."}
          </p>

          {/* Reference code */}
          <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/[0.05] border border-white/10 mb-6 font-mono text-xs">
            <span className="text-slate-500">{isTr ? "Referans:" : "Ref:"}</span>
            <span className="text-slate-50 font-bold">{referenceCode}</span>
            <button
              type="button"
              onClick={handleCopyCode}
              className={`bg-transparent border-0 cursor-pointer py-0.5 px-1.5 rounded text-[11px] transition-colors ${
                copied ? "text-emerald-400" : "text-slate-400 hover:text-slate-200"
              }`}
              title={isTr ? "Kopyala" : "Copy"}
            >
              {getCopyButtonLabel(copied, isTr)}
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex justify-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => reset()}
              className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm cursor-pointer transition-opacity border-0 active:scale-95"
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
              className="py-2.5 px-5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-slate-50 border border-white/15 font-medium text-sm cursor-pointer transition-all active:scale-95"
            >
              {isTr ? "Ana Sayfa" : "Home Page"}
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
