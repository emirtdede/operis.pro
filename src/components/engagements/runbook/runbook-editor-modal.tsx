"use client";

import { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  AlertTriangle,
  FileCode2,
  Sparkles,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  RunbookDto,
  SaveRunbookInput,
} from "@/src/modules/engagements/runbook-service";
import {
  RunbookEnvVar,
  RunbookBuildStep,
  RunbookThirdPartyService,
  RunbookDisasterStep,
  SecretCategory,
} from "@/src/modules/engagements/runbook-synthesizer";

interface RunbookEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  engagementId: string;
  initialRunbook: RunbookDto;
  locale?: string;
  onSuccess: () => void;
}
function getParseEnvButtonLabel(isParsingEnv: boolean, isTr: boolean): string {
  if (isParsingEnv) {
    return isTr ? "Ayrıştırılıyor..." : "Parsing...";
  }
  return isTr ? "Ayrıştır & Tabloya Aktar" : "Parse to Table";
}

function getSaveDraftButtonLabel(isSaving: boolean, isTr: boolean): string {
  if (isSaving) {
    return isTr ? "Kaydediliyor..." : "Saving...";
  }
  return isTr ? "Taslak Olarak Kaydet" : "Save as Draft";
}

function getPublishSealButtonLabel(isSaving: boolean, isTr: boolean): string {
  if (isSaving) {
    return isTr ? "Mühürleniyor..." : "Publishing...";
  }
  return isTr ? "Yayınla & Mühürle" : "Publish & Seal";
}

