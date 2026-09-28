import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb, schema } from "@/src/lib/db";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";

const isIntegration = Boolean(process.env.TEST_DATABASE_URL || process.env.DATABASE_URL);

describe.runIf(isIntegration)("PostgreSQL listings_budget_integrity_chk comprehensive test", () => {
  const testUserId = crypto.randomUUID();
  let testCatId = "";
  const createdListingIds: string[] = [];

  beforeAll(async () => {
    const db = getDb();
    // Seed user and category
    await db.insert(schema.users).values({
      id: testUserId,
      email: `test-budget-${Date.now()}@example.com`,
      passwordHash: "dummyhash",
      status: "ACTIVE",
      emailVerified: true,
      authVersion: 1,
    });

    const [cat] = await db
      .insert(schema.categories)
      .values({
        key: `cat-budget-${Date.now()}`,
        isActive: true,
      })
      .returning({ id: schema.categories.id });
    testCatId = cat!.id;
  });

  afterAll(async () => {
    const db = getDb();
    for (const id of createdListingIds) {
      await db
        .delete(schema.listings)
        .where(eq(schema.listings.id, id))
        .catch(() => {});
    }
    await db
      .delete(schema.categories)
      .where(eq(schema.categories.id, testCatId))
      .catch(() => {});
    await db
      .delete(schema.users)
      .where(eq(schema.users.id, testUserId))
      .catch(() => {});
  });

  const validBudgetModeTestCases = [
    {
      name: "FIXED_EXACT valid",
      budgetMode: "FIXED_EXACT",
      budgetMin: "10000.00",
      budgetMax: "10000.00",
      budgetCurrency: "TRY",
    },
    {
      name: "HOURLY_EXACT valid",
      budgetMode: "HOURLY_EXACT",
      budgetMin: "500.00",
      budgetMax: "500.00",
      budgetCurrency: "TRY",
    },
    {
      name: "EXACT canonical valid",
      budgetMode: "EXACT",
      budgetMin: "7500.00",
      budgetMax: "7500.00",
      budgetCurrency: "USD",
    },
    {
      name: "FIXED_RANGE valid",
      budgetMode: "FIXED_RANGE",
      budgetMin: "1000.00",
      budgetMax: "5000.00",
      budgetCurrency: "TRY",
    },
    {
      name: "HOURLY_RANGE valid",
      budgetMode: "HOURLY_RANGE",
      budgetMin: "300.00",
      budgetMax: "600.00",
      budgetCurrency: "EUR",
    },
    {
      name: "RANGE canonical valid",
      budgetMode: "RANGE",
      budgetMin: "2000.00",
      budgetMax: "4000.00",
      budgetCurrency: "TRY",
    },
    {
      name: "NEGOTIABLE without amounts",
      budgetMode: "NEGOTIABLE",
      budgetMin: null,
      budgetMax: null,
      budgetCurrency: null,
    },
    {
      name: "REQUEST_GUIDANCE without amounts",
      budgetMode: "REQUEST_GUIDANCE",
      budgetMin: null,
      budgetMax: null,
      budgetCurrency: null,
    },
    {
      name: "OPEN_BID canonical without amounts",
      budgetMode: "OPEN_BID",
      budgetMin: null,
      budgetMax: null,
      budgetCurrency: null,
    },
    {
      name: "OPEN_BID with optional min/max",
      budgetMode: "OPEN_BID",
      budgetMin: "1500.00",
      budgetMax: "3000.00",
      budgetCurrency: "TRY",
    },
  ];

  for (const tc of validBudgetModeTestCases) {
    it(`allows active listing with ${tc.name}`, async () => {
      const db = getDb();
      const listingId = crypto.randomUUID();
      const slug = `slug-${listingId}`;

      const [row] = await db
        .insert(schema.listings)
        .values({
          id: listingId,
          ownerUserId: testUserId,
          slug,
          status: "ACTIVE",
          categoryId: testCatId,
          title: `Test Listing for ${tc.budgetMode}`,
          summary: "This is a test summary for budget constraint testing.",
          scope: "Detailed scope content.",
          budgetMode: tc.budgetMode,
          budgetMin: tc.budgetMin,
          budgetMax: tc.budgetMax,
          budgetCurrency: tc.budgetCurrency,
          timelineMode: "FLEXIBLE",
          activationSeq: 1,
          activeUntil: new Date(Date.now() + 7 * 86400000),
          lastActivatedAt: new Date(),
        })
        .returning({ id: schema.listings.id });

      expect(row?.id).toBe(listingId);
      createdListingIds.push(listingId);
    });
  }

  it("fails check constraint if FIXED_EXACT has mismatched min and max", async () => {
    const db = getDb();
    const listingId = crypto.randomUUID();
    const slug = `slug-${listingId}`;

    await expect(
      db.insert(schema.listings).values({
        id: listingId,
        ownerUserId: testUserId,
        slug,
        status: "ACTIVE",
        categoryId: testCatId,
        title: "Invalid exact listing",
        summary: "Summary text",
        scope: "Scope text",
        budgetMode: "FIXED_EXACT",
        budgetMin: "1000.00",
        budgetMax: "2000.00", // Mismatched!
        budgetCurrency: "TRY",
        timelineMode: "FLEXIBLE",
        activationSeq: 1,
        activeUntil: new Date(Date.now() + 7 * 86400000),
        lastActivatedAt: new Date(),
      })
    ).rejects.toMatchObject({
      cause: { code: "23514", constraint: "listings_budget_integrity_chk" },
    });
  });

  it("fails check constraint if FIXED_RANGE has min > max", async () => {
    const db = getDb();
    const listingId = crypto.randomUUID();
    const slug = `slug-${listingId}`;

    await expect(
      db.insert(schema.listings).values({
        id: listingId,
        ownerUserId: testUserId,
        slug,
        status: "ACTIVE",
        categoryId: testCatId,
        title: "Invalid range listing",
        summary: "Summary text",
        scope: "Scope text",
        budgetMode: "FIXED_RANGE",
        budgetMin: "5000.00",
        budgetMax: "2000.00", // min > max!
        budgetCurrency: "TRY",
        timelineMode: "FLEXIBLE",
        activationSeq: 1,
        activeUntil: new Date(Date.now() + 7 * 86400000),
        lastActivatedAt: new Date(),
      })
    ).rejects.toMatchObject({
      cause: { code: "23514", constraint: "listings_budget_integrity_chk" },
    });
  });
});
