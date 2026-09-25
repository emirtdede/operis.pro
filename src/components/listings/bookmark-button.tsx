"use client";

import { useState, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { Button } from "@/src/components/ui/button";

export interface BookmarkButtonProps {
  listingId: string;
  initialSaved?: boolean;
  variant?: "icon" | "button" | "pill" | "ghost";
  size?: "sm" | "md";
  locale?: string;
  className?: string;
  onToggle?: (saved: boolean) => void;
}

function getBookmarkAriaLabel(saved: boolean, isTr: boolean): string {
  if (saved) {
    return isTr ? "İlanı kaydedilenlerden çıkar" : "Remove from saved jobs";
  }
  return isTr ? "İlanı kaydet" : "Save this job";
}

function getBookmarkButtonText(saved: boolean, isTr: boolean): string {
  if (saved) {
    return isTr ? "Kaydedildi" : "Saved";
  }
  return isTr ? "Kaydet" : "Save Job";
}

function getBookmarkTitle(saved: boolean, isTr: boolean): string {
  if (saved) {
    return isTr ? "Kaydedilenlerden Kaldır" : "Remove from saved";
  }
  return isTr ? "İlanı Kaydet" : "Save Job";
}

export function BookmarkButton({
  listingId,
  initialSaved = false,
  variant = "icon",
  size = "md",
  locale = "tr",
  className = "",
  onToggle,
}: BookmarkButtonProps) {
  const isTr = locale === "tr";
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const nextSaved = !saved;
    // Optimistic update
    setSaved(nextSaved);
    onToggle?.(nextSaved);

    // Dispatch badge count change to DashboardTabs
    try {
      window.dispatchEvent(
        new CustomEvent("operis:badge-update", {
          detail: {
            key: "savedListings",
            delta: nextSaved ? 1 : -1,
          },
        })
      );
    } catch {
      // ignore
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/listings/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId }),
        });

        if (!res.ok) {
          if (res.status === 401) {
            setSaved(!nextSaved);
            onToggle?.(!nextSaved);
            window.location.href = `/${locale}/login?redirect=${encodeURIComponent(window.location.pathname)}`;
            return;
          }
          // Revert on failure
          setSaved(!nextSaved);
          onToggle?.(!nextSaved);
          window.dispatchEvent(
            new CustomEvent("operis:badge-update", {
              detail: {
                key: "savedListings",
                delta: nextSaved ? -1 : 1,
              },
            })
          );
        }
      } catch {
        // Revert on error
        setSaved(!nextSaved);
        onToggle?.(!nextSaved);
        window.dispatchEvent(
          new CustomEvent("operis:badge-update", {
            detail: {
              key: "savedListings",
              delta: nextSaved ? -1 : 1,
            },
          })
        );
      }
    });
  };

  const iconSizes = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  if (variant === "ghost") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        title={getBookmarkTitle(saved, isTr)}
        aria-label={getBookmarkAriaLabel(saved, isTr)}
        className={twMerge(
          "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer font-medium",
          saved
            ? "bg-blue-500/10 text-blue-400 border border-blue-500/25 shadow-2xs font-semibold"
            : "hover:bg-surface/80 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]",
          className
        )}
      >
        <Bookmark
          className={`${iconSizes} shrink-0 transition-transform active:scale-125 ${
            saved ? "fill-blue-400 text-blue-400" : ""
          }`}
          aria-hidden="true"
        />
        <span>{getBookmarkButtonText(saved, isTr)}</span>
      </button>
    );
  }

  if (variant === "button") {
    return (
      <Button
        type="button"
        variant="secondary"
        size={size}
        onClick={handleToggle}
        disabled={isPending}
        aria-label={getBookmarkAriaLabel(saved, isTr)}
        className={twMerge(
          "gap-1.5 transition-all text-xs font-medium justify-center",
          saved && "border-blue-500/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20",
          className
        )}
      >
        <Bookmark
          className={`${iconSizes} shrink-0 transition-transform active:scale-125 ${
            saved ? "fill-blue-400 text-blue-400" : "text-[var(--color-text-secondary)]"
          }`}
          aria-hidden="true"
        />
        <span>{getBookmarkButtonText(saved, isTr)}</span>
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      title={getBookmarkTitle(saved, isTr)}
      aria-label={getBookmarkAriaLabel(saved, isTr)}
      className={twMerge(
        "relative inline-flex items-center justify-center p-2 rounded-xl border transition-all",
        saved
          ? "border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-sm"
          : "border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]",
        className
      )}
    >
      <Bookmark
        className={`${iconSizes} transition-all duration-200 active:scale-125 ${
          saved ? "fill-blue-400 text-blue-400 scale-105" : ""
        }`}
        aria-hidden="true"
      />
    </button>
  );
}
