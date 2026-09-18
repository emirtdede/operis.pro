"use client";

import { useState } from "react";
import Link from "next/link";
import { getLocalizedRoute } from "@/src/lib/i18n/routes";
import { Download, Copy, Check, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

interface BrandKitClientProps {
  locale: string;
}

export function BrandKitClient({ locale }: BrandKitClientProps) {
  const isTr = locale === "tr";
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  const colors = [
    {
      name: isTr ? "Obsidiyen Siyahı" : "Obsidian Black",
      hex: "#09090B",
      rgb: "rgb(9, 9, 11)",
      usage: isTr
        ? "Açık tema metinleri & koyu tema derinlik"
        : "Light mode primary text & deep dark tones",
      textColor: "text-white",
    },
    {
      name: isTr ? "Platin Beyazı" : "Platinum White",
      hex: "#FAFAFA",
      rgb: "rgb(250, 250, 250)",
      usage: isTr
        ? "Koyu tema metinleri & resmi beyaz logo"
        : "Dark mode primary text & white logo vector",
      textColor: "text-black",
      border: true,
    },
    {
      name: isTr ? "Zemin Koyu (Surface)" : "Surface Dark",
      hex: "#121417",
      rgb: "rgb(18, 20, 23)",
      usage: isTr
        ? "Koyu tema kart ve popover arka planı"
        : "Dark theme card and surface background",
      textColor: "text-white",
    },
    {
      name: isTr ? "Marka Mavisi (Electric Blue)" : "Brand Electric Blue",
      hex: "#3B82F6",
      rgb: "rgb(59, 130, 246)",
      usage: isTr ? "Birincil akış, aksiyon ve butonlar" : "Primary brand accents, buttons & links",
      textColor: "text-white",
    },
    {
      name: isTr ? "Mühendislik İndigo" : "Engineering Indigo",
      hex: "#6366F1",
      rgb: "rgb(99, 102, 241)",
      usage: isTr
        ? "Teklifler, kod ve sözleşme vurguları"
        : "Proposals, code badges & contract drafts",
      textColor: "text-white",
    },
    {
      name: isTr ? "Siber Zümrüt (Cyber Emerald)" : "Cyber Emerald",
      hex: "#10B981",
      rgb: "rgb(16, 185, 129)",
      usage: isTr
        ? "Güvenlik onayları ve aktif canlılık"
        : "Security verified badges & freshness status",
      textColor: "text-white",
    },
  ];

  return (
    <div className="space-y-16">
      {/* 1. Official Logo Vectors & Download Deck */}
      <section
        aria-label={isTr ? "Resmi Logo İndirme ve Önizleme" : "Official Logo Vectors"}
        className="space-y-8"
      >
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-blue-400 font-bold">
            {isTr ? "01. Vektörel Varlıklar" : "01. Vector Brand Assets"}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)]">
            {isTr
              ? "Resmi Operis Logosu & Vektör Paketleri"
              : "Official Operis Logos & Vector Assets"}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
            {isTr
              ? "Operis logosu; 4 akış şeridinden oluşan 'O' Stream Mark sembolü ile matematiksel olarak 10px eşit kerning ile kalibre edilmiş küçük harfli 'peris' kelime markasının bileşimidir."
              : "The official Operis logo combines the calibrated 4-band 'O' Stream Mark with the lowercase 'peris' wordmark, set with optical 10px equal kerning."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Dark Mode Logo Card */}
          <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[#09090B] p-5 sm:p-7 md:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between space-y-6 sm:space-y-8">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-zinc-400 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/80">
                {isTr ? "Koyu Tema / Dark Mode (#FAFAFA)" : "Dark Theme (#FAFAFA)"}
              </span>
              <span className="text-[11px] font-mono text-zinc-500">viewBox: 0 0 350 112</span>
            </div>

            {/* Logo Visual Presentation */}
            <div className="py-12 px-6 flex items-center justify-center rounded-2xl border border-zinc-800/80 bg-zinc-950/60 shadow-inner">
              <img
                src="/operis-logo-koyu.svg"
                alt="Operis Dark Logo"
                className="h-16 w-auto object-contain"
              />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="/operis-logo-koyu.svg"
                  download="operis-logo-koyu.svg"
                  className="flex-1 min-w-0 sm:min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  <span>{isTr ? "SVG İndir" : "Download SVG"}</span>
                </a>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      '<img src="/operis-logo-koyu.svg" alt="Operis" width="175" height="56" />',
                      "dark-html"
                    )
                  }
                  className="px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all flex items-center gap-2"
                >
                  {copiedCode === "dark-html" ? (
                    <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>
                    {copiedCode === "dark-html"
                      ? isTr
                        ? "Kopyalandı"
                        : "Copied"
                      : isTr
                        ? "HTML Kodu"
                        : "HTML Snippet"}
                  </span>
                </button>
              </div>
              <p className="text-[11px] text-zinc-500 text-center">
                {isTr
                  ? "Koyu arka planlar, OLED ekranlar ve navbar için şeffaf zeminli vektör."
                  : "Transparent background vector for dark surfaces, OLED screens and topbars."}
              </p>
            </div>
          </div>

          {/* Light Mode Logo Card */}
          <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[#F8F9FA] p-5 sm:p-7 md:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between space-y-6 sm:space-y-8">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-zinc-600 px-3 py-1 rounded-full border border-zinc-300 bg-zinc-200/80">
                {isTr ? "Açık Tema / Light Mode (#09090B)" : "Light Theme (#09090B)"}
              </span>
              <span className="text-[11px] font-mono text-zinc-400">viewBox: 0 0 350 112</span>
            </div>

            {/* Logo Visual Presentation */}
            <div className="py-12 px-6 flex items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-inner">
              <img
                src="/operis-logo-acik.svg"
                alt="Operis Light Logo"
                className="h-16 w-auto object-contain"
              />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="/operis-logo-acik.svg"
                  download="operis-logo-acik.svg"
                  className="flex-1 min-w-0 sm:min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-semibold shadow-md transition-all"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  <span>{isTr ? "SVG İndir" : "Download SVG"}</span>
                </a>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      '<img src="/operis-logo-acik.svg" alt="Operis" width="175" height="56" />',
                      "light-html"
                    )
                  }
                  className="px-4 py-2.5 rounded-xl border border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold transition-all flex items-center gap-2"
                >
                  {copiedCode === "light-html" ? (
                    <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>
                    {copiedCode === "light-html"
                      ? isTr
                        ? "Kopyalandı"
                        : "Copied"
                      : isTr
                        ? "HTML Kodu"
                        : "HTML Snippet"}
                  </span>
                </button>
              </div>
              <p className="text-[11px] text-zinc-500 text-center">
                {isTr
                  ? "Açık gri, beyaz zeminler, faturalar ve resmi dökümanlar için vektör."
                  : "Vector asset for white/light-gray papers, invoices, and light UI."}
              </p>
            </div>
          </div>
        </div>

        {/* Standalone Stream Mark Icon */}
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-5 sm:p-7 md:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
            <div className="h-20 w-20 shrink-0 rounded-2xl bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] flex items-center justify-center shadow-lg p-3">
              <img
                src="/operis-favicon.svg"
                alt="Operis Stream Mark Favicon"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                {isTr
                  ? "Operis Stream Mark Sembolü (İkon / Favicon)"
                  : "Operis Stream Mark (Icon / Favicon)"}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-xl">
                {isTr
                  ? "Kelime markası olmaksızın mobil uygulama simgesi, favicon ve sosyal medya profil resimlerinde kullanılan tekil akış sembolü."
                  : "Standalone 4-band stream symbol for application icons, favicons, and social avatar marks."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 shrink-0 w-full sm:w-auto">
            <a
              href="/operis-favicon.svg"
              download="operis-favicon.svg"
              className="px-4 py-2.5 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] hover:border-blue-500/40 text-xs font-semibold text-[var(--color-text-primary)] transition-all flex items-center gap-2 shadow-xs"
            >
              <Download className="h-4 w-4 text-blue-400" aria-hidden="true" />
              <span>{isTr ? "Favicon İndir (.svg)" : "Download Favicon (.svg)"}</span>
            </a>
            <a
              href="/apple-touch-icon.png"
              download="apple-touch-icon.png"
              className="px-4 py-2.5 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] hover:border-blue-500/40 text-xs font-semibold text-[var(--color-text-primary)] transition-all flex items-center gap-2 shadow-xs"
            >
              <Download className="h-4 w-4 text-indigo-400" aria-hidden="true" />
              <span>{isTr ? "Uygulama Simgesi İndir (.png)" : "Download App Icon (.png)"}</span>
            </a>
          </div>
        </div>
      </section>

      {/* 2. Logo Anatomy & Optical Kerning Standard */}
      <section
        id="anatomy"
        aria-label={
          isTr ? "Logo Anatomisi ve Kalibrasyon Standartları" : "Logo Anatomy & Calibration"
        }
        className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-5 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden space-y-8"
      >
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-blue-400 font-bold">
            {isTr ? "02. Geometri & Matematiksel Kalibrasyon" : "02. Geometric & Optical Standards"}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)]">
            {isTr
              ? "Logo Anatomisi ve Kusursuz Oranlar"
              : "Logo Anatomy & Strict Calibration Standards"}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
            {isTr
              ? "Operis logosunun tescilli kimliği katı matematiksel oranlara dayanır. Bu oranların dışına çıkılması marka bütünlüğünü ihlal eder."
              : "Operis brand identity relies upon calibrated mathematical rules. Any alteration compromises brand consistency."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] p-6 space-y-3">
            <div className="text-xs font-mono text-blue-400 font-bold uppercase">
              1. O Sembolü Ölçeği
            </div>
            <div className="text-xl font-extrabold text-[var(--color-text-primary)]">
              scale(0.54) &bull; 81px
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {isTr
                ? "O sembolü tepe noktası, 'i' harfinin noktası ve 'p' harfinin ascender tepesiyle tam eşit hizada tutulur (%108 optik kap-height)."
                : "The O mark is scaled to exactly 0.54 (81px), aligning its apex precisely with the dot of 'i' and ascender of 'p'."}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] p-6 space-y-3">
            <div className="text-xs font-mono text-indigo-400 font-bold uppercase">
              2. Optik Boşluk (Kerning)
            </div>
            <div className="text-xl font-extrabold text-[var(--color-text-primary)]">
              Net 10px Eşit Aralık
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {isTr
                ? "'O' sembolü ile 'p' harfi arasındaki boşluk net 10px'tir. Bu boşluk, 'p-e-r-i-s' harfleri arasındaki optik aralıkla tam eşittir."
                : "The space between the O mark and 'p' is exactly 10px, optically calibrated to match the inter-letter spacing of 'p-e-r-i-s'."}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] p-6 space-y-3">
            <div className="text-xs font-mono text-emerald-400 font-bold uppercase">
              3. Kelime Markası Fontu
            </div>
            <div className="text-xl font-extrabold text-[var(--color-text-primary)]">
              Inter Bold 700 &bull; Küçük Harf
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {isTr
                ? "Resmi logomuz 'Operis' şeklindedir ('peris' küçük harftir). Büyük harfle 'PERIS' yazmak kesinlikle yasaktır."
                : "The wordmark is strictly lowercase 'peris' in Inter Bold. All-caps 'PERIS' is strictly prohibited."}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Official Color Palette Tokens */}
      <section
        aria-label={isTr ? "Resmi Renk Paleti" : "Official Color Palette"}
        className="space-y-8"
      >
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-blue-400 font-bold">
            {isTr ? "03. Renk Sistemi" : "03. Official Color Tokens"}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)]">
            {isTr ? "Resmi Renk Paleti ve Tasarım Tokenları" : "Color System & Design Tokens"}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
            {isTr
              ? "Kartlara tıklayarak HEX veya RGB renk kodunu anında panonuza kopyalayabilirsiniz."
              : "Click any color swatch to instantly copy the HEX or RGB code to your clipboard."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {colors.map((color) => (
            <div
              key={color.hex}
              onClick={() => copyToClipboard(color.hex, color.hex)}
              className="group rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-5 shadow-lg hover:shadow-2xl hover:border-blue-500/40 transition-all cursor-pointer relative overflow-hidden"
              style={{
                backgroundColor: "var(--color-surface-base)",
              }}
            >
              {/* Color Swatch Block */}
              <div
                className={`h-24 w-full rounded-2xl flex items-end justify-between p-4 shadow-inner mb-4 transition-transform group-hover:scale-[1.02] ${
                  color.border ? "border border-zinc-200" : ""
                }`}
                style={{ backgroundColor: color.hex }}
              >
                <span className={`text-xs font-mono font-bold ${color.textColor}`}>
                  {color.hex}
                </span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-md text-white px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1">
                  {copiedCode === color.hex ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" aria-hidden="true" />
                      <span>{isTr ? "Kopyalandı" : "Copied"}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" aria-hidden="true" />
                      <span>{isTr ? "Kopyala" : "Copy"}</span>
                    </>
                  )}
                </span>
              </div>

              {/* Color Metadata */}
              <div className="space-y-1">
                <div className="font-bold text-sm text-[var(--color-text-primary)] group-hover:text-blue-400 transition-colors">
                  {color.name}
                </div>
                <div className="text-xs font-mono text-[var(--color-text-tertiary)]">
                  {color.rgb}
                </div>
                <p className="text-[11px] text-[var(--color-text-secondary)] pt-1 leading-snug">
                  {color.usage}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Typography Guidelines */}
      <section
        aria-label={isTr ? "Tipografi Standartları" : "Typography Standards"}
        className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-8 sm:p-10 shadow-2xl relative overflow-hidden space-y-8"
        style={{
          backgroundColor: "var(--color-surface-base)",
        }}
      >
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-blue-400 font-bold">
            {isTr ? "04. Tipografi" : "04. Typography Guidelines"}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)]">
            {isTr ? "Tipografi Ailesi: Inter" : "Typography Family: Inter"}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
            {isTr
              ? "Operis tüm arayüzlerinde yüksek okunabilirlik, optik denge ve sıfır görsel karmaşa için Google Fonts Inter ailesini kullanır."
              : "Operis relies exclusively upon Inter for high legibility, clean geometric forms, and screen rendering precision."}
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
                Inter Extra Bold (800)
              </div>
              <div className="text-xs text-[var(--color-text-tertiary)] font-mono">
                font-weight: 800 &bull; H1 Başlıklar & Vitrin Vurguları
              </div>
            </div>
            <div className="text-xs font-mono px-3 py-1.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-blue-400 font-bold">
              Aa Bb Cc 123
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">
                Inter Bold (700)
              </div>
              <div className="text-xs text-[var(--color-text-tertiary)] font-mono">
                font-weight: 700 &bull; Logo Kelime Markası & H2 Başlıklar
              </div>
            </div>
            <div className="text-xs font-mono px-3 py-1.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-indigo-400 font-bold">
              Aa Bb Cc 123
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-base sm:text-lg font-medium text-[var(--color-text-primary)]">
                Inter Regular & Medium (400 / 500)
              </div>
              <div className="text-xs text-[var(--color-text-tertiary)] font-mono">
                font-weight: 400, 500 &bull; Gövde Metinleri & Açıklamalar
              </div>
            </div>
            <div className="text-xs font-mono px-3 py-1.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-emerald-400 font-bold">
              Aa Bb Cc 123
            </div>
          </div>
        </div>
      </section>

      {/* 5. Do's and Don'ts (Logo Kullanım Kuralları) */}
      <section
        aria-label={isTr ? "Logo Kullanım Kuralları" : "Brand Do's & Don'ts"}
        className="space-y-8"
      >
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-blue-400 font-bold">
            {isTr ? "05. Kullanım Kuralları" : "05. Usage Rules (Do's & Don'ts)"}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)]">
            {isTr
              ? "Marka ve Logo Doğruları / Yanlışları"
              : "Logo Usage: What to Do & What to Avoid"}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
            {isTr
              ? "Operis markasını tanıtırken veya entegrasyonlarınızda kullanırken aşağıdaki kurallara mutlaka uyunuz."
              : "Ensure brand integrity across communications by strictly following these guidelines."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* DO's */}
          <div className="rounded-3xl border border-emerald-500/25 bg-emerald-500/5 p-5 sm:p-7 md:p-8 space-y-6">
            <div className="flex items-center gap-2.5 text-emerald-500 font-bold text-base">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              <span>{isTr ? "Yapılması Gerekenler (Do's)" : "Approved Usage (Do's)"}</span>
            </div>

            <ul className="space-y-3.5 text-xs sm:text-sm text-[var(--color-text-primary)]">
              <li className="flex items-start gap-2.5">
                <CheckCircle2
                  className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>
                  {isTr
                    ? "Logoyu her zaman orijinal SVG kaynak dosyalarından ölçekleyin."
                    : "Always scale from the official vector SVG assets."}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2
                  className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>
                  {isTr
                    ? "O sembolü ile 'peris' arasındaki 10px eşit optik boşluğu koruyun."
                    : "Preserve the 10px equal optical kerning between mark and wordmark."}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2
                  className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>
                  {isTr
                    ? "Koyu zeminlerde Platin Beyazı, açık zeminlerde Obsidiyen Siyahı versiyonu kullanın."
                    : "Use Platinum White on dark backgrounds, Obsidian Black on light backgrounds."}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2
                  className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>
                  {isTr
                    ? "Logonun etrafında en az logonun yüksekliğinin %50'si kadar boş alan bırakın."
                    : "Maintain clear space around the logo equal to at least 50% of logo height."}
                </span>
              </li>
            </ul>
          </div>

          {/* DON'Ts */}
          <div className="rounded-3xl border border-rose-500/25 bg-rose-500/5 p-5 sm:p-7 md:p-8 space-y-6">
            <div className="flex items-center gap-2.5 text-rose-500 font-bold text-base">
              <XCircle className="h-5 w-5" aria-hidden="true" />
              <span>
                {isTr ? "Kesinlikle Yasak Olanlar (Don'ts)" : "Strictly Prohibited (Don'ts)"}
              </span>
            </div>

            <ul className="space-y-3.5 text-xs sm:text-sm text-[var(--color-text-primary)]">
              <li className="flex items-start gap-2.5">
                <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" aria-hidden="true" />
                <span className="font-semibold text-rose-400">
                  {isTr
                    ? "ASLA 'PERIS' kelimesini büyük harflerle yazmayın (Logo küçük harfli 'peris'tir)."
                    : "NEVER render 'PERIS' in uppercase (The wordmark is lowercase 'peris')."}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  {isTr
                    ? "ASLA 'O' sembolünü kelimeden bağımsız büyütüp küçültmeyin (scale 0.54 sabittir)."
                    : "NEVER scale the 'O' symbol disproportionately (scale 0.54 is locked)."}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  {isTr
                    ? "ASLA logoyu yatay veya dikey basarak oranlarını bozmayın."
                    : "NEVER stretch, compress, or warp the vector proportions."}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  {isTr
                    ? "ASLA harflere veya sembole gölge, eğim, degrade veya ekstra kontur eklemeyin."
                    : "NEVER apply drop shadows, 3D extrusions, or multi-color gradients."}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer Navigation Back to Legal & Trust Center */}
      <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-5 sm:p-7 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1 text-center sm:text-left">
          <div className="font-bold text-sm text-[var(--color-text-primary)]">
            {isTr ? "Hukuki Haklar ve Fikri Mülkiyet Politikası" : "Legal Rights & IP Policy"}
          </div>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {isTr
              ? "Operis marka varlıklarının lisans koşulları ve telif kuralları için Yasal ve Güven Merkezimizi ziyaret edin."
              : "Review trademark terms and copyright policies in our comprehensive Legal & Trust Center."}
          </p>
        </div>

        <Link
          href={getLocalizedRoute("legalCenter", locale)}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/25 transition-all flex items-center gap-2 shrink-0"
        >
          <span>{isTr ? "Yasal ve Güven Merkezi" : "Legal & Trust Center"}</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
