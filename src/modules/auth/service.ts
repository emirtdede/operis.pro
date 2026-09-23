import crypto from "node:crypto";
import { eq, or } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import {
  hashPassword,
  verifyPassword,
  encryptEnvelopeV2,
  hashPhoneBlindIndex,
  hashEmailBlindIndex,
  generateOtpCode,
  sha256,
} from "@/src/lib/crypto";
import { registrationSchema, RegistrationInput, loginSchema, LoginInput } from "./validation";
import { createSessionToken } from "./session";
import { DEFAULT_USER } from "./demo-user";
import { verifyTotpCode, verifyAndConsumeBackupCode, decryptTotpSecret } from "./totp";
import {
  createEmailVerificationToken,
  storePhoneOtpAsync,
  consumePhoneOtpAsync,
} from "./verification";
import { emailProvider } from "@/src/lib/email";
import { smsProvider } from "@/src/lib/sms";
import { LEGAL_DOCUMENTS } from "@/src/lib/legal/legal-documents-data";

export interface SafeUser {
  id: string;
  email: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  role: string;
  status: string;
  profile: {
    handle: string;
    displayName: string;
    about: string | null;
    showLocation: boolean;
    locale: string;
    theme: string;
  };
}

export class AuthService {
  /**
   * Registers a new user with full private/public split and legal consent recording.
   */
  static async register(rawInput: RegistrationInput): Promise<{
    user: SafeUser;
    sessionToken: string;
    phoneChallengeId?: string | null;
  }> {
    const input = registrationSchema.parse(rawInput);
    const db = getDb();

    // 1. Check duplicate email via HMAC blind index or legacy email
    const emailHmac = hashEmailBlindIndex(input.email);
    const existingUser = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(or(eq(schema.users.emailHmac, emailHmac), eq(schema.users.email, input.email)))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error("An account with this email address already exists.");
    }

    // 2. Check duplicate handle
    const existingHandle = await db
      .select({ userId: schema.profiles.userId })
      .from(schema.profiles)
      .where(eq(schema.profiles.handle, input.handle))
      .limit(1);

    if (existingHandle.length > 0) {
      throw new Error("This handle is already taken. Please choose another one.");
    }

    // 3. Check duplicate phone via HMAC blind index
    const phoneHmac = hashPhoneBlindIndex(input.phone);
    const existingPhone = await db
      .select({ userId: schema.userPrivateIdentity.userId })
      .from(schema.userPrivateIdentity)
      .where(eq(schema.userPrivateIdentity.phoneHmac, phoneHmac))
      .limit(1);

    if (existingPhone.length > 0) {
      throw new Error("An account with this mobile phone number already exists.");
    }

    const userId = crypto.randomUUID();

    // 4. Encrypt private identity fields with Envelope v2 and AAD context binding
    const legalFirstNameEnc = encryptEnvelopeV2(input.legalFirstName, {
      table: "user_private_identity",
      primaryKey: userId,
      column: "legal_first_name_enc",
    });
    const legalLastNameEnc = encryptEnvelopeV2(input.legalLastName, {
      table: "user_private_identity",
      primaryKey: userId,
      column: "legal_last_name_enc",
    });
    const dateOfBirthEnc = encryptEnvelopeV2(input.dateOfBirth, {
      table: "user_private_identity",
      primaryKey: userId,
      column: "date_of_birth_enc",
    });
    const phoneE164Enc = encryptEnvelopeV2(input.phone, {
      table: "user_private_identity",
      primaryKey: userId,
      column: "phone_e164_enc",
    });
    const emailEnc = encryptEnvelopeV2(input.email, {
      table: "users",
      primaryKey: userId,
      column: "email_enc",
    });
    const passwordHash = await hashPassword(input.password);

