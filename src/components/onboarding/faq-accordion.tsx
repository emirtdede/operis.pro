"use client";

import { useState } from "react";
import { ChevronDown, CheckCircle2 } from "lucide-react";

interface FaqAccordionProps {
  locale: string;
}

export function FaqAccordion({ locale }: FaqAccordionProps) {
  const isTr = locale === "tr";
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: isTr
        ? "%0 Komisyon nasıl mümkün oluyor? Gizli bir kesinti var mı?"
        : "How is 0% commission possible? Are there any hidden fees?",
      a: isTr
        ? "Platformumuz geleneksel aracı kurumların yüksek komisyon kesintilerini ortadan kaldırır. Ne işverenden ne de yazılımcıdan herhangi bir komisyon, listeleme ücreti veya gizli maliyet alınmaz. Tüm ticari hacim ve kazanç %100 taraflara aittir."
        : "Our platform eliminates the heavy commission cuts of legacy intermediaries. No listing fee, escrow deduction, or hidden percentage is charged to clients or developers. All transaction value remains 100% with the counterparties.",
    },
    {
      q: isTr
        ? "Birebir gizli teklif (AES-256) nedir ve bana ne kazandırır?"
        : "What is encrypted 1-to-1 proposal matching and why does it matter?",
      a: isTr
        ? "Açık teklif sistemlerinde yazılımcılar fiyat kırma yarışına girer ve teklifler değersizleşir. Platformumuzda teklifler AES-256-GCM ile şifrelenir ve yalnızca ilan sahibi tarafından çözülebilir. Rakipler teklifinizi göremez; emeğiniz ve fiyatınız korunur."
        : "In public bidding platforms, freelancers are forced into race-to-the-bottom pricing wars. On Operis, proposals are encrypted using AES-256-GCM and can only be decrypted by the listing owner. Competitors never see your price or proposal details.",
    },
    {
      q: isTr
        ? "7 Günlük Canlılık Kuralı nedir? Süre dolunca ilanım silinir mi?"
        : "What is the 7-day lifecycle rule? Is my listing deleted upon expiration?",
      a: isTr
        ? "Aylarca açık kalmış ve terk edilmiş ilan kalabalığını önlemek için her ilan maksimum 1 hafta aktif kalır. 1 hafta dolduğunda ilan silinmez, yalnızca pasife alınır. İlan sahibi panelinden tek tıkla ilanı 1 hafta daha ücretsiz yenileyebilir."
        : "To prevent dead or abandoned listings from cluttering search results, every project stays active for up to 1 week. When 1 week passes, it is not deleted—it transitions to inactive. The owner can reactivate it for another 1 week with a single click at zero cost.",
    },
    {
      q: isTr
        ? "Platform neden emanet (escrow) ödeme havuzu tutmuyor?"
        : "Why doesn't the platform hold payments in escrow?",
      a: isTr
        ? "Platform, bağımsız yazılım profesyonellerinin ve şirketlerin kendi ticari sözleşmelerini ve ödeme kanallarını özgürce yönetmesini savunur. Para tutulmadığı için yüksek ödeme komisyonları, hesap blokeleri ve haftalar süren ödeme gecikmeleri yaşanmaz."
        : "We believe professional engineers and companies should own their commercial agreements directly. By not acting as a financial custodian, we eliminate transaction fees, arbitrary account holds, and payment payout delays.",
    },
    {
      q: isTr
        ? "İletişim bilgilerim ne zaman ve kimlere gösterilir?"
        : "When and to whom are my contact details revealed?",
      a: isTr
        ? "E-posta ve telefon bilgileriniz herkese açık ilanlarda veya profilinizde asla görünmez. Bu bilgiler yalnızca işveren ile yazılımcı teklif üzerinde karşılıklı olarak anlaştığında (eşleşme kabul edildiğinde) yalnızca iki taraf arasında açılır."
        : "Your email and phone number are never exposed on public listings or profile pages. They are revealed exclusively to your counterparty only after a proposal is explicitly accepted by the listing owner.",
    },
    {
      q: isTr
        ? "Tek bir hesapla hem iş verip hem ilanlara teklif sunabilir miyim?"
        : "Can I use a single account to both hire talent and submit proposals?",
      a: isTr
        ? "Evet. Platformumuzda çift yetenek (dual-role) mimarisi geçerlidir. Ayrı işveren veya çalışan hesabı açmanıza gerek yoktur; tek bir profille hem dilediğiniz zaman ilan yayınlayabilir hem de diğer ilanlara teklif verebilirsiniz."
        : "Yes. Our architecture natively supports dual-capabilities on every account. You do not need separate accounts for client and freelancer; you can publish listings and bid on others using the same verified identity.",
    },
  ];

  return (
    <section
      aria-labelledby="faq-heading"
      className="relative flex flex-col justify-center items-center min-h-[calc(100dvh-4rem)] w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 snap-start scroll-mt-16"
    >
      <div className="mx-auto max-w-4xl w-full space-y-8">
        <div className="text-center space-y-3">
          <h2
            id="faq-heading"
            className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]"
          >
            {isTr ? "Sıkça Sorulan Sorular" : "Frequently Asked Questions"}
          </h2>
          <p className="text-sm sm:text-base text-[var(--color-text-secondary)] max-w-xl mx-auto">
            {isTr
              ? "Platform prensipleri, gizlilik modeli ve doğrudan eşleşme hakkında bilmeniz gerekenler."
              : "Clear, transparent answers about our operational rules and direct collaboration model."}
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-3xl transition-all duration-300 overflow-hidden relative backdrop-blur-xl ${
                  isOpen
                    ? "border border-blue-500/40 bg-gradient-to-b from-[var(--color-surface-base)]/90 via-[var(--color-surface-base)]/80 to-[var(--color-surface-base)]/70 shadow-xl shadow-blue-500/10"
                    : "border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 hover:border-blue-500/30 hover:bg-[var(--color-surface-base)]/85 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5"
                }`}
              >
                {/* Corner Ambient Glow for Open Item */}
                <div
                  className={`pointer-events-none absolute -top-16 -right-16 w-36 h-36 rounded-full bg-blue-500/15 blur-2xl transition-opacity duration-500 ${
                    isOpen ? "opacity-100" : "opacity-0"
                  }`}
                  aria-hidden="true"
                />

                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between p-6 sm:p-7 text-left focus:outline-none group relative z-10"
                >
                  <span className="font-bold text-sm sm:text-base text-[var(--color-text-primary)] pr-4 group-hover:text-blue-400 transition-colors">
                    {faq.q}
                  </span>
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                      isOpen
                        ? "border-blue-500/40 bg-blue-500/15 text-blue-400 rotate-180 shadow-sm shadow-blue-500/20"
                        : "border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] group-hover:border-blue-500/30 group-hover:text-blue-400 group-hover:bg-blue-500/10"
                    }`}
                    aria-hidden="true"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </button>

                {/* Smooth Expand/Collapse Content Container */}
                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0 pointer-events-none"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="relative z-10 px-6 pb-6 sm:px-7 sm:pb-7 pt-0">
                      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 sm:p-5 flex items-start gap-3.5 text-xs sm:text-sm leading-relaxed">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mt-0.5">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </div>
                        <p className="leading-relaxed text-[var(--color-text-primary)]/90">
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
