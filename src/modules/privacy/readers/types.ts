import type pg from "pg";
import type { schema } from "@/src/lib/db";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { ExportError } from "../export-errors";

export interface ExportDataSnapshot {
  exportVersion: 2;
  extractedAt: string;
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    role: string;
    status: string;
    twoFactorEnabled: boolean;
    createdAt: string;
    updatedAt: string;
  };
  profile: Record<string, unknown> | null;
  links: Array<Record<string, unknown>>;
  privateIdentity: Record<string, unknown> | null;
  listings: Array<Record<string, unknown>>;
  listingRevisions: Array<Record<string, unknown>>;
  offers: Array<Record<string, unknown>>;
  offerRevisions: Array<Record<string, unknown>>;
  engagements: Array<Record<string, unknown>>;
  endorsements: {
    authored: Array<Record<string, unknown>>;
    received: Array<Record<string, unknown>>;
  };
  categoryFollows: Array<Record<string, unknown>>;
  offerTemplates: Array<Record<string, unknown>>;
  notifications: Array<Record<string, unknown>>;
  legalAcceptances: Array<Record<string, unknown>>;
  securityLog: Array<Record<string, unknown>>;
}

export const PAGE_SIZE = 500;
export const REVISION_PAGE_SIZE = 50;
export const MAX_RECORD_BYTES = 10 * 1024 * 1024; // 10 MiB limit per single record
export const METADATA_PADDING_BYTES = 4096; // 4 KiB overhead padding for surrounding JSON keys and encoding
export const MAX_PAYLOAD_GROUP_BYTES = 16 * 1024 * 1024; // 16 MiB payload batch limit to bound resident memory

export function serializeExportRecord<T>(record: T): string {
  const json = JSON.stringify(record);
  if (Buffer.byteLength(json) > MAX_RECORD_BYTES) {
    throw new ExportError(
      "EXPORT_RECORD_TOO_LARGE",
      `Single export record exceeded maximum supported limit of 10 MiB (${Buffer.byteLength(json)} bytes)`,
      413,
      false
    );
  }
  return json;
}

export interface StreamExportOptions {
  signal?: AbortSignal;
  onSection?: (sectionName: string) => Promise<void> | void;
  onProgress?: (info: { section: string; page: number; rowCount: number }) => Promise<void> | void;
  acquisitionTimeoutMs?: number;
  deadlineAt?: number;
  remainingDeadlineMs?: number;
  pool?: pg.Pool;
}

export type DrizzleTxDb = NodePgDatabase<typeof schema>;

export interface ExportReaderContext {
  txDb: DrizzleTxDb;
  userId: string;
  options?: StreamExportOptions;
  signal?: AbortSignal;
  getRemainingMs: () => number;
}

export type LinkRow = {
  id: string;
  type: string;
  label: string;
  url: string;
  sortOrder: number;
};

export type EngagementRow = typeof schema.engagements.$inferSelect & {
  matchedAtText: string;
};

export type EndorsementRow = typeof schema.endorsements.$inferSelect & {
  createdAtText: string;
};

export type CategoryFollowRow = {
  categoryId: string;
  createdAt: Date;
  createdAtText: string;
};

export type OfferTemplateRow = typeof schema.offerTemplates.$inferSelect & {
  createdAtText: string;
};

export type LegalAcceptanceRow = {
  documentKey: string;
  documentVersion: string;
  contentHash: string;
  acceptedAt: Date;
  acceptedAtText: string;
};

export type SecurityEventRow = {
  id: string;
  eventType: string;
  ipAddress: string | null;
  createdAt: Date;
  createdAtText: string;
};
