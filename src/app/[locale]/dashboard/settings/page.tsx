import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Settings, Shield, User, ArrowLeft } from "lucide-react";
import { getSession } from "@/src/modules/auth/session";
import { ProfileService } from "@/src/modules/profiles/service";
import { ProfileSettingsForm } from "@/src/components/profile/profile-settings-form";
import { DashboardTabs } from "@/src/components/dashboard/dashboard-tabs";
import { Button } from "@/src/components/ui/button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = locale === "tr";

  return {
    title: isTr ? "Profil & Hesap Ayarları" : "Profile & Account Settings",
    description: isTr
      ? "Operis profilinizi, bağlantılarınızı ve gizlilik tercihlerinizi yönetin."
      : "Manage your Operis public profile, portfolio links, and privacy settings.",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function DashboardSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isTr = locale === "tr";

  const session = await getSession();
  if (!session?.userId) {
    redirect(isTr ? "/tr/giris" : "/en/login");
  }

  const profile = await ProfileService.getProfileByUserId(session.userId);

  let emailVerified = false;
  let phoneVerified = false;

  try {
    const { getDb, schema } = await import("@/src/lib/db");
    const { eq } = await import("drizzle-orm");
    const db = getDb();
    const [user] = await db
      .select({ emailVerified: schema.users.emailVerified })
      .from(schema.users)
      .where(eq(schema.users.id, session.userId))
      .limit(1);
    if (user) emailVerified = user.emailVerified;

    const [identity] = await db
      .select({ phoneVerifiedAt: schema.userPrivateIdentity.phoneVerifiedAt })
      .from(schema.userPrivateIdentity)
      .where(eq(schema.userPrivateIdentity.userId, session.userId))
      .limit(1);
    if (identity) phoneVerified = Boolean(identity.phoneVerifiedAt);
  } catch {
    // Non-blocking fallback to session state
  }

  const initialProfile = {
    displayName: profile?.displayName || "Demir Yıldız",
    handle: profile?.handle || "demir-yildiz",
    about: profile?.about || "",
    avatarUrl: profile?.avatarUrl || "",
    showLocation: profile?.showLocation ?? true,
    revealPhoneAfterMatch: profile?.revealPhoneAfterMatch ?? false,
    preferredContactChannel:
      (profile as { preferredContactChannel?: string | null })?.preferredContactChannel || "any",
    timeZone: (profile as { timeZone?: string | null })?.timeZone || "Europe/Istanbul",
    emailVerified,
    phoneVerified,
    email: session.email || "",
    links: (profile?.links || []).map((l: { type: string; label: string; url: string }) => ({
      type: l.type,
      label: l.label,
      url: l.url,
    })),
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
            <Link
              href={isTr ? "/tr/panel/ilanlarim" : "/en/dashboard/listings"}
              className="hover:text-[var(--color-text-primary)] transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isTr ? "Çalışma Alanım" : "Workspace"}</span>
            </Link>
            <span>/</span>
            <span>{isTr ? "Ayarlar" : "Settings"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)] flex items-center gap-2.5">
            <Settings className="h-6 w-6 text-blue-400" aria-hidden="true" />
            <span>{isTr ? "Profil & Hesap Ayarları" : "Profile & Account Settings"}</span>
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {isTr
              ? "Doğrudan eşleştirme ağındaki görünürlüğünüzü, biyografinizi ve portföy bağlantılarınızı özelleştirin."
              : "Customize your presence, bio, and portfolio links across the direct matching network."}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={
              isTr ? `/tr/profil/${initialProfile.handle}` : `/en/profile/${initialProfile.handle}`
            }
          >
            <Button variant="secondary" size="sm" className="gap-1.5 text-xs font-semibold">
              <User className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isTr ? "Profilimi Gör" : "View Profile"}</span>
            </Button>
          </Link>

          <Link href={isTr ? "/tr/panel/guvenlik" : "/en/dashboard/security"}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
              <Shield className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isTr ? "Güvenlik & Şifre" : "Security & 2FA"}</span>
            </Button>
          </Link>
        </div>
      </header>

      <DashboardTabs locale={locale} />

      {/* Profile Form */}
      <ProfileSettingsForm initialProfile={initialProfile} locale={locale} />
    </main>
  );
}
