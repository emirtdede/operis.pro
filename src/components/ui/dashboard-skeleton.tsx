import { Skeleton } from "./skeleton";

export interface DashboardSkeletonProps {
  cardsCount?: number;
}

export function DashboardSkeleton({ cardsCount = 4 }: DashboardSkeletonProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 sm:w-64 rounded-xl" />
          <Skeleton className="h-4 w-72 sm:w-96 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* Tabs Skeleton */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-[var(--color-border-subtle)]">
        <Skeleton className="h-9 w-28 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
        <Skeleton className="h-9 w-28 rounded-xl" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>

      {/* Cards List Skeleton */}
      <div className="space-y-4">
        {Array.from({ length: cardsCount }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 backdrop-blur-xl p-5 sm:p-6 space-y-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <Skeleton className="h-6 w-3/4 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-24 rounded-xl shrink-0" />
            </div>
            <Skeleton className="h-4 w-full max-w-2xl rounded" />
            <div className="flex items-center gap-4 pt-2 border-t border-[var(--color-border-subtle)]/60">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
