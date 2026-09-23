"use client";

import { Percent, Clock, Lock, MessageSquare, ShieldCheck } from "lucide-react";

interface PlatformProtocolStripProps {
  isTr?: boolean;
}

export function PlatformProtocolStrip({ isTr = true }: PlatformProtocolStripProps) {
  const protocolPillars = [
    {
      icon: Percent,
      title: "%0 Komisyon",
      badge: isTr ? "Sıfır Kesinti" : "0% Escrow Fee",
      desc: isTr
        ? "Ne yazılımcıdan ne işverenden komisyon alınır. Platform para tutmaz; kazancın %100'ü doğrudan uzmana aittir."
        : "No cuts from client or engineer. Platform holds no funds; 100% of the value remains with counterparties.",
      accent: "text-emerald-400",
      borderGlow: "group-hover:border-emerald-500/40",
      bgGlow: "bg-emerald-500/10",
    },
    {
      icon: Clock,
      title: isTr ? "7 Günlük Canlılık" : "7-Day Freshness",
      badge: isTr ? "Sıfır Hayalet İlan" : "Zero Ghost Jobs",
      desc: isTr
        ? "Tüm ilanlar maksimum 168 saat aktiftir. Unutulmuş ölü ilanlara teklif harcamazsınız; her ilan sahibi aktiftir."
        : "All listings stay active for max 168 hours. No wasted bids on stale jobs; every posting is fresh and active.",
      accent: "text-cyan-400",
      borderGlow: "group-hover:border-cyan-500/40",
      bgGlow: "bg-cyan-500/10",
    },
    {
      icon: Lock,
      title: isTr ? "AES-256-GCM" : "AES-256-GCM",
      badge: isTr ? "Kör Teklif Güvencesi" : "Encrypted Proposals",
      desc: isTr
        ? "Teklifiniz yalnızca ilan sahibi tarafından çözülebilir. Rakipler fiyatınızı göremez; fiyat kırma savaşı yaşanmaz."
        : "Proposals are readable solely by the project owner. Competitors never see rates; no race-to-the-bottom bidding.",
      accent: "text-indigo-400",
      borderGlow: "group-hover:border-indigo-500/40",
      bgGlow: "bg-indigo-500/10",
    },
    {
      icon: MessageSquare,
      title: isTr ? "Doğrudan İletişim" : "Direct Channels",
      badge: isTr ? "Sansürsüz Bağlantı" : "Uncensored Handshake",
      desc: isTr
        ? "Eşleşme sağlandığı an doğrulanmış telefon, e-posta ve WhatsApp bilgileri açılır. Kendi araçlarınızla çalışırsınız."
        : "Instant access to verified WhatsApp, phone, Slack, and email upon mutual match. Collaborate using your own tools.",
      accent: "text-blue-400",
      borderGlow: "group-hover:border-blue-500/40",
      bgGlow: "bg-blue-500/10",
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-4 sm:py-6">
      <div className="relative overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-xl p-5 sm:p-7 shadow-xl shadow-blue-500/5">
        <div
          className="pointer-events-none absolute -left-16 -top-16 h-36 w-36 rounded-full bg-blue-500/10 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-16 -bottom-16 h-36 w-36 rounded-full bg-emerald-500/10 blur-2xl"
          aria-hidden="true"
        />

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-5 border-b border-[var(--color-border-subtle)]/70">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
              {isTr ? "Operis Temel Protokol Güvenceleri" : "Operis Architectural Guarantees"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-tertiary)]">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
            <span>
              {isTr
                ? "Algoritmik manipülasyon veya sahte metrik barındırmayan doğrulanabilir kurallar"
                : "Deterministic rules with zero algorithmic manipulation or vanity metrics"}
            </span>
          </div>
        </div>

        {/* 4 Protocol Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 lg:divide-x divide-[var(--color-border-subtle)]/60">
          {protocolPillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`group flex flex-col justify-between p-2 sm:p-3 transition-all duration-200 ${
                  idx > 0 ? "lg:pl-6" : ""
                } ${idx > 1 ? "pt-4 sm:pt-2" : ""}`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.bgGlow} border border-[var(--color-border-subtle)] ${item.borderGlow} transition-colors`}
                    >
                      <Icon className={`h-5 w-5 ${item.accent}`} aria-hidden="true" />
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
                      {item.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[var(--color-text-primary)] font-display">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mt-1.5">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
