import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={twMerge(clsx("rounded-md bg-[var(--bg-elevated)]", className))}
      {...props}
    />
  );
}
