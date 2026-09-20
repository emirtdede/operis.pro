"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Clock,
  ExternalLink,
  X,
  AlertTriangle,
  Eye,
  MousePointerClick,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AdminListingItem } from "@/src/modules/admin/service";

interface ListingsTableClientProps {
  initialListings: AdminListingItem[];
  total: number;
  currentPage?: number;
  totalPages?: number;
}

function renderListingStatusBadge(status: string) {
  if (status === "ACTIVE") {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-semibold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
        AKTİF
      </span>
    );
  }
  if (status === "HIDDEN_MODERATION") {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-semibold border bg-amber-500/10 text-amber-400 border-amber-500/20">
        GİZLENDİ
      </span>
    );
  }
  if (status === "DELETED") {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-semibold border bg-rose-500/10 text-rose-400 border-rose-500/20">
        SİLİNDİ (SOFT)
      </span>
    );
  }
  if (status === "MATCHED") {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-semibold border bg-purple-500/10 text-purple-400 border-purple-500/20">
        EŞLEŞTİ
      </span>
    );
  }
  if (status === "COMPLETED") {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-semibold border bg-blue-500/10 text-blue-400 border-blue-500/20">
        TAMAMLANDI
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-semibold border bg-slate-800 text-slate-400 border-slate-700">
      SÜRESİ DOLDU
    </span>
  );
}

