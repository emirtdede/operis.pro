import React, { useId } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  showCount?: boolean;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      className,
      label,
      hint,
      error,
      id,
      maxLength,
      value,
      defaultValue,
      onChange,
      showCount = true,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const hintId = `${inputId}-hint`;
    const errorId = `${inputId}-error`;

    const [charCount, setCharCount] = React.useState<number>(() => {
      if (typeof value === "string") return value.length;
      if (typeof defaultValue === "string") return defaultValue.length;
      return 0;
    });

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      onChange?.(e);
    };

    const hasHeader = Boolean(label || (showCount && maxLength));

    return (
      <div className="w-full flex flex-col gap-1.5">
        {hasHeader && (
          <div className="min-h-[22px] flex items-center justify-between gap-2">
            {label && (
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
            )}
            {showCount && maxLength && (
              <span
                className={clsx(
                  "text-[10px] font-mono px-2 py-0.5 rounded-md select-none",
                  charCount >= maxLength
                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                    : "bg-white/[0.04] text-slate-400/80 border border-white/[0.08]"
                )}
                aria-live="polite"
              >
                {charCount} / {maxLength}
              </span>
            )}
          </div>
        )}
        <textarea
          ref={ref}
          id={inputId}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          aria-invalid={!!error}
          aria-describedby={clsx(error && errorId, hint && hintId) || undefined}
          className={twMerge(
            clsx(
              "w-full min-h-[110px] p-3.5 text-sm rounded-xl font-normal transition-all duration-200 resize-y",
              "bg-[var(--bg-surface)] text-[var(--text-primary)]",
              "border border-[var(--border-subtle)] hover:border-[var(--border-strong)]",
              "shadow-sm",
              "placeholder:text-[var(--text-muted)]",
              "focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500/15 focus-visible:bg-[var(--bg-surface)]",
              error
                ? "border-[var(--color-danger)] focus-visible:ring-[var(--color-danger)]/20"
                : "",
              className
            )
          )}
          {...props}
        />
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

TextArea.displayName = "TextArea";
