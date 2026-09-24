import { describe, it, expect } from "vitest";
import { resolveUserPersonaMode, getPersonaBadgeConfig } from "@/src/modules/profiles/utils/persona";
import { ProfileService } from "@/src/modules/profiles/service";
import { DEFAULT_USER } from "@/src/modules/auth/demo-user";

describe("User Persona Resolution (Freelancer / Employer / Hybrid)", () => {
  it("resolves pure freelancer when available for hire and not hiring", () => {
    const persona = resolveUserPersonaMode({
      roles: ["freelancer"],
      isAvailableForHire: true,
      isActivelyHiring: false,
      isCompanyVerified: false,
    });
    expect(persona).toBe("freelancer");
  });

  it("resolves pure employer when actively hiring and not available for hire", () => {
    const persona = resolveUserPersonaMode({
      roles: ["employer"],
      isAvailableForHire: false,
      isActivelyHiring: true,
      isCompanyVerified: true,
    });
    expect(persona).toBe("employer");
  });

  it("resolves hybrid when both available for hire and actively hiring are true", () => {
    const persona = resolveUserPersonaMode({
      roles: ["freelancer"],
      isAvailableForHire: true,
      isActivelyHiring: true,
    });
    expect(persona).toBe("hybrid");
  });

  it("resolves hybrid when both freelancer and employer roles are present", () => {
    const persona = resolveUserPersonaMode({
      roles: ["freelancer", "employer"],
      isAvailableForHire: false,
      isActivelyHiring: false,
    });
    expect(persona).toBe("hybrid");
  });

  it("resolves employer if user is founder and actively hiring", () => {
    const persona = resolveUserPersonaMode({
      roles: ["founder"],
      isAvailableForHire: false,
      isActivelyHiring: true,
    });
    expect(persona).toBe("employer");
  });

  it("resolves employer if user is company verified with employer role", () => {
    const persona = resolveUserPersonaMode({
      roles: ["employer"],
      isAvailableForHire: false,
      isActivelyHiring: false,
      isCompanyVerified: true,
    });
    expect(persona).toBe("employer");
  });

  it("defaults to freelancer if no indicators exist", () => {
    const persona = resolveUserPersonaMode({
      roles: [],
      isAvailableForHire: false,
      isActivelyHiring: false,
    });
    expect(persona).toBe("freelancer");
  });
});

describe("Persona Badge & UI Configuration (TR / EN)", () => {
  it("provides localized badge config for freelancer", () => {
    const trConfig = getPersonaBadgeConfig("freelancer", false, true);
    expect(trConfig.label).toBe("Doğrulanmış Uzman");
    expect(trConfig.mode).toBe("freelancer");

    const enConfig = getPersonaBadgeConfig("freelancer", false, false);
    expect(enConfig.label).toBe("Verified Specialist");
  });

  it("provides localized badge config for employer", () => {
    const trConfig = getPersonaBadgeConfig("employer", false, true);
    expect(trConfig.label).toBe("Doğrulanmış İşveren");
    expect(trConfig.mode).toBe("employer");

    const enConfig = getPersonaBadgeConfig("employer", false, false);
    expect(enConfig.label).toBe("Verified Client");
  });

  it("provides localized badge config for hybrid", () => {
    const trConfig = getPersonaBadgeConfig("hybrid", false, true);
    expect(trConfig.label).toBe("Hibrit Üye");
    expect(trConfig.mode).toBe("hybrid");
    expect(trConfig.badgeText).toBe("Hibrit • Uzman & İşveren");

    const enConfig = getPersonaBadgeConfig("hybrid", false, false);
    expect(enConfig.label).toBe("Hybrid Member");
  });

  it("provides company verified badge config when company verification is true", () => {
    const trConfig = getPersonaBadgeConfig("employer", true, true);
    expect(trConfig.label).toBe("Doğrulanmış Şirket");

    const enConfig = getPersonaBadgeConfig("employer", true, false);
    expect(enConfig.label).toBe("Verified Company");
  });
});

describe("Public Profile Service Persona Integration", () => {
  it("injects computed personaMode into PublicProfileDto", async () => {
    const profile = await ProfileService.getPublicProfileByHandle(DEFAULT_USER.profile.handle);
    expect(profile).not.toBeNull();
    expect(profile?.personaMode).toBeDefined();
    expect(["freelancer", "employer", "hybrid"]).toContain(profile?.personaMode);
  });
});
