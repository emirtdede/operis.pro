export type AvailabilityStatus =
  | "AVAILABLE_NOW"
  | "FULL_TIME"
  | "PARTIALLY_AVAILABLE"
  | "PROJECT_BASED"
  | "ADVISORY"
  | "VOLUNTEER"
  | "INTERNSHIP"
  | "BUSY";

export interface DynamicAvailabilityResult {
  effectiveStatus: AvailabilityStatus;
  hoursPerWeek: number;
  availableFromDate: string | null;
  notice: string | null;
  updatedAt: Date;
  isStale: boolean;
}

export function resolveDynamicAvailability(params: {
  status?: string | null;
  hoursPerWeek?: number | null;
  availableFromDate?: string | Date | null;
  notice?: string | null;
  updatedAt?: Date | null;
}): DynamicAvailabilityResult {
  const rawStatus = (params.status || "AVAILABLE_NOW") as AvailabilityStatus;
  const hours = typeof params.hoursPerWeek === "number" ? params.hoursPerWeek : 40;
  const updatedAt = params.updatedAt instanceof Date ? params.updatedAt : new Date();

  let fromDateStr: string | null = null;
  let fromDateObj: Date | null = null;
  if (params.availableFromDate) {
    if (params.availableFromDate instanceof Date) {
      fromDateObj = params.availableFromDate;
      fromDateStr = params.availableFromDate.toISOString().slice(0, 10);
    } else if (typeof params.availableFromDate === "string") {
      fromDateStr = params.availableFromDate;
      fromDateObj = new Date(params.availableFromDate);
    }
  }

  // Time-decay auto-transition:
  // If user set BUSY until a specific date and that date has now passed, auto-elevate to AVAILABLE_NOW
  let effectiveStatus: AvailabilityStatus = rawStatus;
  if (rawStatus === "BUSY" && fromDateObj && !isNaN(fromDateObj.getTime())) {
    const checkDate = new Date(fromDateObj);
    checkDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkDate.getTime() <= today.getTime()) {
      effectiveStatus = "AVAILABLE_NOW";
    }
  }

  // Stale check: if not updated for > 45 days
  const fortyFiveDaysMs = 45 * 24 * 60 * 60 * 1000;
  const isStale = Date.now() - updatedAt.getTime() > fortyFiveDaysMs;

  return {
    effectiveStatus,
    hoursPerWeek: hours,
    availableFromDate: fromDateStr,
    notice: params.notice?.trim() || null,
    updatedAt,
    isStale,
  };
}
