"use client";

import { useState, useEffect } from "react";
import { Radar, Clock, Trash2, Sparkles, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";

interface FreshnessRadarVisualizerProps {
  isTr: boolean;
  locale?: string;
}

interface RadarBlip {
  id: string;
  name: string;
  timeLeft: string;
  color: "emerald" | "cyan" | "blue" | "purple";
}

interface RadarCohort {
  sectorLabel: string;
  categoryName: string;
  prunedText: string;
  innerBlip: RadarBlip;
  midBlip: RadarBlip;
  outerBlip: RadarBlip;
}

export function FreshnessRadarVisualizer({ isTr, locale: _locale }: FreshnessRadarVisualizerProps) {
  const [activeCohort, setActiveCohort] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const cohorts: RadarCohort[] = [
    {
      sectorLabel: isTr ? "Yazılım & SaaS Akışı" : "Software & SaaS Feed",
      categoryName: isTr ? "Full Stack & Bulut" : "Full Stack & Cloud",
      prunedText: isTr ? "PHP 5.4 Script (Silindi)" : "PHP 5.4 Script (Pruned)",
      innerBlip: {
        id: "c1-inner",
        name: "Next.js 15 SaaS",
        timeLeft: "42h",
        color: "emerald",
      },
      midBlip: {
        id: "c1-mid",
        name: "FastAPI Servis",
        timeLeft: "18h",
        color: "blue",
      },
      outerBlip: {
        id: "c1-outer",
        name: isTr ? "Go Dağıtık Sistem" : "Go Distributed",
        timeLeft: "68h",
        color: "cyan",
      },
    },
    {
      sectorLabel: isTr ? "UI/UX & Tasarım Akışı" : "UI/UX & Design Feed",
      categoryName: isTr ? "Tasarım Sistemleri" : "Design Systems",
      prunedText: isTr ? "Logo Yarışması (İptal)" : "Logo Contest (Banned)",
      innerBlip: {
        id: "c2-inner",
        name: "Figma Design Sys",
        timeLeft: "86h",
        color: "cyan",
      },
      midBlip: {
        id: "c2-mid",
        name: "Mobile UX Flow",
        timeLeft: "34h",
        color: "purple",
      },
      outerBlip: {
        id: "c2-outer",
        name: "3D Blender Motion",
        timeLeft: "56h",
        color: "emerald",
      },
    },
    {
      sectorLabel: isTr ? "Yapay Zeka & LLM Akışı" : "AI & LLM Feed",
      categoryName: isTr ? "Otonom Ajanlar" : "Autonomous Agents",
      prunedText: isTr ? "Spam Botu (Engellendi)" : "Spam Bot (Blacklisted)",
      innerBlip: {
        id: "c3-inner",
        name: "RAG & LangChain",
        timeLeft: "16h",
        color: "purple",
      },
      midBlip: {
        id: "c3-mid",
        name: "Vector DB Qdrant",
        timeLeft: "48h",
        color: "cyan",
      },
      outerBlip: {
        id: "c3-outer",
        name: "Python AI Agent",
        timeLeft: "72h",
        color: "blue",
      },
    },
    {
      sectorLabel: isTr ? "Büyüme & Mobil Akışı" : "Growth & Mobile Feed",
      categoryName: isTr ? "Performans & App" : "Performance & App",
      prunedText: isTr ? "3 Aylık Ölü İlan (Silindi)" : "3mo Ghost Job (Pruned)",
      innerBlip: {
        id: "c4-inner",
        name: "Flutter iOS/Android",
        timeLeft: "62h",
        color: "emerald",
      },
      midBlip: {
        id: "c4-mid",
        name: "PostHog Funnel CRO",
        timeLeft: "28h",
        color: "blue",
      },
      outerBlip: {
        id: "c4-outer",
        name: "React Native App",
        timeLeft: "80h",
        color: "cyan",
      },
    },
  ];

  // Rotate through cohorts every 4.5 seconds to synchronize with the 360-degree radar sweep
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveCohort((prev) => (prev + 1) % cohorts.length);
        setIsTransitioning(false);
      }, 350);
    }, 4500);

    return () => clearInterval(interval);
  }, [cohorts.length]);

  const currentCohort = cohorts[activeCohort] ?? cohorts[0]!;

  const getColorStyles = (color: RadarBlip["color"]) => {
    switch (color) {
      case "emerald":
        return {
          dotBg: "bg-emerald-400",
          pingBg: "bg-emerald-400",
          badge: "bg-emerald-950/85 border-emerald-500/40 text-emerald-300 shadow-emerald-500/20",
        };
      case "cyan":
        return {
          dotBg: "bg-cyan-400",
          pingBg: "bg-cyan-400",
          badge: "bg-cyan-950/85 border-cyan-500/40 text-cyan-300 shadow-cyan-500/20",
        };
      case "blue":
        return {
          dotBg: "bg-blue-400",
          pingBg: "bg-blue-400",
          badge: "bg-blue-950/85 border-blue-500/40 text-blue-300 shadow-blue-500/20",
        };
      case "purple":
        return {
          dotBg: "bg-purple-400",
          pingBg: "bg-purple-400",
          badge: "bg-purple-950/85 border-purple-500/40 text-purple-300 shadow-purple-500/20",
        };
    }
  };

  const renderBlip = (blip: RadarBlip) => {
    const styles = getColorStyles(blip.color);
    return (
      <div
        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono border backdrop-blur-md shadow-lg select-none whitespace-nowrap transition-transform duration-300 hover:scale-110 pointer-events-auto cursor-default ${styles.badge}`}
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${styles.pingBg}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${styles.dotBg}`} />
        </span>
        <span className="font-semibold text-white/95">{blip.name}</span>
        <span className="text-[9px] opacity-75 font-mono">· {blip.timeLeft}</span>
      </div>
    );
  };

  return (
    <section className="relative w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden snap-start scroll-mt-16">
      {/* Inline styles for cinematic orbital radar rotation & counter-rotation */}
      <style>{`
        @keyframes operisRadarSweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes operisOrbitCW {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes operisOrbitCCW {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes operisCounterCW {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes operisCounterCCW {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .anim-radar-sweep {
          animation: operisRadarSweep 4.5s linear infinite;
        }
        .anim-orbit-inner {
          animation: operisOrbitCW 28s linear infinite;
        }
        .anim-counter-inner {
          animation: operisCounterCW 28s linear infinite;
        }
        .anim-orbit-mid {
          animation: operisOrbitCCW 36s linear infinite;
        }
        .anim-counter-mid {
          animation: operisCounterCCW 36s linear infinite;
        }
        .anim-orbit-outer {
          animation: operisOrbitCW 48s linear infinite;
        }
        .anim-counter-outer {
          animation: operisCounterCW 48s linear infinite;
        }
      `}</style>

      <div className="relative mx-auto max-w-6xl w-full">
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-2xl p-6 sm:p-12 shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Content Column: The Freshness Guarantee */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-xs font-semibold text-cyan-400">
                <Radar className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "6s" }} />
                <span>{isTr ? "7 GÜNLÜK CANLILIK PROTOKOLÜ" : "7-DAY FRESHNESS PROTOCOL"}</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
                {isTr ? "Ölü İlanlara Vakit Harcamayın, " : "Stop Wasting Time on Dead Listings, "}
                <span className="text-gradient-accent">
                  {isTr ? "Radarımız 7/24 Taze" : "Always Live & Verified"}
                </span>
              </h2>

              <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed">
                {isTr
                  ? "Klasik freelance sitelerinde 6 ay önce açılmış, projesi bitmiş veya unutulmuş hayalet ilan kalabalığı arasında kaybolursunuz. Operis'te hiçbir ilan 7 günden (168 saat) fazla açık kalamaz."
                  : "Legacy platforms are plagued by months-old ghost listings and abandoned projects. On Operis, every single listing automatically expires after 7 days (168 hours)."}
              </p>

              {/* Metric Highlights */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/40 space-y-1">
                  <div className="text-2xl font-bold text-cyan-400 font-display">168 Saat</div>
                  <div className="text-xs text-[var(--color-text-secondary)]">
                    {isTr ? "Maksimum İlan Ömrü" : "Strict Listing TTL"}
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/40 space-y-1">
                  <div className="text-2xl font-bold text-emerald-400 font-display">%0</div>
                  <div className="text-xs text-[var(--color-text-secondary)]">
                    {isTr ? "Hayalet İlan Oranı" : "Ghost Listings Tolerance"}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link href={isTr ? "/tr/akis" : "/en/feed"}>
                  <Button variant="primary" size="lg" className="w-full sm:w-auto gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{isTr ? "Canlı Radardaki İlanları Gör" : "Explore Active Radar Listings"}</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Interactive Dynamic Radar Column */}
            <div className="lg:col-span-6 flex flex-col justify-center items-center gap-4">
              <div className="relative w-full max-w-[390px] aspect-square rounded-full border border-cyan-500/30 bg-[#05070d] shadow-2xl shadow-cyan-500/10 flex items-center justify-center overflow-hidden select-none">
                
                {/* Concentric Reference Rings */}
                <div className="absolute inset-5 rounded-full border border-cyan-500/15 pointer-events-none" />
                <div className="absolute inset-16 rounded-full border border-cyan-500/20 pointer-events-none" />
                <div className="absolute inset-28 rounded-full border border-cyan-500/25 pointer-events-none" />
                <div className="absolute inset-38 rounded-full border border-cyan-500/30 pointer-events-none" />

                {/* Crosshairs Grid */}
                <div className="absolute inset-x-0 top-1/2 h-[1px] bg-cyan-500/20 pointer-events-none" />
                <div className="absolute inset-y-0 left-1/2 w-[1px] bg-cyan-500/20 pointer-events-none" />

                {/* Rotating Radar Sweep Cone with Phosphor Glow Trail */}
                <div 
                  className="absolute inset-0 rounded-full origin-center pointer-events-none anim-radar-sweep"
                  style={{
                    background: "conic-gradient(from 0deg at 50% 50%, rgba(34, 211, 238, 0.45) 0deg, rgba(6, 182, 212, 0.15) 30deg, rgba(6, 182, 212, 0.02) 65deg, transparent 65deg, transparent 360deg)"
                  }}
                />
                
                {/* Glowing Leading Needle on the Sweep Beam */}
                <div 
                  className="absolute inset-0 rounded-full origin-center pointer-events-none anim-radar-sweep"
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1.5px] h-1/2 bg-gradient-to-t from-cyan-400 to-cyan-200 shadow-[0_0_10px_#22d3ee]" />
                </div>

                {/* Dynamic Drifting Orbital Blip Cohort (Smooth Discovery Transition) */}
                <div 
                  className={`absolute inset-0 transition-all duration-300 pointer-events-none ${
                    isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
                  }`}
                >
                  {/* --- INNER ORBIT RING (Diameter: 32%, Radius: 16%, Clockwise) --- */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32%] h-[32%] rounded-full anim-orbit-inner pointer-events-none">
                    {/* Inner Blip positioned at 45 deg (top-right) */}
                    <div 
                      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                      style={{ top: "14.65%", left: "85.35%" }}
                    >
                      <div className="anim-counter-inner">
                        {renderBlip(currentCohort.innerBlip)}
                      </div>
                    </div>
                  </div>

                  {/* --- MID ORBIT RING (Diameter: 54%, Radius: 27%, Counter-Clockwise) --- */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[54%] h-[54%] rounded-full anim-orbit-mid pointer-events-none">
                    {/* Mid Blip positioned at 225 deg (bottom-left) */}
                    <div 
                      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                      style={{ top: "85.35%", left: "14.65%" }}
                    >
                      <div className="anim-counter-mid">
                        {renderBlip(currentCohort.midBlip)}
                      </div>
                    </div>

                    {/* Pruned/Expired Job Marker positioned at 315 deg (top-left) */}
                    <div 
                      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                      style={{ top: "14.65%", left: "14.65%" }}
                    >
                      <div className="anim-counter-mid">
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono bg-red-950/70 text-red-400 border border-red-500/30 line-through backdrop-blur-md select-none whitespace-nowrap shadow-xs">
                          <Trash2 className="h-2.5 w-2.5 text-red-400 shrink-0" />
                          <span>{currentCohort.prunedText}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* --- OUTER ORBIT RING (Diameter: 72%, Radius: 36%, Clockwise) --- */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[72%] h-[72%] rounded-full anim-orbit-outer pointer-events-none">
                    {/* Outer Blip positioned at 120 deg (bottom-right) */}
                    <div 
                      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                      style={{ top: "75%", left: "93.3%" }}
                    >
                      <div className="anim-counter-outer">
                        {renderBlip(currentCohort.outerBlip)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Radar Core Hub */}
                <div className="relative z-20 flex h-11 w-11 items-center justify-center rounded-full bg-cyan-950/95 border border-cyan-400 text-cyan-300 shadow-xl shadow-cyan-500/50 pointer-events-none">
                  <Radar className="h-5 w-5" />
                </div>

                {/* Bottom Radar Status Readout */}
                <div className="absolute bottom-3 inset-x-0 text-center z-20 pointer-events-none">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-cyan-950/90 text-cyan-400 border border-cyan-500/40 shadow-xs">
                    TTL SCANNER ACTIVE • 168H MAX
                  </span>
                </div>
              </div>

              {/* Active Sector Cohort Navigation / Indicator */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveCohort((prev) => (prev + 1) % cohorts.length)}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/50 hover:bg-cyan-900/60 text-xs text-[var(--color-text-secondary)] transition-all cursor-pointer shadow-sm hover:border-cyan-400/50 active:scale-95"
                  title={isTr ? "Sonraki sektörü keşfet" : "Discover next sector"}
                >
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                  <span className="font-semibold text-cyan-300">{currentCohort.sectorLabel}</span>
                  <span className="text-[10px] text-cyan-400/80 font-mono font-bold">({activeCohort + 1}/{cohorts.length})</span>
                  <ChevronRight className="h-3.5 w-3.5 text-cyan-400 ml-0.5" />
                </button>

                {/* Sector Cohort Dots */}
                <div className="flex items-center gap-1.5">
                  {cohorts.map((c, idx) => (
                    <button
                      key={c.sectorLabel}
                      type="button"
                      onClick={() => setActiveCohort(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        idx === activeCohort ? "w-5 bg-cyan-400 shadow-xs shadow-cyan-400" : "w-1.5 bg-cyan-900/60 hover:bg-cyan-700/60"
                      }`}
                      aria-label={c.sectorLabel}
                    />
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

