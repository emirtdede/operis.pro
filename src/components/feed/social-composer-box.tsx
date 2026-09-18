"use client";

import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Button } from "../ui/button";
import { AvatarInitials } from "../ui/avatar-initials";
import { getLocalizedRoute } from "@/src/lib/i18n/routes";

export interface SocialComposerBoxProps {
  locale: string;
  userDisplayName?: string;
}

export function SocialComposerBox({ locale, userDisplayName }: SocialComposerBoxProps) {
  const isTr = locale === "tr";
  const newListingPath = getLocalizedRoute("newListing", locale);

  return (
    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 p-3 sm:p-4 transition-all">
      <div className="flex items-center gap-3">
        <AvatarInitials
          name={userDisplayName || (isTr ? "Siz" : "You")}
          size="sm"
          className="shrink-0"
        />

        <Link
          href={newListingPath}
          className="flex-1 px-4 py-2 rounded-xl bg-[var(--color-surface-hover)]/70 border border-[var(--color-border-subtle)]/50 text-xs sm:text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-blue-500/30 transition-all truncate"
        >
          {isTr
            ? "Yeni bir ilan yayınlamak mı istiyorsunuz?"
            : "Looking to post a new listing?"}
        </Link>

        <Link href={newListingPath} className="shrink-0">
          <Button variant="shimmer" size="sm" className="gap-1.5 px-3 py-1.5 text-xs">
            <PlusCircle className="h-3.5 w-3.5" />
            <span>{isTr ? "İlan Ver" : "Post"}</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
