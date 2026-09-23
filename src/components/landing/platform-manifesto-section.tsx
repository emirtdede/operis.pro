"use client";

import { ShieldCheck, Percent, Lock, Clock, Ban, CheckCircle2 } from "lucide-react";
import { SpotlightCard } from "@/src/components/ui/spotlight-card";

interface PlatformManifestoSectionProps {
  isTr?: boolean;
}

export function PlatformManifestoSection({ isTr = true }: PlatformManifestoSectionProps) {
  const manifestoPillars = [
    {
      icon: Ban,
      title: isTr ? "Sahte Yorum ve Şişirilmiş Puan Yasağı" : "Zero Fake Reviews or Vanity Ratings",
      desc: isTr
        ? "Platformumuzda satın alınmış referanslar, sahte kullanıcı profilleri veya yapay zeka tarafından üretilmiş 5 yıldızlı yorumlar barındırılmaz. Güvenimiz algoritmik manipülasyonlarla değil; açık kurallar ve kriptografik doğrulukla sağlanır."
        : "We refuse to display purchased reviews, synthetic personas, or inflated 5-star ratings. Authentic trust comes from mathematical determinism, not marketing theater.",
      badge: isTr ? "Etik Güven İlkesi" : "Ethical Transparency",
      accent: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      icon: Percent,
      title: isTr ? "%0 Komisyon: Emekten Kesinti Yapılamaz" : "Zero Commission: Labor is Not Taxed",
      desc: isTr
        ? "Yazılım mühendislerinin emeğinden veya işverenin yatırım bütçesinden komisyon almayı etik bulmuyoruz. Anlaşılan bütçenin %100'ü doğrudan projeyi üreten uzmanın cebinde kalır."
        : "Taking a percentage cut from an engineer's livelihood is contrary to our core philosophy. 100% of the agreed project value remains with the person doing the work.",
      badge: isTr ? "Kesintisiz Hak Ediş" : "100% Value Retained",
      accent: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      icon: ShieldCheck,
      title: isTr ? "Emanetsiz Özgürlük: Paranız Rehin Tutulmaz" : "No Fund Custody: Zero Arbitrary Holds",
      desc: isTr
        ? "Operis paranızı günlerce emanette (escrow) bloke eden bir finans kurumu değildir. İşveren ve geliştirici ödeme yöntemini (Banka havalesi, fatura, kripto) ve takvimini aracı olmadan kendi belirler."
        : "Operis does not hold your payments hostage for weeks. Both parties negotiate and settle directly using their preferred payment methods, invoices, and milestones.",
      badge: isTr ? "Doğrudan Mülkiyet" : "Direct Settlement",
      accent: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      icon: Lock,
      title: isTr ? "Kriptografik Gizlilik: Fiyat Kırma Savaşı Yok" : "Encrypted Privacy: No Race to the Bottom",
      desc: isTr
        ? "Herkese açık teklif modellerinde rakipler birbirinin fiyatını görerek kaliteyi öldüren bir fiyat savaşına girer. Operis'te teklifler AES-256 ile mühürlenir; yalnızca ilan sahibi tarafından incelenebilir."
        : "Public bidding creates an adversarial race-to-the-bottom that destroys engineering quality. AES-256-GCM encryption shields every proposal exclusively for the client's eyes.",
      badge: isTr ? "AES-256 Güvencesi" : "AES-256 Sealed",
      accent: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      icon: Clock,
      title: isTr ? "Sıfır Hayalet İlan: 168 Saatlik Canlılık" : "Zero Ghost Jobs: 168-Hour Maximum Lifetime",
      desc: isTr
        ? "Aylarca veya yıllarca unutulmuş, işvereni kaybolmuş ölü ilan kalabalığı sistemimizde barınamaz. 7 gün içinde güncellenmeyen her ilan otomatik olarak pasife alınır."
        : "Dead, stale listings are systematically pruned. Every project card automatically expires after 168 hours unless actively renewed by the listing creator.",
      badge: isTr ? "Tazelik Protokolü" : "Strict Freshness",
      accent: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    },
  ];

  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-12 sm:py-16">
      {/* Section Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{isTr ? "ŞEFFAFLIK VE BAĞIMSIZLIK PROTOKOLÜ" : "TRANSPARENCY & ETHICAL COMMITMENT"}</span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
          {isTr ? (
            <>
              Operis Şeffaflık &{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Bağımsızlık Manifestosu
              </span>
            </>
          ) : (
            <>
              Operis Transparency &{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Independence Manifesto
              </span>
            </>
          )}
        </h2>

        <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
          {isTr
            ? "Pazar yerlerindeki yapay yorumlara, sahte incelemelere ve gizli komisyonlara karşı net ve değişmez taahhütlerimiz."
            : "Our immutable commitments against fake reviews, middleman taxes, and artificial platform lock-ins."}
        </p>
      </div>

      {/* Manifesto Grid */}
      <div className="flex flex-wrap justify-center gap-6">
        {manifestoPillars.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] flex"
            >
              <SpotlightCard
                className="w-full p-6 sm:p-7 flex flex-col justify-between rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-xl transition-all duration-300 hover:border-blue-500/40 hover:-translate-y-1"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-2xl border ${item.accent}`}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] px-2.5 py-0.5 rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]">
                      {item.badge}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-[var(--color-border-subtle)]/60 flex items-center gap-2 text-[11px] text-[var(--color-text-tertiary)]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                  <span>
                    {isTr ? "Platform mimarisinde aktif olarak denetlenmektedir" : "Actively enforced in core platform architecture"}
                  </span>
                </div>
              </SpotlightCard>
            </div>
          );
        })}
      </div>
    </section>
  );
}
