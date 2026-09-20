import { and, desc, eq, getTableColumns, inArray, sql, type SQL } from "drizzle-orm";
import { schema } from "@/src/lib/db";
import { ExportError } from "../export-errors";
import {
  PAGE_SIZE,
  MAX_RECORD_BYTES,
  METADATA_PADDING_BYTES,
  MAX_PAYLOAD_GROUP_BYTES,
  serializeExportRecord,
  type CategoryFollowRow,
  type ExportReaderContext,
  type LegalAcceptanceRow,
  type OfferTemplateRow,
  type SecurityEventRow,
} from "./types";

/**
 * Reads followed categories with keyset pagination.
 */
export async function* readCategoryFollowsData(
  ctx: ExportReaderContext
): AsyncGenerator<string, void, unknown> {
  const { txDb, userId, options, signal } = ctx;

  yield `  "categoryFollows": [\n`;
  let lastCategoryCreatedAtText: string | null = null;
  let lastCategoryId: string | null = null;
  let firstCategory = true;
  let catPageCount = 0;

  while (true) {
    if (signal?.aborted) {
      throw signal.reason || new ExportError("EXPORT_ABORTED", "Aborted", 400, false);
    }

    const whereClause: SQL | undefined =
      lastCategoryCreatedAtText !== null && lastCategoryId !== null
        ? and(
            eq(schema.categoryFollows.userId, userId),
            sql`(${schema.categoryFollows.createdAt}, ${schema.categoryFollows.categoryId}) < (${lastCategoryCreatedAtText}::timestamptz, ${lastCategoryId})`
          )
        : eq(schema.categoryFollows.userId, userId);

    const categoryPage: CategoryFollowRow[] = await txDb
      .select({
        categoryId: schema.categoryFollows.categoryId,
        createdAt: schema.categoryFollows.createdAt,
        createdAtText: sql<string>`${schema.categoryFollows.createdAt}::text`,
      })
      .from(schema.categoryFollows)
      .where(whereClause)
      .orderBy(desc(schema.categoryFollows.createdAt), desc(schema.categoryFollows.categoryId))
      .limit(PAGE_SIZE);

    if (categoryPage.length === 0) break;
    if (options?.onProgress) {
      await options.onProgress({
        section: "categoryFollows",
        page: ++catPageCount,
        rowCount: categoryPage.length,
      });
    }

    for (const cf of categoryPage) {
      const itemStr = serializeExportRecord({
        categoryId: cf.categoryId,
        createdAt: cf.createdAt.toISOString(),
      });
      yield `${firstCategory ? "    " : ",\n    "}${itemStr}`;
      firstCategory = false;
    }

    const last = categoryPage[categoryPage.length - 1]!;
    lastCategoryCreatedAtText = last.createdAtText;
    lastCategoryId = last.categoryId;
  }
  yield `\n  ],\n`;

  if (options?.onSection) await options.onSection("categoryFollows");
  if (signal?.aborted) {
    throw signal.reason || new ExportError("EXPORT_ABORTED", "Aborted", 400, false);
  }
}

/**
 * Reads user saved offer templates with keyset pagination.
 */
export async function* readOfferTemplatesData(
  ctx: ExportReaderContext
): AsyncGenerator<string, void, unknown> {
  const { txDb, userId, options, signal } = ctx;

  yield `  "offerTemplates": [\n`;
  let lastTemplateCreatedAtText: string | null = null;
  let lastTemplateId: string | null = null;
  let firstTemplate = true;
  let tmplPageCount = 0;

  while (true) {
    if (signal?.aborted) {
      throw signal.reason || new ExportError("EXPORT_ABORTED", "Aborted", 400, false);
    }

    const whereClause: SQL | undefined =
      lastTemplateCreatedAtText !== null && lastTemplateId !== null
        ? and(
            eq(schema.offerTemplates.userId, userId),
            sql`(${schema.offerTemplates.createdAt}, ${schema.offerTemplates.id}) < (${lastTemplateCreatedAtText}::timestamptz, ${lastTemplateId}::uuid)`
          )
        : eq(schema.offerTemplates.userId, userId);

    const templatePage: OfferTemplateRow[] = await txDb
      .select({
        ...getTableColumns(schema.offerTemplates),
        createdAtText: sql<string>`${schema.offerTemplates.createdAt}::text`,
      })
      .from(schema.offerTemplates)
      .where(whereClause)
      .orderBy(desc(schema.offerTemplates.createdAt), desc(schema.offerTemplates.id))
      .limit(PAGE_SIZE);

    if (templatePage.length === 0) break;
    if (options?.onProgress) {
      await options.onProgress({
        section: "offerTemplates",
        page: ++tmplPageCount,
        rowCount: templatePage.length,
      });
    }

    for (const t of templatePage) {
      const itemStr = serializeExportRecord({
        id: t.id,
        userId: t.userId,
        name: t.name,
        message: t.message,
        budgetCurrency: t.budgetCurrency,
        budgetMin: t.budgetMin,
        budgetMax: t.budgetMax,
        estimatedDurationValue: t.estimatedDurationValue,
        estimatedDurationUnit: t.estimatedDurationUnit,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      });
      yield `${firstTemplate ? "    " : ",\n    "}${itemStr}`;
      firstTemplate = false;
    }

    const last = templatePage[templatePage.length - 1]!;
    lastTemplateCreatedAtText = last.createdAtText;
    lastTemplateId = last.id;
  }
  yield `\n  ],\n`;

  if (options?.onSection) await options.onSection("offerTemplates");
  if (signal?.aborted) {
    throw signal.reason || new ExportError("EXPORT_ABORTED", "Aborted", 400, false);
  }
}

