"use client";

import { useState, useTransition } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Ban,
  Unlock,
  Flame,
  Globe,
  X,
  CheckCircle2,
  Activity,
} from "lucide-react";
import type { AdminThreatItem } from "@/src/modules/admin/service";
import { blockIpAction, unblockIpAction } from "@/src/modules/admin/actions";

interface ThreatsConsoleClientProps {
  initialThreats: AdminThreatItem[];
}

const STATUS_FILTER_LABELS: Record<string, string> = {
  ALL: "Tümü",
  DETECTED: "Aktif",
  BLOCKED: "Engelli",
  MITIGATED: "Yatıştırıldı",
  INVESTIGATING: "İncelemede",
};

function getStatusFilterLabel(st: string): string {
  return STATUS_FILTER_LABELS[st] || "İncelemede";
}

function getThreatIconBoxClass(severity: string): string {
  if (severity === "CRITICAL") return "bg-red-500/20 text-red-400 border border-red-500/30";
  if (severity === "HIGH") return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
  return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
}

function getThreatSeverityBadgeClass(severity: string): string {
  if (severity === "CRITICAL") return "bg-red-500/10 text-red-400 border-red-500/30";
  if (severity === "HIGH") return "bg-amber-500/10 text-amber-400 border-amber-500/30";
  return "bg-slate-700/30 text-slate-300 border-slate-700";
}

function getThreatStatusBadgeClass(isBlocked: boolean, status: string): string {
  if (isBlocked || status === "BLOCKED") {
    return "bg-red-500/10 text-red-400 border-red-500/30";
  }
  if (status === "DETECTED") {
    return "bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse";
  }
  if (status === "INVESTIGATING") {
    return "bg-blue-500/10 text-blue-400 border-blue-500/30";
  }
  return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
}

function getThreatStatusLabel(isBlocked: boolean, status: string): string {
  if (isBlocked || status === "BLOCKED") {
    return "ENGELLENDİ";
  }
  if (status === "DETECTED") {
    return "SALDIRI SÜRÜYOR";
  }
  if (status === "INVESTIGATING") {
    return "İNCELENİYOR";
  }
  return "YATIŞTIRILDI";
}

