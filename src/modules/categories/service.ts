import crypto from "node:crypto";
import { eq, and, asc, inArray, isNotNull, sql, isNull } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import { Locale } from "@/src/lib/i18n/config";
import { SEED_CATEGORIES, SEED_SECTORS } from "@/db/seeds/categories";

export interface CategoryDto {
  id: string;
  key: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  sectorKey?: string;
  parentId?: string | null;
  isFollowed?: boolean;
  emailAlerts?: boolean;
  minBudget?: number | null;
  listingCount?: number;
}

export interface SectorDto {
  id: string;
  key: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  icon: string;
  categories: CategoryDto[];
  listingCount?: number;
  isFollowed?: boolean;
}

// In-memory fallback follows when DB is offline or unseeded
const inMemoryFollows = new Map<string, Set<string>>();
interface InMemoAlertPrefs {
  emailAlerts: boolean;
  minBudget: number | null;
}
const inMemoryAlertPrefs = new Map<string, Map<string, InMemoAlertPrefs>>();

export function getDeterministicUuid(key: string): string {
  const hash = crypto.createHash("md5").update(`operis-cat-${key}`).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

function getFallbackCategories(locale: Locale, userId?: string, countMap?: Map<string, number>): CategoryDto[] {
  const lang = locale === "tr" ? "tr" : "en";
  const userFollows = userId ? inMemoryFollows.get(userId) : undefined;

  return SEED_CATEGORIES.map((cat) => {
    const trans = cat.translations[lang] || cat.translations.tr;
    const catId = getDeterministicUuid(cat.key);
    return {
      id: catId,
      key: cat.key,
      slug: cat.key,
      sectorKey: cat.sectorKey,
      name: trans.name,
      description: trans.description,
      sortOrder: cat.sortOrder,
      isActive: true,
      listingCount: countMap?.get(catId) || countMap?.get(cat.key) || 0,
      isFollowed: userFollows ? userFollows.has(catId) || userFollows.has(cat.key) : false,
      emailAlerts: userFollows ? userFollows.has(catId) || userFollows.has(cat.key) : undefined,
      minBudget: null,
    };
  });
}

function getFallbackSectors(locale: Locale, userId?: string, countMap?: Map<string, number>): SectorDto[] {
  const lang = locale === "tr" ? "tr" : "en";
  const allCategories = getFallbackCategories(locale, userId, countMap);
  const userFollows = userId ? inMemoryFollows.get(userId) : undefined;

  return SEED_SECTORS.map((sec) => {
    const trans = sec.translations[lang] || sec.translations.tr;
    const secId = getDeterministicUuid(sec.key);
    const subCategories = allCategories.filter((cat) => cat.sectorKey === sec.key);
    const sectorListingCount = subCategories.reduce((acc, cat) => acc + (cat.listingCount || 0), 0);

    return {
      id: secId,
      key: sec.key,
      slug: sec.key,
      name: trans.name,
      description: trans.description,
      sortOrder: sec.sortOrder,
      icon: sec.icon,
      categories: subCategories,
      listingCount: sectorListingCount,
      isFollowed: userFollows ? userFollows.has(secId) || userFollows.has(sec.key) : false,
    };
  });
}

export class CategoryService {
  /**
   * Fetches active listing counts grouped by category ID.
   */
  static async getListingCountsByCategory(): Promise<Map<string, number>> {
    const countMap = new Map<string, number>();
    try {
      const db = getDb();
      const countRows = await db
        .select({
          categoryId: schema.listings.categoryId,
          count: sql<number>`count(*)::int`,
        })
        .from(schema.listings)
        .where(
          and(
            eq(schema.listings.status, "ACTIVE"),
            sql`${schema.listings.activeUntil} > now()`,
            isNull(schema.listings.deletedAt)
          )
        )
        .groupBy(schema.listings.categoryId);

      for (const r of countRows) {
        if (r.categoryId) {
          countMap.set(r.categoryId, Number(r.count) || 0);
        }
      }
    } catch {
      // Fallback to empty counts if database is unreachable or table not yet initialized
    }
    return countMap;
  }

  /**
   * Returns the count of categories followed by the user.
   */
  static async getFollowedCount(userId: string): Promise<number> {
    try {
      const db = getDb();
      const [res] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.categoryFollows)
        .where(eq(schema.categoryFollows.userId, userId));
      return Number(res?.count ?? 0);
    } catch {
      return inMemoryFollows.get(userId)?.size ?? 0;
    }
  }

  /**
   * Returns all active categories grouped by sectors localized to the requested locale.
   */
  static async getSectorsWithCategories(locale: Locale, userId?: string): Promise<SectorDto[]> {
    try {
      const categories = await this.getCategories(locale, userId);
      const lang = locale === "tr" ? "tr" : "en";
      const userFollows = userId ? inMemoryFollows.get(userId) : undefined;

      // Map categories under their respective sectors with aggregated listing counts
      return SEED_SECTORS.map((sec) => {
        const trans = sec.translations[lang] || sec.translations.tr;
        const secId = getDeterministicUuid(sec.key);
        const subCategories = categories.filter((cat) => cat.sectorKey === sec.key);
        const sectorListingCount = subCategories.reduce((acc, cat) => acc + (cat.listingCount || 0), 0);

        return {
          id: secId,
          key: sec.key,
          slug: sec.key,
          name: trans.name,
          description: trans.description,
          sortOrder: sec.sortOrder,
          icon: sec.icon,
          categories: subCategories,
          listingCount: sectorListingCount,
          isFollowed: userFollows ? userFollows.has(secId) || userFollows.has(sec.key) : false,
        };
      });
    } catch {
      return getFallbackSectors(locale, userId);
    }
  }

  /**
   * Returns all active categories localized to the requested locale.
   * If userId is provided, attaches the private `isFollowed` status.
   */
  static async getAllCategories(locale: Locale, userId?: string): Promise<CategoryDto[]> {
    return this.getCategories(locale, userId);
  }

  static async getCategories(locale: Locale, userId?: string): Promise<CategoryDto[]> {
    try {
      const db = getDb();

      // 1. Fetch active categories and listing counts in parallel
      const [categoryRows, countMap] = await Promise.all([
        db
          .select({
            id: schema.categories.id,
            key: schema.categories.key,
            sortOrder: schema.categories.sortOrder,
            isActive: schema.categories.isActive,
          })
          .from(schema.categories)
          .where(and(eq(schema.categories.isActive, true), isNotNull(schema.categories.parentId)))
          .orderBy(asc(schema.categories.sortOrder)),
        this.getListingCountsByCategory(),
      ]);

      if (categoryRows && categoryRows.length > 0) {
        // 2. Fetch translations for this locale and fallback 'tr'
        const localesToFetch = Array.from(new Set([locale, "tr"]));
        const translationRows = await db
          .select({
            categoryId: schema.categoryTranslations.categoryId,
            locale: schema.categoryTranslations.locale,
            name: schema.categoryTranslations.name,
            description: schema.categoryTranslations.description,
          })
          .from(schema.categoryTranslations)
          .where(inArray(schema.categoryTranslations.locale, localesToFetch));

        const transMap = new Map<string, { name: string; description: string | null }>();
        const trFallbackMap = new Map<string, { name: string; description: string | null }>();

        for (const t of translationRows) {
          if (t.locale === locale) {
            transMap.set(t.categoryId, { name: t.name, description: t.description });
          } else if (t.locale === "tr") {
            trFallbackMap.set(t.categoryId, { name: t.name, description: t.description });
          }
        }

        // 3. If authenticated user, fetch private follows and alert prefs
        const followedMap = new Map<string, { emailAlerts: boolean; minBudget: number | null }>();
        if (userId) {
          const followRows = await db
            .select({
              categoryId: schema.categoryFollows.categoryId,
              emailAlerts: schema.categoryFollows.emailAlerts,
              minBudget: schema.categoryFollows.minBudget,
            })
            .from(schema.categoryFollows)
            .where(eq(schema.categoryFollows.userId, userId));
          for (const f of followRows) {
            followedMap.set(f.categoryId, {
              emailAlerts: f.emailAlerts,
              minBudget: f.minBudget,
            });
          }
        }

        const seedCategoryMap = new Map<string, string>();
        for (const sc of SEED_CATEGORIES) {
          seedCategoryMap.set(sc.key, sc.sectorKey);
        }

        return categoryRows.map((cat) => {
          const trans = transMap.get(cat.id) ||
            trFallbackMap.get(cat.id) || { name: cat.key, description: null };
          const followData = userId ? followedMap.get(cat.id) : undefined;
          return {
            id: cat.id,
            key: cat.key,
            slug: cat.key,
            sectorKey: seedCategoryMap.get(cat.key),
            name: trans.name,
            description: trans.description,
            sortOrder: cat.sortOrder,
            isActive: cat.isActive,
            listingCount: countMap.get(cat.id) || countMap.get(cat.key) || 0,
            isFollowed: followData !== undefined,
            emailAlerts: followData?.emailAlerts,
            minBudget: followData?.minBudget,
          };
        });
      }
    } catch {
      // Gracefully fall through to SEED_CATEGORIES when database is unreachable or unseeded
    }

    return getFallbackCategories(locale, userId);
  }

  /**
   * Toggles category follow state for a user.
   */
  static async toggleFollow(userId: string, categoryId: string): Promise<boolean> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      categoryId
    );
    try {
      const db = getDb();

      const categoryRows = await db
        .select({ id: schema.categories.id })
        .from(schema.categories)
        .where(
          isUuid ? eq(schema.categories.id, categoryId) : eq(schema.categories.key, categoryId)
        )
        .limit(1);

      const targetCategory = categoryRows[0];
      if (!targetCategory) {
        throw new Error("Category not found");
      }

      const targetId = targetCategory.id;

      const existing = await db
        .select()
        .from(schema.categoryFollows)
        .where(
          and(
            eq(schema.categoryFollows.userId, userId),
            eq(schema.categoryFollows.categoryId, targetId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .delete(schema.categoryFollows)
          .where(
            and(
              eq(schema.categoryFollows.userId, userId),
              eq(schema.categoryFollows.categoryId, targetId)
            )
          );
        return false; // unfollowed
      } else {
        await db
          .insert(schema.categoryFollows)
          .values({
            userId,
            categoryId: targetId,
          })
          .onConflictDoNothing();
        return true; // followed
      }
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        throw err;
      }
      if (err instanceof Error && err.message === "Category not found") {
        throw err;
      }
      // In-memory fallback
      let userSet = inMemoryFollows.get(userId);
      if (!userSet) {
        userSet = new Set<string>();
        inMemoryFollows.set(userId, userSet);
      }
      const catUuid = isUuid ? categoryId : getDeterministicUuid(categoryId);
      if (userSet.has(categoryId) || userSet.has(catUuid)) {
        userSet.delete(categoryId);
        userSet.delete(catUuid);
        return false;
      } else {
        userSet.add(categoryId);
        userSet.add(catUuid);
        return true;
      }
    }
  }

  /**
   * Updates job alert preferences for a followed category (email alerts on/off, min budget threshold).
   */
  static async updateAlertPreferences(
    userId: string,
    categoryId: string,
    preferences: { emailAlerts?: boolean; minBudget?: number | null }
  ): Promise<{ success: boolean; emailAlerts: boolean; minBudget: number | null }> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId);
    try {
      const db = getDb();
      const categoryRows = await db
        .select({ id: schema.categories.id })
        .from(schema.categories)
        .where(isUuid ? eq(schema.categories.id, categoryId) : eq(schema.categories.key, categoryId))
        .limit(1);

      const targetCategory = categoryRows[0];
      if (!targetCategory) {
        throw new Error("Category not found");
      }

      const targetId = targetCategory.id;
      const updateData: { emailAlerts?: boolean; minBudget?: number | null } = {};
      if (typeof preferences.emailAlerts === "boolean") {
        updateData.emailAlerts = preferences.emailAlerts;
      }
      if (preferences.minBudget !== undefined) {
        updateData.minBudget = preferences.minBudget;
      }

      const existing = await db
        .select()
        .from(schema.categoryFollows)
        .where(
          and(
            eq(schema.categoryFollows.userId, userId),
            eq(schema.categoryFollows.categoryId, targetId)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(schema.categoryFollows).values({
          userId,
          categoryId: targetId,
          emailAlerts: preferences.emailAlerts ?? true,
          minBudget: preferences.minBudget ?? null,
        });
        return {
          success: true,
          emailAlerts: preferences.emailAlerts ?? true,
          minBudget: preferences.minBudget ?? null,
        };
      } else {
        await db
          .update(schema.categoryFollows)
          .set(updateData)
          .where(
            and(
              eq(schema.categoryFollows.userId, userId),
              eq(schema.categoryFollows.categoryId, targetId)
            )
          );

        const existingRow = existing[0];
        return {
          success: true,
          emailAlerts: preferences.emailAlerts !== undefined ? preferences.emailAlerts : (existingRow?.emailAlerts ?? true),
          minBudget: preferences.minBudget !== undefined ? preferences.minBudget : (existingRow?.minBudget ?? null),
        };
      }
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        throw err;
      }
      let userPrefs = inMemoryAlertPrefs.get(userId);
      if (!userPrefs) {
        userPrefs = new Map<string, InMemoAlertPrefs>();
        inMemoryAlertPrefs.set(userId, userPrefs);
      }
      const catUuid = isUuid ? categoryId : getDeterministicUuid(categoryId);
      const curr = userPrefs.get(catUuid) || { emailAlerts: true, minBudget: null };
      const updated: InMemoAlertPrefs = {
        emailAlerts: preferences.emailAlerts !== undefined ? preferences.emailAlerts : curr.emailAlerts,
        minBudget: preferences.minBudget !== undefined ? preferences.minBudget : curr.minBudget,
      };
      userPrefs.set(catUuid, updated);
      userPrefs.set(categoryId, updated);
      return { success: true, ...updated };
    }
  }

  /**
   * Follows all currently active categories.
   */
  static async followAll(userId: string): Promise<void> {
    try {
      const db = getDb();

      const activeCategories = await db
        .select({ id: schema.categories.id })
        .from(schema.categories)
        .where(eq(schema.categories.isActive, true));

      if (activeCategories && activeCategories.length > 0) {
        await db
          .insert(schema.categoryFollows)
          .values(
            activeCategories.map((cat) => ({
              userId,
              categoryId: cat.id,
            }))
          )
          .onConflictDoNothing();
        return;
      }
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        throw err;
      }
      // In-memory fallback
    }

    const allIds = SEED_CATEGORIES.flatMap((c) => [getDeterministicUuid(c.key), c.key]);
    inMemoryFollows.set(userId, new Set(allIds));
  }

  /**
   * Unfollows all categories for a user.
   */
  static async unfollowAll(userId: string): Promise<void> {
    try {
      const db = getDb();
      await db.delete(schema.categoryFollows).where(eq(schema.categoryFollows.userId, userId));
      return;
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        throw err;
      }
      // In-memory fallback
    }
    inMemoryFollows.delete(userId);
  }

  /**
   * Unfollows multiple categories for a user in a single atomic operation.
   */
  static async unfollowMultiple(userId: string, categoryIds: string[]): Promise<number> {
    if (!categoryIds || categoryIds.length === 0) return 0;
    try {
      const db = getDb();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const uuids = categoryIds.filter((id) => uuidRegex.test(id));
      const keys = categoryIds.filter((id) => !uuidRegex.test(id));

      const allTargetIds = [...uuids];
      if (keys.length > 0) {
        const matchingCategories = await db
          .select({ id: schema.categories.id })
          .from(schema.categories)
          .where(inArray(schema.categories.key, keys));
        allTargetIds.push(...matchingCategories.map((c) => c.id));
      }

      if (allTargetIds.length === 0) return 0;

      await db
        .delete(schema.categoryFollows)
        .where(
          and(
            eq(schema.categoryFollows.userId, userId),
            inArray(schema.categoryFollows.categoryId, allTargetIds)
          )
        );

      return allTargetIds.length;
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        throw err;
      }
      // In-memory fallback
      const userSet = inMemoryFollows.get(userId);
      let removed = 0;
      if (userSet) {
        for (const id of categoryIds) {
          const catUuid = getDeterministicUuid(id);
          if (userSet.delete(id) || userSet.delete(catUuid)) {
            removed++;
          }
        }
      }
      return removed;
    }
  }

  /**
   * Fetches user's private followed category IDs.
   * STRICT ACCESS CONTROL: Only account owner or server feed logic can invoke this.
   */
  static async getFollowedCategoryIds(userId: string): Promise<string[]> {
    try {
      const db = getDb();
      const rows = await db
        .select({ categoryId: schema.categoryFollows.categoryId })
        .from(schema.categoryFollows)
        .where(eq(schema.categoryFollows.userId, userId));

      return rows.map((r) => r.categoryId);
    } catch {
      if (process.env.NODE_ENV === "production") {
        return [];
      }
      // In-memory fallback
    }

    return Array.from(inMemoryFollows.get(userId) || []);
  }
}
