"use client";

import { useState, useEffect, useRef, useMemo, useDeferredValue } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Plus,
  BookmarkCheck,
  Search,
  X,
  ChevronDown,
  Globe,
  Smartphone,
  Monitor,
  Server,
  Layout,
  Cpu,
  Database,
  Cloud,
  ShieldCheck,
  CheckCircle2,
  Palette,
  Workflow,
  HardDrive,
  Gamepad2,
  Network,
  Wrench,
  Radio,
  Blocks,
  Compass,
  Code2,
  TrendingUp,
  Video,
  PenTool,
  Briefcase,
  Scale,
  Box,
  Headphones,
  Bot,
  Sparkles,
  BarChart3,
  Layers,
  Share2,
  Feather,
  Package,
  Presentation,
  Megaphone,
  Mail,
  ShoppingBag,
  Film,
  Clapperboard,
  Mic,
  FileCode,
  FileText,
  FileSignature,
  Building,
  Home,
  CheckSquare,
  Coins,
  Calculator,
  Receipt,
  LogIn,
  Glasses,
  Camera,
  Music,
  UserCheck,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import { SpotlightCard } from "../ui/spotlight-card";
import { SEED_SECTORS } from "@/db/seeds/categories";
import { searchCategories } from "@/src/lib/search/engine";

const SECTOR_ICONS: Record<string, LucideIcon> = {
  "sector-software-it": Code2,
  "sector-ai-data": Cpu,
  "sector-design-creative": Palette,
  "sector-marketing-growth": TrendingUp,
  "sector-video-audio": Video,
  "sector-writing-translation": PenTool,
  "sector-business-finance": Briefcase,
  "sector-legal-compliance": Scale,
  "sector-engineering-3d": Box,
  "sector-operations-support": Headphones,
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  // Sektör 1: Yazılım & BT
  "web-development": Globe,
  "frontend-ui": Layout,
  "backend-api": Server,
  "mobile-development": Smartphone,
  "desktop-development": Monitor,
  "devops-cloud": Cloud,
  database: HardDrive,
  cybersecurity: ShieldCheck,
  "qa-testing": CheckCircle2,
  blockchain: Blocks,
  "embedded-iot": Radio,
  "it-systems-network": Network,
  "computer-hardware": Wrench,
  "other-technology": Code2,
  "nocode-lowcode-development": Workflow,

  // Sektör 2: AI & Veri
  "ai-ml": Cpu,
  "data-engineering": Database,
  "automation-integrations": Workflow,
  "ai-agents-workflows": Bot,
  "prompt-engineering": Sparkles,
  "business-intelligence": BarChart3,

  // Sektör 3: Tasarım
  "ui-ux-design": Palette,
  "brand-identity-logo": Feather,
  "design-systems": Layers,
  "social-media-design": Share2,
  "illustration-vector": Palette,
  "print-packaging-design": Package,
  "presentation-deck-design": Presentation,
  "photo-editing-retouching": Camera,

  // Sektör 4: Pazarlama & Büyüme
  "search-engine-optimization": TrendingUp,
  "paid-search-sem": Megaphone,
  "paid-social-meta": Share2,
  "social-media-management": Megaphone,
  "email-marketing-automation": Mail,
  "ecommerce-growth-store": ShoppingBag,

  // Sektör 5: Video & Ses
  "short-form-video": Film,
  "long-form-youtube": Video,
  "motion-graphics-2d-3d": Clapperboard,
  "voice-over-dubbing": Mic,
  "podcast-audio-editing": Mic,
  "music-production-beatmaking": Music,

  // Sektör 6: Yazı & Çeviri
  "technical-writing": FileCode,
  "copywriting-sales": FileText,
  "seo-blog-writing": PenTool,
  "translation-localization": Globe,
  "proofreading-editing": CheckSquare,

  // Sektör 7: Finans & Danışmanlık
  "technical-consulting": Compass,
  "financial-modeling": Calculator,
  "accounting-bookkeeping": Receipt,
  "tax-consulting": Coins,
  "startup-strategy-bizdev": Briefcase,
  "project-management-agile": Workflow,
  "hr-talent-recruitment": UserCheck,
  "online-tutoring-mentorship": GraduationCap,

  // Sektör 8: Hukuk & Mevzuat
  "contract-drafting-review": FileSignature,
  "kvkk-gdpr-privacy": ShieldCheck,
  "trademark-ip-patent": Scale,
  "ecommerce-consumer-law": ShoppingBag,

  // Sektör 9: Mühendislik & 3D
  "game-development": Gamepad2,
  "architectural-design-bim": Building,
  "interior-design-rendering": Home,
  "3d-product-modeling": Box,

  // Sektör 10: Operasyon & Destek
  "executive-virtual-assistant": Headphones,
  "customer-support-crm": Headphones,
  "data-entry-web-research": Search,

  // Granular Alt Kategoriler
  "fullstack-development": Code2,
  "ecommerce-development": ShoppingBag,
  "cms-nocode-development": Layout,
  "api-microservices": Server,
  "penetration-testing-security": ShieldCheck,
  "cloud-infrastructure-aws-gcp": Cloud,
  "llm-app-development": Bot,
  "computer-vision-ai": Cpu,
  "nlp-speech-voice": Mic,
  "data-scraping-extraction": HardDrive,
  "web-ui-design": Layout,
  "mobile-app-ui-ux": Smartphone,
  "icon-typography-design": PenTool,
  "character-concept-art": Palette,
  "technical-seo-audit": Search,
  "tiktok-video-ads": Film,
  "b2b-growth-linkedin": TrendingUp,
  "content-marketing-strategy": Feather,
  "video-color-grading": Clapperboard,
  "product-3d-animation": Box,
  "subtitles-transcription": FileText,
  "sound-design-sfx": Headphones,
  "software-i18n-localization": Globe,
  "academic-medical-translation": FileCode,
  "whitepaper-ebook-writing": FileText,
  "ghostwriting-thought-leadership": PenTool,
  "market-research-analysis": BarChart3,
  "pitch-deck-financials": Presentation,
  "operations-process-optimization": Workflow,
  "freelance-client-agreements": FileSignature,
  "nda-confidentiality-drafting": ShieldCheck,
  "terms-privacy-saas": FileCode,
  "unity-game-development": Gamepad2,
  "unreal-engine-development": Gamepad2,
  "mobile-casual-game-dev": Smartphone,
  "game-2d-pixel-art": Palette,
  "game-3d-assets-characters": Box,
  "game-level-mechanics-design": Compass,
  "game-audio-music": Headphones,
  "architectural-exterior-rendering": Building,
  "3d-printing-stl-modeling": Box,
  "xr-spatial-computing-vr-ar": Glasses,
  "ecommerce-store-operations": ShoppingBag,
  "lead-data-enrichment": Search,
  "transcription-audio-to-text": Mic,
};

