"use client";

import { useState, useEffect } from "react";
import { Clock, RefreshCw, Archive, CheckCircle2, Calendar } from "lucide-react";

function getLifecyclePointRadius(current: boolean, passed: boolean): string {
  if (current) return "6.5";
  if (passed) return "5.5";
  return "4";
}

function getLifecyclePointStroke(current: boolean, passed: boolean): string {
  if (current) return "#ffffff";
  if (passed) return "#22d3ee";
  return "var(--color-border-strong)";
}

export function LifecycleRadarDiagram({ isTr = true }: { isTr?: boolean }) {
  const [activeDay, setActiveDay] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveDay((prev) => (prev >= 7 ? 1 : prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const rawDays = [
    { num: 1, label: isTr ? "1. Gün" : "Day 1" },
    { num: 2, label: isTr ? "2. Gün" : "Day 2" },
    { num: 3, label: isTr ? "3. Gün" : "Day 3" },
    { num: 4, label: isTr ? "4. Gün" : "Day 4" },
    { num: 5, label: isTr ? "5. Gün" : "Day 5" },
    { num: 6, label: isTr ? "6. Gün" : "Day 6" },
    { num: 7, label: isTr ? "7. Gün" : "Day 7" },
  ];

  const days = rawDays.map((item) => ({
    ...item,
    passed: item.num <= activeDay,
    current: item.num === activeDay,
  }));

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 p-4 sm:p-8 backdrop-blur-xl shadow-2xl">
      {/* Top Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 shadow-sm">
            <Clock className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">
              {isTr ? "1 Haftalık Canlılık Radarı" : "1-Week Freshness Radar"}
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              {isTr
                ? "Bayatlamayan taze pazar: 1 haftalık otomatik aktiflik ve tek tıkla ücretsiz yenileme"
                : "Zero stale listings: 1-week automated freshness and one-click free extension"}
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-medium text-cyan-400 shadow-sm">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          <span>{isTr ? "Sürekli Güncel Akış" : "Always Fresh Feed"}</span>
        </div>
      </div>

      {/* Main Interactive Radar Area */}
      <div className="relative flex flex-col lg:flex-row items-center justify-around gap-8 py-4">
        {/* Radar SVG Visualizer */}
        <div className="relative flex w-full max-w-[256px] aspect-square items-center justify-center shrink-0 mx-auto">
          {/* Rotating Radar Sweep Cone (7s duration matching 7 days) */}
          <div
            aria-hidden="true"
            className="absolute inset-2 rounded-full animate-radar-sweep pointer-events-none [animation-duration:7s] [background:conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(6,182,212,0.28)_360deg)]"
          />

          {/* SVG Concentric Rings & Dynamic Radar Markers */}
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="radarArcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.95" />
              </linearGradient>
            </defs>

            {/* Outer Ring */}
            <circle
              cx="100"
              cy="100"
              r="88"
              stroke="var(--color-border-subtle)"
              strokeWidth="1.5"
              strokeDasharray="4 6"
            />
            {/* Middle Ring */}
            <circle cx="100" cy="100" r="60" stroke="var(--color-border-subtle)" strokeWidth="1" />
            {/* Inner Ring */}
            <circle cx="100" cy="100" r="34" stroke="var(--color-border-subtle)" strokeWidth="1" />

            {/* Dynamic Progress Arc connecting the active blue dots */}
            <circle
              cx="100"
              cy="100"
              r="74"
              fill="none"
              stroke="url(#radarArcGrad)"
              strokeWidth="1.5"
              strokeDasharray="465"
              strokeDashoffset={465 - (465 * activeDay) / 7}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
              transform="rotate(-90 100 100)"
              opacity="0.85"
            />

            {/* Radar Crosshairs */}
            <line
              x1="100"
              y1="12"
              x2="100"
              y2="188"
              stroke="var(--color-border-subtle)"
              strokeWidth="0.75"
              strokeDasharray="2 4"
            />
            <line
              x1="12"
              y1="100"
              x2="188"
              y2="100"
              stroke="var(--color-border-subtle)"
              strokeWidth="0.75"
              strokeDasharray="2 4"
            />

            {/* 7 Days Progress Markers */}
            {days.map((item, idx) => {
              const angle = (idx / 7) * 2 * Math.PI - Math.PI / 2;
              const cx = 100 + 74 * Math.cos(angle);
              const cy = 100 + 74 * Math.sin(angle);
              return (
                <g key={item.num} className="cursor-pointer" onClick={() => setActiveDay(item.num)}>
                  {item.current && (
                    <>
                      {/* Concentric Sonar Pulse Wave 1 */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r="6"
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth="2"
                        opacity="0.8"
                      >
                        <animate
                          attributeName="r"
                          values="6;22"
                          dur="1.5s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          values="0.8;0"
                          dur="1.5s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="stroke-width"
                          values="2;0.5"
                          dur="1.5s"
                          repeatCount="indefinite"
                        />
                      </circle>
                      {/* Concentric Sonar Pulse Wave 2 (delayed phase) */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r="6"
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="1.5"
                        opacity="0.6"
                      >
                        <animate
                          attributeName="r"
                          values="6;22"
                          begin="0.75s"
                          dur="1.5s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          values="0.6;0"
                          begin="0.75s"
                          dur="1.5s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="stroke-width"
                          values="1.5;0.5"
                          begin="0.75s"
                          dur="1.5s"
                          repeatCount="indefinite"
                        />
                      </circle>
                      {/* Luminous beacon core glow */}
                      <circle cx={cx} cy={cy} r="9" fill="#06b6d4" opacity="0.35">
                        <animate
                          attributeName="r"
                          values="8;12;8"
                          dur="1.5s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          values="0.25;0.55;0.25"
                          dur="1.5s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    </>
                  )}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={getLifecyclePointRadius(item.current, item.passed)}
                    fill={item.passed ? "#06b6d4" : "var(--color-surface-elevated)"}
                    stroke={getLifecyclePointStroke(item.current, item.passed)}
                    strokeWidth={item.current ? "2" : "1.5"}
                    className={`transition-all duration-500 ease-out ${
                      item.passed ? "[filter:drop-shadow(0_0_5px_rgba(6,182,212,0.9))]" : ""
                    }`}
                  />
                </g>
              );
            })}
          </svg>

          {/* Radar Center Status */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center pointer-events-none select-none">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
              <Calendar className="h-3 w-3 animate-pulse" aria-hidden="true" />
              <span>{isTr ? `Döngü • ${activeDay}. Gün` : `Cycle • Day ${activeDay}`}</span>
            </div>
            <div className="font-display text-xl sm:text-2xl font-black text-[var(--color-text-primary)] tracking-tight drop-shadow-sm">
              {isTr ? "1 HAFTA" : "1 WEEK"}
            </div>
            <div className="text-[10px] font-medium text-[var(--color-text-tertiary)]">
              {isTr ? "Canlı İlan Süresi" : "Active Listing Duration"}
            </div>
          </div>
        </div>

        {/* Lifecycle Milestones: Clear Value for Users */}
        <div className="flex flex-col gap-3.5 max-w-md w-full">
          <div className="flex items-start gap-3.5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/60 p-4 transition-colors hover:border-cyan-500/30">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--color-text-primary)]">
                {isTr ? "1 Hafta Boyunca Akışta En Üstte" : "Top of the Feed for 1 Full Week"}
              </div>
              <div className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                {isTr
                  ? "Yayınlanan ilanınız 1 hafta boyunca canlı kalır, ilgili kategorideki uzman geliştiricilere anında önerilir."
                  : "Your published listing stays live for 1 week and is actively recommended to relevant engineers."}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3.5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/60 p-4 transition-colors hover:border-amber-500/30">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--color-text-primary)]">
                {isTr ? "Tek Tıkla Ücretsiz Süre Uzatma" : "One-Click Free Duration Extension"}
              </div>
              <div className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                {isTr
                  ? "1 hafta bittiğinde ilanınız asla silinmez; panelinizden tek bir tıkla süresini 1 hafta daha ücretsiz uzatabilirsiniz."
                  : "When 1 week expires, your listing is never deleted; extend it for another week free with a single click."}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3.5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/60 p-4 transition-colors hover:border-emerald-500/30">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Archive className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--color-text-primary)]">
                {isTr ? "Terk Edilmiş veya Bayat İlan Yok" : "Zero Stale or Abandoned Listings"}
              </div>
              <div className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                {isTr
                  ? "Yanıt verilmeyen ve atıl kalan eski projeler otomatik arşivlenir; sitede yalnızca gerçekten aktif işler listelenir."
                  : "Unresponsive or abandoned projects are automatically pruned; only truly active listings are ever shown."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
