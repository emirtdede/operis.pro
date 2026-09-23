import Link from "next/link";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { PlusCircle } from "lucide-react";
import { getSession } from "@/src/modules/auth/session";
import { DashboardCountsService } from "@/src/modules/dashboard/counts-service";
import { DashboardTabs } from "@/src/components/dashboard/dashboard-tabs";
import { DashboardInfoPanel } from "@/src/components/dashboard/dashboard-info-panel";
import { Button } from "@/src/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isTr = locale === "tr";

  const session = await getSession();
  if (!session?.userId) {
    redirect(isTr ? "/tr/giris" : "/en/login");
  }

  // Fast, index-accelerated aggregate counts for all tabs with request-scoped deduplication
  const dashboardCounts = await DashboardCountsService.getTabCounts(session.userId);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* Left Sidebar: Context, CTA, Vertical Navigation & Rules (~300px) */}
        <aside className="w-full lg:w-72 xl:w-80 shrink-0 space-y-6 lg:sticky lg:top-24">
          {/* Header Block: Responsive Title, Subtitle & Action */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-stretch gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
                {isTr ? "Çalışma Alanım" : "My Workspace"}
              </h1>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {isTr
                  ? "İlanlarınızı, tekliflerinizi ve projelerinizi tek merkezden yönetin."
                  : "Manage your listings, proposals, and projects in one hub."}
              </p>
            </div>

            <Link href={isTr ? "/tr/ilanlar/yeni" : "/en/listings/new"} className="shrink-0">
              <Button
                variant="shimmer"
                size="md"
                className="w-full sm:w-auto lg:w-full gap-2 justify-center py-2.5 shadow-lg shadow-blue-500/15"
              >
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                <span>{isTr ? "Yeni İlan Yayınla" : "Post New Listing"}</span>
              </Button>
            </Link>
          </div>

          {/* Vertical Unified Dashboard Navigation Tabs */}
          <div className="space-y-2">
            <div className="hidden lg:block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] px-2">
              {isTr ? "Paneller" : "Dashboards"}
            </div>
            <DashboardTabs locale={locale} orientation="vertical" counts={dashboardCounts} />
          </div>

          {/* Desktop-only Contextual Info Panel */}
          <DashboardInfoPanel locale={locale} className="hidden lg:block" />
        </aside>

        {/* Right/Center Column: Main Content Area & Stream */}
        <section
          aria-label={isTr ? "Panel İçeriği" : "Dashboard Content"}
          className="flex-1 min-w-0 max-w-4xl w-full space-y-6"
        >
          {children}

          {/* Mobile-only Contextual Info Panel */}
          <DashboardInfoPanel locale={locale} className="block lg:hidden mt-6" />
        </section>
      </div>
    </main>
  );
}
