"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Scale,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  FileText,
  User,
  X,
  Briefcase,
} from "lucide-react";
import type { AdminDisputeItem } from "@/src/modules/admin/service";
import { DisputeArbiterCard } from "./dispute-arbiter-card";

interface AdminDisputesClientProps {
  initialDisputes: AdminDisputeItem[];
  total: number;
  currentPage?: number;
  totalPages?: number;
}

function getArbitrateButtonLabel(isSubmitting: boolean, decisionModal: string | null): string {
  if (isSubmitting) {
    return "Karar İşleniyor...";
  }
  if (decisionModal === "FORCE_COMPLETE") {
    return "Hakem Kararıyla Tamamla";
  }
  return "Hakem Kararıyla İptal Et";
}

export function AdminDisputesClient({
  initialDisputes,
  total,
  currentPage = 1,
  totalPages = 1,
}: AdminDisputesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [disputes, setDisputes] = useState<AdminDisputeItem[]>(initialDisputes);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "DISPUTED");
  const [selectedDispute, setSelectedDispute] = useState<AdminDisputeItem | null>(null);
  const [decisionModal, setDecisionModal] = useState<"FORCE_COMPLETE" | "FORCE_CANCEL" | null>(
    null
  );
  const [adminNotes, setAdminNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setDisputes(initialDisputes);
  }, [initialDisputes]);

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl({ search: search.trim() || null, page: "1" });
  };

  const handleStatusTab = (status: string) => {
    setStatusFilter(status);
    updateUrl({ status: status === "ALL" ? null : status, page: "1" });
  };

  const handleArbitrate = async () => {
    if (!selectedDispute || !decisionModal || isSubmitting) return;
    if (!adminNotes.trim()) {
      setActionError("Hakem kararı için yönetici gerekçe notu girilmesi zorunludur.");
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/admin/engagements/${selectedDispute.id}/resolve-dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: decisionModal,
          notes: adminNotes.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Hakemlik kararı uygulanamadı.");
      }

      const newStatus = decisionModal === "FORCE_COMPLETE" ? "COMPLETED" : "CANCELLED";
      setDisputes((prev) =>
        prev.map((d) => (d.id === selectedDispute.id ? { ...d, status: newStatus } : d))
      );

      setActionSuccess(
        `Uyuşmazlık karara bağlandı: Proje '${selectedDispute.listingTitle}' ${
          decisionModal === "FORCE_COMPLETE" ? "TAMAMLANDI" : "İPTAL EDİLDİ"
        } olarak işaretlendi ve taraflara bildirim iletildi.`
      );

      setDecisionModal(null);
      setSelectedDispute(null);
      setAdminNotes("");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bir hata meydana geldi.";
      setActionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DISPUTED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
            <AlertTriangle className="h-3 w-3" />
            UYUŞMAZLIKTA
          </span>
        );
      case "COMPLETION_PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="h-3 w-3" />
            ONAY BEKLİYOR
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3" />
            TAMAMLANDI
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700/50">
            <XCircle className="h-3 w-3" />
            İPTAL EDİLDİ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            {status}
          </span>
        );
    }
  };

  const getMarkIcon = (markStatus: string | null) => {
    if (markStatus === "MARKED_COMPLETE") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
          <CheckCircle2 className="h-2.5 w-2.5" />
          Tamamlandı Onayı
        </span>
      );
    }
    if (markStatus === "DISPUTES_COMPLETION") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] text-red-400 font-medium bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
          <AlertTriangle className="h-2.5 w-2.5" />
          İtiraz Etti
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-medium bg-slate-800/50 px-1.5 py-0.5 rounded border border-slate-700/40">
        <Clock className="h-2.5 w-2.5" />
        Beklemede
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Toast Notifications */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-400 hover:text-emerald-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-200">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Control Bar: Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-[#12141a] p-3 rounded-xl border border-slate-800/80">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1">
          {[
            { key: "DISPUTED", label: "Uyuşmazlıkta" },
            { key: "COMPLETION_PENDING", label: "Onay Bekleyen" },
            { key: "COMPLETED", label: "Tamamlanan" },
            { key: "CANCELLED", label: "İptal Edilen" },
            { key: "ALL", label: "Tümü" },
          ].map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleStatusTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Proje veya kullanıcı ara..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </form>
      </div>

      {/* Table Container */}
      <div className="bg-[#12141a] border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Proje / İlan</th>
                <th className="py-3 px-4">İşveren (Müşteri)</th>
                <th className="py-3 px-4">Serbest Çalışan (Uzman)</th>
                <th className="py-3 px-4">Eşleşme Tarihi</th>
                <th className="py-3 px-4">Durum</th>
                <th className="py-3 px-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {disputes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Scale className="h-8 w-8 mx-auto mb-2 opacity-30 text-slate-400" />
                    <p className="text-sm font-medium">
                      Kayıtlı uyuşmazlık veya eşleşme bulunamadı.
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Filtre kriterlerinizi değiştirebilir veya arama sorgusunu temizleyebilirsiniz.
                    </p>
                  </td>
                </tr>
              ) : (
                disputes.map((dispute) => (
                  <tr key={dispute.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-white group-hover:text-blue-400 transition-colors line-clamp-1 max-w-xs">
                        {dispute.listingTitle}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                        <span>ID: {dispute.id.slice(0, 8)}...</span>
                        <span>•</span>
                        <span className="capitalize">{dispute.categoryKey}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200">{dispute.ownerDisplayName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        @{dispute.ownerHandle}
                      </div>
                      <div className="mt-1">{getMarkIcon(dispute.ownerMarkStatus)}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200">
                        {dispute.freelancerDisplayName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        @{dispute.freelancerHandle}
                      </div>
                      <div className="mt-1">{getMarkIcon(dispute.freelancerMarkStatus)}</div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(dispute.matchedAt).toLocaleDateString("tr-TR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(dispute.status)}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedDispute(dispute)}
                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all inline-flex items-center gap-1"
                      >
                        <Scale className="h-3 w-3" />
                        <span>İncele & Hakemlik</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Toplam <span className="font-medium text-white">{total}</span> kayıt içinden{" "}
              <span className="font-medium text-white">{(currentPage - 1) * 25 + 1}</span> -{" "}
              <span className="font-medium text-white">{Math.min(currentPage * 25, total)}</span>{" "}
              arası gösteriliyor.
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => updateUrl({ page: String(currentPage - 1) })}
                className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 font-mono text-[11px]">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => updateUrl({ page: String(currentPage + 1) })}
                className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review & Arbitration Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
          <div className="bg-[#141720] border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Scale className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Uyuşmazlık Hakemliği ve İnceleme</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Eşleşme ID: {selectedDispute.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedDispute(null);
                  setDecisionModal(null);
                  setAdminNotes("");
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Project Snapshot Card */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5 text-blue-400" />
                    Proje Özeti
                  </span>
                  {getStatusBadge(selectedDispute.status)}
                </div>
                <h4 className="text-sm font-semibold text-white">{selectedDispute.listingTitle}</h4>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                  <span>
                    Kategori:{" "}
                    <strong className="text-slate-200">{selectedDispute.categoryKey}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Eşleşme:{" "}
                    <strong className="text-slate-200">
                      {new Date(selectedDispute.matchedAt).toLocaleDateString("tr-TR")}
                    </strong>
                  </span>
                  {selectedDispute.listingSlug && (
                    <>
                      <span>•</span>
                      <Link
                        href={`/tr/ilanlar/${selectedDispute.listingSlug}`}
                        target="_blank"
                        className="text-blue-400 hover:underline inline-flex items-center gap-0.5"
                      >
                        İlanı Aç <ExternalLink className="h-2.5 w-2.5" />
                      </Link>
                    </>
                  )}
                  <span>•</span>
                  <Link
                    href={`/tr/calisma-alani/${selectedDispute.id}`}
                    target="_blank"
                    className="text-emerald-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    Çalışma Alanına Git <ExternalLink className="h-2.5 w-2.5" />
                  </Link>
                </div>
              </div>

              {/* Bilateral Parties Comparison Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Employer Side */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-blue-400" />
                    İşveren (Müşteri)
                  </div>
                  <div className="font-medium text-white">{selectedDispute.ownerDisplayName}</div>
                  <div className="text-xs font-mono text-slate-400">
                    @{selectedDispute.ownerHandle}
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Tamamlama Durumu:</span>
                    <div>{getMarkIcon(selectedDispute.ownerMarkStatus)}</div>
                  </div>
                </div>

                {/* Freelancer Side */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-indigo-400" />
                    Serbest Çalışan (Uzman)
                  </div>
                  <div className="font-medium text-white">
                    {selectedDispute.freelancerDisplayName}
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    @{selectedDispute.freelancerHandle}
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Tamamlama Durumu:</span>
                    <div>{getMarkIcon(selectedDispute.freelancerMarkStatus)}</div>
                  </div>
                </div>
              </div>

              {/* AI Dispute Arbiter & Evidence Report */}
              <DisputeArbiterCard
                engagementId={selectedDispute.id}
                isAdmin={true}
                locale="tr"
                onAutofillDecision={(decision, suggestedNotes) => {
                  setDecisionModal(decision);
                  setAdminNotes(suggestedNotes);
                }}
              />

              {/* Arbitration Form */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <FileText className="h-4 w-4 text-blue-400" />
                  <span>Yönetici Hakemlik Karar Gerekçesi (Zorunlu)</span>
                </div>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Taraflara iletilecek resmi hakemlik karar gerekçesini, delil özetini veya mutabakat notunu yazınız..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-500">
                  Bu not her iki tarafın bildirim merkezine iletilecek ve sistem denetim günlüğüne
                  (Audit Log) kalıcı olarak işlenecektir.
                </p>
              </div>

              {/* Confirmation Step if an action is selected */}
              {decisionModal && (
                <div
                  className={`p-3.5 rounded-xl border text-xs space-y-2 animate-in fade-in ${
                    decisionModal === "FORCE_COMPLETE"
                      ? "bg-emerald-950/30 border-emerald-800 text-emerald-200"
                      : "bg-red-950/30 border-red-800 text-red-200"
                  }`}
                >
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    <span>
                      {decisionModal === "FORCE_COMPLETE"
                        ? "Projeyi Zorla Tamamlama Onayı"
                        : "Projeyi Zorla İptal Etme Onayı"}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-90 leading-relaxed">
                    {decisionModal === "FORCE_COMPLETE"
                      ? "Bu işlem projeyi 'COMPLETED' durumuna alacak, ilanı kapatacak ve taraflara tavsiye mektubu bırakma hakkı tanıyacaktır. Bu karar geri alınamaz."
                      : "Bu işlem projeyi 'CANCELLED' durumuna alacak, kabul edilen teklifi feshedecek ve ilanı işverenin paneline 'INACTIVE_OWNER' olarak iade edecektir."}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedDispute(null);
                  setDecisionModal(null);
                  setAdminNotes("");
                }}
                className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Kapat
              </button>

              <div className="flex items-center gap-2">
                {!decisionModal ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setDecisionModal("FORCE_CANCEL")}
                      className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all inline-flex items-center gap-1.5"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Projeyi İptal Et (Force Cancel)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDecisionModal("FORCE_COMPLETE")}
                      className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all inline-flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Projeyi Tamamla (Force Complete)</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setDecisionModal(null)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting || !adminNotes.trim()}
                      onClick={handleArbitrate}
                      className={`px-4 py-2 rounded-lg text-xs font-bold text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        decisionModal === "FORCE_COMPLETE"
                          ? "bg-emerald-600 hover:bg-emerald-500"
                          : "bg-red-600 hover:bg-red-500"
                      }`}
                    >
                      {getArbitrateButtonLabel(isSubmitting, decisionModal)}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
