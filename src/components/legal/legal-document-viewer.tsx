"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Printer,
  Copy,
  Check,
  ShieldCheck,
  Hash,
  Scale,
  FileText,
  Lock,
  Cookie,
  AlertTriangle,
  Info,
  BookOpen,
  ArrowUp,
  ChevronDown,
} from "lucide-react";
import { getLocalizedLegalPath } from "@/src/lib/i18n/routes";
import { Locale } from "@/src/lib/i18n/config";

interface LegalDocumentViewerProps {
  currentKey: string;
  locale: string;
  version: string;
  hash: string;
  rawMarkdown: string;
  docTitle: string;
}

interface ParsedSection {
  id: string;
  title: string;
  level: 2 | 3;
  numberPrefix?: string;
  blocks: ContentBlock[];
}

type ContentBlock =
  | { type: "paragraph"; text: string; isCallout?: boolean }
  | { type: "subheading"; text: string; id: string }
  | { type: "list"; items: string[]; isOrdered: boolean }
  | { type: "divider" };

export function LegalDocumentViewer({
  currentKey,
  locale,
  version,
  hash,
  rawMarkdown,
  docTitle,
}: LegalDocumentViewerProps) {
  const isTr = locale === "tr";
  const [copied, setCopied] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string>("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);
  const navDropdownRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navDropdownRef.current && !navDropdownRef.current.contains(event.target as Node)) {
        setNavDropdownOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setNavDropdownOpen(false);
      }
    }
    if (navDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [navDropdownOpen]);

  // Parse markdown into high-end structured legal AST
  const { documentTitle, metaFields, sections } = useMemo(() => {
    const lines = rawMarkdown.split("\n");
    let documentTitle = docTitle;
    const metaFields: { label: string; value: string }[] = [];
    const sections: ParsedSection[] = [];

    let currentSection: ParsedSection = {
      id: "giris",
      title: isTr ? "Giriş ve Genel Esaslar" : "Introduction",
      level: 2,
      blocks: [],
    };

    let inIntro = true;
    let listBuffer: string[] = [];
    let isListOrdered = false;

    const flushList = () => {
      if (listBuffer.length > 0) {
        currentSection.blocks.push({
          type: "list",
          items: [...listBuffer],
          isOrdered: isListOrdered,
        });
        listBuffer = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = (lines[i] ?? "").trim();

      if (!line) {
        flushList();
        continue;
      }

      // Title H1
      if (line.startsWith("# ")) {
        documentTitle = line.replace("# ", "").trim();
        continue;
      }

      // Metadata lines at top (e.g. **Son Güncelleme:** 2026-09-17)
      if (inIntro && line.startsWith("**") && line.includes(":**")) {
        const parts = line.split(":**");
        if (parts.length >= 2) {
          const label = (parts[0] ?? "").replace(/\*\*/g, "").trim();
          const value = parts.slice(1).join(":").replace(/\*\*/g, "").trim();
          metaFields.push({ label, value });
          continue;
        }
      }

      // Horizontal rules
      if (line === "---" || line === "***") {
        flushList();
        if (!inIntro) {
          currentSection.blocks.push({ type: "divider" });
        }
        continue;
      }

      // H2 Main Legal Articles
      if (line.startsWith("## ")) {
        flushList();
        inIntro = false;
        if (currentSection.blocks.length > 0 || currentSection.id !== "giris") {
          sections.push(currentSection);
        }

        const rawHeading = line.replace("## ", "").trim();
        const cleanId =
          "sec-" +
          rawHeading
            .toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-");

        currentSection = {
          id: cleanId,
          title: rawHeading,
          level: 2,
          blocks: [],
        };
        continue;
      }

      // H3 Sub-headings
      if (line.startsWith("### ")) {
        flushList();
        const subHeading = line.replace("### ", "").trim();
        const subId =
          "sub-" +
          subHeading
            .toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-");
        currentSection.blocks.push({
          type: "subheading",
          text: subHeading,
          id: subId,
        });
        continue;
      }

      // Numbered lists (e.g. 1. , 2. )
      const orderedMatch = line.match(/^(\d+)\.\s+(.*)$/);
      if (orderedMatch) {
        if (listBuffer.length > 0 && !isListOrdered) flushList();
        isListOrdered = true;
        listBuffer.push(orderedMatch[2] ?? "");
        continue;
      }

      // Bullet lists (e.g. - or * )
      if (line.startsWith("- ") || line.startsWith("* ")) {
        if (listBuffer.length > 0 && isListOrdered) flushList();
        isListOrdered = false;
        listBuffer.push(line.replace(/^[-*]\s+/, ""));
        continue;
      }

      // Regular Paragraph
      flushList();
      const isCallout =
        line.toLowerCase().includes("kesinlikle") ||
        line.toLowerCase().includes("dava açılamaz") ||
        line.toLowerCase().includes("hasım gösterilemez") ||
        line.toLowerCase().includes("sorumsuzluk") ||
        line.toLowerCase().includes("muafiyet");

      currentSection.blocks.push({
        type: "paragraph",
        text: line,
        isCallout,
      });
    }

    flushList();
    if (currentSection.blocks.length > 0) {
      sections.push(currentSection);
    }

    return { documentTitle, metaFields, sections };
  }, [rawMarkdown, docTitle, isTr]);

  // Scrollspy & Back to Top behavior
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);

      if (isProgrammaticScrollRef.current) return;

      const headerOffset = 140; // 64px sticky navbar + scroll margin threshold
      const sectionElements = sections.map((s) => document.getElementById(s.id));

      let currentId = sections[0]?.id ?? "";
      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const el = sectionElements[i];
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= headerOffset) {
            currentId = sections[i]?.id ?? "";
            break;
          }
        }
      }

      setActiveSectionId(currentId);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // Nav keys
  const legalDocsNav = [
    { key: "terms", tr: "Kullanım Koşulları", en: "Terms of Service", icon: Scale },
    { key: "matching-disclaimer", tr: "Sorumluluk Reddi", en: "Liability Disclaimer", icon: AlertTriangle },
    { key: "privacy", tr: "Gizlilik ve KVKK", en: "Privacy Notice", icon: Lock },
    { key: "acceptable-use", tr: "Kabul Edilebilir Kullanım", en: "Acceptable Use", icon: ShieldCheck },
    { key: "cookies", tr: "Çerez Politikası", en: "Cookie Policy", icon: Cookie },
    { key: "intellectual-property", tr: "Fikri Mülkiyet & Telif", en: "Intellectual Property", icon: BookOpen },
    { key: "consent", tr: "Açık Rıza Metni", en: "Explicit Consent", icon: FileText },
    { key: "dispute-resolution", tr: "Uyuşmazlık Çözümü", en: "Dispute Resolution", icon: Scale },
    { key: "contact", tr: "Kurumsal Künye", en: "Corporate Legal", icon: Info },
  ];

  // Helper to format inline bold text
  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-semibold text-[var(--color-text-primary)]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  // Helper to format clean section titles without repetitive leading numbers (e.g. "1. " or "2) ")
  const formatSectionTitle = (title: string) => {
    return title.replace(/^\d+[\.\)]\s*/, "").trim();
  };

  return (
    <div className="w-full space-y-8">
      {/* Top Document Header Card */}
      <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-xl p-6 sm:p-8 space-y-6 shadow-xl relative z-20 print:border-none print:shadow-none print:p-0">
        <div className="pointer-events-none absolute inset-0 rounded-3xl overflow-hidden print:hidden" aria-hidden="true">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl" />
        </div>

        {/* Top Badges & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-border-subtle)]/70 pb-5">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
              <span>{version}</span>
            </span>

            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono text-[var(--color-text-tertiary)] bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] truncate max-w-[220px]">
              <Hash className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate" title={`HMK m. 193 SHA-256 Dijital Mühür: ${hash}`}>
                SHA-256: {hash.slice(0, 12)}...
              </span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
              <Check className="h-3 w-3" aria-hidden="true" />
              <span>{isTr ? "Yürürlükte" : "In Effect"}</span>
            </span>
          </div>

          {/* Action Buttons: Print, Copy Link & Quick Legal Pages Switcher */}
          <div className="flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-blue-500/30 transition-all cursor-pointer"
              title={isTr ? "Belge bağlantısını kopyala" : "Copy document URL"}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                  <span className="text-emerald-400 font-bold">{isTr ? "Kopyalandı" : "Copied!"}</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{isTr ? "Bağlantıyı Kopyala" : "Share"}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-blue-500/30 transition-all cursor-pointer"
              title={isTr ? "Yazdır veya PDF olarak kaydet" : "Print or save as PDF"}
            >
              <Printer className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isTr ? "Yazdır / PDF" : "Print / PDF"}</span>
            </button>

            {/* Legal Documents Quick Switcher Dropdown */}
            <div className="relative" ref={navDropdownRef}>
              <button
                type="button"
                onClick={() => setNavDropdownOpen((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  navDropdownOpen
                    ? "border-blue-500 bg-blue-500/10 text-blue-400 shadow-sm shadow-blue-500/10"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-blue-500/30"
                }`}
                title={isTr ? "Diğer yasal sayfaları görüntüle" : "Browse all legal documents"}
                aria-expanded={navDropdownOpen}
                aria-haspopup="true"
              >
                <BookOpen className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
                <span>{isTr ? "Yasal Sayfalar" : "Legal Pages"}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-[10px] font-mono text-[var(--color-text-tertiary)]">
                  9
                </span>
                <ChevronDown
                  className={`h-3 w-3 transition-transform duration-200 ${
                    navDropdownOpen ? "rotate-180 text-blue-400" : "text-[var(--color-text-tertiary)]"
                  }`}
                  aria-hidden="true"
                />
              </button>

              {navDropdownOpen && (
                <div
                  style={{ backgroundColor: "var(--bg-elevated)" }}
                  className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl border border-[var(--color-border-strong)] shadow-2xl shadow-black/80 ring-1 ring-black/10 dark:ring-white/15 z-50 p-2 space-y-1 animate-in fade-in zoom-in-95"
                >
                  <div className="px-3 py-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/50 rounded-xl">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      {isTr ? "Tüm Yasal Metinler ve Politikalar" : "All Legal Framework Documents"}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)] mt-0.5 font-medium">
                      {isTr ? "İlgili belgeyi seçerek hızlı geçiş yapın:" : "Select a document to view:"}
                    </div>
                  </div>

                  <div className="max-h-[380px] overflow-y-auto py-1 space-y-0.5 pr-0.5">
                    {legalDocsNav.map((doc) => {
                      const active = doc.key === currentKey;
                      const label = isTr ? doc.tr : doc.en;
                      const Icon = doc.icon;
                      return (
                        <Link
                          key={doc.key}
                          href={getLocalizedLegalPath(doc.key, locale as Locale)}
                          onClick={() => setNavDropdownOpen(false)}
                          className={`flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs transition-all ${
                            active
                              ? "bg-blue-500/15 text-blue-400 font-bold border border-blue-500/30"
                              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Icon
                              className={`h-3.5 w-3.5 shrink-0 ${active ? "text-blue-400" : "text-[var(--color-text-tertiary)]"}`}
                              aria-hidden="true"
                            />
                            <span className="truncate">{label}</span>
                          </div>
                          {active ? (
                            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 shrink-0 border border-blue-500/30">
                              {isTr ? "Aktif" : "Active"}
                            </span>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Document Title */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-tight">
            {documentTitle}
          </h1>

          {/* Metadata Badges Strip */}
          {metaFields.length > 0 && (
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-2 text-xs text-[var(--color-text-secondary)]">
              {metaFields.map((field, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider text-[10px]">
                    {field.label}:
                  </span>
                  <span className="text-[var(--color-text-primary)] font-medium">
                    {field.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Two-Column Layout: Sidebar Table of Contents + Document Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sticky Table of Contents (Desktop Sidebar) */}
        <aside className="hidden lg:block lg:col-span-4 sticky top-24 space-y-4 print:hidden">
          <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 border-b border-[var(--color-border-subtle)] pb-3">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              <span>{isTr ? "İçindekiler & Maddeler" : "Table of Contents"}</span>
            </div>

            <nav className="space-y-1 max-h-[calc(70vh-4rem)] overflow-y-auto pr-1 text-xs">
              {sections.map((sec, idx) => {
                const isActive = activeSectionId === sec.id;
                return (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const target = document.getElementById(sec.id);
                      if (target) {
                        isProgrammaticScrollRef.current = true;
                        setActiveSectionId(sec.id);
                        if (scrollTimeoutRef.current) {
                          clearTimeout(scrollTimeoutRef.current);
                        }
                        scrollTimeoutRef.current = setTimeout(() => {
                          isProgrammaticScrollRef.current = false;
                        }, 800);
                        target.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }}
                    className={`group flex items-start gap-2 py-1.5 px-2.5 rounded-xl transition-all leading-snug ${
                      isActive
                        ? "bg-blue-500/10 text-blue-400 font-semibold border-l-2 border-blue-500"
                        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                    }`}
                  >
                    <span className="font-mono text-[10px] text-[var(--color-text-tertiary)] group-hover:text-blue-400 shrink-0 mt-0.5">
                      #{idx + 1}
                    </span>
                    <span className="line-clamp-2">{formatSectionTitle(sec.title)}</span>
                  </a>
                );
              })}
            </nav>

            {/* Quick Legal Guarantee Notice */}
            <div className="pt-3 border-t border-[var(--color-border-subtle)]/70 text-[11px] text-[var(--color-text-tertiary)] leading-relaxed space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{isTr ? "Resmi Hukuki Dayanak" : "Statutory Verification"}</span>
              </div>
              <p>
                {isTr
                  ? "6098 s. TBK m. 115, 6563 s. ETK m. 9, 5651 s. Kanun m. 5 ve HMK m. 193 delil sözleşmesi hükümleriyle korunmaktadır."
                  : "Governed under mandatory statutory Safe Harbor provisions and electronic evidentiary rules."}
              </p>
            </div>
          </div>
        </aside>

        {/* Primary Document Content Column */}
        <div className="lg:col-span-8 space-y-6">
          <article className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/90 backdrop-blur-xl p-6 sm:p-10 shadow-xl space-y-8 print:border-none print:shadow-none print:p-0">
            {sections.map((section, sIdx) => (
              <section
                key={section.id}
                id={section.id}
                className="space-y-4 pt-2 scroll-mt-24 border-b border-[var(--color-border-subtle)]/50 pb-8 last:border-b-0 last:pb-0"
              >
                {/* Section Title Header */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400/80 bg-blue-500/5 border border-blue-500/10 px-2 py-0.5 rounded-md">
                      {isTr ? `MADDE ${sIdx + 1}` : `SECTION ${sIdx + 1}`}
                    </span>
                    <a
                      href={`#${section.id}`}
                      className="text-xs font-mono text-[var(--color-text-tertiary)] hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      #
                    </a>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
                    {formatSectionTitle(section.title)}
                  </h2>
                </div>

                {/* Section Blocks */}
                <div className="space-y-3.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {section.blocks.map((block, bIdx) => {
                    if (block.type === "paragraph") {
                      if (block.isCallout) {
                        return (
                          <div
                            key={bIdx}
                            className="rounded-2xl border border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10 p-4 sm:p-5 my-3 space-y-1.5"
                          >
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
                              <AlertTriangle className="h-4 w-4 shrink-0 text-blue-400" aria-hidden="true" />
                              <span>{isTr ? "Önemli Hukuki Hüküm & Sorumluluk Sınırı" : "Key Statutory Term"}</span>
                            </div>
                            <p className="text-xs sm:text-sm text-[var(--color-text-primary)] leading-relaxed font-medium">
                              {renderFormattedText(block.text)}
                            </p>
                          </div>
                        );
                      }
                      return (
                        <p key={bIdx} className="leading-relaxed">
                          {renderFormattedText(block.text)}
                        </p>
                      );
                    }

                    if (block.type === "subheading") {
                      return (
                        <h3
                          key={bIdx}
                          id={block.id}
                          className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] pt-3 pb-1"
                        >
                          {block.text}
                        </h3>
                      );
                    }

                    if (block.type === "list") {
                      if (block.isOrdered) {
                        return (
                          <ol
                            key={bIdx}
                            className="space-y-2.5 pl-1 my-2 list-none"
                          >
                            {block.items.map((item, lIdx) => (
                              <li
                                key={lIdx}
                                className="flex items-start gap-3 text-xs sm:text-sm leading-relaxed"
                              >
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] font-mono text-[11px] font-bold text-blue-400 mt-0.5">
                                  {lIdx + 1}
                                </span>
                                <span className="flex-1">
                                  {renderFormattedText(item)}
                                </span>
                              </li>
                            ))}
                          </ol>
                        );
                      }

                      return (
                        <ul
                          key={bIdx}
                          className="space-y-2 pl-1 my-2 list-none"
                        >
                          {block.items.map((item, lIdx) => (
                            <li
                              key={lIdx}
                              className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0 mt-2" />
                              <span className="flex-1">
                                {renderFormattedText(item)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      );
                    }

                    if (block.type === "divider") {
                      return (
                        <hr
                          key={bIdx}
                          className="border-t border-[var(--color-border-subtle)]/70 my-4"
                        />
                      );
                    }

                    return null;
                  })}
                </div>
              </section>
            ))}
          </article>

          {/* Bottom Certified Legal Notice */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-xs text-[var(--color-text-secondary)] leading-relaxed flex items-start gap-3.5 print:hidden">
            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <span className="font-bold text-[var(--color-text-primary)] block">
                {isTr ? "HMK m. 193 Uyarınca Bağlayıcı Delil Sözleşmesi" : "Binding Evidentiary Contract (HMK m. 193)"}
              </span>
              <p>
                {isTr
                  ? "İşbu yasal doküman ve kullanıcı onayları, 6100 sayılı Hukuk Muhakemeleri Kanunu m. 193 uyarınca taraflar arasında bağlayıcı kesin delil teşkil eder. Operis sunucu logları, zaman damgaları ve SHA-256 dijital mühürleri uyuşmazlıklarda münhasır delil niteliğindedir."
                  : "This legal document and user acceptance timestamps constitute conclusive evidence under governing civil procedure statutes. All rights reserved."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-8 z-40 p-3 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/30 hover:bg-blue-500 transition-all cursor-pointer print:hidden"
          aria-label={isTr ? "Yukarı çık" : "Back to top"}
        >
          <ArrowUp className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
