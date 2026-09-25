"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Clock,
  Calendar,
  Sparkles,
  Loader2,
  Check,
  Sliders,
  ExternalLink,
  Building2,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { TextInput } from "@/src/components/ui/text-input";
import type { AvailabilityStatus } from "@/src/modules/profiles/services/availability.service";

export interface WorkAvailabilityTabProps {
  initialAvailabilityStatus: AvailabilityStatus;
  initialAvailabilityHoursPerWeek: number;
  initialAvailableFromDate: string;
  initialAvailabilityNotice: string;
  initialIsAvailableForHire: boolean;
  initialIsActivelyHiring: boolean;
  initialRoles: string[];
  locale: string;
  saving: boolean;
  onSaveWorkPreferences: (fields: Record<string, unknown>) => Promise<void>;
}

export function WorkAvailabilityTab({
  initialAvailabilityStatus,
  initialAvailabilityHoursPerWeek,
  initialAvailableFromDate,
  initialAvailabilityNotice,
  initialIsAvailableForHire,
  initialIsActivelyHiring,
  initialRoles,
  locale,
  saving,
  onSaveWorkPreferences,
}: WorkAvailabilityTabProps) {
  const isTr = locale === "tr";

  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>(
    initialAvailabilityStatus || "AVAILABLE_NOW"
  );
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(initialAvailabilityHoursPerWeek || 40);
  const [availableFromDate, setAvailableFromDate] = useState<string>(initialAvailableFromDate || "");
  const [availabilityNotice, setAvailabilityNotice] = useState<string>(initialAvailabilityNotice || "");
  const [isAvailableForHire, setIsAvailableForHire] = useState<boolean>(initialIsAvailableForHire);
  const [isActivelyHiring, setIsActivelyHiring] = useState<boolean>(initialIsActivelyHiring);
  const [roles, setRoles] = useState<string[]>(initialRoles || ["freelancer"]);

  const toggleRole = (roleKey: string) => {
    if (roles.includes(roleKey)) {
      if (roles.length > 1) {
        setRoles(roles.filter((r) => r !== roleKey));
      }
    } else {
      setRoles([...roles, roleKey]);
    }
  };

  const currentPersonaMode: "freelancer" | "employer" | "hybrid" =
    (isAvailableForHire && isActivelyHiring) ||
    (roles.includes("employer") && roles.includes("freelancer"))
      ? "hybrid"
      : isActivelyHiring || (roles.includes("employer") && !roles.includes("freelancer"))
        ? "employer"
        : "freelancer";

  const handleApplyPersona = (mode: "freelancer" | "employer" | "hybrid") => {
    if (mode === "freelancer") {
      setIsActivelyHiring(false);
      setIsAvailableForHire(true);
      setAvailabilityStatus("AVAILABLE_NOW");
      setRoles((prev) => {
        const cleaned = prev.filter((r) => r !== "employer");
        return cleaned.includes("freelancer") ? cleaned : [...cleaned, "freelancer"];
      });
    } else if (mode === "employer") {
      setIsActivelyHiring(true);
      setIsAvailableForHire(false);
      setAvailabilityStatus("BUSY");
      setRoles((prev) => {
        const cleaned = prev.filter((r) => r !== "freelancer");
        return cleaned.includes("employer") ? cleaned : [...cleaned, "employer"];
      });
    } else {
      setIsActivelyHiring(true);
      setIsAvailableForHire(true);
      setAvailabilityStatus("AVAILABLE_NOW");
      setRoles((prev) => {
        const next = new Set(prev);
        next.add("freelancer");
        next.add("employer");
        return Array.from(next);
      });
    }
  };

  const handleSave = async () => {
    await onSaveWorkPreferences({
      availabilityStatus,
      availabilityHoursPerWeek: Number(hoursPerWeek),
      availableFromDate: availableFromDate || null,
      availabilityNotice: availabilityNotice.trim() || null,
      isAvailableForHire,
      isActivelyHiring,
      roles,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-blue-500" />
          <span>{isTr ? "Müsaitlik ve Çalışma Tercihleri" : "Availability & Work Preferences"}</span>
        </h2>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          {isTr
            ? "Müşterilerin ve ekiplerin sizinle ne zaman ve hangi kapasitede iletişime geçebileceğini belirleyin."
            : "Specify your hiring status, capacity, and work mode so clients know when to reach out."}
        </p>
      </div>

      {/* 1. Müsaitlik Durumu */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-[var(--color-text-primary)] block">
          {isTr ? "Güncel Müsaitlik Durumunuz" : "Current Availability Status"}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              id: "AVAILABLE_NOW" as const,
              dot: "bg-emerald-500",
              title: isTr ? "Hemen Müsait" : "Available Now",
              desc: isTr ? "Yeni tekliflere ve acil projelere hemen başlayabilirim." : "Ready to take on new projects immediately.",
            },
            {
              id: "FULL_TIME" as const,
              dot: "bg-blue-500",
              title: isTr ? "Tam Zamanlı Açık" : "Open to Full-Time",
              desc: isTr ? "Uzun vadeli tam zamanlı sözleşmeli pozisyonlara açığım." : "Open to full-time contracts or positions.",
            },
            {
              id: "PARTIALLY_AVAILABLE" as const,
              dot: "bg-amber-500",
              title: isTr ? "Yarı Zamanlı" : "Part-Time",
              desc: isTr ? "Haftalık 10-20 saat esnek çalışma ve seçili projeler." : "Open for part-time, retainer or advising.",
            },
            {
              id: "PROJECT_BASED" as const,
              dot: "bg-purple-500",
              title: isTr ? "Proje Bazlı / Serbest" : "Project-Based / Freelance",
              desc: isTr ? "Belirli süreli sprintler ve anahtar teslim projeler." : "Available for scoped sprints and milestone deliverables.",
            },
            {
              id: "ADVISORY" as const,
              dot: "bg-indigo-500",
              title: isTr ? "Danışmanlık & Mentorluk" : "Advisory & Mentorship",
              desc: isTr ? "Mimari inceleme, kod denetimi ve teknik rehberlik." : "Architecture review, code audit, and advisory.",
            },
            {
              id: "VOLUNTEER" as const,
              dot: "bg-teal-500",
              title: isTr ? "Gönüllü & Sosyal Fayda" : "Volunteer & Pro Bono",
              desc: isTr ? "Açık kaynak, sivil toplum ve sosyal fayda projeleri." : "Open source, non-profit, and social impact work.",
            },
            {
              id: "INTERNSHIP" as const,
              dot: "bg-sky-500",
              title: isTr ? "Staj & Çıraklık" : "Internship & Apprenticeship",
              desc: isTr ? "Junior geliştirici ve stajyer iş birlikleri." : "Junior tracks, learning partnerships, and internships.",
            },
            {
              id: "BUSY" as const,
              dot: "bg-red-500",
              title: isTr ? "Meşgul / Kapalı" : "Busy / Not Taking Work",
              desc: isTr ? "Şu an tam kapasitedeyim, yeni teklif alamıyorum." : "Fully booked with existing commitments.",
            },
          ].map((item) => {
            const isSelected = availabilityStatus === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setAvailabilityStatus(item.id as typeof availabilityStatus)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-blue-500 bg-blue-500/10 shadow-xs ring-1 ring-blue-500"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30 hover:border-[var(--color-border-strong)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${item.dot}`} />
                    <span className="text-xs font-bold text-[var(--color-text-primary)]">{item.title}</span>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-blue-400" />}
                </div>
                <p className="text-[11px] text-[var(--color-text-secondary)] mt-2 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Haftalık Çalışma Kapasitesi (Hours Slider) */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-amber-400" />
            <span>{isTr ? "Haftalık Çalışma Kapasitesi" : "Weekly Work Capacity"}</span>
          </label>
          <span className="text-xs font-bold font-mono text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-lg border border-blue-500/20">
            {hoursPerWeek} {isTr ? "saat / hafta" : "hrs / week"}
          </span>
        </div>

        <input
          type="range"
          min={5}
          max={60}
          step={5}
          value={hoursPerWeek}
          onChange={(e) => setHoursPerWeek(Number(e.target.value))}
          className="w-full accent-blue-500 cursor-pointer"
        />

        <div className="flex items-center justify-between text-[11px] text-[var(--color-text-tertiary)]">
          <span>5h ({isTr ? "Danışmanlık" : "Advising"})</span>
          <span>20h ({isTr ? "Yarı Zamanlı" : "Part-time"})</span>
          <span>40h ({isTr ? "Tam Zamanlı" : "Full-time"})</span>
          <span>60h ({isTr ? "Maksimum" : "Max"})</span>
        </div>
      </div>

      {/* 3. Başlangıç Tarihi & Müsaitlik Notu */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-emerald-400" />
            <span>{isTr ? "En Erken İşe Başlama Tarihi" : "Earliest Available Date"}</span>
          </label>
          <input
            type="date"
            value={availableFromDate}
            onChange={(e) => setAvailableFromDate(e.target.value)}
            className="w-full rounded-xl bg-surface border border-[var(--color-border-subtle)] px-3 py-2 text-xs text-[var(--color-text-primary)] outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[var(--color-text-primary)] block">
              {isTr ? "Müsaitlik Notu" : "Availability Note"}
            </label>
            <span className="text-[10px] text-[var(--color-text-tertiary)]">
              {availabilityNotice.length}/140
            </span>
          </div>
          <TextInput
            value={availabilityNotice}
            onChange={(e) => setAvailabilityNotice(e.target.value)}
            maxLength={140}
            placeholder={
              isTr
                ? "Örn: Şu anki sözleşmem 1 Kasım'da bitiyor, o tarihten itibaren açığım."
                : "e.g. Wrapping up an engagement by end of month."
            }
            className="text-xs"
          />
        </div>
      </div>

      {/* 4. Platform Rolleri ve Çalışma Modu */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-4">
        <div>
          <label className="text-xs font-bold text-[var(--color-text-primary)] block">
            {isTr ? "Profil Çalışma ve Görünüm Modu" : "Profile Orientation & Intent"}
          </label>
          <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
            {isTr
              ? "Profilinizin iş arayan bir uzman mı, ekip kuran bir işveren mi, yoksa her ikisi olarak mı görüntüleneceğini belirleyin."
              : "Choose whether your profile highlights freelance availability, active hiring, or both."}
          </p>
        </div>

        {/* 3-Choice Persona Mode Segmented Control */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {[
            {
              id: "freelancer" as const,
              icon: Sparkles,
              label: isTr ? "Bağımsız Uzman" : "Specialist / Freelancer",
              desc: isTr ? "Hizmet satışı & portfolyo odağı" : "Offer services & portfolio focus",
            },
            {
              id: "employer" as const,
              icon: Briefcase,
              label: isTr ? "İş Veren / Müşteri" : "Client / Employer",
              desc: isTr ? "İlan açma & ekip kurma odağı" : "Post briefs & hire talent focus",
            },
            {
              id: "hybrid" as const,
              icon: Building2,
              label: isTr ? "Her İkisi (Hibrit)" : "Both (Hybrid)",
              desc: isTr ? "Hem uzmanlık hem işverenlik" : "Both work & hire talent",
            },
          ].map((p) => {
            const active = currentPersonaMode === p.id;
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPersona(p.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  active
                    ? "border-blue-500 bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30 shadow-xs"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-bold text-[var(--color-text-primary)]">
                    {p.label}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--color-text-tertiary)] leading-snug">
                  {p.desc}
                </p>
              </button>
            );
          })}
        </div>

        <label className="text-xs font-bold text-[var(--color-text-primary)] block pt-2">
          {isTr ? "Detaylı Platform Rolleri" : "Detailed Platform Roles"}
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { id: "freelancer", label: isTr ? "Yazılımcı / Freelancer" : "Freelancer" },
            { id: "agency", label: isTr ? "Yazılım Ajansı / Ekip" : "Agency / Studio" },
            { id: "employer", label: isTr ? "İşveren / Şirket" : "Client / Employer" },
            { id: "founder", label: isTr ? "Girişimci / Founder" : "Startup Founder" },
          ].map((role) => {
            const isSelected = roles.includes(role.id);
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => toggleRole(role.id)}
                className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                  isSelected
                    ? "border-blue-500 bg-blue-500/15 text-blue-400"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]"
                }`}
              >
                {role.label}
              </button>
            );
          })}
        </div>

        {/* İkili Toggle Modu */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30">
            <div>
              <span className="text-xs font-bold text-[var(--color-text-primary)] block">
                {isTr ? "İş Tekliflerine Açığım (Hire Me)" : "Available for Hire"}
              </span>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                {isTr
                  ? "Profiliniz yazılımcı ve ekip arayan işverenlerin radarına düşer."
                  : "Allow clients to discover your profile and send direct project offers."}
              </p>
            </div>
            <input
              type="checkbox"
              checked={isAvailableForHire}
              onChange={(e) => setIsAvailableForHire(e.target.checked)}
              className="h-4 w-4 rounded accent-blue-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30">
            <div>
              <span className="text-xs font-bold text-[var(--color-text-primary)] block">
                {isTr ? "Aktif Olarak İşe Alım Yapıyorum (Actively Hiring)" : "Actively Hiring"}
              </span>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                {isTr
                  ? "İlanlarınızda ve profilinizde 'Ekip Arkadaşı Arıyor' rozeti görüntülenir."
                  : "Display 'Actively Hiring' badge on your company profile and postings."}
              </p>
            </div>
            <input
              type="checkbox"
              checked={isActivelyHiring}
              onChange={(e) => setIsActivelyHiring(e.target.checked)}
              className="h-4 w-4 rounded accent-blue-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Akış & Keşif Sayfası Tercihleri Köprüsü */}
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-blue-400" />
            <h4 className="text-xs font-bold text-[var(--color-text-primary)]">
              {isTr ? "Akış Sayfası ve Panel Tercihleri" : "Feed Page & Panel Preferences"}
            </h4>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {isTr
              ? "Akış sayfasındaki sağ ve sol panellerdeki widget'ları doğrudan akış üzerinde özelleştirebilirsiniz."
              : "Customize the widgets in your left and right panels directly on the feed stream."}
          </p>
        </div>
        <Link href={isTr ? "/tr/ilanlar" : "/en/listings"}>
          <Button variant="outline" size="sm" className="gap-2 shrink-0 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 cursor-pointer">
            <ExternalLink className="h-3.5 w-3.5" />
            <span>{isTr ? "Akışa Git & Özelleştir" : "Open Feed & Customize"}</span>
          </Button>
        </Link>
      </div>

      {/* Kaydet Butonu */}
      <div className="pt-6 border-t border-[var(--color-border-subtle)] flex items-center justify-end">
        <Button onClick={handleSave} disabled={saving} className="cursor-pointer gap-2">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{isTr ? "Kaydediliyor..." : "Saving..."}</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>{isTr ? "Müsaitlik Tercihlerini Kaydet" : "Save Availability"}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
