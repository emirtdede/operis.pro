import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { LegalService } from "@/src/modules/legal/service";
import { Locale } from "@/src/lib/i18n/config";
import { ReadingProgressBar } from "@/src/components/ui/reading-progress-bar";
import { LegalDocumentViewer } from "@/src/components/legal/legal-document-viewer";

import { TR_TO_INTERNAL_LEGAL_SLUG, getLocalizedLegalPath } from "@/src/lib/i18n/routes";

const VALID_LEGAL_SLUGS = [
  "terms",
  "privacy",
  "matching-disclaimer",
  "acceptable-use",
  "cookies",
  "contact",
  "intellectual-property",
  "consent",
  "dispute-resolution",
  "kullanim-kosullari",
  "gizlilik-ve-kvkk",
  "eslestirme-ve-sorumluluk-reddi",
  "kabul-edilebilir-kullanim",
  "cerez-politikasi",
  "iletisim",
  "fikri-mulkiyet-ve-telif",
  "acik-riza-metni",
  "uyusmazlik-cozumu",
];

export function generateStaticParams() {
  return VALID_LEGAL_SLUGS.map((slug) => ({ slug }));
}

const TITLES: Record<string, { tr: string; en: string }> = {
  terms: { tr: "Kullanım Koşulları", en: "Terms of Service" },
  privacy: { tr: "Gizlilik ve KVKK Aydınlatma Metni", en: "Privacy Notice" },
  "matching-disclaimer": {
    tr: "Eşleştirme ve Sorumluluk Reddi Beyanı",
    en: "Matching & Disclaimer Notice",
  },
  "acceptable-use": {
    tr: "Kabul Edilebilir Kullanım Politikası",
    en: "Acceptable Use Policy",
  },
  cookies: { tr: "Çerez Politikası", en: "Cookie Policy" },
  contact: {
    tr: "Kurumsal Bilgiler ve İletişim",
    en: "Corporate & Legal Contact",
  },
  "intellectual-property": {
    tr: "Fikri Mülkiyet ve Telif Hakları Politikası",
    en: "Intellectual Property & Copyright Policy",
  },
  consent: {
    tr: "Açık Rıza ve İletişim İzinleri Politikası",
    en: "Explicit Consent & Communications Notice",
  },
  "dispute-resolution": {
    tr: "Uyuşmazlık Çözümü ve Doğrudan Arabuluculuk",
    en: "Dispute Resolution & Direct Mediation",
  },
};

const PLAIN_SUMMARIES: Record<
  string,
  { tr: { title: string; bullets: string[] }; en: { title: string; bullets: string[] } }
