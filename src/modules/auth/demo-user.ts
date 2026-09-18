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
  };
}

export const DEFAULT_USER: DemoUser = {
  id: "d0000000-0000-0000-0000-000000000001",
  email: "kullanici@operis.pro",
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
  },
};
