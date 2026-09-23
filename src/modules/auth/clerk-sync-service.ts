import crypto from "node:crypto";
import { and, eq, ne } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import {
  encryptEnvelopeV2,
  hashEmailBlindIndex,
  hashPhoneBlindIndex,
  sha256,
} from "@/src/lib/crypto";
import { LegalService } from "@/src/modules/legal/service";
import { generateUniqueSequentialHandle } from "./handle-generator";

export interface LegalConsentInput {
  accepted: boolean;
  locale?: string;
  documentVersions?: Record<string, string>;
}

export interface SyncClerkUserInput {
  clerkUserId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  emailVerified?: boolean;
  legalConsent?: LegalConsentInput;
}

export interface SyncClerkUserResult {
  userId: string;
  isNewUser: boolean;
  handle: string;
  email: string;
  displayName: string;
}

type AppDb = ReturnType<typeof getDb>;
type DbOrTx = Parameters<Parameters<AppDb["transaction"]>[0]>[0] | AppDb;

export class ClerkSyncService {
  /**
   * Ensures the mandatory userPrivateIdentity row exists for KVKK compliance and phone verification readiness.
   */
  private static async ensureUserPrivateIdentity(
    db: DbOrTx,
    userId: string,
    firstName?: string | null,
    lastName?: string | null
  ): Promise<void> {
    const [existing] = await db
      .select({ userId: schema.userPrivateIdentity.userId })
      .from(schema.userPrivateIdentity)
      .where(eq(schema.userPrivateIdentity.userId, userId))
      .limit(1);

    if (existing) return;

    const safeFirst = firstName?.trim() || "Kullanıcı";
    const safeLast = lastName?.trim() || "Operis";

    const legalFirstNameEnc = encryptEnvelopeV2(safeFirst, {
      table: "user_private_identity",
      primaryKey: userId,
      column: "legal_first_name_enc",
    });
    const legalLastNameEnc = encryptEnvelopeV2(safeLast, {
      table: "user_private_identity",
      primaryKey: userId,
      column: "legal_last_name_enc",
    });
    const dateOfBirthEnc = encryptEnvelopeV2("2000-01-01", {
      table: "user_private_identity",
      primaryKey: userId,
      column: "date_of_birth_enc",
    });

    const placeholderPhone = `+90000${crypto.randomInt(10000000, 99999999)}`;
    const phoneE164Enc = encryptEnvelopeV2(placeholderPhone, {
      table: "user_private_identity",
      primaryKey: userId,
      column: "phone_e164_enc",
    });
    const phoneHmac = hashPhoneBlindIndex(`clerk_unverified_${userId}`);

    await db.insert(schema.userPrivateIdentity).values({
      userId,
      legalFirstNameEnc,
      legalLastNameEnc,
      dateOfBirthEnc,
      countryCode: "TR",
      city: "İstanbul",
      phoneE164Enc,
      phoneHmac,
      phoneVerifiedAt: null,
    });
  }

  /**
   * Records immutable legal acceptances for terms, privacy, and matching disclaimer
   * ONLY when explicit user consent is supplied (R26).
   */
  private static async recordInitialLegalAcceptances(
    db: DbOrTx,
    userId: string,
    consent?: LegalConsentInput
  ): Promise<void> {
    if (!consent || !consent.accepted) {
      return;
    }

    const legalDocKeys = ["terms", "privacy", "matching-disclaimer"];
    const now = new Date();
    const locale = (consent.locale === "en" ? "en" : "tr") as "tr" | "en";

    const legalRecords = [];
    for (const docKey of legalDocKeys) {
      const requestedVersion = consent.documentVersions?.[docKey] || "v1";
      let version = requestedVersion;
      let contentHash: string;
      try {
        const doc = LegalService.getDocument(docKey, locale, requestedVersion);
        version = doc.version;
        contentHash = doc.hash;
      } catch {
        contentHash = sha256(`legal-${docKey}-${version}`);
      }

      legalRecords.push({
        userId,
        documentKey: docKey,
        documentVersion: version,
        contentHash,
        acceptedAt: now,
      });
    }

    if (legalRecords.length > 0) {
      await db.insert(schema.legalAcceptances).values(legalRecords);
    }
  }

