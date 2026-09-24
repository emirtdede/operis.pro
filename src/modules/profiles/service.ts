import { ProfileLinkInput } from "./links";
import {
  AvailabilityStatus,
  DynamicAvailabilityResult,
  resolveDynamicAvailability,
} from "./services/availability.service";
import {
  CompanyVerificationService,
  VerifyCompanyInput,
  VerifyCompanyResult,
} from "./services/company-verification.service";
import {
  ProfileDataService,
  PublicProfileDto,
  UpdateProfileInput,
  inMemoryUserLinks,
} from "./services/profile-data.service";

import {
  PersonaMode,
  resolveUserPersonaMode,
  getPersonaBadgeConfig,
} from "./utils/persona";

export type {
  AvailabilityStatus,
  DynamicAvailabilityResult,
  VerifyCompanyInput,
  VerifyCompanyResult,
  PublicProfileDto,
  UpdateProfileInput,
  PersonaMode,
};

export {
  resolveDynamicAvailability,
  CompanyVerificationService,
  ProfileDataService,
  inMemoryUserLinks,
  resolveUserPersonaMode,
  getPersonaBadgeConfig,
};

/**
 * Facade for Profile domain services.
 * Orchestrates ProfileDataService, CompanyVerificationService, and Availability engine.
 */
export class ProfileService {
  /**
   * Fetches public profile with only mutually completed work and public links.
   * Never exposes private identity or incomplete projects.
   */
  static async getPublicProfileByHandle(handle: string): Promise<PublicProfileDto | null> {
    return ProfileDataService.getPublicProfileByHandle(handle);
  }

  /**
   * Updates profile fields with validation and reserved handles protection.
   */
  static async updateProfile(userId: string, input: UpdateProfileInput): Promise<void> {
    return ProfileDataService.updateProfile(userId, input);
  }

  /**
   * Replaces profile links transactionally (maximum 10 links allowed).
   */
  static async updateLinks(userId: string, linksInput: ProfileLinkInput[]): Promise<void> {
    return ProfileDataService.updateLinks(userId, linksInput);
  }

  /**
   * Retrieves full profile settings and configured links for the given user ID.
   */
  static async getProfileByUserId(userId: string) {
    return ProfileDataService.getProfileByUserId(userId);
  }

  /**
   * Verifies and records corporate company credentials (VKN/TCKN) with GİB checksum and blind indexing.
   */
  static async verifyCompany(userId: string, input: VerifyCompanyInput): Promise<VerifyCompanyResult> {
    return CompanyVerificationService.verifyCompany(userId, input);
  }

  /**
   * Approves corporate verification and activates corporate badge (Admin only).
   */
  static async approveCompanyVerification(adminUserId: string, targetUserId: string) {
    return CompanyVerificationService.approveCompanyVerification(adminUserId, targetUserId);
  }

  /**
   * Rejects corporate verification (Admin only).
   */
  static async rejectCompanyVerification(adminUserId: string, targetUserId: string, reason?: string) {
    return CompanyVerificationService.rejectCompanyVerification(adminUserId, targetUserId, reason);
  }
}
