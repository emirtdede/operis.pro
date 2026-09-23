import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  variant?: "default" | "card";
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
  variant = "card",
}: EmptyStateProps) {
  return (
    <div
      className={twMerge(
        clsx(
          "flex flex-col items-center justify-center text-center",
          variant === "card"
            ? "p-8 sm:p-12 rounded-3xl bg-[var(--color-surface-base)]/70 border border-[var(--color-border-subtle)] backdrop-blur-xl shadow-sm"
            : "py-4 px-2 sm:py-6",
          className
        )
      )}
    >
      {icon && (
        <div
          className={clsx(
            "mb-5 flex items-center justify-center shrink-0 transition-transform",
            variant === "card"
              ? "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/5 ring-4 ring-blue-500/5"
              : "p-3 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)]"
          )}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-2 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{action}</div>}
    </div>
  );
}
