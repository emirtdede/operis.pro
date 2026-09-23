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
  Palette,
  Bot,
  TrendingUp,
  Video,
  Layers,
  ChevronRight,
} from "lucide-react";

interface HeroInteractivePreviewProps {
  isTr?: boolean;
}

interface ProjectPreviewData {
  id: string;
  category: string;
  categoryEn: string;
  icon: typeof Code2;
  titleTr: string;
  titleEn: string;
  budgetTr: string;
  budgetEn: string;
  daysLeftTr: string;
  daysLeftEn: string;
  descriptionTr: string;
  descriptionEn: string;
  tags: string[];
  offerPriceTr: string;
  offerPriceEn: string;
  durationDays: number;
  freelancerName: string;
  freelancerBadgeTr: string;
  freelancerBadgeEn: string;
  freelancerExpTr: string;
  freelancerExpEn: string;
  freelancerInitials: string;
  bidMessageTr: string;
  bidMessageEn: string;
}

const POPULAR_LISTINGS: ProjectPreviewData[] = [
  {
    id: "saas",
    category: "Full Stack & SaaS",
    categoryEn: "Full Stack & SaaS",
    icon: Code2,
    titleTr: "Next.js 15 & Supabase ile Çok Kiracılı (Multi-Tenant) SaaS Paneli",
    titleEn: "Multi-Tenant SaaS Dashboard with Next.js 15 & Supabase",
    budgetTr: "65.000 ₺",
    budgetEn: "$1,950",
    daysLeftTr: "5 Gün Kaldı (Taze İlan)",
    daysLeftEn: "5 Days Left (Active)",
    descriptionTr: "Mevcut PostgreSQL şemamız üzerine Next.js 15 App Router, Tailwind CSS ve Supabase Auth entegre edilecek; müşteri faturalandırma ve analitik grafikleri hazırlanacaktır.",
    descriptionEn: "Building a modern SaaS administrative dashboard on top of our existing PostgreSQL schema with Next.js 15, Supabase Auth, and usage analytics.",
    tags: ["Next.js 15", "TypeScript", "PostgreSQL", "Supabase", "Tailwind CSS"],
    offerPriceTr: "60.000 ₺",
    offerPriceEn: "$1,800",
    durationDays: 12,
    freelancerName: "Demir Y.",
    freelancerBadgeTr: "Doğrulanmış Kıdemli Mühendis",
    freelancerBadgeEn: "Verified Senior Engineer",
    freelancerExpTr: "14 Yıllık Deneyim • %100 Başarı",
    freelancerExpEn: "14 Yrs Exp • 100% Rate",
    freelancerInitials: "DY",
    bidMessageTr: "«Next.js 15 ve Supabase mimarilerine hakimim. İlgili analitik paneli temiz mimari ve TypeScript ile eksiksiz teslim edebilirim.»",
    bidMessageEn: "«Experienced in Next.js 15 and Supabase. Can deliver clean code with full test coverage.»",
  },
  {
    id: "design",
    category: "UI/UX & Ürün Tasarımı",
    categoryEn: "UI/UX & Product Design",
    icon: Palette,
    titleTr: "Fintech Mobil Uygulaması için Figma Design System & UX Akışları",
    titleEn: "Figma Design System & UX Flows for Fintech Mobile App",
    budgetTr: "45.000 ₺",
    budgetEn: "$1,350",
    daysLeftTr: "6 Gün Kaldı (Taze İlan)",
    daysLeftEn: "6 Days Left (Active)",
    descriptionTr: "B2B finansal ödeme ve cüzdan uygulamamız için 80+ bileşenden oluşan token tabanlı Figma Design System, kullanıcı yolculuk haritaları ve interaktif prototipler tasarlanacak.",
    descriptionEn: "Designing an 80+ component token-based Figma design system, user journey maps, and high-fidelity interactive prototypes for a B2B payment app.",
    tags: ["Figma", "Design System", "Mobile UX", "Prototyping", "Fintech"],
    offerPriceTr: "42.000 ₺",
    offerPriceEn: "$1,250",
    durationDays: 10,
    freelancerName: "Selin K.",
    freelancerBadgeTr: "Kıdemli Ürün Tasarımcısı",
    freelancerBadgeEn: "Senior Product Designer",
    freelancerExpTr: "8 Yıllık Deneyim • 40+ Teslimat",
    freelancerExpEn: "8 Yrs Exp • 40+ Projects",
    freelancerInitials: "SK",
    bidMessageTr: "«Fintech ve SaaS design system projelerinde uzmanım. Figma Variables ve responsive auto-layout bileşenleriyle eksiksiz teslim ederim.»",
    bidMessageEn: "«Specialized in fintech design systems with Figma variables and full token architecture ready for engineering handoff.»",
  },
  {
    id: "ai",
    category: "Yapay Zeka & LLM Ajanları",
    categoryEn: "AI & LLM Agents",
    icon: Bot,
    titleTr: "RAG & LangChain Tabanlı Kurumsal Müşteri Destek Asistanı",
    titleEn: "RAG & LangChain Powered Intelligent Customer Support Agent",
    budgetTr: "55.000 ₺",
    budgetEn: "$1,650",
    daysLeftTr: "4 Gün Kaldı (Taze İlan)",
    daysLeftEn: "4 Days Left (Active)",
    descriptionTr: "PDF dökümanlarımızı ve şirket bilgi tabanını vektör veritabanına indeksleyerek çalışan, halüsinasyon oranı minimum RAG arama ve otomatik bilet yanıtlama botu geliştirilecek.",
    descriptionEn: "Developing a low-hallucination RAG enterprise customer support bot leveraging vector embeddings, LangChain, and automated ticket triaging.",
    tags: ["Python", "LangChain", "OpenAI API", "Qdrant", "FastAPI"],
    offerPriceTr: "50.000 ₺",
    offerPriceEn: "$1,500",
    durationDays: 8,
    freelancerName: "Barış T.",
    freelancerBadgeTr: "Yapay Zeka & Veri Mimarı",
    freelancerBadgeEn: "AI & Data Architect",
    freelancerExpTr: "9 Yıllık Deneyim • 25+ LLM Sistemi",
    freelancerExpEn: "9 Yrs Exp • 25+ LLM Systems",
    freelancerInitials: "BT",
    bidMessageTr: "«Vektör veritabanları ve kurumsal RAG boru hatları konusunda uzmanım. Doğruluk oranı yüksek hibrit arama mimarisi kurabilirim.»",
    bidMessageEn: "«Specialized in vector retrieval and enterprise RAG pipelines with hybrid re-ranking and telemetry.»",
  },
  {
    id: "marketing",
    category: "Büyüme & Performans Pazarlaması",
    categoryEn: "Growth & Performance Marketing",
    icon: TrendingUp,
    titleTr: "SaaS Ürünü için Çok Kanallı CAC Optimizasyonu & Funnel Kurulumu",
    titleEn: "Multi-Channel CAC Optimization & Funnel Setup for B2B SaaS",
    budgetTr: "38.000 ₺",
    budgetEn: "$1,150",
    daysLeftTr: "5 Gün Kaldı (Taze İlan)",
    daysLeftEn: "5 Days Left (Active)",
    descriptionTr: "B2B SaaS platformumuz için Google Search & LinkedIn reklam kampanyalarının kurulumu, PostHog dönüşüm funnel analitiği ve A/B landing page optimizasyon testleri yürütülecek.",
    descriptionEn: "Setting up B2B LinkedIn & Google Ads pipelines, PostHog funnel telemetry, and running scientific A/B conversion tests.",
    tags: ["B2B Growth", "Google Ads", "PostHog", "Funnel CRO", "LinkedIn Ads"],
    offerPriceTr: "35.000 ₺",
    offerPriceEn: "$1,050",
    durationDays: 14,
    freelancerName: "Merve A.",
    freelancerBadgeTr: "Büyüme & CRO Uzmanı",
    freelancerBadgeEn: "Growth & CRO Specialist",
    freelancerExpTr: "6 Yıllık Deneyim • $2M+ Reklam Yönetimi",
    freelancerExpEn: "6 Yrs Exp • $2M+ Ad Spend",
    freelancerInitials: "MA",
    bidMessageTr: "«B2B SaaS büyüme pazarlamasında derin tecrübem var. İlk 30 günde CAC değerinizi %30 düşürecek net funnel stratejisini hazırlarım.»",
    bidMessageEn: "«Managed $2M+ B2B ad spend with proven payback period compression and event tracking setup.»",
  },
  {
    id: "video",
    category: "3D & Video Prodüksiyon",
    categoryEn: "3D & Video Production",
    icon: Video,
    titleTr: "Donanım Ürünü için Fotogerçekçi Blender 3D Tanıtım Animasyonu",
    titleEn: "Photorealistic Blender 3D Product Teaser Video",
    budgetTr: "50.000 ₺",
    budgetEn: "$1,500",
    daysLeftTr: "7 Gün Kaldı (Yeni İlan)",
    daysLeftEn: "7 Days Left (New)",
    descriptionTr: "Yeni nesil IoT cihazımızın CAD modelleri üzerinden 45 saniyelik 4K 60fps sinematik patlatılmış montaj ve stüdyo aydınlatmalı lansman tanıtım videosu render edilecek.",
    descriptionEn: "Creating a 45-second 4K cinematic exploded-assembly 3D teaser video from CAD engineering assets in Blender with sound design.",
    tags: ["Blender 3D", "After Effects", "CAD Render", "Sound Design", "Octane"],
    offerPriceTr: "48.000 ₺",
    offerPriceEn: "$1,450",
    durationDays: 10,
    freelancerName: "Emre Z.",
    freelancerBadgeTr: "3D Hareketli Grafik Sanatçısı",
    freelancerBadgeEn: "3D Motion Graphic Artist",
    freelancerExpTr: "7 Yıllık Deneyim • 50+ Lansman Videosu",
    freelancerExpEn: "7 Yrs Exp • 50+ Launch Videos",
    freelancerInitials: "EZ",
    bidMessageTr: "«Blender ve Cycles ile Apple/Tesla standartlarında donanım animasyonları yapıyorum. 4K render ve ses tasarımı dahil anahtar teslim sunarım.»",
    bidMessageEn: "«Crafting Apple-grade industrial product animations with sound design and 4K masters included.»",
  },
];