> = {
  terms: {
    tr: {
      title: "Özetle: Kullanım Koşulları Sizin İçin Ne Anlama Geliyor?",
      bullets: [
        "Kar Amacı Gütmeyen Ücretsiz Ağ: Platform herkese ücretsizdir; komisyon, üyelik veya işlem ücreti kesilmez.",
        "Sıfır Ticari Risk & Taraf Olmama: Platform taraflar arasındaki ticarete maddi olarak dahil değildir; hiçbir ticari risk almaz.",
        "Dava Muafiyeti & Doğrudan Muhataplık: Mağduriyet veya anlaşmazlıklarda platforma dava açılamaz; taraflar münhasıran birbirleriyle muhataptır.",
      ],
    },
    en: {
      title: "In Brief: What Terms of Service Mean for You",
      bullets: [
        "Non-Profit & 100% Free Network: No commissions, platform cuts, connects fees, or subscription charges.",
        "Zero Commercial Risk: The platform is not party to contracts, escrow, or payments and assumes zero financial risk.",
        "Lawsuit Immunity & Counterparty Recourse: In disputes or defaults, no lawsuit may be brought against the platform; counterparties deal solely with each other.",
      ],
    },
  },
  privacy: {
    tr: {
      title: "Özetle: Verileriniz Nasıl Korunuyor?",
      bullets: [
        "Verileriniz Asla Satılmaz: Kişisel bilgileriniz üçüncü taraf reklamcılara veya veri toplayıcılara asla aktarılmaz.",
        "Şifreli Teklifler: İlettiğiniz proje teklifleri AES-256 ile korunur ve rakipleriniz tarafından asla görülemez.",
        "Kademeli İletişim Açıklığı: Telefon ve e-posta bilgileriniz yalnızca karşılıklı eşleşme gerçekleştiğinde iki taraf arasında açılır.",
      ],
    },
    en: {
      title: "In Brief: How Your Privacy Is Guaranteed",
      bullets: [
        "Zero Data Selling: Your personal data is never monetized or distributed to third-party ad networks.",
        "Encrypted Proposals: Your offers are protected by AES-256 encryption and cannot be viewed by competitors.",
        "Bilateral Reveal: Direct phone and email channels unlock strictly between counterparties upon mutual match.",
      ],
    },
  },
  "matching-disclaimer": {
    tr: {
      title: "Özetle: Eşleştirme ve Sorumluluk Modeli",
      bullets: [
        "Ücretsiz Buluşma Noktası: Platform yalnızca yetenek ile projeyi bir araya getiren tarafsız bir aracı ortamdır.",
        "Ödeme ve Emanet (Escrow) Yoktur: Platform para toplamaz, tutmaz veya aracı ödeme sistemi işletmez.",
        "Özel Sözleşme Taslağı & Hukuki Koruma: Tarafların kendilerini koruması için sistem özel sözleşme taslağı sunar; hukuki sorumluluk taraflara aittir.",
      ],
    },
    en: {
      title: "In Brief: Operational & Matching Disclaimer",
      bullets: [
        "Free Matching Venue: A neutral, non-profit discovery and direct introduction network.",
        "Zero Escrow & Funds: We never touch, process, or hold project funds in escrow accounts.",
        "Custom Contract Draft: We provide contract drafts for mutual protection; legal execution is solely up to counterparties.",
      ],
    },
  },
  "acceptable-use": {
    tr: {
      title: "Özetle: Kabul Edilebilir Kullanım İlkeleri",
      bullets: [
        "Dürüst ve Profesyonel İletişim: Sahte profil, taciz veya spam teklif iletimi kesinlikle yasaktır.",
        "Teklif Bütünlüğü: Açık iletişim bilgisi yaymak veya fiyat manipülasyonu yapmak yasaktır.",
        "Hızlı Moderasyon: Kötüye kullanım bildirimleri 24 saat içerisinde denetlenir ve ihlaller kalıcı olarak engellenir.",
      ],
    },
    en: {
      title: "In Brief: Community & Usage Standards",
      bullets: [
        "Professional Conduct: Fake identities, harassment, and spam proposals are strictly prohibited.",
        "Proposal Integrity: Publicly leaking contact details or attempting price manipulation is banned.",
        "Rapid Moderation: Abuse reports are audited promptly; violations result in permanent suspension.",
      ],
    },
  },
  cookies: {
    tr: {
      title: "Özetle: Çerez Politikası",
      bullets: [
        "Yalnızca Zorunlu Çerezler: Oturumunuzu güvende tutmak ve tercihlerinizi (tema, dil) saklamak için kullanılır.",
        "İzleme Çerezi Yok: Harici üçüncü taraf reklam ve profil çıkarma izleyicileri kullanılmaz.",
        "Şeffaf Kontrol: Tarayıcı ayarlarınızdan çerezleri dilediğiniz an silebilirsiniz.",
      ],
    },
    en: {
      title: "In Brief: Cookie Policy",
      bullets: [
        "Strictly Essential Cookies: Used only to authenticate your session and preserve preferences (theme, language).",
        "Zero Third-Party Trackers: No third-party behavioral ad trackers or profiling cookies are deployed.",
        "User Control: You can clear or manage cookies anytime through your browser settings.",
      ],
    },
  },
  contact: {
    tr: {
      title: "Özetle: Kurumsal Bilgiler ve Destek",
      bullets: [
        "Yasal Şirket Bilgileri: Operis Teknoloji Anonim Şirketi tüzel kişiliği altında faaliyet gösterilir.",
        "Resmi Destek Kanalları: Hukuki talepleriniz ve güvenlik bildirimleriniz için resmi kanallarımız 7/24 açıktır.",
        "Veri Sorumlusu İletişimi: KVKK / GDPR başvurularınız yasal süreler içerisinde yanıtlanır.",
      ],
    },
    en: {
      title: "In Brief: Corporate Identity & Support",
      bullets: [
        "Registered Entity: Operated under Operis Teknoloji Anonim Şirketi.",
        "Official Channels: Security disclosures and legal inquiries are monitored 24/7.",
        "Data Protection Officer: KVKK & GDPR rights requests are resolved within statutory timeframes.",
      ],
    },
  },
  "intellectual-property": {
    tr: {
      title: "Özetle: Fikri Mülkiyet ve Eser Hakları",
      bullets: [
        "Eser Sahiplerine Saygı: Platform telif haklarına ve açık kaynak lisanslarına tam riayet eder.",
        "Uyar-Kaldır Mekanizması: FSEK ve DMCA kapsamında usulüne uygun ihlal bildirimleri 48 saatte işleme alınır.",
        "Bağımsız Kod Mülkiyeti: Geliştirilen yazılımların hak devri iki tarafın kendi özel sözleşmesine tabidir.",
      ],
    },
    en: {
      title: "In Brief: Intellectual Property & Copyrights",
      bullets: [
        "Respect for Authorship: Full compliance with author copyrights and open source license terms.",
        "Notice & Takedown: Valid FSEK and DMCA infringement notices are acted upon within 48 hours.",
        "Code Ownership: IP rights transfer remains strictly governed by the parties' bilateral contract.",
      ],
    },
  },
  consent: {
    tr: {
      title: "Özetle: Açık Rıza ve İletişim İzinleri",
      bullets: [
        "Ayrılmış Açık Rıza: Zorunlu aydınlatma metninden bağımsız, özgür iradeye dayalı onay mekanizması.",
        "Eşleşme Halinde İletişim: Telefon ve e-posta yalnızca iki taraf karşılıklı anlaştığında karşı tarafa açılır.",
        "Dilediğiniz An İptal: Verdiğiniz açık rızayı ayarlar menüsünden tek tıkla geri alabilirsiniz.",
      ],
    },
    en: {
      title: "In Brief: Explicit Consent & Communications",
      bullets: [
        "Independent Consent: Clearly separated from mandatory notices, based on uncoerced choice.",
        "Bilateral Reveal: Contact info is unmasked exclusively between counterparties upon mutual match.",
        "Revocable Anytime: You can withdraw discretionary consent anytime via account settings.",
      ],
    },
  },
  "dispute-resolution": {
    tr: {
      title: "Özetle: Uyuşmazlık Çözümü ve Arabuluculuk",
      bullets: [
        "Platform Hakem Değildir: Operis para tutmaz ve ticari/teknik uyuşmazlıklarda taraf veya hakem değildir.",
        "Kademeli Çözüm Yolu: Önce 14 günlük doğrudan müzakere, ardından 6325 sayılı kanunla arabuluculuk önerilir.",
        "Kesin Dava Muafiyeti: Taraflar arasındaki mağduriyetlerde platforma dava açılamaz; muhatap doğrudan diğer taraftır.",
      ],
    },
    en: {
      title: "In Brief: Dispute Resolution & Direct Mediation",
      bullets: [
        "Platform is Not an Arbitrator: Operis holds no escrow and does not adjudicate quality or payments.",
        "Graduated Workflow: 14 days direct negotiation, followed by independent professional mediation.",
        "Platform Lawsuit Immunity: No lawsuit may be brought against Operis for counterparty defaults.",
      ],
    },
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const isTr = locale === "tr";
  const internalKey = TR_TO_INTERNAL_LEGAL_SLUG[slug] ?? slug;

  const titleObj = TITLES[internalKey] ?? { tr: "Yasal Belge", en: "Legal Document" };
  const docTitle = isTr ? titleObj.tr : titleObj.en;

  const title = isTr ? `${docTitle} — Yasal Şeffaflık & Uyum` : `${docTitle} — Legal & Compliance`;
  const description = isTr
    ? `Operis ${docTitle} mevzuat ve uyum dokümanı.`
    : `Operis ${docTitle} legal and regulatory compliance document.`;

  return {
    title,
    description,
    alternates: {
      canonical: getLocalizedLegalPath(internalKey, locale as Locale),
      languages: {
        tr: getLocalizedLegalPath(internalKey, "tr"),
        en: getLocalizedLegalPath(internalKey, "en"),
      },
    },
    openGraph: {
      title,
      description,
      url: getLocalizedLegalPath(internalKey, locale as Locale),
      siteName: "Operis",
      locale: isTr ? "tr_TR" : "en_US",
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function LegalDocumentPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  if (!VALID_LEGAL_SLUGS.includes(slug)) {
    notFound();
  }

  setRequestLocale(locale);
  const isTr = locale === "tr";
  const internalKey = TR_TO_INTERNAL_LEGAL_SLUG[slug] ?? slug;

  let doc;
  try {
    doc = LegalService.getDocument(internalKey, locale as Locale, "v1");
  } catch {
    notFound();
  }

  const titleObj = TITLES[internalKey] ?? { tr: "Yasal Belge", en: "Legal Document" };
  const docTitle = isTr ? titleObj.tr : titleObj.en;

  const legalDocUrl = `https://operis.pro${getLocalizedLegalPath(internalKey, locale as Locale)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: docTitle,
        description: isTr
          ? `Operis ${docTitle} mevzuata uyum dokümanı.`
          : `Operis ${docTitle} compliance document.`,
        url: legalDocUrl,
        inLanguage: locale,
        publisher: {
          "@type": "Organization",
          name: "Operis Teknoloji Anonim Şirketi",
          url: "https://operis.pro",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: isTr ? "Ana Sayfa" : "Home",
            item: `https://operis.pro/${locale}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: isTr ? "Yasal & Şeffaflık" : "Legal & Compliance",
            item: legalDocUrl,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: docTitle,
            item: legalDocUrl,
          },
        ],
      },
    ],
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Reading Progress Indicator */}
      <ReadingProgressBar />

      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Plain Language Executive Summary */}
      {PLAIN_SUMMARIES[internalKey] && (
        <section
          aria-label={isTr ? "Yönetici Özeti" : "Executive Summary"}
          className="rounded-3xl border border-blue-500/25 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 p-6 sm:p-8 space-y-4 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-400" aria-hidden="true" />
            <h2 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]">
              {isTr ? PLAIN_SUMMARIES[internalKey].tr.title : PLAIN_SUMMARIES[internalKey].en.title}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(isTr
              ? PLAIN_SUMMARIES[internalKey].tr.bullets
              : PLAIN_SUMMARIES[internalKey].en.bullets
            ).map((bullet, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-secondary)] leading-relaxed shadow-sm"
              >
                <CheckCircle2
                  className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>{bullet}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* High-End Corporate Legal Document Reader */}
      <LegalDocumentViewer
        currentKey={internalKey}
        locale={locale}
        version={doc.version}
        hash={doc.hash}
        rawMarkdown={doc.content}
        docTitle={docTitle}
      />
    </main>
  );
}
