import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Bell } from "lucide-react";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/src/modules/auth/session";
import { getDb, schema } from "@/src/lib/db";
import { NotificationsView, NotificationItem } from "@/src/components/dashboard/notifications-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = locale === "tr";

  return {
    title: isTr ? "Bildirim Merkezi" : "Notification Center",
    description: isTr
      ? "İlanlarınıza gelen teklifler, eşleşmeler ve platform bildirimleri."
      : "Proposals, matches, and system alerts for your account.",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function DashboardNotificationsPage({
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

  let notifications: NotificationItem[];

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, session.userId))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(50);

    notifications = rows.map((r) => ({
      id: r.id,
      type: r.type,
      payloadJson: (r.payloadJson as Record<string, unknown>) || {},
      readAt: r.readAt,
      createdAt: r.createdAt,
    }));
  } catch {
    notifications = [];
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Bell className="h-5 w-5 fill-blue-400/20 text-blue-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              {isTr ? "Bildirim Merkezi" : "Notification Center"}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
            {isTr
              ? "Projelerinize gelen teklifler, onaylanan eşleşmeler ve hesap hareketlerinizin güncel dökümü."
              : "Track incoming proposals, approved matches, and activity alerts across your projects."}
          </p>
        </div>
      </div>

      {/* Notifications List */}
      <NotificationsView initialNotifications={notifications} locale={locale} />
    </div>
  );
}
