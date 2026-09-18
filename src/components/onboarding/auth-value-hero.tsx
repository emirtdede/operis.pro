"use client";

import { Percent, Layers, Lock, Clock, CheckCircle2 } from "lucide-react";

interface AuthValueHeroProps {
  locale: string;
  isRegister?: boolean;
}

export function AuthValueHero({ locale, isRegister = false }: AuthValueHeroProps) {
  const isTr = locale === "tr";

  const pillars = [
    {
      icon: Percent,
      title: isTr ? "%0 Komisyon Garantisi" : "0% Platform Cut Guaranteed",
      description: isTr
        ? "Ne işverenden ne de yazılımcıdan asla komisyon alınmaz. Kazancınızın tamamı sizindir."
        : "Zero commission deducted from clients or engineers. 100% direct collaboration.",
    },
    {
      icon: Layers,
      title: isTr ? "Tek Hesap, Çift Yetenek" : "One Account, Dual Capabilities",
      description: isTr
        ? "Tek bir profille hem anında ilan yayınlayabilir hem de ilanlara özel teklif verebilirsiniz."
        : "Post listings or submit proposals from a single verified identity.",
    },
    {
      icon: Lock,
      title: isTr ? "AES-256 Şifreli Birebir Teklifler" : "AES-256 Encrypted Proposals",
      description: isTr
        ? "Teklifleriniz rakiplere kapalıdır. Fiyat kırma baskısı olmadan değerinizi koruyun."
        : "Proposals are never public. Protect your rates without race-to-the-bottom wars.",
    },
    {
      icon: Clock,
      title: isTr ? "7 Günlük Canlılık Radarı" : "7-Day Freshness Guarantee",
      description: isTr
        ? "Terk edilmiş veya eski ilanlar otomatik pasife alınır. Yalnızca güncel ilanlar listelenir."
        : "Stale listings expire automatically; connect only with active, verified listings.",
    },
  ];

  return (
    <div className="flex flex-col justify-between h-full p-8 lg:p-12 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div
        className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-purple-500/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="space-y-8 relative z-10">
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
            {isRegister
              ? isTr
                ? "Yazılım Dünyasında Aracısız Yeni Bir Dönem"
                : "Autonomous Software Collaboration"
              : isTr
                ? "Güvenli ve Aracısız Yazılım Ağı"
                : "Direct & Secure Tech Network"}
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {isTr
              ? "Geleneksel aracıların komisyon kesintilerini, haksız bloke uygulamalarını ve teklif savaşlarını geride bırakın."
              : "Eliminate legacy platform fees, arbitrary escrow holds, and public bidding wars."}
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="space-y-5">
          {pillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-start gap-4">
                <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compliance & Trust Footnote */}
      <div className="pt-8 mt-8 border-t border-[var(--color-border-subtle)] relative z-10 space-y-2">
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
          <span>
            {isTr
              ? "KVKK ve GDPR uyumlu. İletişim bilgileriniz yalnızca eşleştiğinizde açılır."
              : "KVKK & GDPR compliant. Direct contact details unlock only upon match."}
          </span>
        </div>
      </div>
    </div>
  );
}
