"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  HelpCircle,
  Code2,
  ShieldAlert,
  BookMarked,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Cpu,
  Scale,
  Zap,
  ArrowRight,
  PlusCircle,
  FileCheck2,
  Lock,
  MessageSquare,
  Sparkles,
  Flag,
} from "lucide-react";
import { InteractiveFaqHub } from "./interactive-faq-hub";
import { FAQ_ITEMS } from "./faq-data";
import { getLocalizedRoute } from "@/src/lib/i18n/routes";

interface HelpGuideTabsProps {
  locale: "tr" | "en";
}

type TabType =
  | "client-guide"
  | "freelancer-guide"
  | "security-rules"
  | "legal-tax"
  | "all-faq"
  | "glossary";

interface NavTabItem {
  id: TabType;
  titleTr: string;
  titleEn: string;
  descTr: string;
  descEn: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeTr?: string;
  badgeEn?: string;
  badgeColor?: string;
  hash: string;
}

interface NavGroup {
  groupTitleTr: string;
  groupTitleEn: string;
  tabs: NavTabItem[];
}

export function HelpGuideTabs({ locale }: HelpGuideTabsProps) {
  const isTr = locale === "tr";
  const [activeTab, setActiveTab] = useState<TabType>("client-guide");

  const navGroups: NavGroup[] = [
    {
      groupTitleTr: "KULLANICI REHBERLERİ",
      groupTitleEn: "ROLE GUIDES",
      tabs: [
        {
          id: "client-guide",
          titleTr: "İşveren Rehberi",
          titleEn: "Client Guide",
          descTr: "İlan verme, kör teklifler ve hakediş",
          descEn: "Post briefs, review bids & milestones",
          icon: Building2,
          badgeTr: "İlan Sahibi",
          badgeEn: "Client",
          badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          hash: "isveren",
        },
        {
          id: "freelancer-guide",
          titleTr: "Yazılımcı Rehberi",
          titleEn: "Engineer Playbook",
          descTr: "%0 komisyon, teklif taktikleri ve güvenlik",
          descEn: "0% fee, proposal strategy & safe handover",
          icon: Cpu,
          badgeTr: "Freelancer",
          badgeEn: "Engineer",
          badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          hash: "yazilimci",
        },
      ],
    },
    {
      groupTitleTr: "GÜVENLİK & PROTOKOL",
      groupTitleEn: "SECURITY & RULES",
      tabs: [
        {
          id: "security-rules",
          titleTr: "Güvenlik & Hakediş",
          titleEn: "Security & Milestones",
          descTr: "3 kademeli model ve dolandırıcılık koruması",
          descEn: "3-tier milestones & fraud safeguards",
          icon: ShieldAlert,
          badgeTr: "3 Kademe",
          badgeEn: "3 Tiers",
          badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
          hash: "guvenlik",
        },
        {
          id: "legal-tax",
          titleTr: "Yasal Mevzuat & Telif",
          titleEn: "Legal & IP Rights",
          descTr: "FSEK m. 52 telif devri, e-SMM ve sözleşmeler",
          descEn: "FSEK Art. 52 IP transfer, e-SMM & NDAs",
          icon: Scale,
          badgeTr: "FSEK 52",
          badgeEn: "2026 IP",
          badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          hash: "hukuk",
        },
      ],
    },
    {
      groupTitleTr: "DESTEK & KAYNAKLAR",
      groupTitleEn: "HELP & RESOURCES",
      tabs: [
        {
          id: "all-faq",
          titleTr: "Sıkça Sorulan Sorular",
          titleEn: "Frequently Asked Questions",
          descTr: `${FAQ_ITEMS.length} soru, anlık canlı arama ve filtreler`,
          descEn: `${FAQ_ITEMS.length} Q&A, live search & category filters`,
          icon: HelpCircle,
          badgeTr: `${FAQ_ITEMS.length} Soru`,
          badgeEn: `${FAQ_ITEMS.length} Q&A`,
          badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
          hash: "sss",
        },
        {
          id: "glossary",
          titleTr: "Terimler Sözlüğü",
          titleEn: "Platform Glossary",
          descTr: "168s radar, kör teklif ve temel kavramlar",
          descEn: "168h radar, blind bids & core concepts",
          icon: BookMarked,
          badgeTr: "A'dan Z'ye",
          badgeEn: "A to Z",
          badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
          hash: "sozluk",
        },
      ],
    },
  ];

  const allTabs = navGroups.flatMap((g) => g.tabs);

  // Sync with window location hash on mount & hashchange
  useEffect(() => {
    const handleHashSync = () => {
      const hash = window.location.hash.replace("#", "");
      if (!hash) return;
      if (hash === "nasil-calisir" || hash === "isveren") {
        setActiveTab("client-guide");
      } else if (hash === "yazilimci" || hash === "freelancer") {
        setActiveTab("freelancer-guide");
      } else if (hash === "guvenlik" || hash === "odeme") {
        setActiveTab("security-rules");
      } else if (hash === "hukuk" || hash === "yasal" || hash === "fatura") {
        setActiveTab("legal-tax");
      } else if (hash === "sss" || hash === "faq") {
        setActiveTab("all-faq");
      } else if (hash === "sozluk" || hash === "glossary") {
        setActiveTab("glossary");
      }
    };

    handleHashSync();
    window.addEventListener("hashchange", handleHashSync);
    return () => window.removeEventListener("hashchange", handleHashSync);
  }, []);

  const handleSelectTab = (tabId: TabType, hash: string) => {
    setActiveTab(tabId);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${hash}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
      {/* ========================================================= */}
      {/* 1. LEFT SIDEBAR NAVIGATION PANEL                         */}
      {/* ========================================================= */}
      <aside className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-24 self-start">
        {/* Mobile Horizontal Scrollable Nav (Shown on < lg) */}
        <div className="block lg:hidden overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
          <div className="inline-flex gap-2 p-1.5 rounded-2xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] shadow-md">
            {allTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSelectTab(tab.id, tab.hash)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{isTr ? tab.titleTr : tab.titleEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop Sticky Structured Sidebar (Shown on lg+) */}
        <div className="hidden lg:block rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/95 backdrop-blur-xl p-4 shadow-xl space-y-5">
          <div className="px-3 pt-2 pb-2 border-b border-[var(--color-border-subtle)]">
            <h2 className="text-xs font-black uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span>{isTr ? "Rehber & Bilgi Merkezi" : "Knowledge & Guides"}</span>
            </h2>
            <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1">
              {isTr
                ? "Konuya göre filtreleyin ve detaylı rehberi inceleyin."
                : "Navigate topics and inspect detailed guidelines."}
            </p>
          </div>

          <div className="space-y-4">
            {navGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-tertiary)] px-2.5 block">
                  {isTr ? group.groupTitleTr : group.groupTitleEn}
                </span>

                <div className="space-y-1.5">
                  {group.tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => handleSelectTab(tab.id, tab.hash)}
                        className={`w-full flex items-start gap-3 p-3 rounded-2xl transition-all cursor-pointer text-left border ${
                          isActive
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25 border-blue-500"
                            : "bg-[var(--color-surface-base)]/50 hover:bg-[var(--color-surface-hover)] border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)] text-[var(--color-text-secondary)]"
                        }`}
                      >
                        <div
                          className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                            isActive
                              ? "bg-white/20 text-white border-white/30"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center justify-between gap-1.5">
                            <span
                              className={`text-sm font-bold leading-tight ${
                                isActive ? "text-white" : "text-[var(--color-text-primary)]"
                              }`}
                            >
                              {isTr ? tab.titleTr : tab.titleEn}
                            </span>
                            {tab.badgeTr && (
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold shrink-0 border ${
                                  isActive
                                    ? "bg-white/20 text-white border-white/30"
                                    : tab.badgeColor || "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                }`}
                              >
                                {isTr ? tab.badgeTr : tab.badgeEn}
                              </span>
                            )}
                          </div>

                          <p
                            className={`text-[11px] leading-snug mt-0.5 ${
                              isActive ? "text-white/85" : "text-[var(--color-text-tertiary)]"
                            }`}
                          >
                            {isTr ? tab.descTr : tab.descEn}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Support Badge in Sidebar */}
          <div className="pt-2 border-t border-[var(--color-border-subtle)] px-2">
            <div className="rounded-2xl p-3.5 bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                <MessageSquare className="h-4 w-4" />
                <span>{isTr ? "7/24 Teknik Destek" : "24/7 Support Desk"}</span>
              </div>
              <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                {isTr
                  ? "Aradığınız yanıtı bulamadınız mı? Doğrudan mühendislerimizle görüşün."
                  : "Can't find what you need? Talk directly to our engineering desk."}
              </p>
              <Link
                href={getLocalizedRoute("contact", locale)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors pt-1"
              >
                <span>{isTr ? "Mesaj Gönderin" : "Contact Us"}</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. RIGHT DYNAMIC CONTENT PANEL                           */}
      {/* ========================================================= */}
      <section className="lg:col-span-7 xl:col-span-8 space-y-10 min-w-0">
        {/* ------------------------------------------------------------- */}
        {/* TAB 1: CLIENT (İŞVEREN / İLAN SAHİBİ) GUIDE                   */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "client-guide" && (
          <div className="space-y-10 animate-tab-fade">
            {/* Header */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
                <Building2 className="h-3.5 w-3.5" />
                <span>{isTr ? "İlan Sahipleri & Girişimciler İçin Rehber" : "Client Hiring & Management Guide"}</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-[var(--color-text-primary)] tracking-tight">
                {isTr ? "Doğru Yazılımcıyla Başarıya Ulaşmanın 3 Adımı" : "Hire & Ship Software in 3 Confident Steps"}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
                {isTr
                  ? "Aracı komisyonu olmadan (%0), doğrudan el sıkışma, AES-256 şifreli kör teklifler ve kademeli hakediş ile projenizi güvenle hayata geçirin."
                  : "Post your software brief, receive merit-based encrypted proposals, and contract directly without paying 10-20% platform tax."}
              </p>
            </div>

            {/* 3 Steps */}
            <div className="grid grid-cols-1 gap-5">
              {[
                {
                  step: "01",
                  title: isTr ? "Net Brief & 168 Saatlik Canlılık Radarı" : "1. Clear Brief & 168-Hour Radar",
                  badge: isTr ? "Brief & Kapsam" : "Scope & Radar",
                  badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                  desc: isTr
                    ? "Aradığınız teknoloji yığınını (örn: Next.js, PostgreSQL, Flutter), somut teslim kriterlerini ve gerçekçi bir bütçe aralığı belirtin. İlanınız onay sırası beklemeksizin anında 168 saat (7 gün) radara girer. Bu sayede yalnızca acil ve aktif ilanlar akışta kalır."
                    : "Specify your exact tech stack, functional scope, and realistic budget range. Your listing activates instantly on our 168-hour radar with zero queue delays, targeting active and urgent talent.",
                },
                {
                  step: "02",
                  title: isTr ? "AES-256 Şifreli Kör Teklifleri İnceleyin" : "2. Review Encrypted Blind Bids",
                  badge: isTr ? "Şifreli Teklif" : "Merit-Based Bids",
                  badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
                  desc: isTr
                    ? "Mühendislerin teklif metinleri ve fiyatları AES-256 ile şifrelendiği için rakipler fiyat kıramaz (race-to-the-bottom olmaz). Gelen tekliflerde mühendisin çözüm yaklaşımını, referans reposunu ve profil rozetlerini inceleyerek en yetkin kişiyi seçin."
                    : "Because proposals are encrypted at rest, developers bid based on authentic engineering merit rather than toxic undercutting. Inspect architectural breakdowns, live repos, and verified badges.",
                },
                {
                  step: "03",
                  title: isTr ? "İkili El Sıkışma & 3 Kademeli Güvenli Hakediş" : "3. Handshake & 3-Tier Milestone Settlement",
                  badge: isTr ? "Güvenli Çalışma" : "3-Stage Milestones",
                  badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                  desc: isTr
                    ? "Teklifi onayladığınız anda doğrudan iletişim (WhatsApp, Slack, telefon) açılır. İşe başlamadan önce Yasal Merkezimizdeki Standart Eser Sözleşmesini imzalayın ve ödemeleri 3 aşamaya bölün (%30 Avans, %40 Alfa Demosu, %30 Kod Kabul & Telif Devri)."
                    : "Accepting a proposal unlocks direct bilateral channels (WhatsApp, phone, Slack). Formalize terms via our pre-vetted Software Agreement and phase payments across 3 milestones (30% - 40% - 30%).",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-md p-6 sm:p-7 shadow-lg flex flex-col sm:flex-row gap-5 items-start"
                >
                  <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono font-black text-lg flex items-center justify-center shrink-0">
                    {item.step}
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Do's & Don'ts Box for Clients */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-6 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm sm:text-base">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>{isTr ? "İşverenler İçin Başarı İpuçları (Do's)" : "Client Success Guidelines (Do's)"}</span>
                </div>
                <ul className="text-xs sm:text-sm text-[var(--color-text-secondary)] space-y-2.5">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{isTr ? "Proje isterlerini ve 'Kabul Kriterleri'ni net maddeler halinde yazın." : "Define specific deliverables and tangible Acceptance Criteria upfront."}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{isTr ? "Teklif verenlerden benzer alanda 1-2 canlı referans veya açık repo isteyin." : "Ask engineers for 1-2 relevant live demos or open-source repositories."}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{isTr ? "Ödemeleri her zaman 3 aşamalı hakediş takvimiyle ve banka transferiyle yapın." : "Always settle phased payments via official bank transfer matching milestones."}</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-3xl border border-rose-500/30 bg-rose-500/5 p-6 space-y-3">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm sm:text-base">
                  <AlertTriangle className="h-5 w-5" />
                  <span>{isTr ? "Kaçınılması Gereken Hatalar (Don'ts)" : "Critical Pitfalls to Avoid (Don'ts)"}</span>
                </div>
                <ul className="text-xs sm:text-sm text-[var(--color-text-secondary)] space-y-2.5">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{isTr ? "'Her şeyi yapacak tam yetkin biri aranıyor' gibi belirsiz ilanlar açmayın." : "Avoid vague 'fullstack rockstar who does everything' listings."}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{isTr ? "Sözleşme imzalamadan ve FSEK m. 52 telif maddesi koymadan işe başlamayın." : "Never proceed without a written contract and FSEK Art. 52 IP clause."}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{isTr ? "Yazılımcıdan avans ödemeksizin tüm kodu baştan teslim etmesini beklemeyin." : "Do not expect developers to write full production code without advance."}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Contextual FAQs for Clients */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)]">
                    {isTr ? "İşverenlerin En Sık Sorduğu Sorular" : "Frequently Asked Questions by Clients"}
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {isTr ? "İlan açma, bütçe, telif hakları ve uyuşmazlıklar hakkında hızlı yanıtlar." : "Key answers on budgets, IP rights, contractor vetting, and disputes."}
                  </p>
                </div>
              </div>

              <InteractiveFaqHub
                locale={locale}
                targetAudience="client"
                hideSearchAndFilters={true}
                defaultLimit={6}
              />
            </div>

            {/* Call to Action */}
            <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-[var(--color-surface-base)] to-transparent p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="space-y-1.5 text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)]">
                  {isTr ? "İlanınız İçin Doğru Mühendisi Bulmaya Hazır mısınız?" : "Ready to Find the Ideal Software Engineer?"}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-xl">
                  {isTr
                    ? "İlanınızı 2 dakikada ücretsiz yayınlayın, 168 saatlik canlı radarımıza anında girin."
                    : "Post your listing in 2 minutes for 100% free and go live instantly on our 168-hour radar."}
                </p>
              </div>

              <Link href={getLocalizedRoute("newListing", locale)} className="shrink-0">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-blue-600 text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>{isTr ? "Ücretsiz İlan Yayınla" : "Post a Free Listing"}</span>
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: FREELANCER (YAZILIMCI / MÜHENDİS) GUIDE                */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "freelancer-guide" && (
          <div className="space-y-10 animate-tab-fade">
            {/* Header */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
                <Cpu className="h-3.5 w-3.5" />
                <span>{isTr ? "Bağımsız Mühendisler & Freelancerlar İçin Rehber" : "Engineer Career & Revenue Playbook"}</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-[var(--color-text-primary)] tracking-tight">
                {isTr ? "Emeğinizin %100'ünü Kazanın: Komisyonsuz & Güvenli" : "Keep 100% of Your Earnings: Zero Platform Cut"}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
                {isTr
                  ? "Teklif jetonlarına (connects) para harcamadan, rakiplerin fiyat kırmasına uğramadan doğrudan işverenle el sıkışın."
                  : "Zero connects fees, no undercutting race to the bottom, and zero platform deductions on your payments."}
              </p>
            </div>

            {/* 3 Steps */}
            <div className="grid grid-cols-1 gap-5">
              {[
                {
                  step: "01",
                  title: isTr ? "Değer Odaklı Şifreli Kör Teklif Stratejisi" : "1. Value-Driven Encrypted Blind Bidding",
                  badge: isTr ? "Özgün Teklif" : "Bespoke Pitch",
                  badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                  desc: isTr
                    ? "Genel şablon metinleri kullanmayın. İlan sahibinin teknik problemine odaklanan 2-3 paragraflık özgün bir mimari analiz sunun. İlanın teknoloji yığınına uyan 1 canlı referans veya GitHub reposu paylaşın. Teklifiniz AES-256 ile şifrelendiğinden rakipleriniz fiyatınızı göremez."
                    : "Ditch generic templates. Provide a 2-3 paragraph architectural breakdown solving the client's concrete problem. Share 1 relevant live repository. Your pitch is encrypted at rest.",
                },
                {
                  step: "02",
                  title: isTr ? "%100 Ücretsiz Teklifler (Sıfır Jeton / No Connects)" : "2. 100% Free Proposals (Zero Connects)",
                  badge: isTr ? "0 TL Jeton" : "No Pay-to-Bid",
                  badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                  desc: isTr
                    ? "Operis'te teklif vermek tamamen ücretsizdir; jeton veya kredi satın almanıza gerek yoktur. Bütçenizi platform harçlarına değil, teknik uzmanlığınıza ayırabilirsiniz. 168 saatlik canlı radar kuralı sayesinde bayat ilanlara zaman harcamazsınız."
                    : "No paying for bid tokens or connects. Submitting proposals is 100% free. The 168-hour freshness lifecycle ensures you only bid on live, responsive requirements.",
                },
                {
                  step: "03",
                  title: isTr ? "Güvenli Teslimat: Staging, Avans & e-SMM / Fatura" : "3. Safe Handover: Staging, Advance & Invoicing",
                  badge: isTr ? "Kod Güvenliği" : "Safe Escrow-Free",
                  badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
                  desc: isTr
                    ? "Asla sözleşmesiz ve avans almadan (%30) kod yazmayın. İncelemeleri kendi staging ortamınızda gösterin. Nihai ödeme hesabınıza geçmeden production veritabanı şifrelerini vermeyin. e-SMM düzenleyerek veya Genç Girişimci istisnasından faydalanarak yasal kalın."
                    : "Never write code without upfront advance (min 30%). Demo progress on your staging environment. Hand over production credentials only upon final milestone clearance.",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-md p-6 sm:p-7 shadow-lg flex flex-col sm:flex-row gap-5 items-start"
                >
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-black text-lg flex items-center justify-center shrink-0">
                    {item.step}
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Do's & Don'ts Box for Freelancers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-6 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm sm:text-base">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>{isTr ? "Mühendisler İçin Altın Kurallar (Do's)" : "Developer Best Practices (Do's)"}</span>
                </div>
                <ul className="text-xs sm:text-sm text-[var(--color-text-secondary)] space-y-2.5">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{isTr ? "Sözleşmenize 'en fazla 2 tur makul revizyon dahildir' maddesi ekleyin." : "Specify that up to 2 rounds of reasonable revisions are included."}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{isTr ? "18-29 yaş arasındaysanız 3 yıl Genç Girişimci vergi istisnasını kullanın." : "Leverage the 3-year Youth Entrepreneur tax exemption if aged 18-29."}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{isTr ? "Teklif onaylandığında doğrudan WhatsApp/Slack üzerinden hızlı keşif toplantısı yapın." : "Conduct a direct 15-min discovery sync upon proposal acceptance."}</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-3xl border border-rose-500/30 bg-rose-500/5 p-6 space-y-3">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm sm:text-base">
                  <AlertTriangle className="h-5 w-5" />
                  <span>{isTr ? "Kritik Dolandırıcılık Uyarıları (Red Flags)" : "Critical Scam Warnings (Red Flags)"}</span>
                </div>
                <ul className="text-xs sm:text-sm text-[var(--color-text-secondary)] space-y-2.5">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{isTr ? "İşe başlamanız için teminat/ekipman parası isteyenlere ASLA para göndermeyin." : "NEVER send upfront money for 'registration or equipment deposits'."}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{isTr ? "'Ücretsiz deneme modülü yazın' tuzaklarını reddedin; portfolyonuzu gösterin." : "Reject uncompensated test modules; demonstrate existing work instead."}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{isTr ? "Son hakediş hesabınıza geçmeden ana kod deposu yetkilerini teslim etmeyin." : "Never transfer production keys before final payment clearance."}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Contextual FAQs for Freelancers */}
            <div className="space-y-4 pt-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)]">
                  {isTr ? "Yazılımcıların En Sık Sorduğu Sorular" : "Frequently Asked Questions by Developers"}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {isTr ? "Kör teklifler, komisyonsuz kazanç, fatura ve ödeme güvencesi." : "Proposals, 0% commissions, invoicing and payment safeguards."}
                </p>
              </div>

              <InteractiveFaqHub
                locale={locale}
                targetAudience="freelancer"
                hideSearchAndFilters={true}
                defaultLimit={6}
              />
            </div>

            {/* Call to Action */}
            <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-[var(--color-surface-base)] to-transparent p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="space-y-1.5 text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)]">
                  {isTr ? "Hemen Aktif İlanlara Göz Atın" : "Explore Verified Active Listings"}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-xl">
                  {isTr
                    ? "168 saatlik canlı radarımızdaki güncel yazılım ilanlarına ücretsiz şifreli teklifinizi sunun."
                    : "Submit your encrypted blind proposals to live listings on our 168-hour freshness radar."}
                </p>
              </div>

              <Link href={getLocalizedRoute("listings", locale)} className="shrink-0">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-700 transition-all cursor-pointer"
                >
                  <Code2 className="h-4 w-4" />
                  <span>{isTr ? "İlanları Keşfet" : "Browse Projects"}</span>
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: SECURITY & PAYMENT PLAYBOOK                           */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "security-rules" && (
          <div className="space-y-10 animate-tab-fade">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-400">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>{isTr ? "Güvenlik & Ödeme Protokolü" : "Trust, Escrow-Free & Payment Matrix"}</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-[var(--color-text-primary)] tracking-tight">
                {isTr ? "%0 Komisyon Manifestosu & 3 Kademeli Hakediş" : "The 0% Commission Manifesto & 3-Tier Milestone Protocol"}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
                {isTr
                  ? "Platform havuzunda para bloke etmeden, aracı komisyonu almadan her iki tarafı da eşit koruyan şeffaf çalışma standartları."
                  : "No custodial fund lockups, no 10-20% platform taxation, and standard milestone payments protecting both sides."}
              </p>
            </div>

            {/* 3-Stage Milestone Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="rounded-3xl border border-blue-500/30 bg-[var(--color-surface-base)] p-6 space-y-4 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                  {isTr ? "1. Aşama" : "Tier 1"}
                </div>
                <div className="h-11 w-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-base">
                  %30
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                    {isTr ? "Başlangıç & Mimari Avansı" : "Architecture & Advance"}
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {isTr
                      ? "Sözleşme imzası, NDA teyidi ve mimari/veritabanı şemasının onaylanmasıyla ödenir."
                      : "Released upon contract execution, NDA confirmation, and architecture schema validation."}
                  </p>
                </div>
                <ul className="text-xs space-y-1.5 text-[var(--color-text-tertiary)] pt-2 border-t border-[var(--color-border-subtle)]">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
                    <span>{isTr ? "Sözleşme & NDA İmzası" : "Signed NDA & Agreement"}</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
                    <span>{isTr ? "Repo & Altyapı Kurulumu" : "Repo & Cloud Initialization"}</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-3xl border border-purple-500/30 bg-[var(--color-surface-base)] p-6 space-y-4 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                  {isTr ? "2. Aşama" : "Tier 2"}
                </div>
                <div className="h-11 w-11 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-base">
                  %40
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                    {isTr ? "Alfa/Staging Demosu" : "Staging & Alpha Demo"}
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {isTr
                      ? "Çalışır prototipin test ortamında (staging) sunulması ve temel işlevlerin onayı ile ödenir."
                      : "Released upon live staging URL demo and functional approval of core workflows."}
                  </p>
                </div>
                <ul className="text-xs space-y-1.5 text-[var(--color-text-tertiary)] pt-2 border-t border-[var(--color-border-subtle)]">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-purple-400" />
                    <span>{isTr ? "Çalışır Test URL'i" : "Live Staging URL"}</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-purple-400" />
                    <span>{isTr ? "Kritik API Entegrasyonu" : "Core API Workflows"}</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-3xl border border-emerald-500/30 bg-[var(--color-surface-base)] p-6 space-y-4 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                  {isTr ? "3. Aşama" : "Tier 3"}
                </div>
                <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-base">
                  %30
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                    {isTr ? "Nihai Kabul & Kod Devri" : "Final Transfer & Acceptance"}
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {isTr
                      ? "Canlıya alma, kaynak kodların ve ortam anahtarlarının devri ve FSEK m. 52 protokolüyle ödenir."
                      : "Released upon production keys handover and execution of FSEK 52 IP assignment."}
                  </p>
                </div>
                <ul className="text-xs space-y-1.5 text-[var(--color-text-tertiary)] pt-2 border-t border-[var(--color-border-subtle)]">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{isTr ? "Kaynak Kod Reposu" : "Full Source Repo Access"}</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{isTr ? "FSEK Telif Devir Belgesi" : "IP Assignment Protocol"}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Red Flags Alert Card */}
            <div className="rounded-3xl border border-rose-500/30 bg-rose-500/5 p-6 sm:p-7 space-y-4 shadow-lg">
              <div className="flex items-center gap-2.5 text-rose-400">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <h3 className="text-base sm:text-lg font-bold">
                  {isTr ? "Dolandırıcılık Kırmızı Bayrakları (Red Flags)" : "Critical Scam Red Flags"}
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-[var(--color-text-secondary)]">
                <div className="p-4 rounded-2xl bg-[var(--color-surface-base)] border border-rose-500/20 space-y-1.5">
                  <strong className="text-rose-400 font-bold flex items-center gap-1.5">
                    <Flag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{isTr ? "Para / Teminat İsteyen İlanlar" : "Clients Demanding Upfront Fees"}</span>
                  </strong>
                  <p>
                    {isTr
                      ? "İşe başlamanız için teminat, ekipman sigortası, kayıt harcı isteyenler %100 dolandırıcıdır. Asla para göndermeyin."
                      : "Any party asking for registration fees or equipment deposits is 100% fraudulent. Never pay to work."}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--color-surface-base)] border border-rose-500/20 space-y-1.5">
                  <strong className="text-rose-400 font-bold flex items-center gap-1.5">
                    <Flag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{isTr ? "Ücretsiz Deneme Projesi Tuzağı" : "Unpaid 'Trial' Tasks"}</span>
                  </strong>
                  <p>
                    {isTr
                      ? "'Şu modülü ücretsiz yazın, beğenirsek işe alacağız' tekliflerini reddedin. Yetkinliğinizi portfolyonuzla gösterin."
                      : "Decline uncompensated sample tasks. Prove capability using your existing portfolio and live repositories."}
                  </p>
                </div>
              </div>
            </div>

            {/* Safety FAQs */}
            <div className="space-y-4 pt-2">
              <h3 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)]">
                {isTr ? "Güvenlik & Uyuşmazlık Sıkça Sorulan Sorular" : "Security & Dispute FAQs"}
              </h3>
              <InteractiveFaqHub
                locale={locale}
                initialCategory="safety"
                hideSearchAndFilters={true}
              />
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: LEGAL, TAX & CONTRACTS                                */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "legal-tax" && (
          <div className="space-y-10 animate-tab-fade">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400">
                <Scale className="h-3.5 w-3.5" />
                <span>{isTr ? "2026 Mevzuat, Fikri Mülkiyet & Vergi Standartları" : "2026 Legal Compliance & IP Standards"}</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-[var(--color-text-primary)] tracking-tight">
                {isTr ? "Telif Hakları (FSEK m. 52), Faturalandırma & Sözleşmeler" : "Intellectual Property, Invoicing & Contracts"}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
                {isTr
                  ? "Kaynak kod mülkiyeti kime ait olur? Fatura ve e-SMM nasıl kesilir? Hukuki güvencenizi sağlayan temel kurallar."
                  : "Who owns the code? How does e-SMM invoicing work in Turkey? Key legal safeguards for clients and developers."}
              </p>
            </div>

            {/* 3 Legal Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-6 space-y-3 shadow-md">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                  {isTr ? "FSEK Madde 52 Telif Devri" : "FSEK Art. 52 IP Transfer"}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {isTr
                    ? "Yazılımın manevi hakları devredilemez; ancak mali haklar (çoğaltma, yayma, işleme) tam ödeme karşılığında yazılı olarak müşteriye geçer."
                    : "Moral authorship remains permanently with the creator; economic exploitation rights transfer to client upon full payment clearance."}
                </p>
              </div>

              <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-6 space-y-3 shadow-md">
                <div className="h-10 w-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                  {isTr ? "e-SMM & Şirket Faturası" : "e-SMM & Corporate Invoicing"}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {isTr
                    ? "Serbest çalışan mühendisler e-SMM veya e-Arşiv düzenler. 18-29 yaş arası ilk işini kuranlar 3 yıl Genç Girişimci vergi istisnasından faydalanır."
                    : "Independent engineers issue e-SMM receipts or e-Archive invoices. First-time founders aged 18-29 leverage Youth Entrepreneur exemptions."}
                </p>
              </div>

              <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-6 space-y-3 shadow-md">
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Lock className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                  {isTr ? "Hazır NDA & Eser Sözleşmesi" : "Pre-Vetted NDA & Contract"}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {isTr
                    ? "Operis Yasal Merkezi üzerinden 2026 standartlarına uygun Standart İkili Gizlilik Sözleşmesi ve Yazılım Eser Sözleşmesi taslağı sunulur."
                    : "Pre-vetted bilateral NDA and Software Services Agreement templates compliant with 2026 legal standards."}
                </p>
              </div>
            </div>

            {/* Legal FAQs */}
            <div className="space-y-4 pt-2">
              <h3 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)]">
                {isTr ? "Yasal Mevzuat & Vergi Sıkça Sorulan Sorular" : "Legal & Tax Frequently Asked Questions"}
              </h3>
              <InteractiveFaqHub
                locale={locale}
                initialCategory="legal"
                hideSearchAndFilters={true}
              />
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5: ALL FAQS (TÜM SORU & CEVAPLAR)                          */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "all-faq" && (
          <div className="space-y-8 animate-tab-fade">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-semibold text-cyan-400">
                <HelpCircle className="h-3.5 w-3.5" />
                <span>{isTr ? "Kapsamlı SSS Havuzu & Arama" : "Global FAQ Knowledge Pool"}</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-[var(--color-text-primary)] tracking-tight">
                {isTr
                  ? `Tüm Sıkça Sorulan Sorular (${FAQ_ITEMS.length} Soru)`
                  : `Frequently Asked Questions (${FAQ_ITEMS.length} Q&A)`}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
                {isTr
                  ? "İlanlar, şifreli kör teklifler, %0 komisyon, doğrudan iletişim ve yasal güvenceler hakkında tüm detaylar."
                  : "Search across all questions regarding our freshness radar, zero-fee framework, blind bidding, and contracts."}
              </p>
            </div>

            {/* Full Interactive FAQ Hub with Live Search & Category Chips */}
            <InteractiveFaqHub locale={locale} />
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 6: GLOSSARY (TERİMLER SÖZLÜĞÜ)                            */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "glossary" && (
          <div className="space-y-8 animate-tab-fade">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-400">
                <BookMarked className="h-3.5 w-3.5" />
                <span>{isTr ? "Operis Platform Terimleri Sözlüğü" : "Operis Technical Glossary"}</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-[var(--color-text-primary)] tracking-tight">
                {isTr ? "Kavramlar & Mimari Terimler Rehberi" : "Architectural Glossary & Terms"}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
                {isTr
                  ? "Platformda kullanılan yenilikçi kriptografik ve yasal mekanizmaların hap tanımları."
                  : "Concise definitions of our unique zero-commission and cryptographic matching concepts."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  term: isTr ? "168 Saatlik Canlılık Radarı" : "168-Hour Freshness Radar",
                  def: isTr
                    ? "İlanların en fazla 7 gün (168 saat) yayında kaldığı, süresi dolduğunda otomatik arşive alınarak bayat 'hayalet ilanları' sıfırlayan dinamik döngü."
                    : "Automated freshness lifecycle ensuring listings expire after exactly 7 days, preventing abandoned ghost listings from polluting the feed.",
                },
                {
                  term: isTr ? "AES-256 Kör Teklif (Blind Bid)" : "AES-256 Blind Bidding",
                  def: isTr
                    ? "Mühendislerin teklif metinlerinin ve fiyatlarının veritabanında şifrelenip yalnızca ilan sahibi tarafından çözülebildiği, fiyat kırmayı önleyen model."
                    : "Cryptographic protocol where proposal text and rates are encrypted at rest, preventing competitors from inspecting bids and price undercutting.",
                },
                {
                  term: isTr ? "İkili El Sıkışma (Direct Handshake)" : "Bilateral Handshake",
                  def: isTr
                    ? "İlan sahibinin teklifi onaylamasıyla tarafların doğrulanmış doğrudan iletişim kanallarının (telefon, WhatsApp, Slack, e-posta) karşılıklı açıldığı çalışma alanı."
                    : "Private bilateral workspace unlocked upon proposal acceptance, revealing mutual verified contact credentials without platform locks.",
                },
                {
                  term: isTr ? "FSEK Madde 52 Mali Hak Devri" : "FSEK Art. 52 IP Transfer",
                  def: isTr
                    ? "Yazılım ve tasarım eserlerinin işleme, çoğaltma ve yayma haklarının tam ödeme karşılığında işverene yazılı olarak devredilmesini sağlayan yasal protokol."
                    : "Statutory written copyright agreement transferring economic software rights to the client upon full milestone financial clearance.",
                },
                {
                  term: isTr ? "e-SMM (Elektronik Serbest Meslek Makbuzu)" : "e-SMM (Electronic Receipt)",
                  def: isTr
                    ? "Türkiye vergi mevzuatında serbest meslek erbabı bağımsız yazılımcı ve mühendislerin hizmet bedeli karşılığında düzenlediği resmi vergi belgesi."
                    : "Official electronic self-employment invoice issued by independent Turkish contractors for professional software and design services.",
                },
                {
                  term: isTr ? "Hızlı Ping (Quick Ping)" : "Quick Ping Alert",
                  def: isTr
                    ? "Eşleşme sonrasında acil durumlarda karşı tarafa doğrudan SMS ve anlık bildirim tetikleyen, 15 dakika bekleme süreli nezaket korumalı bildirim."
                    : "Direct high-priority workspace ping sending SMS and push notifications with a 15-minute anti-spam cooldown and night courtesy filter.",
                },
                {
                  term: isTr ? "3 Kademeli Hakediş (Milestones)" : "3-Stage Milestones",
                  def: isTr
                    ? "%30 Avans, %40 Alfa Demosu ve %30 Nihai Kod Kabulünden oluşan, tarafları eşit koruyan standart ödeme takvimi."
                    : "Balanced payment schedule consisting of 30% advance, 40% alpha demo, and 30% final code acceptance.",
                },
                {
                  term: isTr ? "5651 Sayılı Yer Sağlayıcı Statüsü" : "Law 5651 Intermediary Hosting",
                  def: isTr
                    ? "Operis'in ticari borçların tarafı veya kefili olmadığı, tarafları güvenli altyapıyla bir araya getiren bağımsız ilan yer sağlayıcısı olduğu yasal konumu."
                    : "Legal standing as an intermediary platform provider facilitating connections rather than acting as a commercial party or guarantor.",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-5 space-y-2 shadow-sm"
                >
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                    <span>{item.term}</span>
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {item.def}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
