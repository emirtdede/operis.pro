"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Percent,
  Clock,
  Lock,
  EyeOff,
  Handshake,
  Command,
  FileCheck2,
  Layers,
  ShieldCheck,
  SlidersHorizontal,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { SpotlightCard } from "@/src/components/ui/spotlight-card";
import { Button } from "@/src/components/ui/button";

interface PlatformFeaturesGridProps {
  isTr: boolean;
  locale: string;
}

type FeatureCategory = "all" | "client" | "freelancer" | "security";

interface FeatureItem {
  id: string;
  icon: LucideIcon;
  badge: string;
  title: string;
  description: string;
  highlight: string;
  category: FeatureCategory[];
  accentColor: {
    badge: string;
    iconBg: string;
    border: string;
  };
}

export function PlatformFeaturesGrid({ isTr, locale }: PlatformFeaturesGridProps) {
  const [activeTab, setActiveTab] = useState<FeatureCategory>("all");

  const features: FeatureItem[] = [
    {
      id: "zero-commission",
      icon: Percent,
      badge: isTr ? "%0 Kesinti" : "0% Platform Cut",
      title: isTr
        ? "%0 Komisyon & Kesintisiz Kazanç"
        : "Zero Commission & 100% Take-Home",
      description: isTr
        ? "İşlem ücreti, para çekme kesintisi veya gizli maliyetler yok. Anlaşılan tutarın tamamı doğrudan uzmana gider; platform fonları havuzda bloke etmez."
        : "No transaction taxes, withdrawal cuts, or hidden escrow deductions. 100% of the agreed budget flows directly to the developer without lock-ins.",
      highlight: isTr
        ? "Doğrudan IBAN / Kripto Transferi"
        : "Direct Peer-to-Peer Settlement",
      category: ["all", "freelancer", "client"],
      accentColor: {
        badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        iconBg: "text-emerald-400 bg-emerald-500/10",
        border: "hover:border-emerald-500/40",
      },
    },
    {
      id: "freshness-radar",
      icon: Clock,
      badge: isTr ? "168 Saat Sınırı" : "168h Lifetime",
      title: isTr
        ? "168 Saatlik Canlılık & Tazelik Radarı"
        : "168-Hour Active Freshness Radar",
      description: isTr
        ? "Sistemdeki tüm ilanlar maksimum 7 gün aktiftir. Güncellenmeyen ilanlar otomatik arşivlenir; haftalar önce unutulmuş hayalet ilanlara teklif vererek vakit kaybetmezsiniz."
        : "All projects expire after 7 days unless explicitly renewed. Say goodbye to dead, abandoned listings and submit offers only to genuinely active clients.",
      highlight: isTr
        ? "Sıfır Hayalet İlan Garantisi"
        : "Strict Freshness Guarantee",
      category: ["all", "freelancer"],
      accentColor: {
        badge: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
        iconBg: "text-cyan-400 bg-cyan-500/10",
        border: "hover:border-cyan-500/40",
      },
    },
    {
      id: "encrypted-bids",
      icon: Lock,
      badge: isTr ? "AES-256-GCM" : "AES-256-GCM",
      title: isTr
        ? "Kriptografik Birebir Kör Teklifler"
        : "Encrypted 1-to-1 Blind Proposals",
      description: isTr
        ? "Teklif mektubunuz, bütçeniz ve teslimat planınız AES-256 ile şifrelenir. Rakipler teklifinizi asla göremez; fiyat kırma savaşı ve fikir hırsızlığı yaşanmaz."
        : "Your pitch, timeline, and rate are encrypted with AES-256-GCM. Competitors cannot view them, completely eliminating price undercutting wars.",
      highlight: isTr
        ? "Gizli Teklif Güvencesi"
        : "Zero Price Undercutting",
      category: ["all", "security", "freelancer"],
      accentColor: {
        badge: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
        iconBg: "text-indigo-400 bg-indigo-500/10",
        border: "hover:border-indigo-500/40",
      },
    },
    {
      id: "bid-fatigue-protection",
      icon: EyeOff,
      badge: isTr ? "Teklif Gizliliği" : "Bid Privacy",
      title: isTr
        ? "Teklif Sayısı Maskeleme (Bid Fatigue Önleme)"
        : "Masked Bid Counts & Fair Chance",
      description: isTr
        ? "İlanlardaki başvuru sayısı gizlenir. 'Zaten 100 kişi başvurmuş, bana sıra gelmez' korkusu biter; kıdemli yetenekler tereddüt etmeden teklif sunabilir."
        : "Total application numbers are masked to prevent bid fatigue. Senior developers are never discouraged by artificial crowd numbers.",
      highlight: isTr
        ? "Eşit & Nitelikli Değerlendirme"
        : "Equal Evaluation Opportunity",
      category: ["all", "freelancer"],
      accentColor: {
        badge: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        iconBg: "text-blue-400 bg-blue-500/10",
        border: "hover:border-blue-500/40",
      },
    },
    {
      id: "direct-handshake",
      icon: Handshake,
      badge: isTr ? "Açık İletişim" : "Uncensored",
      title: isTr
        ? "Doğrudan İkili Çalışma Alanı"
        : "Direct Bilateral Handshake",
      description: isTr
        ? "Teklif onaylandığı an telefon, e-posta, Slack, Discord ve GitHub iletişim bilgileri karşılıklı açılır. Sansürlenen mesajlar ve platforma hapsolma zorunluluğu yoktur."
        : "Once matched, verified contact channels (phone, email, Discord, GitHub) unlock instantly. No message redactions or platform entrapment.",
      highlight: isTr
        ? "Kendi Araçlarınızla Çalışın"
        : "Freedom of Tooling",
      category: ["all", "client", "freelancer"],
      accentColor: {
        badge: "text-purple-400 bg-purple-500/10 border-purple-500/20",
        iconBg: "text-purple-400 bg-purple-500/10",
        border: "hover:border-purple-500/40",
      },
    },
    {
      id: "command-palette",
      icon: Command,
      badge: isTr ? "⌘K Kısayolu" : "⌘K Fast Radar",
      title: isTr
        ? "Milisaniyelik Komut Paleti & Radar"
        : "Sub-Millisecond Command Palette (⌘K)",
      description: isTr
        ? "Klavyeden ⌘K veya Ctrl+K tuşlarına basarak 60 uzmanlık kategorisi, teknoloji yığınları (Next.js, Go, Python, Rust) ve bütçeler arasında anında gezinin."
        : "Trigger our instant command radar anywhere. Filter across 60 tech niches, frameworks, and budgets without reloading the page.",
      highlight: isTr
        ? "Sayfa Yenilemesiz Hızlı Arama"
        : "Instant Real-Time Filtering",
      category: ["all", "freelancer", "client"],
      accentColor: {
        badge: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        iconBg: "text-amber-400 bg-amber-500/10",
        border: "hover:border-amber-500/40",
      },
    },
    {
      id: "p2p-contract",
      icon: FileCheck2,
      badge: isTr ? "Hukuki Çerçeve" : "Legal Framework",
      title: isTr
        ? "P2P Sözleşme Taslağı & Şablonlar"
        : "P2P Contract Draft & Milestone Blueprints",
      description: isTr
        ? "Platform dışı doğrudan çalışmayı yasal güvenceye alan hazır Freelance Hizmet Sözleşmesi ve Gizlilik (NDA) taslakları. Kapsam ve revizyon haklarını netleştirin."
        : "Downloadable, battle-tested service contracts and mutual NDA blueprints designed for direct peer-to-peer engagements with clear milestone clauses.",
      highlight: isTr
        ? "Hazır Yasal Koruma Taslağı"
        : "Turnkey Legal Protection",
      category: ["all", "security", "client"],
      accentColor: {
        badge: "text-teal-400 bg-teal-500/10 border-teal-500/20",
        iconBg: "text-teal-400 bg-teal-500/10",
        border: "hover:border-teal-500/40",
      },
    },
    {
      id: "deep-categories",
      icon: Layers,
      badge: isTr ? "60 Uzmanlık" : "60 Niches",
      title: isTr
        ? "10 Sektör & 60 Niş Teknoloji Radarı"
        : "10 Industry Sectors & 60 Deep Niches",
      description: isTr
        ? "Yapay zeka modellerinden akıllı sözleşmelere, mobil uygulamalardan siber güvenliğe kadar özelleştirilmiş derin teknoloji etiketleri ile doğru ilanı bulun."
        : "Granular micro-tagging across AI/LLM, Web3, DevOps, Cloud Infrastructure, and UX Design. Zero clutter, hyper-targeted matches.",
      highlight: isTr
        ? "Mikro Teknoloji Hedefleme"
        : "Laser-Focused Search",
      category: ["all", "client", "freelancer"],
      accentColor: {
        badge: "text-rose-400 bg-rose-500/10 border-rose-500/20",
        iconBg: "text-rose-400 bg-rose-500/10",
        border: "hover:border-rose-500/40",
      },
    },
    {
      id: "anti-spam",
      icon: ShieldCheck,
      badge: isTr ? "24/7 Kalkan" : "24/7 Shield",
      title: isTr
        ? "Akıllı Spam Moderasyonu & Doğrulanmış Profil"
        : "Smart Spam Moderation & Trust Shield",
      description: isTr
        ? "Yapay zeka filtresi ve moderasyon denetimiyle sahte ilanlar, bot teklifleri ve yanıltıcı içerikler anında elenir. Sadece gerçek bütçeli işler yayınlanır."
        : "Automated fraud defense and verified talent safeguards actively weed out junk proposals and fake listings before they hit the live radar.",
      highlight: isTr
        ? "Temiz & Güvenli Pazar Yeri"
        : "Zero Junk & Bot Free",
      category: ["all", "security"],
      accentColor: {
        badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        iconBg: "text-emerald-400 bg-emerald-500/10",
        border: "hover:border-emerald-500/40",
      },
    },
    {
      id: "proposal-cockpit",
      icon: SlidersHorizontal,
      badge: isTr ? "Yönetim Terminali" : "Evaluation Cockpit",
      title: isTr
        ? "İşveren Teklif Kıyaslama Terminali"
        : "Side-by-Side Proposal Cockpit",
      description: isTr
        ? "İşverenler gelen tüm şifreli teklifleri bütçe, teslimat süresi, GitHub geçmişi ve teknik portföy bazında yan yana sıralayıp objektifçe kıyaslayabilir."
        : "Clients review and benchmark candidate offers side-by-side: evaluate milestone estimates, GitHub repos, and tech stack compatibility in one view.",
      highlight: isTr
        ? "Veriye Dayalı Objektif Seçim"
        : "Data-Driven Hiring",
      category: ["all", "client"],
      accentColor: {
        badge: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        iconBg: "text-blue-400 bg-blue-500/10",
        border: "hover:border-blue-500/40",
      },
    },
  ];

  const filteredFeatures =
    activeTab === "all"
      ? features
      : features.filter((f) => f.category.includes(activeTab));

  const filterTabs: { id: FeatureCategory; label: string; count: number }[] = [
    {
      id: "all",
      label: isTr ? "Tüm Özellikler" : "All Capabilities",
      count: features.length,
    },
    {
      id: "client",
      label: isTr ? "İşveren Avantajları" : "For Listing Owners",
      count: features.filter((f) => f.category.includes("client")).length,
    },
    {
      id: "freelancer",
      label: isTr ? "Yazılımcı Avantajları" : "For Developers",
      count: features.filter((f) => f.category.includes("freelancer")).length,
    },
    {
      id: "security",
      label: isTr ? "Güvenlik & Gizlilik" : "Security & Privacy",
      count: features.filter((f) => f.category.includes("security")).length,
    },
  ];

  return (
    <section
      id="platform-features"
      aria-labelledby="platform-features-heading"
      className="relative flex flex-col justify-center items-center w-full px-4 sm:px-6 lg:px-8 py-14 sm:py-20 snap-start scroll-mt-16 border-t border-[var(--color-border-subtle)]/40"
    >
      <div className="mx-auto max-w-7xl w-full space-y-10 sm:space-y-12">
        {/* Header Title & Subtitle */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {isTr
                ? "TAM PLATFORM DONANIMI & AVANTAJLAR"
                : "COMPREHENSIVE CAPABILITIES & ADVANTAGES"}
            </span>
          </div>

          <h2
            id="platform-features-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-[1.15]"
          >
            {isTr ? (
              <>
                İşinizi Kolaylaştıran{" "}
                <span className="text-gradient-accent">10 Güçlü Platform Yeteneği</span>
              </>
            ) : (
              <>
                <span className="text-gradient-accent">10 Core Capabilities</span> Engineered for
                Maximum Leverage
              </>
            )}
          </h2>

          <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed max-w-2xl mx-auto">
            {isTr
              ? "Operis yalnızca bir ilan tahtası değildir. Komisyonsuz, şifreli, sansürsüz ve bayat ilanlardan arındırılmış bağımsız bir çalışma ekosistemidir."
              : "Operis is not just a job board. It is a sovereign, zero-commission, encrypted matching infrastructure built to remove every traditional freelance friction point."}
          </p>
        </div>

        {/* Interactive Filter Pills */}
        <div className="flex justify-center">
          <div className="inline-flex flex-wrap items-center justify-center p-1.5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-xl shadow-sm gap-1">
            {filterTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)]"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid of 10 Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-tab-fade">
          {filteredFeatures.map((item, idx) => {
            const Icon = item.icon;
            return (
              <SpotlightCard
                key={item.id}
                style={{ animationDelay: `${idx * 45}ms` }}
                className={`p-6 sm:p-7 rounded-2xl flex flex-col justify-between transition-all duration-300 group ${item.accentColor.border}`}
              >
                <div className="space-y-4">
                  {/* Card Top: Icon & Badge */}
                  <div className="flex items-center justify-between gap-3">
                    <div
                      className={`h-11 w-11 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ${item.accentColor.iconBg}`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${item.accentColor.badge}`}
                    >
                      {item.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2">
                    <h3 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Bottom Highlight Pill */}
                <div className="pt-4 mt-4 border-t border-[var(--color-border-subtle)]/60 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 text-[var(--color-text-primary)] font-medium text-[11px]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                    <span>{item.highlight}</span>
                  </span>
                  <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">
                    #0{idx + 1}
                  </span>
                </div>
              </SpotlightCard>
            );
          })}
        </div>

        {/* Feature Action Bar */}
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-1.5">
            <h4 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]">
              {isTr
                ? "Tüm Bu Özellikleri Hemen Canlıda Deneyimleyin"
                : "Experience These Capabilities in Live Action"}
            </h4>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-2xl">
              {isTr
                ? "Ücretsiz hesap oluşturarak hemen ilanınızı yayınlayabilir veya 168 saatlik canlı radarımızdaki güncel yazılım ilanlarına şifreli teklif verebilirsiniz."
                : "Create a free profile to post your listing scope instantly or explore active listings with encrypted 1-to-1 proposal protection."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
            <Link
              href={`/${locale}/${isTr ? "ilanlar/yeni" : "listings/new"}`}
              className="w-full sm:w-auto"
            >
              <Button variant="shimmer" size="md" className="w-full sm:w-auto gap-2">
                <span>{isTr ? "Ücretsiz İlan Ver" : "Post a Free Listing"}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link
              href={`/${locale}/${isTr ? "kategoriler" : "categories"}`}
              className="w-full sm:w-auto"
            >
              <Button variant="secondary" size="md" className="w-full sm:w-auto">
                <span>{isTr ? "Kategorileri İncele (60)" : "Explore Categories"}</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
