"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  Clock,
  ShieldCheck,
  Bookmark,
  Sparkles,
  Rocket,
  Send,
  Inbox,
  Bell,
  Zap,
  FolderTree,
  Compass,
  Lock,
  type LucideIcon,
} from "lucide-react";

export interface DashboardInfoPanelProps {
  locale: string;
  className?: string;
}

interface PanelContent {
  title: string;
  badge: string;
  description: string;
  icon: LucideIcon;
  badgeIcon: LucideIcon;
  iconColorClass: string;
  badgeColorClass: string;
}

const PANEL_CONFIGS: Record<string, { tr: PanelContent; en: PanelContent }> = {
  listings: {
    tr: {
      title: "1 Hafta Canlılık Kuralı",
      badge: "%0 Komisyon",
      description:
        "İlanlarınız 1 hafta boyunca radarda aktiftir. Süresi dolan ilanlar silinmez; tek tıkla ücretsiz olarak yeniden başlatabilirsiniz.",
      icon: Clock,
      badgeIcon: ShieldCheck,
      iconColorClass: "text-blue-400",
      badgeColorClass: "text-emerald-400",
    },
    en: {
      title: "1-Week Live Rule",
      badge: "0% Fee",
      description:
        "Listings stay on our radar for 1 week. Expired listings are never deleted; renew anytime for free.",
      icon: Clock,
      badgeIcon: ShieldCheck,
      iconColorClass: "text-blue-400",
      badgeColorClass: "text-emerald-400",
    },
  },
  saved: {
    tr: {
      title: "Hızlı Erişim & Takip",
      badge: "Canlı Radar",
      description:
        "Kaydettiğiniz ilanların bütçe, süre ve durum güncellemelerini buradan anlık olarak izleyebilir, tek tıkla teklif verebilirsiniz.",
      icon: Bookmark,
      badgeIcon: Sparkles,
      iconColorClass: "text-amber-400",
      badgeColorClass: "text-blue-400",
    },
    en: {
      title: "Quick Access & Tracking",
      badge: "Live Radar",
      description:
        "Track budget, timeline, and status updates for bookmarked listings here, and submit proposals with one click.",
      icon: Bookmark,
      badgeIcon: Sparkles,
      iconColorClass: "text-amber-400",
      badgeColorClass: "text-blue-400",
    },
  },
  "active-work": {
    tr: {
      title: "Eşzamanlı Proje Takibi",
      badge: "Gizli Kanallar",
      description:
        "Aynı anda birden fazla ilanda çalışabilir; kilometre taşlarını, telif devir senedini (FSEK m. 52) ve özel çalışma alanlarını tek merkezden yönetebilirsiniz.",
      icon: Rocket,
      badgeIcon: ShieldCheck,
      iconColorClass: "text-blue-400",
      badgeColorClass: "text-emerald-400",
    },
    en: {
      title: "Concurrent Projects Hub",
      badge: "Protected Channels",
      description:
        "Collaborate across multiple engagements simultaneously; manage milestones, statutory IP transfer, and private workspaces in one hub.",
      icon: Rocket,
      badgeIcon: ShieldCheck,
      iconColorClass: "text-blue-400",
      badgeColorClass: "text-emerald-400",
    },
  },
  "sent-offers": {
    tr: {
      title: "Doğrudan İletişim & Teklifler",
      badge: "3 Günlük Opsiyon",
      description:
        "Verdiğiniz teklifler doğrudan ilan sahibine iletilir. İlan sahibi teklifinizi kabul ettiğinde şifreli çalışma alanı anında açılır.",
      icon: Send,
      badgeIcon: Clock,
      iconColorClass: "text-cyan-400",
      badgeColorClass: "text-blue-400",
    },
    en: {
      title: "Direct Proposals & Outreach",
      badge: "3-Day Option",
      description:
        "Your proposals are delivered directly to listing owners. Once accepted, your private encrypted workspace opens immediately.",
      icon: Send,
      badgeIcon: Clock,
      iconColorClass: "text-cyan-400",
      badgeColorClass: "text-blue-400",
    },
  },
  "received-offers": {
    tr: {
      title: "Şeffaf Teklif Değerlendirme",
      badge: "Güvenli Eşleşme",
      description:
        "İlanınıza gelen teklifleri bütçe, teslim süresi ve uzmanlık skoruna göre karşılaştırabilir, en uygun mühendisi tek tıkla seçebilirsiniz.",
      icon: Inbox,
      badgeIcon: ShieldCheck,
      iconColorClass: "text-purple-400",
      badgeColorClass: "text-emerald-400",
    },
    en: {
      title: "Transparent Proposal Review",
      badge: "Secure Matching",
      description:
        "Compare incoming proposals by budget, delivery duration, and expertise score, then accept the best engineer in one click.",
      icon: Inbox,
      badgeIcon: ShieldCheck,
      iconColorClass: "text-purple-400",
      badgeColorClass: "text-emerald-400",
    },
  },
  notifications: {
    tr: {
      title: "Gerçek Zamanlı Bildirimler",
      badge: "Anında İletim",
      description:
        "İlanlarınıza gelen yeni teklifler, onaylanan eşleşmeler ve hesap hareketleri anlık olarak bildirim merkezinize iletilir.",
      icon: Bell,
      badgeIcon: Zap,
      iconColorClass: "text-indigo-400",
      badgeColorClass: "text-amber-400",
    },
    en: {
      title: "Real-Time Activity Alerts",
      badge: "Instant Delivery",
      description:
        "Incoming proposals, approved match handshakes, and account activities are pushed to your alert center instantly.",
      icon: Bell,
      badgeIcon: Zap,
      iconColorClass: "text-indigo-400",
      badgeColorClass: "text-amber-400",
    },
  },
  categories: {
    tr: {
      title: "Özel Kategori Radarı",
      badge: "Akıllı Akış",
      description:
        "Takip ettiğiniz teknoloji kategorilerinde yeni bir ilan açıldığında radarımız sizi öncelikli olarak bilgilendirir.",
      icon: FolderTree,
      badgeIcon: Compass,
      iconColorClass: "text-emerald-400",
      badgeColorClass: "text-blue-400",
    },
    en: {
      title: "Tailored Category Radar",
      badge: "Smart Feed",
      description:
        "Whenever a new listing is published in your followed tech categories, our radar alerts you with priority.",
      icon: FolderTree,
      badgeIcon: Compass,
      iconColorClass: "text-emerald-400",
      badgeColorClass: "text-blue-400",
    },
  },
  security: {
    tr: {
      title: "Hesap & Kimlik Güvenliği",
      badge: "2FA Korumalı",
      description:
        "İki aşamalı doğrulama (TOTP), oturum anahtarları ve şifreli veri korumasıyla hesabınız en yüksek güvenlik standardındadır.",
      icon: ShieldCheck,
      badgeIcon: Lock,
      iconColorClass: "text-emerald-400",
      badgeColorClass: "text-blue-400",
    },
    en: {
      title: "Account & Identity Protection",
      badge: "2FA Protected",
      description:
        "Your account is secured with two-factor authentication (TOTP), active session leasing, and envelope encryption.",
      icon: ShieldCheck,
      badgeIcon: Lock,
      iconColorClass: "text-emerald-400",
      badgeColorClass: "text-blue-400",
    },
  },
};

