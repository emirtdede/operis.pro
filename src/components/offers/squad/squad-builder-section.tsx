"use client";

import { Users, Plus, Trash2, ShieldCheck, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "../../ui/button";
import { TextInput } from "../../ui/text-input";
import { SquadRevenueEngine, SquadMemberInput } from "@/src/modules/offers/squad-engine";

export interface SquadMemberDraft extends SquadMemberInput {
  id?: string;
}

export interface SquadBuilderSectionProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  squadTitle: string;
  onTitleChange: (title: string) => void;
  members: SquadMemberDraft[];
  onChangeMembers: (members: SquadMemberDraft[]) => void;
  totalBudget?: number;
  currency?: string;
  locale?: string;
  error?: string | null;
}

function getMemberRoleLabel(isLead: boolean, idx: number, isTr: boolean): string {
  if (isLead) {
    return isTr ? "Lider Yüklenici (Muhatap / Siz)" : "Lead Contractor (Prime / You)";
  }
  return isTr ? `Ortak Yüklenici #${idx + 1}` : `Co-Contractor #${idx + 1}`;
}

function getTotalTextColorClass(isHundred: boolean, roundedTotal: number): string {
  if (isHundred) {
    return "text-emerald-400";
  }
  if (roundedTotal > 100) {
    return "text-red-400";
  }
  return "text-amber-400";
}

function getTotalBarBgClass(isHundred: boolean, roundedTotal: number): string {
  if (isHundred) {
    return "bg-emerald-500";
  }
  if (roundedTotal > 100) {
    return "bg-red-500";
  }
  return "bg-amber-500";
}

function getTotalValidationWarning(roundedTotal: number, isTr: boolean): string {
  if (roundedTotal < 100) {
    const remaining = (100 - roundedTotal).toFixed(1);
    return isTr
      ? `⚠️ Toplam %100 olmalıdır. Kalan %${remaining} dağıtılmalıdır.`
      : `⚠️ Total must equal 100%. Remaining %${remaining} to allocate.`;
  }
  const excess = (roundedTotal - 100).toFixed(1);
  return isTr
    ? `❌ Toplam %100'ü aştı! Lütfen %${excess} azaltın.`
    : `❌ Total exceeds 100%! Please reduce by %${excess}.`;
}

