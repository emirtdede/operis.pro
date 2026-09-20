"use client";

import { useState } from "react";
import { Users, ShieldCheck, UserCheck, ChevronDown, ChevronUp, Sparkles, HelpCircle } from "lucide-react";

export interface SquadExplainerCardProps {
  locale?: string;
  defaultExpanded?: boolean;
  className?: string;
}

function getExplainerToggleLabel(isExpanded: boolean, isTr: boolean): string {
  if (isExpanded) {
    return isTr ? "Gizle" : "Hide";
  }
  return isTr ? "Detaylı Bilgi" : "Learn More";
}

export function SquadExplainerCard({
  locale = "tr",
  defaultExpanded = false,
  className = "",
}: SquadExplainerCardProps) {
  const isTr = locale === "tr";
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div
      className={`rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-950/30 via-[var(--color-surface-base)] to-purple-950/20 p-4 sm:p-5 shadow-xs transition-all duration-300 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0 border border-indigo-500/30">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
                {isTr ? "👥 Çevik Ekip (Kolektif Teklif) Nedir?" : "👥 What is a Freelance Squad Proposal?"}
              </h4>
              <span className="inline-flex items-center rounded-md bg-indigo-500/15 px-2 py-0.5 text-[10px] font-medium text-indigo-300 border border-indigo-500/30">
                {isTr ? "İşveren Kılavuzu" : "Employer Guide"}
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              {isTr
                ? "Farklı disiplinlerdeki bağımsız uzmanların tek bir konsorsiyum olarak sunduğu entegre teklif modelidir."
                : "An integrated consortium proposal where independent specialists unite as a single agile delivery team."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer shrink-0 mt-1"
          aria-expanded={isExpanded}
        >
          <span>{getExplainerToggleLabel(isExpanded, isTr)}</span>
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-indigo-500/20 space-y-3.5 text-xs text-[var(--color-text-secondary)] leading-relaxed animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Benefit 1: Single Point of Contact */}
            <div className="flex items-start gap-2.5 rounded-xl bg-[var(--color-surface-hover)]/60 p-3 border border-indigo-500/10">
              <UserCheck className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-[var(--color-text-primary)] block">
                  {isTr ? "1. Tek Muhatap & Koordinasyon Kolaylığı" : "1. Single Point of Contact"}
                </strong>
                <span>
                  {isTr
                    ? "3 farklı uzmanla ayrı ayrı görüşmek, sözleşme yapmak veya aralarındaki koordinasyonu sağlamak zorunda kalmazsınız. Ekip Lideri tüm proje akışından sorumludur."
                    : "No need to negotiate 3 separate contracts or coordinate fragmented contractors. The Lead Contractor manages delivery and communications."}
                </span>
              </div>
            </div>

            {/* Benefit 2: Ready & Synergistic Team */}
            <div className="flex items-start gap-2.5 rounded-xl bg-[var(--color-surface-hover)]/60 p-3 border border-indigo-500/10">
              <Sparkles className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-[var(--color-text-primary)] block">
                  {isTr ? "2. Entegre Disiplinler (Squad Sinerjisi)" : "2. Integrated Disciplinary Synergy"}
                </strong>
                <span>
                  {isTr
                    ? "Frontend, Backend, UI/UX veya Yapay Zeka uzmanları birbirlerinin çalışma tarzını bilen hazır bir takım olarak projenize doğrudan başlar."
                    : "Frontend, Backend, UI/UX or AI experts join as a battle-tested squad with established workflows from day one."}
                </span>
              </div>
            </div>

            {/* Benefit 3: Legal Protection TBK 620 */}
            <div className="flex items-start gap-2.5 rounded-xl bg-[var(--color-surface-hover)]/60 p-3 border border-indigo-500/10">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-[var(--color-text-primary)] block">
                  {isTr ? "3. Hukuki Güvence (TBK m. 620 Adi Ortaklık)" : "3. Legal Consortium Protection"}
                </strong>
                <span>
                  {isTr
                    ? "Sözleşme Türk Borçlar Kanunu konsorsiyum esaslarına göre tanzim edilir. Tüm ekip üyeleri taahhüt edilen işe ve FSEK m. 52 telif devrine müteselsilen bağlıdır."
                    : "Contracts are drafted as an agile consortium with joint liability and comprehensive IP assignment under international & local contract laws."}
                </span>
              </div>
            </div>

            {/* Benefit 4: Transparent Revenue Split */}
            <div className="flex items-start gap-2.5 rounded-xl bg-[var(--color-surface-hover)]/60 p-3 border border-indigo-500/10">
              <HelpCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-[var(--color-text-primary)] block">
                  {isTr ? "4. Baştan Belirli Şeffaf Hakediş Dağılımı" : "4. Transparent Revenue Split"}
                </strong>
                <span>
                  {isTr
                    ? "Hangi uzmanın bütçenin yüzde kaçını alacağı (%50 Backend, %35 Frontend, %15 Tasarım vb.) teklif anında belirlenmiştir. Gizli komisyon veya sürpriz masraf yoktur."
                    : "Each member's share (e.g. 50% Backend, 35% Frontend, 15% UI/UX) is transparently locked upfront with no hidden markup."}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-3.5 py-2.5 text-[11px] text-indigo-300/90 flex items-center justify-between">
            <span>
              {isTr
                ? "📌 İşveren olarak tek bir toplam bütçe onaylarsınız. Ekip içi hakediş dağılımı sözleşmede otomatik tescil edilir."
                : "📌 You approve a single aggregate budget. Inter-squad allocations are automatically registered in the bilateral contract."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
