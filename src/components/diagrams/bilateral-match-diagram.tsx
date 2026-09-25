"use client";

import { ShieldCheck, Lock, UserCheck, KeyRound, EyeOff, CheckCircle2 } from "lucide-react";

export function BilateralMatchDiagram({ isTr = true }: { isTr?: boolean }) {
  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
      {/* Subtle Ambient Glow */}
      <div className="pointer-events-none absolute -top-12 -left-12 h-44 w-44 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -right-12 h-44 w-44 rounded-full bg-violet-500/10 blur-3xl" />

      {/* Top Header */}
      <div className="relative z-10 mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-sm">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">
              {isTr ? "Birebir Gizli Teklifleşme" : "Confidential 1-to-1 Proposals"}
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              {isTr
                ? "Teklif tutarlarınız ve proje detaylarınız rakiplere kapalıdır; yalnızca siz ve anlaştığınız uzman görebilir."
                : "Your proposed rates and project details are hidden from competitors; visible strictly to you and your counterparty."}
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-medium text-emerald-400 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{isTr ? "Tam Gizlilik Garantisi" : "Zero Competitor Visibility"}</span>
        </div>
      </div>

      {/* Visual Workflow Canvas */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 py-6 px-2 sm:px-6">
        {/* Left Node: Client / Project Owner */}
        <div className="flex flex-col items-center gap-3 text-center z-10 shrink-0">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-blue-500/40 bg-blue-500/10 text-blue-400 shadow-xl shadow-blue-500/10 backdrop-blur-md transition-transform hover:scale-105">
            <UserCheck className="h-10 w-10" aria-hidden="true" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500" />
            </span>
          </div>
          <div>
            <div className="font-semibold text-sm text-[var(--color-text-primary)]">
              {isTr ? "İş Veren" : "Client"}
            </div>
            <div className="text-xs text-[var(--color-text-secondary)]">
              {isTr ? "Proje Sahibi" : "Project Owner"}
            </div>
          </div>
        </div>

        {/* Center Animated Pipeline & Safe Box */}
        <div className="relative flex-1 flex flex-col items-center justify-center w-full max-w-md py-4">
          {/* Animated SVG Path */}
          <div className="w-full relative flex items-center justify-center">
            <svg
              className="w-full h-20 overflow-visible"
              viewBox="0 0 320 60"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="flowBeamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>

              {/* Guide Track */}
              <path
                d="M 20 30 Q 160 0 300 30"
                stroke="var(--color-border-subtle)"
                strokeWidth="2"
                strokeDasharray="6 6"
              />

              {/* Animated Glowing Wave Track */}
              <path
                d="M 20 30 Q 160 0 300 30"
                stroke="url(#flowBeamGradient)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray="50 150"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  values="200;0"
                  dur="2.5s"
                  repeatCount="indefinite"
                />
              </path>

              {/* Moving Lock Particle */}
              <circle r="4" fill="#38bdf8" filter="drop-shadow(0 0 6px #38bdf8)">
                <animateMotion path="M 20 30 Q 160 0 300 30" dur="2.5s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>

          {/* Central Privacy Protection Badge */}
          <div className="relative -mt-6 flex flex-col items-center gap-1.5 rounded-2xl border border-blue-500/30 bg-[var(--color-surface-base)] px-5 py-3 shadow-xl backdrop-blur-xl text-center">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-400" aria-hidden="true" />
              <span className="text-xs font-bold text-[var(--color-text-primary)]">
                {isTr ? "Özel Şifreli Teklif Akışı" : "Private Encrypted Proposal Pipeline"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
              <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {isTr
                  ? "Rakipler fiyatınızı ve teklifinizi göremez"
                  : "Competitors cannot view your bids or price quotes"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Node: Freelancer / Engineer */}
        <div className="flex flex-col items-center gap-3 text-center z-10 shrink-0">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-400 shadow-xl shadow-cyan-500/10 backdrop-blur-md transition-transform hover:scale-105">
            <KeyRound className="h-10 w-10" aria-hidden="true" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500" />
            </span>
          </div>
          <div>
            <div className="font-semibold text-sm text-[var(--color-text-primary)]">
              {isTr ? "Yazılımcı" : "Engineer"}
            </div>
            <div className="text-xs text-[var(--color-text-secondary)]">
              {isTr ? "Doğrulanmış Profesyonel" : "Verified Professional"}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Features: Clear End-User Value */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-[var(--color-border-subtle)] pt-4 text-xs">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[var(--color-surface-hover)]/40">
          <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" aria-hidden="true" />
          <span className="text-[var(--color-text-secondary)]">
            <strong className="text-[var(--color-text-primary)] font-medium">
              {isTr ? "Fiyat Kırma Savaşı Yok:" : "No Underbidding Wars:"}
            </strong>{" "}
            {isTr
              ? "Açık artırma usulü teklif yarışı yaşanmaz."
              : "Zero race-to-the-bottom public bidding."}
          </span>
        </div>
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[var(--color-surface-hover)]/40">
          <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" aria-hidden="true" />
          <span className="text-[var(--color-text-secondary)]">
            <strong className="text-[var(--color-text-primary)] font-medium">
              {isTr ? "Tam Gizlilik:" : "Complete Confidentiality:"}
            </strong>{" "}
            {isTr
              ? "Teklif detayları arama motorlarına kapalıdır."
              : "Proposal terms are closed to public indexing."}
          </span>
        </div>
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[var(--color-surface-hover)]/40">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
          <span className="text-[var(--color-text-secondary)]">
            <strong className="text-[var(--color-text-primary)] font-medium">
              {isTr ? "Birebir Temas:" : "Direct Connection:"}
            </strong>{" "}
            {isTr
              ? "Eşleşme onaylandığında doğrudan iletişim başlar."
              : "Direct channels unlock once a mutual match is confirmed."}
          </span>
        </div>
      </div>
    </div>
  );
}
