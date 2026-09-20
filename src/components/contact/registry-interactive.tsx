"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  ExternalLink,
  MapPin,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  Navigation,
  Building,
  ShieldCheck,
} from "lucide-react";

export interface RegistryInteractiveProps {
  locale: string;
}

export function RegistryInteractive({ locale }: RegistryInteractiveProps) {
  const isTr = locale === "tr";
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const registryItems = [
    {
      key: "title",
      label: isTr ? "Ticari Unvan" : "Corporate Title",
      value: isTr
        ? "Vellium (Operis bir Vellium ürünüdür)"
        : "Vellium (Operis is a product of Vellium)",
      canCopy: true,
    },
    {
      key: "mersis",
      label: isTr ? "MERSİS Numarası" : "MERSİS Number",
      value: "0644-1234-5678-0001",
      canCopy: true,
    },
    {
      key: "tax",
      label: isTr ? "Vergi Dairesi & No" : "Tax Office & ID",
      value: "Beşiktaş V.D. / 6441234567",
      canCopy: true,
    },
    {
      key: "kep",
      label: isTr ? "Kayıtlı E-Posta (KEP)" : "Registered KEP",
      value: "vellium@hs01.kep.tr",
      canCopy: true,
    },
    {
      key: "uets",
      label: isTr ? "UETS Tebligat Kodu" : "UETS Code",
      value: "25987-14235-89654",
      canCopy: true,
    },
    {
      key: "status",
      label: isTr ? "Yasal Statü" : "Statutory Role",
      value: isTr
        ? "5651 Sayılı Kanun Kapsamında Yer Sağlayıcı"
        : "Law No. 5651 Intermediary Hosting Provider",
      canCopy: false,
    },
  ];

  const handleCopy = (key: string, text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
      {/* Left Card: Statutory Registry Identifiers */}
      <div className="flex flex-col justify-between rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-4">
            <h3 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-400" aria-hidden="true" />
              <span>{isTr ? "Resmi Sicil Bilgileri" : "Statutory Registry Identifiers"}</span>
            </h3>
            <Link
              href={isTr ? "/tr/yasal/iletisim" : "/en/legal/contact"}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1 transition-colors"
            >
              <span>{isTr ? "Yasal İletişim Künyesi" : "Full Legal Notice"}</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {/* 6-Cell Balanced Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {registryItems.map((item) => {
              const isCopied = copiedKey === item.key;
              return (
                <div
                  key={item.key}
                  className="p-3.5 rounded-2xl bg-[var(--color-surface-hover)]/40 border border-[var(--color-border-subtle)]/60 hover:border-blue-500/30 transition-all group relative"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider block">
                      {item.label}
                    </span>
                    {item.canCopy && (
                      <button
                        type="button"
                        onClick={() => handleCopy(item.key, item.value)}
                        className="text-[var(--color-text-tertiary)] hover:text-blue-400 p-1 rounded-md transition-colors"
                        title={isTr ? "Kopyala" : "Copy to clipboard"}
                        aria-label={`${item.label} ${isTr ? "kopyala" : "copy"}`}
                      >
                        {isCopied ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                        )}
                      </button>
                    )}
                  </div>
                  <span className="text-xs font-mono font-bold text-[var(--color-text-primary)] block break-all leading-snug">
                    {item.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Verification Note */}
        <div className="pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-xs text-[var(--color-text-tertiary)] font-mono">
          <span>{isTr ? "Sicil Doğrulama: MERSİS & GİB" : "Registry Check: MERSİS & Tax Office"}</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>{isTr ? "2026 Doğrulanmış" : "Verified 2026"}</span>
          </span>
        </div>
      </div>

      {/* Right Card: R&D Campus & Headquarters */}
      <div className="flex flex-col justify-between rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-4">
            <h3 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-400" aria-hidden="true" />
              <span>{isTr ? "Ar-Ge Kampüsü & Genel Merkez" : "R&D Campus & Office"}</span>
            </h3>
            <span className="text-[11px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
              İstanbul / Levent
            </span>
          </div>

          {/* Building Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-base sm:text-lg font-black text-[var(--color-text-primary)] flex items-center gap-2">
                <Building className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Levent 199 Kuleleri</span>
              </h4>
              <span className="text-[10px] font-mono text-[var(--color-text-tertiary)] bg-[var(--color-surface-hover)] px-2 py-0.5 rounded-lg border border-[var(--color-border-subtle)]">
                41.0792° N, 29.0125° E
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Büyükdere Caddesi, No: 199, Kat: 24, Levent, Beşiktaş / İstanbul, 34394 Türkiye
            </p>
          </div>

          {/* Visitor Protocol Note */}
          <div className="p-4 rounded-2xl bg-[var(--color-surface-hover)]/40 border border-[var(--color-border-subtle)]/70 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-[var(--color-text-primary)] font-bold">
              <Clock className="h-3.5 w-3.5 text-blue-400 shrink-0" />
              <span>{isTr ? "Kurumsal Ziyaret Protokolü:" : "Enterprise Visitor Protocol:"}</span>
            </div>
            <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
              {isTr
                ? "Bina güvenlik akreditasyonu ve turnike geçiş izinleri nedeniyle tüm yerleşke ziyaretleri en az 24 saat önceden randevu onayı gerektirmektedir."
                : "Due to high-security turnstile clearance, all on-site visits require prior confirmed appointment accreditation at least 24 hours in advance."}
            </p>
          </div>

          {/* Transit Info */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 flex items-center justify-between text-xs">
            <span className="text-[var(--color-text-secondary)]">
              {isTr ? "Toplu Ulaşım:" : "Transit Access:"} <strong>M2 Levent Metro</strong> Doğrudan Bağlantı
            </span>
            <span className="font-semibold text-emerald-400 flex items-center gap-1 text-[11px]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{isTr ? "Akredite Kabul" : "Accredited"}</span>
            </span>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-3">
          <a
            href="https://www.google.com/maps/search/?api=1&query=Levent+199+Buyukdere+Caddesi+Istanbul"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] hover:border-emerald-500/40 hover:text-emerald-400 transition-all shadow-sm"
          >
            <Navigation className="h-3.5 w-3.5 text-emerald-400" />
            <span>{isTr ? "Haritada Aç & Yol Tarifi Al" : "Open in Google Maps"}</span>
          </a>

          <span className="text-[11px] font-mono text-[var(--color-text-tertiary)]">
            {isTr ? "GMT+3 İstanbul" : "UTC+3 Istanbul"}
          </span>
        </div>
      </div>
    </div>
  );
}
