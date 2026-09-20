"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import {
  SecuritySettingsViewProps,
  SecurityFeedback,
  getFeedbackAlertClasses,
} from "./types";
import { PasswordChangeSection } from "./sections/password-change-section";
import { TwoFactorAuthSection } from "./sections/two-factor-auth-section";
import { ActiveSessionsSection } from "./sections/active-sessions-section";
import { DataExportSection } from "./sections/data-export-section";
import { DangerZoneSection } from "./sections/danger-zone-section";

export * from "./types";

export function SecuritySettingsView({ locale, twoFactorEnabled }: SecuritySettingsViewProps) {
  const [feedback, setFeedback] = useState<SecurityFeedback | null>(null);

  return (
    <div className="space-y-8">
      {feedback && (
        <div
          className={`flex items-center gap-3 rounded-2xl border p-4 text-xs ${getFeedbackAlertClasses(
            feedback.type
          )}`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Section 1: Password Change */}
      <PasswordChangeSection locale={locale} onFeedback={setFeedback} />

      {/* Section 2: Two-Factor Authentication (2FA) */}
      <TwoFactorAuthSection
        locale={locale}
        twoFactorEnabled={twoFactorEnabled}
        onFeedback={setFeedback}
      />

      {/* Section 3: Active Sessions & Security Audit */}
      <ActiveSessionsSection locale={locale} />

      {/* Section 4: KVKK & GDPR Data Portability */}
      <DataExportSection locale={locale} onFeedback={setFeedback} />

      {/* Section 5: Danger Zone - Account Deletion */}
      <DangerZoneSection
        locale={locale}
        is2FAEnabled={twoFactorEnabled}
        onFeedback={setFeedback}
      />
    </div>
  );
}
