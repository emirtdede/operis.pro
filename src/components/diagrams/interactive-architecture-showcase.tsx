"use client";

import { useState } from "react";
import { Lock, Clock, Zap } from "lucide-react";
import { BilateralMatchDiagram } from "./bilateral-match-diagram";
import { LifecycleRadarDiagram } from "./lifecycle-radar-diagram";
import { DirectNetworkDiagram } from "./direct-network-diagram";

export function InteractiveArchitectureShowcase({ isTr = true }: { isTr?: boolean }) {
  const [activeTab, setActiveTab] = useState<"bilateral" | "lifecycle" | "direct">("bilateral");

  const tabs = [
    {
      id: "bilateral" as const,
      label: isTr ? "Birebir Gizli Teklif" : "Encrypted Blind Offers",
      sublabel: isTr ? "Rakiplere Kapalı Özel Fiyat" : "Private & Confidential",
      icon: Lock,
      color: "text-blue-500",
      activeBg: "bg-blue-500/10 border-blue-500/40 text-blue-500",
    },
    {
      id: "lifecycle" as const,
      label: isTr ? "1 Haftalık Canlılık Radarı" : "1-Week Freshness Radar",
      sublabel: isTr ? "Sürekli Güncel Projeler" : "Zero Stale Listings",
      icon: Clock,
      color: "text-cyan-500",
      activeBg: "bg-cyan-500/10 border-cyan-500/40 text-cyan-500",
    },
    {
      id: "direct" as const,
      label: isTr ? "Doğrudan İş Birliği" : "Direct Collaboration",
      sublabel: isTr ? "%0 Komisyon, Net Kazanç" : "0% Fee, Direct Net",
      icon: Zap,
      color: "text-violet-500",
      activeBg: "bg-violet-500/10 border-violet-500/40 text-violet-500",
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Tab Navigation Pill Selector */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`group flex items-center gap-3 rounded-2xl border px-5 py-3 text-left transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                isActive
                  ? tab.activeBg
                  : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/60 text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  isActive
                    ? "bg-current/10"
                    : "bg-[var(--color-surface-hover)] group-hover:bg-current/10"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[var(--color-text-primary)]">
                  {tab.label}
                </div>
                <div className="text-[10px] text-[var(--color-text-tertiary)]">{tab.sublabel}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Dynamic Diagram Viewport with Smooth Animated Transition */}
      <div key={activeTab} className="animate-tab-fade">
        {activeTab === "bilateral" && <BilateralMatchDiagram isTr={isTr} />}
        {activeTab === "lifecycle" && <LifecycleRadarDiagram isTr={isTr} />}
        {activeTab === "direct" && <DirectNetworkDiagram isTr={isTr} />}
      </div>
    </div>
  );
}
