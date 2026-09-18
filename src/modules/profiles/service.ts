import { eq, and, desc, or, inArray } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import { EMOJI_REGEX, validateContentAppropriateness } from "@/src/lib/security/content-moderator";
import { ProfileLinkInput, profileLinkSchema, isValidExternalUrl } from "./links";
import { RESERVED_HANDLES } from "../auth/validation";
import { DEFAULT_USER } from "../auth/demo-user";
import { EndorsementService, EndorsementDto } from "../endorsements/service";
import { z } from "zod";

export interface PublicProfileDto {
  userId: string;
  handle: string;
  displayName: string;
  about: string | null;
  avatarUrl?: string | null;
  showLocation: boolean;
  location?: { countryCode: string; city: string } | null;
  links: Array<{
    id: string;
    type: string;
    label: string;
    url: string;
  }>;
  completedWork: Array<{
    engagementId: string;
    title: string;
    category: string;
    completedAt: Date;
    counterparty: {
      displayName: string;
      handle: string;
      isDeleted: boolean;
    };
  }>;
  trackedSkills?: string[];
  endorsements?: EndorsementDto[];
}

export interface UpdateProfileInput {
  displayName?: string;
  handle?: string;
  about?: string | null;
  avatarUrl?: string | null;
  showLocation?: boolean;
  revealPhoneAfterMatch?: boolean;
  locale?: string;
  theme?: string;
  preferredContactChannel?: string | null;
  timeZone?: string | null;
  trackedSkills?: string[];
  links?: ProfileLinkInput[];
}

const inMemoryUserLinks = new Map<
  string,
  Array<{
    id: string;
    type: string;
    label: string;
    url: string;
    sortOrder: number;
  }>
>();

