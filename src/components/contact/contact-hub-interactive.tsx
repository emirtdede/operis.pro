"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  ShieldAlert,
  Scale,
  Headphones,
  Newspaper,
  Copy,
  Check,
  ArrowRight,
  BadgeCheck,
  ShieldCheck,
} from "lucide-react";
import { ContactForm } from "./contact-form";
import { getLocalizedRoute } from "@/src/lib/i18n/routes";

export interface ContactHubInteractiveProps {
  locale: string;
}

export function ContactHubInteractive({ locale }: ContactHubInteractiveProps) {
  const isTr = locale === "tr";
  const [selectedDeptId, setSelectedDeptId] = useState<string>("general");
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const officialDesks = [
    {
      id: "general",
      icon: Headphones,
      title: isTr ? "Teknik Destek & Platform Operasyonları" : "Technical Support & Platform Ops",
      email: "destek@operis.pro",
      sla: isTr ? "< 6 İş Saati" : "< 6 Business Hours",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      description: isTr
        ? "İlan yayınlama, teklif şifreleme sorunları, çalışma alanı el sıkışması ve hesap doğrulama işlemleri."
        : "Listing publishing, proposal encryption inquiries, workspace bilateral handshakes, and developer verification.",
    },
    {
      id: "enterprise",
      icon: Briefcase,
      title: isTr ? "Kurumsal & Girişim Çözümleri" : "Enterprise & Strategic Partnerships",
      email: "kurumsal@operis.pro",
      sla: isTr ? "< 4 İş Saati" : "< 4 Business Hours",
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      description: isTr
        ? "Büyük ölçekli teknoloji ekipleri, kurumsal ilan paketleri, API entegrasyonları ve stratejik ortaklıklar."
        : "Large-scale engineering teams, bespoke enterprise accounts, API licensing, and strategic technology partnerships.",
    },
    {
      id: "security",
      icon: ShieldAlert,
      title: isTr ? "Güvenlik & Bug Bounty Masası" : "Security & Vulnerability Disclosure",
      email: "guvenlik@operis.pro",
      sla: isTr ? "< 2 Saat (7/24 Kesintisiz)" : "< 2 Hours (24/7 Priority)",
      color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      description: isTr
        ? "Kriptografik güvenlik, zafiyet bildirimleri (Bug Bounty), yetkisiz erişim ihbarları ve acil siber güvenlik bildirimleri."
        : "Cryptographic audits, responsible bug bounty reports, unauthorized access alerts, and urgent incident response.",
    },
    {
      id: "legal",
      icon: Scale,
      title: isTr ? "Hukuk & Uyuşmazlık Müşavirliği" : "Legal Counsel & Statutory Disputes",
      email: "hukuk@operis.pro",
      sla: isTr ? "< 12 İş Saati" : "< 12 Business Hours",
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      description: isTr
        ? "5651 Yer Sağlayıcı uyumu, FSEK m. 52 telif ihlalleri, resmi noter tebligatları ve adli makam yazışmaları."
        : "Law No. 5651 intermediary compliance, FSEK copyright disputes, formal court orders, and notary notices.",
    },
    {
      id: "press",
      icon: Newspaper,
      title: isTr ? "Basın & Medya İletişimi" : "Press & Media Relations",
      email: "basin@operis.pro",
      sla: isTr ? "< 24 İş Saati" : "< 24 Business Hours",
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      description: isTr
        ? "Medya kiti, röportaj talepleri, resmi basın bültenleri ve sektör analiz raporları paylaşımı."
        : "Media press kits, interview requests, official announcements, and engineering benchmark reports.",
    },
  ];

  const handleCopyEmail = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail(null), 2000);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
      {/* Left Column: Official Support Desks Hub */}
      <div className="flex flex-col justify-between rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="space-y-5">
          {/* Card Header with Divider */}
          <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]">
                {isTr ? "Yetkili İletişim Masaları" : "Dedicated Support Desks"}
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {isTr ? "Konuya özel doğrudan yönlendirme & SLA güvencesi" : "Direct routing by domain & committed SLAs"}
              </p>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{isTr ? "5 Masa Çevrim İçi" : "5 Desks Online"}</span>
            </span>
          </div>

          {/* 5 Desks Interactive List */}
          <div className="space-y-2.5" role="tablist" aria-label={isTr ? "İletişim Masaları" : "Support Desks"}>
            {officialDesks.map((desk) => {
              const Icon = desk.icon;
              const isSelected = selectedDeptId === desk.id;
              const isEmailCopied = copiedEmail === desk.email;

              return (
                <div
                  key={desk.id}
                  role="tab"
                  tabIndex={0}
                  aria-selected={isSelected}
                  onClick={() => setSelectedDeptId(desk.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedDeptId(desk.id);
                    }
                  }}
                  className={`group relative p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? "border-blue-500/60 bg-blue-500/[0.08] shadow-md ring-2 ring-blue-500/20"
                      : "border-[var(--color-border-subtle)]/70 bg-[var(--color-surface-hover)]/40 hover:border-blue-500/30 hover:bg-[var(--color-surface-hover)]/70"
                  }`}
                >
                  {/* Row 1: Icon + Full Title (Zero Truncation) + Active Indicator */}
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`h-7 w-7 rounded-lg border flex items-center justify-center shrink-0 ${desk.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <h3 className="text-xs sm:text-[13px] font-bold text-[var(--color-text-primary)] leading-snug">
                        {desk.title}
                      </h3>
                    </div>

                    {isSelected && (
                      <span className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded-full border border-blue-500/25">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                        <span>{isTr ? "Seçili" : "Selected"}</span>
                      </span>
                    )}
                  </div>

                  {/* Row 2: Description */}
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-1.5 pl-0.5">
                    {desk.description}
                  </p>

                  {/* Row 3: Meta Footer with Email, Copy Icon, and SLA Badge */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--color-border-subtle)]/50">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-medium text-blue-400">
                        {desk.email}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyEmail(e, desk.email)}
                        className="text-[var(--color-text-tertiary)] hover:text-blue-400 p-1 rounded-md transition-colors"
                        title={isTr ? "E-postayı kopyala" : "Copy email address"}
                        aria-label={`${desk.email} ${isTr ? "kopyala" : "copy"}`}
                      >
                        {isEmailCopied ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
                        )}
                      </button>
                    </div>

                    <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-lg bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] shrink-0">
                      {desk.sla}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Integrated Quick Help Bar (Seamlessly anchored at the bottom) */}
        <div className="pt-4 border-t border-[var(--color-border-subtle)]/80 flex items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
            <BadgeCheck className="h-4 w-4 text-blue-400 shrink-0" />
            <span className="text-xs font-medium leading-snug">
              {isTr
                ? "Sorularınız için hazır rehber ve SSS merkezi mevcuttur."
                : "Instant answers available in our verified FAQ center."}
            </span>
          </div>
          <Link
            href={getLocalizedRoute("help", locale)}
            className="inline-flex items-center gap-1 font-semibold text-blue-400 hover:text-blue-300 hover:underline shrink-0 text-xs"
          >
            <span>{isTr ? "Yardım Merkezi" : "Help Hub"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Right Column: Smart Routing Form */}
      <div className="flex flex-col justify-between rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="space-y-1.5 border-b border-[var(--color-border-subtle)] pb-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]">
              {isTr ? "Akıllı İletişim & Talep Formu" : "Smart Inquiry & Dispatch Form"}
            </h2>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold shrink-0">
              AES-256 SSL
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {isTr
              ? "Yetkili mühendislerimize doğrudan ve şifreli iletilir."
              : "Inquiries are routed directly to on-call duty engineers under committed response SLAs."}
          </p>
        </div>

        <div className="flex-1 flex flex-col">
          <ContactForm
            locale={locale}
            selectedDepartment={selectedDeptId}
            onDepartmentChange={setSelectedDeptId}
          />
        </div>

        {/* Bottom Trust & Compliance Guarantee Bar (Symmetrically mirrors the Left Column's Quick Help Bar) */}
        <div className="pt-4 border-t border-[var(--color-border-subtle)]/80 flex items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-medium leading-snug">
              {isTr
                ? "256-bit TLS şifreleme • KVKK ve GDPR veri gizliliği güvencesi."
                : "256-bit TLS encryption • Statutory GDPR & KVKK privacy guaranteed."}
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>{isTr ? "SLA Korumalı" : "SLA Committed"}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
