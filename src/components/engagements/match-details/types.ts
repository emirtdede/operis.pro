
export interface CounterpartyInfo {
  userId: string;
  displayName: string;
  handle: string;
  email: string;
  phone: string | null;
  preferredContactChannel?: string | null;
  timeZone?: string | null;
  city?: string | null;
}

export interface CurrentUserInfo {
  displayName?: string;
  email?: string;
}

export interface EndorsementItem {
  id: string;
  authorUserId: string;
  recipientUserId: string;
  content: string;
  projectTitleSnapshot?: string;
  createdAt: Date | string;
  authorDisplayName?: string;
}

export interface MatchDetailsViewProps {
  engagementId: string;
  listingTitle: string;
  category: string;
  matchedAt: string | Date;
  status: string;
  offerMessage: string;
  budgetLabel: string | null;
  timelineLabel: string | null;
  counterparty: CounterpartyInfo;
  currentUser?: CurrentUserInfo;
  currentUserId: string;
  ownerUserId: string;
  isCompleted: boolean;
  userCompletionStatus?: string | null;
  counterpartyCompletionStatus?: string | null;
  initialEndorsements?: EndorsementItem[];
  locale: string;
}

export interface CounterpartyLocalTimeInfo {
  tz: string;
  timeStr: string;
  hourNum: number;
  isNight: boolean;
  isBusiness: boolean;
}

export function getCounterpartyLocalTime(
  timeZone?: string | null,
  locale = "tr"
): CounterpartyLocalTimeInfo {
  const tz = timeZone || "Europe/Istanbul";
  try {
    const now = new Date();
    const timeStr = new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now);

    const hourNum = parseInt(
      new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "numeric",
        hour12: false,
      }).format(now),
      10
    );

    const isNight = hourNum >= 22 || hourNum < 8;
    const isBusiness = hourNum >= 9 && hourNum < 19;

    return {
      tz,
      timeStr,
      hourNum,
      isNight,
      isBusiness,
    };
  } catch {
    return {
      tz: "Europe/Istanbul",
      timeStr: "--:--",
      hourNum: 12,
      isNight: false,
      isBusiness: true,
    };
  }
}

const STATUS_BADGE_VARIANTS: Record<string, "primary" | "secondary" | "outline"> = {
  COMPLETION_PENDING: "secondary",
  CANCELLED: "outline",
  DISPUTED: "outline",
};

export function resolveStatusBadgeVariant(
  completed: boolean,
  currentStatus: string
): "primary" | "secondary" | "outline" {
  if (completed) return "primary";
  return STATUS_BADGE_VARIANTS[currentStatus] ?? "outline";
}

export function resolveStatusBadgeLabel(
  completed: boolean,
  currentStatus: string,
  isTr: boolean
): string {
  if (completed) return isTr ? "Tamamlandı" : "Completed";
  if (currentStatus === "CANCELLED") return isTr ? "İptal Edildi" : "Cancelled";
  if (currentStatus === "DISPUTED") return isTr ? "Uyuşmazlık Bildirildi" : "Disputed";
  if (currentStatus === "COMPLETION_PENDING") return isTr ? "Onay Bekleniyor" : "Completion Pending";
  return isTr ? "Eşleşti / Aktif" : "Matched";
}

export function resolveTimezonePillClass(counterpartyTime: {
  isNight: boolean;
  isBusiness: boolean;
}): string {
  if (counterpartyTime.isNight) return "border-purple-500/30 bg-purple-500/10 text-purple-300";
  if (counterpartyTime.isBusiness) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  return "border-amber-500/30 bg-amber-500/10 text-amber-300";
}

export function resolveTimezonePillLabel(
  counterpartyTime: { isNight: boolean; isBusiness: boolean },
  isTr: boolean
): string {
  if (counterpartyTime.isNight) return isTr ? "Gece / Mesai Dışı" : "Night / Off-Hours";
  if (counterpartyTime.isBusiness) return isTr ? "Aktif Çalışma Saatleri" : "Active Hours";
  return isTr ? "Akşam Saatleri" : "Evening Hours";
}

export function getPingButtonLabel(pingCooldown: number, isTr: boolean): string {
  if (pingCooldown > 0) {
    const mins = Math.floor(pingCooldown / 60);
    const secs = (pingCooldown % 60).toString().padStart(2, "0");
    const prefix = isTr ? "Dürtme Beklemede" : "Ping Cooldown";
    return `${prefix} (${mins}:${secs})`;
  }
  return isTr ? "Hafif Dürtme Gönder" : "Send Quick Ping";
}

export function getCopyFieldLabel(
  isCopied: boolean,
  defaultTr: string,
  defaultEn: string,
  isTr: boolean
): string {
  if (isCopied) return isTr ? "Kopyalandı!" : "Copied!";
  return isTr ? defaultTr : defaultEn;
}

export function getCopyAriaLabel(
  isCopied: boolean,
  copiedTr: string,
  copiedEn: string,
  copyTr: string,
  copyEn: string,
  isTr: boolean
): string {
  if (isCopied) return isTr ? copiedTr : copiedEn;
  return isTr ? copyTr : copyEn;
}

export function getEndorseButtonLabel(isSubmitting: boolean, isTr: boolean): string {
  if (isSubmitting) return isTr ? "Kaydediliyor..." : "Submitting...";
  return isTr ? "Doğrulanmış Tavsiye Notunu Yayınla" : "Publish Verified Vouch";
}

export function getCancelButtonLabel(isCancelling: boolean, isTr: boolean): string {
  if (isCancelling) return isTr ? "İptal Ediliyor..." : "Cancelling...";
  return isTr ? "Evet, İptal Et" : "Confirm Cancellation";
}

export function getSendPingButtonLabel(isPinging: boolean, isTr: boolean): string {
  if (isPinging) return isTr ? "İletiliyor..." : "Sending...";
  return isTr ? "Dürtme Bildirimini Gönder" : "Send Ping Notification";
}