/**
 * Reads notifications with two-phase fetch and 16 MiB payload batching.
 */
export async function* readNotificationsData(
  ctx: ExportReaderContext
): AsyncGenerator<string, void, unknown> {
  const { txDb, userId, options, signal, getRemainingMs } = ctx;

  yield `  "notifications": [\n`;
  let lastNotifCreatedAtText: string | null = null;
  let lastNotifId: string | null = null;
  let firstNotif = true;
  let notifPageCount = 0;

  while (true) {
    if (signal?.aborted) {
      throw signal.reason || new ExportError("EXPORT_ABORTED", "Aborted", 400, false);
    }

    const whereClause: SQL | undefined =
      lastNotifCreatedAtText !== null && lastNotifId !== null
        ? and(
            eq(schema.notifications.userId, userId),
            sql`(${schema.notifications.createdAt}, ${schema.notifications.id}) < (${lastNotifCreatedAtText}::timestamptz, ${lastNotifId}::uuid)`
          )
        : eq(schema.notifications.userId, userId);

    // Phase 1: Pre-fetch metadata, keyset, and payload byte length WITHOUT fetching large JSON
    const metaRows = await txDb
      .select({
        id: schema.notifications.id,
        type: schema.notifications.type,
        readAt: schema.notifications.readAt,
        createdAt: schema.notifications.createdAt,
        createdAtText: sql<string>`${schema.notifications.createdAt}::text`,
        byteLen: sql<number>`octet_length(${schema.notifications.payloadJson}::text)`,
      })
      .from(schema.notifications)
      .where(whereClause)
      .orderBy(desc(schema.notifications.createdAt), desc(schema.notifications.id))
      .limit(PAGE_SIZE);

    if (metaRows.length === 0) break;

    // Validate single record size with metadata padding BEFORE fetching any payload into memory
    for (const r of metaRows) {
      if ((Number(r.byteLen) || 0) + METADATA_PADDING_BYTES > MAX_RECORD_BYTES) {
        throw new ExportError(
          "EXPORT_RECORD_TOO_LARGE",
          `Single notification record '${r.id}' exceeded maximum supported limit of 10 MiB (${r.byteLen} bytes payload)`,
          413,
          false
        );
      }
    }

    if (options?.onProgress) {
      await options.onProgress({
        section: "notifications",
        page: ++notifPageCount,
        rowCount: metaRows.length,
      });
    }

    // Phase 2: Group into batches of at most 16 MiB payload to bound resident memory
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
          id: schema.notifications.id,
          payloadJson: schema.notifications.payloadJson,
        })
        .from(schema.notifications)
        .where(inArray(schema.notifications.id, groupIds));

      const payloadMap = new Map(payloadRows.map((p) => [p.id, p.payloadJson]));

      for (const n of group) {
        const payloadJson = payloadMap.get(n.id);
        const itemStr = serializeExportRecord({
          id: n.id,
          type: n.type,
          payloadJson,
          readAt: n.readAt ? n.readAt.toISOString() : null,
          createdAt: n.createdAt.toISOString(),
        });
        yield `${firstNotif ? "    " : ",\n    "}${itemStr}`;
        firstNotif = false;
      }
    }

    const last = metaRows[metaRows.length - 1]!;
    lastNotifCreatedAtText = last.createdAtText;
    lastNotifId = last.id;
  }
  yield `\n  ],\n`;

  if (options?.onSection) await options.onSection("notifications");
  if (signal?.aborted) {
    throw signal.reason || new ExportError("EXPORT_ABORTED", "Aborted", 400, false);
  }
}

/**
 * Reads legal document acceptances with keyset pagination.
 */