export function HeroInteractivePreview({ isTr = true }: HeroInteractivePreviewProps) {
  const [viewMode, setViewMode] = useState<"client" | "developer">("developer");
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [offerSubmitted, setOfferSubmitted] = useState(false);
  const [activeListingIndex, setActiveListingIndex] = useState(0);

  const currentProject = POPULAR_LISTINGS[activeListingIndex] ?? POPULAR_LISTINGS[0]!;
  const IconComponent = currentProject.icon;

  const handleNextListing = () => {
    setActiveListingIndex((prev) => (prev + 1) % POPULAR_LISTINGS.length);
    setOfferSubmitted(false);
    setIsDecrypted(false);
  };

  const handleSelectListing = (index: number) => {
    setActiveListingIndex(index);
    setOfferSubmitted(false);
    setIsDecrypted(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto text-left">
      {/* Interactive Mode & Listing Switcher Top Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 px-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
            {isTr ? "Canlı Önizleme Simülatörü" : "Live Interactive Simulator"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 5 Popular Listing Types Cycle Button */}
          <button
            type="button"
            onClick={handleNextListing}
            title={isTr ? "En popüler 5 ilan türü arasında geçiş yap" : "Switch between 5 popular listing types"}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400/60 shadow-sm transition-all duration-200 cursor-pointer active:scale-95"
          >
            <Layers className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
            <span className="font-bold">
              {isTr ? "İlan Türünü Değiştir" : "Switch Listing Type"}
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-[10px] font-mono font-bold text-cyan-200">
              {activeListingIndex + 1}/5
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
          </button>

          {/* Perspective Toggle (Developer vs Client) */}
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
              <span>{isTr ? "Yazılımcı: Şifreli Teklif" : "Engineer: Encrypted Bid"}</span>
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
              <span>{isTr ? "İşveren: Teklifleri İncele" : "Client: Review Offers"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Pills for 5 Popular Sectors */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 px-2 scrollbar-none">
        <span className="text-[11px] text-[var(--color-text-tertiary)] font-medium shrink-0 mr-1">
          {isTr ? "Örnek İlanlar:" : "Sample Listings:"}
        </span>
        {POPULAR_LISTINGS.map((item, idx) => {
          const ItemIcon = item.icon;
          const isActive = idx === activeListingIndex;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectListing(idx)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10 font-semibold"
                  : "bg-[var(--color-surface-base)]/60 text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              <ItemIcon className="h-3 w-3" aria-hidden="true" />
              <span>{isTr ? item.category : item.categoryEn}</span>
            </button>
          );
        })}
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
          <div className="space-y-2 max-w-xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-400">
                <IconComponent className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{isTr ? currentProject.category : currentProject.categoryEn}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-text-secondary)]">
                <Clock className="h-3 w-3 text-cyan-400" aria-hidden="true" />
                <span>{isTr ? currentProject.daysLeftTr : currentProject.daysLeftEn}</span>
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)] transition-all duration-200">
              {isTr ? currentProject.titleTr : currentProject.titleEn}
            </h3>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <div className="text-xs uppercase font-semibold text-[var(--color-text-tertiary)] tracking-wider">
              {isTr ? "İlan Bütçesi" : "Fixed Budget"}
            </div>
            <div className="text-2xl font-black font-display text-emerald-400">
              {isTr ? currentProject.budgetTr : currentProject.budgetEn}
            </div>
            <div className="text-[11px] font-medium text-[var(--color-text-secondary)]">
              {isTr ? "%0 Kesinti • Net Kazanç" : "0% Fee • 100% Net"}
            </div>
          </div>
        </div>

        {/* Project Scope & Tech Tags */}
        <div className="py-4 space-y-3">
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {isTr ? currentProject.descriptionTr : currentProject.descriptionEn}
          </p>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {currentProject.tags.map((t) => (
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
                        {isTr ? currentProject.offerPriceTr : currentProject.offerPriceEn}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
                      <div className="text-[11px] text-[var(--color-text-tertiary)] font-medium">
                        {isTr ? "Tahmini Teslim Süresi" : "Estimated Duration"}
                      </div>
                      <div className="text-base font-bold text-[var(--color-text-primary)] mt-0.5">
                        {currentProject.durationDays} {isTr ? "Gün" : "Days"}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {isTr
                      ? "Teklifiniz gönderildiği anda tarayıcınızda şifrelenir. Diğer hiçbir uzman veya üçüncü şahıs fiyatınızı ve kapsamınızı göremez; fiyat kırma savaşı yaşanmaz."
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
                  {isTr ? "1 Şifreli Teklif Alındı" : "1 Encrypted Offer Received"}
                </span>
              </div>

              <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400">
                      {currentProject.freelancerInitials}
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)]">
                        {currentProject.freelancerName}{" "}
                        <span className="text-[10px] text-emerald-400 font-normal">
                          ({isTr ? currentProject.freelancerBadgeTr : currentProject.freelancerBadgeEn})
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--color-text-tertiary)]">
                        {isTr ? currentProject.freelancerExpTr : currentProject.freelancerExpEn}
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
                        <span className="text-emerald-400 text-sm">
                          {isTr ? currentProject.offerPriceTr : currentProject.offerPriceEn}
                        </span>
                        <span className="text-[var(--color-text-secondary)]">
                          {currentProject.durationDays} {isTr ? "Gün Teslim" : "Days"}
                        </span>
                      </div>
                      <p className="text-[var(--color-text-secondary)] leading-relaxed">
                        {isTr ? currentProject.bidMessageTr : currentProject.bidMessageEn}
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