export interface CategoryItem {
  id: string;
  slug: string;
  name: string;
  sectorKey?: string;
  description?: string | null;
  isFollowed?: boolean;
  listingCount?: number;
  key?: string;
}

export interface CategoryListInteractiveProps {
  categories: CategoryItem[];
  initialFollowedIds: string[];
  locale: string;
  hasSession?: boolean;
  initialSector?: string;
}

export function CategoryListInteractive({
  categories,
  initialFollowedIds,
  locale,
  hasSession = false,
  initialSector = "all",
}: CategoryListInteractiveProps) {
  const isTr = locale === "tr";
  const [selectedSector, setSelectedSector] = useState<string>(initialSector);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);
  const isStale = searchQuery !== deferredQuery;
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set(initialFollowedIds));
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthNotice, setShowAuthNotice] = useState(false);

  const POPULAR_SEARCH_CHIPS = useMemo(
    () =>
      isTr
        ? ["Web Geliştirme", "UI/UX Tasarım", "SEO", "Yapay Zeka", "Mobil Uygulama", "Logo & Marka"]
        : ["Web Development", "UI/UX Design", "SEO", "Artificial Intelligence", "Mobile App", "Logo & Branding"],
    [isTr]
  );

  const globalCrossSectorMatches = useMemo(() => {
    const query = deferredQuery.trim();
    if (selectedSector === "all" || !query) return [];
    return searchCategories(query, { limit: 5 });
  }, [selectedSector, deferredQuery]);

  const filteredCategories = useMemo(() => {
    const trimmed = deferredQuery.trim();
    if (!trimmed) {
      return categories.filter((c) => selectedSector === "all" || c.sectorKey === selectedSector);
    }

    const searchResults = searchCategories(trimmed, {
      sectorKey: selectedSector === "all" ? undefined : selectedSector,
      limit: 110,
    });

    if (searchResults.length > 0) {
      const categoryMap = new Map<string, CategoryItem>();
      for (const c of categories) {
        if (c.slug) categoryMap.set(c.slug.toLowerCase(), c);
        if (c.id) categoryMap.set(c.id.toLowerCase(), c);
        if (c.key) categoryMap.set(c.key.toLowerCase(), c);
        if (c.name) categoryMap.set(c.name.toLowerCase().trim(), c);
      }

      const ranked: CategoryItem[] = [];
      const seen = new Set<string>();

      for (const res of searchResults) {
        const item =
          (res.repoKey && categoryMap.get(res.repoKey.toLowerCase())) ||
          (res.slug && categoryMap.get(res.slug.toLowerCase())) ||
          (res.name && categoryMap.get(res.name.toLowerCase().trim()));

        if (item && !seen.has(item.id)) {
          if (selectedSector === "all" || item.sectorKey === selectedSector) {
            seen.add(item.id);
            ranked.push(item);
          }
        }
      }

      if (ranked.length > 0) {
        return ranked;
      }
    }

    // Fallback if no taxonomy search result
    return categories.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(trimmed.toLowerCase()) ||
        c.slug.toLowerCase().includes(trimmed.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(trimmed.toLowerCase()));
      const matchesSector = selectedSector === "all" || c.sectorKey === selectedSector;
      return matchesSearch && matchesSector;
    });
  }, [categories, deferredQuery, selectedSector]);

  const filteredListingCount = useMemo(() => {
    return filteredCategories.reduce((acc, cat) => acc + (cat.listingCount || 0), 0);
  }, [filteredCategories]);

  const loginUrl = `${isTr ? "/tr/giris" : "/en/login"}?returnUrl=${encodeURIComponent(isTr ? "/tr/kategoriler" : "/en/categories")}`;

  const handleToggle = async (categoryId: string) => {
    if (!hasSession) {
      setShowAuthNotice(true);
      return;
    }

    const isFollowed = followedIds.has(categoryId);
    const newSet = new Set(followedIds);
    if (isFollowed) {
      newSet.delete(categoryId);
    } else {
      newSet.add(categoryId);
    }
    setFollowedIds(newSet);

    try {
      const res = await fetch("/api/categories/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          action: isFollowed ? "unfollow" : "follow",
        }),
      });
      if (!res.ok) {
        setFollowedIds(followedIds);
        if (res.status === 401) {
          setShowAuthNotice(true);
        }
      }
    } catch {
      // Revert on error
      setFollowedIds(followedIds);
    }
  };

  const handleFollowAll = async () => {
    if (!hasSession) {
      setShowAuthNotice(true);
      return;
    }

    setIsLoading(true);
    const allIds = new Set(categories.map((c) => c.id));
    setFollowedIds(allIds);

    try {
      const res = await fetch("/api/categories/follow-all", { method: "POST" });
      if (!res.ok) {
        setFollowedIds(followedIds);
        if (res.status === 401) {
          setShowAuthNotice(true);
        }
      }
    } catch {
      setFollowedIds(followedIds);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollowAll = async () => {
    if (!hasSession) {
      setShowAuthNotice(true);
      return;
    }

    setIsLoading(true);
    setFollowedIds(new Set());

    try {
      const res = await fetch("/api/categories/unfollow-all", { method: "POST" });
      if (!res.ok) {
        setFollowedIds(followedIds);
        if (res.status === 401) {
          setShowAuthNotice(true);
        }
      }
    } catch {
      setFollowedIds(followedIds);
    } finally {
      setIsLoading(false);
    }
  };

  const [isSectorDropdownOpen, setIsSectorDropdownOpen] = useState(false);
  const [sectorSearchQuery, setSectorSearchQuery] = useState("");
  const sectorDropdownRef = useRef<HTMLDivElement>(null);
  const sectorInputRef = useRef<HTMLInputElement>(null);

  // Close sector dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sectorDropdownRef.current && !sectorDropdownRef.current.contains(event.target as Node)) {
        setIsSectorDropdownOpen(false);
      }
    }
    if (isSectorDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSectorDropdownOpen]);

  // Close sector dropdown on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsSectorDropdownOpen(false);
      }
    }
    if (isSectorDropdownOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSectorDropdownOpen]);

  const selectedSectorObj = useMemo(() => {
    if (selectedSector === "all") return null;
    return SEED_SECTORS.find((s) => s.key === selectedSector) || null;
  }, [selectedSector]);

  const currentSectorLabel = selectedSectorObj
    ? isTr
      ? selectedSectorObj.translations.tr.name
      : selectedSectorObj.translations.en.name
    : isTr
      ? "Tüm Sektörler"
      : "All Sectors";

  const currentSectorCount =
    selectedSector === "all"
      ? categories.length
      : categories.filter((c) => c.sectorKey === selectedSector).length;

  const currentSectorListingCount = useMemo(() => {
    return selectedSector === "all"
      ? categories.reduce((acc, c) => acc + (c.listingCount || 0), 0)
      : categories
          .filter((c) => c.sectorKey === selectedSector)
          .reduce((acc, c) => acc + (c.listingCount || 0), 0);
  }, [categories, selectedSector]);

  const ActiveSectorIcon = selectedSectorObj
    ? SECTOR_ICONS[selectedSectorObj.key] || Briefcase
    : Layers;

  const sectorOptions = useMemo(() => {
    const totalListings = categories.reduce((acc, c) => acc + (c.listingCount || 0), 0);
    const list = [
      {
        key: "all",
        name: isTr ? "Tüm Sektörler" : "All Sectors",
        count: categories.length,
        listingCount: totalListings,
        icon: Layers,
        subText: isTr
          ? `10 sektör, ${categories.length} uzmanlık • ${totalListings} aktif ilan`
          : `10 sectors, ${categories.length} specializations • ${totalListings} active listings`,
        allKeywords: "all tüm hepsi",
      },
      ...SEED_SECTORS.map((sec) => {
        const name = isTr ? sec.translations.tr.name : sec.translations.en.name;
        const subCats = categories.filter((c) => c.sectorKey === sec.key);
        const sectorListingCount = subCats.reduce((acc, c) => acc + (c.listingCount || 0), 0);
        const subText = subCats
          .slice(0, 3)
          .map((c) => c.name)
          .join(", ");
        const allKeywords =
          `${name} ${subCats.map((c) => `${c.name} ${c.slug}`).join(" ")}`.toLowerCase();

        return {
          key: sec.key,
          name,
          count: subCats.length,
          listingCount: sectorListingCount,
          icon: SECTOR_ICONS[sec.key] || Briefcase,
          subText,
          allKeywords,
        };
      }),
    ];

    const q = sectorSearchQuery.toLowerCase().trim();
    if (!q) return list;

    return list.filter((item) => item.allKeywords.includes(q));
  }, [categories, isTr, sectorSearchQuery]);

  return (
    <div className="space-y-6">
      {/* Single Unified Modern Command Bar (Seçenek A) */}
      <div
        className={`relative rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/85 backdrop-blur-xl p-2 sm:p-2.5 shadow-sm transition-all ${
          isSectorDropdownOpen ? "z-50 ring-1 ring-blue-500/25 border-blue-500/40" : "z-20"
        }`}
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Akıcı Kategori ve Beceri Arama Girdisi (Sol Entegre) */}
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isTr
                  ? "Kategori veya beceri ara (örn. Frontend, Unity, Next.js, SEO)..."
                  : "Filter specializations (e.g. Frontend, Unity, Next.js, Cloud)..."
              }
              aria-label={isTr ? "Kategori filtrele" : "Filter categories"}
              className="w-full h-10 rounded-xl bg-transparent border-none pl-9 pr-8 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none transition-all [&::-webkit-search-cancel-button]:hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                aria-label={isTr ? "Aramayı temizle" : "Clear search"}
                title={isTr ? "Aramayı temizle" : "Clear search"}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Dikey İnce Ayraç (Masaüstü) */}
          <div className="hidden sm:block h-6 w-px bg-[var(--color-border-subtle)]/70 mx-0.5" />

          {/* Sektör Seçici Combobox Tetikleyici (Sağ Entegre) */}
          <div className="relative z-50 shrink-0 w-full sm:w-auto" ref={sectorDropdownRef}>
            <div
              className={`w-full sm:w-72 md:w-80 h-10 px-3 rounded-xl transition-all flex items-center justify-between gap-2 text-left cursor-pointer border select-none ${
                isSectorDropdownOpen
                  ? "bg-blue-500/10 border-blue-500/40 text-[var(--color-text-primary)]"
                  : "bg-[var(--color-surface-hover)] hover:bg-[var(--color-surface-hover)]/80 border-[var(--color-border-subtle)]/70 text-[var(--color-text-primary)]"
              }`}
              onClick={() => {
                setIsSectorDropdownOpen((prev) => !prev);
                if (!isSectorDropdownOpen) {
                  setTimeout(() => sectorInputRef.current?.focus(), 50);
                }
              }}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="h-6 w-6 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <ActiveSectorIcon className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
                <span className="text-xs font-semibold truncate">
                  {currentSectorLabel}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]">
                  <span className="hidden min-[380px]:inline">{currentSectorCount} {isTr ? "alan" : "areas"} • </span>
                  {currentSectorListingCount} {isTr ? "ilan" : "listings"}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-[var(--color-text-tertiary)] transition-transform duration-200 ${
                    isSectorDropdownOpen ? "rotate-180 text-blue-600 dark:text-blue-400" : ""
                  }`}
                />
              </div>
            </div>

            {/* Dropdown Menu (With Search Filter Inside Popover, Right Aligned) */}
            {isSectorDropdownOpen && (
              <div
                className="absolute top-full right-0 mt-2 w-[calc(100vw-2rem)] sm:w-full min-w-0 max-w-[calc(100vw-2rem)] sm:max-w-[480px] sm:min-w-[420px] rounded-2xl border p-1.5 z-[100] animate-in fade-in zoom-in-95 duration-150"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border-strong)",
                  boxShadow:
                    "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--border-subtle)",
                }}
              >
                <div className="p-1 mb-1">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
                    <input
                      type="text"
                      ref={sectorInputRef}
                      value={sectorSearchQuery}
                      onChange={(e) => setSectorSearchQuery(e.target.value)}
                      placeholder={isTr ? "Sektör ara..." : "Filter sector..."}
                      className="w-full h-8 pl-8 pr-7 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-blue-500"
                    />
                    {sectorSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setSectorSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-[min(55dvh,380px)] overflow-y-auto space-y-1 p-0.5 scrollbar-thin">
                  {sectorOptions.length === 0 ? (
                    <div className="p-6 text-center space-y-2">
                      <p className="text-xs text-[var(--color-text-tertiary)]">
                        {isTr
                          ? "Aramanızla eşleşen sektör bulunamadı."
                          : "No matching sector found."}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSectorSearchQuery("")}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        {isTr ? "Aramayı temizle" : "Clear search"}
                      </button>
                    </div>
                  ) : (
                    sectorOptions.map((item) => {
                      const Icon = item.icon;
                      const isSelected = selectedSector === item.key;

                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => {
                            setSelectedSector(item.key);
                            setIsSectorDropdownOpen(false);
                            setSectorSearchQuery("");
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                            isSelected
                              ? "bg-blue-500/10 dark:bg-blue-600/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 font-semibold"
                              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <div
                              className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? "bg-blue-500/15 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                                  : "bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)]"
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold truncate">{item.name}</p>
                              {item.subText && (
                                <p className="text-[10px] text-[var(--color-text-tertiary)] truncate opacity-80">
                                  {item.subText}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                isSelected
                                  ? "bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/20 dark:border-transparent"
                                  : "bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)]"
                              }`}
                            >
                              <span className="hidden min-[360px]:inline">{item.count} {isTr ? "uzmanlık" : "specializations"} • </span>
                              {item.listingCount} {isTr ? "ilan" : "listings"}
                            </span>
                            {isSelected && (
                              <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Aktif Sektör Sıfırlama Rozeti (Eğer sektör seçiliyse) */}
          {selectedSector !== "all" && (
            <button
              type="button"
              onClick={() => setSelectedSector("all")}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/20 transition-colors shrink-0 cursor-pointer"
              title={isTr ? "Sektör filtresini sıfırla" : "Reset sector filter"}
            >
              <span>{isTr ? "Filtreyi Sıfırla" : "Reset Filter"}</span>
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Frameless Meta Bar (Kutusuz, Temiz Zemin Bilgi & Aksiyon Satırı) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 text-xs -mt-2">
        {/* Sol: Canlı İlan ve Uzmanlık Sayacı */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="flex items-center gap-2 text-[var(--color-text-secondary)] font-medium"
        >
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
          <span>
            <strong className="font-bold text-[var(--color-text-primary)]">
              {filteredCategories.length}
            </strong>{" "}
            {isTr ? "uzmanlık" : "specializations"}
          </span>
          <span className="opacity-40">•</span>
          <span>
            <strong className="font-bold text-blue-600 dark:text-blue-400">
              {filteredListingCount}
            </strong>{" "}
            {isTr ? "aktif ilan listeleniyor" : "active listings"}
          </span>
        </div>

        {/* Sağ: Takip Durumu & Toplu Aksiyonlar */}
        <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
          <div className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
            <BookmarkCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <span>
              <strong className="font-semibold text-[var(--color-text-primary)]">
                {followedIds.size}
              </strong>{" "}
              {isTr ? "takip ediliyor" : "followed"}
            </span>
          </div>

          <div className="h-3.5 w-px bg-[var(--color-border-subtle)] hidden sm:block" />

          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleFollowAll}
              disabled={isLoading}
              className="h-7 px-2.5 text-xs font-medium"
            >
              {isTr ? "Tümünü Takip Et" : "Follow All"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUnfollowAll}
              disabled={isLoading}
              className="h-7 px-2.5 text-xs text-[var(--color-text-tertiary)] hover:text-red-400 font-medium"
            >
              {isTr ? "Tümünü Bırak" : "Unfollow All"}
            </Button>
          </div>
        </div>
      </div>

      {/* Empty Filter State */}
      {filteredCategories.length === 0 ? (
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/60 p-8 sm:p-12 text-center space-y-6 backdrop-blur-xl shadow-sm animate-in fade-in-50 duration-200">
          {/* Sektör Kısıtlaması Uyarısı ve Hızlı Çözüm Butonu */}
          {selectedSector !== "all" && globalCrossSectorMatches.length > 0 ? (
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/25 max-w-md mx-auto space-y-3">
              <p className="text-xs text-[var(--color-text-primary)] leading-relaxed">
                {isTr ? (
                  <>
                    Seçili <strong>&ldquo;{currentSectorLabel}&rdquo;</strong> sektöründe sonuç bulunamadı ancak diğer sektörlerde <strong>{globalCrossSectorMatches.length}+</strong> uzmanlık alanı mevcut.
                  </>
                ) : (
                  <>
                    No matches in <strong>&ldquo;{currentSectorLabel}&rdquo;</strong>, but found <strong>{globalCrossSectorMatches.length}+</strong> matching specializations in other sectors.
                  </>
                )}
              </p>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setSelectedSector("all")}
                className="w-full sm:w-auto h-8 text-xs font-semibold gap-1.5 shadow-sm cursor-pointer"
              >
                <span>{isTr ? "Tüm Sektörlerde Göster" : "Show Across All Sectors"}</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                {isTr
                  ? "Aramanızla eşleşen kategori bulunamadı."
                  : "No categories matched your search criteria."}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {isTr
                  ? "Farklı bir anahtar kelime deneyebilir veya aramayı temizleyebilirsiniz."
                  : "Try a different query or clear your search."}
              </p>
            </div>
          )}

          {/* Aksiyon Butonları (Temizle ve İlanlarda Ara Köprüsü) */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                if (selectedSector !== "all") setSelectedSector("all");
              }}
              className="h-8 text-xs cursor-pointer"
            >
              {isTr ? "Aramayı Temizle" : "Clear Search"}
            </Button>

            {searchQuery.trim() && (
              <Link
                href={
                  isTr
                    ? `/tr/ilanlar?q=${encodeURIComponent(searchQuery.trim())}`
                    : `/en/listings?q=${encodeURIComponent(searchQuery.trim())}`
                }
              >
                <Button
                  variant="primary"
                  size="sm"
                  className="h-8 text-xs gap-1.5 cursor-pointer shadow-sm"
                >
                  <Search className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    {isTr
                      ? `"${searchQuery.trim()}" terimini İlanlar'da ara`
                      : `Search "${searchQuery.trim()}" in Listings`}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </Link>
            )}
          </div>

          {/* Akıllı Kurtarma Çipleri (Smart Recovery Chips) */}
          <div className="pt-3 space-y-2.5 border-t border-[var(--color-border-subtle)]/50 max-w-lg mx-auto">
            <p className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">
              {isTr ? "Önerilen Popüler Alanlar" : "Suggested Popular Specializations"}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {POPULAR_SEARCH_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setSelectedSector("all");
                    setSearchQuery(chip);
                  }}
                  className="px-3 py-1 rounded-xl text-xs font-medium bg-[var(--color-surface-hover)] hover:bg-blue-500/15 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/30 text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)] transition-all cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Grid of Dynamic Category Spotlight Cards */
        <div
          className={`relative z-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 transition-opacity duration-150 ${
            isStale ? "opacity-75" : "opacity-100"
          }`}
        >
          {filteredCategories.map((cat) => {
            const isFollowed = followedIds.has(cat.id);
            const Icon = CATEGORY_ICONS[cat.slug] || Code2;
            return (
              <SpotlightCard
                key={cat.id}
                className="h-full p-4 sm:p-6 transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-3.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500/20 group-hover:scale-105 transition-all shrink-0">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                          (cat.listingCount || 0) > 0
                            ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30"
                            : "bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] border-[var(--color-border-subtle)]"
                        }`}
                      >
                        {cat.listingCount || 0} {isTr ? "ilan" : "listings"}
                      </span>
                      <span className="font-mono text-[11px] text-[var(--color-text-tertiary)] bg-[var(--color-surface-hover)] px-2 py-0.5 rounded-md">
                        /{cat.slug}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col flex-1">
                    <div className="min-h-[2.75rem] flex items-center">
                      <Link
                        href={
                          isTr ? `/tr/akis?category=${cat.slug}` : `/en/feed?category=${cat.slug}`
                        }
                        className="font-bold text-base text-[var(--color-text-primary)] hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2 leading-snug"
                        title={cat.name}
                      >
                        {cat.name}
                      </Link>
                    </div>
                    <div className="pt-1.5 min-h-[2.5rem] flex items-start">
                      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">
                        {cat.description || ""}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between pt-4 border-t border-[var(--color-border-subtle)]/60 shrink-0">
                  <Link
                    href={isTr ? `/tr/akis?category=${cat.slug}` : `/en/feed?category=${cat.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    <span>{isTr ? `İlanlar (${cat.listingCount || 0})` : `Listings (${cat.listingCount || 0})`}</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>

                  <Button
                    variant={isFollowed ? "secondary" : "primary"}
                    size="sm"
                    onClick={() => handleToggle(cat.id)}
                    className="gap-1.5 shrink-0"
                  >
                    {isFollowed ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                        <span>{isTr ? "Takipte" : "Following"}</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{isTr ? "Takip Et" : "Follow"}</span>
                      </>
                    )}
                  </Button>
                </div>
              </SpotlightCard>
            );
          })}
        </div>
      )}

      {/* Floating Auth Notification for Guests */}
      {showAuthNotice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[calc(100%-2rem)] p-4 rounded-2xl bg-[var(--color-surface-base)]/95 backdrop-blur-xl border border-blue-500/40 shadow-2xl shadow-blue-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <LogIn className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                {isTr ? "Giriş Yapmanız Gerekiyor" : "Authentication Required"}
              </p>
              <p className="text-[11px] text-[var(--color-text-secondary)] leading-tight">
                {isTr
                  ? "Kategorileri takip etmek ve özel akış oluşturmak için lütfen giriş yapın."
                  : "Please sign in to follow categories and personalize your project feed."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <Link
              href={loginUrl}
              className="inline-flex items-center justify-center h-8 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isTr ? "Giriş Yap" : "Sign In"}
            </Link>
            <button
              type="button"
              onClick={() => setShowAuthNotice(false)}
              className="h-8 w-8 rounded-xl flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
              aria-label={isTr ? "Kapat" : "Dismiss"}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
