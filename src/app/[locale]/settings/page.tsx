import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ArrowLeft, Sliders } from "lucide-react";
import { getSession } from "@/src/modules/auth/session";
import { ProfileService } from "@/src/modules/profiles/service";
import { SettingsView } from "@/src/components/settings/settings-view";
import { Button } from "@/src/components/ui/button";
import { getLocalizedProfilePath } from "@/src/lib/i18n/routes";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = locale === "tr";

  return {
    title: isTr ? "Hesap Ayarları Merkezi" : "Account Settings",
    description: isTr
      ? "Operis hesap tercihlerinizi, güvenliğinizi, görünürlüğünüzü ve bildirimlerinizi yönetin."
      : "Manage your Operis account preferences, security, visibility, and notification settings.",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale } = await params;
  const { tab } = (await searchParams) || {};
  setRequestLocale(locale);
  const isTr = locale === "tr";

  const session = await getSession();
  if (!session?.userId) {
    redirect(isTr ? "/tr/giris" : "/en/login");
  }

  const profile = await ProfileService.getProfileByUserId(session.userId);

  let twoFactorEnabled = false;
  let emailVerified = false;
  let phoneVerified = false;

  try {
    const { getDb, schema } = await import("@/src/lib/db");
    const { eq } = await import("drizzle-orm");
    const db = getDb();
    const [user] = await db
      .select({
        emailVerified: schema.users.emailVerified,
        twoFactorEnabled: schema.users.twoFactorEnabled,
      })
      .from(schema.users)
      .where(eq(schema.users.id, session.userId))
      .limit(1);

    if (user) {
      emailVerified = user.emailVerified;
      twoFactorEnabled = user.twoFactorEnabled ?? false;
    }

    const [identity] = await db
      .select({ phoneVerifiedAt: schema.userPrivateIdentity.phoneVerifiedAt })
      .from(schema.userPrivateIdentity)
      .where(eq(schema.userPrivateIdentity.userId, session.userId))
      .limit(1);
    if (identity) phoneVerified = Boolean(identity.phoneVerifiedAt);
  } catch {
    // Non-blocking fallback
  }

  const initialProfile = {
    displayName: profile?.displayName || "Demir Yıldız",
    handle: profile?.handle || "demokullanici",
    headline: (profile as { headline?: string | null })?.headline || null,
    about: profile?.about || "",
    avatarUrl: profile?.avatarUrl || "",
    links: (profile as { links?: Array<{ id?: string; type: string; label: string; url: string; sortOrder?: number }> })?.links || [],
    roles: (profile as { roles?: string[] })?.roles || ["freelancer"],
    showLocation: profile?.showLocation ?? true,
    revealPhoneAfterMatch: profile?.revealPhoneAfterMatch ?? false,
    allowSearchIndex: true,
    preferredContactChannel:
      (profile as { preferredContactChannel?: string | null })?.preferredContactChannel || "any",
    timeZone: (profile as { timeZone?: string | null })?.timeZone || "Europe/Istanbul",
    isAvailableForHire: (profile as { isAvailableForHire?: boolean })?.isAvailableForHire ?? true,
    isActivelyHiring: (profile as { isActivelyHiring?: boolean })?.isActivelyHiring ?? false,
    availabilityStatus:
      (profile as { availabilityStatus?: import("@/src/modules/profiles/services/availability.service").AvailabilityStatus })
        ?.availabilityStatus || "AVAILABLE_NOW",
    availabilityHoursPerWeek:
      (profile as { availabilityHoursPerWeek?: number })?.availabilityHoursPerWeek || 40,
    availableFromDate:
      (profile as { availableFromDate?: string | null })?.availableFromDate || null,
    availabilityNotice:
      (profile as { availabilityNotice?: string | null })?.availabilityNotice || null,
    locale: (profile as { locale?: string })?.locale || locale,
    theme: (profile as { theme?: string })?.theme || "dark",
    emailVerified,
    phoneVerified,
    email: session.email || "",
    isCompanyVerified: (profile as { isCompanyVerified?: boolean })?.isCompanyVerified ?? false,
    companyName: (profile as { companyName?: string | null })?.companyName || null,
    companyType: (profile as { companyType?: string | null })?.companyType || null,
    taxOffice: (profile as { taxOffice?: string | null })?.taxOffice || null,
    vknMasked: (profile as { vknMasked?: string | null })?.vknMasked || null,
    companyVerifiedAt: (profile as { companyVerifiedAt?: Date | string | null })?.companyVerifiedAt || null,
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]"
      >
        <Link
          href={isTr ? "/tr/ilanlar" : "/en/listings"}
          className="inline-flex items-center gap-1 hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{isTr ? "İlanlara Dön" : "Back to Listings"}</span>
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-[var(--color-text-secondary)] font-medium">
          {isTr ? "Hesap Ayarları" : "Account Settings"}
        </span>
      </nav>

      {/* Settings Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)] flex items-center gap-3">
            <Sliders className="h-7 w-7 text-blue-500" />
            <span>{isTr ? "Hesap Ayarları Merkezi" : "Account Settings"}</span>
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
            {isTr
              ? "Operis hesabınızı, güvenlik tercihlerinizi, gizlilik ve bildirim seçeneklerinizi yönetin."
              : "Manage your account preferences, authentication security, visibility, and alerts."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={getLocalizedProfilePath(initialProfile.handle, locale)}
          >
            <Button variant="outline" size="sm">
              <span>{isTr ? "Profili Görüntüle" : "View Public Profile"}</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Settings Component */}
      <SettingsView
        initialProfile={initialProfile}
        twoFactorEnabled={twoFactorEnabled}
        locale={locale}
        initialTab={tab}
      />
    </main>
  );
}
