"use client";

import { useState, useEffect } from "react";
import {
  History,
  X,
  Clock,
  FileText,
  ChevronRight,
  AlertCircle,
  Banknote,
  Calendar,
} from "lucide-react";
import { Button } from "../ui/button";

export interface OfferRevisionItem {
  id: string;
  offerId: string;
  revisionNo: number;
  snapshotJson: Record<string, unknown>;
  createdAt: string | Date;
}

interface OfferRevisionsModalProps {
  offerId: string;
  isOpen: boolean;
  onClose: () => void;
  locale?: string;
}

function formatRevisionBudget(snapshot: Record<string, unknown>, isTr: boolean): string {
  if (snapshot.budgetMin) {
    return `${snapshot.budgetMin} - ${snapshot.budgetMax} ${snapshot.budgetCurrency || "TRY"}`;
  }
  return isTr ? "Belirtilmemiş" : "Not specified";
}

function formatRevisionDuration(snapshot: Record<string, unknown>, isTr: boolean): string {
  if (snapshot.estimatedDurationValue) {
    return `${snapshot.estimatedDurationValue} ${snapshot.estimatedDurationUnit || ""}`;
  }
  return isTr ? "Belirtilmemiş" : "Not specified";
}

export function OfferRevisionsModal({
  offerId,
  isOpen,
  onClose,
  locale = "tr",
}: OfferRevisionsModalProps) {
  const isTr = locale === "tr";
  const [revisions, setRevisions] = useState<OfferRevisionItem[]>([]);
  const [selectedRevision, setSelectedRevision] = useState<OfferRevisionItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !offerId) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetch(`/api/offers/${offerId}/revisions`)
      .then((res) => {
        if (!res.ok) throw new Error("Teklif revizyon geçmişi yüklenemedi.");
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data.revisions) ? data.revisions : [];
        setRevisions(list);
        if (list.length > 0) {
          setSelectedRevision(list[0]);
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Hata oluştu.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, offerId]);

  if (!isOpen) return null;

  const renderSidebarContent = () => {
    if (isLoading) {
      return (
        <div className="p-4 text-center text-xs text-slate-500">
          {isTr ? "Yükleniyor..." : "Loading..."}
        </div>
      );
    }
    if (error) {
      return (
        <div className="p-3 text-xs text-red-400 flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      );
    }
    if (revisions.length === 0) {
      return (
        <div className="p-4 text-center text-xs text-slate-500">
          {isTr ? "Henüz kayıtlı bir teklif revizyonu yok." : "No offer revisions recorded."}
        </div>
      );
    }
    return revisions.map((rev) => {
      const isSelected = selectedRevision?.id === rev.id;
      return (
        <button
          key={rev.id}
          type="button"
          onClick={() => setSelectedRevision(rev)}
          className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between text-xs ${
            isSelected
              ? "bg-blue-600/20 text-blue-300 border border-blue-500/30 font-medium"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
          }`}
        >
          <div className="space-y-0.5">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-slate-800 text-blue-400">
                v{rev.revisionNo}
              </span>
              <span>
                {isTr ? "Sürüm" : "Version"} #{rev.revisionNo}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              <span>
                {new Date(rev.createdAt).toLocaleDateString(
                  locale === "tr" ? "tr-TR" : "en-US"
                )}
              </span>
            </div>
          </div>
          <ChevronRight className="h-3.5 w-3.5 opacity-50" />
        </button>
      );
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={isTr ? "Teklif Revizyon Geçmişi" : "Offer Revision History"}
    >
      <div className="bg-[#141720] border border-slate-700/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2.5 text-blue-400">
            <History className="h-5 w-5" aria-hidden="true" />
            <div>
              <h3 className="text-sm font-bold text-white">
                {isTr ? "Teklif Güncelleme & Revizyon Geçmişi" : "Proposal Revision History"}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isTr
                  ? "Bu teklifte zaman içinde yapılan bütçe, süre ve mesaj değişikliklerini inceleyin."
                  : "Review historical budget, timeline, and message adjustments made to this offer."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            aria-label={isTr ? "Kapat" : "Close"}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-800">
          {/* Revisions Sidebar List */}
          <div className="w-full md:w-64 max-h-40 md:max-h-none p-3 overflow-y-auto space-y-1.5 bg-slate-950/40 shrink-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1">
              {isTr ? "Sürüm Listesi" : "Version History"}
            </div>

            {renderSidebarContent()}
          </div>

          {/* Selected Revision Snapshot Preview */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
            {selectedRevision ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <span>{isTr ? "Teklif Durum Özeti" : "Proposal Snapshot"}</span>
                      <span className="font-mono text-xs font-normal text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                        v{selectedRevision.revisionNo}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {new Date(selectedRevision.createdAt).toLocaleString(
                        locale === "tr" ? "tr-TR" : "en-US"
                      )}
                    </p>
                  </div>
                </div>

                {/* Budget and Duration metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                      <Banknote className="h-3 w-3 text-emerald-400" />
                      {isTr ? "Teklif Edilen Bütçe" : "Proposed Budget"}
                    </span>
                    <div className="text-sm font-bold text-white font-mono">
                      {formatRevisionBudget(selectedRevision.snapshotJson, isTr)}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-blue-400" />
                      {isTr ? "Tahmini Teslim Süresi" : "Estimated Duration"}
                    </span>
                    <div className="text-sm font-bold text-white font-mono">
                      {formatRevisionDuration(selectedRevision.snapshotJson, isTr)}
                    </div>
                  </div>
                </div>

                {/* Proposal Message */}
                {typeof selectedRevision.snapshotJson.message === "string" && (
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                      {isTr ? "Teklif Mesajı / Ön Yazı" : "Cover Letter / Message"}
                    </span>
                    <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {selectedRevision.snapshotJson.message}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-slate-500">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <span>
                  {isTr ? "İncelemek için bir sürüm seçiniz." : "Select a version to inspect."}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex justify-end">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            {isTr ? "Kapat" : "Close"}
          </Button>
        </div>
      </div>
    </div>
  );
}
