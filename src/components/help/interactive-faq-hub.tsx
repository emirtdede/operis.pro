"use client";

import { useState, useMemo } from "react";
import {
  Search,
  ChevronDown,
  Clock,
  Lock,
  Zap,
  Handshake,
  ShieldCheck,
  HelpCircle,
  X,
  Scale,
  Check,
  Copy,
} from "lucide-react";
import { FAQ_ITEMS, type FAQItem, type FAQAudience } from "./faq-data";

interface InteractiveFaqHubProps {
  locale: "tr" | "en";
  targetAudience?: FAQAudience | "all";
  hideSearchAndFilters?: boolean;
  defaultLimit?: number;
  initialCategory?: string;
  initialOpenId?: string;
}

export function InteractiveFaqHub({
  locale,
  targetAudience = "all",
  hideSearchAndFilters = false,
  defaultLimit,
  initialCategory = "all",
  initialOpenId,
}: InteractiveFaqHubProps) {
  const isTr = locale === "tr";
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(initialOpenId ? [initialOpenId] : ["freshness-rule", "zero-commission-model"])
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    { id: "all", label: isTr ? "Tüm Konular" : "All Topics", icon: HelpCircle },
    { id: "listings", label: isTr ? "İlanlar & 168s Radarı" : "Listings & Radar", icon: Clock },
    { id: "commission", label: isTr ? "%0 Komisyon Modeli" : "0% Fee Model", icon: Zap },
    { id: "offers", label: isTr ? "Şifreli Teklifler" : "Encrypted Proposals", icon: Lock },
    { id: "matching", label: isTr ? "Eşleşme & İletişim" : "Matching & Workspace", icon: Handshake },
    { id: "legal", label: isTr ? "Yasal & Fikri Mülkiyet" : "Legal & IP Rights", icon: Scale },
    { id: "safety", label: isTr ? "Güvenlik & Uyuşmazlık" : "Safety & Trust", icon: ShieldCheck },
  ];

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let items = FAQ_ITEMS;

    // Filter by audience if specified
    if (targetAudience && targetAudience !== "all") {
      items = items.filter(
        (item) => item.targetAudience === targetAudience || item.targetAudience === "general"
      );
    }

    // Filter by category
    if (activeCategory !== "all") {
      items = items.filter((item) => item.category === activeCategory);
    }

    // Filter by search query
    if (q) {
      items = items.filter((item) => {
        const question = isTr ? item.questionTr : item.questionEn;
        const answer = isTr ? item.answerTr : item.answerEn;
        const tagsMatch = item.tags.some((t) => t.toLowerCase().includes(q));
        return (
          question.toLowerCase().includes(q) ||
          answer.toLowerCase().includes(q) ||
          tagsMatch
        );
      });
    }

    if (defaultLimit && defaultLimit > 0 && !q && activeCategory === "all") {
      return items.slice(0, defaultLimit);
    }

    return items;
  }, [searchQuery, activeCategory, isTr, targetAudience, defaultLimit]);

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    setOpenIds(new Set(filteredFaqs.map((f) => f.id)));
  };

  const handleCollapseAll = () => {
    setOpenIds(new Set());
  };

  const copyQuestionLink = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}${window.location.pathname}#faq-${id}`;
      navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const getCategoryBadge = (catId: FAQItem["category"]) => {
    switch (catId) {
      case "listings":
        return { label: isTr ? "İlanlar" : "Listings", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" };
      case "commission":
        return { label: isTr ? "%0 Komisyon" : "0% Fee", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
      case "offers":
        return { label: isTr ? "Şifreli Teklif" : "Encrypted Bid", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" };
      case "matching":
        return { label: isTr ? "Eşleşme" : "Matching", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
      case "legal":
        return { label: isTr ? "Yasal / Vergi" : "Legal / Tax", color: "text-rose-400 bg-rose-500/10 border-rose-500/20" };
      case "safety":
        return { label: isTr ? "Güvenlik" : "Safety", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Input Bar (only shown if not hidden) */}
      {!hideSearchAndFilters && (
        <>
          <div className="relative max-w-2xl mx-auto">
            <div className="relative flex items-center">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Search className="h-5 w-5 text-[var(--color-text-tertiary)]" aria-hidden="true" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isTr
                    ? "Sorularda, kurallarda, vergi veya politikalarda ara..."
                    : "Search questions, rules, taxes, escrow or legal policies..."
                }
                className="w-full rounded-2xl pl-12 pr-11 py-3.5 text-sm bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] shadow-lg shadow-black/5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                aria-label={
                  isTr
                    ? "Sorularda, kurallarda veya politikalarda arama yapın"
                    : "Search frequently asked questions and rules"
                }
              />
              {searchQuery && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3.5">
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="p-1 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
                    aria-label={isTr ? "Aramayı Temizle" : "Clear search"}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Category Pills & Quick Controls */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 border border-blue-500"
                        : "bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)] hover:border-blue-500/30 hover:text-[var(--color-text-primary)]"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Counter & Expand/Collapse Bar */}
      <div className="flex items-center justify-between px-1 text-xs text-[var(--color-text-tertiary)]">
        <div>
          {isTr ? (
            <span>Toplam <strong>{filteredFaqs.length}</strong> soru listeleniyor</span>
          ) : (
            <span>Showing <strong>{filteredFaqs.length}</strong> questions</span>
          )}
          {searchQuery && (
            <span className="ml-2 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
              &ldquo;{searchQuery}&rdquo;
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExpandAll}
            className="hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
          >
            {isTr ? "Tümünü Aç" : "Expand All"}
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={handleCollapseAll}
            className="hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
          >
            {isTr ? "Tümünü Kapat" : "Collapse All"}
          </button>
        </div>
      </div>

      {/* Accordion Questions List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/50 space-y-4">
            <HelpCircle className="h-9 w-9 text-[var(--color-text-tertiary)] mx-auto opacity-60" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                {isTr ? "Aradığınız kriterlere uygun soru bulunamadı" : "No matching questions found"}
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] max-w-md mx-auto">
                {isTr
                  ? "Farklı anahtar kelimeler deneyebilir veya destek ekibimizle doğrudan iletişime geçebilirsiniz."
                  : "Try modifying your search query or get in touch directly with our support desk."}
              </p>
            </div>
            {!hideSearchAndFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-colors cursor-pointer"
              >
                {isTr ? "Filtreleri Temizle" : "Reset Filters"}
              </button>
            )}
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isOpen = openIds.has(faq.id);
            const question = isTr ? faq.questionTr : faq.questionEn;
            const answer = isTr ? faq.answerTr : faq.answerEn;
            const badge = getCategoryBadge(faq.category);

            return (
              <div
                id={`faq-${faq.id}`}
                key={faq.id}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? "border-blue-500/40 bg-[var(--color-surface-base)] shadow-md"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/60 hover:border-[var(--color-border-strong)]"
                }`}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleOpen(faq.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleOpen(faq.id);
                    }
                  }}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left gap-4 transition-colors cursor-pointer select-none"
                >
                  <div className="space-y-1.5 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <span className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] block leading-snug">
                      {question}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => copyQuestionLink(e, faq.id)}
                      title={isTr ? "Soru bağlantısını kopyala" : "Copy question link"}
                      className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-blue-400 hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
                      aria-label="Copy link"
                    >
                      {copiedId === faq.id ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <div
                      className={`h-7 w-7 rounded-lg border flex items-center justify-center transition-all duration-300 ${
                        isOpen
                          ? "rotate-180 bg-blue-500/10 border-blue-500/30 text-blue-400"
                          : "border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)]"
                      }`}
                    >
                      <ChevronDown className="h-4 w-4 transition-transform duration-300" />
                    </div>
                  </div>
                </div>

                <div
                  className={`accordion-wrapper ${isOpen ? "is-open" : ""}`}
                  aria-hidden={!isOpen}
                >
                  <div className="accordion-inner">
                    <div className="px-4 sm:px-5 pb-5 pt-2 text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30">
                      <p>{answer}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
