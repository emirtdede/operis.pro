"use client";

import { useState, useEffect } from "react";
import { History, X, Clock, FileText, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";

export interface ListingRevisionItem {
  id: string;
  listingId: string;
  editorUserId: string;
  revisionNo: number;
  snapshotJson: Record<string, unknown>;
  createdAt: string | Date;
}

interface ListingRevisionsModalProps {
  listingId: string;
  isOpen: boolean;
  onClose: () => void;
  locale?: string;
}

export function ListingRevisionsModal({
  listingId,
  isOpen,
  onClose,
  locale = "tr",
}: ListingRevisionsModalProps) {
  const isTr = locale === "tr";
  const [revisions, setRevisions] = useState<ListingRevisionItem[]>([]);
  const [selectedRevision, setSelectedRevision] = useState<ListingRevisionItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !listingId) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetch(`/api/listings/${listingId}/revisions`)
      .then((res) => {
        if (!res.ok) throw new Error("Revizyon geçmişi yüklenemedi.");
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
  }, [isOpen, listingId]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={isTr ? "İlan Revizyon Geçmişi" : "Listing Revision History"}
    >
      <div className="bg-[#141720] border border-slate-700/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2.5 text-blue-400">
            <History className="h-5 w-5" aria-hidden="true" />
            <div>
              <h3 className="text-sm font-bold text-white">
                {isTr ? "İlan Değişiklik & Revizyon Geçmişi" : "Listing Revision History"}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isTr
                  ? "İlanın önceki sürümlerini ve yapılan düzenlemeleri inceleyin."
                  : "Review previous versions and content updates of this project."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-800">
          {/* Revisions Sidebar List */}
          <div className="w-full md:w-64 max-h-40 md:max-h-none p-3 overflow-y-auto space-y-1.5 bg-slate-950/40 shrink-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1">
              {isTr ? "Sürüm Listesi" : "Version History"}
            </div>

            {isLoading ? (
              <div className="p-4 text-center text-xs text-slate-500">
                {isTr ? "Yükleniyor..." : "Loading..."}
              </div>
            ) : error ? (
              <div className="p-3 text-xs text-red-400 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : revisions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                {isTr ? "Henüz kayıtlı bir revizyon bulunmuyor." : "No revisions recorded yet."}
              </div>
            ) : (
              revisions.map((rev) => {
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
                          {isTr ? "Revizyon" : "Revision"} #{rev.revisionNo}
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
              })
            )}
          </div>

          {/* Selected Revision Snapshot Preview */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
            {selectedRevision ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <span>{isTr ? "Sürüm Anlık Görüntüsü" : "Version Snapshot"}</span>
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

                {/* Key attributes parsed from snapshot */}
                <div className="space-y-3">
                  {typeof selectedRevision.snapshotJson.title === "string" && (
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        {isTr ? "İlan Başlığı" : "Listing Title"}
                      </span>
                      <div className="text-xs font-medium text-white">
                        {selectedRevision.snapshotJson.title}
                      </div>
                    </div>
                  )}

                  {typeof selectedRevision.snapshotJson.summary === "string" && (
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        {isTr ? "Kısa Özet" : "Summary"}
                      </span>
                      <div className="text-xs text-slate-300">
                        {selectedRevision.snapshotJson.summary}
                      </div>
                    </div>
                  )}

                  {typeof selectedRevision.snapshotJson.scope === "string" && (
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        {isTr ? "Kapsam & Detaylar" : "Scope & Details"}
                      </span>
                      <div className="text-xs text-slate-300 whitespace-pre-wrap">
                        {selectedRevision.snapshotJson.scope}
                      </div>
                    </div>
                  )}
                </div>
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