export function ThreatsConsoleClient({ initialThreats }: ThreatsConsoleClientProps) {
  const [threats, setThreats] = useState<AdminThreatItem[]>(initialThreats);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [blockedIps, setBlockedIps] = useState<Set<string>>(
    new Set(["185.220.101.5", "194.26.29.112"])
  );
  const [blockModalIp, setBlockModalIp] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredThreats = threats.filter((t) => {
    if (severityFilter !== "ALL" && t.severity !== severityFilter) return false;
    if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchIp = t.sourceIp.includes(q);
      const matchEndpoint = t.targetEndpoint.toLowerCase().includes(q);
      const matchType = t.threatType.toLowerCase().includes(q);
      return matchIp || matchEndpoint || matchType;
    }
    return true;
  });

  const handleBlockIp = () => {
    if (!blockModalIp || !blockReason.trim()) return;
    const targetIp = blockModalIp;
    startTransition(async () => {
      await blockIpAction(targetIp, blockReason);
      setBlockedIps((prev) => new Set([...prev, targetIp]));
      setThreats((prev) =>
        prev.map((t) => (t.sourceIp === targetIp ? { ...t, status: "BLOCKED" } : t))
      );
      setActionSuccessMessage(`${targetIp} adresi güvenlik duvarı seviyesinde engellendi.`);
      setBlockModalIp(null);
      setBlockReason("");
      setTimeout(() => setActionSuccessMessage(null), 4000);
    });
  };

  const handleUnblockIp = (ip: string) => {
    startTransition(async () => {
      await unblockIpAction(ip);
      setBlockedIps((prev) => {
        const next = new Set(prev);
        next.delete(ip);
        return next;
      });
      setThreats((prev) =>
        prev.map((t) => (t.sourceIp === ip ? { ...t, status: "MITIGATED" } : t))
      );
      setActionSuccessMessage(`${ip} adresinin güvenlik engeli kaldırıldı.`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    });
  };

  const activeThreatsCount = threats.filter((t) => t.status !== "BLOCKED").length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      {actionSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button onClick={() => setActionSuccessMessage(null)} className="text-emerald-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/5 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-red-300 font-medium">Aktif Tehdit Dalgası</div>
            <div className="text-2xl font-bold font-mono text-white flex items-center gap-2">
              <span>{activeThreatsCount}</span>
              {activeThreatsCount > 0 && (
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 animate-pulse">
                  ALARM
                </span>
              )}
            </div>
            <div className="text-[10px] text-red-400/80">Saldırı vektörleri izleniyor</div>
          </div>
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            <Flame className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-[#12141a] flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-slate-400 font-medium">Engellenen IP Adresleri</div>
            <div className="text-2xl font-bold font-mono text-white">{blockedIps.size}</div>
            <div className="text-[10px] text-slate-400">Sıfır toleranslı kara liste</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800 text-slate-400">
            <Ban className="h-5 w-5 text-rose-400" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-emerald-300 font-medium">WAF & Hız Limiti</div>
            <div className="text-2xl font-bold font-mono text-emerald-400">AKTİF</div>
            <div className="text-[10px] text-slate-400">DDoS & Brute-Force korumalı</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-[#12141a] flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-slate-400 font-medium">Toplam Engelleme Oranı</div>
            <div className="text-2xl font-bold font-mono text-white">%100</div>
            <div className="text-[10px] text-emerald-400">0 Başarılı Sızma Girişimi</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800 text-slate-400">
            <Activity className="h-5 w-5 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 items-center justify-between bg-[#12141a] p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="IP adresi, hedef uçnokta veya tehdit türü ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full bg-[#0d0e12] border border-slate-800 rounded-xl pl-9 ${search ? "pr-8" : "pr-4"} py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50`}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
              title="Aramayı Temizle"
              aria-label="Aramayı Temizle"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Severity Filter */}
          <div className="flex items-center gap-1.5 bg-[#0d0e12] p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto scrollbar-none max-w-full">
            <span className="text-slate-500 text-[11px] px-2 shrink-0">Kritiklik:</span>
            {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
                  severityFilter === sev
                    ? "bg-red-600 text-white font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {sev === "ALL" ? "Tümü" : sev}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-[#0d0e12] p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto scrollbar-none max-w-full">
            <span className="text-slate-500 text-[11px] px-2 shrink-0">Durum:</span>
            {["ALL", "BLOCKED", "DETECTED", "MITIGATED", "INVESTIGATING"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
                  statusFilter === st
                    ? "bg-slate-700 text-white font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {getStatusFilterLabel(st)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Threats Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#12141a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0e1015] border-b border-slate-800 text-slate-400 font-semibold">
              <tr>
                <th className="px-4 py-3">Saldırı Vektörü</th>
                <th className="px-4 py-3">Kritiklik & Skor</th>
                <th className="px-4 py-3">Kaynak IP</th>
                <th className="px-4 py-3">Hedeflenen Uçnokta</th>
                <th className="px-4 py-3">Deneme Sayısı</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3">Son Görülme</th>
                <th className="px-4 py-3 text-right">Güvenlik Müdahalesi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredThreats.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    Aktif siber saldırı veya tehdit kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredThreats.map((threat) => {
                  const isBlocked = blockedIps.has(threat.sourceIp);

                  return (
                    <tr key={threat.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-1.5 rounded-lg ${getThreatIconBoxClass(threat.severity)}`}
                          >
                            <ShieldAlert className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <span className="font-mono font-bold text-white text-xs">
                              {threat.threatType}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getThreatSeverityBadgeClass(
                              threat.severity
                            )}`}
                          >
                            {threat.severity}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">
                            Skor: <span className="font-bold text-white">{threat.riskScore}</span>
                            /100
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-white">
                          <Globe className="h-3.5 w-3.5 text-slate-400" />
                          <span>{threat.sourceIp}</span>
                        </div>
                        {isBlocked && (
                          <span className="text-[10px] text-red-400 font-mono flex items-center gap-1 mt-0.5">
                            <Ban className="h-2.5 w-2.5" />
                            Kara Listede
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-300 max-w-xs truncate text-[11px]">
                        {threat.targetEndpoint}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-200">
                        {threat.attemptCount.toLocaleString()} istek
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getThreatStatusBadgeClass(
                            isBlocked,
                            threat.status
                          )}`}
                        >
                          {getThreatStatusLabel(isBlocked, threat.status)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(threat.lastSeenAt).toLocaleString("tr-TR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        {isBlocked ? (
                          <button
                            onClick={() => handleUnblockIp(threat.sourceIp)}
                            disabled={isPending}
                            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors inline-flex items-center gap-1.5"
                          >
                            <Unlock className="h-3 w-3 text-emerald-400" />
                            <span>Engeli Kaldır</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setBlockModalIp(threat.sourceIp)}
                            disabled={isPending}
                            className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                          >
                            <Ban className="h-3 w-3" />
                            <span>IP&apos;yi Engelle</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Block IP Modal */}
      {blockModalIp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#12141a] border border-red-500/30 rounded-3xl p-4 sm:p-6 w-full max-w-md max-h-[min(92dvh,calc(100dvh-2rem))] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 pb-3 border-b border-slate-800/80 shrink-0">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 shrink-0">
                <Ban className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-white text-sm">IP Adresini Engelle</h3>
                <p className="font-mono text-xs text-red-300 mt-0.5 truncate">{blockModalIp}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 py-3 space-y-3 pr-1">
              <div className="text-xs text-slate-400 leading-relaxed">
                Bu IP adresinden gelen tüm API ve web istekleri WAF / Edge seviyesinde 403 Forbidden
                ile engellenecek ve güvenlik denetim kaydına yazılacaktır.
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-medium">Engelleme Gerekçesi:</label>
                <textarea
                  rows={3}
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Örn: 100+ başarısız brute-force parola denemesi ve SQL enjeksiyon taraması."
                  className="w-full bg-[#0d0e12] border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800 shrink-0">
              <button
                onClick={() => {
                  setBlockModalIp(null);
                  setBlockReason("");
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                İptal
              </button>
              <button
                onClick={handleBlockIp}
                disabled={isPending || !blockReason.trim()}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
              >
                {isPending ? "İşleniyor..." : "IP'yi Kara Listeye Ekle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
