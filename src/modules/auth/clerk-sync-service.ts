import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import {
  encryptEnvelopeV2,
  hashEmailBlindIndex,
  hashPhoneBlindIndex,
  sha256,
} from "@/src/lib/crypto";
import { LegalService } from "@/src/modules/legal/service";

export interface SyncClerkUserInput {
  clerkUserId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  emailVerified?: boolean;
}

export interface SyncClerkUserResult {
  userId: string;
  isNewUser: boolean;
  handle: string;
  email: string;
  displayName: string;
}

export class ClerkSyncService {
  /**
   * Generates a safe, URL-friendly unique handle for the user based on their name or email.
   */
  private static async generateUniqueHandle(
    db: ReturnType<typeof getDb>,
    baseStr: string
  ): Promise<string> {
    let clean = baseStr
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_]/g, "");

    if (clean.length < 3) {
      clean = `user_${clean}`;
    }
    clean = clean.slice(0, 20);

    let candidate = clean;
    let attempt = 0;

    while (attempt < 10) {
      const [existing] = await db
        .select({ handle: schema.profiles.handle })
        .from(schema.profiles)
        .where(eq(schema.profiles.handle, candidate))
        .limit(1);

      if (!existing) {
        return candidate;
      }

      attempt++;
      const suffix = crypto.randomInt(100, 999).toString();
      candidate = `${clean.slice(0, 16)}_${suffix}`;
    }

    return `user_${crypto.randomBytes(4).toString("hex")}`;
  }

  /**
   * Ensures the mandatory userPrivateIdentity row exists for KVKK compliance and phone verification readiness.
   */
  private static async ensureUserPrivateIdentity(
    db: ReturnType<typeof getDb>,
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
   * Records immutable legal acceptances for terms, privacy, and matching disclaimer upon initial sync.
   */
  private static async recordInitialLegalAcceptances(
    db: ReturnType<typeof getDb>,
    userId: string
  ): Promise<void> {
    const legalDocKeys = ["terms", "privacy", "matching-disclaimer"];
    const now = new Date();

    for (const docKey of legalDocKeys) {
      let version = "v1";
      let contentHash: string;
      try {
        const doc = LegalService.getDocument(docKey, "tr", "v1");
        version = doc.version;
        contentHash = doc.hash;
      } catch {
        contentHash = sha256(`legal-${docKey}-v1`);
      }

      await db.insert(schema.legalAcceptances).values({
        userId,
        documentKey: docKey,
        documentVersion: version,
        contentHash,
        acceptedAt: now,
      });
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
      // Self-heal: ensure userPrivateIdentity exists and email encryption fields are populated
      await this.ensureUserPrivateIdentity(
        db,
        existingByClerkId.user.id,
        input.firstName,
        input.lastName
      );

      const userUpdates: Partial<typeof schema.users.$inferInsert> = {};
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
      if (Object.keys(userUpdates).length > 0) {
        await db
          .update(schema.users)
          .set({ ...userUpdates, updatedAt: new Date() })
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

      return {
        userId: existingByClerkId.user.id,
        isNewUser: false,
        handle: existingByClerkId.profile?.handle || "kullanici",
        email: existingByClerkId.user.email,
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

      return {
        userId: existingByEmail.user.id,
        isNewUser: false,
        handle: existingByEmail.profile?.handle || "kullanici",
        email: existingByEmail.user.email,
        displayName: existingByEmail.profile?.displayName || "Operis Kullanıcısı",
      };
    }

    // 3. New user: create users + userPrivateIdentity + profiles + legalAcceptances
    const userId = crypto.randomUUID();
    const displayName =
      [input.firstName, input.lastName].filter(Boolean).join(" ").trim() ||
      normalizedEmail.split("@")[0] ||
      "Operis Kullanıcısı";

    const baseHandle = input.firstName || normalizedEmail.split("@")[0] || "operis_user";
    const uniqueHandle = await this.generateUniqueHandle(db, baseHandle);

    const placeholderHash = `clerk_ext_${crypto.randomBytes(32).toString("hex")}`;
    const emailEnc = encryptEnvelopeV2(normalizedEmail, {
      table: "users",
      primaryKey: userId,
      column: "email_enc",
    });
    const emailHmac = hashEmailBlindIndex(normalizedEmail);

    const [newUser] = await db
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
    await this.ensureUserPrivateIdentity(db, newUser.id, input.firstName, input.lastName);

    // Insert public profile
    await db.insert(schema.profiles).values({
      userId: newUser.id,
      handle: uniqueHandle,
      displayName,
      avatarUrl: input.avatarUrl || null,
      avatarSource: "oauth",
      locale: "tr",
      theme: "dark",
    });

    // Record immutable legal consent records
    await this.recordInitialLegalAcceptances(db, newUser.id);

    return {
      userId: newUser.id,
      isNewUser: true,
      handle: uniqueHandle,
      email: normalizedEmail,
      displayName,
    };
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
