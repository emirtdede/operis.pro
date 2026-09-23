"use client";

import { useState } from "react";
import { 
  FileText, 
  Lock, 
  Handshake, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";

interface ProtocolFlowVisualizerProps {
  isTr: boolean;
  locale?: string;
}

export function ProtocolFlowVisualizer({ isTr, locale: _locale }: ProtocolFlowVisualizerProps) {
  const [activeNode, setActiveNode] = useState<number>(0);

  const steps = [
    {
      id: "step-1",
      number: "01",
      title: isTr ? "İlan Yayını & 168 Saatlik Canlılık" : "Listing Publish & 168h Freshness",
      subtitle: isTr ? "Sıfır Hayalet İlan Garantisi" : "Zero Ghost Listings Protocol",
      icon: FileText,
      color: "from-blue-500 to-cyan-400",
      accentHex: "#38bdf8",
      glowBg: "rgba(56, 189, 248, 0.15)",
      badge: isTr ? "Adım 1: Başlangıç" : "Step 1: Inception",
      description: isTr
        ? "İşveren projesinin teknik kapsamını, bütçesini ve teslim takvimini tanımlar. İlan yayına girdiği an 168 saatlik (7 gün) geri sayım başlar. Süresi dolan ilanlar otomatik olarak pasifleştirilir."
        : "The client defines project scope, tech stack, and budget. Upon publishing, a 168-hour (7-day) freshness countdown activates. Expired listings are pruned automatically.",
      features: isTr
        ? [
            "10 sektör ve 110 uzmanlık alanına anında radar dağıtımı",
            "Maksimum 7 gün canlılık — aylar öncesinin ölü ilanları yok",
            "Kredi kartı veya ön ödeme gerekmez; 2 dakikada yayında"
          ]
        : [
            "Instant broadcast across 10 sectors & 110 categories",
            "Strict 7-day TTL — no stale, forgotten ghost listings",
            "No credit card or upfront deposit required; live in 2 mins"
          ],
      codeSnippet: isTr
        ? `// OPERİS PROTOKOLÜ: İLAN CANLILIK KURALI\nconst listing = {\n  ttl: 168 * 3600, // 7 gün canlılık\n  autoPrune: true,\n  ghostListingAllowed: false\n};`
        : `// OPERIS PROTOCOL: FRESHNESS RULE\nconst listing = {\n  ttl: 168 * 3600, // 7-day TTL\n  autoPrune: true,\n  ghostListingAllowed: false\n};`
    },
    {
      id: "step-2",
      number: "02",
      title: isTr ? "AES-256 Şifreli Kör Teklif Mimarisi" : "AES-256 Encrypted Blind Proposals",
      subtitle: isTr ? "Fiyat Kırma Karşıtı Kriptografik Kasa" : "Anti-Underbidding Cryptographic Vault",
      icon: Lock,
      color: "from-indigo-500 to-violet-500",
      accentHex: "#818cf8",
      glowBg: "rgba(129, 140, 248, 0.15)",
      badge: isTr ? "Adım 2: Güvenlik" : "Step 2: Security",
      description: isTr
        ? "Yetenekler ilanı inceler ve tekliflerini hazırlar. Teklif mektubu ve fiyat tutarı AES-256 ile şifrelenir. Rakipler teklifinizi asla göremez; fiyat kırma savaşları yerine teknik yetkinlik konuşur."
        : "Independent talents submit detailed bids sealed with AES-256 encryption. Competitors cannot view prices or cover letters, completely eliminating public price-slashing wars.",
      features: isTr
        ? [
            "Uçtan uca şifreli şeffaf teklif sandığı",
            "Açık artırma ve fiyat kırma manipülasyonlarına kesin son",
            "Yalnızca ilan sahibi tarafından çözülebilen teklif verisi"
          ]
        : [
            "End-to-end encrypted proposal vault",
            "Defeats race-to-the-bottom underbidding wars",
            "Decrypted strictly by the project owner only"
          ],
      codeSnippet: isTr
        ? `// OPERİS PROTOKOLÜ: KÖR TEKLİF MÜHRÜ\nconst proposal = await encryptAES256({\n  price: confidential,\n  terms: sealedCoverLetter,\n  visibleToCompetitors: false\n});`
        : `// OPERIS PROTOCOL: BLIND BID SEAL\nconst proposal = await encryptAES256({\n  price: confidential,\n  terms: sealedCoverLetter,\n  visibleToCompetitors: false\n});`
    },
    {
      id: "step-3",
      number: "03",
      title: isTr ? "Doğrudan İletişim & %0 Komisyon" : "Direct Channels & 0% Commission",
      subtitle: isTr ? "Emanetsiz & P2P Özgür İş Birliği" : "Escrowless & P2P Independent Matching",
      icon: Handshake,
      color: "from-emerald-400 to-teal-500",
      accentHex: "#34d399",
      glowBg: "rgba(52, 211, 153, 0.15)",
      badge: isTr ? "Adım 3: Tamamlanma" : "Step 3: Fulfillment",
      description: isTr
        ? "İşveren teklifleri kıyaslayıp kabul ettiği anda tarafların doğrulanmış iletişim bilgileri (Telefon, WhatsApp, E-posta) açılır. Paranızı platformda bloke etmeyiz; ödemenizi dilediğiniz gibi doğrudan yaparsınız."
        : "When the client accepts a proposal, verified direct contact channels (Phone, WhatsApp, Email) unlock instantly. No funds held in escrow; 100% direct settlement.",
      features: isTr
        ? [
            "Ne işverenden ne uzmandan 1 TL bile komisyon kesilmez",
            "Sansürsüz doğrudan telefon, e-posta ve WhatsApp paylaşımı",
            "Kendi araçlarınızla (Slack, Notion, GitHub) özgür çalışma"
          ]
        : [
            "0% commission deducted from both parties",
            "Uncensored direct communication channels unlocked",
            "Work with your own preferred tools (Slack, Notion, GitHub)"
          ],
      codeSnippet: isTr
        ? `// OPERİS PROTOKOLÜ: %0 KESİNTİ PROTOKOLÜ\nconst settlement = {\n  platformCommission: 0.00,\n  talentEarningsRatio: 1.00,\n  escrowLock: false\n};`
        : `// OPERIS PROTOCOL: 0% COMMISSION RULE\nconst settlement = {\n  platformCommission: 0.00,\n  talentEarningsRatio: 1.00,\n  escrowLock: false\n};`
    }
  ];

  const currentStep = steps[activeNode] ?? steps[0]!;

  return (
    <section className="relative w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden snap-start scroll-mt-16">
      {/* Ambient Glows */}
      <div 
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-[140px] opacity-20 transition-all duration-700"
        style={{ background: currentStep.accentHex }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl w-full space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-xs font-semibold text-blue-400">
            <Zap className="h-3.5 w-3.5 text-blue-400" />
            <span>{isTr ? "MİMARİ VE PROTOKOL HATTI" : "ARCHITECTURE & PROTOCOL PIPELINE"}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
            {isTr ? "Süreç Nasıl Akıyor? " : "How Does It Flow? "}
            <span className="text-gradient-accent">
              {isTr ? "3 Adımlı Protokol" : "3-Step Protocol"}
            </span>
          </h2>

          <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed">
            {isTr
              ? "Geleneksel pazar yerlerinin hantal komisyon ve emanet havuzlarını devre dışı bırakan, matematiksel olarak şeffaf doğrudan eşleşme akışı."
              : "A mathematically transparent direct-matching pipeline that bypasses the friction, commission cuts, and escrow delays of legacy platforms."}
          </p>
        </div>

        {/* ==============================================================
            INTERACTIVE SVG PIPELINE CONNECTOR (Desktop & Tablet)
           ============================================================== */}
        <div className="relative hidden md:block w-full">
          {/* SVG Connection Cables with Animated Flowing Signals */}
          <div className="relative w-full max-w-4xl mx-auto h-24 flex items-center justify-between px-12">
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none" 
              viewBox="0 0 800 96" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Static Track 1 */}
              <line 
                x1="120" y1="48" x2="400" y2="48" 
                stroke="var(--color-border-subtle)" 
                strokeWidth="2" 
                strokeDasharray="4 4"
              />
              {/* Static Track 2 */}
              <line 
                x1="400" y1="48" x2="680" y2="48" 
                stroke="var(--color-border-subtle)" 
                strokeWidth="2" 
                strokeDasharray="4 4"
              />

              {/* Dynamic Animated Pulse Line (Active Track) */}
              <line 
                x1="120" y1="48" x2="680" y2="48" 
                stroke="url(#pipelineGrad)" 
                strokeWidth="2.5" 
                className="animate-pulse"
                strokeDasharray="8 8"
              />

              <defs>
                <linearGradient id="pipelineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="50%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
            </svg>

            {/* Step Nodes along the line */}
            {steps.map((st, idx) => {
              const Icon = st.icon;
              const isActive = activeNode === idx;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setActiveNode(idx)}
                  className={`group relative z-10 flex flex-col items-center gap-2 cursor-pointer transition-all duration-300 focus:outline-none`}
                  aria-label={st.title}
                >
                  <div 
                    className={`relative flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-300 ${
                      isActive 
                        ? "border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/30 scale-110" 
                        : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] hover:border-[var(--color-border-strong)] hover:scale-105"
                    }`}
                  >
                    <Icon className={`h-6 w-6 transition-colors ${isActive ? "text-white" : "text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]"}`} />
                    <span 
                      className={`absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                        isActive 
                          ? "bg-blue-500 text-white shadow-md shadow-blue-500/50" 
                          : "bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] border border-[var(--color-border-subtle)]"
                      }`}
                    >
                      {st.number}
                    </span>
                  </div>

                  <span className={`text-xs font-bold transition-colors ${isActive ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-secondary)]"}`}>
                    {st.title.split("&")[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Step Switcher */}
        <div className="flex md:hidden items-center justify-center gap-2 p-1.5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
          {steps.map((st, idx) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setActiveNode(idx)}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeNode === idx 
                  ? "bg-blue-600 text-white shadow-md" 
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              {st.number}. {st.title.split("&")[0]}
            </button>
          ))}
        </div>

        {/* ==============================================================
            ACTIVE NODE TELEMETRY & ARCHITECTURAL DETAIL STAGE
           ============================================================== */}
        <div className="relative rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/90 backdrop-blur-2xl p-6 sm:p-10 shadow-2xl transition-all duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Deep Protocol Explanation */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: currentStep.glowBg, color: currentStep.accentHex }}>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>{currentStep.badge}</span>
                  <span className="text-[var(--color-border-strong)]">•</span>
                  <span>{currentStep.subtitle}</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)]">
                  {currentStep.title}
                </h3>

                <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed">
                  {currentStep.description}
                </p>
              </div>

              {/* Value Deliverables list */}
              <ul className="space-y-3 pt-2">
                {currentStep.features.map((feat, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-3 text-sm text-[var(--color-text-primary)]">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: currentStep.accentHex }} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap items-center gap-4">
                <Link href={isTr ? "/tr/akis" : "/en/feed"}>
                  <Button variant="primary" size="md" className="gap-2">
                    <span>{isTr ? "Canlı Protokolü İncele" : "Explore Live Protocol"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>

                <Link href={isTr ? "/tr/yardim#nasil-calisir" : "/en/help#how-it-works"}>
                  <Button variant="ghost" size="md" className="gap-2 text-[var(--color-text-secondary)]">
                    <span>{isTr ? "Detaylı Dokümantasyon" : "Technical Specs"}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column: Code & Cryptographic Console Terminal */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl border border-[var(--color-border-subtle)] bg-[#0a0c10] p-4 sm:p-5 shadow-inner overflow-hidden font-mono text-xs">
                {/* Console Bar */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 text-[var(--color-text-tertiary)]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">operis-core.ts</span>
                </div>

                {/* Preformatted Code Visualizer */}
                <pre className="text-slate-300 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                  <code>{currentStep.codeSnippet}</code>
                </pre>

                {/* Live Terminal Status Tag */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>{isTr ? "Protokol Aktif" : "Protocol Active"}</span>
                  </div>
                  <span className="text-slate-500">v1.2.0 • Zero Escrow</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