export function RunbookEditorModal({
  isOpen,
  onClose,
  engagementId,
  initialRunbook,
  locale = "tr",
  onSuccess,
}: RunbookEditorModalProps) {
  const isTr = locale === "tr";

  const [activeSection, setActiveSection] = useState<"arch" | "env" | "run" | "services" | "dr">("arch");

  // Form states
  const [architectureSummary, setArchitectureSummary] = useState(initialRunbook.architectureSummary || "");
  const [envVars, setEnvVars] = useState<RunbookEnvVar[]>(initialRunbook.environmentVariables || []);
  const [buildSteps, setBuildSteps] = useState<RunbookBuildStep[]>(initialRunbook.buildAndRunSteps || []);
  const [services, setServices] = useState<RunbookThirdPartyService[]>(initialRunbook.thirdPartyServices || []);
  const [drSteps, setDrSteps] = useState<RunbookDisasterStep[]>(initialRunbook.disasterRecoverySteps || []);
  const [backupSchedule] = useState(initialRunbook.backupSchedule || { frequency: "DAILY" });

  const updateEnvVar = (idx: number, patch: Partial<RunbookEnvVar>) => {
    setEnvVars((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, ...patch } : item))
    );
  };

  const updateBuildStep = (idx: number, patch: Partial<RunbookBuildStep>) => {
    setBuildSteps((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, ...patch } : item))
    );
  };

  const updateService = (idx: number, patch: Partial<RunbookThirdPartyService>) => {
    setServices((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, ...patch } : item))
    );
  };

  const updateDrStep = (idx: number, patch: Partial<RunbookDisasterStep>) => {
    setDrSteps((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, ...patch } : item))
    );
  };

  // Raw .env parser modal state
  const [rawEnvText, setRawEnvText] = useState("");
  const [showRawEnvInput, setShowRawEnvInput] = useState(false);
  const [isParsingEnv, setIsParsingEnv] = useState(false);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParseRawEnv = async () => {
    if (!rawEnvText.trim()) return;
    setIsParsingEnv(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/work/${engagementId}/runbook/parse-env`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-locale": locale },
        body: JSON.stringify({ rawText: rawEnvText }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.environmentVariables && json.environmentVariables.length > 0) {
          // Merge avoiding duplicates by key
          const existingKeys = new Set(envVars.map((v) => v.key));
          const newOnes = json.environmentVariables.filter((v: RunbookEnvVar) => !existingKeys.has(v.key));
          setEnvVars([...envVars, ...newOnes]);
          setShowRawEnvInput(false);
          setRawEnvText("");
        }
      } else {
        const err = await res.json();
        setErrorMessage(err.error || "Ayrıştırma başarısız oldu.");
      }
    } catch {
      setErrorMessage("Bağlantı hatası oluştu.");
    } finally {
      setIsParsingEnv(false);
    }
  };

  const handleSave = async (publish: boolean) => {
    setIsSaving(true);
    setErrorMessage(null);

    const payload: SaveRunbookInput = {
      architectureSummary,
      environmentVariables: envVars,
      buildAndRunSteps: buildSteps,
      thirdPartyServices: services,
      disasterRecoverySteps: drSteps,
      backupSchedule,
      publish,
    };

    try {
      const res = await fetch(`/api/work/${engagementId}/runbook`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-locale": locale },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const json = await res.json();
        setErrorMessage(json.error || (isTr ? "Kayıt sırasında bir hata oluştu." : "Failed to save runbook."));
      }
    } catch {
      setErrorMessage(isTr ? "Bağlantı hatası oluştu." : "Network connection failed.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
              <FileCode2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-[var(--color-text-primary)]">
                {isTr ? "Proje Devir Kılavuzunu Düzenle" : "Edit Project Runbook"}
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {isTr
                  ? "Sistem mimarisini, .env sözlüğünü ve acil durum adımlarını güncelleyin."
                  : "Update architecture topology, .env dictionary, and emergency procedures."}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--color-text-tertiary)] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 p-3 px-6 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/20 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveSection("arch")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              activeSection === "arch" ? "bg-white/10 text-white font-semibold" : "text-[var(--color-text-secondary)] hover:text-white"
            }`}
          >
            {isTr ? "1. Mimari & Sistem" : "1. Architecture"}
          </button>
          <button
            onClick={() => setActiveSection("env")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              activeSection === "env" ? "bg-white/10 text-white font-semibold" : "text-[var(--color-text-secondary)] hover:text-white"
            }`}
          >
            {isTr ? "2. Çevre Değişkenleri (.env)" : "2. Environment (.env)"} ({envVars.length})
          </button>
          <button
            onClick={() => setActiveSection("run")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              activeSection === "run" ? "bg-white/10 text-white font-semibold" : "text-[var(--color-text-secondary)] hover:text-white"
            }`}
          >
            {isTr ? "3. Başlatma Komutları" : "3. Build & Run Steps"} ({buildSteps.length})
          </button>
          <button
            onClick={() => setActiveSection("services")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              activeSection === "services" ? "bg-white/10 text-white font-semibold" : "text-[var(--color-text-secondary)] hover:text-white"
            }`}
          >
            {isTr ? "4. Dış Servisler" : "4. 3rd Party"} ({services.length})
          </button>
          <button
            onClick={() => setActiveSection("dr")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              activeSection === "dr" ? "bg-white/10 text-white font-semibold" : "text-[var(--color-text-secondary)] hover:text-white"
            }`}
          >
            {isTr ? "5. Felaket Kurtarma" : "5. Disaster Recovery"} ({drSteps.length})
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="m-6 mb-0 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
          {/* Section 1: Architecture Summary */}
          {activeSection === "arch" && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[var(--color-text-primary)]">
                {isTr ? "Sistem ve Mimari Özeti" : "System & Architecture Summary"}
              </label>
              <textarea
                value={architectureSummary}
                onChange={(e) => setArchitectureSummary(e.target.value)}
                rows={7}
                placeholder={
                  isTr
                    ? "Örn: Next.js 15 App Router frontend, PostgreSQL veritabanı, Docker Compose ile ayağa kaldırılır. Vercel üzerinde barındırılır..."
                    : "e.g. Next.js 15 App Router frontend, PostgreSQL on Supabase, containerized with Docker compose..."
                }
                className="w-full rounded-2xl border border-[var(--color-border-subtle)] bg-black/40 p-4 text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-indigo-500/50 leading-relaxed"
              />
            </div>
          )}

          {/* Section 2: Environment Variables */}
          {activeSection === "env" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-semibold text-[var(--color-text-primary)]">
                    {isTr ? "Çevre Değişkenleri Sözlüğü" : "Environment Variables Dictionary"}
                  </h4>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">
                    {isTr ? "Asla canlı şifre yazmayınız; yalnızca format örneği veriniz." : "Never paste plaintext production secrets."}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRawEnvInput(!showRawEnvInput)}
                    className="text-xs gap-1.5 border-white/10"
                  >
                    <FileText className="h-3.5 w-3.5 text-cyan-400" />
                    <span>{isTr ? ".env Metni Yapıştır & Ayrıştır" : "Paste Raw .env"}</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      setEnvVars([
                        ...envVars,
                        {
                          key: "NEW_ENV_KEY",
                          description: "Değişken açıklaması",
                          isRequired: true,
                          secretCategory: "OTHER",
                        },
                      ])
                    }
                    className="text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{isTr ? "Değişken Ekle" : "Add Variable"}</span>
                  </Button>
                </div>
              </div>

              {/* Raw .env.example input panel */}
              {showRawEnvInput && (
                <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-cyan-400">
                    <span>{isTr ? "Ham .env.example İçeriğini Yapıştırın:" : "Paste Raw .env.example Content:"}</span>
                    <button onClick={() => setShowRawEnvInput(false)} className="text-white/60 hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <textarea
                    value={rawEnvText}
                    onChange={(e) => setRawEnvText(e.target.value)}
                    rows={4}
                    placeholder={"# Veritabanı\nDATABASE_URL=postgresql://user:pass@host:5432/db\nNEXTAUTH_SECRET=xyz"}
                    className="w-full rounded-xl border border-white/10 bg-black/60 p-3 font-mono text-[11px] text-cyan-300 focus:outline-none"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleParseRawEnv}
                      disabled={isParsingEnv || !rawEnvText.trim()}
                      className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{getParseEnvButtonLabel(isParsingEnv, isTr)}</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Variable rows */}
              <div className="space-y-3">
                {envVars.map((env, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/40 p-4 space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">
                          {isTr ? "Değişken Adı (Key)" : "Key"}
                        </label>
                        <input
                          type="text"
                          value={env.key}
                          onChange={(e) => updateEnvVar(idx, { key: e.target.value.toUpperCase() })}
                          className="w-full rounded-xl border border-white/10 bg-black/40 p-2 font-mono text-xs text-cyan-300 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">
                          {isTr ? "Gizlilik Kategorisi" : "Category"}
                        </label>
                        <select
                          value={env.secretCategory}
                          onChange={(e) => updateEnvVar(idx, { secretCategory: e.target.value as SecretCategory })}
                          className="w-full rounded-xl border border-white/10 bg-black/40 p-2 text-xs text-[var(--color-text-primary)] focus:outline-none"
                        >
                          <option value="DATABASE">DATABASE (Veritabanı)</option>
                          <option value="AUTH">AUTH (Oturum / Token)</option>
                          <option value="PAYMENT">PAYMENT (Ödeme / POS)</option>
                          <option value="STORAGE">STORAGE (Depolama / S3)</option>
                          <option value="ANALYTICS">ANALYTICS (İzleme / Log)</option>
                          <option value="COMMUNICATION">COMMUNICATION (E-posta/SMS)</option>
                          <option value="OTHER">OTHER (Diğer)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">
                          {isTr ? "Örnek Format" : "Sample Format"}
                        </label>
                        <input
                          type="text"
                          value={env.sampleValue || ""}
                          placeholder="Örn: postgresql://..."
                          onChange={(e) => updateEnvVar(idx, { sampleValue: e.target.value })}
                          className="w-full rounded-xl border border-white/10 bg-black/40 p-2 font-mono text-xs text-[var(--color-text-secondary)] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">
                          {isTr ? "Açıklama & Nereden Alınır?" : "Description"}
                        </label>
                        <input
                          type="text"
                          value={env.description}
                          onChange={(e) => updateEnvVar(idx, { description: e.target.value })}
                          className="w-full rounded-xl border border-white/10 bg-black/40 p-2 text-xs text-[var(--color-text-primary)] focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setEnvVars(envVars.filter((_, i) => i !== idx))}
                        className="self-end p-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                        title={isTr ? "Sil" : "Delete"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Build and Run Steps */}
          {activeSection === "run" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-[var(--color-text-primary)]">
                  {isTr ? "Canlıda Çalıştırma ve Derleme Komutları" : "Build & Runtime Commands"}
                </h4>
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    setBuildSteps([
                      ...buildSteps,
                      {
                        stepNumber: buildSteps.length + 1,
                        title: "Yeni Adım",
                        command: "pnpm start",
                        description: "Açıklama",
                        environment: "PRODUCTION",
                      },
                    ])
                  }
                  className="text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{isTr ? "Adım Ekle" : "Add Step"}</span>
                </Button>
              </div>

              <div className="space-y-3">
                {buildSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/40 p-4 space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">
                          {isTr ? "Adım Başlığı" : "Step Title"}
                        </label>
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) => updateBuildStep(idx, { title: e.target.value })}
                          className="w-full rounded-xl border border-white/10 bg-black/40 p-2 text-xs text-[var(--color-text-primary)] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">
                          {isTr ? "Ortam" : "Environment"}
                        </label>
                        <select
                          value={step.environment}
                          onChange={(e) => updateBuildStep(idx, { environment: e.target.value as RunbookBuildStep["environment"] })}
                          className="w-full rounded-xl border border-white/10 bg-black/40 p-2 text-xs text-[var(--color-text-primary)] focus:outline-none"
                        >
                          <option value="LOCAL">LOCAL (Yerel)</option>
                          <option value="DOCKER">DOCKER</option>
                          <option value="PRODUCTION">PRODUCTION (Canlı)</option>
                          <option value="CI_CD">CI/CD Pipeline</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">
                        {isTr ? "Çalıştırılacak Komut (Terminal)" : "Command (Terminal)"}
                      </label>
                      <input
                        type="text"
                        value={step.command}
                        onChange={(e) => updateBuildStep(idx, { command: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-black/50 p-2 font-mono text-xs text-emerald-400 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">
                          {isTr ? "Açıklama" : "Description"}
                        </label>
                        <input
                          type="text"
                          value={step.description}
                          onChange={(e) => updateBuildStep(idx, { description: e.target.value })}
                          className="w-full rounded-xl border border-white/10 bg-black/40 p-2 text-xs text-[var(--color-text-primary)] focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setBuildSteps(buildSteps.filter((_, i) => i !== idx))}
                        className="self-end p-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: 3rd Party Services */}
          {activeSection === "services" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-[var(--color-text-primary)]">
                  {isTr ? "Üçüncü Taraf Dış Servisler" : "Third Party Services"}
                </h4>
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    setServices([
                      ...services,
                      {
                        serviceName: "Yeni Servis",
                        category: "Altyapı",
                        purpose: "Kullanım amacı",
                        credentialsTransferred: true,
                      },
                    ])
                  }
                  className="text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{isTr ? "Servis Ekle" : "Add Service"}</span>
                </Button>
              </div>

              <div className="space-y-3">
                {services.map((srv, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/40 p-4 space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">
                          {isTr ? "Servis Adı" : "Service Name"}
                        </label>
                        <input
                          type="text"
                          value={srv.serviceName}
                          onChange={(e) => updateService(idx, { serviceName: e.target.value })}
                          className="w-full rounded-xl border border-white/10 bg-black/40 p-2 text-xs text-[var(--color-text-primary)] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">
                          {isTr ? "Kategori" : "Category"}
                        </label>
                        <input
                          type="text"
                          value={srv.category}
                          onChange={(e) => updateService(idx, { category: e.target.value })}
                          className="w-full rounded-xl border border-white/10 bg-black/40 p-2 text-xs text-[var(--color-text-primary)] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">
                          {isTr ? "Yönetim Paneli Linki" : "Dashboard URL"}
                        </label>
                        <input
                          type="text"
                          value={srv.dashboardUrl || ""}
                          placeholder="https://..."
                          onChange={(e) => updateService(idx, { dashboardUrl: e.target.value })}
                          className="w-full rounded-xl border border-white/10 bg-black/40 p-2 text-xs text-[var(--color-text-secondary)] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">
                          {isTr ? "Kullanım Amacı" : "Purpose"}
                        </label>
                        <input
                          type="text"
                          value={srv.purpose}
                          onChange={(e) => updateService(idx, { purpose: e.target.value })}
                          className="w-full rounded-xl border border-white/10 bg-black/40 p-2 text-xs text-[var(--color-text-primary)] focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setServices(services.filter((_, i) => i !== idx))}
                        className="self-end p-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 5: Disaster Recovery */}
          {activeSection === "dr" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-[var(--color-text-primary)]">
                  {isTr ? "Acil Durum & Felaket Kurtarma Senaryoları" : "Disaster Recovery Scenarios"}
                </h4>
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    setDrSteps([
                      ...drSteps,
                      {
                        priority: "HIGH",
                        scenario: "Sunucu Çökmesi",
                        procedure: "Müdahale adımı...",
                      },
                    ])
                  }
                  className="text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{isTr ? "Senaryo Ekle" : "Add Scenario"}</span>
                </Button>
              </div>

              <div className="space-y-3">
                {drSteps.map((dr, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/40 p-4 space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">
                          {isTr ? "Senaryo Başlığı" : "Scenario"}
                        </label>
                        <input
                          type="text"
                          value={dr.scenario}
                          onChange={(e) => updateDrStep(idx, { scenario: e.target.value })}
                          className="w-full rounded-xl border border-white/10 bg-black/40 p-2 text-xs text-[var(--color-text-primary)] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">
                          {isTr ? "Önem Seviyesi" : "Priority"}
                        </label>
                        <select
                          value={dr.priority}
                          onChange={(e) => updateDrStep(idx, { priority: e.target.value as RunbookDisasterStep["priority"] })}
                          className="w-full rounded-xl border border-white/10 bg-black/40 p-2 text-xs text-[var(--color-text-primary)] focus:outline-none"
                        >
                          <option value="CRITICAL">CRITICAL (Kritik)</option>
                          <option value="HIGH">HIGH (Yüksek)</option>
                          <option value="MEDIUM">MEDIUM (Normal)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">
                        {isTr ? "Kurtarma Prosedürü & Adımları" : "Recovery Procedure"}
                      </label>
                      <textarea
                        value={dr.procedure}
                        rows={2}
                        onChange={(e) => updateDrStep(idx, { procedure: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-black/40 p-2 text-xs text-[var(--color-text-primary)] focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">
                          {isTr ? "Doğrulama Komutu (Opsiyonel)" : "Verification Command"}
                        </label>
                        <input
                          type="text"
                          value={dr.verificationCommand || ""}
                          placeholder="curl -I https://..."
                          onChange={(e) => updateDrStep(idx, { verificationCommand: e.target.value })}
                          className="w-full rounded-xl border border-white/10 bg-black/50 p-2 font-mono text-xs text-emerald-400 focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setDrSteps(drSteps.filter((_, i) => i !== idx))}
                        className="self-end p-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/50">
          <div className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{isTr ? "Yayınlandığında SHA-256 ile mühürlenir." : "Sealed with SHA-256 upon publish."}</span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs border-white/10"
            >
              {isTr ? "İptal" : "Cancel"}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={() => handleSave(false)}
              className="text-xs border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"
            >
              {getSaveDraftButtonLabel(isSaving, isTr)}
            </Button>

            <Button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave(true)}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{getPublishSealButtonLabel(isSaving, isTr)}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
