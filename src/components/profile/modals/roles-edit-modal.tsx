"use client";

import React, { useState } from "react";
import { Dialog } from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import {
  Briefcase,
  Sparkles,
  Rocket,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
} from "lucide-react";
import type { AvailabilityStatus } from "@/src/modules/profiles/service";
import { getErrorMessage, getLoadingButtonLabel } from "./modal-helpers";

export interface RolesEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRoles: string[];
  initialIsAvailableForHire: boolean;
  initialIsActivelyHiring: boolean;
  initialAvailabilityStatus?: AvailabilityStatus;
  initialAvailabilityHoursPerWeek?: number;
  initialAvailableFromDate?: string | null;
  initialAvailabilityNotice?: string | null;
  locale: string;
  onSave: (data: {
    roles: string[];
    isAvailableForHire: boolean;
    isActivelyHiring: boolean;
    availabilityStatus?: AvailabilityStatus;
    availabilityHoursPerWeek?: number;
    availableFromDate?: string | null;
    availabilityNotice?: string | null;
  }) => Promise<void>;
}

export function RolesEditModal({
  isOpen,
  onClose,
  initialRoles,
  initialIsAvailableForHire,
  initialIsActivelyHiring,
  initialAvailabilityStatus,
  initialAvailabilityHoursPerWeek,
  initialAvailableFromDate,
  initialAvailabilityNotice,
  locale,
  onSave,
}: RolesEditModalProps) {
  const isTr = locale === "tr";
  const [roles, setRoles] = useState<string[]>(initialRoles);
  const [isActivelyHiring, setIsActivelyHiring] = useState(initialIsActivelyHiring);
  const fallbackAvailability: AvailabilityStatus = initialIsAvailableForHire ? "AVAILABLE_NOW" : "BUSY";
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>(
    initialAvailabilityStatus || fallbackAvailability
  );
  const [availabilityHoursPerWeek, setAvailabilityHoursPerWeek] = useState<number>(
    initialAvailabilityHoursPerWeek ?? 40
  );
  const [availableFromDate, setAvailableFromDate] = useState<string>(
    initialAvailableFromDate || ""
  );
  const [availabilityNotice, setAvailabilityNotice] = useState<string>(
    initialAvailabilityNotice || ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableRoleOptions = [
    {
      id: "employer",
      label: isTr ? "İş Veren / Proje Sahibi" : "Employer / Client",
      desc: isTr
        ? "İlan yayınlayan, bütçe yöneten ve bağımsız uzman arayan taraf"
        : "Publishes listings, manages budgets, hires talent",
      icon: Briefcase,
      color: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    },
    {
      id: "freelancer",
      label: isTr ? "Bağımsız Uzman / Freelancer" : "Independent Specialist",
      desc: isTr
        ? "Projelere teklif sunan, yetenek ve profesyonel hizmet sağlayan taraf"
        : "Submits proposals, provides development or design services",
      icon: Sparkles,
      color: "border-purple-500/30 bg-purple-500/10 text-purple-400",
    },
    {
      id: "founder",
      label: isTr ? "Girişimci / Kurucu (Founder)" : "Founder / Entrepreneur",
      desc: isTr
        ? "Dijital ürün, SaaS veya startup geliştiren vizyoner"
        : "Building SaaS products, ventures, or technology startups",
      icon: Rocket,
      color: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    },
    {
      id: "agency",
      label: isTr ? "Ajans / Stüdyo" : "Agency / Studio",
      desc: isTr
        ? "Kolektif ekip veya tasarım/yazılım stüdyosu olarak hizmet sunan"
        : "Collective studio or agency delivering end-to-end solutions",
      icon: Building2,
      color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    },
  ];

  const availabilityOptions: Array<{
    id: AvailabilityStatus;
    labelTr: string;
    labelEn: string;
    subtextTr: string;
    subtextEn: string;
    colorClasses: string;
    dotColor: string;
  }> = [
    {
      id: "AVAILABLE_NOW",
      labelTr: "Hemen Başlayabilir (30+ saat/hafta)",
      labelEn: "Available Now (30+ hrs/wk)",
      subtextTr: "Tam zamanlı veya acil projelere hemen başlayabilecek durumda.",
      subtextEn: "Ready for full-time or urgent projects immediately.",
      colorClasses: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
      dotColor: "bg-emerald-400 animate-pulse",
    },
    {
      id: "PARTIALLY_AVAILABLE",
      labelTr: "Kısmi Zamanlı Müsait (10-20 saat/hafta)",
      labelEn: "Partially Available (10-20 hrs/wk)",
      subtextTr: "Haftada sınırlı saat ayırabilir, seçili projelere açık.",
      subtextEn: "Can commit limited hours weekly, open to select scopes.",
      colorClasses: "border-amber-500/30 bg-amber-500/10 text-amber-400",
      dotColor: "bg-amber-400",
    },
    {
      id: "BUSY",
      labelTr: "Şu An Meşgul (Yeni Proje Almıyor)",
      labelEn: "Currently Busy (Not Taking Projects)",
      subtextTr: "İş yükü dolu veya belirli bir tarihe kadar teklif kabul etmiyor.",
      subtextEn: "Workload is full or not accepting proposals until a set date.",
      colorClasses: "border-rose-500/30 bg-rose-500/10 text-rose-400",
      dotColor: "bg-rose-400",
    },
  ];

  const toggleRole = (roleId: string) => {
    if (roles.includes(roleId)) {
      setRoles(roles.filter((r) => r !== roleId));
    } else {
      setRoles([...roles, roleId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const isForHire = availabilityStatus !== "BUSY";
      let resolvedAvailableFromDate: string | null = null;
      if (availabilityStatus === "BUSY" && availableFromDate) {
        resolvedAvailableFromDate = availableFromDate;
      }

      await onSave({
        roles,
        isAvailableForHire: isForHire,
        isActivelyHiring,
        availabilityStatus,
        availabilityHoursPerWeek: isForHire ? availabilityHoursPerWeek : 0,
        availableFromDate: resolvedAvailableFromDate,
        availabilityNotice: availabilityNotice.trim() || null,
      });
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err, isTr ? "Kaydedilemedi" : "Save failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isTr ? "Roller ve Müsaitlik Durumu" : "Roles & Availability Status"}
      description={
        isTr
          ? "Platform kimliklerinizi, anlık iş yükünüzü ve projelere müsaitliğinizi yönetin."
          : "Manage your platform roles, workload capacity, and real-time availability."
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Roles Multi-Select */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
            {isTr ? "Platform Kimlikleriniz (Çoklu Seçim)" : "Your Roles (Multi-Select)"}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {availableRoleOptions.map((opt) => {
              const selected = roles.includes(opt.id);
              const Icon = opt.icon;
              return (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => toggleRole(opt.id)}
                  className={`flex items-start gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selected
                      ? `${opt.color} ring-1 ring-blue-500/30 shadow-xs`
                      : "border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] opacity-70 hover:opacity-100"
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                      selected ? "bg-white/10" : "bg-black/10"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-[var(--color-text-primary)]">
                        {opt.label}
                      </span>
                      {selected && (
                        <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5 leading-snug">
                      {opt.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3-Tier Availability Status */}
        <div className="space-y-3 pt-3 border-t border-[var(--color-border-subtle)]">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              {isTr ? "Müsaitlik ve İş Yükü Durumu" : "Availability & Workload Status"}
            </label>
            <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
              {isTr
                ? "İlan sahipleri arama sonuçlarında gerçek zamanlı durumunuzu görür."
                : "Clients see your real-time availability badge in search and profile."}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {availabilityOptions.map((opt) => {
              const selected = availabilityStatus === opt.id;
              return (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setAvailabilityStatus(opt.id)}
                  className={`flex items-start gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selected
                      ? `${opt.colorClasses} ring-2 ring-blue-500/40 shadow-xs`
                      : "border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] opacity-70 hover:opacity-100"
                  }`}
                >
                  <span className="relative flex h-3 w-3 mt-1 shrink-0">
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${opt.dotColor}`} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-[var(--color-text-primary)]">
                        {isTr ? opt.labelTr : opt.labelEn}
                      </span>
                      {selected && <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
                      {isTr ? opt.subtextTr : opt.subtextEn}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Conditional Workload Hours Selector (when not BUSY) */}
          {availabilityStatus !== "BUSY" && (
            <div className="p-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-text-primary)]">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-blue-400" />
                  <span>{isTr ? "Haftalık Çalışma Kapasitesi:" : "Weekly Capacity:"}</span>
                </span>
                <span className="font-mono text-blue-400 font-bold">
                  {availabilityHoursPerWeek} {isTr ? "saat / hafta" : "hrs / week"}
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={availabilityHoursPerWeek}
                onChange={(e) => setAvailabilityHoursPerWeek(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex items-center justify-between gap-1 pt-1">
                {[10, 20, 30, 40, 50].map((h) => (
                  <button
                    type="button"
                    key={h}
                    onClick={() => setAvailabilityHoursPerWeek(h)}
                    className={`px-2 py-0.5 text-[10px] rounded-lg font-mono border transition-colors ${
                      availabilityHoursPerWeek === h
                        ? "bg-blue-600 text-white border-blue-500"
                        : "border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conditional Busy Until Date (when BUSY) */}
          {availabilityStatus === "BUSY" && (
            <div className="p-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>{isTr ? "Hangi Tarihe Kadar Meşgulsünüz?" : "Busy Until Date"}</span>
              </div>
              <input
                type="date"
                value={availableFromDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setAvailableFromDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[10px] text-[var(--color-text-tertiary)]">
                {isTr
                  ? "Bu tarih geldiğinde Operis algoritması profilinizi otomatik olarak 'Hemen Başlayabilir' durumuna getirecektir."
                  : "Operis auto-transition will elevate your status back to 'Available Now' once this date arrives."}
              </p>
            </div>
          )}

          {/* Optional Availability Notice Note */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)]">
              {isTr ? "Özel Müsaitlik Notu (İsteğe Bağlı)" : "Custom Notice (Optional)"}
            </label>
            <input
              type="text"
              maxLength={120}
              placeholder={isTr ? "Örn: Yalnızca Next.js ve yapay zeka projelerine açığım." : "E.g. Only open for Next.js AI integrations."}
              value={availabilityNotice}
              onChange={(e) => setAvailabilityNotice(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Actively Hiring Toggle */}
          <label className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] cursor-pointer mt-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-primary)]">
                <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
                <span>{isTr ? "Aktif İlanları Var / İş Veriyor (Hiring)" : "Actively Hiring"}</span>
              </div>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                {isTr
                  ? "Platformda aktif ilanınız olduğunu ve bağımsız uzman aradığınızı belirtir."
                  : "Signals that you have open listings and are seeking specialists."}
              </p>
            </div>
            <input
              type="checkbox"
              checked={isActivelyHiring}
              onChange={(e) => setIsActivelyHiring(e.target.checked)}
              className="h-4 w-4 rounded accent-blue-500 cursor-pointer"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border-subtle)]">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
            {isTr ? "Vazgeç" : "Cancel"}
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={loading}>
            {getLoadingButtonLabel(loading, "Rolleri Güncelle", "Update Roles", "Kaydediliyor...", "Saving...", isTr)}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
