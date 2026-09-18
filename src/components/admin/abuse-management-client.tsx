"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  Search,
  Filter,
  ShieldBan,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  ShieldCheck,
  X,
  Eye,
} from "lucide-react";
import type { AdminAbuseItem } from "@/src/modules/admin/service";
import { resolveReportAction, moderateUserAction } from "@/src/modules/admin/actions";

interface AbuseManagementClientProps {
  initialAbuseItems: AdminAbuseItem[];
}

export function AbuseManagementClient({ initialAbuseItems }: AbuseManagementClientProps) {
  const [items, setItems] = useState<AdminAbuseItem[]>(initialAbuseItems);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedItem, setSelectedItem] = useState<AdminAbuseItem | null>(null);
  const [suspendModalItem, setSuspendModalItem] = useState<AdminAbuseItem | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filtered in-memory or dynamically
  const filteredItems = items.filter((item) => {
    if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchOffender = item.offenderDisplayName?.toLowerCase().includes(q) || false;
      const matchReporter = item.reporterDisplayName?.toLowerCase().includes(q) || false;
      const matchReason = item.reasonCode.toLowerCase().includes(q);
      const matchDetails = item.details.toLowerCase().includes(q);
      return matchOffender || matchReporter || matchReason || matchDetails;
    }
    return true;
  });

  const handleResolve = (reportId: string, resolution: "RESOLVED" | "DISMISSED") => {
    startTransition(async () => {
      await resolveReportAction(reportId, resolution);
      setItems((prev) =>
        prev.map((it) => (it.id === reportId ? { ...it, status: resolution } : it))
      );
      if (selectedItem?.id === reportId) {
        setSelectedItem((prev) => (prev ? { ...prev, status: resolution } : null));
      }
      setActionSuccessMessage(
        resolution === "RESOLVED"
          ? "Şikayet çözümlendi ve kapatıldı."
          : "Şikayet geçersiz sayılarak arşivlendi."
      );
      setTimeout(() => setActionSuccessMessage(null), 4000);
    });
  };

  const handleConfirmSuspend = () => {
    if (!suspendModalItem || !suspendModalItem.offenderUserId || !suspendReason.trim()) return;
    const offenderId = suspendModalItem.offenderUserId;
    startTransition(async () => {
      await moderateUserAction(offenderId, "SUSPEND", suspendReason);
      // Auto-resolve report as well
      await resolveReportAction(suspendModalItem.id, "RESOLVED");
      setItems((prev) =>
        prev.map((it) => (it.id === suspendModalItem.id ? { ...it, status: "RESOLVED" } : it))
      );
      setActionSuccessMessage(
        `Kullanıcı (${suspendModalItem.offenderDisplayName}) askıya alındı ve şikayet kapatıldı.`
      );
      setSuspendModalItem(null);
      setSuspendReason("");
      setTimeout(() => setActionSuccessMessage(null), 4000);
    });
  };

  const openCount = items.filter((i) => i.status === "OPEN").length;

  return (
    <div className="space-y-6">
      {/* Top Banner Alert */}
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-amber-300 font-medium">Açık İhlal Bildirimleri</div>
            <div className="text-2xl font-bold font-mono text-white">{openCount}</div>
            <div className="text-[10px] text-amber-400/80">İnceleme ve müdahale bekliyor</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-rose-300 font-medium">Küfür & Hakaret Filtresi</div>
            <div className="text-2xl font-bold font-mono text-emerald-400">AKTİF</div>
            <div className="text-[10px] text-slate-400">Teklif formlarında anında engelleme</div>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-[#12141a] flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-slate-400 font-medium">Toplam İhlal Kaydı</div>
            <div className="text-2xl font-bold font-mono text-white">{items.length}</div>
            <div className="text-[10px] text-slate-400">Kalıcı denetim kayıtları</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800 text-slate-400">
            <Clock className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#12141a] p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Kullanıcı, ihlal türü veya detay ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0d0e12] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto scrollbar-none max-w-full">
          <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-400 shrink-0">Durum:</span>
          <div className="flex bg-[#0d0e12] p-1 rounded-xl border border-slate-800 text-xs shrink-0">
            {["ALL", "OPEN", "RESOLVED", "DISMISSED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
                  statusFilter === st
                    ? "bg-amber-500 text-slate-950 font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {st === "ALL"
                  ? "Tümü"
                  : st === "OPEN"
                    ? "Açık"
                    : st === "RESOLVED"
                      ? "Çözüldü"
                      : "Geçersiz"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#12141a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0e1015] border-b border-slate-800 text-slate-400 font-semibold">
              <tr>
                <th className="px-4 py-3">İhlal Türü</th>
                <th className="px-4 py-3">Şikayet Edilen</th>
                <th className="px-4 py-3">Bildiren</th>
                <th className="px-4 py-3">Filtrelenen Kelimeler</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3">Zaman</th>
                <th className="px-4 py-3 text-right">Müdahale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    Kayıtlı ihlal bildirimi bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded-lg ${
                            item.reasonCode.includes("PROFANITY")
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : item.reasonCode.includes("SPAM")
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="font-semibold text-white font-mono text-[11px]">
                            {item.reasonCode}
                          </div>
                          <div className="text-[10px] text-slate-400 max-w-xs truncate">
                            {item.details}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-medium text-white flex items-center gap-1.5">
                        <User className="h-3 w-3 text-rose-400" />
                        <span>{item.offenderDisplayName || "Bilinmeyen Kullanıcı"}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {item.offenderUserId}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="text-slate-300">
                        {item.reporterDisplayName || "Sistem Filtresi"}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        {item.reporterUserId || "AUTOMATED_SCANNER"}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      {item.flaggedTerms && item.flaggedTerms.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.flaggedTerms.map((t, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/30 text-rose-300 font-mono text-[10px]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[10px]">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          item.status === "OPEN"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse"
                            : item.status === "RESOLVED"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-slate-700/30 text-slate-400 border-slate-700"
                        }`}
                      >
                        {item.status === "OPEN"
                          ? "Açık / İncelemede"
                          : item.status === "RESOLVED"
                            ? "Çözüldü"
                            : "Geçersiz"}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleString("tr-TR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          <span>İncele</span>
                        </button>

                        {item.status === "OPEN" && (
                          <>
                            <button
                              onClick={() => setSuspendModalItem(item)}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors flex items-center gap-1"
                              title="Kullanıcıyı Askıya Al"
                            >
                              <ShieldBan className="h-3 w-3" />
                              <span>Askıya Al</span>
                            </button>
                            <button
                              onClick={() => handleResolve(item.id, "RESOLVED")}
                              disabled={isPending}
                              className="p-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                              title="Çözüldü Olarak İşaretle"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleResolve(item.id, "DISMISSED")}
                              disabled={isPending}
                              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                              title="Reddet / Geçersiz Say"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal Drawer */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#12141a] border border-slate-800 rounded-3xl p-4 sm:p-6 w-full max-w-xl max-h-[min(92dvh,calc(100dvh-2rem))] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
                <h3 className="font-bold text-white text-base truncate">İhlal Bildirimi Detayı</h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 py-3 space-y-4 text-xs pr-1">
              <div className="p-3.5 rounded-xl bg-[#0d0e12] border border-slate-800/80 space-y-1.5">
                <div className="text-slate-400 font-medium">Gerekçe & Kategori:</div>
                <div className="font-mono text-amber-300 font-bold text-sm">
                  {selectedItem.reasonCode}
                </div>
                <div className="text-slate-300 mt-1 leading-relaxed">{selectedItem.details}</div>
              </div>

              {selectedItem.flaggedTerms && selectedItem.flaggedTerms.length > 0 && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1.5">
                  <div className="text-rose-300 font-medium">Tespit Edilen Sakıncalı İfadeler:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedItem.flaggedTerms.map((term, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono"
                      >
                        &quot;{term}&quot;
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#0d0e12] border border-slate-800 space-y-1">
                  <span className="text-slate-500">Şikayet Edilen:</span>
                  <div className="font-semibold text-white">{selectedItem.offenderDisplayName}</div>
                  <div className="font-mono text-[10px] text-slate-400 break-all">
                    {selectedItem.offenderUserId}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#0d0e12] border border-slate-800 space-y-1">
                  <span className="text-slate-500">Bildiren:</span>
                  <div className="font-semibold text-white">
                    {selectedItem.reporterDisplayName || "Otomatik Filtre"}
                  </div>
                  <div className="font-mono text-[10px] text-slate-400 break-all">
                    {selectedItem.reporterUserId || "SYSTEM_SCAN"}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-1 text-slate-400 p-2 border-t border-slate-800 text-[11px]">
                <span>
                  Hedef Kaynak: {selectedItem.targetType} ({selectedItem.targetId})
                </span>
                <span>{new Date(selectedItem.createdAt).toLocaleString("tr-TR")}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-800 shrink-0">
              <button
                onClick={() => {
                  setSuspendModalItem(selectedItem);
                  setSelectedItem(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 w-full sm:w-auto"
              >
                <ShieldBan className="h-4 w-4" />
                <span>Kullanıcıyı Askıya Al</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleResolve(selectedItem.id, "DISMISSED")}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex-1 sm:flex-none"
                >
                  Geçersiz Say
                </button>
                <button
                  onClick={() => handleResolve(selectedItem.id, "RESOLVED")}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex-1 sm:flex-none"
                >
                  Şikayeti Çöz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      {suspendModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#12141a] border border-rose-500/30 rounded-3xl p-4 sm:p-6 w-full max-w-md max-h-[min(92dvh,calc(100dvh-2rem))] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 pb-3 border-b border-slate-800/80 shrink-0">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 shrink-0">
                <ShieldBan className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-white text-sm truncate">Kullanıcıyı Askıya Al</h3>
                <p className="text-[11px] text-slate-400 truncate">
                  {suspendModalItem.offenderDisplayName} hesabının erişimi dondurulacak.
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 py-3 space-y-3 pr-1">
              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-medium">
                  Askıya Alma Gerekçesi (Kullanıcıya ve Denetim Kaydına Yazılır):
                </label>
                <textarea
                  rows={3}
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Örn: Topluluk kurallarına aykırı küfür ve hakaret içeren teklif sunulması sebebiyle hesabınız askıya alınmıştır."
                  className="w-full bg-[#0d0e12] border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800 shrink-0">
              <button
                onClick={() => {
                  setSuspendModalItem(null);
                  setSuspendReason("");
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                İptal
              </button>
              <button
                onClick={handleConfirmSuspend}
                disabled={isPending || !suspendReason.trim()}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
              >
                {isPending ? "İşleniyor..." : "Hesabı Askıya Al"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
