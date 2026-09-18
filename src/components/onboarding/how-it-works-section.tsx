"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileCode2,
  Lock,
  Handshake,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Send,
  Terminal,
  Layers,
  Banknote,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { SpotlightCard } from "@/src/components/ui/spotlight-card";
import { getLocalizedRoute } from "@/src/lib/i18n/routes";

interface HowItWorksSectionProps {
  locale: string;
}

type ViewMode = "end-to-end" | "client" | "freelancer";

interface WorkflowStep {
  stepNumber: string;
  stage: string;
  icon: LucideIcon;
  title: string;
  shortDesc: string;
  clientPerspective: string;
  freelancerPerspective: string;
  safeguard: string;
  inputOutput: {
    input: string;
    output: string;
  };
  highlightBadge: string;
  accentColor: {
    text: string;
    bg: string;
    border: string;
    pill: string;
  };
}

export function HowItWorksSection({ locale }: HowItWorksSectionProps) {
  const isTr = locale === "tr";
  const [viewMode, setViewMode] = useState<ViewMode>("end-to-end");
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  const workflowSteps: WorkflowStep[] = [
    {
      stepNumber: "01",
      stage: isTr ? "FAZ 1 • KAPSAM & GİRİŞ" : "PHASE 1 • SCOPE & POST",
      icon: FileCode2,
      title: isTr
        ? "İhtiyaç Tanımlama & İlan Girişi (2 Dakika)"
        : "Scope Definition & Project Launch (2 Mins)",
      shortDesc: isTr
        ? "Teknik gereksinimler, teknoloji yığını (tech stack), teslim vadesi ve tahmini bütçe tanımlanır."
        : "Define required tech stack, milestone deliverables, timeline expectations, and budget boundaries.",
      clientPerspective: isTr
        ? "İşveren form üzerinden projenin teknik isterlerini (örn: Next.js, FastAPI), beklenen çıktıları ve bütçeyi girer. Kredi kartı veya ön ödeme gerekmez."
        : "The client outlines technical requirements, deliverables, and estimated budget. No credit card or upfront deposit required.",
      freelancerPerspective: isTr
        ? "İlan anında yazılımcıların canlı akışına ve bildirim radarına düşer. Kapsam net ve anlaşılır biçimde sunulur."
        : "The listing lands instantly on the developer feed and radar. Clear technical criteria, zero ambiguity.",
      safeguard: isTr
        ? "168 saatlik (7 gün) canlılık sayacı başlar; bot ve spam filtreleri sahte ilanları anında engeller."
        : "168-hour freshness lifecycle activates; automated anti-spam guards keep the feed 100% clean.",
      inputOutput: {
        input: isTr ? "Teknik İhtiyaç & Bütçe" : "Technical Scope & Budget",
        output: isTr ? "7 Günlük Canlı İlan Kartı" : "7-Day Active Listing Card",
      },
      highlightBadge: isTr ? "Ücretsiz & 2 Dakika" : "Free & 2 Mins",
      accentColor: {
        text: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        pill: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      },
    },
    {
      stepNumber: "02",
      stage: isTr ? "FAZ 2 • TEKLİF & GİZLİLİK" : "PHASE 2 • PROPOSAL & PRIVACY",
      icon: Lock,
      title: isTr
        ? "Canlı Keşif & Kriptografik Kör Teklifler"
        : "Live Discovery & Encrypted Blind Proposals",
      shortDesc: isTr
        ? "Yazılımcılar canlı ilanı inceler; fiyat, süre ve portföy içeren tekliflerini AES-256 ile şifreleyerek iletir."
        : "Developers explore active listings and submit custom rates and milestone plans with AES-256 encryption.",
      clientPerspective: isTr
        ? "İşveren yalnızca nitelikli ve odaklanmış teklifler alır. Fiyat kırma yarışına girmeyen profesyonel sunumlar toplanır."
        : "The client receives high-conviction, tailored proposals without low-quality automated bidding clutter.",
      freelancerPerspective: isTr
        ? "Yazılımcı teklif fiyatını ve metodolojisini özgürce belirler. Rakipler teklifi asla göremez; fikir veya fiyat kopyalanamaz."
        : "The developer freely sets rates and roadmap. Competitors can never view bids; zero undercutting wars.",
      safeguard: isTr
        ? "AES-256-GCM uçtan uca şifreleme; başvuru sayısı gizlenerek aday caydırıcılığı (bid fatigue) engellenir."
        : "AES-256-GCM encryption with masked proposal counts to completely prevent bid fatigue.",
      inputOutput: {
        input: isTr ? "Fiyat & Portföy Teklifi" : "Price & Portfolio Pitch",
        output: isTr ? "Şifrelenmiş Birebir Paket" : "Encrypted 1:1 Bid Package",
      },
      highlightBadge: isTr ? "AES-256 Gizli Teklif" : "AES-256 Protected",
      accentColor: {
        text: "text-indigo-400",
        bg: "bg-indigo-500/10",
        border: "border-indigo-500/20",
        pill: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      },
    },
    {
      stepNumber: "03",
      stage: isTr ? "FAZ 3 • KIYASLAMA & EŞLEŞME" : "PHASE 3 • EVALUATION & MATCH",
      icon: Terminal,
      title: isTr
        ? "İnceleme, Kıyaslama & Teklif Kabulü"
        : "Cockpit Review & Milestone Match",
      shortDesc: isTr
        ? "İlan sahibi yönetim panelinde gelen şifreli teklifleri yan yana kıyaslar ve en doğru adayı tek tıkla onaylar."
        : "The project owner compares proposals side-by-side on their private dashboard and accepts the best fit.",
      clientPerspective: isTr
        ? "Gelen teklifleri bütçe, teslimat süresi, GitHub geçmişi ve önceki referanslar bazında objektifçe değerlendirip tek tıkla onaylar."
        : "Evaluate candidates side-by-side with GitHub commits, portfolio links, and timeline estimates.",
      freelancerPerspective: isTr
        ? "Teklifi kabul edilen yazılımcıya anında sistem bildirimi iletilir; projenin başlangıç aşamasına geçilir."
        : "The chosen developer gets instantly notified upon acceptance, triggering the direct engagement phase.",
      safeguard: isTr
        ? "Karar anına kadar iki tarafın gizliliği tam korunur; eşleşme onaylandığı anda ikili el sıkışma protokolü tetiklenir."
        : "Mutual privacy preserved until the decisive match; triggers the bilateral protocol immediately.",
      inputOutput: {
        input: isTr ? "Aday Değerlendirmesi" : "Candidate Benchmarking",
        output: isTr ? "Resmi Eşleşme Onayı" : "Official Match Confirmation",
      },
      highlightBadge: isTr ? "Objektif Kıyaslama" : "Objective Choice",
      accentColor: {
        text: "text-cyan-400",
        bg: "bg-cyan-500/10",
        border: "border-cyan-500/20",
        pill: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
      },
    },
    {
      stepNumber: "04",
      stage: isTr ? "FAZ 4 • EL SIKIŞMA & SÖZLEŞME" : "PHASE 4 • HANDSHAKE & CONTRACT",
      icon: Handshake,
      title: isTr
        ? "İkili Çalışma Alanı & Doğrudan İletişim"
        : "Bilateral Handshake & P2P Agreement",
      shortDesc: isTr
        ? "Eşleşme anında doğrudan telefon, e-posta, Slack/Discord açılır; Operis P2P Sözleşme Taslağı ile çerçeve belirlenir."
        : "Direct contact channels unlock instantly; parties execute custom milestone contracts with turnkey blueprints.",
      clientPerspective: isTr
        ? "Geliştiricinin doğrulanmış doğrudan iletişim kanallarına ulaşır; platform sansürü olmadan kendi çalışma araçlarına davet eder."
        : "Connect via direct phone, email, Slack, or Discord without platform keyword censorship or chat bans.",
      freelancerPerspective: isTr
        ? "Müşteri ile doğrudan konuşarak teknik detayları netleştirir; Operis P2P Hizmet Sözleşmesi ve NDA şablonuyla haklarını güvenceye alır."
        : "Clarify technical milestones directly and safeguard delivery scope with the Operis P2P Service Contract blueprint.",
      safeguard: isTr
        ? "Sansürsüz iletişim; platform içi hapsedilme yok. Hazır hukuki sözleşme şablonu iki tarafı da eşit korur."
        : "Zero communication restrictions. Battle-tested legal templates protect IP, scope, and milestone rights.",
      inputOutput: {
        input: isTr ? "Açık İletişim Kanalları" : "Direct Contact Channels",
        output: isTr ? "İmzalı P2P Sözleşme" : "Signed Bilateral Contract",
      },
      highlightBadge: isTr ? "Açık Kanallar & P2P" : "Direct & Unlocked",
      accentColor: {
        text: "text-purple-400",
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
        pill: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      },
    },
    {
      stepNumber: "05",
      stage: isTr ? "FAZ 5 • TESLİMAT & %100 ÖDEME" : "PHASE 5 • DELIVERY & ZERO-FEE",
      icon: Banknote,
      title: isTr
        ? "Geliştirme, Teslimat ve %100 Komisyonsuz Ödeme"
        : "Delivery & 100% Zero-Commission Settlement",
      shortDesc: isTr
        ? "Yazılımcı projeyi teslim eder; ödeme platform havuzunda bloke edilmeden doğrudan uzmanın hesabına %0 komisyonla geçer."
        : "Project deliverables are verified; payment transfers directly to the developer with 0% middleman escrow cuts.",
      clientPerspective: isTr
        ? "Projeyi GitHub/GitLab veya staging üzerinde inceler, kabul eder. Ödemeyi doğrudan banka transferi (IBAN / FAST) ile yapar; komisyon ödemez."
        : "Review live code on staging or GitHub, approve deliverables, and pay directly via bank transfer with 0% fee.",
      freelancerPerspective: isTr
        ? "Kazancından tek bir kuruş komisyon veya emanet kesintisi yapılmaz. Anlaşılan tutarın %100'ü doğrudan hesabına yatar."
        : "Keep 100% of your earnings. No platform escrow deductions, no 20% commission cuts, zero payout delays.",
      safeguard: isTr
        ? "%0 Komisyon ilkesi; platform fonları emanette tutmaz, bloke koymaz. Doğrudan bağımsız serbest piyasa modeli."
        : "Zero platform escrow hold-backs. Pure, autonomous peer-to-peer settlement at true market value.",
      inputOutput: {
        input: isTr ? "Doğrulanmış Kod & Teslimat" : "Verified Code Deliverables",
        output: isTr ? "%100 Net Kesintisiz Kazanç" : "100% Net Zero-Fee Payout",
      },
      highlightBadge: isTr ? "%0 Komisyon • %100 Net" : "0% Cut • 100% Net",
      accentColor: {
        text: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        pill: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      },
    },
  ];

  const currentStep: WorkflowStep =
    workflowSteps[activeStepIndex] ?? (workflowSteps[0] as WorkflowStep);

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="relative flex flex-col justify-center items-center w-full px-4 sm:px-6 lg:px-8 py-14 sm:py-20 snap-start scroll-mt-16 border-t border-[var(--color-border-subtle)]/40"
    >
      <div className="mx-auto max-w-7xl w-full space-y-10 sm:space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {isTr ? "UÇTAN UCA SÜREÇ REHBERİ" : "END-TO-END WORKFLOW BLUEPRINT"}
            </span>
          </div>

          <h2
            id="how-it-works-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-[1.15]"
          >
            {isTr ? (
              <>
                Bir Süreç Baştan Sona{" "}
                <span className="text-gradient-accent">Nasıl İşler?</span>
              </>
            ) : (
              <>
                How an Engagement Works{" "}
                <span className="text-gradient-accent">From Start to Finish</span>
              </>
            )}
          </h2>

          <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed max-w-2xl mx-auto">
            {isTr
              ? "İlk fikrin ilan haline gelmesinden şifreli tekliflere, doğrudan sözleşmeden komisyonsuz %100 net ödemeye kadar 5 aşamalı şeffaf yol haritası."
              : "From scope publication and encrypted blind offers to bilateral contracts and 100% direct settlement: an entirely transparent 5-phase journey."}
          </p>
        </div>

        {/* View Perspective Selector Tabs */}
        <div className="flex justify-center">
          <div className="inline-flex flex-wrap items-center justify-center p-1.5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-xl shadow-sm gap-1">
            <button
              type="button"
              onClick={() => setViewMode("end-to-end")}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                viewMode === "end-to-end"
                  ? "bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              {isTr ? "Uçtan Uca Genel Süreç (5 Faz)" : "Unified End-to-End (5 Phases)"}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("client")}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                viewMode === "client"
                  ? "bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              {isTr ? "İşveren Perspektifi" : "Client Perspective"}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("freelancer")}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                viewMode === "freelancer"
                  ? "bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              {isTr ? "Yazılımcı Perspektifi" : "Developer Perspective"}
            </button>
          </div>
        </div>

        {/* 5-Step Visual Progress Indicator Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 max-w-5xl mx-auto">
          {workflowSteps.map((step, idx) => {
            const isSelected = activeStepIndex === idx;
            const Icon = step.icon;
            return (
              <button
                key={step.stepNumber}
                type="button"
                onClick={() => setActiveStepIndex(idx)}
                className={`text-left p-3.5 rounded-xl border transition-all duration-300 flex flex-col justify-between gap-2 ${
                  isSelected
                    ? "border-blue-500/60 bg-blue-500/10 shadow-lg shadow-blue-500/10 scale-[1.03]"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/60 hover:bg-[var(--color-surface-hover)] opacity-75 hover:opacity-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-xs font-bold ${
                      isSelected ? "text-blue-400" : "text-[var(--color-text-tertiary)]"
                    }`}
                  >
                    {step.stepNumber}
                  </span>
                  <div
                    className={`h-6 w-6 rounded-lg flex items-center justify-center ${
                      isSelected
                        ? "bg-blue-500 text-white"
                        : "bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                </div>
                <div className="text-[11px] font-bold text-[var(--color-text-primary)] line-clamp-1">
                  {step.title.split("(")[0]}
                </div>
              </button>
            );
          })}
        </div>

        {/* Expanded Active Phase Deep-Dive Card */}
        <SpotlightCard className="p-6 sm:p-10 rounded-3xl border border-blue-500/30 bg-[var(--color-surface-base)]/90 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Stage details, badges and main explanation */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-mono font-bold ${currentStep.accentColor.pill}`}
                  >
                    {currentStep.stage}
                  </span>
                  <span className="inline-flex items-center rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-text-secondary)]">
                    {currentStep.highlightBadge}
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">
                  {currentStep.title}
                </h3>

                <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed">
                  {currentStep.shortDesc}
                </p>
              </div>

              {/* Perspective Content Switcher */}
              <div className="space-y-3 pt-2">
                {(viewMode === "end-to-end" || viewMode === "client") && (
                  <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/60 p-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
                      <Terminal className="h-4 w-4" aria-hidden="true" />
                      <span>{isTr ? "İşveren Rolü & Adımları" : "Client Action"}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[var(--color-text-primary)] leading-relaxed">
                      {currentStep.clientPerspective}
                    </p>
                  </div>
                )}

                {(viewMode === "end-to-end" || viewMode === "freelancer") && (
                  <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/60 p-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                      <Send className="h-4 w-4" aria-hidden="true" />
                      <span>{isTr ? "Yazılımcı Rolü & Adımları" : "Developer Action"}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[var(--color-text-primary)] leading-relaxed">
                      {currentStep.freelancerPerspective}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Concrete Inputs/Outputs & Security Guarantee */}
            <div className="lg:col-span-5 space-y-4 lg:border-l lg:border-[var(--color-border-subtle)]/70 lg:pl-8">
              {/* Input & Output Box */}
              <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/40 p-5 space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-tertiary)]">
                    {isTr ? "Aşama Girdisi (Input)" : "Phase Input"}
                  </span>
                  <div className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                    <Layers className="h-4 w-4 text-blue-400 shrink-0" aria-hidden="true" />
                    <span>{currentStep.inputOutput.input}</span>
                  </div>
                </div>

                <div className="h-px w-full bg-[var(--color-border-subtle)]/60" />

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-tertiary)]">
                    {isTr ? "Somut Çıktı (Deliverable)" : "Concrete Output"}
                  </span>
                  <div className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{currentStep.inputOutput.output}</span>
                  </div>
                </div>
              </div>

              {/* Operis Trust & Safety Guarantee */}
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  <span>{isTr ? "Operis Sistem Güvencesi" : "Operis Trust Protocol"}</span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {currentStep.safeguard}
                </p>
              </div>

              {/* Phase Navigation Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setActiveStepIndex((prev) =>
                      prev === 0 ? workflowSteps.length - 1 : prev - 1
                    )
                  }
                  className="text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-3 py-1.5 rounded-lg border border-[var(--color-border-subtle)] transition-colors"
                >
                  {isTr ? "← Önceki Faz" : "← Prev Phase"}
                </button>

                <span className="text-xs font-mono text-[var(--color-text-tertiary)]">
                  {activeStepIndex + 1} / {workflowSteps.length}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setActiveStepIndex((prev) =>
                      prev === workflowSteps.length - 1 ? 0 : prev + 1
                    )
                  }
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 transition-colors"
                >
                  {isTr ? "Sonraki Faz →" : "Next Phase →"}
                </button>
              </div>
            </div>
          </div>
        </SpotlightCard>

        {/* 5-Step Cards Grid for Rapid Scanning */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {workflowSteps.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = activeStepIndex === idx;
            return (
              <SpotlightCard
                key={step.stepNumber}
                onClick={() => setActiveStepIndex(idx)}
                className={`p-5 rounded-2xl flex flex-col justify-between cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? "border-blue-500/50 bg-blue-500/5 scale-[1.02]"
                    : "hover:border-[var(--color-border-strong)]"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xl font-extrabold text-blue-400/80">
                      {step.stepNumber}
                    </span>
                    <div
                      className={`h-8 w-8 rounded-xl flex items-center justify-center ${step.accentColor.bg} ${step.accentColor.text}`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-[var(--color-text-primary)] line-clamp-2">
                    {step.title}
                  </h4>
                  <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-3 leading-relaxed">
                    {step.shortDesc}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-[var(--color-border-subtle)]/60 flex items-center justify-between text-[10px]">
                  <span className="text-[var(--color-text-tertiary)] font-mono">
                    {(step.stage.split("•")[0] ?? "").trim()}
                  </span>
                  <span className="text-blue-400 font-semibold flex items-center gap-1">
                    <span>{isTr ? "İncele" : "View"}</span>
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </span>
                </div>
              </SpotlightCard>
            );
          })}
        </div>

        {/* Action Footer Call to Action */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link href={getLocalizedRoute("newListing", locale)} className="w-full sm:w-auto">
            <Button variant="shimmer" size="md" className="w-full sm:w-auto gap-2">
              <span>{isTr ? "Hemen İlanını Yayınla" : "Post a Project Now"}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <Link href={getLocalizedRoute("listings", locale)} className="w-full sm:w-auto">
            <Button variant="secondary" size="md" className="w-full sm:w-auto">
              <span>{isTr ? "Canlı İlanları İncele" : "Explore Active Projects"}</span>
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
