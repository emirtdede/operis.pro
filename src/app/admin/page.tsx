import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  Layers,
  Send,
  Handshake,
  AlertTriangle,
  ShieldAlert,
  Activity,
  ArrowRight,
} from "lucide-react";
import { AdminService } from "@/src/modules/admin/service";

export const metadata: Metadata = {
  title: "Yönetim & Güvenlik Paneli | Operis Admin",
  description: "Operis operasyonel yönetim, moderasyon merkezi ve siber güvenlik denetim konsolu.",
};

function getThreatSeverityBadgeClass(severity: string): string {
  if (severity === "CRITICAL") {
    return "bg-red-500/20 text-red-400 border-red-500/40";
  }
  if (severity === "HIGH") {
    return "bg-orange-500/20 text-orange-400 border-orange-500/40";
  }
  return "bg-blue-500/20 text-blue-400 border-blue-500/40";
}

export default async function AdminDashboardPage() {
  const metrics = await AdminService.getDashboardMetrics();
  const allThreats = await AdminService.getSecurityThreats({});
  const threats = allThreats.slice(0, 3);
  const abuseIncidents = await AdminService.getAbuseIncidents({ status: "OPEN" });
  const auditLogs = await AdminService.getAuditLogs(5);

  const kpis = [
    {
      label: "Toplam Kullanıcı",
      value: metrics.totalUsers.toLocaleString(),
      sub: "+10.000 Ölçekli Dizin",
      icon: Users,
      color: "from-blue-500/20 to-blue-600/10 text-blue-400 border-blue-500/20",
      href: "/admin/users",
    },
    {
      label: "Aktif Canlı İlanlar",
      value: metrics.activeListings.toLocaleString(),
      sub: "7 Günlük Radar Kapsamı",
      icon: Layers,
      color: "from-emerald-500/20 to-emerald-600/10 text-emerald-400 border-emerald-500/20",
      href: "/admin/listings",
    },
    {
      label: "Son 24s Teklifler",
      value: metrics.offersLast24h.toLocaleString(),
      sub: "Şifrelenmiş Birebir Teklifler",
      icon: Send,
      color: "from-purple-500/20 to-purple-600/10 text-purple-400 border-purple-500/20",
      href: "/admin/offers",
    },
    {
      label: "Oluşan Eşleşmeler",
      value: metrics.matchesLast24h.toLocaleString(),
      sub: "Doğrudan Anlaşma Ağları",
      icon: Handshake,
      color: "from-indigo-500/20 to-indigo-600/10 text-indigo-400 border-indigo-500/20",
      href: "/admin/offers",
    },
    {
      label: "Kullanıcı İhlalleri",
      value: metrics.openReports.toLocaleString(),
      sub: "Küfür, Hakaret & Şikayet",
      icon: AlertTriangle,
      color: "from-amber-500/20 to-amber-600/10 text-amber-400 border-amber-500/20",
      href: "/admin/moderation/abuse",
    },
    {
      label: "Siber Saldırılar & Tehdit",
      value: metrics.activeThreats.toLocaleString(),
      sub: "Brute Force, DDoS & SQLi",
      icon: ShieldAlert,
      color: "from-red-500/20 to-red-600/10 text-red-400 border-red-500/20",
      href: "/admin/security/threats",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Operations */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>Operis Yönetim & Güvenlik Konsolu</span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              v2.4 Enterprise
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            +10.000 kullanıcı, 21 teknoloji disiplini, canlı tazelik radarı ve çift kanallı tehdit
            izleme merkezi.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/security/threats"
            className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <ShieldAlert className="h-4 w-4" />
            <span>Saldırı İzleme ({metrics.activeThreats})</span>
          </Link>
          <Link
            href="/admin/moderation/abuse"
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>İhlal Kuyruğu ({metrics.openReports})</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={kpi.label}
              href={kpi.href}
              className={`p-4 rounded-2xl border bg-gradient-to-br transition-all hover:scale-[1.02] hover:shadow-lg ${kpi.color} flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{kpi.label}</span>
                <Icon className="h-4 w-4" />
              </div>
              <div className="my-3">
                <div className="text-2xl font-bold tracking-tight text-white font-mono">
                  {kpi.value}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{kpi.sub}</div>
              </div>
              <div className="text-[10px] font-medium inline-flex items-center gap-1 opacity-70 hover:opacity-100">
                <span>Modülü Aç</span>
                <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Dual Real-Time Feeds: Abuse & Cyber Threats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kanal 1: Kullanıcı Uygunsuzluk & Küfür/Hakaret Bildirimleri */}
        <div className="rounded-2xl border border-slate-800 bg-[#12141a] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <h2 className="font-semibold text-sm text-white">
                Kullanıcı İhlalleri & Küfür/Hakaret Uyarıları
              </h2>
            </div>
            <Link
              href="/admin/moderation/abuse"
              className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
            >
              <span>Tümünü Gör</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {abuseIncidents.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/50 space-y-1.5 text-xs hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">
                      {item.offenderDisplayName || "Şüpheli Kullanıcı"}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono">
                      {item.reasonCode}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(item.createdAt).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2">
                  {item.details}
                </p>
                {item.flaggedTerms && item.flaggedTerms.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-red-400 font-medium">
                      Tespit Edilen Kelimeler:
                    </span>
                    {item.flaggedTerms.map((term) => (
                      <span
                        key={term}
                        className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 font-mono text-[9px] border border-red-500/30"
                      >
                        {term}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Kanal 2: Siber Güvenlik Saldırıları & Hacker Uyarıları */}
        <div className="rounded-2xl border border-slate-800 bg-[#12141a] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-400" />
              <h2 className="font-semibold text-sm text-white">
                Siber Tehditler & Anlık Saldırı Alarmları
              </h2>
            </div>
            <Link
              href="/admin/security/threats"
              className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
            >
              <span>Tümünü Gör</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {threats.map((threat) => (
              <div
                key={threat.id}
                className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/50 space-y-1.5 text-xs hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-red-400">{threat.sourceIp}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${getThreatSeverityBadgeClass(threat.severity)}`}
                    >
                      {threat.severity}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                      {threat.threatType}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {threat.attemptCount} Teşebbüs
                  </span>
                </div>
                <div className="text-slate-400 font-mono text-[11px] truncate">
                  Hedef: {threat.targetEndpoint}
                </div>
                <div className="flex items-center justify-between pt-1 text-[10px]">
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Savunma Durumu: {threat.status}
                  </span>
                  <span className="text-slate-500">Risk Skoru: %{threat.riskScore}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="rounded-2xl border border-slate-800 bg-[#12141a] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" />
            <h2 className="font-semibold text-sm text-white">
              Son Yönetici & Moderasyon Denetim İzi (Audit Logs)
            </h2>
          </div>
          <Link
            href="/admin/logs?category=audit"
            className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
          >
            <span>Tüm Logları İncele</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="divide-y divide-slate-800/60">
          {auditLogs.map(
            (log: {
              id: string;
              action: string;
              safeSummary: string | null;
              createdAt: Date | string;
            }) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between text-xs gap-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-[10px] border border-blue-500/20 shrink-0">
                    {log.action}
                  </span>
                  <span className="text-slate-300 truncate">{log.safeSummary}</span>
                </div>
                <span className="text-slate-500 font-mono text-[10px] shrink-0">
                  {new Date(log.createdAt).toLocaleString("tr-TR")}
                </span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
