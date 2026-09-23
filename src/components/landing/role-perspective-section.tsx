"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Code2,
  Building2,
  Percent,
  Lock,
  Clock,
  MessageSquare,
  Sparkles,
  ArrowRight,
  FileCheck2,
  Handshake,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { SpotlightCard } from "@/src/components/ui/spotlight-card";
import { Button } from "@/src/components/ui/button";

interface RolePerspectiveSectionProps {
  isTr: boolean;
  locale?: string;
}

export function RolePerspectiveSection({ isTr, locale: _locale }: RolePerspectiveSectionProps) {
  const [activeRole, setActiveRole] = useState<"freelancer" | "client">("freelancer");

  return (
    <section className="relative flex flex-col justify-center items-center w-full px-4 sm:px-6 lg:px-8 py-14 sm:py-20 snap-start scroll-mt-16">
      <div className="mx-auto max-w-6xl w-full space-y-10 sm:space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20">
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {isTr ? "İKİ AYRI ROL, TEK KUSURSUZ MODEL" : "TWO ROLES, ONE SEAMLESS PROTOCOL"}
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
            {isTr ? (
              <>
                Sizin İçin Ne Sunar,{" "}
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  Süreç Nasıl İşler?
                </span>
              </>
            ) : (
              <>
                What Operis Delivers &{" "}
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  How The Flow Works
                </span>
              </>
            )}
          </h2>

          <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed">
            {isTr
              ? "Operis'i ziyaret eden her profesyonel ve işveren, sistemin kendisine ne kazandıracağını ve ilk andan iş teslimine kadar sürecin nasıl ilerleyeceğini net bir şekilde görür."
              : "Whether you write code or build a company, explore exactly what Operis guarantees for your role and how the end-to-end journey operates."}
          </p>
        </div>

        {/* Interactive Role Switcher Pills */}
        <div className="flex justify-center">
          <div className="inline-flex items-center p-1.5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/90 backdrop-blur-xl shadow-lg shadow-blue-500/5">
            <button
              type="button"
              onClick={() => setActiveRole("freelancer")}
              className={`flex items-center gap-2 px-5 sm:px-7 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
                activeRole === "freelancer"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              <Code2 className="h-4 w-4" aria-hidden="true" />
              <span>{isTr ? "💻 Freelancer & Geliştirici Gözünden" : "💻 For Freelancers & Engineers"}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveRole("client")}
              className={`flex items-center gap-2 px-5 sm:px-7 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
                activeRole === "client"
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/25"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              <Building2 className="h-4 w-4" aria-hidden="true" />
              <span>{isTr ? "🏢 İşveren & Şirket Gözünden" : "🏢 For Clients & Founders"}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Role Content */}
        {activeRole === "freelancer" ? (
          /* FREELANCER VIEW */
          <div className="space-y-10 animate-in fade-in-50 duration-300">
            {/* Value Pitch Banner */}
            <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-cyan-500/5 p-6 sm:p-8 backdrop-blur-xl">
              <div className="max-w-3xl space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  {isTr ? "GELİŞTİRİCİYE ÖZEL KAZANIMLAR" : "FREELANCER VALUE PROPOSITION"}
                </span>
                <h3 className="text-xl sm:text-3xl font-extrabold text-[var(--color-text-primary)]">
                  {isTr
                    ? "Emeğinizin %100'ü Sizde Kalır. Sıfır Komisyon, Sıfır Fiyat Kırma Savaşı."
                    : "Retain 100% of Your Earnings. Zero Fees, Zero Undercutting Wars."}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {isTr
                    ? "Geleneksel platformların her faturanızdan kestiği %20 haraca, haftalarca süren ödeme blokelerine ve dışarıdan görüşürseniz banlarım tehditlerine son veriyoruz. Operis'te müşteriyle doğrudan eşit ortak olarak çalışırsınız."
                    : "No 20% platform tax on your sweat, no arbitrary payout holds, and no account suspensions for talking off-platform. On Operis, you collaborate directly on your terms."}
                </p>
              </div>
            </div>

            {/* 4 Concrete Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <SpotlightCard className="p-5 sm:p-6 space-y-3 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Percent className="h-5 w-5" aria-hidden="true" />
                </div>
                <h4 className="text-base font-bold text-[var(--color-text-primary)]">
                  {isTr ? "%100 Net Kazanç" : "100% Net Take-Home"}
                </h4>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {isTr
                    ? "100.000 ₺'lik bir projede 20.000 ₺ platforma gitmez. Anlaşılan tutarın tamamı doğrudan sizin banka hesabınıza veya cüzdanınıza yatar."
                    : "On a $5,000 project, $1,000 is not lost to fees. 100% of the funds flow directly into your own bank account or crypto wallet."}
                </p>
              </SpotlightCard>

              <SpotlightCard className="p-5 sm:p-6 space-y-3 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Lock className="h-5 w-5" aria-hidden="true" />
                </div>
                <h4 className="text-base font-bold text-[var(--color-text-primary)]">
                  {isTr ? "Kör Teklif Güvencesi" : "Encrypted Blind Bids"}
                </h4>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {isTr
                    ? "Teklifiniz AES-256 ile şifrelenir. Rakipler teklif mektubunuzu veya fiyatınızı asla göremez; kimse sizin 100 ₺ altınıza teklif vererek emeğinizi çalamaz."
                    : "Your rate and proposal are encrypted with AES-256. Competitors cannot view your bid; no race-to-the-bottom undercutting."}
                </p>
              </SpotlightCard>

              <SpotlightCard className="p-5 sm:p-6 space-y-3 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Clock className="h-5 w-5" aria-hidden="true" />
                </div>
                <h4 className="text-base font-bold text-[var(--color-text-primary)]">
                  {isTr ? "Taze ve Cevap Veren İlanlar" : "Active Responsive Radar"}
                </h4>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {isTr
                    ? "3 ay önce unutulmuş ölü ilanlara teklif hakkı harcamazsınız. Tüm ilanlar maksimum 7 gün canlıdır; her ilan sahibi aktif ve dönüş yapmaya hazırdır."
                    : "Never waste bids on abandoned ghost listings. Every project expires in 7 days, guaranteeing active and responsive project owners."}
                </p>
              </SpotlightCard>

              <SpotlightCard className="p-5 sm:p-6 space-y-3 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <MessageSquare className="h-5 w-5" aria-hidden="true" />
                </div>
                <h4 className="text-base font-bold text-[var(--color-text-primary)]">
                  {isTr ? "Sansürsüz Doğrudan İletişim" : "Direct Uncensored Chat"}
                </h4>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {isTr
                    ? "Eşleştiğiniz an telefon, WhatsApp ve Slack üzerinden müşteriyle doğrudan konuşursunuz. Yapay zeka sansürü veya iletişim kısıtlaması yoktur."
                    : "Instant WhatsApp, phone, and Slack access once matched. No automated chat filters, no keyword monitoring, and zero account ban risks."}
                </p>
              </SpotlightCard>
            </div>

            {/* Step-by-Step Workflow for Freelancers */}
            <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--color-border-subtle)]/60 pb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                    {isTr ? "İŞ AKIŞI REHBERİ" : "DEVELOPER WORKFLOW"}
                  </span>
                  <h4 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)]">
                    {isTr
                      ? "Freelancer Olarak Operis'te Adım Adım Nasıl Çalışırsınız?"
                      : "Step-by-Step: How to Work and Get Paid as a Freelancer"}
                  </h4>
                </div>
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  {isTr ? "4 Kolay Adım • 0 ₺ Giriş Maliyeti" : "4 Clean Steps • Zero Cost"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Step 1 */}
                <div className="space-y-2.5 relative">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 font-mono text-xs font-bold text-blue-400">
                      01
                    </span>
                    <h5 className="font-bold text-sm text-[var(--color-text-primary)]">
                      {isTr ? "Radarı ve Kategorileri İnceleyin" : "Explore Active Radar"}
                    </h5>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {isTr
                      ? "110+ teknoloji kategorisi arasından (Next.js, Python, DevOps, Yapay Zeka vb.) uzmanlığınızı seçin ve taze ilan akışını takip edin."
                      : "Filter across 110+ specialized categories to find fresh active projects perfectly aligned with your technical stack."}
                  </p>
                </div>

                {/* Step 2 */}
                <div className="space-y-2.5 relative">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 font-mono text-xs font-bold text-indigo-400">
                      02
                    </span>
                    <h5 className="font-bold text-sm text-[var(--color-text-primary)]">
                      {isTr ? "Birebir Şifreli Teklif Sunun" : "Submit Encrypted Proposal"}
                    </h5>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {isTr
                      ? "Bütçenizi, sürenizi ve teknik yaklaşımınızı belirleyin. Teklifiniz AES-256 ile şifrelenir ve rakiplerinizin gözünden saklanır."
                      : "Set your rate, timeline, and architectural approach. Your bid is encrypted with AES-256 and hidden from all other competitors."}
                  </p>
                </div>

                {/* Step 3 */}
                <div className="space-y-2.5 relative">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20 font-mono text-xs font-bold text-cyan-400">
                      03
                    </span>
                    <h5 className="font-bold text-sm text-[var(--color-text-primary)]">
                      {isTr ? "Eşleşme ve Doğrudan İletişim" : "Match & Channel Unlock"}
                    </h5>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {isTr
                      ? "İşveren teklifinizi kabul ettiği an iki tarafın doğrulanmış e-posta ve telefon bilgileri anında birbirine açılır."
                      : "When the client accepts your proposal, verified contact information (phone, WhatsApp, email) unlocks instantly for both."}
                  </p>
                </div>

                {/* Step 4 */}
                <div className="space-y-2.5 relative">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 font-mono text-xs font-bold text-emerald-400">
                      04
                    </span>
                    <h5 className="font-bold text-sm text-[var(--color-text-primary)]">
                      {isTr ? "Doğrudan Anlaşın & Kazanın" : "Direct Work & Full Pay"}
                    </h5>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {isTr
                      ? "Müşteriyle kendi sözleşmenizi, fatura ve ödeme yönteminizi (IBAN, kripto, vb.) aracı olmadan doğrudan yürütün."
                      : "Execute your own service contract and receive payments directly through bank transfer, crypto, or invoicing without middleman fees."}
                  </p>
                </div>
              </div>

              {/* Action Link for Freelancer */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[var(--color-border-subtle)]/60">
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {isTr
                    ? "Hemen 110+ kategoride yayınlanan güncel projelere göz atın."
                    : "Start exploring live listings across 110+ specialized technology categories."}
                </span>
                <Link href={isTr ? "/tr/akis" : "/en/feed"}>
                  <Button variant="shimmer" size="md">
                    <span>{isTr ? "Canlı İlanları ve Akışı İncele" : "Browse Live Tech Radar"}</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* CLIENT VIEW */
          <div className="space-y-10 animate-in fade-in-50 duration-300">
            {/* Value Pitch Banner */}
            <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-emerald-500/5 p-6 sm:p-8 backdrop-blur-xl">
              <div className="max-w-3xl space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  {isTr ? "İŞVERENE ÖZEL KAZANIMLAR" : "CLIENT VALUE PROPOSITION"}
                </span>
                <h3 className="text-xl sm:text-3xl font-extrabold text-[var(--color-text-primary)]">
                  {isTr
                    ? "2 Dakikada İlan Verin. Komisyonsuz, Doğrudan En İyi Mühendislerle Eşleşin."
                    : "Post in 2 Minutes. Connect with Elite Developers with Zero Commission."}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {isTr
                    ? "Yüksek listeleme harçları, aracı komisyonları ve platform engelleri olmadan projenizi canlı radara açın. En yetenekli bağımsız yazılımcılardan odaklanmış teklifler alın ve doğrudan görüşün."
                    : "Publish technical projects in 2 minutes without credit cards or escrow lock-ins. Receive focused, high-conviction proposals from senior independent talent."}
                </p>
              </div>
            </div>

            {/* 4 Concrete Pillars for Clients */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <SpotlightCard className="p-5 sm:p-6 space-y-3 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                </div>
                <h4 className="text-base font-bold text-[var(--color-text-primary)]">
                  {isTr ? "2 Dakikada Ücretsiz İlan" : "Free 2-Minute Posting"}
                </h4>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {isTr
                    ? "Kredi kartı, üyelik ücreti veya ön ödeme gerekmez. Proje gereksinimlerinizi yazın, 7 gün boyunca radarda canlı kalsın."
                    : "Zero upfront fees or mandatory credit cards. Define your requirements and launch your listing on the active radar for 7 days."}
                </p>
              </SpotlightCard>

              <SpotlightCard className="p-5 sm:p-6 space-y-3 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Percent className="h-5 w-5" aria-hidden="true" />
                </div>
                <h4 className="text-base font-bold text-[var(--color-text-primary)]">
                  {isTr ? "Daha Uygun Bütçeler" : "Direct Budget Efficiency"}
                </h4>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {isTr
                    ? "Yazılımcı platforma %20 komisyon kaptırmadığı için fiyatı şişirmez. Bütçeniz aracıya değil, doğrudan proje kalitesine gider."
                    : "Engineers don't mark up quotes by 20% to offset platform cuts. Your capital directly finances high-quality development."}
                </p>
              </SpotlightCard>

              <SpotlightCard className="p-5 sm:p-6 space-y-3 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <FileCheck2 className="h-5 w-5" aria-hidden="true" />
                </div>
                <h4 className="text-base font-bold text-[var(--color-text-primary)]">
                  {isTr ? "Nitelikli Teklifler" : "High-Conviction Bids"}
                </h4>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {isTr
                    ? "Rakipler fiyatları görmediği için kopyala-yapıştır bot teklifler yerine projenizin mimarisine özel çözümler içeren ciddi teklifler alırsınız."
                    : "Encrypted bidding prevents automated copy-paste clutter. You receive thoughtful, tailored engineering architectures."}
                </p>
              </SpotlightCard>

              <SpotlightCard className="p-5 sm:p-6 space-y-3 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Handshake className="h-5 w-5" aria-hidden="true" />
                </div>
                <h4 className="text-base font-bold text-[var(--color-text-primary)]">
                  {isTr ? "Hızlı ve Doğrudan Başlangıç" : "Instant Direct Kickoff"}
                </h4>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {isTr
                    ? "Teklifi onayladığınız an yazılımcıyı doğrudan arayabilir, WhatsApp veya Slack'te aynı gün geliştirmeye başlayabilirsiniz."
                    : "The moment you approve a proposal, direct contact channels open up. Call or message on Slack and start coding the same day."}
                </p>
              </SpotlightCard>
            </div>

            {/* Step-by-Step Workflow for Clients */}
            <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--color-border-subtle)]/60 pb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                    {isTr ? "İŞVEREN AKIŞ REHBERİ" : "CLIENT WORKFLOW"}
                  </span>
                  <h4 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)]">
                    {isTr
                      ? "İşveren Olarak Operis'te Adım Adım Nasıl Çalışırsınız?"
                      : "Step-by-Step: How to Post Projects and Hire Talent"}
                  </h4>
                </div>
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  {isTr ? "4 Kolay Adım • Kredi Kartı Gerekmez" : "4 Clean Steps • No Credit Card Required"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Step 1 */}
                <div className="space-y-2.5 relative">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20 font-mono text-xs font-bold text-cyan-400">
                      01
                    </span>
                    <h5 className="font-bold text-sm text-[var(--color-text-primary)]">
                      {isTr ? "İhtiyacınızı Tanımlayın" : "Define Your Scope"}
                    </h5>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {isTr
                      ? "Proje başlığını, teknoloji yığınını (örn: Next.js, Python), tahmini bütçenizi ve teslim vadesini belirleyin."
                      : "Specify required technologies, scope deliverables, estimated budget boundaries, and timeline expectations."}
                  </p>
                </div>

                {/* Step 2 */}
                <div className="space-y-2.5 relative">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 font-mono text-xs font-bold text-blue-400">
                      02
                    </span>
                    <h5 className="font-bold text-sm text-[var(--color-text-primary)]">
                      {isTr ? "Özel Teklifleri İnceleyin" : "Review Confidential Bids"}
                    </h5>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {isTr
                      ? "Yazılımcılardan gelen teklifler panelinizde toplanır. Fiyat, süre ve teknik portföyleri gizlilik içinde karşılaştırın."
                      : "In-depth encrypted proposals flow into your private dashboard. Compare architectures, delivery schedules, and rates."}
                  </p>
                </div>

                {/* Step 3 */}
                <div className="space-y-2.5 relative">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 font-mono text-xs font-bold text-indigo-400">
                      03
                    </span>
                    <h5 className="font-bold text-sm text-[var(--color-text-primary)]">
                      {isTr ? "En Uygun Uzmanı Onaylayın" : "Accept the Best Candidate"}
                    </h5>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {isTr
                      ? "Projenize en uygun teklifi tek tıkla kabul edin. Eşleşme onaylandığı an her iki tarafın iletişim kanalları açılır."
                      : "Accept the proposal that best fits your technical criteria. Contact channels unlock immediately for both parties."}
                  </p>
                </div>

                {/* Step 4 */}
                <div className="space-y-2.5 relative">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 font-mono text-xs font-bold text-emerald-400">
                      04
                    </span>
                    <h5 className="font-bold text-sm text-[var(--color-text-primary)]">
                      {isTr ? "Doğrudan İletişimle Başlayın" : "Kick Off Directly"}
                    </h5>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {isTr
                      ? "Yazılımcıyla doğrudan telefon, WhatsApp veya Slack üzerinden görüşerek sözleşmenizi imzalayın ve geliştirmeye başlayın."
                      : "Communicate directly over phone, Slack, or email. Finalize milestones and commercial terms on your own preferred contracts."}
                  </p>
                </div>
              </div>

              {/* Action Link for Client */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[var(--color-border-subtle)]/60">
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {isTr
                    ? "Projenizi hemen yayınlayın, 7 gün boyunca binlerce yazılımcının radarına girsin."
                    : "Publish your technical project right now and put it on the active radar of senior engineers."}
                </span>
                <Link href={isTr ? "/tr/ilanlar/yeni" : "/en/listings/new"}>
                  <Button variant="secondary" size="md">
                    <span>{isTr ? "2 Dakikada Ücretsiz İlan Ver" : "Post a Free Project (2 Mins)"}</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Universal Dual-Capability Architecture Card */}
        <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-cyan-500/5 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-[var(--color-text-primary)]">
                {isTr ? "Tek Hesap, Çift Yetenek: Ayrı Hesap Açmanıza Gerek Yok" : "Single Account, Dual Capability: No Split Profiles"}
              </h4>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {isTr
                  ? "Operis'te 'sadece işveren' veya 'sadece freelancer' ayrımı yoktur. Tek bir doğrulanmış profil ile dilediğiniz gün bir teknoloji projesi yayınlayabilir, dilediğiniz gün ise yetkin olduğunuz diğer ilanlara teklif sunabilirsiniz."
                  : "On Operis, every account is natively bidirectional. Using the same verified identity, you can post hiring projects as a client or submit proposals as a technical engineer at any time."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
