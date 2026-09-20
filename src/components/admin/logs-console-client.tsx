"use client";

import { useState } from "react";
import { ScrollText, Search, Shield, Briefcase, Activity, Terminal, Download } from "lucide-react";
import { AdminLogItem } from "@/src/modules/admin/service";

interface LogsConsoleClientProps {
  initialLogs: AdminLogItem[];
  total: number;
}

function getLogLevelBadgeClass(level: string): string {
  if (level === "CRITICAL") {
    return "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse";
  }
  if (level === "WARN") {
    return "bg-amber-500/10 text-amber-400 border-amber-500/30";
  }
  if (level === "ERROR") {
    return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  }
  return "bg-blue-500/10 text-blue-400 border-blue-500/20";
}

export function LogsConsoleClient({ initialLogs, total: _total }: LogsConsoleClientProps) {
  const [logs] = useState<AdminLogItem[]>(initialLogs);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const categories = [
    { id: "all", label: "Tüm Loglar", icon: ScrollText },
    { id: "auth", label: "Kimlik & Güvenlik", icon: Shield },
    { id: "business", label: "İş Mantığı & Hareketler", icon: Briefcase },
    { id: "audit", label: "Yönetici Denetim İzi", icon: Terminal },
    { id: "system", label: "Sistem & Hata", icon: Activity },
  ];

  const filtered = logs.filter((log) => {
    if (activeCategory !== "all" && log.category !== activeCategory) return false;
    if (levelFilter !== "ALL" && log.level !== levelFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        log.safeSummary.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        (log.ipAddress && log.ipAddress.includes(q))
      );
    }
    return true;
  });

  const handleExportJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filtered, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `operis_logs_${activeCategory}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-4">
      {/* Category Tabs Header */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#12141a] border border-slate-800 overflow-x-auto">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#12141a] border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Aksiyon, IP adresi veya log içeriği ara..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Tüm Seviyeler</option>
            <option value="INFO">INFO (Bilgi)</option>
            <option value="WARN">WARN (Uyarı)</option>
            <option value="ERROR">ERROR (Hata)</option>
            <option value="CRITICAL">CRITICAL (Kritik)</option>
          </select>

          <button
            onClick={handleExportJson}
            className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Dışa Aktar (JSON)</span>
          </button>
        </div>
      </div>

      {/* Logs High-Density Stream Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#12141a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Seviye</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Aksiyon</th>
                <th className="py-3 px-4">Detay / Özet</th>
                <th className="py-3 px-4">Kaynak IP / Aktör</th>
                <th className="py-3 px-4 text-right">Zaman</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getLogLevelBadgeClass(log.level)}`}
                    >
                      {log.level}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-400 font-semibold text-[11px]">
                    {log.category.toUpperCase()}
                  </td>

                  <td className="py-3 px-4 text-white font-semibold">{log.action}</td>

                  <td className="py-3 px-4 font-sans text-slate-300 max-w-md">{log.safeSummary}</td>

                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {log.ipAddress || log.actorEmail || log.actorId || "System Core"}
                  </td>

                  <td className="py-3 px-4 text-right text-slate-500 text-[11px]">
                    {new Date(log.createdAt).toLocaleTimeString("tr-TR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
