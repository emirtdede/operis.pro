import {
  User,
  Briefcase,
  Sliders,
  Building2,
  Lock,
  Bell,
  Shield,
  type LucideIcon,
} from "lucide-react";

export type SettingsCategory =
  | "profile"
  | "work"
  | "account"
  | "corporate"
  | "security"
  | "notifications"
  | "privacy";

export interface ProfileLinkItem {
  id?: string;
  type: string;
  label: string;
  url: string;
  sortOrder?: number;
}

export interface SettingsViewProps {
  initialProfile: {
    displayName: string;
    handle: string;
    headline?: string | null;
    about: string | null;
    avatarUrl?: string | null;
    avatarSource?: string | null;
    links?: ProfileLinkItem[];
    roles?: string[];
    showLocation: boolean;
    revealPhoneAfterMatch: boolean;
    allowSearchIndex?: boolean;
    locale: string;
    theme: string;
    preferredContactChannel?: string | null;
    timeZone?: string | null;
    isAvailableForHire?: boolean;
    isActivelyHiring?: boolean;
    availabilityStatus?: import("@/src/modules/profiles/services/availability.service").AvailabilityStatus;
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
    invoiceAddress?: string | null;
    iban?: string | null;
    bankName?: string | null;
    accountHolder?: string | null;
  };
  twoFactorEnabled: boolean;
  locale: string;
  initialTab?: string;
}

export interface SettingsCategoryItem {
  id: SettingsCategory;
  label: string;
  desc: string;
  icon: LucideIcon;
  badge?: string;
  keywords: string[];
}

export function normalizeCategory(tab?: string | null): SettingsCategory {
  if (tab === "visibility") return "privacy";
  if (tab === "advertising") return "notifications";
  if (
    tab === "profile" ||
    tab === "work" ||
    tab === "account" ||
    tab === "corporate" ||
    tab === "security" ||
    tab === "notifications" ||
    tab === "privacy"
  ) {
    return tab;
  }
  return "profile";
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
      id: "profile",
      label: isTr ? "Profil & Kimlik" : "Profile & Identity",
      desc: isTr ? "Kullanıcı adı, isim, ünvan, bio ve bağlantılar" : "Handle, name, headline, bio, and social links",
      icon: User,
      keywords: ["handle", "kullanıcı adı", "isim", "ad", "soyad", "name", "bio", "biyografi", "avatar", "fotoğraf", "resim", "link", "github", "linkedin", "website"],
    },
    {
      id: "work",
      label: isTr ? "Müsaitlik & Çalışma" : "Availability & Work",
      desc: isTr ? "Müsaitlik durumu, haftalık saat, iş türü tercihleri" : "Availability status, weekly hours, contract type",
      icon: Briefcase,
      keywords: ["müsaitlik", "availability", "çalışma", "saat", "hours", "retainer", "freelance", "fulltime", "kontrat", "bütçe", "ücret"],
    },
    {
      id: "account",
      label: isTr ? "Hesap & Bölgesel" : "Account & Region",
      desc: isTr ? "E-posta, bağlı Google hesabı, dil, tema ve saat dilimi" : "Email, connected Google account, language, theme",
      icon: Sliders,
      keywords: ["email", "e-posta", "google", "oauth", "dil", "language", "tema", "theme", "karanlık", "dark", "saat dilimi", "timezone", "iletişim", "whatsapp"],
    },
    {
      id: "corporate",
      label: isTr ? "Kurumsal & Fatura" : "Corporate & Billing",
      desc: isTr ? "GİB vergi doğrulaması, fatura adresi ve IBAN" : "Tax verification, invoice details, and IBAN payout",
      icon: Building2,
      keywords: ["vergi", "tax", "vkn", "tckn", "fatura", "invoice", "şirket", "company", "iban", "banka", "bank", "hakediş", "kurumsal"],
    },
    {
      id: "security",
      label: isTr ? "Giriş & Güvenlik" : "Sign-in & Security",
      desc: isTr ? "Şifre, 2FA doğrulaması ve aktif oturum cihazları" : "Password, 2FA auth, and active session devices",
      icon: Lock,
      keywords: ["şifre", "password", "2fa", "totp", "güvenlik", "security", "oturum", "sessions", "cihaz", "device", "ip"],
    },
    {
      id: "notifications",
      label: isTr ? "Bildirim Matrisi" : "Notifications Matrix",
      desc: isTr ? "İlan, teklif, mesaj ve bülten bildirim sıklığı" : "Listings, offers, chats, and newsletter alerts",
      icon: Bell,
      keywords: ["bildirim", "notification", "ilan", "radar", "teklif", "offer", "mesaj", "bülten", "newsletter", "push", "ses"],
    },
    {
      id: "privacy",
      label: isTr ? "Gizlilik & KVKK" : "Privacy & KVKK",
      desc: isTr ? "Telefon/konum gizliliği, veri indirme, tehlike bölgesi" : "Phone/location privacy, data export, danger zone",
      icon: Shield,
      keywords: ["gizlilik", "privacy", "telefon", "phone", "konum", "location", "kvkk", "gdpr", "export", "veri indir", "engellenen", "block", "sil", "delete", "dondur"],
    },
  ];
}
