import type { Metadata } from "next";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  Building2,
  Cpu,
  Handshake,
  Scale,
  Server,
  Layers,
  Activity,
  Award,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
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
      ? "Hakkımızda & Kurumsal Manifesto — Bağımsız Mühendislik Ağı"
      : "About Us & Corporate Manifesto — Independent Engineering Network",
    description: isTr
      ? "Operis'in bağımsız yazılım mühendisleri ve yenilikçi teknoloji şirketleri için kurduğu %0 komisyonsuz, şeffaf, şifreli ve doğrudan çalışma manifestosu."
      : "The Operis enterprise manifesto: empowering verified engineers and innovative enterprises through 0% commission, encrypted blind bidding, and direct collaboration.",
    alternates: {
      canonical: isTr ? "/tr/hakkimizda" : "/en/about",
      languages: {
        tr: "/tr/hakkimizda",
        en: "/en/about",
      },
    },
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isTr = locale === "tr";

  const metrics = [
    {
      value: "%0",
      label: isTr ? "Platform Komisyonu" : "Platform Cut",
      detail: isTr ? "Kazancın %100'ü Doğrudan Tarafların" : "100% Earnings Retained",
      color: "text-amber-400 border-amber-500/20 bg-amber-500/10",
    },
    {
      value: "168s",
      label: isTr ? "Canlılık Radarı" : "Freshness Radar",
      detail: isTr ? "Sıfır Hayalet İlan, Haftalık Taze Döngü" : "Zero Ghost Postings Guaranteed",
      color: "text-blue-400 border-blue-500/20 bg-blue-500/10",
    },
    {
      value: "AES-256",
      label: isTr ? "Kör Teklif Güvenliği" : "Encrypted Bids",
      detail: isTr ? "Fiyat Kırmaya Son Veren Kriptografi" : "Undercutting-Proof Encryption",
      color: "text-purple-400 border-purple-500/20 bg-purple-500/10",
    },
    {
      value: "2026",
      label: isTr ? "Yasal & FSEK Uyumu" : "Statutory Alignment",
      detail: isTr ? "FSEK m. 52, e-SMM ve 5651 Zırhı" : "FSEK Art. 52, e-SMM & Law 5651",
      color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
    },
  ];

  const pillars = [
    {
      id: "zero-commission",
      icon: Zap,
      number: "01",
      badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      accentGlow: "from-amber-500/10 via-amber-500/5 to-transparent",
      title: isTr ? "%0 Komisyon Bağımsızlığı" : "0% Platform Cut",
      subtitle: isTr ? "Emeğin %100 Değeri Korunur" : "Keep 100% of Every Single Deal",
      description: isTr
        ? "Geleneksel pazaryerlerinin %10 ila %20 arasında değişen haraç komisyonlarını, para rehin sistemlerini ve yapay çekim ücretlerini kökten reddediyoruz. Operis bir komisyoncu veya finansal aracı değil; açık bir mühendislik dizinidir. Anlaşılan bütçenin her kuruşu doğrudan mühendisin hesabına geçer."
        : "We categorically reject arbitrary 10-20% broker fees, locked escrows, and payout tolls. Operis is not a middleman; it is an open peer-to-peer directory. Every cent you agree on goes directly to the contractor.",
      bullets: isTr
        ? [
            "İşveren veya mühendisten hiçbir yüzde komisyonu alınmaz.",
            "Emanet para havuzu tutulmaz; taraflar doğrudan kendi sözleşmelerini yapar.",
            "Gizli kesintiler, teklif jetonları (connects) veya işlem harçları yoktur.",
          ]
        : [
            "Zero percentage commission on any project tier.",
            "No escrow hold-backs; counterparties contract directly.",
            "No pay-to-pitch connects, hidden deductions, or extraction fees.",
          ],
    },
    {
      id: "freshness-radar",
      icon: Clock,
      number: "02",
      badgeColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      accentGlow: "from-blue-500/10 via-blue-500/5 to-transparent",
      title: isTr ? "168 Saatlik Canlılık Radarı" : "168-Hour Freshness Radar",
      subtitle: isTr ? "Terk Edilmiş Bayat İlanlara Kesin Son" : "Zero Ghost Postings Guaranteed",
      description: isTr
        ? "Geleneksel portallar kullanıcı sayısını şişirmek ve sahte aktivite yaratmak amacıyla aylar öncesinden kalma unutulmuş ilanları yayında tutar. Operis'te her ilan yayınlandığı andan itibaren tam olarak 168 saat (7 gün) boyunca aktiftir. Süresi dolan ilan otomatik arşive alınır."
        : "Legacy boards hoard stale projects for months just to fabricate vanity metrics. On Operis, every single listing lives for strictly 168 hours (7 days) before automatic archival unless explicitly renewed by the owner.",
      bullets: isTr
        ? [
            "Radardaki tüm ilanlar aktif, güncel ve işvereni anında hazır ilanlardır.",
            "İlan sahibi tek tıkla ilanını 1 hafta daha ücretsiz tazeleyebilir.",
            "Mühendisler bayat ilanlara zaman ve emek harcamadan yanıt alır.",
          ]
        : [
            "Every listing in your feed is live, urgent, and verified active.",
            "Owners can refresh their post for another week with 1 click.",
            "Engineers never waste hours bidding on dead or abandoned posts.",
          ],
    },
    {
      id: "encrypted-offers",
      icon: Lock,
      number: "03",
      badgeColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      accentGlow: "from-purple-500/10 via-purple-500/5 to-transparent",
      title: isTr ? "AES-256 Uçtan Uca Kör Teklifler" : "AES-256 Encrypted Blind Bids",
      subtitle: isTr ? "Fiyat Kırma Savaşına Son Veriyoruz" : "Eliminating the Race-to-the-Bottom",
      description: isTr
        ? "Diğer adayların tekliflerini ve bütçelerini herkese açık sergileyen platformlar, niteliksiz bir fiyat kırma yarışına (race to the bottom) neden olur. Operis'te tüm teklif metinleri, bütçeler ve teslimat süreleri AES-256-GCM ile şifrelenir; yalnızca ilan sahibi tarafından çözülebilir."
        : "Publicly visible bid counts and rates trigger bidding fatigue and destructive price slashing. On Operis, all proposals are encrypted at rest with AES-256-GCM and decryptable exclusively by the listing creator.",
      bullets: isTr
        ? [
            "Rakipleriniz sunduğunuz bütçeyi, süreyi ve teknik çözümü göremez.",
            "Mühendisler değerini ucuzlatarak değil, teknik yetkinliğiyle seçilir.",
            "Kabul edilen teklif sonrasında doğrudan ikili çalışma alanı açılır.",
          ]
        : [
            "Competitors cannot inspect your rates, timeline, or pitch.",
            "Engineers compete on architectural merit, not desperate undercutting.",
            "Upon mutual acceptance, verified contact info is unlocked directly.",
          ],
    },
    {
      id: "bilateral-freedom",
      icon: Handshake,
      number: "04",
      badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      accentGlow: "from-emerald-500/10 via-emerald-500/5 to-transparent",
      title: isTr ? "Doğrudan İletişim & El Sıkışma" : "Direct Bilateral Collaboration",
      subtitle: isTr ? "İletişim Ambargosu ve Sansüre Son" : "Zero Communication Gag Orders",
      description: isTr
        ? "Kullanıcıları yapay platform içi mesajlaşmaya hapsedip telefon veya e-posta paylaşımını yasaklayan ilkel politikaları tamamen kaldırıyoruz. Teklif onaylandığı an doğrulanmış telefon, e-posta, Slack veya WhatsApp kanalları anında açılır."
        : "We reject oppressive policies that ban phone numbers or emails and force teams into clunky platform chats. Upon proposal acceptance, verified phone, email, Slack, and WhatsApp channels unlock immediately.",
      bullets: isTr
        ? [
            "Telefon görüşmesi, video toplantı veya yüz yüze çalışma serbesttir.",
            "Taraflar kendi iletişim hızında ve araçlarında çalışır.",
            "Platform dışı iletişim sebebiyle hesap kapatma tehdidi yoktur.",
          ]
        : [
            "Sync freely via phone calls, Zoom meetings, or in-person work.",
            "Collaborate at your own pace using preferred corporate tools.",
            "Zero fear of account suspensions over external communications.",
          ],
    },
    {
      id: "statutory-armor",
      icon: Scale,
      number: "05",
      badgeColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      accentGlow: "from-rose-500/10 via-rose-500/5 to-transparent",
      title: isTr ? "2026 Yasal Standartları & FSEK Zırhı" : "Statutory IP & Contract Armor",
      subtitle: isTr ? "Kurumsal Hukuk ve Telif Güvencesi" : "Compliant Source Code Governance",
      description: isTr
        ? "5846 sayılı FSEK Madde 52 uyarınca yazılımın mali haklarının devri, 6098 sayılı TBK Eser Sözleşmesi ve Türkiye 2026 vergi standartları (e-SMM, Genç Girişimci İstisnası) çerçevesinde taraflara tam koruma ve hazır taslak sözleşmeler sunulur."
        : "Under Copyright Law (FSEK Art. 52), Code of Obligations (TBK), and Turkish tax rules (e-SMM, Youth Entrepreneur exemption), counterparties receive vetted contracts safeguarding economic rights and source code.",
      bullets: isTr
        ? [
            "Yasal Merkezden tek tıkla indirilebilir Eser Sözleşmesi ve NDA şablonları.",
            "Tam ödeme karşılığında kaynak kod ve fikri mülkiyet devir protokolü.",
            "5651 sayılı Kanun ve KVKK standartlarına tam uyumlu yer sağlayıcı altyapısı.",
          ]
        : [
            "One-click downloadable Software Agreement and Bilateral NDA templates.",
            "Full source code assignment upon verified milestone settlement.",
            "Law No. 5651 & KVKK compliant intermediary hosting infrastructure.",
          ],
    },
  ];

  const securityFeatures = [
    {
      icon: Server,
      title: isTr ? "AES-256-GCM Kriptografi" : "AES-256-GCM Cryptography",
      desc: isTr
        ? "Teklif metinleri, bütçeler ve teslim takvimleri veritabanında uçtan uca şifrelenir; yalnızca ilan sahibi tarafından çözümlenebilir."
        : "Proposal text, budget rates, and milestones are encrypted at rest with military-grade AES-256-GCM.",
    },
    {
      icon: Layers,
      title: isTr ? "PostgreSQL Row Level Security (RLS)" : "PostgreSQL Row Level Security",
      desc: isTr
        ? "Veritabanı seviyesinde katı yetkilendirme mimarisi; kullanıcı verilerine yetkisiz çapraz erişimler mimari olarak engellenir."
        : "Strict database-tier access enforcement isolating user partitions from unauthorized cross-tenant queries.",
    },
    {
      icon: Activity,
      title: isTr ? "Cloudflare Edge & Anti-DDoS" : "Cloudflare Edge & Anti-DDoS",
      desc: isTr
        ? "Küresel CDN ağı, akıllı bot filtreleme, fail-open Turnstile insan doğrulaması ve kesintisiz yüksek erişilebilirlik altyapısı."
        : "Global low-latency edge caching, automated bot mitigation, and resilient Turnstile bot challenge pipelines.",
    },
    {
      icon: ShieldCheck,
      title: isTr ? "Sıfır Fon Riski (No-Escrow Risk)" : "Zero Custody Risk (No-Escrow)",
      desc: isTr
        ? "Operis kullanıcı paralarını platform havuzunda tutmaz; iflas, hesap blokesi veya fon rehin riskleri sıfırdır."
        : "Operis never holds client deposits; eliminates insolvency exposure, account freezes, and custody seizure risks.",
    },
  ];

  const comparisons = [
    {
      feature: isTr ? "Platform Komisyon Oranı" : "Platform Commission Cut",
      operis: isTr ? "%0 (Kesintisiz Doğrudan Kazanç)" : "0% (Keep 100% of Every Cent)",
      traditional: isTr ? "%10 - %20 Arası Ağır Kesinti" : "10% - 20% Compounded Deductions",
    },
    {
      feature: isTr ? "Teklif Gizliliği & Mahremiyeti" : "Bid Privacy & Encryption",
      operis: isTr ? "AES-256-GCM Şifreli Kör Teklifler" : "AES-256-GCM Blind Proposals",
      traditional: isTr ? "Açık Teklifler ve Fiyat Kırma Savaşı" : "Public Counters & Undercutting",
    },
    {
      feature: isTr ? "İlan Yaşam Döngüsü" : "Listing Freshness",
      operis: isTr ? "Kesin 168 Saat (7 Gün) Radarı" : "Strict 168-Hour Expiry Radar",
      traditional: isTr ? "Aylarca Kalan Bayat Hayalet İlanlar" : "Months-Old Zombie Listings",
    },
    {
      feature: isTr ? "İletişim Kanalları" : "Communication Freedom",
      operis: isTr ? "WhatsApp, Telefon, Slack, E-Posta Serbest" : "Direct Phone, WhatsApp, Slack Allowed",
      traditional: isTr ? "Sansürlü Chat & Platform Dışı Yasak" : "Censored Chat & Banning Penalties",
    },
    {
      feature: isTr ? "Ödeme ve Para Blokesi" : "Payment Custody",
      operis: isTr ? "Havuz Yok; Doğrudan Banka Hakedişi" : "Zero Escrow Lock; Direct Settlement",
      traditional: isTr ? "Haftalarca Bloke Edilen Paralar" : "Weeks of Held Funds & Payout Delays",
    },
    {
      feature: isTr ? "Telif ve Fikri Mülkiyet (FSEK)" : "IP Rights & Source Code",
      operis: isTr ? "FSEK m. 52 Uyumlu Hazır Sözleşmeler" : "FSEK Art. 52 Contract Templates",
      traditional: isTr ? "Muğlak Kurallar & Güvencesiz Kod" : "Ambiguous Terms & Vague Assignment",
    },
  ];

  const baseUrl = getBaseUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        name: isTr ? "Hakkımızda & Kurumsal Manifesto" : "About Us & Corporate Manifesto",
        headline: isTr
          ? "Mühendisin Emeğine Ortak Olmayan Bağımsız Teknoloji Ağı"
          : "Direct Engineering Discovery Without the Middleman Toll",
        description: isTr
          ? "Operis'in bağımsız yazılım mühendisleri ve yenilikçi teknoloji şirketleri için kurduğu %0 komisyonsuz, şeffaf, şifreli ve doğrudan çalışma manifestosu."
          : "The Operis enterprise manifesto: empowering verified engineers and innovative enterprises through 0% commission, encrypted blind bidding, and direct collaboration.",
        url: `${baseUrl}${getLocalizedRoute("about", locale)}`,
        inLanguage: locale,
        isPartOf: {
          "@type": "WebSite",
          name: "Operis",
          url: baseUrl,
        },
        publisher: {
          "@type": "Organization",
          name: "Vellium",
          url: "https://vellium.dev",
          legalName: "Vellium",
          address: {
            "@type": "PostalAddress",
            addressLocality: "İstanbul",
            addressCountry: "TR",
          },
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
            name: isTr ? "Hakkımızda" : "About Us",
            item: `${baseUrl}${getLocalizedRoute("about", locale)}`,
          },
        ],
      },
    ],
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-24">
      {/* Schema.org Structured Data */}
      <JsonLd data={jsonLd} />

      {/* 1. Hero Corporate Manifesto Section */}
      <section className="relative text-center space-y-6 max-w-4xl mx-auto pt-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-xs font-semibold text-blue-400 shadow-sm backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
          <span>{isTr ? "Operis Açık Teknoloji Manifestosu & Kurumsal Profil" : "Operis Enterprise Profile & Open Tech Manifesto"}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[var(--color-text-primary)] leading-[1.12]">
          {isTr ? (
            <>
              Mühendisin Emeğine Ortak Olmayan{" "}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Bağımsız Teknoloji Ağı
              </span>
            </>
          ) : (
            <>
              Direct Engineering Discovery{" "}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Without the Middleman Toll
              </span>
            </>
          )}
        </h1>

        <p className="text-base sm:text-lg text-[var(--color-text-secondary)] leading-relaxed max-w-3xl mx-auto">
          {isTr
            ? "Yazılım geliştirme süreci; fahiş aracı komisyonlarına, yapay iletişim yasaklarına ve bürokratik ödeme kilitlerine hapsedilemez. Operis; doğrudan iletişimi, kriptografik gizliliği ve emeğin %100 değerini korumak üzere inşa edilmiş yeni nesil açık eşleştirme altyapısıdır."
            : "Software development should not be choked by arbitrary platform cuts, communication bans, and bureaucratic payment locks. Operis is a next-generation matching infrastructure forged to restore direct collaboration, bid privacy, and 100% value retention."}
        </p>

        {/* 4 Corporate Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          {metrics.map((m, i) => (
            <div
              key={i}
              className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-xl p-5 text-center space-y-1.5 shadow-lg hover:border-blue-500/30 transition-all"
            >
              <div className={`text-2xl sm:text-3xl font-black font-mono ${m.color.split(" ")[0]}`}>
                {m.value}
              </div>
              <h3 className="text-xs font-bold text-[var(--color-text-primary)]">{m.label}</h3>
              <p className="text-[11px] text-[var(--color-text-tertiary)] leading-tight">{m.detail}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3.5 pt-4">
          <Link href={getLocalizedRoute("listings", locale)}>
            <Button variant="primary" size="lg" className="gap-2 px-7 shadow-lg shadow-blue-500/20">
              <span>{isTr ? "Canlı İlanları İncele" : "Explore Live Listings"}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <Link href={getLocalizedRoute("newListing", locale)}>
            <Button variant="secondary" size="lg" className="px-6">
              {isTr ? "Ücretsiz İlan Yayınla" : "Post a Free Listing"}
            </Button>
          </Link>
        </div>
      </section>

      {/* 2. The Origin Story: Why Operis Was Founded */}
      <section className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/60 backdrop-blur-2xl p-8 sm:p-12 space-y-8 shadow-xl relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20">
            <Award className="h-3.5 w-3.5" />
            <span>{isTr ? "Doğuş Hikayemiz" : "The Origin Story"}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
            {isTr ? "Geleneksel Freelance Tekellerinin Çıkmazı ve Operis" : "The Failure of Legacy Monopolies & The Rise of Operis"}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {isTr
              ? "Yıllar boyunca küresel ve yerel freelance platformları, iki taraf arasındaki iletişimi kolaylaştırmak yerine zorlaştıran birer 'bekçi kulübesine' dönüştü."
              : "For years, freelance platforms devolved from helpful intermediaries into rent-seeking gatekeepers restricting authentic collaboration."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto text-xs sm:text-sm leading-relaxed">
          <div className="p-6 rounded-2xl bg-[var(--color-surface-hover)]/40 border border-rose-500/20 space-y-3">
            <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              <span>{isTr ? "Geleneksel Sistem Neden İflas Etti?" : "Why the Legacy Model Failed"}</span>
            </h3>
            <p className="text-[var(--color-text-secondary)]">
              {isTr
                ? "Bir mühendisin binbir emekle tamamladığı projeden %20 haraç kesintisi yapmak, tarafları platform dışı iletişim kurdu diye yasaklamak, teklif vermek için para/jeton istemek ve teklifleri rakiplere açarak kalitesiz bir fiyat kırma savaşı körüklemek hem işverene hem de mühendise zarar veriyordu."
                : "Taking 20% of an engineer's hard-earned invoice, banning users for sharing phone numbers, charging for bidding connects, and exposing rates to trigger toxic price wars created a hostile environment for top engineering talent."}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--color-surface-hover)]/40 border border-emerald-500/20 space-y-3">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>{isTr ? "Operis'in Radikal Alternatifi" : "The Radical Operis Alternative"}</span>
            </h3>
            <p className="text-[var(--color-text-secondary)]">
              {isTr
                ? "Operis bu çürümüş aracı modelini tamamen ortadan kaldırdı. %0 komisyonla çalışan, teklifleri AES-256 ile şifreleyen, terk edilmiş ilanları 168 saat sonra otomatik temizleyen ve eşleşme sonrasında tarafları doğrudan el sıkıştıran şeffaf bir açık mühendislik dizini inşa ettik."
                : "Operis dismantles the middleman tax completely. We built an open matching directory operating at 0% commission, encrypting proposals with AES-256, auto-expiring zombie posts after 168 hours, and fostering direct bilateral workspaces."}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Mission & Vision Statements */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-3xl border border-blue-500/30 bg-[var(--color-surface-base)]/80 backdrop-blur-xl p-8 space-y-4 shadow-xl relative overflow-hidden">
          <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-sm">
            <Building2 className="h-6 w-6" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
            {isTr ? "Misyonumuz" : "Our Mission"}
          </span>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            {isTr ? "Yazılım Mühendisliğini Aracılardan Arındırmak" : "Purifying Engineering from Intermediary Friction"}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {isTr
              ? "Yazılım mühendisliği ve dijital üretim süreçlerini gereksiz platform komisyonlarından, bilgi asimetrisinden ve bürokratik engellerden arındırarak; değer üreten bağımsız uzmanlar ile yenilikçi projeleri en şeffaf, şifreli ve doğrudan mimariyle buluşturmak."
              : "To eliminate predatory broker cuts, information asymmetry, and artificial communication barriers—empowering software creators and modern product teams with direct, encrypted, frictionless discovery."}
          </p>
        </div>

        <div className="rounded-3xl border border-purple-500/30 bg-[var(--color-surface-base)]/80 backdrop-blur-xl p-8 space-y-4 shadow-xl relative overflow-hidden">
          <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shadow-sm">
            <Cpu className="h-6 w-6" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
            {isTr ? "Vizyonumuz" : "Our Vision"}
          </span>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            {isTr ? "Küresel Ölçekte Güvenilir Açık Standart" : "The Global Benchmark for Direct Tech Matching"}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {isTr
              ? "Bağımsız çalışan yazılım mühendislerinin emeğinin %100'ünü kazandığı, şirketlerin aracılara servet ödemeden doğrudan en iyi yeteneklerle çalıştığı, güvenin kod ve sözleşmelerle tesis edildiği şeffaf bir peer-to-peer ekosistem standardı olmak."
              : "To become the global open standard where contractors retain 100% of their billings, enterprises hire top engineering talent without middleman bloat, and trust is anchored by code, encryption, and statutory contracts."}
          </p>
        </div>
      </section>

      {/* 4. Five Core Enterprise Pillars */}
      <section className="space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 mb-1">
            <Layers className="h-3.5 w-3.5" />
            <span>{isTr ? "Operis Mimari Omurgası" : "Architectural Foundation"}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
            {isTr ? "Operis'i Tanımlayan 5 Temel İlke" : "The 5 Core Pillars of Operis"}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
            {isTr
              ? "Geleneksel freelance tekellerinden ayrıştığımız ve taviz vermediğimiz kurumsal ilkelerimiz."
              : "The non-negotiable principles that separate Operis from legacy gig monopolies."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          {pillars.map((p, idx) => {
            const Icon = p.icon;
            const isPillar4 = idx === 3;
            const isPillar5 = idx === 4;
            return (
              <div
                key={p.id}
                id={p.id}
                className={`scroll-mt-28 relative rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-2xl p-7 space-y-5 shadow-xl overflow-hidden hover:border-blue-500/40 transition-all duration-300 group flex flex-col justify-between md:col-span-1 lg:col-span-2 ${
                  isPillar4 ? "lg:col-start-2" : ""
                } ${
                  isPillar5 ? "md:col-span-2 md:max-w-md md:mx-auto w-full lg:max-w-none lg:mx-0 lg:col-span-2" : ""
                }`}
              >
                <div
                  className={`pointer-events-none absolute -top-20 -right-20 w-48 h-48 rounded-full bg-gradient-to-br ${p.accentGlow} blur-2xl group-hover:scale-125 transition-transform duration-500`}
                  aria-hidden="true"
                />

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div
                      className={`h-12 w-12 rounded-2xl border flex items-center justify-center ${p.badgeColor} shadow-sm`}
                    >
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <span className="font-mono text-2xl font-black text-[var(--color-text-tertiary)] opacity-60">
                      {p.number}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] group-hover:text-blue-400 transition-colors">
                      {p.title}
                    </h3>
                    <p className="text-xs font-semibold text-blue-400/90 mt-0.5">{p.subtitle}</p>
                  </div>

                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--color-border-subtle)]/70 space-y-2 relative z-10">
                  {p.bullets.map((b, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-[var(--color-text-tertiary)]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Enterprise Security & Architecture Blueprint */}
      <section className="space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-400 mb-1">
            <Server className="h-3.5 w-3.5" />
            <span>{isTr ? "Kurumsal Güvenlik Mimarisi" : "Enterprise Security Architecture"}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
            {isTr ? "Teknik Standartlar & Mahremiyet Güvencesi" : "Technical Standards & Privacy Protocols"}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
            {isTr
              ? "Operis altyapısı kurumsal düzeyde veri güvenliği ve şeffaflık ilkelerine göre yapılandırılmıştır."
              : "Engineered from the ground up for bank-grade data security, resilience, and statutory compliance."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {securityFeatures.map((sec, idx) => {
            const Icon = sec.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-6 space-y-3 shadow-md hover:border-purple-500/30 transition-all"
              >
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-[var(--color-text-primary)] leading-snug">
                  {sec.title}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {sec.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Enterprise Comparison Matrix */}
      <section className="space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 mb-1">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isTr ? "Radikal Şeffaflık Matrisi" : "Radical Transparency Matrix"}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
            {isTr ? "Operis vs. Geleneksel Freelance Tekelleri" : "Operis vs. Legacy Freelance Monopolies"}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
            {isTr
              ? "Neden modern mühendislerin ve yenilikçi şirketlerin Operis'i tercih ettiğini doğrudan kıyaslayın."
              : "See exactly why modern developers and forward-thinking enterprises reject legacy toll-booth models."}
          </p>
        </div>

        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/60 text-xs uppercase font-bold tracking-wider">
                  <th className="p-4 sm:p-5 text-[var(--color-text-primary)]">
                    {isTr ? "Özellik / Kriter" : "Core Feature"}
                  </th>
                  <th className="p-4 sm:p-5 text-blue-400 font-extrabold">Operis</th>
                  <th className="p-4 sm:p-5 text-[var(--color-text-tertiary)]">
                    {isTr ? "Geleneksel Platformlar" : "Legacy Platforms"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)] text-xs sm:text-sm">
                {comparisons.map((c, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-[var(--color-surface-hover)]/40 transition-colors"
                  >
                    <td className="p-4 sm:p-5 font-semibold text-[var(--color-text-primary)]">
                      {c.feature}
                    </td>
                    <td className="p-4 sm:p-5 font-medium text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                      <span>{c.operis}</span>
                    </td>
                    <td className="p-4 sm:p-5 text-[var(--color-text-tertiary)]">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 shrink-0 text-red-400/80" aria-hidden="true" />
                        <span>{c.traditional}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 7. Dual Value Proposition: Startups & Engineers */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-xl p-8 space-y-4 shadow-lg">
          <div className="flex items-center gap-2.5 text-blue-400 font-bold text-base">
            <Building2 className="h-5 w-5" />
            <h3>{isTr ? "Girişimler ve Şirketler İçin" : "For Startups & Enterprises"}</h3>
          </div>
          <ul className="space-y-3 text-xs sm:text-sm text-[var(--color-text-secondary)]">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{isTr ? "Komisyon faturası yok; bütçenizin tamamı gerçek mühendislik emeğine dönüşür." : "No commission markup; 100% of your budget goes to technical execution."}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{isTr ? "168 saatlik canlılık radarı sayesinde ilanınıza sadece acil müsaitliği olan aktif uzmanlar teklif verir." : "Only actively available, verified talent proposals within the live 168-hour window."}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{isTr ? "Eser Sözleşmesi ve FSEK m. 52 devir taslaklarımızla kaynak kodların mülkiyeti güvendedir." : "Pre-vetted statutory agreements secure complete source code and IP assignment."}</span>
            </li>
          </ul>
        </div>

        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-xl p-8 space-y-4 shadow-lg">
          <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-base">
            <Cpu className="h-5 w-5" />
            <h3>{isTr ? "Bağımsız Mühendisler İçin" : "For Independent Engineers"}</h3>
          </div>
          <ul className="space-y-3 text-xs sm:text-sm text-[var(--color-text-secondary)]">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{isTr ? "Teklif jetonları (connects) için cebinizden tek kuruş çıkmaz; her teklif ücretsizdir." : "Zero fee-to-pitch connects; submitting proposals is 100% free forever."}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{isTr ? "AES-256 kör teklif sayesinde rakipler fiyatınızı göremez; değer odaklı teklif verirsiniz." : "AES-256 blind bidding protects your pricing integrity against toxic race-to-the-bottom."}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{isTr ? "Müşteriyle doğrudan telefon ve WhatsApp üzerinden iletişim kurup kendi sözleşmenizle çalışırsınız." : "Communicate directly via phone, Slack, or WhatsApp with complete contractual autonomy."}</span>
            </li>
          </ul>
        </div>
      </section>

      {/* 8. Corporate Governance & Entity Badge */}
      <section className="rounded-3xl border border-blue-500/25 bg-gradient-to-r from-blue-500/5 via-[var(--color-surface-base)] to-[var(--color-surface-base)] p-8 sm:p-10 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
              <Building2 className="h-3.5 w-3.5" />
              <span>{isTr ? "Kurumsal Çatı & Tüzel Kişilik" : "Corporate Governance & Entity"}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">
              {isTr
                ? "Operis bir Vellium Teknolojileri ve İnovasyon Ürünüdür"
                : "Operis is Built & Operated by Vellium Technologies"}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
              {isTr
                ? "Platform; Türkiye Cumhuriyeti kanunlarına tam uyumlu, İstanbul merkezli Vellium tüzel kişiliği güvencesi altında işletilmektedir. MERSİS no, vergi dairesi kaydı, KEP ve resmi şirket künyesi şeffaflık ilkemiz gereği tüm kullanıcılara açıktır."
                : "The platform operates under the corporate stewardship of Vellium, headquartered in Istanbul, Turkey. Corporate registry, MERSİS, KEP, and official disclosures are fully accessible under our radical transparency commitment."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link href={getLocalizedRoute("contact", locale)}>
              <Button variant="outline" size="md" className="gap-2 text-xs cursor-pointer">
                <Building2 className="h-4 w-4 text-blue-400" />
                <span>{isTr ? "Resmi Şirket Künyesi" : "Corporate Registry"}</span>
              </Button>
            </Link>
            <Link href={getLocalizedRoute("legalCenter", locale)}>
              <Button variant="outline" size="md" className="gap-2 text-xs cursor-pointer">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>{isTr ? "Yasal & Güven Merkezi" : "Legal & Trust Center"}</span>
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-[var(--color-border-subtle)] text-xs text-[var(--color-text-tertiary)]">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
            <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
            <span>{isTr ? "Genel Merkez: İstanbul, Türkiye" : "Headquarters: Istanbul, Turkey"}</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{isTr ? "Resmi Tebligat: KEP & UETS Kayıtlı" : "Statutory KEP & Electronic Notice"}</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
            <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
            <span>{isTr ? "5651 Sayılı Yer Sağlayıcı Güvencesi" : "Statutory Intermediary Hosting"}</span>
          </div>
        </div>
      </section>

      {/* 9. High-Impact Closing Enterprise CTA */}
      <section className="relative rounded-3xl border border-blue-500/30 bg-gradient-to-b from-blue-500/10 via-[var(--color-surface-base)] to-[var(--color-surface-base)] p-8 sm:p-14 text-center space-y-6 shadow-2xl overflow-hidden">
        <div
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-black text-[var(--color-text-primary)] tracking-tight">
            {isTr
              ? "Şeffaf, Komisyonsuz Teknoloji Dünyasına Adım Atın"
              : "Step Into Direct, Zero-Commission Tech Collaboration"}
          </h2>
          <p className="text-xs sm:text-base text-[var(--color-text-secondary)] leading-relaxed">
            {isTr
              ? "Operis'te aracı yok, rehin yok, komisyon yok. Yalnızca nitelikli yazılım uzmanları ve yenilikçi projeler var."
              : "No brokers, no platform cut, no custody holds. Just elite tech specialists and visionary software projects."}
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link href={getLocalizedRoute("register", locale)}>
            <Button variant="primary" size="lg" className="gap-2 px-8 py-3 text-sm font-semibold shadow-lg shadow-blue-500/25">
              <span>{isTr ? "Ücretsiz Üye Ol" : "Create Free Account"}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <Link href={getLocalizedRoute("contact", locale)}>
            <Button variant="secondary" size="lg" className="px-8 py-3 text-sm font-semibold">
              {isTr ? "Kurumsal İletişim" : "Enterprise Contact"}
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
