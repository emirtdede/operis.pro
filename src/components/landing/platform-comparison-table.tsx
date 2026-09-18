"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Percent,
  Lock,
  MessageSquare,
  Clock,
  Coins,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { getLocalizedRoute } from "@/src/lib/i18n/routes";

interface PlatformComparisonTableProps {
  isTr?: boolean;
  locale?: string;
}

export function PlatformComparisonTable({
  isTr = true,
  locale = "tr",
}: PlatformComparisonTableProps) {
  const [projectBudget, setProjectBudget] = useState<number>(100000);

  // Traditional 20% platform cut calculation
  const traditionalCut = Math.round(projectBudget * 0.2);
  const operisSavings = traditionalCut;

  const comparisonRows = [
    {
      feature: isTr ? "Komisyon ve Platform Kesintisi" : "Platform Commission & Cuts",
      icon: Percent,
      operis: {
        title: "%0 Komisyon",
        desc: isTr
          ? "Yazılımcıdan da işverenden de sıfır kesinti. Tüm kazanç mühendisin cebinde kalır."
          : "Zero fee from both engineer and client. 100% of the project budget is kept.",
        positive: true,
      },
      traditional: {
        title: "%15 - %20 + KDV",
        desc: isTr
          ? "Her faturada 1/5 oranında aracı kesintisi ve yüksek para çekim masrafları."
          : "Up to 20% commission cut on every milestone plus withdrawal fees.",
        positive: false,
      },
    },
    {
      feature: isTr ? "Teklif Gizliliği ve Adil Fiyat" : "Proposal Privacy & Fair Pricing",
      icon: Lock,
      operis: {
        title: isTr ? "AES-256 Şifreli Birebir Teklif" : "AES-256 Encrypted 1:1 Proposals",
        desc: isTr
          ? "Rakipler fiyatınızı göremez. Fiyat kırma savaşı yerine uzmanlık ve kalite konuşur."
          : "Competitors cannot view your rates. No race-to-the-bottom bidding wars.",
        positive: true,
      },
      traditional: {
        title: isTr ? "Açık Artırma & Düşük Fiyat Savaşı" : "Public Bidding & Price Undercutting",
        desc: isTr
          ? "Herkes birbirinin teklifini görür; kalite yerine en ucuz fiyata sürüklenme yaşanır."
          : "Open public bids force engineers to underbid each other, degrading quality.",
        positive: false,
      },
    },
    {
      feature: isTr ? "İletişim Kanalları" : "Direct Communication Channels",
      icon: MessageSquare,
      operis: {
        title: isTr ? "Tamamen Özgür & Doğrudan" : "Uncensored & Direct",
        desc: isTr
          ? "Eşleşme onaylandığı an telefon, WhatsApp, Slack ve GitHub bilgileri paylaşılır."
          : "Accepted match instantly unlocks verified WhatsApp, phone, Slack, and email.",
        positive: true,
      },
      traditional: {
        title: isTr ? "Ağır Sansür & Ban Riski" : "Strict Platform Lock-in & Bans",
        desc: isTr
          ? "Telefon veya e-posta paylaşımı anında yapay zeka tarafından banlanır ve ceza kesilir."
          : "Mentioning phone, Skype, or email triggers automatic account suspension.",
        positive: false,
      },
    },
    {
      feature: isTr ? "İlan Güncelliği" : "Listing Freshness & Activity",
      icon: Clock,
      operis: {
        title: isTr ? "7 Günlük Dinamik Yaşam Döngüsü" : "7-Day Strict Freshness Radar",
        desc: isTr
          ? "Cevaplanmayan ilanlar 7 gün sonunda otomatik arşive kalkar; hayalet ilan bulunmaz."
          : "Unresponsive listings auto-archive after 7 days; zero ghost jobs.",
        positive: true,
      },
      traditional: {
        title: isTr ? "Aylarca Kalan Ölü İlanlar" : "Stale Listings & Ghost Jobs",
        desc: isTr
          ? "Aylar veya yıllar önce açılmış, işvereni kaybolmuş yüzlerce ölü ilan sistemi kirletir."
          : "Abandoned listings linger for months, wasting precious proposals and time.",
        positive: false,
      },
    },
    {
      feature: isTr ? "Ödeme ve Anlaşma Modeli" : "Payment & Contract Freedom",
      icon: Coins,
      operis: {
        title: isTr ? "Doğrudan Fatura & Sözleşme" : "Direct Bilateral Contract & Invoicing",
        desc: isTr
          ? "Paranız haftalarca platform kasasında bloke edilmez; kendi şartlarınızda çalışırsınız."
          : "Your money is never locked in a third-party escrow for 14-30 days.",
        positive: true,
      },
      traditional: {
        title: isTr ? "14-30 Gün Rehin / Emanet Blokesi" : "14-30 Day Escrow Lock & Withholding",
        desc: isTr
          ? "Paranız platform kasasında rehin kalır, çekim taleplerinde ekstra günler beklenir."
          : "Earnings withheld for weeks with high withdrawal friction and arbitrary hold risks.",
        positive: false,
      },
    },
  ];

  return (
    <section className="relative flex flex-col justify-center items-center min-h-[calc(100dvh-4rem)] w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 snap-start scroll-mt-16">
      <div className="w-full max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
            {isTr ? (
              <>
                Geleneksel Freelance Siteleri vs.{" "}
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  Operis Protokolü
                </span>
              </>
            ) : (
              <>
                Legacy Platforms vs.{" "}
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  Operis Protocol
                </span>
              </>
            )}
          </h2>

          <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed">
            {isTr
              ? "Aracı komisyonlarını, yapay iletişim yasaklarını ve kalitesiz fiyat kırma yarışlarını ortadan kaldırdık. Doğrudan yazılımcı ve işveren odaklı yeni nesil ekosistem."
              : "We eliminated middleman fees, communication bans, and price-dumping auctions. An open, peer-to-peer developer ecosystem."}
          </p>
        </div>

        {/* Interactive 0% Fee Impact Showcase */}
        <div className="mb-10 p-6 sm:p-8 rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 via-[var(--color-surface-base)] to-[var(--color-surface-base)] shadow-xl shadow-emerald-500/5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                {isTr ? "%0 Komisyonun Net Finansal Etkisi" : "Financial Impact of 0% Commission"}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)]">
                {isTr
                  ? "Tek Bir İlanda Cebinizde Kalan Kazanç Farkı"
                  : "Exact Savings on a Single Software Contract"}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-xl">
                {isTr
                  ? "Geleneksel sitelerde %20 komisyon yüzünden emeğinizin beşte biri aracıya giderken, Operis'te tek kuruş kesinti yapılmaz."
                  : "Traditional sites siphon 20% of your earnings. With Operis, you keep 100% of your agreed milestone fee."}
              </p>
            </div>

            {/* Quick Calculator Buttons & Slider */}
            <div className="flex flex-col items-center md:items-end gap-3 shrink-0 w-full md:w-auto">
              <div className="w-full sm:w-72 space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-medium text-[var(--color-text-secondary)]">
                  <span>{isTr ? "İlan Bütçesi:" : "Listing Budget:"}</span>
                  <span className="font-bold text-[var(--color-text-primary)]">
                    {projectBudget.toLocaleString("tr-TR")} ₺
                  </span>
                </div>
                <input
                  type="range"
                  min="20000"
                  max="1000000"
                  step="10000"
                  value={projectBudget}
                  onChange={(e) => setProjectBudget(Number(e.target.value))}
                  aria-label={isTr ? "İlan bütçesi hesaplama çubuğu" : "Listing budget slider"}
                  className="w-full h-2 bg-[var(--color-border-subtle)] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 p-1 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] w-full sm:w-auto">
                {[50000, 100000, 250000, 500000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setProjectBudget(amt)}
                    className={`px-2.5 py-1.5 sm:py-1 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                      projectBudget === amt
                        ? "bg-emerald-500 text-slate-950 shadow-sm"
                        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                    }`}
                  >
                    {(amt / 1000).toLocaleString("tr-TR")}K ₺
                  </button>
                ))}
              </div>

              <div className="w-full sm:w-auto text-center sm:text-right p-3 sm:p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10">
                <div className="text-[11px] font-semibold text-emerald-300">
                  {isTr ? "Operis ile Cebinizde Kalan Ek Para" : "Extra Retained Earnings"}
                </div>
                <div className="text-2xl sm:text-3xl font-black font-display text-emerald-400">
                  +{operisSavings.toLocaleString("tr-TR")} ₺
                </div>
                <div className="text-[10px] text-[var(--color-text-tertiary)]">
                  {isTr
                    ? "(Geleneksel sitede komisyona giden %20 pay)"
                    : "(Traditional 20% commission cut)"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Side-by-Side Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Operis (Hero Modern Model) */}
          <div className="relative rounded-3xl border-2 border-emerald-500/40 bg-[var(--color-surface-base)]/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-emerald-500/10 flex flex-col justify-between">
            <div className="absolute -top-3.5 left-8 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-1 text-xs font-bold text-slate-950 shadow-md">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {isTr ? "Operis Standardı (Geleceğin Modeli)" : "Operis Standard (Modern)"}
              </span>
            </div>

            <div className="space-y-6 pt-2">
              <div className="border-b border-[var(--color-border-subtle)] pb-4">
                <h3 className="text-xl sm:text-2xl font-black text-[var(--color-text-primary)]">
                  Operis.pro
                </h3>
                <p className="text-xs sm:text-sm text-emerald-400 font-medium mt-1">
                  {isTr
                    ? "Bağımsız yazılımcılar ve şeffaf ekipler için tasarlandı"
                    : "Designed for elite software engineers & autonomous teams"}
                </p>
              </div>

              <div className="space-y-5">
                {comparisonRows.map((row, idx) => {
                  const Icon = row.icon;
                  return (
                    <div key={idx} className="flex items-start gap-3.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mt-0.5">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                          <span className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                            {row.feature}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-[var(--color-text-primary)]">
                          {row.operis.title}
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                          {row.operis.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[var(--color-border-subtle)] flex flex-wrap items-center justify-between gap-3">
              <Link
                href={getLocalizedRoute("listings", locale)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
              >
                <span>{isTr ? "Hemen İlanları Keşfet" : "Explore Active Listings"}</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
              <span className="text-xs text-[var(--color-text-tertiary)] font-medium">
                {isTr
                  ? "Kredi kartı gerekmez • %100 Ücretsiz"
                  : "No credit card needed • 100% Free"}
              </span>
            </div>
          </div>

          {/* Right Column: Traditional Freelance Sites */}
          <div className="relative rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/50 backdrop-blur-xl p-6 sm:p-8 opacity-85 hover:opacity-100 transition-opacity flex flex-col justify-between">
            <div className="absolute -top-3.5 left-8 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] px-3.5 py-1 text-xs font-medium text-[var(--color-text-tertiary)]">
              <XCircle className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
              <span>
                {isTr ? "Geleneksel Siteler (Eski Model)" : "Legacy Platforms (Outdated)"}
              </span>
            </div>

            <div className="space-y-6 pt-2">
              <div className="border-b border-[var(--color-border-subtle)] pb-4">
                <h3 className="text-xl sm:text-2xl font-bold text-[var(--color-text-secondary)]">
                  {isTr ? "Geleneksel Freelance Siteleri" : "Traditional Freelance Platforms"}
                </h3>
                <p className="text-xs sm:text-sm text-rose-400/80 font-medium mt-1">
                  {isTr
                    ? "Aracı komisyonları ve sansürlü iletişim kuralları"
                    : "High take-rates and restrictive platform policies"}
                </p>
              </div>

              <div className="space-y-5">
                {comparisonRows.map((row, idx) => {
                  const Icon = row.icon;
                  return (
                    <div key={idx} className="flex items-start gap-3.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mt-0.5">
                        <XCircle className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 text-rose-400/70" aria-hidden="true" />
                          <span className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                            {row.feature}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-[var(--color-text-secondary)]">
                          {row.traditional.title}
                        </div>
                        <p className="text-xs text-[var(--color-text-tertiary)] leading-relaxed">
                          {row.traditional.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[var(--color-border-subtle)] text-xs text-[var(--color-text-tertiary)] leading-relaxed">
              {isTr
                ? "Her yıl Türkiye'deki yazılımcılar ve işletmeler komisyon platformlarına milyonlarca lira kaptırıyor. Operis bu döngüyü kalıcı olarak kırar."
                : "Legacy platforms take billions in commissions every year while locking developers behind algorithmic walls. Operis restores freedom."}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