  /**
   * Synchronizes a Clerk authenticated user with Operis Supabase PostgreSQL (users, profiles, userPrivateIdentity, legalAcceptances).
   */
  static async syncClerkUser(input: SyncClerkUserInput): Promise<SyncClerkUserResult> {
    const db = getDb();
    const normalizedEmail = input.email.trim().toLowerCase();

    // 1. Check if already linked via clerkUserId
    const [existingByClerkId] = await db
      .select({
        user: schema.users,
        profile: schema.profiles,
      })
      .from(schema.users)
      .leftJoin(schema.profiles, eq(schema.users.id, schema.profiles.userId))
      .where(eq(schema.users.clerkUserId, input.clerkUserId))
      .limit(1);

    if (existingByClerkId) {
      if (existingByClerkId.user.status !== "ACTIVE") {
        throw new Error(
          `Hesap aktif durumda değil (durum: ${existingByClerkId.user.status}). Giriş yapılamaz.`
        );
      }

      // Self-heal: ensure userPrivateIdentity exists and email encryption fields are populated
      await this.ensureUserPrivateIdentity(
        db,
        existingByClerkId.user.id,
        input.firstName,
        input.lastName
      );

      // Self-heal: ensure profiles exists if missing (WP-25)
      if (!existingByClerkId.profile) {
        const uniqueHandle = await generateUniqueSequentialHandle(
          db,
          input.firstName,
          input.lastName,
          normalizedEmail
        );
        const displayName =
          [input.firstName, input.lastName].filter(Boolean).join(" ").trim() ||
          normalizedEmail.split("@")[0] ||
          "Operis Kullanıcısı";

        await db.insert(schema.profiles).values({
          userId: existingByClerkId.user.id,
          handle: uniqueHandle,
          displayName,
          avatarUrl: input.avatarUrl || null,
          avatarSource: input.avatarUrl ? "oauth" : "custom",
          locale: "tr",
          theme: "dark",
        });
      }

      // Handle Clerk email changes (WP-24)
      const userUpdates: Partial<typeof schema.users.$inferInsert> = {};
      const currentEmail = existingByClerkId.user.email?.toLowerCase().trim();

      if (normalizedEmail !== currentEmail) {
        // Verify new email doesn't conflict with another existing user
        const [conflictUser] = await db
          .select({ id: schema.users.id })
          .from(schema.users)
          .where(
            and(
              eq(schema.users.email, normalizedEmail),
              ne(schema.users.id, existingByClerkId.user.id)
            )
          )
          .limit(1);

        if (conflictUser) {
          throw new Error(
            "Hesap çakışması: Güncellenen e-posta adresi başka bir Operis hesabında zaten kayıtlı."
          );
        }

        userUpdates.email = normalizedEmail;
        userUpdates.emailVerified = input.emailVerified ?? true;
        userUpdates.emailEnc = encryptEnvelopeV2(normalizedEmail, {
          table: "users",
          primaryKey: existingByClerkId.user.id,
          column: "email_enc",
        });
        userUpdates.emailHmac = hashEmailBlindIndex(normalizedEmail);
      } else {
        // Email is identical, update verification status if changed
        if (
          input.emailVerified !== undefined &&
          input.emailVerified !== existingByClerkId.user.emailVerified
        ) {
          userUpdates.emailVerified = input.emailVerified;
        }
        if (!existingByClerkId.user.emailEnc) {
          userUpdates.emailEnc = encryptEnvelopeV2(normalizedEmail, {
            table: "users",
            primaryKey: existingByClerkId.user.id,
            column: "email_enc",
          });
        }
        if (!existingByClerkId.user.emailHmac) {
          userUpdates.emailHmac = hashEmailBlindIndex(normalizedEmail);
        }
      }

      if (Object.keys(userUpdates).length > 0) {
        userUpdates.updatedAt = new Date();
        await db
          .update(schema.users)
          .set(userUpdates)
          .where(eq(schema.users.id, existingByClerkId.user.id));
      }

      // Sync avatar from Google/Clerk whenever avatarSource is not 'custom'
      if (
        input.avatarUrl &&
        existingByClerkId.profile &&
        existingByClerkId.profile.avatarSource !== "custom" &&
        existingByClerkId.profile.avatarUrl !== input.avatarUrl
      ) {
        await db
          .update(schema.profiles)
          .set({
            avatarUrl: input.avatarUrl,
            avatarSource: "oauth",
            updatedAt: new Date(),
          })
          .where(eq(schema.profiles.userId, existingByClerkId.user.id));
      }

      // If explicit legal consent provided, record it (WP-26)
      if (input.legalConsent?.accepted) {
        await this.recordInitialLegalAcceptances(db, existingByClerkId.user.id, input.legalConsent);
      }

      const activeEmail = userUpdates.email ?? existingByClerkId.user.email;
      return {
        userId: existingByClerkId.user.id,
        isNewUser: false,
        handle: existingByClerkId.profile?.handle || "kullanici",
        email: activeEmail,
        displayName: existingByClerkId.profile?.displayName || "Operis Kullanıcısı",
      };
    }

    // 2. Check if user exists by email (link Clerk ID to existing Operis user)
    const [existingByEmail] = await db
      .select({
        user: schema.users,
        profile: schema.profiles,
      })
      .from(schema.users)
      .leftJoin(schema.profiles, eq(schema.users.id, schema.profiles.userId))
      .where(eq(schema.users.email, normalizedEmail))
      .limit(1);

    if (existingByEmail) {
      // 1. Status check: Inactive or suspended accounts cannot be claimed or logged into
      if (existingByEmail.user.status !== "ACTIVE") {
        throw new Error(
          `Hesap aktif durumda değil (durum: ${existingByEmail.user.status}). Giriş yapılamaz.`
        );
      }

      // 2. Email verification invariant: Cannot link an unverified external email to an existing account
      if (!input.emailVerified) {
        throw new Error(
          "Doğrulanmamış e-posta adresi ile mevcut bir hesaba bağlantı yapılamaz."
        );
      }

      // 3. Identity conflict invariant: Cannot overwrite an existing, different Clerk identity
      if (
        existingByEmail.user.clerkUserId &&
        existingByEmail.user.clerkUserId !== input.clerkUserId
      ) {
        throw new Error(
          "Hesap çakışması: Bu e-posta adresi başka bir Clerk kimliğine zaten bağlı."
        );
      }

      // 4. Privileged role invariant: Administrative accounts cannot be auto-claimed via public SSO
      const privilegedRoles = ["ADMIN", "SECURITY_ADMIN", "MODERATOR"];
      if (
        privilegedRoles.includes(existingByEmail.user.role) &&
        !existingByEmail.user.clerkUserId
      ) {
        throw new Error(
          "Yönetici hesapları sosyal kimlik sağlayıcı ile otomatik olarak eşleştirilemez. Güvenlik yöneticisiyle iletişime geçin."
        );
      }

      // Self-heal: ensure userPrivateIdentity exists
      await this.ensureUserPrivateIdentity(
        db,
        existingByEmail.user.id,
        input.firstName,
        input.lastName
      );

      const userUpdates: Partial<typeof schema.users.$inferInsert> = {
        clerkUserId: input.clerkUserId,
        emailVerified: input.emailVerified ?? existingByEmail.user.emailVerified,
        updatedAt: new Date(),
      };
      if (!existingByEmail.user.emailEnc) {
        userUpdates.emailEnc = encryptEnvelopeV2(normalizedEmail, {
          table: "users",
          primaryKey: existingByEmail.user.id,
          column: "email_enc",
        });
      }
      if (!existingByEmail.user.emailHmac) {
        userUpdates.emailHmac = hashEmailBlindIndex(normalizedEmail);
      }

      await db
        .update(schema.users)
        .set(userUpdates)
        .where(eq(schema.users.id, existingByEmail.user.id));

      // Self-heal: ensure profiles exists if missing (WP-25)
      if (!existingByEmail.profile) {
        const uniqueHandle = await generateUniqueSequentialHandle(
          db,
          input.firstName,
          input.lastName,
          normalizedEmail
        );
        const displayName =
          [input.firstName, input.lastName].filter(Boolean).join(" ").trim() ||
          normalizedEmail.split("@")[0] ||
          "Operis Kullanıcısı";

        await db.insert(schema.profiles).values({
          userId: existingByEmail.user.id,
          handle: uniqueHandle,
          displayName,
          avatarUrl: input.avatarUrl || null,
          avatarSource: input.avatarUrl ? "oauth" : "custom",
          locale: "tr",
          theme: "dark",
        });
      }

      if (
        input.avatarUrl &&
        existingByEmail.profile &&
        existingByEmail.profile.avatarSource !== "custom" &&
        existingByEmail.profile.avatarUrl !== input.avatarUrl
      ) {
        await db
          .update(schema.profiles)
          .set({
            avatarUrl: input.avatarUrl,
            avatarSource: "oauth",
            updatedAt: new Date(),
          })
          .where(eq(schema.profiles.userId, existingByEmail.user.id));
      }

      // If explicit legal consent provided, record it (WP-26)
      if (input.legalConsent?.accepted) {
        await this.recordInitialLegalAcceptances(db, existingByEmail.user.id, input.legalConsent);
      }

      return {
        userId: existingByEmail.user.id,
        isNewUser: false,
        handle: existingByEmail.profile?.handle || "kullanici",
        email: existingByEmail.user.email,
        displayName: existingByEmail.profile?.displayName || "Operis Kullanıcısı",
      };
    }

    // 3. New user: atomically create users + userPrivateIdentity + profiles + optional legalAcceptances (WP-25)
    const executeCreation = async (tx: DbOrTx) => {
      const userId = crypto.randomUUID();
      const displayName =
        [input.firstName, input.lastName].filter(Boolean).join(" ").trim() ||
        normalizedEmail.split("@")[0] ||
        "Operis Kullanıcısı";

      const uniqueHandle = await generateUniqueSequentialHandle(
        tx,
        input.firstName,
        input.lastName,
        normalizedEmail
      );

      const placeholderHash = `clerk_ext_${crypto.randomBytes(32).toString("hex")}`;
      const emailEnc = encryptEnvelopeV2(normalizedEmail, {
        table: "users",
        primaryKey: userId,
        column: "email_enc",
      });
      const emailHmac = hashEmailBlindIndex(normalizedEmail);

      const [newUser] = await tx
        .insert(schema.users)
        .values({
          id: userId,
          email: normalizedEmail,
          emailVerified: input.emailVerified ?? true,
          passwordHash: placeholderHash,
          clerkUserId: input.clerkUserId,
          role: "USER",
          status: "ACTIVE",
          emailEnc,
          emailHmac,
        })
        .returning({ id: schema.users.id });

      if (!newUser) {
        throw new Error("Failed to create user record during Clerk sync");
      }

      // Insert mandatory KVKK private identity record
      await this.ensureUserPrivateIdentity(tx, newUser.id, input.firstName, input.lastName);

      // Insert public profile
      await tx.insert(schema.profiles).values({
        userId: newUser.id,
        handle: uniqueHandle,
        displayName,
        avatarUrl: input.avatarUrl || null,
        avatarSource: input.avatarUrl ? "oauth" : "custom",
        locale: "tr",
        theme: "dark",
      });

      // Record immutable legal consent records ONLY if explicit user consent is supplied (WP-26)
      if (input.legalConsent?.accepted) {
        await this.recordInitialLegalAcceptances(tx, newUser.id, input.legalConsent);
      }

      return {
        userId: newUser.id,
        isNewUser: true,
        handle: uniqueHandle,
        email: normalizedEmail,
        displayName,
      };
    };

    const runCreationWithRetry = async () => {
      let attempts = 0;
      while (attempts < 3) {
        try {
          if ("transaction" in db && typeof db.transaction === "function") {
            return await db.transaction(async (tx) => executeCreation(tx));
          } else {
            return await executeCreation(db);
          }
        } catch (err: any) {
          const isUniqueViolation =
            err?.code === "23505" ||
            err?.message?.includes("unique") ||
            err?.message?.includes("duplicate key");
          if (isUniqueViolation && attempts < 2) {
            attempts++;
            continue;
          }
          throw err;
        }
      }
      throw new Error("Kullanıcı profili oluşturulurken beklenmeyen bir çakışma oluştu.");
    };

    return await runCreationWithRetry();
  }

  /**
   * Handles user deletion from Clerk by soft-deleting in Operis.
   */
  static async deleteClerkUser(clerkUserId: string): Promise<void> {
    const db = getDb();
    await db
      .update(schema.users)
      .set({ status: "DELETED", updatedAt: new Date() })
      .where(eq(schema.users.clerkUserId, clerkUserId));
  }
}
