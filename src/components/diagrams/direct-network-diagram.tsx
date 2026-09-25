"use client";

import { Zap, Ban, ArrowRight, Check, Handshake } from "lucide-react";

export function DirectNetworkDiagram({ isTr = true }: { isTr?: boolean }) {
  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
      {/* Subtle Ambient Glow */}
      <div className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* Top Header */}
      <div className="relative z-10 mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500 border border-violet-500/20 shadow-sm">
            <Zap className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">
              {isTr ? "Doğrudan İş Birliği & %0 Komisyon" : "Direct Collaboration & 0% Fee"}
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              {isTr
                ? "Aracı kurum yok, komisyon kesintisi yok: Kazancınızın %100'ü doğrudan cebinizde kalır."
                : "No intermediaries, zero commission cuts: 100% of your earnings stay with you."}
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1 text-xs font-medium text-violet-400 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
          <span>{isTr ? "%0 Komisyon Garantisi" : "0% Commission Guarantee"}</span>
        </div>
      </div>

      {/* Comparison Grid: Old Intermediary vs Direct Platform */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 py-3">
        {/* Legacy Intermediary Model (Bypassed) */}
        <div className="relative rounded-3xl border border-dashed border-red-500/30 bg-red-500/5 p-6 space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-2">
              <Ban className="h-4 w-4 text-red-400" aria-hidden="true" />
              <span>{isTr ? "Geleneksel Freelance Siteleri" : "Legacy Freelance Platforms"}</span>
            </span>
            <span className="text-[10px] font-semibold text-red-400/80 bg-red-500/10 px-2.5 py-0.5 rounded-full">
              {isTr ? "Kayıp Model" : "Outdated Model"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs font-mono">
            <div className="rounded-xl border border-red-500/20 bg-[var(--color-surface-base)]/90 px-3 py-2 text-center text-[var(--color-text-primary)] shadow-sm">
              {isTr ? "Müşteri" : "Client"}
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-red-400/70 shrink-0" aria-hidden="true" />
            <div className="flex flex-col items-center rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-red-400 shadow-sm text-center">
              <span className="font-bold text-xs">{isTr ? "%20 - %30 Kesinti" : "20% - 30% Fee Cut"}</span>
              <span className="text-[9px] text-red-300/70">{isTr ? "Haftalarca Bloke" : "Weeks of Escrow Freeze"}</span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-red-400/70 shrink-0" aria-hidden="true" />
            <div className="rounded-xl border border-red-500/20 bg-[var(--color-surface-base)]/90 px-3 py-2 text-center text-[var(--color-text-primary)] shadow-sm">
              {isTr ? "Yazılımcı" : "Engineer"}
            </div>
          </div>

          <div className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
            {isTr
              ? "Yüksek komisyon kesintileri, haftalarca süren fon blokeleri ve aracı kurum bürokrasisiyle hem iş verenin bütçesi hem de yazılımcının kazancı eritilir."
              : "High platform take rates, weeks of escrow delays, and dispute bureaucracies drain both client budgets and engineer earnings."}
          </div>
        </div>

        {/* Direct Peer-to-Peer Model (Our Platform) */}
        <div className="relative rounded-3xl border border-emerald-500/40 bg-emerald-500/5 p-6 space-y-4 shadow-xl shadow-emerald-500/5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />
              <span>{isTr ? "Operis: %100 Doğrudan Eşleşme" : "Operis: 100% Direct Match"}</span>
            </span>
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              {isTr ? "Avantajlı" : "Optimal"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs font-mono">
            <div className="rounded-xl border border-emerald-500/30 bg-[var(--color-surface-base)]/90 px-3.5 py-2 text-center text-[var(--color-text-primary)] font-semibold shadow-sm">
              {isTr ? "İş Veren" : "Client"}
            </div>
            <div className="flex-1 relative flex items-center justify-center px-1">
              <div className="h-1 w-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 animate-pulse" />
              <span className="absolute rounded-full bg-emerald-500 px-3 py-0.5 text-[10px] font-extrabold text-white shadow-md shadow-emerald-500/30">
                {isTr ? "%0 Kesinti • Net" : "0% Cut • 100% Net"}
              </span>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-[var(--color-surface-base)]/90 px-3.5 py-2 text-center text-[var(--color-text-primary)] font-semibold shadow-sm">
              {isTr ? "Yazılımcı" : "Engineer"}
            </div>
          </div>

          <div className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
            {isTr
              ? "Platform yalnızca iki tarafı doğrudan buluşturur. Ödeme ve sözleşme aracıya takılmadan gerçekleşir; bütçenin ve hakedişin tamamı yazılımcıda kalır."
              : "Operis connects counterparties directly. Invoicing and agreements proceed bilaterally without platform escrow holds; 100% of compensation remains yours."}
          </div>
        </div>
      </div>

      {/* User-Friendly Notice */}
      <div className="relative z-10 mt-4 flex items-center gap-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/70 backdrop-blur-md p-3.5 text-xs text-[var(--color-text-secondary)]">
        <Handshake className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
        <span>
          <strong className="text-[var(--color-text-primary)] font-semibold">
            {isTr ? "Özgür ve Güvenli Ticaret:" : "Autonomous & Direct Commerce:"}
          </strong>{" "}
          {isTr
            ? "Ödemelerinizi dilediğiniz yöntemle (banka transferi, şirket faturası, sözleşmeli hakediş) doğrudan birbirinize gerçekleştirirsiniz."
            : "Handle compensation directly via your preferred channels (bank wire, corporate invoice, contract milestones) peer-to-peer."}
        </span>
      </div>
    </div>
  );
}
