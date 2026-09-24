export type PersonaMode = "freelancer" | "employer" | "hybrid";

export interface PersonaResolverParams {
  roles?: string[] | null;
  isAvailableForHire?: boolean | null;
  isActivelyHiring?: boolean | null;
  isCompanyVerified?: boolean | null;
  activeListingsCount?: number | null;
}

/**
 * Determines whether the user should be presented as a Freelancer, Employer, or Both (Hybrid).
 * Designed to be 100% deterministic and backward-compatible with existing boolean flags and roles.
 */
export function resolveUserPersonaMode(params: PersonaResolverParams): PersonaMode {
  const roles = (params.roles || []).map((r) => r.toLowerCase().trim());
  const hasFreelanceRole = roles.includes("freelancer") || roles.includes("agency");
  const hasEmployerRole = roles.includes("employer") || roles.includes("founder");

  const isAvailable = Boolean(params.isAvailableForHire);
  const isHiring = Boolean(params.isActivelyHiring || (params.activeListingsCount && params.activeListingsCount > 0));

  // 1. Explicit Dual Intent (Both Available for hire AND Actively Hiring)
  if ((isAvailable && isHiring) || (hasFreelanceRole && hasEmployerRole)) {
    return "hybrid";
  }

  // 2. Explicit Employer / Client Intent
  if (isHiring || (hasEmployerRole && !hasFreelanceRole) || (params.isCompanyVerified && !isAvailable)) {
    return "employer";
  }

  // 3. Fallback / Default: Freelancer / Independent Specialist
  return "freelancer";
}

export interface PersonaBadgeInfo {
  mode: PersonaMode;
  label: string;
  sublabel: string;
  colorClasses: string;
  badgeText: string;
}

export function getPersonaBadgeConfig(
  mode: PersonaMode,
  isCompanyVerified: boolean,
  isTr: boolean
): PersonaBadgeInfo {
  if (isCompanyVerified) {
    return {
      mode: "employer",
      label: isTr ? "Doğrulanmış Şirket" : "Verified Company",
      sublabel: isTr ? "GİB Resmi Kayıtlı Kurumsal İşveren" : "Officially Verified Corporate Entity",
      colorClasses: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      badgeText: isTr ? "Kurumsal İşveren" : "Corporate Client",
    };
  }

  switch (mode) {
    case "employer":
      return {
        mode: "employer",
        label: isTr ? "Doğrulanmış İşveren" : "Verified Client",
        sublabel: isTr ? "Proje ve Bütçe Sahibi" : "Project Owner & Client",
        colorClasses: "bg-sky-500/10 text-sky-400 border-sky-500/20",
        badgeText: isTr ? "Doğrulanmış İşveren" : "Verified Client",
      };
    case "hybrid":
      return {
        mode: "hybrid",
        label: isTr ? "Hibrit Üye" : "Hybrid Member",
        sublabel: isTr ? "Bağımsız Uzman & İşveren" : "Specialist & Client",
        colorClasses: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        badgeText: isTr ? "Hibrit • Uzman & İşveren" : "Hybrid • Talent & Client",
      };
    case "freelancer":
    default:
      return {
        mode: "freelancer",
        label: isTr ? "Doğrulanmış Uzman" : "Verified Specialist",
        sublabel: isTr ? "Bağımsız Profesyonel" : "Independent Professional",
        colorClasses: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        badgeText: isTr ? "Doğrulanmış Uzman" : "Verified Specialist",
      };
  }
}
