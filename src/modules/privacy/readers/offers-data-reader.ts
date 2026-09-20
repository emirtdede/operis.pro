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
 * Reads user submitted offers with keyset pagination and bounded payload grouping.
 */
export async function* readOffersData(
  ctx: ExportReaderContext
): AsyncGenerator<string, void, unknown> {
  const { txDb, userId, options, signal, getRemainingMs } = ctx;

  yield `  "offers": [\n`;
  let lastOfferCreatedAtText: string | null = null;
  let lastOfferId: string | null = null;
  let firstOffer = true;
  let offerPageCount = 0;

  while (true) {
    if (signal?.aborted) {
      throw signal.reason || new ExportError("EXPORT_ABORTED", "Aborted", 400, false);
    }

    const whereClause: SQL | undefined =
      lastOfferCreatedAtText !== null && lastOfferId !== null
        ? and(
            eq(schema.offers.offerorUserId, userId),
            sql`(${schema.offers.createdAt}, ${schema.offers.id}) < (${lastOfferCreatedAtText}::timestamptz, ${lastOfferId}::uuid)`
          )
        : eq(schema.offers.offerorUserId, userId);

    const metaRows = await txDb
      .select({
        id: schema.offers.id,
        listingId: schema.offers.listingId,
        listingActivationSeq: schema.offers.listingActivationSeq,
        status: schema.offers.status,
        budgetCurrency: schema.offers.budgetCurrency,
        budgetMin: schema.offers.budgetMin,
        budgetMax: schema.offers.budgetMax,
        estimatedDurationValue: schema.offers.estimatedDurationValue,
        estimatedDurationUnit: schema.offers.estimatedDurationUnit,
        rejectionCode: schema.offers.rejectionCode,
        createdAt: schema.offers.createdAt,
        createdAtText: sql<string>`${schema.offers.createdAt}::text`,
        updatedAt: schema.offers.updatedAt,
        resolvedAt: schema.offers.resolvedAt,
        byteLen: sql<number>`octet_length(${schema.offers.message}) + coalesce(octet_length(${schema.offers.rejectionNote}), 0)`,
      })
      .from(schema.offers)
      .where(whereClause)
      .orderBy(desc(schema.offers.createdAt), desc(schema.offers.id))
      .limit(PAGE_SIZE);

    if (metaRows.length === 0) break;

    for (const r of metaRows) {
      if ((Number(r.byteLen) || 0) + METADATA_PADDING_BYTES > MAX_RECORD_BYTES) {
        throw new ExportError(
          "EXPORT_RECORD_TOO_LARGE",
          `Single offer '${r.id}' exceeded maximum supported limit of 10 MiB (${r.byteLen} bytes payload)`,
          413,
          false
        );
      }
    }

    if (options?.onProgress) {
      await options.onProgress({
        section: "offers",
        page: ++offerPageCount,
        rowCount: metaRows.length,
      });
    }

    const groups: (typeof metaRows)[] = [];
    let currentGroup: typeof metaRows = [];
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

    for (const group of groups) {
      if (signal?.aborted) {
        throw signal.reason || new ExportError("EXPORT_ABORTED", "Aborted", 400, false);
      }
      if (getRemainingMs() <= 0) {
        throw new ExportError("EXPORT_TIMEOUT", "Deadline exceeded", 504, false);
      }

      const groupIds = group.map((g) => g.id);
      const payloadRows = await txDb
        .select({
          id: schema.offers.id,
          message: schema.offers.message,
          rejectionNote: schema.offers.rejectionNote,
        })
        .from(schema.offers)
        .where(inArray(schema.offers.id, groupIds));

      const payloadMap = new Map(
        payloadRows.map((p) => [p.id, { message: p.message, rejectionNote: p.rejectionNote }])
      );

      for (const r of group) {
        const payload = payloadMap.get(r.id);
        const itemStr = serializeExportRecord({
          id: r.id,
          listingId: r.listingId,
          listingActivationSeq: r.listingActivationSeq,
          status: r.status,
          message: payload?.message ?? "",
          budgetCurrency: r.budgetCurrency,
          budgetMin: r.budgetMin,
          budgetMax: r.budgetMax,
          estimatedDurationValue: r.estimatedDurationValue,
          estimatedDurationUnit: r.estimatedDurationUnit,
          rejectionCode: r.rejectionCode,
          rejectionNote: payload?.rejectionNote ?? null,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
          resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : null,
        });
        yield `${firstOffer ? "    " : ",\n    "}${itemStr}`;
        firstOffer = false;
      }
    }

    const last = metaRows[metaRows.length - 1]!;
    lastOfferCreatedAtText = last.createdAtText;
    lastOfferId = last.id;
  }
  yield `\n  ],\n`;

  if (options?.onSection) await options.onSection("offers");
  if (signal?.aborted) {
    throw signal.reason || new ExportError("EXPORT_ABORTED", "Aborted", 400, false);
  }
}

