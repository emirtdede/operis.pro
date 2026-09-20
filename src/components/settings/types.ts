import {
  Sliders,
  Shield,
  Eye,
  Lock,
  Megaphone,
  Bell,
  type LucideIcon,
} from "lucide-react";

export type SettingsCategory =
  | "account"
  | "security"
  | "visibility"
  | "privacy"
  | "advertising"
  | "notifications";

export interface SettingsViewProps {
  initialProfile: {
    displayName: string;
    handle: string;
    headline?: string | null;
    about: string | null;
    avatarUrl?: string | null;
    showLocation: boolean;
    revealPhoneAfterMatch: boolean;
    locale: string;
    theme: string;
    preferredContactChannel?: string | null;
    timeZone?: string | null;
    isAvailableForHire?: boolean;
    isActivelyHiring?: boolean;
    availabilityStatus?: "AVAILABLE_NOW" | "PARTIALLY_AVAILABLE" | "BUSY";
    availabilityHoursPerWeek?: number;
    availableFromDate?: string | null;
    availabilityNotice?: string | null;
    emailVerified?: boolean;
    phoneVerified?: boolean;
    email?: string;
    isCompanyVerified?: boolean;
    companyName?: string | null;
    companyType?: string | null;
    taxOffice?: string | null;
    vknMasked?: string | null;
    companyVerifiedAt?: Date | string | null;
  };
  twoFactorEnabled: boolean;
  locale: string;
}

export interface SettingsCategoryItem {
  id: SettingsCategory;
  label: string;
  desc: string;
  icon: LucideIcon;
}

export function getMarketingConsentFeedback(consent: boolean, isTr: boolean): string {
  if (consent) {
    return isTr ? "Pazarlama onayınız kaydedildi." : "Marketing preferences updated.";
  }
  return isTr ? "Pazarlama onayınız geri alındı." : "Marketing consent revoked.";
}

export function getTwoFactorButtonLabel(twoFactorEnabled: boolean, isTr: boolean): string {
  if (twoFactorEnabled) {
    return isTr ? "2FA Yönet" : "Manage 2FA";
  }
  return isTr ? "2FA Etkinleştir" : "Enable 2FA";
}

export function getSavePasswordButtonLabel(saving: boolean, isTr: boolean): string {
  if (saving) {
    return isTr ? "Güncelleniyor..." : "Updating...";
  }
  return isTr ? "Şifreyi Güncelle" : "Update Password";
}

export function getExportDataButtonLabel(exportLoading: boolean, isTr: boolean): string {
  if (exportLoading) {
    return isTr ? "Hazırlanıyor..." : "Exporting...";
  }
  return isTr ? "Verileri İndir" : "Request Export";
}

export function getSettingsCategories(isTr: boolean): SettingsCategoryItem[] {
  return [
    {
      id: "account",
      label: isTr ? "Hesap Tercihleri" : "Account preferences",
      desc: isTr ? "Dil, tema, saat dilimi ve hesap yönetimi" : "Language, theme, time zone, account close",
      icon: Sliders,
    },
    {
      id: "security",
      label: isTr ? "Giriş ve Güvenlik" : "Sign in & security",
      desc: isTr ? "Şifre, 2FA ve aktif oturumlar" : "Password, 2FA, and active sessions",
      icon: Lock,
    },
    {
      id: "visibility",
      label: isTr ? "Görünürlük" : "Visibility",
      desc: isTr ? "Profil, konum ve telefon gizliliği" : "Profile discovery, location, phone privacy",
      icon: Eye,
    },
    {
      id: "privacy",
      label: isTr ? "Veri Gizliliği" : "Data privacy",
      desc: isTr ? "KVKK/GDPR hakları ve verileri indirme" : "Data rights, export archive, search history",
      icon: Shield,
    },
    {
      id: "advertising",
      label: isTr ? "Reklam ve Pazarlama" : "Advertising data",
      desc: isTr ? "Bülten, eşleştirme ve ticari iletiler" : "Newsletter, match algorithms, commercial notices",
      icon: Megaphone,
    },
    {
      id: "notifications",
      label: isTr ? "Bildirimler" : "Notifications",
      desc: isTr ? "İlan, teklif ve e-posta bildirim sıklığı" : "Listings, bids, digest frequency",
      icon: Bell,
    },
  ];
}
