import { and, desc, eq, getTableColumns, or, sql, type SQL } from "drizzle-orm";
import { schema } from "@/src/lib/db";
import { ExportError } from "../export-errors";
import {
  PAGE_SIZE,
  serializeExportRecord,
  type EngagementRow,
  type EndorsementRow,
  type ExportReaderContext,
} from "./types";

/**
 * Reads user engagements (as owner or freelancer) with keyset pagination.
 */
export async function* readEngagementsData(
  ctx: ExportReaderContext
): AsyncGenerator<string, void, unknown> {
  const { txDb, userId, options, signal } = ctx;

  yield `  "engagements": [\n`;
  let firstEngage = true;
  let engagePageCount = 0;

  async function* streamEngagementsPages(
    lastEngageMatchedAtText: string | null,
    lastEngageId: string | null
  ): AsyncGenerator<string, void, unknown> {
    if (signal?.aborted) {
      throw signal.reason || new ExportError("EXPORT_ABORTED", "Aborted", 400, false);
    }

    const baseCond = or(
      eq(schema.engagements.ownerUserId, userId),
      eq(schema.engagements.freelancerUserId, userId)
    );
    const whereClause: SQL | undefined =
      lastEngageMatchedAtText !== null && lastEngageId !== null
        ? and(
            baseCond,
            sql`(${schema.engagements.matchedAt}, ${schema.engagements.id}) < (${lastEngageMatchedAtText}::timestamptz, ${lastEngageId}::uuid)`
          )
        : baseCond;

    const engagePage: EngagementRow[] = await txDb
      .select({
        ...getTableColumns(schema.engagements),
        matchedAtText: sql<string>`${schema.engagements.matchedAt}::text`,
      })
      .from(schema.engagements)
      .where(whereClause)
      .orderBy(desc(schema.engagements.matchedAt), desc(schema.engagements.id))
      .limit(PAGE_SIZE);

    if (engagePage.length === 0) return;
    if (options?.onProgress) {
      await options.onProgress({
        section: "engagements",
        page: ++engagePageCount,
        rowCount: engagePage.length,
      });
    }

    for (const e of engagePage) {
      const itemStr = serializeExportRecord({
        id: e.id,
        listingId: e.listingId,
        acceptedOfferId: e.acceptedOfferId,
        ownerUserId: e.ownerUserId,
        freelancerUserId: e.freelancerUserId,
        status: e.status,
        matchedAt: e.matchedAt.toISOString(),
        completedAt: e.completedAt ? e.completedAt.toISOString() : null,
        cancelledAt: e.cancelledAt ? e.cancelledAt.toISOString() : null,
        listingTitleSnapshot: e.listingTitleSnapshot,
        listingCategorySnapshot: e.listingCategorySnapshot,
      });
      yield `${firstEngage ? "    " : ",\n    "}${itemStr}`;
      firstEngage = false;
    }

    if (engagePage.length < PAGE_SIZE) return;

    const last = engagePage[engagePage.length - 1];
    if (last) {
      yield* streamEngagementsPages(last.matchedAtText, last.id);
    }
  }

  yield* streamEngagementsPages(null, null);
  yield `\n  ],\n`;

  if (options?.onSection) await options.onSection("engagements");
  if (signal?.aborted) {
    throw signal.reason || new ExportError("EXPORT_ABORTED", "Aborted", 400, false);
  }
}

/**
 * Reads authored and received endorsements with keyset pagination.
 */
