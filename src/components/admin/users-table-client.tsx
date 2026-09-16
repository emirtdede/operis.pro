"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { AdminUserItem } from "@/src/modules/admin/service";

interface UsersTableClientProps {
  initialUsers: AdminUserItem[];
  total: number;
  currentPage?: number;
  totalPages?: number;
}

export function UsersTableClient({
  initialUsers,
  total,
  currentPage = 1,
  totalPages = 1,
}: UsersTableClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [users, setUsers] = useState<AdminUserItem[]>(initialUsers);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "ALL");
  const [roleFilter, setRoleFilter] = useState(searchParams.get("role") || "ALL");
  const [sortField, setSortField] = useState<"createdAt" | "email" | "displayName">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

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

  // Filter & Sort
  const filteredUsers = users
    .filter((u) => {
      if (statusFilter !== "ALL" && u.status !== statusFilter) return false;
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          u.email.toLowerCase().includes(q) ||
          u.displayName.toLowerCase().includes(q) ||
          u.handle.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortField === "createdAt") {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortDir === "asc" ? timeA - timeB : timeB - timeA;
      }
      const valA = String(a[sortField]).toLowerCase();
      const valB = String(b[sortField]).toLowerCase();
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const handleToggleSuspend = async (targetUser: AdminUserItem) => {
    const action = targetUser.status === "ACTIVE" ? "SUSPEND" : "ACTIVATE";
    const newStatus = action === "SUSPEND" ? "SUSPENDED" : "ACTIVE";

    try {
      const res = await fetch("/api/admin/users/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: targetUser.id,
          action,
          reason: `Admin UI: ${action === "SUSPEND" ? "Kullanıcı askıya alındı" : "Askı kaldırıldı"}`,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "İşlem başarısız oldu");
      }

      startTransition(() => {
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, status: newStatus } : u))
        );
        if (selectedUser?.id === targetUser.id) {
          setSelectedUser((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
        setActionSuccess(
          `Kullanıcı @${targetUser.handle} durumu '${newStatus === "SUSPENDED" ? "ASKIYA ALINDI" : "AKTİF"}' olarak güncellendi.`
        );
        setTimeout(() => setActionSuccess(null), 4000);
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Güncelleme başarısız oldu.";
      setActionSuccess(`Hata: ${msg}`);
      setTimeout(() => setActionSuccess(null), 5000);
    }
  };

  const toggleSort = (field: "createdAt" | "email" | "displayName") => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  return (
    <div className="space-y-4">
      {/* Alert Notification */}
      {actionSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between animate-in fade-in-0 duration-200">
          <span>{actionSuccess}</span>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-300 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Control Bar: Search & Filters */}
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
              placeholder="Ad, @kullanıcıadı veya e-posta ile ara..."
              className={`w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 ${search ? "pr-8" : "pr-3"} py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors`}
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
          {/* Status Filter */}
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
            <option value="ACTIVE">Aktif Kullanıcılar</option>
            <option value="SUSPENDED">Askıya Alınanlar</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              const val = e.target.value;
              setRoleFilter(val);
              updateUrl({ role: val, page: "1" });
            }}
            className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Tüm Roller</option>
            <option value="USER">Standart Kullanıcı</option>
            <option value="MODERATOR">Moderatör</option>
            <option value="ADMIN">Yönetici</option>
            <option value="SECURITY_ADMIN">Güvenlik Yöneticisi</option>
          </select>

          <span className="text-[11px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-xl shrink-0">
            {filteredUsers.length} / {total.toLocaleString()} Kayıt
          </span>
        </div>
      </div>

      {/* Users High-Density Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#12141a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">
                  <button
                    onClick={() => toggleSort("displayName")}
                    className="flex items-center gap-1 hover:text-white"
                  >
                    <span>Kullanıcı</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="py-3 px-4">
                  <button
                    onClick={() => toggleSort("email")}
                    className="flex items-center gap-1 hover:text-white"
                  >
                    <span>E-Posta & Doğrulama</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="py-3 px-4">Rol</th>
                <th className="py-3 px-4">Durum</th>
                <th className="py-3 px-4">2FA</th>
                <th className="py-3 px-4">
                  <button
                    onClick={() => toggleSort("createdAt")}
                    className="flex items-center gap-1 hover:text-white"
                  >
                    <span>Kayıt Tarihi</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="py-3 px-4 text-right">Aksiyonlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.map((user) => {
                const initials = user.displayName
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => setSelectedUser(user)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div>
                          <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                            {user.displayName}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">@{user.handle}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-300">{user.email}</span>
                        {user.emailVerified ? (
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                            title="E-Posta Doğrulandı"
                          />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" title="Onaysız" />
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                          user.role === "SECURITY_ADMIN"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : user.role === "ADMIN"
                              ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                              : user.role === "MODERATOR"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          user.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                      >
                        {user.status === "ACTIVE" ? "AKTİF" : "ASKIDA"}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {user.twoFactorEnabled ? (
                        <span className="text-emerald-400 text-[10px] font-mono">Açık</span>
                      ) : (
                        <span className="text-slate-500 text-[10px] font-mono">Kapalı</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-[11px] font-mono text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                    </td>

                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedUser(user)}
                          className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800/80 text-[11px] text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                        >
                          Detay
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleSuspend(user)}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
                            user.status === "ACTIVE"
                              ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                          }`}
                        >
                          {user.status === "ACTIVE" ? "Askıya Al" : "Aktifleştir"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-[#12141a] border border-slate-800 rounded-2xl text-xs text-slate-400">
        <div>
          Toplam <span className="text-white font-semibold">{total.toLocaleString()}</span>{" "}
          kullanıcı • Sayfa <span className="text-white font-semibold">{currentPage}</span> /{" "}
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

      {/* User Details Modal / Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-0 duration-200">
          <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-[#12141a] p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center">
                  {selectedUser.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedUser.displayName}</h3>
                  <div className="text-xs font-mono text-slate-400">
                    @{selectedUser.handle} • ID: {selectedUser.id}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="text-slate-500 font-medium">E-Posta Adresi</div>
                <div className="font-mono text-slate-200 font-semibold">{selectedUser.email}</div>
                <div className="text-[10px] text-emerald-400">
                  {selectedUser.emailVerified ? "✓ Doğrulanmış" : "⚠ Doğrulanmamış"}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="text-slate-500 font-medium">Hesap Rolü & Statü</div>
                <div className="font-mono text-blue-400 font-semibold">{selectedUser.role}</div>
                <div className="text-[10px] text-slate-400">Durum: {selectedUser.status}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="text-slate-500 font-medium">Yayınlanan İlanlar</div>
                <div className="font-mono text-white text-lg font-bold">
                  {selectedUser.listingsCount} İlan
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="text-slate-500 font-medium">Sunulan Teklifler</div>
                <div className="font-mono text-white text-lg font-bold">
                  {selectedUser.offersCount} Teklif
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 text-xs">
              <div className="text-slate-400 font-semibold">Gizlilik & Kimlik Güvencesi:</div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Operis kuralları uyarınca kullanıcının telefon ve kimlik PII verileri veritabanında
                AES-256 ile şifreli tutulmakta olup yönetici ekranına doğrudan açık metin olarak
                gösterilmez (Zero-Knowledge Audit).
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white"
              >
                Kapat
              </button>

              <button
                type="button"
                onClick={() => handleToggleSuspend(selectedUser)}
                className={`px-4 py-2 rounded-xl font-bold transition-all ${
                  selectedUser.status === "ACTIVE"
                    ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                }`}
              >
                {selectedUser.status === "ACTIVE"
                  ? "Kullanıcıyı Askıya Al"
                  : "Kullanıcıyı Aktifleştir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
