const proc = process as unknown as { loadEnvFile?: (path?: string) => void };
if (typeof proc.loadEnvFile === "function") {
  try {
    proc.loadEnvFile(".env");
  } catch {
    // Non-fatal: Ignore missing .env
  }
}

import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { and, eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { SEED_CATEGORIES, SEED_SECTORS } from "@/db/seeds/categories";
import { SEED_USERS } from "@/db/seeds/users";
import { SEED_LISTINGS } from "@/db/seeds/listings";
import { SEED_OFFERS } from "@/db/seeds/offers";
import { SEED_ENGAGEMENTS } from "@/db/seeds/engagements";
import { getEnv } from "@/src/config/env";
import { encryptEnvelopeV2, hashPhoneBlindIndex, hashPassword } from "@/src/lib/crypto";

const { Pool } = pg;

export async function runSeed(customConnectionString?: string) {
  const env = getEnv();
  const connStr = customConnectionString || process.env.DATABASE_URL || env.DATABASE_URL;
  console.info("Seeding database taxonomy on:", connStr.replace(/:[^:@]+@/, ":***@"));

  const isSupabase = connStr.includes("supabase.co") || connStr.includes("pooler.supabase.com");

  const pool = new Pool({
    connectionString: connStr,
    max: 2,
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
  });

  const db = drizzle(pool, { schema });

  try {
    // 1. Sectors & Translations
    console.info(`1. Seeding ${SEED_SECTORS.length} official industry sectors...`);
    const sectorMap = new Map<string, string>(); // key -> id

    for (const sec of SEED_SECTORS) {
      const existing = await db
        .select()
        .from(schema.categories)
        .where(eq(schema.categories.key, sec.key))
        .limit(1);

      let sectorId: string;
      if (existing.length === 0) {
        const [inserted] = await db
          .insert(schema.categories)
          .values({
            key: sec.key,
            sortOrder: sec.sortOrder,
            parentId: null,
            isActive: true,
          })
          .returning({ id: schema.categories.id });
        sectorId = inserted!.id;
      } else {
        sectorId = existing[0]!.id;
        await db
          .update(schema.categories)
          .set({ sortOrder: sec.sortOrder, parentId: null, isActive: true })
          .where(eq(schema.categories.id, sectorId));
      }

      sectorMap.set(sec.key, sectorId);

      for (const locale of ["tr", "en"] as const) {
        const trans = sec.translations[locale];
        const existingTrans = await db
          .select()
          .from(schema.categoryTranslations)
          .where(
            and(
              eq(schema.categoryTranslations.categoryId, sectorId),
              eq(schema.categoryTranslations.locale, locale)
            )
          )
          .limit(1);

        if (existingTrans.length === 0) {
          await db.insert(schema.categoryTranslations).values({
            categoryId: sectorId,
            locale,
            name: trans.name,
            description: trans.description,
          });
        } else {
          await db
            .update(schema.categoryTranslations)
            .set({ name: trans.name, description: trans.description })
            .where(
              and(
                eq(schema.categoryTranslations.categoryId, sectorId),
                eq(schema.categoryTranslations.locale, locale)
              )
            );
        }
      }
    }

    // 2. Categories & Translations
    console.info(`2. Seeding ${SEED_CATEGORIES.length} official categories under sectors...`);
    const categoryMap = new Map<string, string>(); // key -> id

    for (const cat of SEED_CATEGORIES) {
      const parentId = sectorMap.get(cat.sectorKey) || null;
      const existing = await db
        .select()
        .from(schema.categories)
        .where(eq(schema.categories.key, cat.key))
        .limit(1);

      let categoryId: string;

      if (existing.length === 0) {
        const [inserted] = await db
          .insert(schema.categories)
          .values({
            key: cat.key,
            sortOrder: cat.sortOrder,
            parentId,
            isActive: true,
          })
          .returning({ id: schema.categories.id });
        categoryId = inserted!.id;
      } else {
        categoryId = existing[0]!.id;
        await db
          .update(schema.categories)
          .set({ sortOrder: cat.sortOrder, parentId, isActive: true })
          .where(eq(schema.categories.id, categoryId));
      }

      categoryMap.set(cat.key, categoryId);

      for (const locale of ["tr", "en"] as const) {
        const trans = cat.translations[locale];
        const existingTrans = await db
          .select()
          .from(schema.categoryTranslations)
          .where(
            and(
              eq(schema.categoryTranslations.categoryId, categoryId),
              eq(schema.categoryTranslations.locale, locale)
            )
          )
          .limit(1);

        if (existingTrans.length === 0) {
          await db.insert(schema.categoryTranslations).values({
            categoryId,
            locale,
            name: trans.name,
            description: trans.description,
          });
        } else {
          await db
            .update(schema.categoryTranslations)
            .set({ name: trans.name, description: trans.description })
            .where(
              and(
                eq(schema.categoryTranslations.categoryId, categoryId),
                eq(schema.categoryTranslations.locale, locale)
              )
            );
        }
      }
    }
    console.info("Categories and translations seeded successfully!");

    const withDemo = process.argv.includes("--demo") || process.env.SEED_DEMO_DATA === "true";
    if (!withDemo) {
      console.info(
        `Official taxonomy (${SEED_SECTORS.length} sectors, ${SEED_CATEGORIES.length} categories) verified & synced. Skipping demo data (mock users, listings, offers) for production readiness. (Use --demo to include mock data).`
      );
      return;
    }

    // 2. Users, Profiles, and Private Identities
    console.info(`2. Seeding ${SEED_USERS.length} demo users & profiles...`);
    for (const u of SEED_USERS) {
      const passwordHash = await hashPassword(u.passwordPlain);

      const existingUser = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, u.id))
        .limit(1);

      if (existingUser.length === 0) {
        await db.insert(schema.users).values({
          id: u.id,
          email: u.email,
          emailVerified: u.emailVerified,
          passwordHash,
          role: u.role,
          status: u.status,
          twoFactorEnabled: false,
        });
      } else {
        await db
          .update(schema.users)
          .set({
            email: u.email,
            emailVerified: u.emailVerified,
            passwordHash,
            role: u.role,
            status: u.status,
          })
          .where(eq(schema.users.id, u.id));
      }

      // Profile
      const existingProfile = await db
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.userId, u.id))
        .limit(1);

      if (existingProfile.length === 0) {
        await db.insert(schema.profiles).values({
          userId: u.id,
          handle: u.profile.handle,
          displayName: u.profile.displayName,
          about: u.profile.about,
          avatarUrl: u.profile.avatarUrl || null,
          showLocation: u.profile.showLocation,
          revealPhoneAfterMatch: u.profile.revealPhoneAfterMatch,
          locale: u.profile.locale,
          theme: u.profile.theme,
          trackedSkills: u.profile.trackedSkills,
        });
      } else {
        await db
          .update(schema.profiles)
          .set({
            handle: u.profile.handle,
            displayName: u.profile.displayName,
            about: u.profile.about,
            avatarUrl: u.profile.avatarUrl || null,
            showLocation: u.profile.showLocation,
            revealPhoneAfterMatch: u.profile.revealPhoneAfterMatch,
            locale: u.profile.locale,
            theme: u.profile.theme,
            trackedSkills: u.profile.trackedSkills,
          })
          .where(eq(schema.profiles.userId, u.id));
      }

      // Private Identity (Encrypted PII with Envelope v2 and AAD context binding)
      const phoneHmac = hashPhoneBlindIndex(u.privateIdentity.phoneE164);
      const legalFirstNameEnc = encryptEnvelopeV2(u.privateIdentity.firstName, {
        table: "user_private_identity",
        primaryKey: u.id,
        column: "legal_first_name_enc",
      });
      const legalLastNameEnc = encryptEnvelopeV2(u.privateIdentity.lastName, {
        table: "user_private_identity",
        primaryKey: u.id,
        column: "legal_last_name_enc",
      });
      const dateOfBirthEnc = encryptEnvelopeV2(u.privateIdentity.dob, {
        table: "user_private_identity",
        primaryKey: u.id,
        column: "date_of_birth_enc",
      });
      const phoneE164Enc = encryptEnvelopeV2(u.privateIdentity.phoneE164, {
        table: "user_private_identity",
        primaryKey: u.id,
        column: "phone_e164_enc",
      });

      const existingIdentity = await db
        .select()
        .from(schema.userPrivateIdentity)
        .where(eq(schema.userPrivateIdentity.userId, u.id))
        .limit(1);

      if (existingIdentity.length === 0) {
        await db.insert(schema.userPrivateIdentity).values({
          userId: u.id,
          legalFirstNameEnc,
          legalLastNameEnc,
          dateOfBirthEnc,
          countryCode: u.privateIdentity.countryCode,
          city: u.privateIdentity.city,
          phoneE164Enc,
          phoneHmac,
          phoneVerifiedAt: new Date(),
        });
      } else {
        await db
          .update(schema.userPrivateIdentity)
          .set({
            legalFirstNameEnc,
            legalLastNameEnc,
            dateOfBirthEnc,
            countryCode: u.privateIdentity.countryCode,
            city: u.privateIdentity.city,
            phoneE164Enc,
            phoneHmac,
          })
          .where(eq(schema.userPrivateIdentity.userId, u.id));
      }
    }
    console.info("Users, profiles, and private identities seeded successfully!");

    // 3. Listings
    console.info(`3. Seeding ${SEED_LISTINGS.length} real listings...`);
    const now = new Date();
    const activeUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    for (const l of SEED_LISTINGS) {
      const categoryId = categoryMap.get(l.categoryKey) || Array.from(categoryMap.values())[0]!;
      const normalizedBudgetMode =
        l.budgetMode === "FIXED_RANGE"
          ? "RANGE"
          : l.budgetMode === "HOURLY_RATE"
            ? "EXACT"
            : l.budgetMode;

      const existingListing = await db
        .select()
        .from(schema.listings)
        .where(eq(schema.listings.id, l.id))
        .limit(1);

      if (existingListing.length === 0) {
        await db.insert(schema.listings).values({
          id: l.id,
          ownerUserId: l.ownerUserId,
          slug: l.slug,
          status: l.status,
          categoryId,
          templateSchemaVersion: 1,
          title: l.title,
          summary: l.summary,
          scope: l.scope,
          answersJson: l.answersJson,
          tags: l.tags,
          budgetMode: normalizedBudgetMode,
          budgetCurrency: l.budgetCurrency,
          budgetMin: l.budgetMin,
          budgetMax: l.budgetMax,
          timelineMode: l.timelineMode,
          timelineValue: l.timelineValue,
          timelineUnit: l.timelineUnit,
          activationSeq: 1,
          viewCount: l.viewCount,
          clickCount: l.clickCount,
          firstPublishedAt: now,
          lastActivatedAt: now,
          activeUntil: l.status === "ACTIVE" ? activeUntil : null,
          matchedAt: l.matchedAt || null,
          completedAt: l.completedAt || null,
        });
      } else {
        await db
          .update(schema.listings)
          .set({
            ownerUserId: l.ownerUserId,
            slug: l.slug,
            status: l.status,
            categoryId,
            title: l.title,
            summary: l.summary,
            scope: l.scope,
            answersJson: l.answersJson,
            tags: l.tags,
            budgetMode: normalizedBudgetMode,
            budgetCurrency: l.budgetCurrency,
            budgetMin: l.budgetMin,
            budgetMax: l.budgetMax,
            timelineMode: l.timelineMode,
            timelineValue: l.timelineValue,
            timelineUnit: l.timelineUnit,
            viewCount: l.viewCount,
            clickCount: l.clickCount,
            activeUntil: l.status === "ACTIVE" ? activeUntil : null,
            lastActivatedAt: now,
            matchedAt: l.matchedAt || null,
            completedAt: l.completedAt || null,
          })
          .where(eq(schema.listings.id, l.id));
      }
    }
    console.info("Listings seeded successfully!");

    // 4. Offers
    console.info(`4. Seeding ${SEED_OFFERS.length} demo offers...`);
    for (const o of SEED_OFFERS) {
      const existingOffer = await db
        .select()
        .from(schema.offers)
        .where(eq(schema.offers.id, o.id))
        .limit(1);

      if (existingOffer.length === 0) {
        await db.insert(schema.offers).values({
          id: o.id,
          listingId: o.listingId,
          offerorUserId: o.offerorUserId,
          listingActivationSeq: o.listingActivationSeq,
          status: o.status,
          message: o.message,
          budgetCurrency: o.budgetCurrency,
          budgetMin: o.budgetMin,
          budgetMax: o.budgetMax,
          estimatedDurationValue: o.estimatedDurationValue,
          estimatedDurationUnit: o.estimatedDurationUnit,
        });
      } else {
        await db
          .update(schema.offers)
          .set({
            status: o.status,
            message: o.message,
            budgetCurrency: o.budgetCurrency,
            budgetMin: o.budgetMin,
            budgetMax: o.budgetMax,
            estimatedDurationValue: o.estimatedDurationValue,
            estimatedDurationUnit: o.estimatedDurationUnit,
          })
          .where(eq(schema.offers.id, o.id));
      }
    }
    console.info("Offers seeded successfully!");

    // 5. Engagements & Completion Marks
    console.info(`5. Seeding ${SEED_ENGAGEMENTS.length} completed demo engagements...`);
    for (const eng of SEED_ENGAGEMENTS) {
      const existingEng = await db
        .select()
        .from(schema.engagements)
        .where(eq(schema.engagements.id, eng.id))
        .limit(1);

      if (existingEng.length === 0) {
        await db.insert(schema.engagements).values({
          id: eng.id,
          listingId: eng.listingId,
          acceptedOfferId: eng.acceptedOfferId,
          ownerUserId: eng.ownerUserId,
          freelancerUserId: eng.freelancerUserId,
          status: eng.status,
          listingTitleSnapshot: eng.listingTitleSnapshot,
          listingCategorySnapshot: eng.listingCategorySnapshot,
          matchedAt: eng.matchedAt,
          completedAt: eng.completedAt,
        });
      }

      // Completion marks for both parties
      for (const uid of [eng.ownerUserId, eng.freelancerUserId]) {
        const existingMark = await db
          .select()
          .from(schema.engagementCompletionMarks)
          .where(
            and(
              eq(schema.engagementCompletionMarks.engagementId, eng.id),
              eq(schema.engagementCompletionMarks.userId, uid)
            )
          )
          .limit(1);

        if (existingMark.length === 0) {
          await db.insert(schema.engagementCompletionMarks).values({
            engagementId: eng.id,
            userId: uid,
            status: "MARKED_COMPLETE",
          });
        }
      }

      // Bilateral endorsements
      const existingEndorsement1 = await db
        .select()
        .from(schema.endorsements)
        .where(
          and(
            eq(schema.endorsements.engagementId, eng.id),
            eq(schema.endorsements.authorUserId, eng.ownerUserId)
          )
        )
        .limit(1);

      if (existingEndorsement1.length === 0) {
        await db.insert(schema.endorsements).values({
          engagementId: eng.id,
          authorUserId: eng.ownerUserId,
          recipientUserId: eng.freelancerUserId,
          content:
            "Kaan Bey ile çalışmak mükemmel bir deneyimdi. Zamanında ve kusursuz teslimat gerçekleştirdi.",
          projectTitleSnapshot: eng.listingTitleSnapshot,
        });
      }

      const existingEndorsement2 = await db
        .select()
        .from(schema.endorsements)
        .where(
          and(
            eq(schema.endorsements.engagementId, eng.id),
            eq(schema.endorsements.authorUserId, eng.freelancerUserId)
          )
        )
        .limit(1);

      if (existingEndorsement2.length === 0) {
        await db.insert(schema.endorsements).values({
          engagementId: eng.id,
          authorUserId: eng.freelancerUserId,
          recipientUserId: eng.ownerUserId,
          content: "Demir Bey çok vizyoner bir işveren. İletişim açık ve gereksinimler çok netti.",
          projectTitleSnapshot: eng.listingTitleSnapshot,
        });
      }
    }
    console.info("Engagements, completion marks, and endorsements seeded successfully!");

    console.info("Database seeding completed successfully! All entities are live in Supabase.");
  } catch (err) {
    console.error("Seeding failed:", err);
    throw err;
  } finally {
    await pool.end();
  }
}

if (
  process.argv[1] &&
  (process.argv[1].endsWith("scripts/seed.ts") || process.argv[1].endsWith("scripts\\seed.ts"))
) {
  runSeed().catch(() => {
    process.exitCode = 1;
  });
}
