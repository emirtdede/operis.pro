import { and, asc, eq, sql, type SQL } from "drizzle-orm";
import { schema } from "@/src/lib/db";
import { resolveUserEmail } from "@/src/modules/auth/email-identity";
import { decryptEnvelopeV2 } from "@/src/lib/crypto/envelope";
import { ExportError } from "../export-errors";
import {
  PAGE_SIZE,
  serializeExportRecord,
  type ExportReaderContext,
  type LinkRow,
} from "./types";

/**
 * Reads user core identity and yields top-level JSON preamble.
 */
export async function* readUserData(
  ctx: ExportReaderContext,
  snapshotStartedAt: Date
): AsyncGenerator<string, void, unknown> {
  const { txDb, userId, options, signal } = ctx;

  const [userRow] = await txDb
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  if (!userRow) {
    throw new ExportError("USER_NOT_FOUND", `User '${userId}' does not exist.`, 404, false);
  }

  let email: string;
  try {
    email = resolveUserEmail(userRow);
  } catch (err) {
    throw new ExportError(
      "EXPORT_EMAIL_DECRYPTION_FAILED",
      `Failed to decrypt user email: ${err}`,
      500,
      false
    );
  }

  const userObj = {
    id: userRow.id,
    email,
    emailVerified: Boolean(userRow.emailVerified),
    role: userRow.role,
    status: userRow.status,
    twoFactorEnabled: userRow.twoFactorEnabled,
    createdAt: userRow.createdAt.toISOString(),
    updatedAt: userRow.updatedAt.toISOString(),
  };

  yield `{\n  "exportVersion": 2,\n  "extractedAt": ${JSON.stringify(snapshotStartedAt.toISOString())},\n  "user": ${JSON.stringify(userObj, null, 2)},\n`;

  if (options?.onSection) await options.onSection("user");
  if (signal?.aborted) {
    throw signal.reason || new ExportError("EXPORT_ABORTED", "Aborted", 400, false);
  }
}

/**
 * Reads user public profile data.
 */
export async function* readProfileData(
  ctx: ExportReaderContext
): AsyncGenerator<string, void, unknown> {
  const { txDb, userId, options, signal } = ctx;

  const [profileRow] = await txDb
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, userId))
    .limit(1);

  const profileObj = profileRow
    ? {
        displayName: profileRow.displayName,
        handle: profileRow.handle,
        about: profileRow.about,
        avatarUrl: profileRow.avatarUrl,
        showLocation: profileRow.showLocation,
        revealPhoneAfterMatch: profileRow.revealPhoneAfterMatch,
        locale: profileRow.locale,
        createdAt: profileRow.createdAt.toISOString(),
        updatedAt: profileRow.updatedAt.toISOString(),
      }
    : null;

  yield `  "profile": ${profileObj ? JSON.stringify(profileObj, null, 2) : "null"},\n`;

  if (options?.onSection) await options.onSection("profile");
  if (signal?.aborted) {
    throw signal.reason || new ExportError("EXPORT_ABORTED", "Aborted", 400, false);
  }
}

/**
 * Reads user external links with index-backed keyset pagination.
 */
export async function* readProfileLinksData(
  ctx: ExportReaderContext
): AsyncGenerator<string, void, unknown> {
  const { txDb, userId, options, signal } = ctx;

  yield `  "links": [\n`;
  let lastLinkSortOrder: number | null = null;
  let lastLinkId: string | null = null;
  let firstLink = true;
  let linkPageCount = 0;

  while (true) {
    if (signal?.aborted) {
      throw signal.reason || new ExportError("EXPORT_ABORTED", "Aborted", 400, false);
    }

    const whereClause: SQL | undefined =
      lastLinkSortOrder !== null && lastLinkId !== null
        ? and(
            eq(schema.profileLinks.userId, userId),
            sql`(${schema.profileLinks.sortOrder}, ${schema.profileLinks.id}) > (${lastLinkSortOrder}::integer, ${lastLinkId}::uuid)`
          )
        : eq(schema.profileLinks.userId, userId);

    const linkPage: LinkRow[] = await txDb
      .select({
        id: schema.profileLinks.id,
        type: schema.profileLinks.type,
        label: schema.profileLinks.label,
        url: schema.profileLinks.url,
        sortOrder: schema.profileLinks.sortOrder,
      })
      .from(schema.profileLinks)
      .where(whereClause)
      .orderBy(asc(schema.profileLinks.sortOrder), asc(schema.profileLinks.id))
      .limit(PAGE_SIZE);

    if (linkPage.length === 0) break;
    if (options?.onProgress) {
      await options.onProgress({
        section: "links",
        page: ++linkPageCount,
        rowCount: linkPage.length,
      });
    }

    for (const l of linkPage) {
      const itemStr = serializeExportRecord({
        id: l.id,
        type: l.type,
        label: l.label,
        url: l.url,
        sortOrder: l.sortOrder,
      });
      yield `${firstLink ? "    " : ",\n    "}${itemStr}`;
      firstLink = false;
    }

    const last = linkPage[linkPage.length - 1]!;
    lastLinkSortOrder = last.sortOrder;
    lastLinkId = last.id;
  }
  yield `\n  ],\n`;

  if (options?.onSection) await options.onSection("links");
  if (signal?.aborted) {
    throw signal.reason || new ExportError("EXPORT_ABORTED", "Aborted", 400, false);
  }
}

/**
 * Reads encrypted private identity and decrypts sensitive envelope fields.
 */
export async function* readPrivateIdentityData(
  ctx: ExportReaderContext
): AsyncGenerator<string, void, unknown> {
  const { txDb, userId, options, signal } = ctx;

  let privateIdentityObj: Record<string, unknown> | null = null;
  const [idRow] = await txDb
    .select()
    .from(schema.userPrivateIdentity)
    .where(eq(schema.userPrivateIdentity.userId, userId))
    .limit(1);

  if (idRow) {
    const decryptField = (encVal: string | null, col: string) => {
      if (!encVal) return null;
      try {
        return decryptEnvelopeV2(encVal, {
          table: "user_private_identity",
          primaryKey: userId,
          column: col,
        });
      } catch (err) {
        throw new ExportError(
          "EXPORT_IDENTITY_DECRYPTION_FAILED",
          `Failed to decrypt private identity column '${col}' for user '${userId}': ${err}`,
          500,
          false
        );
      }
    };

    privateIdentityObj = {
      legalFirstName: decryptField(idRow.legalFirstNameEnc, "legal_first_name_enc"),
      legalLastName: decryptField(idRow.legalLastNameEnc, "legal_last_name_enc"),
      phoneE164: decryptField(idRow.phoneE164Enc, "phone_e164_enc"),
      dateOfBirth: decryptField(idRow.dateOfBirthEnc, "date_of_birth_enc"),
      phoneVerifiedAt: idRow.phoneVerifiedAt ? idRow.phoneVerifiedAt.toISOString() : null,
      city: idRow.city,
      countryCode: idRow.countryCode,
      createdAt: idRow.createdAt.toISOString(),
      updatedAt: idRow.updatedAt.toISOString(),
    };
  }

  yield `  "privateIdentity": ${privateIdentityObj ? serializeExportRecord(privateIdentityObj) : "null"},\n`;

  if (options?.onSection) await options.onSection("privateIdentity");
  if (signal?.aborted) {
    throw signal.reason || new ExportError("EXPORT_ABORTED", "Aborted", 400, false);
  }
}
