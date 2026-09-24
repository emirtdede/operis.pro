"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { AdminOfferItem } from "@/src/modules/admin/service";

interface OffersTableClientProps {
  initialOffers: AdminOfferItem[];
  total: number;
  currentPage?: number;
  totalPages?: number;
}

function getOfferStatusBadgeClass(status: string): string {
  if (status === "ACCEPTED") {
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  }
  if (status === "PENDING") {
    return "bg-purple-500/10 text-purple-400 border-purple-500/20";
  }
  return "bg-red-500/10 text-red-400 border-red-500/20";
}

function getOfferStatusLabel(status: string): string {
  if (status === "ACCEPTED") {
    return "KABUL EDİLDİ";
  }
  if (status === "PENDING") {
    return "BEKLİYOR";
  }
  return "REDDEDİLDİ";
}

export function OffersTableClient({
  initialOffers,
  total,
  currentPage = 1,
  totalPages = 1,
}: OffersTableClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [offers, setOffers] = useState<AdminOfferItem[]>(initialOffers);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "ALL");
  const [selectedOffer, setSelectedOffer] = useState<AdminOfferItem | null>(null);

  useEffect(() => {
    setOffers(initialOffers);
  }, [initialOffers]);

  const updateUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (!v || v === "ALL") {
        params.delete(k);
      } else {
        params.set(k, v);
      }
    });
    router.push(`?${params.toString()}`);
  };

  const filtered = offers.filter((o) => {
    if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        o.listingTitle.toLowerCase().includes(q) ||
        o.senderDisplayName.toLowerCase().includes(q) ||
        o.senderHandle.toLowerCase().includes(q) ||
        o.recipientDisplayName.toLowerCase().includes(q) ||
        o.recipientHandle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#12141a] border border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateUrl({ search: search.trim(), page: "1" });
          }}
          className="relative flex-1 max-w-md"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İlan, teklif veren (@yazilimci) veya ilan sahibi ara (Enter)..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </form>

        <div className="flex items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => {
              const val = e.target.value;
              setStatusFilter(val);
              updateUrl({ status: val, page: "1" });
            }}
            className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Tüm Teklifler</option>
            <option value="ACCEPTED">Kabul Edilenler (Eşleşen)</option>
            <option value="PENDING">Bekleyen Teklifler</option>
            <option value="REJECTED">Reddedilenler</option>
          </select>

          <span className="text-[11px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-xl">
            {filtered.length} Kayıt
          </span>
        </div>
      </div>

      {/* Offers Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#12141a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">İlan Başlığı</th>
                <th className="py-3 px-4">Teklif Veren (Uzman)</th>
                <th className="py-3 px-4">İlan Sahibi (İşveren)</th>
                <th className="py-3 px-4">Bütçe & Süre</th>
                <th className="py-3 px-4">Durum & Cevap</th>
                <th className="py-3 px-4">Tarih</th>
                <th className="py-3 px-4 text-right">İncele</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                  onClick={() => setSelectedOffer(item)}
                >
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white truncate max-w-xs">
                      {item.listingTitle}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-200">{item.senderDisplayName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">@{item.senderHandle}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-200">{item.recipientDisplayName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      @{item.recipientHandle}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-mono text-emerald-400 font-semibold">
                      {item.budgetFormatted}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Tahmin: {item.estimatedDuration}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getOfferStatusBadgeClass(item.status)}`}
                      >
                        {getOfferStatusLabel(item.status)}
                      </span>
                      {item.rejectionReasonCode && (
                        <span className="text-[9px] font-mono text-slate-500">
                          ({item.rejectionReasonCode})
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                    {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                  </td>

                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setSelectedOffer(item)}
                      className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-[11px] text-slate-300 hover:text-white"
                    >
                      Kayıt Detayı
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-[#12141a] border border-slate-800 rounded-2xl text-xs text-slate-400">
        <div>
          Toplam <span className="text-white font-semibold">{total.toLocaleString()}</span> teklif •
          Sayfa <span className="text-white font-semibold">{currentPage}</span> /{" "}
          <span className="text-white font-semibold">{totalPages}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => updateUrl({ page: String(currentPage - 1) })}
            disabled={currentPage <= 1}
            className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Önceki</span>
          </button>
          <span className="px-2 font-mono text-slate-300">{currentPage}</span>
          <button
            type="button"
            onClick={() => updateUrl({ page: String(currentPage + 1) })}
            disabled={currentPage >= totalPages}
            className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Sonraki</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Offer Detail Inspection Modal */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-xl max-h-[min(92dvh,calc(100dvh-2rem))] flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#12141a] p-4 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-400 shrink-0" />
                <h3 className="text-sm font-bold text-white truncate">Teklif & Eşleşme Denetim İzi</h3>
              </div>
              <button
                onClick={() => setSelectedOffer(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 py-3 space-y-3 text-xs pr-1">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-slate-500 font-medium">İlgili Proje İlanı</div>
                <div className="text-sm font-semibold text-white">{selectedOffer.listingTitle}</div>
                <div className="text-[10px] font-mono text-blue-400">
                  Slug: {selectedOffer.listingSlug}
                </div>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-slate-500 font-medium">Teklif Sunan Uzman</div>
                  <div className="font-semibold text-white">{selectedOffer.senderDisplayName}</div>
                  <div className="font-mono text-slate-400 text-[11px]">
                    @{selectedOffer.senderHandle}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-slate-500 font-medium">İlan Sahibi (İşveren)</div>
                  <div className="font-semibold text-white">
                    {selectedOffer.recipientDisplayName}
                  </div>
                  <div className="font-mono text-slate-400 text-[11px]">
                    @{selectedOffer.recipientHandle}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-slate-500 font-medium">Teklif Bütçesi</div>
                  <div className="font-mono text-emerald-400 font-bold text-base">
                    {selectedOffer.budgetFormatted}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Süre: {selectedOffer.estimatedDuration}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-slate-500 font-medium">Sonuç & Cevap Durumu</div>
                  <div className="font-semibold text-white">{selectedOffer.status}</div>
                  {selectedOffer.resolvedAt ? (
                    <div className="text-[10px] text-slate-400 font-mono">
                      Cevap Tarihi: {new Date(selectedOffer.resolvedAt).toLocaleString("tr-TR")}
                    </div>
                  ) : (
                    <div className="text-[10px] text-amber-400">İşverenden cevap bekleniyor</div>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300">Şifreli İletişim Güvencesi:</div>
                <p className="text-slate-500 leading-relaxed">
                  Operis mimarisinde teklifler AES-256 ile şifrelenir ve yalnızca ilan sahibi
                  tarafından çözülebilir. Yönetici konsolu; ticari sırları ifşa etmeksizin teklifin
                  bütçe, süre, zaman damgası ve yanıt durumunu eksiksiz denetleme olanağı sağlar.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedOffer(null)}
                className="px-4 py-2 rounded-xl border border-slate-800 text-xs text-slate-300 hover:text-white w-full sm:w-auto"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
