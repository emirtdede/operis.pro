"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  Layers,
  Send,
  ScrollText,
  Activity,
  Mail,
  Scale,
  AlertTriangle,
  ShieldAlert,
  ExternalLink,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "../layout/brand-logo";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  Layers,
  Send,
  ScrollText,
  Activity,
  Mail,
  Scale,
  AlertTriangle,
  ShieldAlert,
};

export interface AdminNavItem {
  href: string;
  label: string;
  iconName: string;
  badge: string | null;
  badgeColor?: string;
}

export interface AdminMobileNavProps {
  navItems: AdminNavItem[];
  alertEngines: AdminNavItem[];
}

export function AdminMobileNav({ navItems, alertEngines }: AdminMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close sheet on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Hamburger Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer shrink-0"
        aria-label="Yönetim Menüsünü Aç"
        aria-expanded={isOpen}
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Slide-over Drawer / Sheet */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Surface */}
          <aside className="relative w-[82vw] max-w-xs bg-[#12141a] border-r border-slate-800/90 flex flex-col justify-between p-4 shadow-2xl z-10 overflow-y-auto animate-in slide-in-from-left duration-200">
            <div className="space-y-6">
              {/* Header & Close Button */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                <Link href="/admin" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                  <BrandLogo size="sm" showText={true} />
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                    ADMIN
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
                    aria-label="Menüyü Kapat"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Navigation Modules */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2.5 pb-1">
                  Yönetim Modülleri
                </div>
                {navItems.map((item) => {
                  const Icon = ICON_MAP[item.iconName] || LayoutDashboard;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 shadow-xs"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-blue-400" : "text-slate-500"}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60 shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Moderation & Defense Engines */}
              <div className="space-y-1 pt-2 border-t border-slate-800/60">
                <div className="text-[10px] font-bold uppercase tracking-wider text-red-400/80 px-2.5 pb-1 flex items-center justify-between">
                  <span>Denetim & Savunma</span>
                  <Shield className="h-3 w-3 text-red-400" />
                </div>
                {alertEngines.map((item) => {
                  const Icon = ICON_MAP[item.iconName] || ShieldAlert;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-red-400" : "text-slate-500"}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                            item.badgeColor || "bg-red-500/20 text-red-400 border-red-500/30"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Bottom: Return to Public Site */}
            <div className="pt-4 border-t border-slate-800/80 mt-6">
              <Link
                href="/tr"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
              >
                <span>Platforma Dön</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
