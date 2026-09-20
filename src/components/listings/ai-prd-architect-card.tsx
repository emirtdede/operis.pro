"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Layers,
  Cpu,
  Coins,
  Check,
  Copy,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import type { PrdArchitectResult } from "@/src/modules/ai/prd-architect";

export interface AiPrdArchitectCardProps {
  title: string;
  summary: string;
  categorySlug?: string;
  tags?: string[];
  locale?: string;
  onApplyPrdMarkdown: (prdMarkdown: string) => void;
  onApplyMarketBudget?: (min: number, max: number) => void;
  onClose?: () => void;
}

export function AiPrdArchitectCard({
  title,
  summary,
  categorySlug,
  tags,
  locale = "tr",
  onApplyPrdMarkdown,
  onApplyMarketBudget,
  onClose,
}: AiPrdArchitectCardProps) {
  const isTr = locale === "tr";

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PrdArchitectResult | null>(null);
  const [activeTab, setActiveTab] = useState<
    "stories" | "criteria" | "integrations" | "roadmap" | "preview"
  >("stories");
  const [copiedPrd, setCopiedPrd] = useState(false);
  const [appliedPrdSuccess, setAppliedPrdSuccess] = useState(false);
  const [appliedBudgetSuccess, setAppliedBudgetSuccess] = useState(false);

  const fetchPrdAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    setAppliedPrdSuccess(false);
    setAppliedBudgetSuccess(false);

    try {
      const res = await fetch("/api/ai/prd-architect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({
          title,
          summary,
          categorySlug,
          tags,
          locale,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || (isTr ? "PRD üretilemedi" : "Failed to synthesize PRD"));
      }

      const data = await res.json();
      if (data.success && data.result) {
        setResult(data.result);
      } else {
        throw new Error(data.error || "Synthesis returned empty");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Analysis failed";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (title || summary) {
      fetchPrdAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopyPrd = async () => {
    if (!result?.synthesizedPrdMarkdown) return;
    try {
      await navigator.clipboard.writeText(result.synthesizedPrdMarkdown);
      setCopiedPrd(true);
      setTimeout(() => setCopiedPrd(false), 2500);
    } catch {
      // Ignore clipboard fallback
    }
  };

  const handleApplyPrd = () => {
    if (!result?.synthesizedPrdMarkdown) return;
    onApplyPrdMarkdown(result.synthesizedPrdMarkdown);
    setAppliedPrdSuccess(true);
    setTimeout(() => setAppliedPrdSuccess(false), 3000);
  };

  const handleApplyBudget = () => {
    if (!result?.marketEstimate || !onApplyMarketBudget) return;
    onApplyMarketBudget(
      result.marketEstimate.minBudget,
      result.marketEstimate.maxBudget
    );
    setAppliedBudgetSuccess(true);
    setTimeout(() => setAppliedBudgetSuccess(false), 3000);
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "P0":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "P1":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      default:
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    }
  };

  return (
    <section
      aria-label="Operis AI Project Scope and PRD Architect"
      className="relative overflow-hidden rounded-3xl border border-indigo-500/40 bg-[var(--color-surface-base)]/95 p-5 sm:p-7 backdrop-blur-2xl shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200"
    >
      {/* Background Ambient Glows */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

      {/* Header Bar */}
      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
            <Sparkles className="h-5 w-5 fill-indigo-400/40 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">
                {isTr
                  ? "🤖 Operis AI: Akıllı PRD & Kapsam Mimarı"
                  : "🤖 Operis AI: Smart PRD & Scope Architect"}
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                Uma Job Spec Engine
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              {isTr
                ? "Ham metninizden profesyonel kullanıcı hikayeleri, kabul kriterleri, entegrasyonlar ve pazar bütçesi üretir."
                : "Transforms raw project briefs into full Agile PRDs with INVEST stories, acceptance criteria, and market budgets."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={fetchPrdAnalysis}
            disabled={isLoading}
            className="p-2 rounded-xl text-[var(--color-text-tertiary)] hover:text-indigo-400 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20 transition-all cursor-pointer"
            title={isTr ? "Yeniden Üret" : "Regenerate PRD"}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-all cursor-pointer"
              title={isTr ? "Kapat" : "Close"}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-12 text-center space-y-3 relative z-10">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-400 mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              {isTr
                ? "Proje Kapsamı & PRD Mimarisi Sentezleniyor..."
                : "Synthesizing Project Scope & Agile PRD..."}
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)] max-w-md mx-auto">
              {isTr
                ? "Arketip tespiti, INVEST kullanıcı hikayeleri, sanal POS/SMS/S3 entegrasyon gereksinimleri ve pazar bütçesi hesaplanıyor."
                : "Analyzing domain archetype, INVEST stories, third-party integrations, and market estimates."}
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchPrdAnalysis}
            className="text-xs border-rose-500/30 hover:bg-rose-500/20 text-rose-300"
          >
            {isTr ? "Tekrar Dene" : "Retry"}
          </Button>
        </div>
      )}

      {/* Result Display */}
      {result && !isLoading && (
        <div className="space-y-5 relative z-10">
          {/* Domain Archetype & Complexity Banner */}
          <div className="p-4 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-cyan-500/5 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                  {isTr ? "Tespit Edilen Mimari Arketip" : "Identified Domain Archetype"}
                </span>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  {isTr ? "Yüksek Uyum" : "High Confidence"}
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-extrabold text-[var(--color-text-primary)]">
                {isTr ? result.analysis.domainLabel : result.analysis.domainLabelEn}
              </h4>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {result.analysis.detectedFeatures.map((feat, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-medium bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] px-2 py-0.5 rounded-md border border-[var(--color-border-subtle)]"
                  >
                    ✓ {feat}
                  </span>
                ))}
              </div>
            </div>

            {/* Complexity Gauge */}
            <div className="flex items-center gap-3 sm:border-l border-[var(--color-border-subtle)] sm:pl-4">
              <div className="text-right">
                <div className="text-[10px] font-semibold text-[var(--color-text-tertiary)] uppercase">
                  {isTr ? "Karmaşıklık" : "Complexity"}
                </div>
                <div className="text-lg font-mono font-extrabold text-indigo-400">
                  {result.analysis.complexityScore} / 10
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 border-b border-[var(--color-border-subtle)] overflow-x-auto pb-2 text-xs scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab("stories")}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "stories"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>
                {isTr ? "Kullanıcı Hikayeleri" : "User Stories"} ({result.userStories.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("criteria")}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "criteria"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>
                {isTr ? "Kabul Kriterleri" : "Acceptance Criteria"} (
                {result.acceptanceCriteria.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("integrations")}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "integrations"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              <Cpu className="h-3.5 w-3.5" />
              <span>
                {isTr ? "Entegrasyonlar" : "Integrations"} ({result.integrations.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("roadmap")}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "roadmap"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              <Coins className="h-3.5 w-3.5" />
              <span>{isTr ? "Bütçe & 3-Fazlı Teslimat" : "Budget & 3 Phases"}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "preview"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>{isTr ? "PRD Markdown" : "PRD Markdown"}</span>
            </button>
          </div>

          {/* TAB 1: User Stories (INVEST Model) */}
          {activeTab === "stories" && (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              <div className="text-[11px] text-[var(--color-text-tertiary)] flex items-center justify-between">
                <span>
                  {isTr
                    ? "Agile INVEST standardında kullanıcı rolleri, beklentiler ve iş değerleri:"
                    : "Agile INVEST standard user roles, goals, and business values:"}
                </span>
                <span className="font-semibold text-indigo-400">P0 = MVP / Kritik</span>
              </div>
              {result.userStories.map((story) => (
                <div
                  key={story.id}
                  className="p-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[var(--color-text-primary)]">
                      {story.id}: {story.role}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadgeClass(
                        story.priority
                      )}`}
                    >
                      {story.priority}
                    </span>
                  </div>
                  <p className="text-[var(--color-text-secondary)] leading-relaxed">
                    <span className="font-semibold text-indigo-300">
                      {isTr ? "İstek:" : "Want:"}
                    </span>{" "}
                    {story.want}
                  </p>
                  <p className="text-[var(--color-text-tertiary)] text-[11px]">
                    <span className="font-semibold text-emerald-400">
                      {isTr ? "Hedef / Değer:" : "So that:"}
                    </span>{" "}
                    {story.soThat}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: Acceptance Criteria */}
          {activeTab === "criteria" && (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              <div className="text-[11px] text-[var(--color-text-tertiary)]">
                {isTr
                  ? "Given / When / Then formatında doğrulanabilir kabul ve onay senaryoları:"
                  : "Testable Given / When / Then verification scenarios:"}
              </div>
              {result.acceptanceCriteria.map((criterion) => (
                <div
                  key={criterion.id}
                  className="p-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300">{criterion.category}</span>
                    <span className="text-[10px] font-mono text-[var(--color-text-tertiary)]">
                      {criterion.id}
                    </span>
                  </div>
                  <p className="text-[var(--color-text-secondary)] leading-relaxed">
                    {criterion.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: Third-Party Integrations */}
          {activeTab === "integrations" && (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              <div className="text-[11px] text-[var(--color-text-tertiary)]">
                {isTr
                  ? "Projenin canlıya çıkması için zorunlu 3. parti API & bulut altyapı servisleri:"
                  : "Mandatory third-party APIs and infrastructure services:"}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.integrations.map((integ, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--color-text-primary)]">
                        {integ.name}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300">
                        {integ.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-cyan-300 font-mono">
                      {isTr ? "Örnek Servis:" : "Service:"} {integ.serviceExample}
                    </div>
                    <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                      {integ.rationale}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Budget & 3-Phase Roadmap */}
          {activeTab === "roadmap" && (
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {/* Benchmark Banner */}
              <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
                    {isTr ? "Piyasa Gerçekçi Bütçe Aralığı" : "Realistic Market Budget Benchmark"}
                  </span>
                  <div className="text-base sm:text-lg font-mono font-extrabold text-emerald-400 mt-0.5">
                    {result.marketEstimate.minBudget.toLocaleString(isTr ? "tr-TR" : "en-US")} -{" "}
                    {result.marketEstimate.maxBudget.toLocaleString(isTr ? "tr-TR" : "en-US")}{" "}
                    {result.marketEstimate.currency}
                  </div>
                  <div className="text-[11px] text-emerald-200/80 mt-0.5">
                    {isTr
                      ? `Tahmini Süre: ${result.marketEstimate.estimatedWeeksMin}-${result.marketEstimate.estimatedWeeksMax} Hafta`
                      : `Estimated Timeline: ${result.marketEstimate.estimatedWeeksMin}-${result.marketEstimate.estimatedWeeksMax} Weeks`}
                  </div>
                </div>

                {onApplyMarketBudget && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleApplyBudget}
                    disabled={appliedBudgetSuccess}
                    className="text-xs border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 shrink-0"
                  >
                    {appliedBudgetSuccess ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400 mr-1" />
                        <span>{isTr ? "Bütçe Uygulandı" : "Budget Applied"}</span>
                      </>
                    ) : (
                      <>
                        <Coins className="h-3.5 w-3.5 mr-1" />
                        <span>{isTr ? "Bu Bütçeyi İlana Yaz" : "Apply to Listing"}</span>
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* 3 Phases List */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-semibold text-[var(--color-text-secondary)]">
                  {isTr ? "Önerilen 3 Kademeli Hakediş ve Teslim Fazları:" : "Recommended 3-Phase Delivery:"}
                </div>
                {result.marketEstimate.phases.map((ph) => (
                  <div
                    key={ph.phase}
                    className="p-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--color-text-primary)]">
                        {isTr
                          ? `${ph.phase}. Aşama (%${ph.percentage}): ${ph.title}`
                          : `Phase ${ph.phase} (${ph.percentage}%): ${ph.title}`}
                      </span>
                      <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                        ~{ph.durationWeeks} {isTr ? "Hafta" : "Weeks"}
                      </span>
                    </div>
                    <ul className="space-y-1 text-[11px] text-[var(--color-text-secondary)] pl-2">
                      {ph.deliverables.map((d, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-indigo-400">•</span>
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Full PRD Markdown Preview */}
          {activeTab === "preview" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-[var(--color-text-tertiary)]">
                <span>{isTr ? "Üretilen Tam Şartname (PRD):" : "Synthesized Full PRD Document:"}</span>
                <button
                  type="button"
                  onClick={handleCopyPrd}
                  className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 cursor-pointer"
                >
                  {copiedPrd ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400">{isTr ? "Kopyalandı" : "Copied"}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>{isTr ? "Metni Kopyala" : "Copy Markdown"}</span>
                    </>
                  )}
                </button>
              </div>
              <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/90 p-4 max-h-80 overflow-y-auto text-xs text-[var(--color-text-secondary)] font-mono leading-relaxed whitespace-pre-wrap select-text">
                {result.synthesizedPrdMarkdown}
              </div>
            </div>
          )}

          {/* Bottom Actions Bar */}
          <div className="pt-2 border-t border-[var(--color-border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[11px] text-[var(--color-text-tertiary)] text-center sm:text-left">
              {isTr
                ? "💡 PRD'yi ilana aktardığınızda şartname metniniz doğrudan teknik kapsam alanına yerleşir."
                : "💡 Transferring to listing injects this structured PRD straight into your scope field."}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyPrd}
                className="text-xs cursor-pointer flex-1 sm:flex-initial"
              >
                {copiedPrd ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400 mr-1" />
                    <span>{isTr ? "Kopyalandı" : "Copied"}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    <span>{isTr ? "Kopyala" : "Copy"}</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleApplyPrd}
                className="text-xs bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold cursor-pointer shadow-lg shadow-indigo-500/20 flex-1 sm:flex-initial"
              >
                {appliedPrdSuccess ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300 mr-1.5" />
                    <span>{isTr ? "Kapsama Aktarıldı!" : "Injected to Scope!"}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    <span>{isTr ? "Kapsamı İlana Aktar (PRD)" : "Inject PRD into Listing"}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