const TAB_PREFIX_MAP: Array<{ key: string; prefixes: string[] }> = [
  {
    key: "saved",
    prefixes: ["/tr/panel/kaydedilenler", "/en/dashboard/saved", "/tr/dashboard/saved"],
  },
  {
    key: "active-work",
    prefixes: ["/tr/panel/aktif-isler", "/en/dashboard/work", "/tr/dashboard/work"],
  },
  {
    key: "sent-offers",
    prefixes: [
      "/tr/panel/teklifler/gonderilen",
      "/en/dashboard/offers/sent",
      "/tr/dashboard/offers/sent",
    ],
  },
  {
    key: "received-offers",
    prefixes: [
      "/tr/panel/teklifler/gelen",
      "/en/dashboard/offers/received",
      "/tr/dashboard/offers/received",
    ],
  },
  {
    key: "notifications",
    prefixes: [
      "/tr/panel/bildirimler",
      "/en/dashboard/notifications",
      "/tr/dashboard/notifications",
    ],
  },
  {
    key: "categories",
    prefixes: [
      "/tr/panel/kategorilerim",
      "/en/dashboard/categories",
      "/tr/dashboard/categories",
    ],
  },
  {
    key: "security",
    prefixes: ["/tr/panel/guvenlik", "/en/dashboard/security", "/tr/dashboard/security"],
  },
  {
    key: "listings",
    prefixes: [
      "/tr/panel/ilanlarim",
      "/en/dashboard/listings",
      "/tr/dashboard/listings",
      "/tr/panel",
      "/en/dashboard",
      "/tr/dashboard",
    ],
  },
];

export function DashboardInfoPanel({ locale, className = "" }: DashboardInfoPanelProps) {
  const pathname = usePathname() || "";
  const isTr = locale === "tr";

  const activeContent = useMemo(() => {
    let matchedKey = "listings";

    for (const item of TAB_PREFIX_MAP) {
      if (item.prefixes.some((prefix) => pathname.startsWith(prefix))) {
        matchedKey = item.key;
        break;
      }
    }

    const config = PANEL_CONFIGS[matchedKey] ?? PANEL_CONFIGS.listings;
    if (!config) {
      return {
        title: isTr ? "1 Hafta Canlılık Kuralı" : "1-Week Live Rule",
        badge: isTr ? "%0 Komisyon" : "0% Fee",
        description: isTr
          ? "İlanlarınız 1 hafta boyunca radarda aktiftir. Süresi dolan ilanlar silinmez; tek tıkla ücretsiz olarak yeniden başlatabilirsiniz."
          : "Listings stay on our radar for 1 week. Expired listings are never deleted; renew anytime for free.",
        icon: Clock,
        badgeIcon: ShieldCheck,
        iconColorClass: "text-blue-400",
        badgeColorClass: "text-emerald-400",
      };
    }

    return isTr ? config.tr : config.en;
  }, [pathname, isTr]);

  const Icon = activeContent.icon;
  const BadgeIcon = activeContent.badgeIcon;

  return (
    <div
      className={`rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-xl p-4 space-y-3 shadow-xs transition-all duration-200 ${className}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] pb-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-primary)] min-w-0">
          <Icon className={`h-3.5 w-3.5 shrink-0 ${activeContent.iconColorClass}`} aria-hidden="true" />
          <span className="truncate">{activeContent.title}</span>
        </div>
        <div
          className={`flex items-center gap-1 text-[11px] font-semibold shrink-0 ${activeContent.badgeColorClass}`}
        >
          <BadgeIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{activeContent.badge}</span>
        </div>
      </div>
      <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
        {activeContent.description}
      </p>
    </div>
  );
}
