import React, { useId } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  badge?: React.ReactNode;
  cornerAction?: React.ReactNode;
  hint?: string;
  error?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

function renderCornerContent(cornerAction?: React.ReactNode, badge?: React.ReactNode) {
  if (cornerAction) {
    return cornerAction;
  }
  if (badge) {
    return (
      <span className="text-[10px] font-mono font-medium text-slate-400/80 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] shadow-sm select-none">
        {badge}
      </span>
    );
  }
  return null;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ className, label, badge, cornerAction, hint, error, id, startIcon, endIcon, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const hintId = `${inputId}-hint`;
    const errorId = `${inputId}-error`;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <div className="min-h-[22px] flex items-center justify-between gap-2">
            <label
              htmlFor={inputId}
              className="text-xs font-medium text-[var(--color-text-secondary)] select-none flex items-center gap-1.5"
            >
              <span>{label}</span>
              {props.required && (
                <span className="text-red-400/80 text-[11px] font-normal" aria-hidden="true">
                  *
                </span>
              )}
            </label>
            {renderCornerContent(cornerAction, badge)}
          </div>
        )}
        <div className="relative flex items-center group">
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={clsx(error && errorId, hint && hintId) || undefined}
            className={twMerge(
              clsx(
                "w-full h-12 text-sm rounded-xl font-normal transition-all duration-200",
                "bg-[var(--bg-surface)]",
                "text-[var(--text-primary)]",
                "border border-[var(--border-subtle)] hover:border-[var(--border-strong)]",
                "shadow-sm",
                "px-3.5",
                startIcon && "pl-10",
                endIcon && "pr-10",
                "placeholder:text-[var(--text-muted)]",
                "focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500/15 focus-visible:bg-[var(--bg-surface)]",
                "[&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none [&::-webkit-datetime-edit]:py-0",
                error
                  ? "border-[var(--color-danger)] focus-visible:ring-[var(--color-danger)]/20"
                  : "",
                className
              )
            )}
            {...props}
          />
          {startIcon && (
            <div className="pointer-events-none absolute left-3.5 z-10 flex items-center text-slate-400 transition-colors group-focus-within:text-blue-400">
              {startIcon}
            </div>
          )}
          {endIcon && (
            <div className="absolute right-3.5 z-10 flex items-center text-slate-400 transition-colors group-focus-within:text-blue-400">
              {endIcon}
            </div>
          )}
        </div>
        {hint && !error && (
          <p id={hintId} className="text-xs text-[var(--color-text-tertiary)]">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-xs text-[var(--color-danger)] font-medium" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

TextInput.displayName = "TextInput";
