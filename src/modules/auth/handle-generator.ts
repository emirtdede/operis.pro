import { sql } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import { RESERVED_HANDLES } from "@/src/modules/auth/validation";

type AppDb = ReturnType<typeof getDb>;
export type DbOrTx = Parameters<Parameters<AppDb["transaction"]>[0]>[0] | AppDb;

/**
 * Transliterates Turkish and accented characters to standard ASCII characters.
 * e.g. "Çağrı Şengül" -> "cagrisengul", "İsmail Öztürk" -> "ismailozturk"
 */
export function cleanForHandle(str: string): string {
  if (!str) return "";

  const trMap: Record<string, string> = {
    ç: "c", Ç: "c",
    ğ: "g", Ğ: "g",
    ı: "i", I: "i",
    İ: "i", i: "i",
    ö: "o", Ö: "o",
    ş: "s", Ş: "s",
    ü: "u", Ü: "u",
  };

  let sanitized = str;
  for (const [key, val] of Object.entries(trMap)) {
    sanitized = sanitized.replaceAll(key, val);
  }

  return sanitized
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accent diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, ""); // keep only lowercase alphanumeric
}

/**
 * Builds the base handle string following user rules:
 * - If firstName and lastName exist: isim+soyisim (e.g. Emir Dede -> emirdede)
 * - If only firstName exists: isim (e.g. Emir -> emir)
 * - If only lastName exists: soyisim (e.g. Dede -> dede)
 * - If neither exists: email prefix (e.g. emirdede@gmail.com -> emirdede)
 * - Fallback: "user"
 * - Length: minimum 3 chars, maximum 24 chars to leave room for sequential digits within 30 chars DB limit.
 */
export function buildBaseHandle(
  firstName?: string | null,
  lastName?: string | null,
  fallbackEmail?: string | null
): string {
  const cleanFirst = cleanForHandle(firstName || "");
  const cleanLast = cleanForHandle(lastName || "");

  let base = "";

  if (cleanFirst && cleanLast) {
    base = `${cleanFirst}${cleanLast}`;
  } else if (cleanFirst) {
    base = cleanFirst;
  } else if (cleanLast) {
    base = cleanLast;
  } else if (fallbackEmail) {
    const emailPrefix = fallbackEmail.split("@")[0] || "";
    base = cleanForHandle(emailPrefix);
  }

  if (!base) {
    base = "user";
  }

  // Enforce minimum 3 characters
  if (base.length < 3) {
    base = `user_${base}`;
  }

  // Truncate to maximum 24 characters to safely accommodate sequential numbers up to 6 digits (e.g. base + 999999 <= 30)
  return base.slice(0, 24);
}

/**
 * Queries the database and finds the first available unique handle:
 * 1. Returns `base` if not already taken and not reserved (e.g. "emirdede" or "emir").
 * 2. If `base` is taken or reserved, returns `${base}${counter}` starting with 2 (e.g. "emirdede2", "emir2", "emirdede3", ...).
 */
export async function generateUniqueSequentialHandle(
  db: DbOrTx,
  firstName?: string | null,
  lastName?: string | null,
  fallbackEmail?: string | null
): Promise<string> {
  const base = buildBaseHandle(firstName, lastName, fallbackEmail);

  // Fetch all existing handles matching base or base% in a single query
  let queryResult: unknown = await db
    .select({ handle: schema.profiles.handle })
    .from(schema.profiles)
    .where(
      sql`${schema.profiles.handle} = ${base} OR ${schema.profiles.handle} LIKE ${base + "%"}`
    );

  if (queryResult && typeof (queryResult as { limit?: unknown }).limit === "function") {
    queryResult = await (queryResult as { limit: (n: number) => Promise<unknown> }).limit(1000);
  }

  const existingRows: Array<{ handle: string }> = Array.isArray(queryResult)
    ? (queryResult as Array<{ handle: string }>)
    : Array.isArray((queryResult as { rows?: Array<{ handle: string }> })?.rows)
    ? (queryResult as { rows: Array<{ handle: string }> }).rows
    : [];

  const existingSet = new Set(
    existingRows
      .filter((r) => r && typeof r.handle === "string")
      .map((r) => r.handle.toLowerCase())
  );

  // 1. If base is not taken and not reserved, use it directly (e.g. "emirdede")
  if (!existingSet.has(base) && !RESERVED_HANDLES.has(base)) {
    return base;
  }

  // 2. Otherwise start sequential numbering from 2 (e.g. "emirdede2", "emirdede3")
  let counter = 2;
  while (counter <= 10000) {
    const candidate = `${base}${counter}`;
    if (!existingSet.has(candidate) && !RESERVED_HANDLES.has(candidate)) {
      return candidate;
    }
    counter++;
  }

  // Fallback safety guard for extreme edge cases
  const fallbackRandom = Math.floor(1000 + Math.random() * 9000);
  return `${base.slice(0, 20)}_${fallbackRandom}`;
}
