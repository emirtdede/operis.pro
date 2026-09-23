"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  X,
  ShieldCheck,
  FileText,
  Lock,
  Scale,
  Cookie,
  Copyright,
  CheckCircle2,
  AlertTriangle,
  Building,
  UserCheck,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Filter,
} from "lucide-react";
import { getLocalizedLegalPath, getLocalizedRoute } from "@/src/lib/i18n/routes";

interface LegalDocMeta {
  slug: string;
  internalKey: string;
  category: "core" | "privacy" | "dispute";
  iconName: string;
  version: string;
  title: string;
  description: string;
  summaryTitle: string;
  bullets: string[];
  keywords: string[];
}

interface LegalCenterClientProps {
  locale: string;
}

export function LegalCenterClient({ locale }: LegalCenterClientProps) {
  const isTr = locale === "tr";
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(e.target as Node)
      ) {
        setFilterDropdownOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setFilterDropdownOpen(false);
      }
    }

    if (filterDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [filterDropdownOpen]);

  const categories = useMemo(
    () => [
      { id: "all", label: isTr ? "Tüm Belgeler" : "All Documents", count: 9 },
      { id: "core", label: isTr ? "Temel Sözleşmeler" : "Core Agreements", count: 3 },
      { id: "privacy", label: isTr ? "Gizlilik & KVKK" : "Privacy & Data", count: 3 },
      { id: "dispute", label: isTr ? "Fikri Mülkiyet & Uyuşmazlık" : "IP & Disputes", count: 3 },
    ],
    [isTr]
  );

  const documents: LegalDocMeta[] = useMemo(
    () => [
      // Category 1: Core
      {
        slug: isTr ? "kullanim-kosullari" : "terms",
        internalKey: "terms",
        category: "core",
        iconName: "FileText",
        version: "v1.0",
        title: isTr
          ? "Kullanım Koşulları ve Hizmet Sözleşmesi"
          : "Terms of Service & User Agreement",
        description: isTr
          ? "Platformun kar amacı gütmeyen, ücretsiz modeli, tarafların bağımsızlığı ve kesin dava muafiyeti esasları."
          : "Non-profit zero-commission principles, counterparty direct relationship, and full lawsuit immunity.",
        summaryTitle: isTr ? "Önemli Güvenceler" : "Key Guarantees",
        bullets: isTr
          ? [
              "Kar amacı gütmeyen %0 komisyonsuz bağımsız açık teknoloji ağı.",
              "Platform hiçbir ticari risk almaz ve sözleşmelere taraf olmaz.",
              "Mağduriyet durumlarında platforma karşı dava açılamazlık taahhüdü.",
            ]
          : [
              "Non-profit 100% free network with zero commission cuts.",
              "Zero commercial risk: Operis is never a party to engagements.",
              "Lawsuit immunity: Counterparties pursue claims solely against each other.",
            ],
        keywords: [
          "kullanım",
          "koşulları",
          "terms",
          "sözleşme",
          "komisyon",
          "muafiyet",
          "dava",
          "hizmet",
        ],
      },
      {
        slug: isTr ? "eslestirme-ve-sorumluluk-reddi" : "matching-disclaimer",
        internalKey: "matching-disclaimer",
        category: "core",
        iconName: "Scale",
        version: "v1.0",
        title: isTr ? "Eşleştirme ve Sorumluluk Reddi Beyanı" : "Matching & Operational Disclaimer",
        description: isTr
          ? "Platformun emanet (escrow) ve para tutmayan statüsü ile iki tarafa sunulan sözleşme taslağının sınırları."
          : "Exclusion of funds custody/escrow and operating boundaries of bilateral contract drafts.",
        summaryTitle: isTr ? "Önemli Güvenceler" : "Key Guarantees",
        bullets: isTr
          ? [
              "Platform para tutmaz, cüzdan veya emanet hesabı (escrow) işletmez.",
              "Ödemeler doğrudan taraflar arasında banka/fatura ile gerçekleşir.",
              "Sunulan PDF sözleşme taslağı hukuki danışmanlık mahiyetinde değildir.",
            ]
          : [
              "Zero held funds, escrow pools, or payment custody.",
              "Direct payments strictly between counterparties via IBAN/invoice.",
              "PDF contract draft provided purely as an operational resource.",
            ],
        keywords: ["sorumluluk", "reddi", "disclaimer", "emanet", "escrow", "ödeme", "eşleştirme"],
      },
      {
        slug: isTr ? "kabul-edilebilir-kullanim" : "acceptable-use",
        internalKey: "acceptable-use",
        category: "core",
        iconName: "ShieldCheck",
        version: "v1.0",
        title: isTr ? "Kabul Edilebilir Kullanım Politikası" : "Acceptable Use Policy",
        description: isTr
          ? "Platformda izin verilen ve kesinlikle yasaklanan eylemler, kötüye kullanım ve siber güvenlik kuralları."
          : "Prohibited behaviors, malware, illicit solicitations, and community safety enforcement.",
        summaryTitle: isTr ? "Önemli Güvenceler" : "Key Guarantees",
        bullets: isTr
          ? [
              "Zararlı yazılım, hack aracı ve siber saldırı amaçlı ilanlar derhal silinir.",
              "Küfür, hakaret ve taciz içerikli teklifler otomatik denetim motorunca engellenir.",
              "Kötü niyetli kullanıcıların hesapları dondurulur ve IP adresleri bloke edilir.",
            ]
          : [
              "Zero tolerance for malware, exploit kits, or illicit software briefs.",
              "Offensive language and harassment blocked by automatic moderation.",
              "Malicious actors subject to instant account freezing and IP blocking.",
            ],
        keywords: [
          "kabul",
          "edilebilir",
          "acceptable",
          "use",
          "güvenlik",
          "yasak",
          "siber",
          "küfür",
        ],
      },

      // Category 2: Privacy & Data
      {
        slug: isTr ? "gizlilik-ve-kvkk" : "privacy",
        internalKey: "privacy",
        category: "privacy",
        iconName: "Lock",
        version: "v1.0",
        title: isTr ? "Gizlilik ve KVKK Aydınlatma Metni" : "Privacy Notice & Data Protection",
        description: isTr
          ? "6698 sayılı KVKK ve GDPR kapsamında veri sorumlusu sıfatıyla işlenen veriler ve kullanıcı hakları."
          : "Data protection standards under KVKK and GDPR with zero third-party data monetization.",
        summaryTitle: isTr ? "Önemli Güvenceler" : "Key Guarantees",
        bullets: isTr
          ? [
              "Verileriniz asla reklamcılara veya üçüncü taraflara satılmaz.",
              "Teklifleriniz AES-256 şifreleme ile rakiplerinize karşı korunur.",
              "KVKK m. 11 kapsamındaki haklarınızı 30 gün içinde kullanabilirsiniz.",
            ]
          : [
              "Personal data is strictly never sold or rented to advertisers.",
              "All proposals protected with military-grade AES-256 encryption.",
              "Full exercise of GDPR and KVKK rights guaranteed within statutory limits.",
            ],
        keywords: ["gizlilik", "kvkk", "privacy", "veri", "koruma", "şifreleme", "gdpr"],
      },
      {
        slug: isTr ? "acik-riza-metni" : "consent",
        internalKey: "consent",
        category: "privacy",
        iconName: "UserCheck",
        version: "v1.0",
        title: isTr
          ? "Açık Rıza ve İletişim İzinleri Politikası"
          : "Explicit Consent & Communications Notice",
        description: isTr
          ? "Zorunlu aydınlatmadan ayrılmış, yalnızca serbest iradeye dayalı iletişim ve veri açma onayları."
          : "Explicit opt-in processing consent independent from baseline terms, revocable anytime.",
        summaryTitle: isTr ? "Önemli Güvenceler" : "Key Guarantees",
        bullets: isTr
          ? [
              "Aydınlatma metninden kesin olarak ayrılmış özgür iradeye dayalı rıza.",
              "İletişim bilgileri yalnızca iki taraf karşılıklı anlaştığında açılır.",
              "Verilen rızalar Kullanıcı Ayarları üzerinden dilediğiniz an tek tıkla iptal edilebilir.",
            ]
          : [
              "Independent consent model separated from mandatory terms of service.",
              "Contact info revealed strictly to matching counterparties upon mutual agreement.",
              "Consent can be revoked at any time with one click in account settings.",
            ],
        keywords: ["açık rıza", "consent", "rıza", "iletişim", "izin", "opt-in"],
      },
      {
        slug: isTr ? "cerez-politikasi" : "cookies",
        internalKey: "cookies",
        category: "privacy",
        iconName: "Cookie",
        version: "v1.0",
        title: isTr ? "Çerez ve İzleme Politikası" : "Cookie & Tracking Policy",
        description: isTr
          ? "Sistemde yalnızca oturum ve güvenlik için kullanılan birinci taraf zorunlu çerezler."
          : "Strictly essential cookies for session stability, language and dark mode preferences.",
        summaryTitle: isTr ? "Önemli Güvenceler" : "Key Guarantees",
        bullets: isTr
          ? [
              "Yalnızca oturum güvenliği ve dil/tema tercihleriniz için gerekli çerezler kullanılır.",
              "Üçüncü taraf reklam, takip veya davranışsal profil çıkarma çerezi barındırılmaz.",
              "Tarayıcı ayarlarınız üzerinden çerezleri dilediğiniz an silebilirsiniz.",
            ]
          : [
              "Exclusively essential first-party cookies for auth and theme/locale state.",
              "Zero third-party tracking scripts or surveillance advertising pixels.",
              "Full user control to delete or block cookies via browser settings.",
            ],
        keywords: ["çerez", "cookie", "izleme", "session", "tema", "tercih"],
      },

      // Category 3: IP & Disputes
      {
        slug: isTr ? "fikri-mulkiyet-ve-telif" : "intellectual-property",
        internalKey: "intellectual-property",
        category: "dispute",
        iconName: "Copyright",
        version: "v1.0",
        title: isTr
          ? "Fikri Mülkiyet ve Telif Hakları Politikası"
          : "Intellectual Property & Copyright Policy",
        description: isTr
          ? "5846 sayılı FSEK ve DMCA Uyar-Kaldır prosedürü, kod mülkiyeti ve marka koruma kuralları."
          : "FSEK & DMCA Notice-and-Takedown workflows, software ownership, and trademark protection.",
        summaryTitle: isTr ? "Önemli Güvenceler" : "Key Guarantees",
        bullets: isTr
          ? [
              "Operis tescilli logosu, tipografisi ve sembolü koruma altındadır.",
              "Usulüne uygun yapılan telif hakkı ihlal bildirimleri 48 saatte incelenip kaldırılır.",
              "Üretilen yazılımların fikri mülkiyet devri iki taraf arasındaki özel sözleşmeye tabidir.",
            ]
          : [
              "Operis brand marks and calibrated geometry are legally protected.",
              "Formal notice-and-takedown claims resolved within 48 hours.",
              "Software IP assignment governed strictly by bilateral agreements.",
            ],
        keywords: [
          "fikri mülkiyet",
          "telif",
          "copyright",
          "fsek",
          "dmca",
          "uyar kaldır",
          "kod mülkiyeti",
        ],
      },
      {
        slug: isTr ? "uyusmazlik-cozumu" : "dispute-resolution",
        internalKey: "dispute-resolution",
        category: "dispute",
        iconName: "AlertTriangle",
        version: "v1.0",
        title: isTr
          ? "Uyuşmazlık Çözümü ve Doğrudan Arabuluculuk"
          : "Dispute Resolution & Direct Mediation",
        description: isTr
          ? "Platformun hakem olmadığı, doğrudan müzakere ve 6325 sayılı kanunla arabuluculuk süreci."
          : "Graduated conflict escalation, 14-day negotiation period, and independent mediation.",
        summaryTitle: isTr ? "Önemli Güvenceler" : "Key Guarantees",
        bullets: isTr
          ? [
              "Platform uyuşmazlıklarda mahkeme veya ticari hakem değildir; taraflar doğrudan muhataptır.",
              "İhtilaflarda öncelikle 14 günlük doğrudan müzakere, ardından yasal arabuluculuk önerilir.",
              "Platforma karşı tarafların ifa eksikliğinden dolayı dava açılamaz.",
            ]
          : [
              "Platform is not an arbitral tribunal; counterparties maintain direct recourse.",
              "Structured escalation: 14-day negotiation, then certified independent mediation.",
              "Zero platform liability for contractor or client breaches.",
            ],
        keywords: [
          "uyuşmazlık",
          "arabuluculuk",
          "dispute",
          "tahkim",
          "mahkeme",
          "dava",
          "müzakere",
        ],
      },
      {
        slug: isTr ? "iletisim" : "contact",
        internalKey: "contact",
        category: "dispute",
        iconName: "Building",
        version: "v1.0",
        title: isTr ? "Kurumsal Künye ve Yasal İletişim" : "Corporate Identity & Legal Contact",
        description: isTr
          ? "Operis tüzel kişilik bilgileri, resmi şirket künyesi, KEP adresi ve resmi tebligat kanalları."
          : "Official corporate records, legal notices email, statutory disclosures, and contact info.",
        summaryTitle: isTr ? "Önemli Güvenceler" : "Key Guarantees",
        bullets: isTr
          ? [
              "Vellium resmi künye ve sicil bilgileri şeffaftır (Operis bir Vellium ürünüdür).",
              "Yasal tebligatlar ve resmi mahkeme müzekkereleri öncelikli kanaldan takip edilir.",
              "KVKK ve veri güvenliği bildirimleri için özel iletişim masası mevcuttur.",
            ]
          : [
              "Transparent corporate registration under Vellium (Operis is a product of Vellium).",
              "Expedited triage for official court subpoenas and legal notices.",
              "Dedicated data protection desk for GDPR and KVKK compliance.",
            ],
        keywords: ["künye", "iletişim", "contact", "şirket", "kep", "adres", "sicil"],
      },
    ],
    [isTr]
  );

  const filteredDocs = useMemo(() => {
    let list = documents;

    // Filter by Category
    if (activeCategory !== "all") {
      list = list.filter((doc) => doc.category === activeCategory);
    }

    // Filter by Search Query with Accent-Aware Normalization
    if (searchQuery.trim().length > 0) {
      const normalize = (text: string) =>
        text
          .replace(/İ/g, "i")
          .replace(/I/g, "ı")
          .toLowerCase()
          .replace(/ğ/g, "g")
          .replace(/ü/g, "u")
          .replace(/ş/g, "s")
          .replace(/ö/g, "o")
          .replace(/ç/g, "c");

      const q = normalize(searchQuery.trim());
      list = list.filter((doc) => {
        const pool = normalize(
          `${doc.title} ${doc.summaryTitle} ${doc.description} ${doc.bullets.join(" ")} ${doc.keywords.join(" ")}`
        );
        return pool.includes(q);
      });
    }

    return list;
  }, [documents, activeCategory, searchQuery]);

  const renderIcon = (name: string) => {
    switch (name) {
      case "FileText":
        return <FileText className="h-5 w-5 text-indigo-400" aria-hidden="true" />;
      case "Scale":
        return <Scale className="h-5 w-5 text-blue-400" aria-hidden="true" />;
      case "ShieldCheck":
        return <ShieldCheck className="h-5 w-5 text-emerald-400" aria-hidden="true" />;
      case "Lock":
        return <Lock className="h-5 w-5 text-purple-400" aria-hidden="true" />;
      case "UserCheck":
        return <UserCheck className="h-5 w-5 text-cyan-400" aria-hidden="true" />;
      case "Cookie":
        return <Cookie className="h-5 w-5 text-amber-400" aria-hidden="true" />;
      case "Copyright":
        return <Copyright className="h-5 w-5 text-rose-400" aria-hidden="true" />;
      case "AlertTriangle":
        return <AlertTriangle className="h-5 w-5 text-orange-400" aria-hidden="true" />;
      case "Building":
        return <Building className="h-5 w-5 text-slate-400" aria-hidden="true" />;
      default:
        return <FileText className="h-5 w-5 text-blue-400" aria-hidden="true" />;
    }
  };

  return (
    <div className="space-y-12">
      {/* Search & Filter Header Control Deck */}
      <section
        aria-label={isTr ? "Yasal Belge Arama ve Filtreleme" : "Legal Document Search"}
        className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 p-5 sm:p-6 shadow-xl relative backdrop-blur-xl z-20"
      >
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Interactive Search Bar */}
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-tertiary)] pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isTr
                    ? "Yasal konu, madde, komisyon, telif veya anahtar kelime arayın..."
                    : "Search legal topics, copyright, zero-commission, escrow, privacy..."
                }
                className="w-full pl-12 pr-10 py-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                aria-label={isTr ? "Yasal metinlerde arama yapın" : "Search legal documents"}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-base)] transition-colors"
                  title={isTr ? "Aramayı Temizle" : "Clear search"}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Single Unified Category Filter Dropdown */}
            <div className="relative shrink-0" ref={filterDropdownRef}>
              <button
                type="button"
                onClick={() => setFilterDropdownOpen((prev) => !prev)}
                aria-expanded={filterDropdownOpen}
                aria-haspopup="listbox"
                className={`w-full sm:w-auto h-[46px] px-4 rounded-2xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-between sm:justify-start gap-2.5 select-none shadow-sm ${
                  activeCategory !== "all"
                    ? "bg-blue-600 text-white border-blue-500 shadow-blue-500/25"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-base)]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Filter
                    className={`h-4 w-4 ${activeCategory !== "all" ? "text-white" : "text-blue-500"}`}
                    aria-hidden="true"
                  />
                  <span className="whitespace-nowrap">
                    {categories.find((c) => c.id === activeCategory)?.label || categories[0]?.label || ""}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                      activeCategory !== "all"
                        ? "bg-white/20 text-white"
                        : "bg-[var(--bg-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]"
                    }`}
                  >
                    {activeCategory === "all"
                      ? documents.length
                      : documents.filter((d) => d.category === activeCategory).length}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      filterDropdownOpen ? "rotate-180" : ""
                    } ${activeCategory !== "all" ? "text-white/80" : "text-[var(--color-text-tertiary)]"}`}
                    aria-hidden="true"
                  />
                </div>
              </button>

              {/* Dropdown Options */}
              {filterDropdownOpen && (
                <div
                  role="listbox"
                  className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-72 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2 shadow-2xl z-50 animate-in fade-in-0 zoom-in-95 duration-150"
                >
                  <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] border-b border-[var(--border-subtle)] mb-1 flex items-center justify-between">
                    <span>{isTr ? "Kategori Filtresi" : "Category Filter"}</span>
                    {activeCategory !== "all" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveCategory("all");
                          setFilterDropdownOpen(false);
                        }}
                        className="text-[10px] text-blue-500 hover:underline font-semibold cursor-pointer"
                      >
                        {isTr ? "Sıfırla" : "Reset"}
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {categories.map((cat) => {
                      const isSelected = activeCategory === cat.id;
                      const count =
                        cat.id === "all"
                          ? documents.length
                          : documents.filter((d) => d.category === cat.id).length;

                      return (
                        <button
                          key={cat.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            setActiveCategory(cat.id);
                            setFilterDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                            isSelected
                              ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20"
                              : "text-[var(--color-text-primary)] hover:bg-[var(--bg-elevated)]"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`h-2 w-2 rounded-full ${
                                isSelected ? "bg-white" : "bg-transparent border border-[var(--border-subtle)]"
                              }`}
                            />
                            <span>{cat.label}</span>
                          </div>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : "bg-[var(--bg-elevated)] text-[var(--color-text-secondary)] border border-[var(--border-subtle)]"
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
        </div>
      </section>

      {/* Grid of 9 Legal Document Cards */}
      {filteredDocs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--color-border-subtle)] p-12 text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Search className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
            {isTr
              ? "Aramanızla Eşleşen Yasal Belge Bulunamadı"
              : "No Legal Documents Match Your Search"}
          </h3>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-md mx-auto">
            {isTr
              ? `"${searchQuery}" terimiyle eşleşen bir yasal belge bulunamadı. Lütfen arama terimini sadeleştirin veya filtreleri temizleyin.`
              : `No legal policy matched "${searchQuery}". Please refine your keyword or reset filters.`}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setActiveCategory("all");
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
          >
            {isTr ? "Filtreleri Sıfırla" : "Reset Filters"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => {
            const docUrl = getLocalizedLegalPath(doc.internalKey, locale);
            return (
              <div
                key={doc.internalKey}
                className="group flex flex-col justify-between rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-6 sm:p-7 shadow-lg hover:shadow-2xl hover:border-blue-500/40 transition-all duration-200 relative overflow-hidden"
              >
                {/* Subtle Hover Ambient Glow */}
                <div
                  className="pointer-events-none absolute -right-16 -top-16 w-36 h-36 rounded-full bg-blue-500/5 group-hover:bg-blue-500/10 blur-2xl transition-all duration-300"
                  aria-hidden="true"
                />

                <div className="space-y-4 relative z-10">
                  {/* Top Bar: Icon + Version Badge */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] flex items-center justify-center shadow-sm">
                      {renderIcon(doc.iconName)}
                    </div>
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)]">
                      {doc.version}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-[var(--color-text-primary)] group-hover:text-blue-400 transition-colors">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-3">
                      {doc.description}
                    </p>
                  </div>

                  {/* Bullet Highlights Box */}
                  <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/70 p-3.5 space-y-2">
                    <div className="text-[11px] font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
                      <span>{doc.summaryTitle}</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-[var(--color-text-secondary)]">
                      {doc.bullets.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2
                            className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span className="leading-snug">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Bottom Action: Read Full Policy */}
                <div className="pt-6 border-t border-[var(--color-border-subtle)] mt-6 relative z-10">
                  <Link
                    href={docUrl}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-xs font-semibold text-[var(--color-text-primary)] group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all shadow-sm"
                  >
                    <span>{isTr ? "Belgeyi Tam Oku" : "Read Full Policy"}</span>
                    <ArrowRight
                      className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform"
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Trust Highlights Architecture Pillars */}
      <section
        aria-label={isTr ? "Operis Hukuki ve Güven Mimarisi" : "Operis Trust & Legal Architecture"}
        className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-8 sm:p-10 shadow-2xl relative overflow-hidden"
      >
        <div className="space-y-3 mb-8 text-center sm:text-left">
          <span className="text-xs font-mono uppercase tracking-wider text-blue-400 font-bold">
            {isTr ? "Hukuki Zırh ve Temel Prensipler" : "Legal Framework & Core Principles"}
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-text-primary)]">
            {isTr
              ? "Neden Operis ile Güvendesiniz?"
              : "Why Operis Guarantees Complete Peace of Mind"}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
            {isTr
              ? "Geleneksel pazaryerlerinin aksine Operis, kar amacı gütmeyen açık bir teknoloji ağıdır. Paranıza dokunmaz, komisyon kesmez ve tarafların özgürlüğünü korur."
              : "Unlike legacy commission marketplaces, Operis is a non-profit tech network. We never hold your funds, take cuts, or encumber your contracts."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] p-5 space-y-2">
            <div className="text-base font-bold text-blue-400">%0 Komisyon & Ücretsiz</div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {isTr
                ? "Platform üyeliği, ilan açma ve teklif verme tamamen ücretsizdir; gizli ücret veya kesinti yoktur."
                : "Free membership, unlimited listing and proposing with zero platform take rates."}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] p-5 space-y-2">
            <div className="text-base font-bold text-indigo-400">Emanetsiz Doğrudan İlişki</div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {isTr
                ? "Paranız hiçbir havuzda bloke edilmez. Ödemeler münhasıran işveren ile yazılımcı arasında doğrudan yapılır."
                : "No held funds or escrow pools. Direct bank transfers strictly between counterparties."}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] p-5 space-y-2">
            <div className="text-base font-bold text-purple-400">AES-256 Şifreli Teklifler</div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {isTr
                ? "Teklifleriniz açık ihale usulüyle rakiplere açılmaz; askeri düzeyde şifrelenerek korunur."
                : "Proposals remain fully confidential and encrypted against competing visibility."}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] p-5 space-y-2">
            <div className="text-base font-bold text-emerald-400">Özel PDF Sözleşme Taslağı</div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {isTr
                ? "Eşleşen tarafların kendilerini hukuken koruyabilmeleri için tek tıkla özel sözleşme taslağı üretilir."
                : "One-click bilateral formal contract drafting protecting both software engineer and client."}
            </p>
          </div>
        </div>
      </section>

      {/* Designated Copyright & Notice-and-Takedown Help Desk */}
      <section
        aria-label={isTr ? "Yasal Destek ve Telif Masası" : "Legal Notice and Help Desk"}
        className="rounded-3xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div className="space-y-1.5 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-blue-400 font-bold text-sm">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            <span>
              {isTr ? "Hukuki Bildirim & Uyar-Kaldır Masası" : "Notice & Takedown Help Desk"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
            {isTr
              ? "Telif hakkı ihlali, siber güvenlik zafiyeti veya mevzuata aykırı içerik tespit ettiyseniz resmi kanallarımızdan bize ulaşın."
              : "Report copyright infringements, security vulnerabilities, or policy violations to our legal compliance desk."}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={getLocalizedRoute("report", locale)}
            className="px-4 py-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-xs font-semibold text-[var(--color-text-primary)] hover:border-blue-500/40 transition-all shadow-sm"
          >
            {isTr ? "İhlal / Şikayet Bildir" : "Report Abuse"}
          </Link>
          <a
            href="mailto:legal@vellium.dev"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5"
          >
            <span>legal@vellium.dev</span>
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </div>
      </section>
    </div>
  );
}