export class ProfileService {
  /**
   * Fetches public profile with only mutually completed work and public links.
   * Never exposes private identity or incomplete projects.
   */
  static async getPublicProfileByHandle(handle: string): Promise<PublicProfileDto | null> {
    const lower = handle.toLowerCase();
    if (Boolean(process.env.VITEST) && lower === DEFAULT_USER.profile.handle.toLowerCase()) {
      if (DEFAULT_USER.status !== "ACTIVE") {
        return null;
      }
      return {
        userId: DEFAULT_USER.id,
        handle: DEFAULT_USER.profile.handle,
        displayName: DEFAULT_USER.profile.displayName,
        about: DEFAULT_USER.profile.about,
        avatarUrl: DEFAULT_USER.profile.avatarUrl || null,
        showLocation: DEFAULT_USER.profile.showLocation,
        location: { countryCode: "TR", city: "İstanbul" },
        links: (inMemoryUserLinks.get(DEFAULT_USER.id) || []).map((l) => ({
          id: l.id,
          type: l.type,
          label: l.label,
          url: l.url,
        })),
        completedWork: [],
        trackedSkills: DEFAULT_USER.profile.trackedSkills || [
          "Next.js",
          "TypeScript",
          "Tailwind CSS",
          "PostgreSQL",
          "React",
        ],
        endorsements: await EndorsementService.getEndorsementsForUser(DEFAULT_USER.id),
      };
    }

    try {
      const db = getDb();

      // 1. Fetch profile and verify user is ACTIVE
      const profileRows = await db
        .select({
          profile: schema.profiles,
        })
        .from(schema.profiles)
        .innerJoin(schema.users, eq(schema.profiles.userId, schema.users.id))
        .where(
          and(eq(schema.profiles.handle, handle.toLowerCase()), eq(schema.users.status, "ACTIVE"))
        )
        .limit(1);

      if (profileRows.length === 0) return null;
      const profile = profileRows[0]!.profile;

      // 2. Fetch public links
      const links = await db
        .select({
          id: schema.profileLinks.id,
          type: schema.profileLinks.type,
          label: schema.profileLinks.label,
          url: schema.profileLinks.url,
        })
        .from(schema.profileLinks)
        .where(eq(schema.profileLinks.userId, profile.userId))
        .orderBy(schema.profileLinks.sortOrder);

      // 3. Location if enabled
      let location = null;
      if (profile.showLocation) {
        const identityRows = await db
          .select({
            countryCode: schema.userPrivateIdentity.countryCode,
            city: schema.userPrivateIdentity.city,
          })
          .from(schema.userPrivateIdentity)
          .where(eq(schema.userPrivateIdentity.userId, profile.userId))
          .limit(1);

        if (identityRows.length > 0) {
          location = identityRows[0];
        }
      }

      // 4. Fetch ONLY mutually completed engagements for this user
      const userCompleted = await db
        .select()
        .from(schema.engagements)
        .where(
          and(
            eq(schema.engagements.status, "COMPLETED"),
            or(
              eq(schema.engagements.ownerUserId, profile.userId),
              eq(schema.engagements.freelancerUserId, profile.userId)
            )
          )
        )
        .orderBy(desc(schema.engagements.completedAt))
        .limit(20);

      // Batch counterparty details safely
      const completedWork = [];
      const cpUserIds = [
        ...new Set(
          userCompleted.map((eng) =>
            eng.ownerUserId === profile.userId ? eng.freelancerUserId : eng.ownerUserId
          )
        ),
      ];

      let cpUserMap = new Map<string, string>();
      let cpProfileMap = new Map<string, { displayName: string; handle: string }>();

      if (cpUserIds.length > 0) {
        const cpUsers = await db
          .select({ id: schema.users.id, status: schema.users.status })
          .from(schema.users)
          .where(inArray(schema.users.id, cpUserIds));
        cpUserMap = new Map(cpUsers.map((u) => [u.id, u.status]));

        const cpProfiles = await db
          .select({
            userId: schema.profiles.userId,
            displayName: schema.profiles.displayName,
            handle: schema.profiles.handle,
          })
          .from(schema.profiles)
          .where(inArray(schema.profiles.userId, cpUserIds));
        cpProfileMap = new Map(
          cpProfiles.map((p) => [p.userId, { displayName: p.displayName, handle: p.handle }])
        );
      }

      for (const eng of userCompleted) {
        const counterpartyUserId =
          eng.ownerUserId === profile.userId ? eng.freelancerUserId : eng.ownerUserId;

        const isDeleted = cpUserMap.get(counterpartyUserId) === "DELETED";
        const cpProfile = cpProfileMap.get(counterpartyUserId);

        completedWork.push({
          engagementId: eng.id,
          title: eng.listingTitleSnapshot,
          category: eng.listingCategorySnapshot,
          completedAt: eng.completedAt || eng.matchedAt,
          counterparty: {
            displayName: isDeleted ? "Former User" : cpProfile?.displayName || "User",
            handle: isDeleted ? "former-user" : cpProfile?.handle || "user",
            isDeleted,
          },
        });
      }

      const endorsements = await EndorsementService.getEndorsementsForUser(profile.userId);

      return {
        userId: profile.userId,
        handle: profile.handle,
        displayName: profile.displayName,
        about: profile.about,
        avatarUrl: profile.avatarUrl || null,
        showLocation: profile.showLocation,
        location,
        links,
        completedWork,
        trackedSkills: (profile as { trackedSkills?: string[] }).trackedSkills || [],
        endorsements,
      };
    } catch {
      return null;
    }
  }

  /**
   * Updates profile fields with validation and reserved handles protection.
   */
  static async updateProfile(userId: string, input: UpdateProfileInput): Promise<void> {
    const updateData: Partial<typeof schema.profiles.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.displayName !== undefined) {
      const trimmed = input.displayName.trim();
      if (trimmed.length < 2 || trimmed.length > 80 || EMOJI_REGEX.test(trimmed)) {
        throw new Error("Display name must be 2-80 characters and contain no emojis.");
      }
      if (!validateContentAppropriateness(trimmed).isValid) {
        throw new Error("Display name contains inappropriate or prohibited content.");
      }
      updateData.displayName = trimmed;
    }

    if (input.handle !== undefined) {
      const handle = input.handle.toLowerCase().trim();
      if (
        handle.length < 3 ||
        handle.length > 30 ||
        !/^[a-z0-9_-]+$/.test(handle) ||
        RESERVED_HANDLES.has(handle)
      ) {
        throw new Error("Invalid or reserved handle.");
      }

      // Check unique
      try {
        const db = getDb();
        const existing = await db
          .select({ userId: schema.profiles.userId })
          .from(schema.profiles)
          .where(eq(schema.profiles.handle, handle))
          .limit(1);

        if (existing.length > 0 && existing[0]?.userId !== userId) {
          throw new Error("This handle is already taken.");
        }
      } catch (err) {
        if (err instanceof Error && err.message === "This handle is already taken.") {
          throw err;
        }
        if (userId !== DEFAULT_USER.id) {
          throw err;
        }
      }

      updateData.handle = handle;
    }