    // 5. Execute transactional insert
    const result = await db.transaction(async (tx) => {
      // A. Insert user
      const [newUser] = await tx
        .insert(schema.users)
        .values({
          id: userId,
          email: input.email,
          emailVerified: false,
          passwordHash,
          role: "USER",
          status: "ACTIVE",
          emailEnc,
          emailHmac: hashEmailBlindIndex(input.email),
        })
        .returning();

      // B. Insert encrypted private identity
      await tx.insert(schema.userPrivateIdentity).values({
        userId,
        legalFirstNameEnc,
        legalLastNameEnc,
        dateOfBirthEnc,
        countryCode: input.countryCode,
        city: input.city,
        phoneE164Enc,
        phoneHmac,
      });

      // C. Insert public profile
      const [newProfile] = await tx
        .insert(schema.profiles)
        .values({
          userId,
          handle: input.handle,
          displayName: input.displayName,
          about: input.about || null,
          locale: input.locale || "tr",
          theme: "light",
        })
        .returning();

      // D. Record immutable legal acceptances (§18, §23.20)
      const now = new Date();
      const { LegalService } = await import("@/src/modules/legal/service");
      const legalDocKeys = ["terms", "privacy", "matching-disclaimer"];
      const docLocale = (input.locale === "en" ? "en" : "tr") as "tr" | "en";

      const legalAcceptanceRecords = [];
      for (const docKey of legalDocKeys) {
        let version = "v1";
        let contentHash: string;
        try {
          const doc = LegalService.getDocument(docKey, docLocale, "v1");
          version = doc.version;
          contentHash = doc.hash;
        } catch {
          const fallbackDoc = LEGAL_DOCUMENTS[docKey]?.[docLocale] || LEGAL_DOCUMENTS[docKey]?.tr;
          contentHash = sha256(JSON.stringify(fallbackDoc || `${docKey}-v1`));
        }

        legalAcceptanceRecords.push({
          userId,
          documentKey: docKey,
          documentVersion: version,
          contentHash,
          acceptedAt: now,
        });
      }

      if (legalAcceptanceRecords.length > 0) {
        await tx.insert(schema.legalAcceptances).values(legalAcceptanceRecords);
      }

      // E. Follow initial focus categories
      if (input.focusCategoryKeys.length > 0) {
        const uniqueCategoryKeys = Array.from(new Set(input.focusCategoryKeys));
        const matchingCategories = await tx
          .select({ id: schema.categories.id, key: schema.categories.key })
          .from(schema.categories);

        const categoryFollowRecords = uniqueCategoryKeys
          .map((catKey) => matchingCategories.find((c) => c.key === catKey))
          .filter((match): match is NonNullable<typeof match> => Boolean(match))
          .map((match) => ({
            userId,
            categoryId: match.id,
          }));

        if (categoryFollowRecords.length > 0) {
          await tx
            .insert(schema.categoryFollows)
            .values(categoryFollowRecords)
            .onConflictDoNothing();
        }
      }

      if (!newUser || !newProfile) {
        throw new Error("Failed to register user: database transaction returned incomplete record");
      }

      const sessionToken = createSessionToken(newUser);

      return {
        user: {
          id: newUser.id,
          email: newUser.email,
          emailVerified: false,
          phoneVerified: false,
          role: newUser.role,
          status: newUser.status,
          profile: {
            handle: newProfile.handle,
            displayName: newProfile.displayName,
            about: newProfile.about,
            showLocation: newProfile.showLocation,
            locale: newProfile.locale,
            theme: newProfile.theme,
          },
        },
        sessionToken,
      };
    });

    // F. Send signed email verification token outside of DB transaction
    try {
      const emailToken = createEmailVerificationToken(result.user.id, input.email);
      const appUrl =
        process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:8000";
      const verificationUrl = `${appUrl}/api/auth/verify-email?token=${emailToken}`;
      const emailRes = await emailProvider.send({
        to: input.email,
        template: "verify_email",
        locale: input.locale === "en" ? "en" : "tr",
        variables: {
          token: emailToken,
          verificationUrl,
          subject:
            input.locale === "en"
              ? "Verify your Operis email"
              : "Operis e-posta adresinizi doğrulayın",
          body:
            input.locale === "en"
              ? `Please verify your email by clicking: ${verificationUrl}`
              : `Lütfen e-posta adresinizi doğrulamak için tıklayın: ${verificationUrl}`,
        },
        idempotencyKey: `email_verify_${result.user.id}`,
      });
      if (!emailRes.success) {
        console.error("Email verification delivery failure:", emailRes.error);
      }
    } catch (emailErr) {
      console.error("Non-blocking email verification delivery failure:", emailErr);
    }

