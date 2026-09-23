import { and, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { schema } from "@/src/lib/db";
import { streamRecordWithJsonPayload } from "../export-json-stream";
import { ExportError } from "../export-errors";
import {
  PAGE_SIZE,
  REVISION_PAGE_SIZE,
  MAX_RECORD_BYTES,
  METADATA_PADDING_BYTES,
  MAX_PAYLOAD_GROUP_BYTES,
  serializeExportRecord,
  type ExportReaderContext,
} from "./types";

/**
 * Reads user listings with keyset pagination and memory-bounded payload chunking.
 */
export async function* readListingsData(
  ctx: ExportReaderContext
): AsyncGenerator<string, void, unknown> {
  const { txDb, userId, options, signal, getRemainingMs } = ctx;

  yield `  "listings": [\n`;
  let firstListing = true;
  let listingPageCount = 0;

  type ListingMetaRow = {
    id: string;
    title: string;
    slug: string;
    status: (typeof schema.listings.$inferSelect)["status"];
    summary: string | null;
    budgetMode: (typeof schema.listings.$inferSelect)["budgetMode"];
    budgetMin: string | null;
    budgetMax: string | null;
    budgetCurrency: string | null;
    createdAt: Date;
    createdAtText: string;
    updatedAt: Date;
    byteLen: number;
  };

  async function* streamListingGroups(
    groups: ListingMetaRow[][],
    idx: number
  ): AsyncGenerator<string, void, unknown> {
    if (idx >= groups.length) return;
    const group = groups[idx];
    if (!group) return;
    if (signal?.aborted) {
      throw signal.reason || new ExportError("EXPORT_ABORTED", "Aborted", 400, false);
    }
    if (getRemainingMs() <= 0) {
      throw new ExportError("EXPORT_TIMEOUT", "Deadline exceeded", 504, false);
    }

    const groupIds = group.map((g) => g.id);
    const payloadRows = await txDb
      .select({
        id: schema.listings.id,
        scope: schema.listings.scope,
      })
      .from(schema.listings)
      .where(inArray(schema.listings.id, groupIds));

    const payloadMap = new Map(payloadRows.map((p) => [p.id, p.scope]));

    for (const r of group) {
      const scope = payloadMap.get(r.id) ?? "";
      const itemStr = serializeExportRecord({
        id: r.id,
        title: r.title,
        slug: r.slug,
        status: r.status,
        summary: r.summary,
        scope,
        budgetMode: r.budgetMode,
        budgetMin: r.budgetMin,
        budgetMax: r.budgetMax,
        budgetCurrency: r.budgetCurrency,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      });
      yield `${firstListing ? "    " : ",\n    "}${itemStr}`;
      firstListing = false;
    }

    yield* streamListingGroups(groups, idx + 1);
  }

  async function* streamListingsPages(
    lastListingCreatedAtText: string | null,
    lastListingId: string | null
  ): AsyncGenerator<string, void, unknown> {
    if (signal?.aborted) {
      throw signal.reason || new ExportError("EXPORT_ABORTED", "Aborted", 400, false);
    }

    const whereClause: SQL | undefined =
      lastListingCreatedAtText !== null && lastListingId !== null
        ? and(
            eq(schema.listings.ownerUserId, userId),
            sql`(${schema.listings.createdAt}, ${schema.listings.id}) < (${lastListingCreatedAtText}::timestamptz, ${lastListingId}::uuid)`
          )
        : eq(schema.listings.ownerUserId, userId);

    const metaRows: ListingMetaRow[] = await txDb
      .select({
        id: schema.listings.id,
        title: schema.listings.title,
        slug: schema.listings.slug,
        status: schema.listings.status,
        summary: schema.listings.summary,
        budgetMode: schema.listings.budgetMode,
        budgetMin: schema.listings.budgetMin,
        budgetMax: schema.listings.budgetMax,
        budgetCurrency: schema.listings.budgetCurrency,
        createdAt: schema.listings.createdAt,
        createdAtText: sql<string>`${schema.listings.createdAt}::text`,
        updatedAt: schema.listings.updatedAt,
        byteLen: sql<number>`octet_length(${schema.listings.scope}) + coalesce(octet_length(${schema.listings.answersJson}::text), 0)`,
      })
      .from(schema.listings)
      .where(whereClause)
      .orderBy(desc(schema.listings.createdAt), desc(schema.listings.id))
      .limit(PAGE_SIZE);

    if (metaRows.length === 0) return;

    // Validate single record size BEFORE fetching any heavy payload into memory
    for (const r of metaRows) {
      if ((Number(r.byteLen) || 0) + METADATA_PADDING_BYTES > MAX_RECORD_BYTES) {
        throw new ExportError(
          "EXPORT_RECORD_TOO_LARGE",
          `Single listing '${r.id}' exceeded maximum supported limit of 10 MiB (${r.byteLen} bytes payload)`,
          413,
          false
        );
      }
    }

    if (options?.onProgress) {
      await options.onProgress({
        section: "listings",
        page: ++listingPageCount,
        rowCount: metaRows.length,
      });
    }

    // Group into batches of at most 16 MiB payload to bound resident memory
    const groups: ListingMetaRow[][] = [];
    let currentGroup: ListingMetaRow[] = [];
    let currentGroupBytes = 0;

    for (const row of metaRows) {
      const rowLen = Number(row.byteLen || 0);
      if (currentGroup.length > 0 && currentGroupBytes + rowLen > MAX_PAYLOAD_GROUP_BYTES) {
        groups.push(currentGroup);
        currentGroup = [];
        currentGroupBytes = 0;
      }
      currentGroup.push(row);
      currentGroupBytes += rowLen;
    }
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    yield* streamListingGroups(groups, 0);

    if (metaRows.length < PAGE_SIZE) return;

    const last = metaRows[metaRows.length - 1];
    if (last) {
      yield* streamListingsPages(last.createdAtText, last.id);
    }
  }

  yield* streamListingsPages(null, null);
  yield `\n  ],\n`;

  if (options?.onSection) await options.onSection("listings");
  if (signal?.aborted) {
    throw signal.reason || new ExportError("EXPORT_ABORTED", "Aborted", 400, false);
  }
}

/**
 * Reads listing revisions with direct JOIN keyset pagination and stream streaming for large snapshots.
 */
export async function* readListingRevisionsData(
  ctx: ExportReaderContext
): AsyncGenerator<string, void, unknown> {
  const { txDb, userId, options, signal, getRemainingMs } = ctx;

  yield `  "listingRevisions": [\n`;
  let firstLRev = true;
  let lRevPageCount = 0;

  type RevisionMetaRow = {
    id: string;
    listingId: string;
    editorUserId: string;
    revisionNo: number;
    createdAt: Date;
    createdAtText: string;
    byteLen: number;
  };

  async function* streamRevisionGroups(
    groups: RevisionMetaRow[][],
    idx: number
  ): AsyncGenerator<string, void, unknown> {
    if (idx >= groups.length) return;
    const group = groups[idx];
    if (!group) return;
    if (signal?.aborted) {
      throw signal.reason || new ExportError("EXPORT_ABORTED", "Aborted", 400, false);
    }
    if (getRemainingMs() <= 0) {
      throw new ExportError("EXPORT_TIMEOUT", "Deadline exceeded", 504, false);
    }

    const groupIds = group.map((g) => g.id);
    const payloadRows = await txDb
      .select({
        id: schema.listingRevisions.id,
        snapshotJson: sql<string>`${schema.listingRevisions.snapshotJson}::text`,
      })
      .from(schema.listingRevisions)
      .where(inArray(schema.listingRevisions.id, groupIds));

    const payloadMap = new Map(payloadRows.map((p) => [p.id, p.snapshotJson]));

    for (const r of group) {
      const snapshotJson = payloadMap.get(r.id);
      if (snapshotJson === undefined) throw new Error("Export snapshot row missing");
      yield firstLRev ? "    " : ",\n    ";
      yield* streamRecordWithJsonPayload(
        {
          id: r.id,
          listingId: r.listingId,
          editorUserId: r.editorUserId,
          revisionNo: r.revisionNo,
          createdAt: r.createdAt.toISOString(),
        },
        "snapshotJson",
        snapshotJson,
        MAX_RECORD_BYTES
      );
      payloadMap.delete(r.id);
      firstLRev = false;
    }

    yield* streamRevisionGroups(groups, idx + 1);
  }

  async function* streamRevisionPages(
    lastLRevCreatedAtText: string | null,
    lastLRevId: string | null
  ): AsyncGenerator<string, void, unknown> {
    if (signal?.aborted) {
      throw signal.reason || new ExportError("EXPORT_ABORTED", "Aborted", 400, false);
    }
    if (getRemainingMs() <= 0) {
      throw new ExportError("EXPORT_TIMEOUT", "Deadline exceeded", 504, false);
    }

    const whereClause: SQL | undefined =
      lastLRevCreatedAtText !== null && lastLRevId !== null
        ? and(
            eq(schema.listings.ownerUserId, userId),
            sql`(${schema.listingRevisions.createdAt}, ${schema.listingRevisions.id}) < (${lastLRevCreatedAtText}::timestamptz, ${lastLRevId}::uuid)`
          )
        : eq(schema.listings.ownerUserId, userId);

    const metaRows: RevisionMetaRow[] = await txDb
      .select({
        id: schema.listingRevisions.id,
        listingId: schema.listingRevisions.listingId,
        editorUserId: schema.listingRevisions.editorUserId,
        revisionNo: schema.listingRevisions.revisionNo,
        createdAt: schema.listingRevisions.createdAt,
        createdAtText: sql<string>`${schema.listingRevisions.createdAt}::text`,
        byteLen: sql<number>`octet_length(${schema.listingRevisions.snapshotJson}::text)`,
      })
      .from(schema.listingRevisions)
      .innerJoin(schema.listings, eq(schema.listingRevisions.listingId, schema.listings.id))
      .where(whereClause)
      .orderBy(desc(schema.listingRevisions.createdAt), desc(schema.listingRevisions.id))
      .limit(REVISION_PAGE_SIZE);

    if (metaRows.length === 0) return;

    for (const r of metaRows) {
      if ((Number(r.byteLen) || 0) + METADATA_PADDING_BYTES > MAX_RECORD_BYTES) {
        throw new ExportError(
          "EXPORT_RECORD_TOO_LARGE",
          `Single listing revision '${r.id}' exceeded maximum supported limit of 10 MiB (${r.byteLen} bytes payload)`,
          413,
          false
        );
      }
    }

    if (options?.onProgress) {
      await options.onProgress({
        section: "listingRevisions",
        page: ++lRevPageCount,
        rowCount: metaRows.length,
      });
    }

    const groups: RevisionMetaRow[][] = [];
    let currentGroup: RevisionMetaRow[] = [];
    let currentGroupBytes = 0;

    for (const row of metaRows) {
      const rowLen = Number(row.byteLen || 0);
      if (currentGroup.length > 0 && currentGroupBytes + rowLen > MAX_PAYLOAD_GROUP_BYTES) {
        groups.push(currentGroup);
        currentGroup = [];
        currentGroupBytes = 0;
      }
      currentGroup.push(row);
      currentGroupBytes += rowLen;
    }
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    yield* streamRevisionGroups(groups, 0);

    if (metaRows.length < REVISION_PAGE_SIZE) return;

    const last = metaRows[metaRows.length - 1];
    if (last) {
      yield* streamRevisionPages(last.createdAtText, last.id);
    }
  }

  yield* streamRevisionPages(null, null);
  yield `\n  ],\n`;

  if (options?.onSection) await options.onSection("listingRevisions");
  if (signal?.aborted) {
    throw signal.reason || new ExportError("EXPORT_ABORTED", "Aborted", 400, false);
  }
}
