"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  FileCode2,
  Terminal,
  Server,
  AlertTriangle,
  KeyRound,
  Download,
  Edit3,
  Copy,
  Check,
  ExternalLink,
  Info,
  Layers,
  Clock,
  Database,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { RunbookDetailsResult } from "@/src/modules/engagements/runbook-service";
import { RunbookEditorModal } from "./runbook-editor-modal";

interface RunbookVaultCardProps {
  engagementId: string;
  currentUserId: string;
  locale?: string;
}

export function RunbookVaultCard({
  engagementId,
  currentUserId: _currentUserId,
  locale = "tr",
}: RunbookVaultCardProps) {
  const isTr = locale === "tr";

  const [data, setData] = useState<RunbookDetailsResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"arch" | "env" | "run" | "services" | "dr">("arch");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [editorModalOpen, setEditorModalOpen] = useState(false);

  const fetchRunbook = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/work/${engagementId}/runbook`, {
        headers: { "x-locale": locale },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  }, [engagementId, locale]);

  useEffect(() => {
    fetchRunbook();
  }, [fetchRunbook]);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(id);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // fallback
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-6 sm:p-7 shadow-sm animate-pulse space-y-4">
        <div className="h-6 w-48 bg-white/10 rounded-lg" />
        <div className="h-20 bg-white/5 rounded-2xl" />
      </div>
    );
  }

  if (!data?.runbook) return null;

  const { runbook, completenessScore, completenessGrade, canEdit, isPublished } = data;

  return (
    <>
      <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-6 sm:p-7 shadow-sm space-y-6">
        {/* Header with Title, Grade & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/10 text-indigo-400 border border-indigo-500/20">
                <Server className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-[var(--color-text-primary)]">
                {isTr
                  ? "🛡️ Akıllı Proje Devir Kılavuzu & Canlıda Çalıştırma Kütüphanesi"
                  : "🛡️ Project Runbook & Architecture Vault"}
              </h3>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {isTr
                ? "Canlı sistem çalıştırma komutları, .env.example sözlüğü, dış servisler ve acil durum felaket kurtarma rehberi."
                : "Live execution commands, .env.example dictionary, 3rd party services, and disaster recovery procedures."}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {isPublished ? (
              <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 gap-1.5 px-3 py-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{isTr ? "Mühürlendi & Yayınlandı" : "Published & Sealed"}</span>
              </Badge>
            ) : (
              <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 gap-1.5 px-3 py-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{isTr ? "Taslak / Hazırlanıyor" : "Draft in Progress"}</span>
              </Badge>
            )}

            <Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/30 font-mono px-2.5 py-1">
              {isTr ? `Doluluk: %${completenessScore}` : `Completeness: %${completenessScore}`} ({completenessGrade})
            </Badge>

            <a
              href={`/api/work/${engagementId}/runbook/export?format=markdown&lang=${locale}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] hover:bg-white/10 transition-colors text-[var(--color-text-primary)]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isTr ? "İndir (.md)" : "Export (.md)"}</span>
            </a>

            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditorModalOpen(true)}
                className="gap-1.5 border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-semibold"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>{isTr ? "Kılavuzu Düzenle" : "Edit Runbook"}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Educational Explainer Banner for Non-Technical Clients */}
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
            <Info className="h-4 w-4 shrink-0" />
            <span>
              {isTr
                ? "İşveren Bilgilendirmesi: Bu Kılavuz Neden Şirketinizin Dijital Kasko Sigortasıdır?"
                : "Client Explainer: Why This Runbook Is Your Digital Insurance Policy"}
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            {isTr
              ? "Yazılımcınız projeyi tamamladıktan aylar sonra sunucunuz kapandığında, SSL süresi dolduğunda, veritabanı yedeği almanız gerektiğinde veya yeni bir yazılımcıyla çalışmak istediğinizde bu kılavuz devreye girer. Kodların nasıl ayağa kaldırılacağı, hangi dış servislere bağlı olduğu ve acil durumda ne yapılacağı burada şeffafça tescillenir."
              : "Months after project completion, if your server reboots, SSL certificate expires, or you hire a new developer, this runbook ensures business continuity. All startup commands, third-party credentials, and recovery procedures are documented step-by-step."}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-[var(--color-text-secondary)]">
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span>{isTr ? "Sıfır Açık Şifre Riski" : "Zero Secret Leakage"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span>{isTr ? "1-Tıkla Kopyala-Çalıştır" : "1-Click Copy-Run"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span>{isTr ? "Felaket Kurtarma Adımları" : "Disaster Recovery"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span>{isTr ? "HMK m. 193 SHA-256 Delili" : "HMK Art. 193 Seal"}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[var(--color-border-subtle)] text-xs scrollbar-none">
          <button
            onClick={() => setActiveTab("arch")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-colors shrink-0 ${
              activeTab === "arch"
                ? "bg-white/10 text-white font-semibold border border-white/10"
                : "text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>{isTr ? "Mimari & Sistem Özeti" : "Architecture & Overview"}</span>
          </button>

          <button
            onClick={() => setActiveTab("env")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-colors shrink-0 ${
              activeTab === "env"
                ? "bg-white/10 text-white font-semibold border border-white/10"
                : "text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5"
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>
              {isTr ? "Çevre Değişkenleri (.env)" : "Environment Variables"} ({runbook.environmentVariables.length})
            </span>
          </button>

          <button
            onClick={() => setActiveTab("run")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-colors shrink-0 ${
              activeTab === "run"
                ? "bg-white/10 text-white font-semibold border border-white/10"
                : "text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5"
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>
              {isTr ? "Başlatma & Derleme (Runbook)" : "Build & Run Steps"} ({runbook.buildAndRunSteps.length})
            </span>
          </button>

          <button
            onClick={() => setActiveTab("services")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-colors shrink-0 ${
              activeTab === "services"
                ? "bg-white/10 text-white font-semibold border border-white/10"
                : "text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5"
            }`}
          >
            <Server className="h-3.5 w-3.5" />
            <span>
              {isTr ? "3. Taraf Servisler" : "3rd Party Services"} ({runbook.thirdPartyServices.length})
            </span>
          </button>

          <button
            onClick={() => setActiveTab("dr")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-colors shrink-0 ${
              activeTab === "dr"
                ? "bg-white/10 text-white font-semibold border border-white/10"
                : "text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>
              {isTr ? "Yedekleme & Acil Kurtarma" : "Disaster Recovery"} ({runbook.disasterRecoverySteps.length})
            </span>
          </button>
        </div>

        {/* Tab 1: Architecture Summary */}
        {activeTab === "arch" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/50 p-5 space-y-3">
              <h4 className="font-semibold text-xs text-[var(--color-text-primary)] flex items-center gap-2">
                <FileCode2 className="h-4 w-4 text-indigo-400" />
                <span>{isTr ? "Proje Altyapı ve Sistem Topolojisi" : "Project Topology & System Blueprint"}</span>
              </h4>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
                {runbook.architectureSummary || (isTr ? "Mimari özet girilmedi." : "No architecture summary provided.")}
              </p>
            </div>

            {runbook.sha256Seal && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" />
                    <span>{isTr ? "HMK m. 193 Kriptografik Dijital Mühür" : "HMK Art. 193 Digital Proof Seal"}</span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">
                    {isTr
                      ? "Kılavuz içeriği değiştirilemez biçimde SHA-256 ile zaman damgalanmıştır."
                      : "Runbook content is immutably timestamped with SHA-256 fingerprint."}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(runbook.sha256Seal ?? "", "seal")}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 font-mono text-[11px] text-emerald-300 transition-colors"
                >
                  <span>{runbook.sha256Seal.slice(0, 16)}...{runbook.sha256Seal.slice(-8)}</span>
                  {copiedKey === "seal" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Environment Variables Dictionary */}
        {activeTab === "env" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)] px-1">
              <span>
                {isTr
                  ? "Sistemin çalışması için gerekli çevre değişkenleri sözlüğü:"
                  : "Environment variables required for system operations:"}
              </span>
              <span className="text-[11px] font-mono text-amber-400/90">
                {isTr ? "⚠️ Canlı şifreler gizlenmiştir / örnek formattır" : "⚠️ Plaintext secrets excluded"}
              </span>
            </div>

            {runbook.environmentVariables.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border-subtle)] p-6 text-center text-xs text-[var(--color-text-secondary)]">
                {isTr ? "Tanımlı çevre değişkeni bulunmuyor. 'Kılavuzu Düzenle' butonundan ekleyebilirsiniz." : "No environment variables registered."}
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--color-border-subtle)] overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/70 text-[var(--color-text-secondary)]">
                      <th className="p-3 font-semibold">{isTr ? "Anahtar (.env)" : "Key (.env)"}</th>
                      <th className="p-3 font-semibold">{isTr ? "Açıklama" : "Description"}</th>
                      <th className="p-3 font-semibold">{isTr ? "Kategori" : "Category"}</th>
                      <th className="p-3 font-semibold">{isTr ? "Zorunlu" : "Required"}</th>
                      <th className="p-3 font-semibold">{isTr ? "Örnek Format" : "Sample Format"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-subtle)]">
                    {runbook.environmentVariables.map((env, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3 font-mono font-medium text-cyan-300">
                          <button
                            onClick={() => handleCopy(env.key, `env-${idx}`)}
                            className="flex items-center gap-1.5 hover:underline"
                            title={isTr ? "Kopyala" : "Copy"}
                          >
                            <span>{env.key}</span>
                            {copiedKey === `env-${idx}` ? (
                              <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                            ) : (
                              <Copy className="h-3 w-3 opacity-40 hover:opacity-100 shrink-0" />
                            )}
                          </button>
                        </td>
                        <td className="p-3 text-[var(--color-text-secondary)] max-w-xs">{env.description}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-white/10 font-mono">
                            {env.secretCategory}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {env.isRequired ? (
                            <span className="text-emerald-400 font-medium">{isTr ? "Evet" : "Yes"}</span>
                          ) : (
                            <span className="text-[var(--color-text-tertiary)]">{isTr ? "Opsiyonel" : "Optional"}</span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-[var(--color-text-tertiary)] truncate max-w-[200px]">
                          {env.sampleValue || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Build & Runbook Steps */}
        {activeTab === "run" && (
          <div className="space-y-3">
            {runbook.buildAndRunSteps.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border-subtle)] p-6 text-center text-xs text-[var(--color-text-secondary)]">
                {isTr ? "Tanımlı derleme/çalıştırma komutu yok." : "No build steps defined."}
              </div>
            ) : (
              <div className="space-y-3">
                {runbook.buildAndRunSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/40 p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-primary)]">
                        <span className="flex items-center justify-center h-5 w-5 rounded-full bg-indigo-500/20 text-indigo-400 text-[11px] font-bold">
                          {step.stepNumber || idx + 1}
                        </span>
                        <span>{step.title}</span>
                      </div>
                      <Badge className="bg-white/5 border border-white/10 text-[10px] font-mono px-2 py-0.5">
                        {step.environment}
                      </Badge>
                    </div>

                    <p className="text-xs text-[var(--color-text-secondary)]">{step.description}</p>

                    <div className="relative group rounded-xl bg-black/50 border border-white/10 p-3 font-mono text-xs text-emerald-400 flex items-center justify-between gap-2 overflow-x-auto">
                      <code>{step.command}</code>
                      <button
                        onClick={() => handleCopy(step.command, `cmd-${idx}`)}
                        className="shrink-0 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                        title={isTr ? "Komutu Kopyala" : "Copy Command"}
                      >
                        {copiedKey === `cmd-${idx}` ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: 3rd Party Services */}
        {activeTab === "services" && (
          <div className="space-y-3">
            {runbook.thirdPartyServices.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border-subtle)] p-6 text-center text-xs text-[var(--color-text-secondary)]">
                {isTr ? "Bağlı dış servis bulunmuyor." : "No external services registered."}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {runbook.thirdPartyServices.map((service, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/40 p-4 space-y-2 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-[var(--color-text-primary)]">
                          {service.serviceName}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono border-white/10">
                          {service.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                        {service.purpose}
                      </p>
                      {service.notes && (
                        <p className="text-[11px] text-[var(--color-text-tertiary)] italic">
                          {service.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--color-border-subtle)] text-[11px]">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                        <Check className="h-3.5 w-3.5" />
                        <span>{isTr ? "Yetkiler Devredildi" : "Transferred"}</span>
                      </span>

                      {service.dashboardUrl && (
                        <a
                          href={service.dashboardUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-400 hover:underline"
                        >
                          <span>{isTr ? "Konsol Linki" : "Dashboard"}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Disaster Recovery & Backup */}
        {activeTab === "dr" && (
          <div className="space-y-4">
            {/* Backup Schedule Box */}
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-indigo-400">
                <Database className="h-4 w-4" />
                <span>{isTr ? "Otomatik Yedekleme Çizelgesi & Geri Yükleme" : "Backup Schedule & Restore"}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-[var(--color-text-secondary)]">
                <div>
                  <span className="font-semibold text-[var(--color-text-primary)]">{isTr ? "Sıklık:" : "Frequency:"}</span>{" "}
                  {runbook.backupSchedule.frequency || (isTr ? "Günlük" : "Daily")}
                </div>
                <div>
                  <span className="font-semibold text-[var(--color-text-primary)]">{isTr ? "Depolama:" : "Location:"}</span>{" "}
                  {runbook.backupSchedule.storageLocation || "—"}
                </div>
              </div>
              {runbook.backupSchedule.restoreProcedure && (
                <div className="pt-1 text-[11px] text-[var(--color-text-secondary)] border-t border-indigo-500/15">
                  <span className="font-semibold text-indigo-300">{isTr ? "Geri Yükleme Adımı:" : "Restore:"}</span>{" "}
                  {runbook.backupSchedule.restoreProcedure}
                </div>
              )}
            </div>

            {/* Disaster Recovery Scenarios */}
            <div className="space-y-3">
              <h4 className="font-semibold text-xs text-[var(--color-text-primary)] flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span>{isTr ? "Kritik Acil Durum & Çöküş Senaryoları" : "Emergency Crash Scenarios"}</span>
              </h4>

              {runbook.disasterRecoverySteps.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--color-border-subtle)] p-6 text-center text-xs text-[var(--color-text-secondary)]">
                  {isTr ? "Tanımlı acil durum kurtarma adımı yok." : "No disaster recovery steps defined."}
                </div>
              ) : (
                <div className="space-y-3">
                  {runbook.disasterRecoverySteps.map((dr, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/40 p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-[var(--color-text-primary)]">
                          {dr.scenario}
                        </span>
                        <Badge
                          className={`text-[10px] px-2 py-0.5 ${
                            dr.priority === "CRITICAL"
                              ? "bg-red-500/20 text-red-400 border-red-500/30"
                              : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          }`}
                        >
                          {dr.priority}
                        </Badge>
                      </div>

                      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                        {dr.procedure}
                      </p>

                      {dr.verificationCommand && (
                        <div className="rounded-xl bg-black/40 border border-white/10 p-2.5 font-mono text-[11px] text-emerald-400 flex items-center justify-between gap-2">
                          <code>{dr.verificationCommand}</code>
                          <button
                            onClick={() => handleCopy(dr.verificationCommand ?? "", `dr-${idx}`)}
                            className="p-1 text-white/70 hover:text-white"
                          >
                            {copiedKey === `dr-${idx}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Emergency Contact */}
            {runbook.emergencyContact && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs space-y-1.5">
                <div className="font-semibold text-[var(--color-text-primary)]">
                  {isTr ? "📞 Acil Durumda Aranacak / Ulaşılacak Kişi" : "Emergency Contact"}
                </div>
                <p className="text-[var(--color-text-secondary)]">
                  {runbook.emergencyContact.name} • {runbook.emergencyContact.email || runbook.emergencyContact.phone}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interactive Editor Modal */}
      {editorModalOpen && (
        <RunbookEditorModal
          isOpen={editorModalOpen}
          onClose={() => setEditorModalOpen(false)}
          engagementId={engagementId}
          initialRunbook={runbook}
          locale={locale}
          onSuccess={() => {
            fetchRunbook();
            setEditorModalOpen(false);
          }}
        />
      )}
    </>
  );
}
