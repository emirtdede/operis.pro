import type { Metadata } from "next";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import {
  ShieldCheck,
  Sparkles,
  Clock,
  ShieldAlert,
  Layers,
  Scale,
} from "lucide-react";
import { ContactHubInteractive } from "@/src/components/contact/contact-hub-interactive";
import { RegistryInteractive } from "@/src/components/contact/registry-interactive";
import { getLocalizedRoute } from "@/src/lib/i18n/routes";
import { JsonLd } from "@/src/components/seo/json-ld";
import { getBaseUrl } from "@/src/lib/config/url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = locale === "tr";

  return {
    title: isTr
      ? "İletişim & Kurumsal Destek Masaları — Resmi Şirket Merkezi"
      : "Contact & Enterprise Operations Desks — Headquarters",
    description: isTr
      ? "Operis kurumsal masalarıyla iletişime geçin: Girişim çözümleri, 7/24 güvenlik & bug bounty, hukuk müşavirliği ve resmi şirket künyesi."
      : "Connect directly with Operis official desks: enterprise partnerships, 24/7 security & bug bounty, legal counsel, and statutory registry.",
    alternates: {
      canonical: isTr ? "/tr/iletisim" : "/en/contact",
      languages: {
        tr: "/tr/iletisim",
        en: "/en/contact",
      },
    },
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isTr = locale === "tr";

  const metrics = [
    {
      icon: Layers,
      value: isTr ? "6 Masa" : "6 Desks",
      label: isTr ? "Yetkili Destek Birimi" : "Dedicated Desks",
      detail: isTr ? "Kurumsal, Güvenlik, Hukuk, Destek, KVKK, Finans" : "Enterprise, Security, Legal, Support, Privacy, Billing",
      color: "text-blue-400 border-blue-500/20 bg-blue-500/10",
      accent: "bg-blue-500",
    },
    {
      icon: Clock,
      value: isTr ? "< 2 Saat" : "< 2 Hours",
      label: isTr ? "Güvenlik İhbar SLA" : "Urgent Security SLA",
      detail: isTr ? "7/24 Kesintisiz Acil Müdahale Masası" : "24/7 Rapid Incident Response",
      color: "text-rose-400 border-rose-500/20 bg-rose-500/10",
      accent: "bg-rose-500",
    },
    {
      icon: ShieldCheck,
      value: "%100",
      label: isTr ? "Doğrudan Mühendislik" : "Direct Engineering",
      detail: isTr ? "Otomatik Bot Değil, Uzman Yanıtı" : "Human Engineers, Zero Robot Loops",
      color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
      accent: "bg-emerald-500",
    },
    {
      icon: Scale,
      value: "2026",
      label: isTr ? "Resmi Yasal Sicil" : "Statutory Registry",
      detail: isTr ? "MERSİS, KEP ve UETS Tebligat Zırhı" : "MERSİS, Registered KEP & UETS",
      color: "text-purple-400 border-purple-500/20 bg-purple-500/10",
      accent: "bg-purple-500",
    },
  ];

  const baseUrl = getBaseUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ContactPage",
        name: isTr
          ? "İletişim & Kurumsal Destek Masaları — Resmi Şirket Merkezi"
          : "Contact & Enterprise Operations Desks — Headquarters",
        description: isTr
          ? "Operis kurumsal masalarıyla iletişime geçin: Girişim çözümleri, 7/24 güvenlik & bug bounty, hukuk müşavirliği ve resmi şirket künyesi."
          : "Connect directly with Operis official desks: enterprise partnerships, 24/7 security & bug bounty, legal counsel, and statutory registry.",
        url: `${baseUrl}${getLocalizedRoute("contact", locale)}`,
        inLanguage: locale,
        mainEntity: {
          "@type": "Organization",
          name: "Vellium",
          legalName: "Vellium",
          url: "https://vellium.dev",
          logo: `${baseUrl}/operis.svg`,
          address: {
            "@type": "PostalAddress",
            streetAddress: "Büyükdere Caddesi, No: 199",
            addressLocality: "İstanbul",
            addressRegion: "İstanbul",
            postalCode: "34394",
            addressCountry: "TR",
          },
          contactPoint: [
            {
              "@type": "ContactPoint",
              contactType: "customer support",
              email: "support@vellium.dev",
              availableLanguage: ["Turkish", "English"],
            },
            {
              "@type": "ContactPoint",
              contactType: "security",
              email: "security@vellium.dev",
              availableLanguage: ["Turkish", "English"],
            },
            {
              "@type": "ContactPoint",
              contactType: "legal",
              email: "legal@vellium.dev",
              availableLanguage: ["Turkish", "English"],
            },
            {
              "@type": "ContactPoint",
              contactType: "sales",
              email: "contact@vellium.dev",
              availableLanguage: ["Turkish", "English"],
            },
            {
              "@type": "ContactPoint",
              contactType: "privacy",
              email: "privacy@vellium.dev",
              availableLanguage: ["Turkish", "English"],
            },
            {
              "@type": "ContactPoint",
              contactType: "billing",
              email: "billing@vellium.dev",
              availableLanguage: ["Turkish", "English"],
            },
          ],
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: isTr ? "Ana Sayfa" : "Home",
            item: `${baseUrl}/${locale}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: isTr ? "İletişim" : "Contact",
            item: `${baseUrl}${getLocalizedRoute("contact", locale)}`,
          },
        ],
      },
    ],
  };

  return (
    <main className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-16 lg:space-y-20">
      {/* Schema.org Structured Data */}
      <JsonLd data={jsonLd} />
      {/* Ambient background lighting for corporate luxury feel */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full bg-blue-500/10 blur-[120px]"
        aria-hidden="true"
      />

      {/* 1. Header Corporate Section */}
      <header className="relative z-10 text-center space-y-5 max-w-3xl mx-auto pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-xs font-semibold text-blue-400 shadow-sm backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
          <span>{isTr ? "Operis Kurumsal Destek & Operasyon Merkezi" : "Operis Enterprise Operations & Support Desks"}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[var(--color-text-primary)] leading-tight">
          {isTr ? "Resmi İletişim Masaları & Genel Merkez" : "Official Communications & Headquarters"}
        </h1>

        <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed max-w-2xl mx-auto">
          {isTr
            ? "Teknik operasyonlar, kurumsal ortaklıklar, güvenlik açık bildirimleri ve yasal tebligatlar için doğrudan yetkili masalarımızla irtibata geçin."
            : "Connect directly with our engineering operations, enterprise solutions, 24/7 security desk, or legal counsel under committed response SLAs."}
        </p>

        {/* 4 Metric Badges - Symmetrical 4-card Grid with accent bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {metrics.map((m, i) => {
            const Icon = m.icon;
            return (
              <div
                key={i}
                className="group relative rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-xl p-4 sm:p-5 text-center space-y-1.5 shadow-md hover:border-blue-500/30 transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Top colored accent indicator */}
                <div
                  className={`absolute top-0 left-0 right-0 h-[2px] ${m.accent} opacity-40 group-hover:opacity-100 transition-opacity`}
                  aria-hidden="true"
                />

                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className={`h-6 w-6 rounded-lg flex items-center justify-center ${m.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${m.color.split(" ")[0]}`}>
                    {m.value}
                  </div>
                </div>

                <h2 className="text-xs font-bold text-[var(--color-text-primary)]">{m.label}</h2>
                <p className="text-[11px] text-[var(--color-text-tertiary)] leading-tight line-clamp-2">
                  {m.detail}
                </p>
              </div>
            );
          })}
        </div>
      </header>

      {/* 2. Main Two-Column Hub: Left Desks vs Right Smart Form (Interactive Client Hub) */}
      <section aria-label={isTr ? "İletişim ve Talep Masaları" : "Communication and Inquiry Desks"}>
        <ContactHubInteractive locale={locale} />
      </section>

      {/* 3. Corporate Registry & Headquarters Showcase (Balanced 50/50 Grid) */}
      <section className="space-y-8" aria-label={isTr ? "Şirket Künyesi ve Yerleşke" : "Corporate Registry and Headquarters"}>
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 mb-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>{isTr ? "Şeffaf Kurumsal Kimlik" : "Corporate Governance & Compliance"}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
            {isTr ? "Resmi Şirket Künyesi & Genel Merkez" : "Corporate Registry & Headquarters"}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
            {isTr
              ? "Operis'in resmi sicil, vergi, kayıtlı elektronik posta (KEP) ve yerleşke bilgileri."
              : "Official corporate registry, tax identifiers, registered electronic mail (KEP), and R&D headquarters."}
          </p>
        </div>

        {/* 50/50 Symmetrical Registry & Campus Cards */}
        <RegistryInteractive locale={locale} />
      </section>

      {/* 4. Support Callout & Escalation Banner (Full-Width Symmetrical Guard) */}
      <section className="rounded-3xl border border-rose-500/25 bg-gradient-to-r from-rose-500/10 via-[var(--color-surface-base)] to-[var(--color-surface-base)] p-6 sm:p-9 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-start sm:items-center gap-4 text-left">
          <div className="h-12 w-12 rounded-2xl bg-rose-500/15 border border-rose-500/25 text-rose-400 flex items-center justify-center shrink-0 shadow-md">
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]">
                {isTr ? "Acil Kötüye Kullanım veya Dolandırıcılık İhbarı" : "Urgent Abuse or Fraud Escalation Desk"}
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/20">
                24/7 SLA
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] max-w-xl leading-relaxed">
              {isTr
                ? "Platform kurallarını ihlal eden, teminat isteyen veya dolandırıcılık şüphesi barındıran profilleri moderasyon masamıza anında ihbar edebilirsiniz."
                : "Report bad-faith actors, unauthorized payment demands, or terms violations directly to our 24/7 safety and moderation desk."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end">
          <Link href={getLocalizedRoute("report", locale)} className="w-full sm:w-auto">
            <button
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-600 text-white text-xs font-semibold shadow-lg shadow-rose-500/25 hover:bg-rose-700 transition-all cursor-pointer"
            >
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              <span>{isTr ? "Kötüye Kullanım Bildir" : "Report Violation"}</span>
            </button>
          </Link>
        </div>
      </section>
    </main>
  );
}
