import type pg from "pg";

export const EXPORT_LEASE_MS = 60 * 1000; // 60s lease
export const EXPORT_EXPIRATION_HOURS = 24; // 24 hours validity (B26-C)
export const MAX_EXPORT_ATTEMPTS = 3;

export interface ExportJobProgressEvent {
  jobId: string;
  startedAt?: Date;
  lastProgressAt: Date;
  phase: "claimed" | "reading_section" | "reading_page" | "part_written";
  details?: Record<string, unknown>;
}

export interface ClaimAndProcessOptions {
  signal?: AbortSignal;
  onProgress?: (progress: ExportJobProgressEvent) => void;
  pool?: pg.Pool;
  maxDurationMs?: number;
  renewalIntervalMs?: number; // Configurable renewal interval (default: 20000)
  testProcessingBarrier?: (context: {
    jobId: string;
    leaseToken: string;
    attemptCount: number;
    initialLeaseUntil: Date;
    initialLastProgressAt: Date;
  }) => Promise<void>;
}

export interface ExportJobProgressListener {
  onJobClaimed?: (job: { jobId: string; startedAt: Date; lastProgressAt: Date }) => void;
  onJobProgress?: (progress: ExportJobProgressEvent) => void;
  onJobFinished?: (jobId: string) => void;
}
