"use client";

import { useState } from "react";
import { Search, CheckCircle2, Clock, Archive, Reply, ExternalLink } from "lucide-react";

interface ContactMessageItem {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  locale: string;
  ipAddress: string | null;
  status: string;
  createdAt: Date | string;
}

interface ContactMessagesClientProps {
  initialMessages: ContactMessageItem[];
  total: number;
  newCount: number;
  currentPage: number;
  totalPages: number;
}

export function ContactMessagesClient({
  initialMessages,
  total,
  newCount,
}: ContactMessagesClientProps) {
  const [messages, setMessages] = useState<ContactMessageItem[]>(initialMessages);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessageItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const filtered = messages.filter((m) => {
    if (statusFilter !== "ALL" && m.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleStatusUpdate = async (id: string, newStatus: "READ" | "REPLIED" | "ARCHIVED") => {
    setIsUpdating(id);
    const currentMessage = messages.find((m) => m.id === id);
    try {
      const res = await fetch(`/api/admin/contact-messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          expectedPreviousStatus: currentMessage?.status,
        }),
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
        if (selectedMessage?.id === id) {
          setSelectedMessage((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      } else if (res.status === 409) {
        alert(
          "Bu mesajın durumu başka bir yönetici tarafından güncellenmiştir. Güncel verileri görüntülemek için sayfa yenileniyor."
        );
        window.location.reload();
      }
    } catch {
      // non-blocking
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="İsim, e-posta veya konu ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto pb-1 sm:pb-0">
          {(["ALL", "NEW", "READ", "REPLIED", "ARCHIVED"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {st === "ALL" && `Tümü (${total})`}
              {st === "NEW" && `Yeni (${newCount})`}
              {st === "READ" && "Okundu"}
              {st === "REPLIED" && "Yanıtlandı"}
              {st === "ARCHIVED" && "Arşiv"}
            </button>
          ))}
        </div>
      </div>

      {/* Messages table */}
      <div className="bg-slate-900/40 rounded-2xl border border-slate-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Durum</th>
                <th className="py-3 px-4">Gönderen</th>
                <th className="py-3 px-4">Konu & Özet</th>
                <th className="py-3 px-4">Tarih</th>
                <th className="py-3 px-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                    Kayıtlı iletişim mesajı bulunamadı.
                  </td>
                </tr>
              ) : (
                filtered.map((msg) => (
                  <tr
                    key={msg.id}
                    onClick={() => {
                      setSelectedMessage(msg);
                      if (msg.status === "NEW") {
                        handleStatusUpdate(msg.id, "READ");
                      }
                    }}
                    className="hover:bg-slate-800/30 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      {msg.status === "NEW" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <Clock className="h-3 w-3" /> Yeni
                        </span>
                      )}
                      {msg.status === "READ" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans font-medium bg-slate-700/30 text-slate-300 border border-slate-700">
                          Okundu
                        </span>
                      )}
                      {msg.status === "REPLIED" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" /> Yanıtlandı
                        </span>
                      )}
                      {msg.status === "ARCHIVED" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                          <Archive className="h-3 w-3" /> Arşiv
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <div className="font-semibold text-slate-200">{msg.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{msg.email}</div>
                    </td>
                    <td className="py-3 px-4 font-sans max-w-xs sm:max-w-md truncate">
                      <div className="font-medium text-slate-200">{msg.subject}</div>
                      <div className="text-[11px] text-slate-400 truncate">{msg.message}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(msg.createdAt).toLocaleString("tr-TR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMessage(msg);
                        }}
                        className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                      >
                        İncele
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedMessage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-150"
          onClick={() => setSelectedMessage(null)}
        >
          <div
            className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl max-h-[min(92dvh,calc(100dvh-2rem))] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4 shrink-0">
              <div className="min-w-0">
                <span className="text-[10px] uppercase tracking-wider text-blue-400 font-mono">
                  İletişim Talebi • {selectedMessage.locale.toUpperCase()}
                </span>
                <h3 className="text-base font-bold text-white mt-1 truncate">{selectedMessage.subject}</h3>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  {selectedMessage.name} &lt;{selectedMessage.email}&gt;
                </p>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-slate-400 hover:text-white text-lg leading-none p-1 rounded-lg shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 py-3 space-y-4 pr-1">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                {selectedMessage.message}
              </div>

              <div className="text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-1 font-mono">
                <span>IP: {selectedMessage.ipAddress || "Bilinmiyor"}</span>
                <span>{new Date(selectedMessage.createdAt).toLocaleString("tr-TR")}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-800 shrink-0">
              <a
                href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}
                onClick={() => handleStatusUpdate(selectedMessage.id, "REPLIED")}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors w-full sm:w-auto"
              >
                <Reply className="h-3.5 w-3.5" /> E-posta ile Yanıtla{" "}
                <ExternalLink className="h-3 w-3 opacity-70" />
              </a>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  disabled={isUpdating === selectedMessage.id}
                  onClick={() => handleStatusUpdate(selectedMessage.id, "REPLIED")}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 text-xs font-medium transition-colors flex-1 sm:flex-none"
                >
                  Yanıtlandı Olarak İşaretle
                </button>
                <button
                  disabled={isUpdating === selectedMessage.id}
                  onClick={() => handleStatusUpdate(selectedMessage.id, "ARCHIVED")}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors flex-1 sm:flex-none"
                >
                  Arşivle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