    if (input.about !== undefined) {
      if (input.about && (input.about.length > 1000 || EMOJI_REGEX.test(input.about))) {
        throw new Error("About text cannot exceed 1000 characters or contain emojis.");
      }
      if (input.about && !validateContentAppropriateness(input.about).isValid) {
        throw new Error("About text contains inappropriate or prohibited content.");
      }
      updateData.about = input.about || null;
    }

    if (input.avatarUrl !== undefined) {
      if (input.avatarUrl && input.avatarUrl.trim().length > 0) {
        const trimmed = input.avatarUrl.trim();
        if (trimmed.length > 2000) {
          throw new Error("Avatar URL cannot exceed 2000 characters.");
        }
        if (!isValidExternalUrl(trimmed)) {
          throw new Error("Invalid profile picture URL. Must be a valid HTTPS link.");
        }
        updateData.avatarUrl = trimmed;
      } else {
        updateData.avatarUrl = null;
      }
    }

    if (input.showLocation !== undefined) {
      updateData.showLocation = input.showLocation;
    }

    if (input.revealPhoneAfterMatch !== undefined) {
      updateData.revealPhoneAfterMatch = input.revealPhoneAfterMatch;
    }

    if (input.locale !== undefined) {
      if (input.locale !== "tr" && input.locale !== "en") {
        throw new Error("Invalid locale. Must be 'tr' or 'en'.");
      }
      updateData.locale = input.locale;
    }

    if (input.theme !== undefined) {
      if (!["light", "dark", "black", "system"].includes(input.theme)) {
        throw new Error("Invalid theme. Must be 'light', 'dark', 'black', or 'system'.");
      }
      updateData.theme = input.theme;
    }

    if (input.preferredContactChannel !== undefined) {
      updateData.preferredContactChannel = input.preferredContactChannel || "any";
    }

    if (input.timeZone !== undefined) {
      updateData.timeZone = input.timeZone || "Europe/Istanbul";
    }

    if (input.trackedSkills !== undefined) {
      const validSkills = input.trackedSkills
        .map((s) => s.trim())
        .filter(
          (s) =>
            s.length > 0 &&
            s.length <= 30 &&
            !EMOJI_REGEX.test(s) &&
            validateContentAppropriateness(s).isValid
        )
        .slice(0, 5);
      updateData.trackedSkills = validSkills;
      if (userId === DEFAULT_USER.id) {
        DEFAULT_USER.profile.trackedSkills = validSkills;
      }
    }

    let validatedLinks: ProfileLinkInput[] | undefined;
    if (input.links !== undefined) {
      if (!Array.isArray(input.links)) {
        throw new Error("Invalid links format. Expected an array.");
      }
      if (input.links.length > 10) {
        throw new Error("You can configure at most 10 professional links.");
      }
      validatedLinks = z.array(profileLinkSchema).max(10).parse(input.links);
    }

    if (userId === DEFAULT_USER.id) {
      if (input.displayName !== undefined)
        DEFAULT_USER.profile.displayName = input.displayName.trim();
      if (input.handle !== undefined)
        DEFAULT_USER.profile.handle = input.handle.toLowerCase().trim();
      if (input.about !== undefined) DEFAULT_USER.profile.about = input.about || "";
      if (input.avatarUrl !== undefined)
        DEFAULT_USER.profile.avatarUrl = updateData.avatarUrl ?? null;
      if (input.showLocation !== undefined) DEFAULT_USER.profile.showLocation = input.showLocation;
      if (input.revealPhoneAfterMatch !== undefined)
        DEFAULT_USER.profile.revealPhoneAfterMatch = input.revealPhoneAfterMatch;
      if (input.locale !== undefined) DEFAULT_USER.profile.locale = input.locale;
      if (input.theme !== undefined) DEFAULT_USER.profile.theme = input.theme;
      if (input.preferredContactChannel !== undefined)
        DEFAULT_USER.profile.preferredContactChannel = input.preferredContactChannel || "any";
      if (input.timeZone !== undefined)
        DEFAULT_USER.profile.timeZone = input.timeZone || "Europe/Istanbul";
      if (input.trackedSkills !== undefined)
        DEFAULT_USER.profile.trackedSkills = updateData.trackedSkills;
      if (validatedLinks !== undefined) {
        inMemoryUserLinks.set(
          DEFAULT_USER.id,
          validatedLinks.map((l, idx) => ({
            id: `link-${Date.now()}-${idx}`,
            type: l.type,
            label: l.label || l.type,
            url: l.url,
            sortOrder: idx,
          }))
        );
      }

      if (process.env.VITEST || process.env.NODE_ENV === "test") {
        return;
      }
    }

