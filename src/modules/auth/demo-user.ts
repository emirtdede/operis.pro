import type { AvailabilityStatus } from "@/src/modules/profiles/services/availability.service";

export interface DemoUser {
  id: string;
  email: string;
  password: string;
  role: "USER" | "ADMIN" | "MODERATOR";
  status: "ACTIVE" | "SUSPENDED" | "DELETED";
  emailVerified: boolean;
  phoneVerified: boolean;
  authVersion?: number;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  profile: {
    handle: string;
    displayName: string;
    about: string;
    avatarUrl?: string | null;
    showLocation: boolean;
    revealPhoneAfterMatch?: boolean;
    locale: string;
    theme: string;
    preferredContactChannel?: string | null;
    timeZone?: string | null;
    trackedSkills?: string[];
    headline?: string | null;
    roles?: string[];
    isAvailableForHire?: boolean;
    isActivelyHiring?: boolean;
    availabilityStatus?: AvailabilityStatus;
    availabilityHoursPerWeek?: number;
    availableFromDate?: string | null;
    availabilityNotice?: string | null;
    availabilityUpdatedAt?: Date;
    isCompanyVerified?: boolean;
    companyName?: string | null;
    companyType?: string | null;
    taxOffice?: string | null;
    vknMasked?: string | null;
    companyVerifiedAt?: Date | null;
  };
}

export const DEFAULT_USER: DemoUser = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "demo@operis.pro",
  password: "OperisUser2026!",
  role: "USER",
  status: "ACTIVE",
  emailVerified: true,
  phoneVerified: true,
  authVersion: 1,
  twoFactorEnabled: false,
  twoFactorSecret: undefined,
  profile: {
    handle: "demokullanici",
    displayName: "Demir Yıldız",
    about: "Kıdemli Yazılım Mühendisi & Teknoloji Profesyoneli",
    avatarUrl: null,
    showLocation: true,
    revealPhoneAfterMatch: false,
    locale: "tr",
    theme: "dark",
    preferredContactChannel: "whatsapp",
    timeZone: "Europe/Istanbul",
    trackedSkills: ["Next.js", "TypeScript", "Tailwind CSS", "PostgreSQL", "React"],
    headline: "Kıdemli Dağıtık Sistemler Mimarı & Girişimci",
    roles: ["employer", "freelancer"],
    isAvailableForHire: true,
    isActivelyHiring: true,
    isCompanyVerified: true,
    companyName: "Operis Teknoloji ve Yazılım A.Ş.",
    companyType: "AS",
    taxOffice: "Maslak V.D.",
    vknMasked: "879***7566",
    companyVerifiedAt: new Date("2026-01-15"),
    availabilityStatus: "AVAILABLE_NOW",
    availabilityHoursPerWeek: 40,
    availableFromDate: null,
    availabilityNotice: null,
    availabilityUpdatedAt: new Date("2026-09-01T00:00:00Z"),
  },
};