/**
 * Reads offer revisions with direct JOIN keyset pagination and stream streaming for large snapshots.
 */
export async function* readOfferRevisionsData(
  ctx: ExportReaderContext
): AsyncGenerator<string, void, unknown> {
  const { txDb, userId, options, signal, getRemainingMs } = ctx;

  yield `  "offerRevisions": [\n`;
  let lastORevCreatedAtText: string | null = null;
  let lastORevId: string | null = null;
  let firstORev = true;
  let oRevPageCount = 0;

  while (true) {
    if (signal?.aborted) {
      throw signal.reason || new ExportError("EXPORT_ABORTED", "Aborted", 400, false);
    }
    if (getRemainingMs() <= 0) {
      throw new ExportError("EXPORT_TIMEOUT", "Deadline exceeded", 504, false);
    }

    const whereClause: SQL | undefined =
      lastORevCreatedAtText !== null && lastORevId !== null
        ? and(
            eq(schema.offers.offerorUserId, userId),
            sql`(${schema.offerRevisions.createdAt}, ${schema.offerRevisions.id}) < (${lastORevCreatedAtText}::timestamptz, ${lastORevId}::uuid)`
          )
        : eq(schema.offers.offerorUserId, userId);

    const metaRows = await txDb
      .select({
        id: schema.offerRevisions.id,
        offerId: schema.offerRevisions.offerId,
        revisionNo: schema.offerRevisions.revisionNo,
        createdAt: schema.offerRevisions.createdAt,
        createdAtText: sql<string>`${schema.offerRevisions.createdAt}::text`,
        byteLen: sql<number>`octet_length(${schema.offerRevisions.snapshotJson}::text)`,
      })
      .from(schema.offerRevisions)
      .innerJoin(schema.offers, eq(schema.offerRevisions.offerId, schema.offers.id))
      .where(whereClause)
      .orderBy(desc(schema.offerRevisions.createdAt), desc(schema.offerRevisions.id))
      .limit(REVISION_PAGE_SIZE);

    if (metaRows.length === 0) break;

    for (const r of metaRows) {
      if ((Number(r.byteLen) || 0) + METADATA_PADDING_BYTES > MAX_RECORD_BYTES) {
        throw new ExportError(
          "EXPORT_RECORD_TOO_LARGE",
          `Single offer revision '${r.id}' exceeded maximum supported limit of 10 MiB (${r.byteLen} bytes payload)`,
          413,
          false
        );
      }
    }

    if (options?.onProgress) {
      await options.onProgress({
        section: "offerRevisions",
        page: ++oRevPageCount,
        rowCount: metaRows.length,
      });
    }

    const groups: (typeof metaRows)[] = [];
    let currentGroup: typeof metaRows = [];
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

    for (const group of groups) {
      if (signal?.aborted) {
        throw signal.reason || new ExportError("EXPORT_ABORTED", "Aborted", 400, false);
      }
      if (getRemainingMs() <= 0) {
        throw new ExportError("EXPORT_TIMEOUT", "Deadline exceeded", 504, false);
      }

      const groupIds = group.map((g) => g.id);
      const payloadRows = await txDb
        .select({
          id: schema.offerRevisions.id,
          snapshotJson: sql<string>`${schema.offerRevisions.snapshotJson}::text`,
        })
        .from(schema.offerRevisions)
        .where(inArray(schema.offerRevisions.id, groupIds));

      const payloadMap = new Map(payloadRows.map((p) => [p.id, p.snapshotJson]));

      for (const r of group) {
        const snapshotJson = payloadMap.get(r.id);
        if (snapshotJson === undefined) throw new Error("Export snapshot row missing");
        yield firstORev ? "    " : ",\n    ";
        yield* streamRecordWithJsonPayload(
          {
            id: r.id,
            offerId: r.offerId,
            revisionNo: r.revisionNo,
            createdAt: r.createdAt.toISOString(),
          },
          "snapshotJson",
          snapshotJson,
          MAX_RECORD_BYTES
        );
        payloadMap.delete(r.id);
        firstORev = false;
      }
    }

    const last = metaRows[metaRows.length - 1]!;
    lastORevCreatedAtText = last.createdAtText;
    lastORevId = last.id;
  }
  yield `\n  ],\n`;

  if (options?.onSection) await options.onSection("offerRevisions");
  if (signal?.aborted) {
    throw signal.reason || new ExportError("EXPORT_ABORTED", "Aborted", 400, false);
  }
}
