import { describe, it, expect } from "vitest";
import { SEED_CATEGORIES, SEED_SECTORS } from "@/db/seeds/categories";
import * as schema from "@/db/schema";
import { getTableConfig } from "drizzle-orm/pg-core";
import fs from "node:fs";
import path from "node:path";

describe("Database Foundation & Schema Invariants", () => {
  describe("Seed Taxonomy Validation", () => {
    it("contains 10 official sectors and 110 categories", () => {
      expect(SEED_SECTORS.length).toBe(10);
      expect(SEED_CATEGORIES.length).toBe(110);
    });

    it("ensures each category has unique keys, valid parent sector and TR/EN translations", () => {
      const sectorKeys = new Set(SEED_SECTORS.map((s) => s.key));
      const keys = new Set<string>();

      for (const cat of SEED_CATEGORIES) {
        expect(keys.has(cat.key)).toBe(false);
        keys.add(cat.key);

        expect(sectorKeys.has(cat.sectorKey)).toBe(true);

        expect(cat.translations.tr.name).toBeDefined();
        expect(cat.translations.tr.description).toBeDefined();
        expect(cat.translations.en.name).toBeDefined();
        expect(cat.translations.en.description).toBeDefined();

        expect(cat.sortOrder).toBeGreaterThan(0);
      }
    });
  });

  describe("Schema Invariants & Constraints", () => {
    it("has all required core tables defined in schema", () => {
      expect(schema.users).toBeDefined();
      expect(schema.userPrivateIdentity).toBeDefined();
      expect(schema.profiles).toBeDefined();
      expect(schema.profileLinks).toBeDefined();
      expect(schema.categories).toBeDefined();
      expect(schema.categoryTranslations).toBeDefined();
      expect(schema.categoryFollows).toBeDefined();
      expect(schema.listingTemplates).toBeDefined();
      expect(schema.listings).toBeDefined();
      expect(schema.listingRevisions).toBeDefined();
      expect(schema.listingStatusEvents).toBeDefined();
      expect(schema.offers).toBeDefined();
      expect(schema.offerRevisions).toBeDefined();
      expect(schema.engagements).toBeDefined();
      expect(schema.engagementCompletionMarks).toBeDefined();
      expect(schema.blocks).toBeDefined();
      expect(schema.reports).toBeDefined();
      expect(schema.notifications).toBeDefined();
      expect(schema.outboxEvents).toBeDefined();
      expect(schema.legalDocuments).toBeDefined();
      expect(schema.legalAcceptances).toBeDefined();
      expect(schema.securityEvents).toBeDefined();
      expect(schema.adminAuditLog).toBeDefined();
    });

    it("verifies offers table has partial unique indexes for pending and accepted offers in Drizzle config and generated SQL", () => {
      const config = getTableConfig(schema.offers);
      const indexNames = config.indexes.map(
        // @ts-expect-error Drizzle stores name under config.name in v0.41
        (idx) => idx.config?.name || idx.name
      );

      expect(indexNames).toContain("offers_pending_unique_idx");
      expect(indexNames).toContain("offers_accepted_unique_idx");

      // Verify in generated SQL migration as well
      const migrationSql = fs.readFileSync(
        path.resolve(process.cwd(), "db/migrations/0000_unique_serpent_society.sql"),
        "utf-8"
      );
      expect(migrationSql).toContain('CREATE UNIQUE INDEX "offers_pending_unique_idx" ON "offers"');
      expect(migrationSql).toContain("WHERE status = 'PENDING'");
      expect(migrationSql).toContain(
        'CREATE UNIQUE INDEX "offers_accepted_unique_idx" ON "offers"'
      );
      expect(migrationSql).toContain("WHERE status = 'ACCEPTED'");
    });

    it("verifies listings table has required composite indexes for feed and freshness", () => {
      const config = getTableConfig(schema.listings);
      const indexNames = config.indexes.map(
        // @ts-expect-error Drizzle stores name under config.name in v0.41
        (idx) => idx.config?.name || idx.name
      );

      expect(indexNames).toContain("listings_feed_idx");
      expect(indexNames).toContain("listings_category_feed_idx");
      expect(indexNames).toContain("listings_owner_status_idx");
    });
  });
});