export function ListingsTableClient({
  initialListings,
  total,
  currentPage = 1,
  totalPages = 1,
}: ListingsTableClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [listings, setListings] = useState<AdminListingItem[]>(initialListings);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "ALL");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    setListings(initialListings);
  }, [initialListings]);

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
  const [modifyingListing, setModifyingListing] = useState<AdminListingItem | null>(null);
  const [moderationReason, setModerationReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = listings.filter((l) => {
    if (statusFilter !== "ALL" && l.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        l.title.toLowerCase().includes(q) ||
        l.ownerDisplayName.toLowerCase().includes(q) ||
        l.ownerHandle.toLowerCase().includes(q) ||
        l.slug.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleApplyModeration = async () => {
    if (!modifyingListing || !moderationReason.trim() || isSubmitting) return;

    const action = modifyingListing.status === "ACTIVE" ? "HIDE" : "UNHIDE";
    const newStatus = action === "HIDE" ? "HIDDEN_MODERATION" : "ACTIVE";
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/listings/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: modifyingListing.id,
          action,
          reason: moderationReason.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "İşlem başarısız oldu");
      }

      setListings((prev) =>
        prev.map((l) => (l.id === modifyingListing.id ? { ...l, status: newStatus } : l))
      );

      setActionSuccess(
        `'${modifyingListing.title}' ilanı '${newStatus === "HIDDEN_MODERATION" ? "YAYINDAN KALDIRILDI" : "AKTİF"}' olarak işaretlendi.`
      );
      setModifyingListing(null);
      setModerationReason("");
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Güncelleme başarısız oldu.";
      setActionSuccess(`Hata: ${msg}`);
      setTimeout(() => setActionSuccess(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {actionSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#12141a] border border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateUrl({ search: search.trim(), page: "1" });
          }}
          className="relative flex items-center gap-2 flex-1 max-w-md"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İlan başlığı veya ilan sahibi ile ara..."
              className={`w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 ${search ? "pr-8" : "pr-3"} py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500`}
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  updateUrl({ search: "", page: "1" });
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
                title="Aramayı Temizle"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-sm"
          >
            Ara
          </button>
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
            <option value="ALL">Tüm Durumlar</option>
            <option value="ACTIVE">Aktif (7 Günlük Radarda)</option>
            <option value="INACTIVE_EXPIRED">Süresi Dolanlar</option>
            <option value="HIDDEN_MODERATION">Moderasyonla Gizlenenler</option>
            <option value="DELETED">Kullanıcı Tarafından Silinenler (Soft Delete)</option>
            <option value="MATCHED">Eşleşenler (Projeye Dönüşen)</option>
            <option value="COMPLETED">Tamamlanan Projeler</option>
          </select>

          <span className="text-[11px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-xl">
            {filtered.length} İlan
          </span>
        </div>
      </div>

      {/* Listings Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#12141a] overflow-hidden">
        <div className="sm:hidden px-3 py-1.5 bg-slate-900/50 border-b border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
          <span>Yatay Kaydırılabilir Tablo</span>
          <span className="text-blue-400 font-mono">Kaydırın →</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">İlan Başlığı & Kategori</th>
                <th className="py-3 px-4">İlan Sahibi</th>
                <th className="py-3 px-4">Bütçe</th>
                <th className="py-3 px-4">Durum</th>
                <th className="py-3 px-4">Tazelik Radarı</th>
                <th className="py-3 px-4">Görüntülenme / Tıklanma</th>
                <th className="py-3 px-4 text-right">Aksiyonlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white truncate max-w-sm">{item.title}</div>
                    <div className="text-[10px] font-mono text-blue-400 mt-0.5">
                      {item.categoryName} • /{item.categoryKey}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="text-slate-200 font-medium">{item.ownerDisplayName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">@{item.ownerHandle}</div>
                  </td>

                  <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">
                    {item.budgetFormatted}
                  </td>

                  <td className="py-3 px-4">
                    {renderListingStatusBadge(item.status)}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                      <Clock className="h-3 w-3 text-blue-400" />
                      <span>Döngü #{item.activationSeq} (7 Günlük)</span>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="flex items-center gap-1 text-blue-400" title="Görüntülenme">
                        <Eye className="h-3 w-3" />
                        <span>{(item.viewCount ?? 0).toLocaleString()}</span>
                      </span>
                      <span className="text-slate-600">|</span>
                      <span className="flex items-center gap-1 text-emerald-400" title="Tıklanma">
                        <MousePointerClick className="h-3 w-3" />
                        <span>{(item.clickCount ?? 0).toLocaleString()}</span>
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {item.status !== "DELETED" && (
                        <Link
                          href={`/tr/ilanlar/${item.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white"
                          title="İlanı Gör"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      )}

                      {item.status === "DELETED" ? (
                        <span className="px-2 py-1 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-500 text-[11px] font-mono">
                          Arşivlendi
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setModifyingListing(item)}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                            item.status === "ACTIVE"
                              ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                          }`}
                        >
                          {item.status === "ACTIVE" ? "Yayından Kaldır" : "Görünür Yap"}
                        </button>
                      )}
                    </div>
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
          Toplam <span className="text-white font-semibold">{total.toLocaleString()}</span> ilan •
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

      {/* Moderation Modal */}
      {modifyingListing && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md max-h-[min(92dvh,calc(100dvh-2rem))] flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#12141a] p-4 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="truncate">İlan Moderasyon Aksiyonu</span>
              </h3>
              <button
                onClick={() => setModifyingListing(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 py-3 space-y-3 pr-1">
              <p className="text-xs text-slate-300">
                <span className="font-semibold text-white">'{modifyingListing.title}'</span> başlıklı
                ilanı{" "}
                {modifyingListing.status === "ACTIVE" ? "yayından kaldırmak" : "tekrar aktif etmek"}{" "}
                üzeresiniz.
              </p>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400">
                  Gerekçe / Audit Log Açıklaması *
                </label>
                <textarea
                  rows={3}
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  placeholder="Örn: Topluluk kurallarına aykırı dış iletişim veya telif ihlali tespiti..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setModifyingListing(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-800 text-xs text-slate-400 hover:text-white"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleApplyModeration}
                disabled={!moderationReason.trim() || isSubmitting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-xs font-bold text-white transition-colors"
              >
                {isSubmitting ? "İşleniyor..." : "Aksiyonu Onayla ve İşle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
