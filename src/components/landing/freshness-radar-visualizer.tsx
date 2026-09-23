import { Radar, Clock, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";

interface FreshnessRadarVisualizerProps {
  isTr: boolean;
  locale?: string;
}

export function FreshnessRadarVisualizer({ isTr, locale: _locale }: FreshnessRadarVisualizerProps) {
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

            {/* Right Interactive Radar Graphic Column */}
            <div className="lg:col-span-6 flex justify-center items-center">
              <div className="relative w-full max-w-[420px] aspect-square rounded-full border border-cyan-500/20 bg-[#07090e] p-6 shadow-2xl shadow-cyan-500/10 flex items-center justify-center overflow-hidden">
                {/* Concentric Radar Rings */}
                <div className="absolute inset-4 rounded-full border border-cyan-500/15" />
                <div className="absolute inset-16 rounded-full border border-cyan-500/20" />
                <div className="absolute inset-28 rounded-full border border-cyan-500/25" />
                <div className="absolute inset-40 rounded-full border border-cyan-500/30" />

                {/* Crosshairs */}
                <div className="absolute inset-x-0 top-1/2 h-[1px] bg-cyan-500/20" />
                <div className="absolute inset-y-0 left-1/2 w-[1px] bg-cyan-500/20" />

                {/* Rotating Radar Sweep Cone */}
                <div 
                  className="absolute inset-0 rounded-full origin-center animate-spin pointer-events-none"
                  style={{
                    animationDuration: "5s",
                    animationTimingFunction: "linear",
                    background: "conic-gradient(from 0deg at 50% 50%, rgba(6, 182, 212, 0.4) 0deg, rgba(6, 182, 212, 0) 65deg, transparent 65deg)"
                  }}
                />

                {/* Live Listing Blips (Active) */}
                <div className="absolute top-[28%] left-[34%] flex items-center gap-1.5 group cursor-pointer">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                    Next.js • 42h kaldı
                  </span>
                </div>

                <div className="absolute top-[62%] right-[22%] flex items-center gap-1.5 group cursor-pointer">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                    UI/UX • 98h kaldı
                  </span>
                </div>

                <div className="absolute bottom-[24%] left-[28%] flex items-center gap-1.5 group cursor-pointer">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950/80 text-blue-300 border border-blue-500/30">
                    FastAPI • 15h kaldı
                  </span>
                </div>

                {/* Expired / Pruned Signal (Demonstrating Auto-Purge) */}
                <div className="absolute top-[20%] right-[26%] flex items-center gap-1.5 opacity-40">
                  <Trash2 className="h-3 w-3 text-red-400" />
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-red-950/40 text-red-400 line-through">
                    Süre Doldu (Silindi)
                  </span>
                </div>

                {/* Radar Center Hub */}
                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-950/90 border border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/40">
                  <Radar className="h-6 w-6" />
                </div>

                {/* Bottom Radar Status Readout */}
                <div className="absolute bottom-4 inset-x-0 text-center">
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-950/90 text-cyan-400 border border-cyan-500/40">
                    TTL SCANNER ACTIVE • 168H MAX
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
