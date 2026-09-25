import type { Metadata } from "next";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import {
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Zap,
  Clock,
  Lock,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { HelpGuideTabs } from "@/src/components/help/help-guide-tabs";
import { FaqSchemaLd } from "@/src/components/help/faq-schema-ld";
import { getLocalizedRoute } from "@/src/lib/i18n/routes";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = locale === "tr";

  return {
    title: isTr
      ? "Rehber & Sıkça Sorulan Sorular (SSS) — Bilgi Merkezi"
      : "Help, Guidelines & Frequently Asked Questions (FAQ)",
    description: isTr
      ? "168 saatlik canlılık döngüsü, %0 komisyonsuz doğrudan model, AES-256 şifreli teklifler, vergi ve sözleşme rehberi hakkında kapsamlı bilgi merkezi."
      : "Complete guide to Operis 168-hour lifecycles, zero-commission model, encrypted blind bids, taxes, and legal contracts.",
    alternates: {
      canonical: isTr ? "/tr/yardim" : "/en/help",
      languages: {
        tr: "/tr/yardim",
        en: "/en/help",
      },
    },
  };
}

export default async function HelpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isTr = locale === "tr";

  const highlights = [
    {
      icon: Zap,
      title: isTr ? "%0 Komisyon Modeli" : "0% Platform Cut",
      desc: isTr ? "Gizli kesinti veya aidat yok; kazancın %100'ü doğrudan sizin." : "Zero fee deductions; keep 100% of agreed budget.",
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      icon: Clock,
      title: isTr ? "168 Saatlik Canlılık Radarı" : "168h Freshness Radar",
      desc: isTr ? "Bayat ve terk edilmiş ilanlar yok; haftalık taze akış." : "No abandoned ghost postings; purely active listings.",
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      icon: Lock,
      title: isTr ? "AES-256 Şifreli Kör Teklif" : "AES-256 Blind Bids",
      desc: isTr ? "Rakipler fiyat kıramaz; değer odaklı teklif ortamı." : "Competitors cannot inspect rates; merit-based pricing.",
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
    {
      icon: ShieldCheck,
      title: isTr ? "2026 Mevzuat Uyumu" : "2026 Legal Compliance",
      desc: isTr ? "FSEK m. 52 telif devri, e-SMM ve hazır NDA taslakları." : "Pre-vetted IP assignment, e-SMM guidelines & NDAs.",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-14">
      {/* Schema.org FAQPage for SEO */}
      <FaqSchemaLd locale={isTr ? "tr" : "en"} />

      {/* 1. Hero Header */}
      <header className="text-center space-y-5 max-w-4xl mx-auto pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-xs font-semibold text-blue-400 shadow-sm backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
          <span>{isTr ? "Kapsamlı Rehber & Bilgi Merkezi" : "Knowledge & Guide Hub"}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[var(--color-text-primary)] leading-tight">
          {isTr ? "Nasıl Çalışır? Nelere Dikkat Edilmeli?" : "How Operis Works & Master Guidelines"}
        </h1>

        <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed max-w-2xl mx-auto">
          {isTr
            ? "168 saatlik canlılık radarı, %0 komisyonsuz doğrudan iş modeli, AES-256 şifreli kör teklifler, vergilendirme ve yasal sözleşmeler hakkında bilmeniz gereken her şey."
            : "Everything you need to know about our 168-hour freshness radar, zero-commission collaboration, encrypted blind bids, taxes, and legal contracts."}
        </p>

        {/* 4 Feature Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
          {highlights.map((h, i) => {
            const Icon = h.icon;
            return (
              <div
                key={i}
                className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 p-3.5 text-left space-y-1.5 shadow-sm"
              >
                <div className={`h-8 w-8 rounded-xl border flex items-center justify-center ${h.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <h2 className="text-xs font-bold text-[var(--color-text-primary)] leading-snug">
                  {h.title}
                </h2>
                <p className="text-[11px] text-[var(--color-text-secondary)] leading-snug">
                  {h.desc}
                </p>
              </div>
            );
          })}
        </div>
      </header>

      {/* 2. Interactive Knowledge & Guide Hub (Two-Column with Sidebar) */}
      <section id="nasil-calisir" className="scroll-mt-20">
        <HelpGuideTabs locale={isTr ? "tr" : "en"} />
      </section>

      {/* 3. Support Escalation Callout */}
      <section className="rounded-3xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-[var(--color-surface-base)] to-transparent p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 text-center sm:text-left">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            {isTr ? "Sorunuza Yanıt Bulamadınız mı?" : "Still Have Unanswered Questions?"}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-md">
            {isTr
              ? "Operis destek ekibine 7/24 mesaj iletebilir, teknik konularda ve iş birliklerinde doğrudan mühendislerimizden destek alabilirsiniz."
              : "Reach out directly to our engineering support team for assistance or enterprise partnership inquiries."}
          </p>
        </div>

        <Link href={getLocalizedRoute("contact", locale)} className="shrink-0">
          <Button variant="primary" size="lg" className="gap-2 shadow-lg shadow-blue-500/20">
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            <span>{isTr ? "Destek Ekibine Ulaşın" : "Contact Engineering Support"}</span>
          </Button>
        </Link>
      </section>
    </main>
  );
}
