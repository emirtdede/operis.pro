import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Shield } from "lucide-react";
import { getSession } from "@/src/modules/auth/session";
import { getDb, schema } from "@/src/lib/db";
import { eq } from "drizzle-orm";
import { SecuritySettingsView } from "@/src/components/security/security-settings-view";
import { DEFAULT_USER } from "@/src/modules/auth/demo-user";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = locale === "tr";

  return {
    title: isTr ? "Güvenlik & 2FA Ayarları" : "Security & 2FA Settings",
    description: isTr
      ? "Hesap şifrenizi güncelleyin ve iki aşamalı doğrulamayı (2FA) yönetin."
      : "Manage account password, two-factor authentication, and security audit.",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function DashboardSecurityPage({
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

  let twoFactorEnabled = false;
  try {
    const db = getDb();
    const [userRow] = await db
      .select({ twoFactorEnabled: schema.users.twoFactorEnabled })
      .from(schema.users)
      .where(eq(schema.users.id, session.userId))
      .limit(1);
    if (userRow) {
      twoFactorEnabled = Boolean(userRow.twoFactorEnabled);
    } else if (session.userId === DEFAULT_USER.id) {
      twoFactorEnabled = Boolean(DEFAULT_USER.twoFactorEnabled);
    }
  } catch {
    if (session.userId === DEFAULT_USER.id) {
      twoFactorEnabled = Boolean(DEFAULT_USER.twoFactorEnabled);
    } else {
      twoFactorEnabled = false;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)] flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" aria-hidden="true" />
            <span>{isTr ? "Güvenlik & Oturum Ayarları" : "Security & Authentication"}</span>
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
            {isTr
              ? "Şifrenizi yenileyin, iki aşamalı doğrulamayı (2FA) yapılandırın ve oturum güvenliğinizi kontrol edin."
              : "Update your password, configure 2FA TOTP authentication, and verify active security status."}
          </p>
        </div>
      </div>

      {/* Security View */}
      <SecuritySettingsView locale={locale} twoFactorEnabled={twoFactorEnabled} />
    </div>
  );
}