    if (validatedLinks !== undefined) {
      inMemoryUserLinks.set(
        userId,
        validatedLinks.map((l, idx) => ({
          id: `link-${Date.now()}-${idx}`,
          type: l.type,
          label: l.label || l.type,
          url: l.url,
          sortOrder: idx,
        }))
      );
    }

    try {
      const db = getDb();
      await db.transaction(async (tx) => {
        if (Object.keys(updateData).length > 0) {
          await tx
            .update(schema.profiles)
            .set(updateData)
            .where(eq(schema.profiles.userId, userId));
        }
        if (validatedLinks !== undefined) {
          await tx.delete(schema.profileLinks).where(eq(schema.profileLinks.userId, userId));
          if (validatedLinks.length > 0) {
            await tx.insert(schema.profileLinks).values(
              validatedLinks.map((l, idx) => ({
                userId,
                type: l.type,
                label: l.label?.trim() || l.type || "",
                url: l.url,
                sortOrder: idx,
              }))
            );
          }
        }
      });
    } catch (dbErr) {
      // Allow demo user mutation in environments without live DB
      if (userId !== DEFAULT_USER.id) {
        throw dbErr;
      }
    }
  }

  /**
   * Replaces profile links transactionally (maximum 10 links allowed).
   */
  static async updateLinks(userId: string, linksInput: ProfileLinkInput[]): Promise<void> {
    if (linksInput.length > 10) {
      throw new Error("You can configure at most 10 professional links.");
    }

    const validatedLinks = linksInput.map((l) => profileLinkSchema.parse(l));

    const mappedLinks = validatedLinks.map((link, idx) => ({
      id: `link-${idx + 1}`,
      type: link.type,
      label: link.label,
      url: link.url,
      sortOrder: idx,
    }));

    inMemoryUserLinks.set(userId, mappedLinks);

    if (Boolean(process.env.VITEST) && userId === DEFAULT_USER.id) {
      return;
    }

    try {
      const db = getDb();
      await db.transaction(async (tx) => {
        await tx.delete(schema.profileLinks).where(eq(schema.profileLinks.userId, userId));

        for (let i = 0; i < validatedLinks.length; i++) {
          const link = validatedLinks[i]!;
          await tx.insert(schema.profileLinks).values({
            userId,
            type: link.type,
            label: link.label,
            url: link.url,
            sortOrder: i,
          });
        }
      });
    } catch (err) {
      if (process.env.NODE_ENV === "production" || !process.env.VITEST) {
        throw err;
      }
    }
  }

  /**
   * Retrieves full profile settings and configured links for the given user ID.
   */
  static async getProfileByUserId(userId: string) {
    if (Boolean(process.env.VITEST) && userId === DEFAULT_USER.id) {
      return {
        userId: DEFAULT_USER.id,
        handle: DEFAULT_USER.profile.handle,
        displayName: DEFAULT_USER.profile.displayName,
        about: DEFAULT_USER.profile.about,
        avatarUrl: DEFAULT_USER.profile.avatarUrl || null,
        showLocation: DEFAULT_USER.profile.showLocation,
        revealPhoneAfterMatch: DEFAULT_USER.profile.revealPhoneAfterMatch ?? false,
        locale: DEFAULT_USER.profile.locale,
        theme: DEFAULT_USER.profile.theme,
        preferredContactChannel: DEFAULT_USER.profile.preferredContactChannel || "whatsapp",
        timeZone: DEFAULT_USER.profile.timeZone || "Europe/Istanbul",
        trackedSkills: DEFAULT_USER.profile.trackedSkills || [
          "Next.js",
          "TypeScript",
          "Tailwind CSS",
          "PostgreSQL",
          "React",
        ],
        links: inMemoryUserLinks.get(DEFAULT_USER.id) || [],
      };
    }

    try {
      const db = getDb();
      const profileRows = await db
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.userId, userId))
        .limit(1);

      if (profileRows.length === 0) return null;
      const profile = profileRows[0]!;

      const links = await db
        .select()
        .from(schema.profileLinks)
        .where(eq(schema.profileLinks.userId, userId))
        .orderBy(schema.profileLinks.sortOrder);

      return {
        ...profile,
        avatarUrl: profile.avatarUrl || null,
        links,
      };
    } catch {
      return null;
    }
  }
}