export async function* readLegalAcceptancesData(
  ctx: ExportReaderContext
): AsyncGenerator<string, void, unknown> {
  const { txDb, userId, options, signal } = ctx;

  yield `  "legalAcceptances": [\n`;
  let lastLegalAcceptedAtText: string | null = null;
  let lastLegalDocKey: string | null = null;
  let firstLegal = true;
  let legalPageCount = 0;

  while (true) {
    if (signal?.aborted) {
      throw signal.reason || new ExportError("EXPORT_ABORTED", "Aborted", 400, false);
    }

    const whereClause: SQL | undefined =
      lastLegalAcceptedAtText !== null && lastLegalDocKey !== null
        ? and(
            eq(schema.legalAcceptances.userId, userId),
            sql`(${schema.legalAcceptances.acceptedAt}, ${schema.legalAcceptances.documentKey}) < (${lastLegalAcceptedAtText}::timestamptz, ${lastLegalDocKey})`
          )
        : eq(schema.legalAcceptances.userId, userId);

    const legalPage: LegalAcceptanceRow[] = await txDb
      .select({
        documentKey: schema.legalAcceptances.documentKey,
        documentVersion: schema.legalAcceptances.documentVersion,
        contentHash: schema.legalAcceptances.contentHash,
        acceptedAt: schema.legalAcceptances.acceptedAt,
        acceptedAtText: sql<string>`${schema.legalAcceptances.acceptedAt}::text`,
      })
      .from(schema.legalAcceptances)
      .where(whereClause)
      .orderBy(
        desc(schema.legalAcceptances.acceptedAt),
        desc(schema.legalAcceptances.documentKey)
      )
      .limit(PAGE_SIZE);

    if (legalPage.length === 0) break;
    if (options?.onProgress) {
      await options.onProgress({
        section: "legalAcceptances",
        page: ++legalPageCount,
        rowCount: legalPage.length,
      });
    }

    for (const l of legalPage) {
      const itemStr = serializeExportRecord({
        documentKey: l.documentKey,
        documentVersion: l.documentVersion,
        contentHash: l.contentHash,
        acceptedAt: l.acceptedAt.toISOString(),
      });
      yield `${firstLegal ? "    " : ",\n    "}${itemStr}`;
      firstLegal = false;
    }

    const last = legalPage[legalPage.length - 1]!;
    lastLegalAcceptedAtText = last.acceptedAtText;
    lastLegalDocKey = last.documentKey;
  }
  yield `\n  ],\n`;

  if (options?.onSection) await options.onSection("legalAcceptances");
  if (signal?.aborted) {
    throw signal.reason || new ExportError("EXPORT_ABORTED", "Aborted", 400, false);
  }
}

/**
 * Reads security log audit events with keyset pagination.
 */
export async function* readSecurityLogData(
  ctx: ExportReaderContext
): AsyncGenerator<string, void, unknown> {
  const { txDb, userId, options, signal } = ctx;

  yield `  "securityLog": [\n`;
  let lastSecCreatedAtText: string | null = null;
  let lastSecId: string | null = null;
  let firstSec = true;
  let secPageCount = 0;

  while (true) {
    if (signal?.aborted) {
      throw signal.reason || new ExportError("EXPORT_ABORTED", "Aborted", 400, false);
    }

    const whereClause: SQL | undefined =
      lastSecCreatedAtText !== null && lastSecId !== null
        ? and(
            eq(schema.securityEvents.userId, userId),
            sql`(${schema.securityEvents.createdAt}, ${schema.securityEvents.id}) < (${lastSecCreatedAtText}::timestamptz, ${lastSecId}::uuid)`
          )
        : eq(schema.securityEvents.userId, userId);

    const secPage: SecurityEventRow[] = await txDb
      .select({
        id: schema.securityEvents.id,
        eventType: schema.securityEvents.eventType,
        ipAddress: schema.securityEvents.ipAddress,
        createdAt: schema.securityEvents.createdAt,
        createdAtText: sql<string>`${schema.securityEvents.createdAt}::text`,
      })
      .from(schema.securityEvents)
      .where(whereClause)
      .orderBy(desc(schema.securityEvents.createdAt), desc(schema.securityEvents.id))
      .limit(PAGE_SIZE);

    if (secPage.length === 0) break;
    if (options?.onProgress) {
      await options.onProgress({
        section: "securityLog",
        page: ++secPageCount,
        rowCount: secPage.length,
      });
    }

    for (const s of secPage) {
      const itemStr = serializeExportRecord({
        id: s.id,
        eventType: s.eventType,
        ipAddress: s.ipAddress,
        createdAt: s.createdAt.toISOString(),
      });
      yield `${firstSec ? "    " : ",\n    "}${itemStr}`;
      firstSec = false;
    }

    const last = secPage[secPage.length - 1]!;
    lastSecCreatedAtText = last.createdAtText;
    lastSecId = last.id;
  }
  yield `\n  ]\n`;

  if (options?.onSection) await options.onSection("securityLog");
  if (signal?.aborted) {
    throw signal.reason || new ExportError("EXPORT_ABORTED", "Aborted", 400, false);
  }
}
