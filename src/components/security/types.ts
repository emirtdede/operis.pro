export interface SecuritySettingsViewProps {
  locale: string;
  twoFactorEnabled: boolean;
}

export interface ExportJobState {
  jobId: string;
  status: "QUEUED" | "PENDING" | "PROCESSING" | "READY" | "FAILED" | "EXPIRED";
  progressPercent: number;
  downloadUrl?: string;
  fileSizeBytes?: number;
  sha256Checksum?: string;
}

export interface SecurityFeedback {
  type: "success" | "error" | "warning";
  message: string;
}

export function getErrorMessage(err: unknown, defaultMessage: string): string {
  if (err instanceof Error) return err.message;
  return defaultMessage;
}

export function getExportInitiatedMessage(alreadyRunning: boolean, isTr: boolean): string {
  if (alreadyRunning) {
    return isTr
      ? "Mevcut veri aktarım görevi takip ediliyor..."
      : "Tracking existing active export job...";
  }
  return isTr
    ? "Veri aktarım görevi sıraya alındı. Hazırlandığında otomatik indirilecektir."
    : "Data export job queued. It will download automatically once ready.";
}

export function getFeedbackAlertClasses(type: string): string {
  if (type === "success") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
  if (type === "warning") return "border-amber-500/30 bg-amber-500/10 text-amber-400";
  return "border-red-500/20 bg-red-500/10 text-red-400";
}

export function get2FABadgeLabel(enabled: boolean, isTr: boolean): string {
  if (enabled) return isTr ? "AKTİF" : "ENABLED";
  return isTr ? "DEVRE DIŞI" : "DISABLED";
}

export function get2FAButtonLabel(enabled: boolean, isTr: boolean): string {
  if (enabled) return isTr ? "Devre Dışı Bırak" : "Disable 2FA";
  return isTr ? "2FA Kur & Etkinleştir" : "Setup 2FA";
}

export function getExportJobStatusMessage(status: string, progressPercent: number, isTr: boolean): string {
  if (status === "QUEUED" || status === "PENDING") {
    return isTr ? "Dışa aktarım sıraya alındı..." : "Export queued...";
  }
  if (status === "PROCESSING") {
    return isTr ? `Veriler hazırlanıyor (%${progressPercent})...` : `Preparing data (${progressPercent}%)...`;
  }
  if (status === "READY") {
    return isTr ? "Veri aktarımı tamamlandı ve hazır." : "Data export ready.";
  }
  if (status === "EXPIRED") {
    return isTr ? "Dosya süresi doldu." : "Export expired.";
  }
  return isTr ? "Dışa aktarım başarısız oldu." : "Export failed.";
}

export function getExportChecksumLabel(checksum: string | undefined, isTr: boolean): string {
  if (checksum) return `${checksum.slice(0, 16)}...`;
  return isTr ? "Doğrulandı" : "Verified";
}
