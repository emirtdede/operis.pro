"use client";

import { useState } from "react";
import {
  Lock,
  Unlock,
  ShieldCheck,
  Clock,
  Send,
  Eye,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Code2,
} from "lucide-react";

interface HeroInteractivePreviewProps {
  isTr?: boolean;
}

export function HeroInteractivePreview({ isTr = true }: HeroInteractivePreviewProps) {
  const [viewMode, setViewMode] = useState<"client" | "developer">("developer");
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [offerSubmitted, setOfferSubmitted] = useState(false);

  return (
    <div className="w-full max-w-4xl mx-auto text-left">
      {/* Interactive Mode Selector Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 px-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
            {isTr ? "Canlı Önizleme Simülatörü" : "Live Interactive Simulator"}
          </span>
        </div>

        <div className="inline-flex items-center p-1 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-md shadow-sm">
          <button
            type="button"
            onClick={() => {
              setViewMode("developer");
              setOfferSubmitted(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
              viewMode === "developer"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <Send className="h-3 w-3" aria-hidden="true" />
            <span>{isTr ? "Yazılımcı: Şifreli Teklif Ver" : "Engineer: Encrypted Bid"}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode("client");
              setIsDecrypted(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
              viewMode === "client"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <Eye className="h-3 w-3" aria-hidden="true" />
            <span>{isTr ? "İşveren: Gelen Teklifleri İncele" : "Client: Review Offers"}</span>
          </button>
        </div>
      </div>

      {/* Main Glassmorphic Interactive Card Container */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-[var(--color-surface-base)]/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-blue-500/10 transition-all duration-300">
        {/* Background Ambient Aura */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl"
        />

        {/* Project Card Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-400">
                <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Full Stack & SaaS</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-text-secondary)]">
                <Clock className="h-3 w-3 text-cyan-400" aria-hidden="true" />
                <span>{isTr ? "5 Gün Kaldı (Taze İlan)" : "5 Days Left (Active)"}</span>
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)]">
              {isTr
                ? "Next.js 15 & Supabase ile Çok Kiracılı (Multi-Tenant) SaaS Paneli"
                : "Multi-Tenant SaaS Dashboard with Next.js 15 & Supabase"}
            </h3>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <div className="text-xs uppercase font-semibold text-[var(--color-text-tertiary)] tracking-wider">
              {isTr ? "İlan Bütçesi" : "Fixed Budget"}
            </div>
            <div className="text-2xl font-black font-display text-emerald-400">65.000 ₺</div>
            <div className="text-[11px] font-medium text-[var(--color-text-secondary)]">
              {isTr ? "%0 Kesinti • Net Kazanç" : "0% Fee • 100% Net"}
            </div>
          </div>
        </div>

        {/* Project Scope & Tech Tags */}
        <div className="py-4 space-y-3">
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {isTr
              ? "Mevcut PostgreSQL şemamız üzerine Next.js 15 App Router, Tailwind CSS ve Supabase Auth entegre edilecek; müşteri faturalandırma ve kullanım analitiği grafikleri hazırlanacaktır."
              : "Building a modern SaaS administrative dashboard on top of our existing PostgreSQL schema with Next.js 15, Supabase Auth, and usage analytics."}
          </p>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {["Next.js 15", "TypeScript", "PostgreSQL", "Supabase", "Tailwind CSS"].map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-secondary)]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Dynamic Simulated Interactive Action Area */}
        <div className="mt-2 pt-4 border-t border-[var(--color-border-subtle)]">
          {viewMode === "developer" ? (
            /* Developer Mode: Encrypted Proposal Submission */
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-400">
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {isTr
                      ? "AES-256-GCM Birebir Şifreli Teklif Alanı"
                      : "AES-256-GCM Encrypted Proposal"}
                  </span>
                </div>
                <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {isTr ? "Rakiplere Kapalı" : "Confidential"}
                </span>
              </div>

              {!offerSubmitted ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
                      <div className="text-[11px] text-[var(--color-text-tertiary)] font-medium">
                        {isTr ? "Teklif Ettiğiniz Tutar" : "Your Offer Price"}
                      </div>
                      <div className="text-base font-bold text-[var(--color-text-primary)] mt-0.5">
                        60.000 ₺
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
                      <div className="text-[11px] text-[var(--color-text-tertiary)] font-medium">
                        {isTr ? "Tahmini Teslim Süresi" : "Estimated Duration"}
                      </div>
                      <div className="text-base font-bold text-[var(--color-text-primary)] mt-0.5">
                        12 {isTr ? "Gün" : "Days"}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {isTr
                      ? "Teklifiniz gönderildiği anda tarayıcınızda şifrelenir. Diğer hiçbir yazılımcı veya üçüncü şahıs fiyatınızı ve kapsamınızı göremez; fiyat kırma savaşı yaşanmaz."
                      : "Your offer is cryptographically encrypted. Competitors never see your quote, preventing race-to-the-bottom pricing wars."}
                  </p>

                  <button
                    type="button"
                    onClick={() => setOfferSubmitted(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <Lock className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {isTr
                        ? "Şifrele ve Güvenle Gönder (Simüle Et)"
                        : "Encrypt & Send Privately (Simulate)"}
                    </span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2 animate-in fade-in-50 duration-300">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {isTr
                        ? "Teklif Başarıyla Şifrelendi ve İletildi!"
                        : "Offer Encrypted & Dispatched!"}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {isTr
                      ? "Şifreleme özeti: AES-256-GCM (İlan sahibinin açık anahtarı ile kilitlendi). İlan sahibi teklifinizi onayladığında doğrudan WhatsApp / Slack / Telefon iletişim kanallarınız açılacaktır."
                      : "Ciphertext dispatched. Direct contact details will unlock automatically when the project owner accepts your terms."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setOfferSubmitted(false)}
                    className="text-xs text-blue-400 hover:underline pt-1 cursor-pointer"
                  >
                    {isTr ? "Tekrar dene" : "Try again"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Client Mode: Reviewing Encrypted Offers */
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-cyan-400">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {isTr
                      ? "İşveren Gelen Kutusu (Birebir Şifreli Eşleşme)"
                      : "Client Private Inbox"}
                  </span>
                </div>
                <span className="text-[11px] text-cyan-300 font-medium">
                  {isTr ? "2 Teklif Alındı" : "2 Offers Received"}
                </span>
              </div>

              <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400">
                      DY
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)]">
                        Demir Y.{" "}
                        <span className="text-[10px] text-emerald-400 font-normal">
                          ({isTr ? "Doğrulanmış Kıdemli Mühendis" : "Verified Senior"})
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--color-text-tertiary)]">
                        {isTr ? "14 Yıllık Deneyim • %100 Başarı" : "14 Yrs Exp • 100% Rate"}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsDecrypted(!isDecrypted)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/20 transition-colors cursor-pointer"
                  >
                    {isDecrypted ? (
                      <>
                        <Unlock className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                        <span>{isTr ? "Şifre Çözüldü" : "Decrypted"}</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{isTr ? "Şifreyi Çöz" : "Decrypt Offer"}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-[var(--color-surface-hover)]/70 text-xs">
                  {isDecrypted ? (
                    <div className="space-y-1.5 animate-in fade-in-50 duration-200">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-emerald-400 text-sm">60.000 ₺</span>
                        <span className="text-[var(--color-text-secondary)]">
                          12 {isTr ? "Gün Teslim" : "Days"}
                        </span>
                      </div>
                      <p className="text-[var(--color-text-secondary)] leading-relaxed">
                        {isTr
                          ? "«Next.js 15 ve Supabase mimarilerine hakimim. İlgili analitik paneli temiz mimari ve TypeScript ile eksiksiz teslim edebilirim.»"
                          : "«Experienced in Next.js 15 and Supabase. Can deliver clean code with full test coverage.»"}
                      </p>
                      <div className="pt-2 flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>
                          {isTr
                            ? "Kabul ettiğinizde doğrudan telefon ve e-posta açılır."
                            : "Direct contact unlocks on acceptance."}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[var(--color-text-tertiary)] font-mono text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <Lock className="h-3 w-3 text-cyan-400" aria-hidden="true" />
                        <span>AES-GCM-256: 7f8a9b2c... [Kilitli]</span>
                      </span>
                      <span className="text-cyan-400 text-[10px] font-sans">
                        {isTr ? "Görmek için tıklayın" : "Click to reveal"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Trust Micro-banner */}
        <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[var(--color-text-tertiary)]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
            <span>
              {isTr
                ? "Operis Protokolü: %0 Komisyon, doğrudan iletişim ve sıfır aracı."
                : "Operis Protocol: 0% fee, direct bilateral collaboration."}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isTr ? "Emanet / Rehin Yok" : "No Escrow Lock-in"}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
