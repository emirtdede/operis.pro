"use client";

import { useState, useEffect } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface AvatarInitialsProps {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}

export function getInitials(name: string): string {
  if (!name || typeof name !== "string") return "??";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) {
    return (parts[0]?.substring(0, 2) || "??").toUpperCase();
  }
  const first = parts[0]?.[0] || "";
  const last = parts[parts.length - 1]?.[0] || "";
  return (first + last).toUpperCase();
}

export function AvatarInitials({ name, avatarUrl, size = "md", className }: AvatarInitialsProps) {
  const [imageError, setImageError] = useState(false);
  const initials = getInitials(name);

  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  const sizeStyles = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-12 h-12 text-base font-semibold",
    xl: "w-16 h-16 text-xl font-bold",
    "2xl": "w-20 h-20 sm:w-24 sm:h-24 text-2xl font-extrabold",
  };

  const hasValidUrl = Boolean(avatarUrl && !imageError && avatarUrl.trim().length > 0);

  return (
    <div
      role="img"
      aria-label={`Avatar for ${name}`}
      className={twMerge(
        clsx(
          "inline-flex items-center justify-center rounded-full select-none shrink-0 font-medium overflow-hidden",
          "bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-strong)]",
          sizeStyles[size],
          className
        )
      )}
    >
      {hasValidUrl && avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover rounded-full"
          onError={() => setImageError(true)}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        initials
      )}
    </div>
  );
}
