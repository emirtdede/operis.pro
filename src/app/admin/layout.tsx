import type { Metadata } from "next";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Layers,
  Send,
  ScrollText,
  Activity,
  AlertTriangle,
  ShieldAlert,
  Scale,
  Search,
  ExternalLink,
  Mail,
} from "lucide-react";
import { AdminService } from "@/src/modules/admin/service";
import { BrandLogo } from "@/src/components/layout/brand-logo";
import { getAdminSession } from "@/src/modules/admin/auth-guard";
import { AdminAccessDeniedClient } from "@/src/components/admin/admin-access-denied-client";
import { AdminHeaderActions } from "@/src/components/admin/admin-header-actions";
import { AdminMobileNav } from "@/src/components/admin/admin-mobile-nav";

export const metadata: Metadata = {
  title: "Yönetim & Güvenlik Konsolu | Operis Enterprise Admin",
  description: "Operis operasyonel yönetim, moderasyon merkezi ve siber güvenlik denetim konsolu.",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAdminSession();
  if (!auth.isAdmin || !auth.session) {
    return (
      <AdminAccessDeniedClient
        currentRole={auth.session?.role || "GİRİŞ YAPILMADI"}
        errorReason={
          auth.error ||
          "Standart kullanıcı hesaplarının bu yönetim konsoluna erişim izni bulunmamaktadır."
        }
      />
    );
  }

  const metrics = await AdminService.getDashboardMetrics();

  const navItems = [
    {
      href: "/admin",
      label: "Genel Bakış",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      href: "/admin/users",
      label: "Kullanıcı Yönetimi",
      icon: Users,
      badge: `${metrics.totalUsers.toLocaleString()}`,
    },
    {
      href: "/admin/listings",
      label: "İlan Yönetimi",
      icon: Layers,
      badge: `${metrics.activeListings}`,
    },
    {
      href: "/admin/offers",
      label: "Teklif & Yanıtlar",
      icon: Send,
      badge: null,
    },
    {
      href: "/admin/logs",
      label: "Çok Kategorili Loglar",
      icon: ScrollText,
      badge: null,
    },
    {
      href: "/admin/monitoring",
      label: "Sistem & Performans",
      icon: Activity,
      badge: "99.9%",
    },
    {
      href: "/admin/messages",
      label: "İletişim & Destek",
      icon: Mail,
      badge: null,
    },
  ];

  const alertEngines = [
    {
      href: "/admin/engagements",
      label: "Uyuşmazlık Hakemliği",
      icon: Scale,
      badge: metrics.disputedEngagements > 0 ? `${metrics.disputedEngagements}` : null,
      badgeColor: "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse",
    },
    {
      href: "/admin/moderation/abuse",
      label: "Kullanıcı İhlalleri (Küfür/Abuse)",
      icon: AlertTriangle,
      badge: `${metrics.openReports}`,
      badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    },
    {
      href: "/admin/security/threats",
      label: "Siber Tehditler & Saldırılar",
      icon: ShieldAlert,
      badge: `${metrics.activeThreats}`,
      badgeColor: "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse",
    },
  ];

  const mobileNavItems = [
    { href: "/admin", label: "Genel Bakış", iconName: "LayoutDashboard", badge: null },
    { href: "/admin/users", label: "Kullanıcı Yönetimi", iconName: "Users", badge: `${metrics.totalUsers.toLocaleString()}` },
    { href: "/admin/listings", label: "İlan Yönetimi", iconName: "Layers", badge: `${metrics.activeListings}` },
    { href: "/admin/offers", label: "Teklif & Yanıtlar", iconName: "Send", badge: null },
    { href: "/admin/logs", label: "Çok Kategorili Loglar", iconName: "ScrollText", badge: null },
    { href: "/admin/monitoring", label: "Sistem & Performans", iconName: "Activity", badge: "99.9%" },
    { href: "/admin/messages", label: "İletişim & Destek", iconName: "Mail", badge: null },
  ];

  const mobileAlertEngines = [
    {
      href: "/admin/engagements",
      label: "Uyuşmazlık Hakemliği",
      iconName: "Scale",
      badge: metrics.disputedEngagements > 0 ? `${metrics.disputedEngagements}` : null,
      badgeColor: "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse",
    },
    {
      href: "/admin/moderation/abuse",
      label: "Kullanıcı İhlalleri (Küfür/Abuse)",
      iconName: "AlertTriangle",
      badge: `${metrics.openReports}`,
      badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    },
    {
      href: "/admin/security/threats",
      label: "Siber Tehditler & Saldırılar",
      iconName: "ShieldAlert",
      badge: `${metrics.activeThreats}`,
      badgeColor: "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse",
    },
  ];

  return (
    <div className="min-h-screen flex bg-[#0d0e12] text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* High-Density Admin Sidebar */}
      <aside className="w-56 lg:w-64 shrink-0 border-r border-slate-800/80 bg-[#12141a] flex flex-col justify-between hidden md:flex">
        <div className="p-4 space-y-6">
          {/* Logo & Console Badge */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <Link href="/admin" className="flex items-center gap-2">
              <BrandLogo size="sm" showText={true} />
            </Link>
            <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
              ADMIN
            </span>
          </div>

          {/* Navigation Section */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2.5 pb-1">
              Yönetim Modülleri
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700/50">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Dual-Channel Engines Section */}
          <div className="space-y-1 pt-2 border-t border-slate-800/60">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2.5 pb-1">
              Tehdit & İhlal Motorları
            </div>
            {alertEngines.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-slate-400 group-hover:text-amber-400 transition-colors" />
                    <span className="truncate max-w-[140px]">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer Admin Identity Card */}
        <div className="p-3 m-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                DY
              </div>
              <div>
                <div className="font-semibold text-white text-[11px] leading-tight">
                  Demir Yıldız
                </div>
                <div className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  SECURITY_ADMIN
                </div>
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <Link
              href="/tr"
              className="text-slate-400 hover:text-white inline-flex items-center gap-1 transition-colors"
            >
              <span>Platforma Dön</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Administrative Stage */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Control Bar */}
        <header className="h-14 border-b border-slate-800/80 bg-[#12141a]/90 backdrop-blur px-3 sm:px-6 flex items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md">
            <AdminMobileNav navItems={mobileNavItems} alertEngines={mobileAlertEngines} />
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Global arama: Kullanıcı, İlan, IP..."
                className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sistem Aktif (10.420+ Kullanıcı)</span>
            </div>

            <AdminHeaderActions currentRole={auth.session.role} />
          </div>
        </header>

        {/* Scrollable Content Viewport */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 space-y-6">{children}</main>
      </div>
    </div>
  );
}