export function SquadBuilderSection({
  enabled,
  onToggle,
  squadTitle,
  onTitleChange,
  members,
  onChangeMembers,
  totalBudget,
  currency = "TRY",
  locale = "tr",
  error,
}: SquadBuilderSectionProps) {
  const isTr = locale === "tr";

  const totalPercentage = members.reduce(
    (acc, m) => acc + (Number(m.revenueSharePercentage) || 0),
    0
  );
  const roundedTotal = Math.round(totalPercentage * 100) / 100;
  const isHundred = Math.abs(roundedTotal - 100) < 0.01;

  // Calculate live payouts if budget is given
  const calculatedPayouts =
    totalBudget && totalBudget > 0
      ? SquadRevenueEngine.calculatePayouts(totalBudget, currency, members)
      : [];

  const handleApplyPreset = (type: "mobile" | "fullstack" | "ai" | "design") => {
    if (type === "mobile") {
      onTitleChange(isTr ? "Mobil & Bulut Entegre Ekibi" : "Mobile & Cloud Agile Squad");
      onChangeMembers([
        {
          displayName: members[0]?.displayName || (isTr ? "Siz (Ekip Lideri)" : "You (Lead)"),
          roleTitle: isTr ? "Mobil Uygulama Mimarı (iOS/Android)" : "Mobile Architect",
          revenueSharePercentage: 45,
          scopeSummary: isTr ? "Mobil istemci, yerel modüller ve arayüz entegrasyonu" : "Mobile client app",
          isLead: true,
        },
        {
          displayName: isTr ? "Backend Uzmanı" : "Backend Specialist",
          roleTitle: isTr ? "Kıdemli Backend & API Mühendisi" : "Senior Backend Engineer",
          revenueSharePercentage: 35,
          scopeSummary: isTr ? "REST/GraphQL API, veritabanı şeması ve kimlik doğrulama" : "API & DB architecture",
          isLead: false,
        },
        {
          displayName: isTr ? "UI/UX Tasarımcısı" : "UI/UX Designer",
          roleTitle: isTr ? "Ürün & Arayüz Tasarımcısı" : "Product & UI/UX Designer",
          revenueSharePercentage: 20,
          scopeSummary: isTr ? "Figma tasarım sistemi, prototipleme ve kullanıcı testleri" : "Figma design system",
          isLead: false,
        },
      ]);
    } else if (type === "fullstack") {
      onTitleChange(isTr ? "Full-Stack Web & Bulut Kolektifi" : "Full-Stack Web Consortium");
      onChangeMembers([
        {
          displayName: members[0]?.displayName || (isTr ? "Siz (Ekip Lideri)" : "You (Lead)"),
          roleTitle: isTr ? "Kıdemli Fullstack Lideri" : "Senior Fullstack Lead",
          revenueSharePercentage: 50,
          scopeSummary: isTr ? "Uçtan uca mimari, iş mantığı ve çekirdek geliştirme" : "Architecture & core logic",
          isLead: true,
        },
        {
          displayName: isTr ? "Frontend Geliştirici" : "Frontend Engineer",
          roleTitle: isTr ? "Modern Web & Next.js Uzmanı" : "Modern Web & UI Specialist",
          revenueSharePercentage: 30,
          scopeSummary: isTr ? "Bileşen kütüphanesi, SEO optimizasyonu ve reaktif arayüz" : "UI components & SEO",
          isLead: false,
        },
        {
          displayName: isTr ? "DevOps & QA Mühendisi" : "DevOps & QA Engineer",
          roleTitle: isTr ? "Bulut Altyapı & Test Mühendisi" : "Cloud & QA Engineer",
          revenueSharePercentage: 20,
          scopeSummary: isTr ? "CI/CD boru hatları, Docker container ve otomatik testler" : "CI/CD & E2E tests",
          isLead: false,
        },
      ]);
    } else if (type === "ai") {
      onTitleChange(isTr ? "Yapay Zeka & Veri Konsorsiyumu" : "AI & Data Solutions Squad");
      onChangeMembers([
        {
          displayName: members[0]?.displayName || (isTr ? "Siz (Ekip Lideri)" : "You (Lead)"),
          roleTitle: isTr ? "Yapay Zeka / ML Araştırmacısı" : "AI / ML Specialist",
          revenueSharePercentage: 50,
          scopeSummary: isTr ? "Model eğitimi, RAG boru hattı ve zeka motoru" : "RAG & LLM pipelines",
          isLead: true,
        },
        {
          displayName: isTr ? "Veri Mühendisi" : "Data Engineer",
          roleTitle: isTr ? "Veri Boru Hattı & ETL Uzmanı" : "Data & ETL Engineer",
          revenueSharePercentage: 30,
          scopeSummary: isTr ? "Vektör veritabanı, veri temizleme ve besleme boru hattı" : "Vector DB & ETL",
          isLead: false,
        },
        {
          displayName: isTr ? "Sistem & API Entegratörü" : "Systems Integrator",
          roleTitle: isTr ? "API & Bulut Servis Entegratörü" : "Cloud & API Integrator",
          revenueSharePercentage: 20,
          scopeSummary: isTr ? "Mikroservisler, API ağ geçidi ve yük testi" : "Microservices & gateway",
          isLead: false,
        },
      ]);
    } else if (type === "design") {
      onTitleChange(isTr ? "Tasarım & Dijital Marka Kolektifi" : "Brand & UI/UX Collective");
      onChangeMembers([
        {
          displayName: members[0]?.displayName || (isTr ? "Siz (Ekip Lideri)" : "You (Lead)"),
          roleTitle: isTr ? "Kıdemli Ürün Tasarımcısı" : "Lead Product Designer",
          revenueSharePercentage: 50,
          scopeSummary: isTr ? "Kullanıcı deneyimi araştırması, tel kafesler ve prototipler" : "UX research & prototypes",
          isLead: true,
        },
        {
          displayName: isTr ? "Tasarım Sistemi Uzmanı" : "Design System Specialist",
          roleTitle: isTr ? "Tasarım Sistemi & İllüstrasyon" : "Design System & Illustration",
          revenueSharePercentage: 25,
          scopeSummary: isTr ? "Marka kılavuzu, tipografi ve token kütüphanesi" : "Design tokens & branding",
          isLead: false,
        },
        {
          displayName: isTr ? "Frontend / UI Geliştirici" : "UI Developer",
          roleTitle: isTr ? "Tasarım Kodlayıcı & Web Uzmanı" : "Creative Web Developer",
          revenueSharePercentage: 25,
          scopeSummary: isTr ? "Mikro-etkileşimler, Tailwind/CSS ve responsive kodlama" : "Interactions & styling",
          isLead: false,
        },
      ]);
    }
  };

  const handleMemberChange = (index: number, field: keyof SquadMemberDraft, value: string | number) => {
    const updated = [...members];
    const target = updated[index];
    if (!target) return;
    updated[index] = {
      ...target,
      [field]: value,
    } as SquadMemberDraft;
    onChangeMembers(updated);
  };

  const handleAddMember = () => {
    if (members.length >= 5) return;
    const remaining = Math.max(0, 100 - roundedTotal);
    const newShare = remaining > 0 ? remaining : 10;

    onChangeMembers([
      ...members,
      {
        displayName: "",
        roleTitle: "",
        revenueSharePercentage: newShare,
        scopeSummary: "",
        isLead: false,
      },
    ]);
  };

  const handleRemoveMember = (index: number) => {
    if (members[index]?.isLead) return;
    const updated = members.filter((_, i) => i !== index);
    onChangeMembers(updated);
  };

  return (
    <div className="rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-950/20 via-[var(--color-surface-base)] to-purple-950/15 p-4 sm:p-5 space-y-4">
      {/* Toggle Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0 border border-indigo-500/30">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[var(--color-text-primary)] block">
              {isTr ? "👥 Ekip Arkadaşı Ekle (Ortak Teklif / Kolektif)" : "👥 Add Squad Members (Consortium Offer)"}
            </span>
            <span className="text-[11px] text-[var(--color-text-tertiary)]">
              {isTr
                ? "Farklı disiplinlerdeki uzmanlarla ortak teklif verin; hakedişi baştan şeffafça paylaştırın."
                : "Form a fractional squad with co-specialists; allocate transparent revenue shares upfront."}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const nextState = !enabled;
            onToggle(nextState);
            if (nextState && members.length === 0) {
              onChangeMembers([
                {
                  displayName: isTr ? "Siz (Ekip Lideri)" : "You (Lead Contractor)",
                  roleTitle: isTr ? "Baş Mühendis / Ekip Lideri" : "Lead Contractor",
                  revenueSharePercentage: 60,
                  scopeSummary: isTr ? "Mimari, koordinasyon ve iş teslimatı" : "Architecture & coordination",
                  isLead: true,
                },
                {
                  displayName: "",
                  roleTitle: "",
                  revenueSharePercentage: 40,
                  scopeSummary: "",
                  isLead: false,
                },
              ]);
            }
          }}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
            enabled ? "bg-indigo-600" : "bg-gray-700"
          }`}
          role="switch"
          aria-checked={enabled}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {enabled && (
        <div className="space-y-4 pt-2 border-t border-indigo-500/20 animate-in fade-in duration-200">
          {/* Quick Presets */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {isTr ? "Hızlı Şablonlar (Hazır Ekip Dağılımı):" : "Quick Squad Presets:"}
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset("mobile")}
                className="text-[11px] px-2.5 py-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-200 transition-colors cursor-pointer"
              >
                📱 {isTr ? "Mobil Proje (3 Kişi)" : "Mobile App (3)"}
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset("fullstack")}
                className="text-[11px] px-2.5 py-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-200 transition-colors cursor-pointer"
              >
                🌐 {isTr ? "Web & Bulut (3 Kişi)" : "Fullstack Web (3)"}
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset("ai")}
                className="text-[11px] px-2.5 py-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-200 transition-colors cursor-pointer"
              >
                🤖 {isTr ? "Yapay Zeka (3 Kişi)" : "AI / Data (3)"}
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset("design")}
                className="text-[11px] px-2.5 py-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-200 transition-colors cursor-pointer"
              >
                🎨 {isTr ? "UI/UX & Tasarım (3 Kişi)" : "Design & UI (3)"}
              </button>
            </div>
          </div>

          {/* Squad Title Input */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">
              {isTr ? "Kolektif / Ekip Başlığı (Örn: 'iOS & Backend Çevik Takımı')" : "Squad Title (e.g. 'iOS & Cloud Team')"}
            </label>
            <TextInput
              value={squadTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder={isTr ? "Örn: Finansal Teknoloji Çevik Kolektifi" : "e.g. Fintech Agile Squad"}
              maxLength={120}
            />
          </div>

          {/* Member Rows */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                {isTr ? "Ekip Üyeleri & Hakediş Dağılımı (2 - 5 Uzman)" : "Squad Members & Split (2 - 5 Specialists)"}
              </label>
              <span className="text-[11px] text-[var(--color-text-tertiary)]">
                {members.length}/5 {isTr ? "üye" : "members"}
              </span>
            </div>

            {members.map((member, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border transition-all ${
                  member.isLead
                    ? "border-indigo-500/40 bg-indigo-500/10"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/40"
                } space-y-2.5`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-300">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                      {getMemberRoleLabel(Boolean(member.isLead), idx, isTr)}
                    </span>
                  </div>

                  {!member.isLead && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(idx)}
                      className="text-gray-400 hover:text-red-400 transition-colors p-1 cursor-pointer"
                      title={isTr ? "Üyeyi Kaldır" : "Remove Member"}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <TextInput
                    placeholder={isTr ? "Ad Soyad / Operis Kullanıcı Adı" : "Full Name / Handle"}
                    value={member.displayName}
                    onChange={(e) => handleMemberChange(idx, "displayName", e.target.value)}
                    required
                  />
                  <TextInput
                    placeholder={isTr ? "Rol (örn: Kıdemli Backend Dev)" : "Role (e.g. Senior Backend Dev)"}
                    value={member.roleTitle}
                    onChange={(e) => handleMemberChange(idx, "roleTitle", e.target.value)}
                    required
                  />
                  <div className="flex items-center gap-1.5">
                    <TextInput
                      type="number"
                      min={1}
                      max={99}
                      step="0.5"
                      placeholder="%"
                      value={member.revenueSharePercentage ? String(member.revenueSharePercentage) : ""}
                      onChange={(e) =>
                        handleMemberChange(idx, "revenueSharePercentage", parseFloat(e.target.value) || 0)
                      }
                      className="text-right font-mono"
                      required
                    />
                    <span className="text-xs font-bold text-indigo-300 shrink-0">%</span>
                  </div>
                </div>

                <TextInput
                  placeholder={
                    isTr
                      ? "Üstlenilen İş Kapsamı (Örn: PostgreSQL şeması, FastAPI mikroservisleri ve Auth0)"
                      : "Work Scope Summary (e.g. Database schema, FastAPI microservices and Auth0)"
                  }
                  value={member.scopeSummary || ""}
                  onChange={(e) => handleMemberChange(idx, "scopeSummary", e.target.value)}
                  className="text-xs"
                  maxLength={200}
                />

                {/* Calculated Live Payout if Available */}
                {calculatedPayouts[idx] && (
                  <div className="text-[11px] text-emerald-400 flex items-center justify-between pt-0.5 font-mono">
                    <span>{isTr ? "Hesaplanan Net Hakediş:" : "Projected Payout:"}</span>
                    <span className="font-semibold">{calculatedPayouts[idx].formattedAmount}</span>
                  </div>
                )}
              </div>
            ))}

            {members.length < 5 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddMember}
                className="w-full border-dashed border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                {isTr ? "Ekip Arkadaşı Ekle (Maks. 5)" : "Add Squad Member (Max 5)"}
              </Button>
            )}
          </div>

          {/* Revenue Distribution Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[var(--color-text-secondary)]">
                {isTr ? "Toplam Hakediş Dağılımı:" : "Total Revenue Split:"}
              </span>
              <span
                className={`font-mono font-bold flex items-center gap-1 ${getTotalTextColorClass(isHundred, roundedTotal)}`}
              >
                {isHundred ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5" />
                )}
                %{roundedTotal.toFixed(1)} / %100
              </span>
            </div>

            <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${getTotalBarBgClass(isHundred, roundedTotal)}`}
                style={{ width: `${Math.min(100, Math.max(0, roundedTotal))}%` }}
              />
            </div>

            {!isHundred && (
              <p className="text-[11px] text-amber-400 font-medium">
                {getTotalValidationWarning(roundedTotal, isTr)}
              </p>
            )}
          </div>

          {/* Legal and Invariant Notice */}
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-[11px] text-indigo-300/85 leading-relaxed flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-indigo-200 block">
                {isTr ? "TBK m. 620 Adi Ortaklık & Konsorsiyum Güvencesi" : "Legal Consortium Protection"}
              </span>
              <span>
                {isTr
                  ? "Bu teklif onaylandığında, ekip üyeleri Türk Borçlar Kanunu kapsamında ortak yüklenici olarak sözleşmeye tescil edilir. İşverenle iletişim tek muhatap (Lider Yüklenici) üzerinden yürütülür."
                  : "Upon acceptance, team members are bound under bilateral consortium terms. Communications with the employer are channeled via the Lead Contractor."}
              </span>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-2.5 text-xs text-red-400">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