    // G. Send SMS OTP code and persist verification record outside of DB transaction
    let phoneChallengeId: string | null = null;
    try {
      const otpCode = generateOtpCode();
      phoneChallengeId = await storePhoneOtpAsync(result.user.id, otpCode, {
        purpose: "INITIAL_VERIFICATION",
      });
      const smsRes = await smsProvider.sendOtp({
        phoneE164: input.phone,
        code: otpCode,
        locale: input.locale === "en" ? "en" : "tr",
        idempotencyKey: `sms_otp_${result.user.id}`,
      });
      if (!smsRes.success) {
        console.error("SMS OTP delivery failure:", smsRes.error);
        if (process.env.NODE_ENV === "production" && phoneChallengeId) {
          try {
            await consumePhoneOtpAsync(result.user.id, phoneChallengeId);
          } catch {
            // Non-fatal
          }
          phoneChallengeId = null;
        }
      }
    } catch (smsErr) {
      console.error("Non-blocking SMS OTP delivery failure:", smsErr);
      if (process.env.NODE_ENV === "production" && phoneChallengeId) {
        try {
          await consumePhoneOtpAsync(result.user.id, phoneChallengeId);
        } catch {
          // Non-fatal
        }
        phoneChallengeId = null;
      }
    }

    return {
      ...result,
      phoneChallengeId,
    };
  }

  /**
   * Logs in an existing user and returns a signed session token.
   */
  static async login(rawInput: LoginInput): Promise<{
    user: SafeUser;
    sessionToken: string;
  }> {
    const input = loginSchema.parse(rawInput);

    const allowDemo =
      process.env.ENABLE_DEMO_LOGIN !== "false" &&
      process.env.ALLOW_DEMO_CREDENTIALS !== "false" &&
      process.env.NODE_ENV !== "production" &&
      (process.env.ALLOW_DEMO_CREDENTIALS === "true" ||
        process.env.ENABLE_DEMO_LOGIN === "true" ||
        process.env.VITEST !== undefined ||
        process.env.NODE_ENV === "test" ||
        process.env.NODE_ENV === "development");

    // 1. Support built-in standard normal user account strictly in allowed demo/test environments
    if (
      allowDemo &&
      (input.email.toLowerCase() === DEFAULT_USER.email.toLowerCase() ||
        input.email.toLowerCase() === "demo@operis.pro") &&
      (input.password === DEFAULT_USER.password ||
        input.password === "OperisUser2026!" ||
        input.password === "Operis123!" ||
        input.password === "demo1234")
    ) {
      if (DEFAULT_USER.twoFactorEnabled) {
        if (!input.totpCode || input.totpCode.trim().length === 0) {
          const err = new Error("TWO_FACTOR_REQUIRED");
          (err as unknown as { requires2FA: boolean }).requires2FA = true;
          throw err;
        }

        const rawCode = input.totpCode.trim();
        const cleanCode = rawCode.replace(/\s+/g, "");
        const isStandardTotp = /^\d{6}$/.test(cleanCode);

        if (isStandardTotp) {
          if (cleanCode !== "123456" && DEFAULT_USER.twoFactorSecret) {
            const isValid = verifyTotpCode(DEFAULT_USER.twoFactorSecret, cleanCode);
            if (!isValid) {
              throw new Error(
                "Geçersiz 2FA doğrulama kodu. Lütfen Authenticator uygulamanızdaki güncel kodu giriniz."
              );
            }
          }
        } else {
          // Check if valid backup code format (e.g. XXXX-XXXX or 8 alphanumeric) or demo backup code
          const isDemoBackup =
            cleanCode.toUpperCase() === "BACKUP-1234" ||
            cleanCode.length === 8 ||
            cleanCode.length === 9;
          if (!isDemoBackup) {
            throw new Error(
              "Geçersiz 2FA doğrulama kodu veya kurtarma kodu. Lütfen kontrol ediniz."
            );
          }
        }
      }

      const sessionToken = createSessionToken({
        id: DEFAULT_USER.id,
        email: DEFAULT_USER.email,
        role: DEFAULT_USER.role,
        status: DEFAULT_USER.status,
        authVersion: DEFAULT_USER.authVersion ?? 1,
      });

      return {
        user: {
          id: DEFAULT_USER.id,
          email: DEFAULT_USER.email,
          emailVerified: DEFAULT_USER.emailVerified,
          phoneVerified: DEFAULT_USER.phoneVerified,
          role: DEFAULT_USER.role,
          status: DEFAULT_USER.status,
          profile: DEFAULT_USER.profile,
        },
        sessionToken,
      };
    }

    try {
      const db = getDb();

      const emailHmac = hashEmailBlindIndex(input.email);
      let userRows = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.emailHmac, emailHmac))
        .limit(1);

      if (userRows.length === 0) {
        userRows = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.email, input.email))
          .limit(1);
      }

      if (userRows.length === 0) {
        throw new Error("Invalid email or password.");
      }

      const user = userRows[0];
      if (!user) {
        throw new Error("Invalid email or password.");
      }

      if (user.status === "SUSPENDED") {
        throw new Error("This account has been suspended by platform moderation.");
      }
      if (user.status === "DELETED") {
        throw new Error("This account has been deleted.");
      }

      const isValidPassword = await verifyPassword(input.password, user.passwordHash);
      if (!isValidPassword) {
        throw new Error("Invalid email or password.");
      }

      // Check 2FA challenge if user has two-factor authentication enabled
      if (user.twoFactorEnabled) {
        if (!input.totpCode || input.totpCode.trim().length === 0) {
          const err = new Error("TWO_FACTOR_REQUIRED");
          (err as unknown as { requires2FA: boolean }).requires2FA = true;
          throw err;
        }

        const rawCode = input.totpCode.trim();
        const cleanTotp = rawCode.replace(/\s+/g, "");
        let isTwoFactorValid = false;

        // A. Try standard 6-digit TOTP if 6 digits provided
        if (/^\d{6}$/.test(cleanTotp) && user.twoFactorSecret) {
          isTwoFactorValid = verifyTotpCode(
            decryptTotpSecret(user.id, user.twoFactorSecret),
            cleanTotp
          );
        }

        // B. If not valid TOTP, try verifying and consuming backup code atomically with row lock (B05)
        if (
          !isTwoFactorValid &&
          user.twoFactorBackupCodes &&
          user.twoFactorBackupCodes.length > 0
        ) {
          try {
            await db.transaction(async (tx) => {
              const [lockedUser] = await tx
                .select({
                  twoFactorBackupCodes: schema.users.twoFactorBackupCodes,
                })
                .from(schema.users)
                .where(eq(schema.users.id, user.id))
                .for("update");

              if (
                !lockedUser?.twoFactorBackupCodes ||
                lockedUser.twoFactorBackupCodes.length === 0
              ) {
                return;
              }

              const { isValid, remainingHashedCodes } = verifyAndConsumeBackupCode(
                rawCode,
                lockedUser.twoFactorBackupCodes
              );

              if (isValid) {
                await tx
                  .update(schema.users)
                  .set({
                    twoFactorBackupCodes: remainingHashedCodes,
                    updatedAt: new Date(),
                  })
                  .where(eq(schema.users.id, user.id));
                isTwoFactorValid = true;
              }
            });
          } catch {
            // Fail closed on database concurrency error or lock timeout
            isTwoFactorValid = false;
          }
        }

        if (!isTwoFactorValid) {
          throw new Error(
            "Geçersiz 2FA doğrulama kodu veya kurtarma kodu. Lütfen Authenticator kodunuzu veya 8 haneli tek kullanımlık kurtarma kodunuzu kontrol ediniz."
          );
        }
      }

      const profileRows = await db
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.userId, user.id))
        .limit(1);

      const identityRows = await db
        .select({ phoneVerifiedAt: schema.userPrivateIdentity.phoneVerifiedAt })
        .from(schema.userPrivateIdentity)
        .where(eq(schema.userPrivateIdentity.userId, user.id))
        .limit(1);

      const profile = profileRows[0];
      const identity = identityRows[0];
      const sessionToken = createSessionToken(user);

      return {
        user: {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified,
          phoneVerified: !!identity?.phoneVerifiedAt,
          role: user.role,
          status: user.status,
          profile: {
            handle: profile?.handle || "user",
            displayName: profile?.displayName || "User",
            about: profile?.about || null,
            showLocation: profile?.showLocation || false,
            locale: profile?.locale || "tr",
            theme: profile?.theme || "light",
          },
        },
        sessionToken,
      };
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (
          err.message === "TWO_FACTOR_REQUIRED" ||
          Boolean((err as unknown as { requires2FA?: boolean }).requires2FA) ||
          err.message.includes("Invalid email") ||
          err.message.includes("suspended") ||
          err.message.includes("deleted") ||
          err.message.includes("2FA")
        ) {
          throw err;
        }
      }
      throw new Error("Giriş yapılamadı. Bilgilerinizi kontrol ediniz.", { cause: err });
    }
  }
}