export async function* readEndorsementsData(
  ctx: ExportReaderContext
): AsyncGenerator<string, void, unknown> {
  const { txDb, userId, options, signal } = ctx;

  // 1. Authored endorsements
  yield `  "endorsements": {\n    "authored": [\n`;
  let firstAuthored = true;
  let authEndPageCount = 0;

  async function* streamAuthoredPages(
    lastAuthoredCreatedAtText: string | null,
    lastAuthoredId: string | null
  ): AsyncGenerator<string, void, unknown> {
    if (signal?.aborted) {
      throw signal.reason || new ExportError("EXPORT_ABORTED", "Aborted", 400, false);
    }

    const whereClause: SQL | undefined =
      lastAuthoredCreatedAtText !== null && lastAuthoredId !== null
        ? and(
            eq(schema.endorsements.authorUserId, userId),
            sql`(${schema.endorsements.createdAt}, ${schema.endorsements.id}) < (${lastAuthoredCreatedAtText}::timestamptz, ${lastAuthoredId}::uuid)`
          )
        : eq(schema.endorsements.authorUserId, userId);

    const authoredPage: EndorsementRow[] = await txDb
      .select({
        ...getTableColumns(schema.endorsements),
        createdAtText: sql<string>`${schema.endorsements.createdAt}::text`,
      })
      .from(schema.endorsements)
      .where(whereClause)
      .orderBy(desc(schema.endorsements.createdAt), desc(schema.endorsements.id))
      .limit(PAGE_SIZE);

    if (authoredPage.length === 0) return;
    if (options?.onProgress) {
      await options.onProgress({
        section: "endorsements.authored",
        page: ++authEndPageCount,
        rowCount: authoredPage.length,
      });
    }

    for (const e of authoredPage) {
      const itemStr = serializeExportRecord({
        id: e.id,
        engagementId: e.engagementId,
        recipientUserId: e.recipientUserId,
        content: e.content,
        projectTitleSnapshot: e.projectTitleSnapshot,
        createdAt: e.createdAt.toISOString(),
      });
      yield `${firstAuthored ? "      " : ",\n      "}${itemStr}`;
      firstAuthored = false;
    }

    if (authoredPage.length < PAGE_SIZE) return;

    const last = authoredPage[authoredPage.length - 1];
    if (last) {
      yield* streamAuthoredPages(last.createdAtText, last.id);
    }
  }

  yield* streamAuthoredPages(null, null);

  // 2. Received endorsements
  yield `\n    ],\n    "received": [\n`;
  let firstReceived = true;
  let recEndPageCount = 0;

  async function* streamReceivedPages(
    lastReceivedCreatedAtText: string | null,
    lastReceivedId: string | null
  ): AsyncGenerator<string, void, unknown> {
    if (signal?.aborted) {
      throw signal.reason || new ExportError("EXPORT_ABORTED", "Aborted", 400, false);
    }

    const whereClause: SQL | undefined =
      lastReceivedCreatedAtText !== null && lastReceivedId !== null
        ? and(
            eq(schema.endorsements.recipientUserId, userId),
            sql`(${schema.endorsements.createdAt}, ${schema.endorsements.id}) < (${lastReceivedCreatedAtText}::timestamptz, ${lastReceivedId}::uuid)`
          )
        : eq(schema.endorsements.recipientUserId, userId);

    const receivedPage: EndorsementRow[] = await txDb
      .select({
        ...getTableColumns(schema.endorsements),
        createdAtText: sql<string>`${schema.endorsements.createdAt}::text`,
      })
      .from(schema.endorsements)
      .where(whereClause)
      .orderBy(desc(schema.endorsements.createdAt), desc(schema.endorsements.id))
      .limit(PAGE_SIZE);

    if (receivedPage.length === 0) return;
    if (options?.onProgress) {
      await options.onProgress({
        section: "endorsements.received",
        page: ++recEndPageCount,
        rowCount: receivedPage.length,
      });
    }

    for (const e of receivedPage) {
      const itemStr = serializeExportRecord({
        id: e.id,
        engagementId: e.engagementId,
        authorUserId: e.authorUserId,
        content: e.content,
        projectTitleSnapshot: e.projectTitleSnapshot,
        createdAt: e.createdAt.toISOString(),
      });
      yield `${firstReceived ? "      " : ",\n      "}${itemStr}`;
      firstReceived = false;
    }

    if (receivedPage.length < PAGE_SIZE) return;

    const last = receivedPage[receivedPage.length - 1];
    if (last) {
      yield* streamReceivedPages(last.createdAtText, last.id);
    }
  }

  yield* streamReceivedPages(null, null);
  yield `\n    ]\n  },\n`;

  if (options?.onSection) await options.onSection("endorsements");
  if (signal?.aborted) {
    throw signal.reason || new ExportError("EXPORT_ABORTED", "Aborted", 400, false);
  }
}
