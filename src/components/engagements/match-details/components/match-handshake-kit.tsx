"use client";

import Link from "next/link";
import {
  Copy,
  Check,
  MessageCircle,
  Calendar,
  Mail,
  ShieldCheck,
  Phone,
  Video,
  ExternalLink,
  Bell,
  Clock,
  Moon,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { AvatarInitials } from "@/src/components/ui/avatar-initials";
import { getLocalizedProfilePath } from "@/src/lib/i18n/routes";
import {
  type CounterpartyInfo,
  type CurrentUserInfo,
  type CounterpartyLocalTimeInfo,
  resolveTimezonePillClass,
  resolveTimezonePillLabel,
  getPingButtonLabel,
  getCopyFieldLabel,
  getCopyAriaLabel,
} from "../types";
import { SlackIcon, TeamsIcon } from "./icons";

export interface MatchHandshakeKitProps {
  counterparty: CounterpartyInfo;
  currentUser?: CurrentUserInfo;
  listingTitle: string;
  engagementId: string;
  locale: string;
  isTr: boolean;
  counterpartyTime: CounterpartyLocalTimeInfo;
  copiedField: "email" | "phone" | "wa" | "zoom" | "teams" | "slack" | null;
  pingCooldown: number;
  onOpenPingModal: () => void;
  onOpenNightCallModal: () => void;
  onCopy: (
    text: string,
    field: "email" | "phone" | "wa" | "zoom" | "teams" | "slack"
  ) => void;
}

export function MatchHandshakeKit({
  counterparty,
  currentUser,
  listingTitle,
  engagementId,
  locale,
  isTr,
  counterpartyTime,
  copiedField,
  pingCooldown,
  onOpenPingModal,
  onOpenNightCallModal,
  onCopy,
}: MatchHandshakeKitProps) {
  // Instant Handshake Action URLs
  const cleanPhone = counterparty.phone
    ? counterparty.phone.replace(/[^0-9+]/g, "").replace(/^\+/, "")
    : null;

  // 1. WhatsApp
  const waText = encodeURIComponent(
    isTr
      ? `Merhaba ${counterparty.displayName}, Operis üzerinden '${listingTitle}' ilanımızda eşleştik. İlan detaylarını ve başlangıç takvimini görüşmek isterim.`
      : `Hello ${counterparty.displayName}, we matched on Operis for '${listingTitle}'. I would like to discuss listing details and timeline.`
  );
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${waText}` : null;

  // 2. Google Meet & Calendar
  const meetTitle = encodeURIComponent(
    isTr
      ? `Operis Tanışma & Proje Başlangıcı: ${listingTitle}`
      : `Operis Kickoff Meeting: ${listingTitle}`
  );
  const meetDetails = encodeURIComponent(
    isTr
      ? `Operis üzerindeki '${listingTitle}' ilanımız için 30 dakikalık tanışma ve başlangıç toplantısı.\n\nİş Ortağı: ${counterparty.displayName} (${counterparty.email})\nReferans: OPR-ENG-${engagementId.slice(0, 8).toUpperCase()}`
      : `Kickoff meeting for '${listingTitle}' listing on Operis.\n\nCounterparty: ${counterparty.displayName} (${counterparty.email})\nReference: OPR-ENG-${engagementId.slice(0, 8).toUpperCase()}`
  );
  const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${meetTitle}&details=${meetDetails}${
    counterparty.email && counterparty.email !== "—"
      ? `&add=${encodeURIComponent(counterparty.email)}`
      : ""
  }`;

  // 3. Zoom
  const zoomStartUrl = "https://zoom.us/start/videomeeting";
  const zoomInviteText = isTr
    ? `Operis Video Toplantısı Daveti: '${listingTitle}'\nReferans: OPR-ENG-${engagementId.slice(0, 8).toUpperCase()}\nİş Ortağı: ${counterparty.displayName}\nLütfen Zoom bağlantınızı iletiniz veya bu linkten anlık odaya katılınız: ${zoomStartUrl}`
    : `Operis Video Meeting Invite: '${listingTitle}'\nReference: OPR-ENG-${engagementId.slice(0, 8).toUpperCase()}\nCounterparty: ${counterparty.displayName}\nPlease share your Zoom link or join instant room: ${zoomStartUrl}`;

  // 4. Microsoft Teams
  const teamsMessage = isTr
    ? `Merhaba ${counterparty.displayName}, Operis üzerinden '${listingTitle}' ilanımızda eşleştik. Görüşmeyi buradan sürdürebiliriz.`
    : `Hello ${counterparty.displayName}, we matched on Operis for '${listingTitle}'. We can coordinate here.`;
  const teamsChatUrl =
    counterparty.email && counterparty.email !== "—"
      ? `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(
          counterparty.email
        )}&message=${encodeURIComponent(teamsMessage)}`
      : null;

  // 5. Slack
  const slackAppUrl =
    counterparty.email && counterparty.email !== "—"
      ? `https://slack.com/app_redirect?channel=${encodeURIComponent(counterparty.email)}`
      : null;
  const slackInviteText = isTr
    ? `Merhaba ${counterparty.displayName},\nOperis üzerinden '${listingTitle}' ilanımızda eşleştik.\nSlack Connect veya doğrudan mesaj için e-posta adresim: ${currentUser?.email || "Operis İş Ortağınız"}\nReferans: OPR-ENG-${engagementId.slice(0, 8).toUpperCase()}`
    : `Hello ${counterparty.displayName},\nWe matched on Operis for '${listingTitle}'.\nTo connect on Slack Connect or direct message, my email is: ${currentUser?.email || "Your Operis Counterparty"}\nReference: OPR-ENG-${engagementId.slice(0, 8).toUpperCase()}`;

  // 6. Corporate Email
  const emailSubject = encodeURIComponent(
    isTr ? `Operis İlan Eşleşmesi: ${listingTitle}` : `Operis Listing Match: ${listingTitle}`
  );
  const emailBody = encodeURIComponent(
    isTr
      ? `Merhaba ${counterparty.displayName},\n\nOperis üzerinden '${listingTitle}' ilanımızda eşleştik.\n\nİlan detaylarını, teknik mimariyi ve teslimat aşamalarını netleştirmek adına iletişime geçmek istedim.\n\nİyi çalışmalar dilerim.`
      : `Hello ${counterparty.displayName},\n\nWe successfully matched on Operis for '${listingTitle}'.\n\nI would like to connect to coordinate scope, technical requirements, and delivery milestones.\n\nBest regards.`
  );
  const mailUrl =
    counterparty.email && counterparty.email !== "—"
      ? `mailto:${counterparty.email}?subject=${emailSubject}&body=${emailBody}`
      : null;

  // 7. Phone Call
  const telUrl = cleanPhone ? `tel:${cleanPhone}` : null;

  const preferredKey = counterparty.preferredContactChannel?.toLowerCase().trim() || "any";

  const renderBadge = () => (
    <span className="absolute -top-2.5 -right-1 px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-950 font-bold text-[9px] shadow-sm flex items-center gap-0.5 tracking-tight z-10 animate-pulse">
      ⭐ {isTr ? "Tercih Edilen" : "Preferred"}
    </span>
  );

  const channels = [
    {
      key: "whatsapp",
      node: waUrl ? (
        <a
          key="whatsapp"
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] ${
            preferredKey === "whatsapp" ? "relative ring-2 ring-amber-400 shadow-md shadow-amber-400/25" : ""
          }`}
        >
          {preferredKey === "whatsapp" && renderBadge()}
          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{isTr ? "Hızlı WhatsApp" : "Quick WhatsApp"}</span>
          <ExternalLink className="h-3 w-3 ml-auto opacity-70" aria-hidden="true" />
        </a>
      ) : (
        <button
          key="whatsapp"
          type="button"
          onClick={() => {
            onCopy(decodeURIComponent(waText), "wa");
            alert(isTr ? "WhatsApp mesaj taslağı panoya kopyalandı." : "WhatsApp draft copied to clipboard.");
          }}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition-all ${
            preferredKey === "whatsapp" ? "relative ring-2 ring-amber-400 shadow-md shadow-amber-400/25" : ""
          }`}
        >
          {preferredKey === "whatsapp" && renderBadge()}
          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {getCopyFieldLabel(copiedField === "wa", "WhatsApp Taslağı", "WhatsApp Draft", isTr)}
          </span>
          <Copy className="h-3 w-3 ml-auto opacity-70" aria-hidden="true" />
        </button>
      ),
    },
    {
      key: "meet",
      node: (
        <a
          key="meet"
          href={calendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] ${
            preferredKey === "meet" ? "relative ring-2 ring-amber-400 shadow-md shadow-amber-400/25" : ""
          }`}
        >
          {preferredKey === "meet" && renderBadge()}
          <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{isTr ? "Google Meet Daveti" : "Google Meet Invite"}</span>
          <ExternalLink className="h-3 w-3 ml-auto opacity-70" aria-hidden="true" />
        </a>
      ),
    },
    {
      key: "zoom",
      node: (
        <a
          key="zoom"
          href={zoomStartUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] ${
            preferredKey === "zoom" ? "relative ring-2 ring-amber-400 shadow-md shadow-amber-400/25" : ""
          }`}
        >
          {preferredKey === "zoom" && renderBadge()}
          <Video className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{isTr ? "Zoom Toplantısı" : "Zoom Meeting"}</span>
          <ExternalLink className="h-3 w-3 ml-auto opacity-70" aria-hidden="true" />
        </a>
      ),
    },
    {
      key: "teams",
      node: teamsChatUrl ? (
        <a
          key="teams"
          href={teamsChatUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#5059C9] hover:bg-[#434bb5] text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] ${
            preferredKey === "teams" ? "relative ring-2 ring-amber-400 shadow-md shadow-amber-400/25" : ""
          }`}
        >
          {preferredKey === "teams" && renderBadge()}
          <TeamsIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">Microsoft Teams</span>
          <ExternalLink className="h-3 w-3 ml-auto opacity-70" aria-hidden="true" />
        </a>
      ) : (
        <button
          key="teams"
          type="button"
          onClick={() => {
            onCopy(decodeURIComponent(teamsMessage), "teams");
            alert(isTr ? "Teams mesaj taslağı kopyalandı." : "Teams message draft copied.");
          }}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#5059C9]/80 hover:bg-[#5059C9] text-white text-xs font-semibold shadow-sm transition-all ${
            preferredKey === "teams" ? "relative ring-2 ring-amber-400 shadow-md shadow-amber-400/25" : ""
          }`}
        >
          {preferredKey === "teams" && renderBadge()}
          <TeamsIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">
            {getCopyFieldLabel(copiedField === "teams", "Teams Sohbet", "Teams Chat", isTr)}
          </span>
          <Copy className="h-3 w-3 ml-auto opacity-70" aria-hidden="true" />
        </button>
      ),
    },
    {
      key: "slack",
      node: slackAppUrl ? (
        <a
          key="slack"
          href={slackAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#4A154B] hover:bg-[#3d113e] text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] ${
            preferredKey === "slack" ? "relative ring-2 ring-amber-400 shadow-md shadow-amber-400/25" : ""
          }`}
        >
          {preferredKey === "slack" && renderBadge()}
          <SlackIcon className="h-4 w-4 shrink-0 text-[#ECB22E]" />
          <span className="truncate">{isTr ? "Slack ile Bağlan" : "Open in Slack"}</span>
          <ExternalLink className="h-3 w-3 ml-auto opacity-70" aria-hidden="true" />
        </a>
      ) : (
        <button
          key="slack"
          type="button"
          onClick={() => {
            onCopy(slackInviteText, "slack");
            alert(isTr ? "Slack davet şablonu kopyalandı." : "Slack invite copied.");
          }}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#4A154B]/80 hover:bg-[#4A154B] text-white text-xs font-semibold shadow-sm transition-all ${
            preferredKey === "slack" ? "relative ring-2 ring-amber-400 shadow-md shadow-amber-400/25" : ""
          }`}
        >
          {preferredKey === "slack" && renderBadge()}
          <SlackIcon className="h-4 w-4 shrink-0 text-[#ECB22E]" />
          <span className="truncate">
            {getCopyFieldLabel(copiedField === "slack", "Slack Daveti", "Slack Invite", isTr)}
          </span>
          <Copy className="h-3 w-3 ml-auto opacity-70" aria-hidden="true" />
        </button>
      ),
    },
    {
      key: "email",
      node: mailUrl ? (
        <a
          key="email"
          href={mailUrl}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] ${
            preferredKey === "email" ? "relative ring-2 ring-amber-400 shadow-md shadow-amber-400/25" : ""
          }`}
        >
          {preferredKey === "email" && renderBadge()}
          <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{isTr ? "Kurumsal E-Posta" : "Draft Email"}</span>
          <ExternalLink className="h-3 w-3 ml-auto opacity-70" aria-hidden="true" />
        </a>
      ) : (
        <button
          key="email"
          type="button"
          disabled
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] text-xs font-medium border border-[var(--color-border-subtle)] opacity-60 cursor-not-allowed ${
            preferredKey === "email" ? "relative ring-2 ring-amber-400" : ""
          }`}
        >
          {preferredKey === "email" && renderBadge()}
          <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{isTr ? "E-Posta Belirtilmedi" : "No Email"}</span>
        </button>
      ),
    },
    {
      key: "phone",
      node: telUrl ? (
        <a
          key="phone"
          href={telUrl}
          onClick={(e) => {
            if (counterpartyTime.isNight) {
              e.preventDefault();
              onOpenNightCallModal();
            }
          }}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] ${
            preferredKey === "phone" ? "relative ring-2 ring-amber-400 shadow-md shadow-amber-400/25" : ""
          }`}
        >
          {preferredKey === "phone" && renderBadge()}
          <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {isTr ? "Telefonla Ara" : "Call Directly"}
            {counterpartyTime.isNight ? " 🌙" : ""}
          </span>
          <ExternalLink className="h-3 w-3 ml-auto opacity-70" aria-hidden="true" />
        </a>
      ) : (
        <button
          key="phone"
          type="button"
          disabled
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] text-xs font-medium border border-[var(--color-border-subtle)] opacity-60 cursor-not-allowed ${
            preferredKey === "phone" ? "relative ring-2 ring-amber-400" : ""
          }`}
        >
          {preferredKey === "phone" && renderBadge()}
          <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{isTr ? "Telefon Belirtilmedi" : "No Phone"}</span>
        </button>
      ),
    },
  ];

  const sortedChannels = [...channels].sort((a, b) => {
    if (a.key === preferredKey) return -1;
    if (b.key === preferredKey) return 1;
    return 0;
  });

  return (
    <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
            {isTr ? "Eşleşilen Taraf ve İletişim Kanalları" : "Counterparty & Contact Channels"}
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            {isTr
              ? "Sürtünmesiz doğrudan iletişim için hazır araçlar."
              : "Frictionless direct communication power tools."}
          </p>
        </div>
      </div>

      {/* Counterparty profile snippet with Live Timezone & Availability Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/40">
        <div className="flex items-center gap-4">
          <AvatarInitials name={counterparty.displayName} size="md" />
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={getLocalizedProfilePath(counterparty.handle, locale)}
                className="text-base font-semibold text-[var(--color-text-primary)] hover:text-blue-400 transition-colors"
              >
                {counterparty.displayName}
              </Link>
              <span className="text-xs text-[var(--color-text-tertiary)] font-mono">
                @{counterparty.handle}
              </span>
            </div>
            {counterparty.city && (
              <div className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                📍 {counterparty.city}
              </div>
            )}
          </div>
        </div>

        {/* Live Timezone & Availability Pill */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${resolveTimezonePillClass(
              counterpartyTime
            )}`}
          >
            {counterpartyTime.isNight ? (
              <Moon className="h-3.5 w-3.5 shrink-0 text-purple-400" aria-hidden="true" />
            ) : (
              <Clock className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
            )}
            <span className="font-mono font-bold">{counterpartyTime.timeStr}</span>
            <span className="text-[11px] opacity-75">({counterpartyTime.tz})</span>
            <span className="opacity-40">•</span>
            <span className="font-medium">
              {resolveTimezonePillLabel(counterpartyTime, isTr)}
            </span>
          </div>
        </div>
      </div>

      {/* Instant Handshake Kit (1-Tıkla İletişim & Toplantı Paketi - 7 Kanal) */}
      <div className="rounded-2xl border border-blue-500/25 bg-gradient-to-br from-blue-500/10 via-[var(--color-surface-hover)] to-transparent p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 font-bold text-xs text-blue-400">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>
                {isTr
                  ? "Eşleşme Sonrası 1-Tıkla İletişim & Toplantı Paketi (7 Kanal)"
                  : "Instant 1-Click Communication & Meeting Suite (7 Channels)"}
              </span>
            </div>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">
              {isTr
                ? "Sıfır platform sansürü — doğrudan dilediğiniz kanaldan tek tıkla başlayın"
                : "Zero platform censorship — connect directly via any channel in one click"}
            </p>
          </div>

          {/* Quick Ping Trigger Button */}
          <div className="shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenPingModal}
              disabled={pingCooldown > 0}
              className={`gap-1.5 text-xs font-semibold h-8.5 px-3 rounded-xl cursor-pointer transition-all ${
                pingCooldown > 0
                  ? "opacity-75 bg-zinc-800/60 border-zinc-700 text-zinc-400 cursor-not-allowed"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/60 shadow-sm shadow-amber-500/10"
              }`}
            >
              <Bell
                className={`h-3.5 w-3.5 ${
                  pingCooldown > 0 ? "text-zinc-400" : "text-amber-400 animate-bounce"
                }`}
                aria-hidden="true"
              />
              <span>{getPingButtonLabel(pingCooldown, isTr)}</span>
            </Button>
          </div>
        </div>

        {/* 7 Core Channels Grid with Preferred Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
          {sortedChannels.map((c) => c.node)}
        </div>

        {/* Quick Copy Action Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--color-border-subtle)]/70 text-xs">
          <span className="text-[var(--color-text-secondary)] font-medium mr-1">
            {isTr ? "Hızlı Şablon Kopyala:" : "Quick Copy Templates:"}
          </span>
          <button
            type="button"
            onClick={() => {
              onCopy(decodeURIComponent(waText), "wa");
              alert(isTr ? "WhatsApp taslağı kopyalandı." : "WhatsApp draft copied.");
            }}
            className="px-2.5 py-1 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-1.5 cursor-pointer text-[11px]"
          >
            {copiedField === "wa" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span>WhatsApp / DM Mesajı</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onCopy(zoomInviteText, "zoom");
              alert(isTr ? "Zoom davet şablonu kopyalandı." : "Zoom invite copied.");
            }}
            className="px-2.5 py-1 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-1.5 cursor-pointer text-[11px]"
          >
            {copiedField === "zoom" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span>Zoom Davet Şablonu</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onCopy(slackInviteText, "slack");
              alert(isTr ? "Slack davet şablonu kopyalandı." : "Slack invite copied.");
            }}
            className="px-2.5 py-1 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-1.5 cursor-pointer text-[11px]"
          >
            {copiedField === "slack" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span>Slack Davet Metni</span>
          </button>
        </div>
      </div>

      {/* Contact details grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* Email Channel */}
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">
              {isTr ? "Doğrulanmış E-Posta (Temel İletişim)" : "Verified Email"}
            </span>
            <a
              href={`mailto:${counterparty.email}`}
              className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline break-all transition-colors"
            >
              {counterparty.email}
            </a>
          </div>
          {counterparty.email && counterparty.email !== "—" && (
            <div className="pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onCopy(counterparty.email, "email")}
                className="gap-1.5 text-xs h-8 cursor-pointer"
                aria-label={getCopyAriaLabel(
                  copiedField === "email",
                  "E-posta kopyalandı",
                  "Email copied",
                  "E-postayı kopyala",
                  "Copy email",
                  isTr
                )}
              >
                {copiedField === "email" ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                    <span className="text-emerald-400 font-medium">
                      {isTr ? "Kopyalandı" : "Copied"}
                    </span>
                  </>
                ) : (
                  <>
                    <Copy
                      className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]"
                      aria-hidden="true"
                    />
                    <span>{isTr ? "E-Postayı Kopyala" : "Copy Email"}</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Phone Channel */}
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">
              {isTr ? "Telefon / WhatsApp" : "Phone / Messaging"}
            </span>
            {counterparty.phone ? (
              <a
                href={`tel:${counterparty.phone}`}
                className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline transition-colors"
              >
                {counterparty.phone}
              </a>
            ) : (
              <span className="text-xs text-[var(--color-text-tertiary)] italic">
                {isTr
                  ? "Telefon paylaşımı kullanıcı tarafından etkinleştirilmemiş."
                  : "Phone sharing was disabled by user in settings."}
              </span>
            )}
          </div>
          {counterparty.phone && (
            <div className="pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => counterparty.phone && onCopy(counterparty.phone, "phone")}
                className="gap-1.5 text-xs h-8 cursor-pointer"
                aria-label={getCopyAriaLabel(
                  copiedField === "phone",
                  "Telefon kopyalandı",
                  "Phone copied",
                  "Telefonu kopyala",
                  "Copy phone",
                  isTr
                )}
              >
                {copiedField === "phone" ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                    <span className="text-emerald-400 font-medium">
                      {isTr ? "Kopyalandı" : "Copied"}
                    </span>
                  </>
                ) : (
                  <>
                    <Copy
                      className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]"
                      aria-hidden="true"
                    />
                    <span>{isTr ? "Numarayı Kopyala" : "Copy Phone"}</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
