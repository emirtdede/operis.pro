"use client";

import { useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Compass,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Terminal,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { ErrorCard } from "@/src/components/ui/error-card";

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showDevDetails, setShowDevDetails] = useState(false);
  const pathname = usePathname();
  const isEn = pathname?.startsWith("/en");
  const locale = isEn ? "en" : "tr";
  const isTr = !isEn;

  const referenceCode =
    error.digest ||
    `OPR-ERR-${Math.abs(
      error.message.split("").reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
    )
      .toString(16)
      .toUpperCase()}`;

  useEffect(() => {
    document.title = isTr
      ? "500 — Beklenmeyen Bir Sorun Oluştu | Operis"
      : "500 — Something Went Wrong | Operis";
    // Log error securely without exposing PII
    console.error("Application error captured by boundary:", error.message);
    Sentry.captureException(error);
  }, [error, isTr]);

  const handleCopyCode = () => {
    if (referenceCode) {
      navigator.clipboard.writeText(referenceCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <main
      role="alert"
      className="min-h-[75vh] flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8"
    >
      <ErrorCard
        code="500"
        badgeText="500 SERVER ERROR"
        badgeColor="rose"
        statusLabel={
          isTr ? "Operis Servisleri: Hata İzleme Aktif" : "Operis Systems: Error Tracing Active"
        }
        subtitle={isTr ? "Sistem Hatası (500)" : "System Error (500)"}
        title={isTr ? "Beklenmeyen Bir Hata Oluştu" : "An Unexpected Error Occurred"}
        description={
          isTr
            ? "İşleminiz gerçekleştirilirken teknik bir sorun ile karşılaşıldı. Sistem mühendislerimiz durumdan haberdar edildi. Lütfen sayfayı yenilemeyi deneyin."
            : "A technical issue was encountered while processing your request. Our system engineers have been alerted. Please try refreshing the page."
        }
        icon={<AlertTriangle className="h-8 w-8" aria-hidden="true" />}
      >
        {/* Reference Code Pill */}
        <div className="flex items-center justify-center gap-2.5 p-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/70 backdrop-blur-sm">
          <span className="text-xs font-mono text-[var(--color-text-tertiary)]">
            {isTr ? "Referans Kodu:" : "Reference Code:"}
          </span>
          <span className="text-xs font-mono font-bold text-[var(--color-text-primary)] tracking-wider">
            {referenceCode}
          </span>
          <button
            type="button"
            onClick={handleCopyCode}
            className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-base)] transition-all border border-transparent hover:border-[var(--color-border-subtle)]"
            aria-label={isTr ? "Kodu kopyala" : "Copy reference code"}
            title={isTr ? "Kodu kopyala" : "Copy reference code"}
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Developer Diagnostics Accordion (Local / Dev Mode Only) */}
        {isDev && (
          <div className="text-left border border-[var(--color-border-subtle)] rounded-2xl bg-[var(--color-surface-base)]/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowDevDetails(!showDevDetails)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-mono text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                <span>{isTr ? "Geliştirici Teşhis Detayları" : "Developer Diagnostics"}</span>
              </div>
              {showDevDetails ? (
                <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>

            {showDevDetails && (
              <div className="p-4 border-t border-[var(--color-border-subtle)] space-y-2 bg-black/40 text-[11px] font-mono text-rose-300/90 overflow-x-auto max-h-48 scrollbar-thin">
                <p className="font-bold text-rose-400">{error.message}</p>
                {error.stack && (
                  <pre className="text-[10px] text-[var(--color-text-tertiary)] whitespace-pre-wrap leading-relaxed">
                    {error.stack}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 border-t border-[var(--color-border-subtle)]/60">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => reset()}
            className="gap-2 shadow-md shadow-rose-500/10"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>{isTr ? "Tekrar Dene" : "Try Again"}</span>
          </Button>

          <Link href={`/${locale}`}>
            <Button type="button" variant="outline" size="sm" className="gap-2">
              <Home className="h-4 w-4" aria-hidden="true" />
              <span>{isTr ? "Ana Sayfa" : "Home"}</span>
            </Button>
          </Link>

          <Link href={isTr ? "/tr/akis" : "/en/feed"}>
            <Button type="button" variant="outline" size="sm" className="gap-2">
              <Compass className="h-4 w-4" aria-hidden="true" />
              <span>{isTr ? "İlanlar" : "Listings"}</span>
            </Button>
          </Link>
        </div>
      </ErrorCard>
    </main>
  );
}
