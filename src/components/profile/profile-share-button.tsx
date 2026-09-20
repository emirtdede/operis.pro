"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { Button } from "../ui/button";

function getProfileShareAriaLabel(copied: boolean, isTr: boolean): string {
  if (copied) {
    return isTr ? "Profil bağlantısı kopyalandı" : "Profile link copied";
  }
  return isTr ? "Profili paylaş" : "Share profile";
}

export function ProfileShareButton({ locale }: { locale: string }) {
  const isTr = locale === "tr";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="gap-1.5 transition-all text-xs cursor-pointer"
      aria-label={getProfileShareAriaLabel(copied, isTr)}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
          <span className="text-emerald-400 font-medium">{isTr ? "Kopyalandı" : "Copied"}</span>
        </>
      ) : (
        <>
          <Share2 className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" aria-hidden="true" />
          <span>{isTr ? "Profili Paylaş" : "Share Profile"}</span>
        </>
      )}
    </Button>
  );
}
