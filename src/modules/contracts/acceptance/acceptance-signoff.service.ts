/**
 * TBK m. 474 Muayene Süresi ve Sözleşme Kabul Sign-Off Servisi
 *
 * Statutory Compliance:
 * - 6098 Sayılı TBK m. 474 (Ayıp Muayenesi ve İhbar Külfeti)
 * - 6098 Sayılı TBK m. 477 (Eserin Açık veya Zımni Kabulü)
 * - 6100 Sayılı HMK m. 193 (Sözleşmesel Delil Rejimi)
 */

export interface HandoverSignoffInspection {
  status: string;
  sha256Seal?: string | null;
  accessChecklist?: Record<string, boolean> | null;
}

export interface TacitAcceptanceEvaluationInput {
  status: string;
  inspectionExpiresAt: Date;
  hasRevisionRequest: boolean;
  now?: Date;
}

export class AcceptanceSignoffService {
  /**
   * Default inspection window according to TBK m. 474 (7 calendar days).
   */
  static readonly DEFAULT_INSPECTION_WINDOW_DAYS = 7;

  /**
   * Computes the legal inspection deadline starting from deliverable submission.
   */
  static calculateInspectionDeadline(
    submittedAt: Date,
    windowDays: number = AcceptanceSignoffService.DEFAULT_INSPECTION_WINDOW_DAYS
  ): Date {
    const deadline = new Date(submittedAt.getTime());
    deadline.setDate(deadline.getDate() + windowDays);
    return deadline;
  }

  /**
   * Checks whether the statutory inspection deadline has lapsed.
   */
  static isInspectionExpired(inspectionExpiresAt: Date, now: Date = new Date()): boolean {
    return now.getTime() > inspectionExpiresAt.getTime();
  }

  /**
   * Evaluates if tacit (automatic/zımni) acceptance is triggered pursuant to TBK m. 477.
   * If the client does not object within the statutory window, the deliverables are legally deemed accepted.
   */
  static evaluateTacitAcceptance(input: TacitAcceptanceEvaluationInput): {
    isTacitAccepted: boolean;
    reason?: string;
  } {
    const { status, inspectionExpiresAt, hasRevisionRequest, now = new Date() } = input;

    if (status === "ACCEPTED_EXPRESS" || status === "ACCEPTED_TACIT") {
      return {
        isTacitAccepted: true,
        reason: "Teslimat daha önceden kabul edilmiştir.",
      };
    }

    if (hasRevisionRequest) {
      return {
        isTacitAccepted: false,
        reason: "Aktif revizyon talebi bulunduğundan zımni kabul askıya alınmıştır.",
      };
    }

    const isExpired = this.isInspectionExpired(inspectionExpiresAt, now);
    if (isExpired && status === "SUBMITTED") {
      return {
        isTacitAccepted: true,
        reason:
          "TBK m. 477 gereğince yasal 7 günlük muayene süresi içinde itiraz edilmediğinden zımni kabul gerçekleşmiştir.",
      };
    }

    return {
      isTacitAccepted: false,
      reason: "Muayene süresi devam etmektedir.",
    };
  }

  /**
   * Validates handover signoff prerequisites before final contract closure.
   */
  static validateHandoverSignoff(handover: HandoverSignoffInspection): {
    canSignoff: boolean;
    missingRequirements: string[];
  } {
    const missingRequirements: string[] = [];

    if (!handover.sha256Seal || handover.sha256Seal.trim().length === 0) {
      missingRequirements.push("Kriptografik teslimat SHA-256 dijital mührü eksik.");
    }

    if (handover.accessChecklist) {
      const requiredKeys = [
        "dnsTransferred",
        "hostingTransferred",
        "adminAccountsTransferred",
        "apiKeysTransferred",
      ];
      for (const key of requiredKeys) {
        if (handover.accessChecklist[key] !== true) {
          missingRequirements.push(`Altyapı devir maddesi henüz tamamlanmadı: '${key}'.`);
        }
      }
    }

    const canSignoff = missingRequirements.length === 0;

    return {
      canSignoff,
      missingRequirements,
    };
  }
}
