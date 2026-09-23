"use client";

import { useState, useEffect } from "react";
import { Radar, Clock, Trash2, Sparkles } from "lucide-react";
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
  positionClass: string;
  floatClass: string;
}

interface RadarCohort {
  sectorLabel: string;
  blips: RadarBlip[];
  prunedText: string;
}

export function FreshnessRadarVisualizer({ isTr, locale: _locale }: FreshnessRadarVisualizerProps) {
  const [activeCohort, setActiveCohort] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const cohorts: RadarCohort[] = [
    {
      sectorLabel: isTr ? "Yazılım & Tasarım Akışı" : "Software & Design Feed",
      prunedText: isTr ? "Süre Doldu (Silindi)" : "Expired (Pruned)",
      blips: [
        {
          id: "c1-1",
          name: "Next.js SaaS",
          timeLeft: "42h",
          color: "emerald",
          positionClass: "top-[26%] left-[24%]",
          floatClass: "animate-bounce duration-1000",
        },
        {
          id: "c1-2",
          name: "UI/UX Figma",
          timeLeft: "98h",
          color: "cyan",
          positionClass: "top-[58%] right-[20%]",
          floatClass: "animate-pulse duration-700",
        },
        {
          id: "c1-3",
          name: "FastAPI Servis",
          timeLeft: "15h",
          color: "blue",
          positionClass: "bottom-[24%] left-[22%]",
          floatClass: "animate-bounce duration-1000",
        },
      ],
    },
    {
      sectorLabel: isTr ? "Yapay Zeka & Mobil Akışı" : "AI & Mobile Feed",
      prunedText: isTr ? "Hayalet İlan (Temizlendi)" : "Ghost Job (Pruned)",
      blips: [
        {
          id: "c2-1",
          name: "PyTorch LLM",
          timeLeft: "36h",
          color: "purple",
          positionClass: "top-[24%] left-[26%]",
          floatClass: "animate-pulse duration-700",
        },
        {
          id: "c2-2",
          name: "Flutter App",
          timeLeft: "72h",
          color: "emerald",
          positionClass: "top-[54%] right-[22%]",
          floatClass: "animate-bounce duration-1000",
        },
        {
          id: "c2-3",
          name: "PostgreSQL DB",
          timeLeft: "21h",
          color: "cyan",
          positionClass: "bottom-[26%] left-[24%]",
          floatClass: "animate-pulse duration-700",
        },
      ],
    },
    {
      sectorLabel: isTr ? "Büyüme & 3D Video Akışı" : "Growth & 3D Video Feed",
      prunedText: isTr ? "Zaman Aşımı (Silindi)" : "Time-Out (Pruned)",
      blips: [
        {
          id: "c3-1",
          name: "3D Blender",
          timeLeft: "60h",
          color: "cyan",
          positionClass: "top-[26%] left-[22%]",
          floatClass: "animate-bounce duration-1000",
        },
        {
          id: "c3-2",
          name: "B2B SaaS SEO",
          timeLeft: "84h",
          color: "emerald",
          positionClass: "top-[56%] right-[20%]",
          floatClass: "animate-pulse duration-700",
        },
        {
          id: "c3-3",
          name: "Solidity Web3",
          timeLeft: "12h",
          color: "blue",
          positionClass: "bottom-[24%] left-[26%]",
          floatClass: "animate-bounce duration-1000",
        },
      ],
    },
  ];

  // Rotate through cohorts every 4.5 seconds to sync with radar sweeps
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

  return (
    <section className="relative w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden snap-start scroll-mt-16">
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

              {/* 3 Metric Pills */}
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
              <div className="relative w-full max-w-[400px] aspect-square rounded-full border border-cyan-500/25 bg-[#05070d] p-6 shadow-2xl shadow-cyan-500/10 flex items-center justify-center overflow-hidden select-none">
                {/* Concentric Radar Distance Rings */}
                <div className="absolute inset-5 rounded-full border border-cyan-500/15" />
                <div className="absolute inset-16 rounded-full border border-cyan-500/20" />
                <div className="absolute inset-28 rounded-full border border-cyan-500/25" />
                <div className="absolute inset-38 rounded-full border border-cyan-500/30" />

                {/* Crosshairs Grid */}
                <div className="absolute inset-x-0 top-1/2 h-[1px] bg-cyan-500/20" />
                <div className="absolute inset-y-0 left-1/2 w-[1px] bg-cyan-500/20" />

                {/* Smooth Rotating Radar Sweep Cone */}
                <div 
                  className="absolute inset-0 rounded-full origin-center pointer-events-none"
                  style={{
                    animation: "spin 4.5s linear infinite",
                    background: "conic-gradient(from 0deg at 50% 50%, rgba(6, 182, 212, 0.45) 0deg, rgba(6, 182, 212, 0.05) 55deg, transparent 55deg)"
                  }}
                />

                {/* Dynamic Blip Cluster (Transitions smoothly every sweep) */}
                <div className={`absolute inset-0 transition-all duration-300 ${isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}>
                  {currentCohort.blips.map((blip) => {
                    const badgeStyles = {
                      emerald: "bg-emerald-950/85 text-emerald-300 border-emerald-500/35",
                      cyan: "bg-cyan-950/85 text-cyan-300 border-cyan-500/35",
                      blue: "bg-blue-950/85 text-blue-300 border-blue-500/35",
                      purple: "bg-purple-950/85 text-purple-300 border-purple-500/35",
                    }[blip.color];

                    const dotStyles = {
                      emerald: "bg-emerald-400",
                      cyan: "bg-cyan-400",
                      blue: "bg-blue-400",
                      purple: "bg-purple-400",
                    }[blip.color];

                    return (
                      <div
                        key={blip.id}
                        className={`absolute ${blip.positionClass} flex items-center gap-1.5 transition-transform duration-700 hover:scale-105 z-10`}
                      >
                        <span className="relative flex h-2.5 w-2.5 shrink-0">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotStyles}`} />
                          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dotStyles}`} />
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-medium border shadow-xs whitespace-nowrap ${badgeStyles}`}>
                          {blip.name} • {blip.timeLeft}
                        </span>
                      </div>
                    );
                  })}

                  {/* Pruned / Expired Job Marker */}
                  <div className="absolute top-[22%] right-[22%] flex items-center gap-1.5 opacity-40 z-10">
                    <Trash2 className="h-3 w-3 text-red-400 shrink-0" />
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-red-950/50 text-red-400 border border-red-500/20 line-through whitespace-nowrap">
                      {currentCohort.prunedText}
                    </span>
                  </div>
                </div>

                {/* Radar Core Hub */}
                <div className="relative z-20 flex h-11 w-11 items-center justify-center rounded-full bg-cyan-950/95 border border-cyan-400 text-cyan-300 shadow-xl shadow-cyan-500/50">
                  <Radar className="h-5 w-5" />
                </div>

                {/* Bottom Radar Status Readout */}
                <div className="absolute bottom-3 inset-x-0 text-center z-20 pointer-events-none">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-cyan-950/90 text-cyan-400 border border-cyan-500/40 shadow-xs">
                    TTL SCANNER ACTIVE • 168H MAX
                  </span>
                </div>
              </div>

              {/* Active Sector Cohort Indicator */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-950/40 text-[11px] text-[var(--color-text-secondary)]">
                <Sparkles className="h-3 w-3 text-cyan-400 animate-pulse" />
                <span className="font-medium text-cyan-300">{currentCohort.sectorLabel}</span>
                <span className="text-[10px] text-[var(--color-text-tertiary)]">({activeCohort + 1}/3)</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
