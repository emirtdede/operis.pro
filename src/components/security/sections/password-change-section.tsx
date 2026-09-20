"use client";

import { useState, type FormEvent } from "react";
import { Lock, KeyRound } from "lucide-react";
import { Button } from "../../ui/button";
import { TextInput } from "../../ui/text-input";
import { SecurityFeedback, getErrorMessage } from "../types";

export interface PasswordChangeSectionProps {
  locale: string;
  onFeedback: (feedback: SecurityFeedback) => void;
}

export function PasswordChangeSection({ locale, onFeedback }: PasswordChangeSectionProps) {
  const isTr = locale === "tr";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      onFeedback({
        type: "error",
        message: isTr ? "Yeni şifreler eşleşmiyor." : "New passwords do not match.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({ currentPassword, newPassword, locale }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error || (isTr ? "Şifre değiştirilemedi." : "Failed to change password.");
        throw new Error(errorMsg);
      }

      onFeedback({
        type: "success",
        message: isTr ? "Şifreniz başarıyla değiştirildi." : "Password successfully updated.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      onFeedback({
        type: "error",
        message: getErrorMessage(err, isTr ? "İşlem başarısız oldu." : "Operation failed."),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handlePasswordChange}
      className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-6 sm:p-7 space-y-4 shadow-sm"
    >
      <h2 className="text-base font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
        <Lock className="h-4 w-4 text-blue-400" aria-hidden="true" />
        <span>{isTr ? "Şifre Değiştir" : "Change Password"}</span>
      </h2>

      <div className="space-y-3 max-w-md">
        <TextInput
          label={isTr ? "Mevcut Şifreniz" : "Current Password"}
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          startIcon={<KeyRound className="h-4 w-4" aria-hidden="true" />}
        />

        <TextInput
          label={isTr ? "Yeni Şifre" : "New Password"}
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          startIcon={<Lock className="h-4 w-4" aria-hidden="true" />}
        />

        <TextInput
          label={isTr ? "Yeni Şifre (Tekrar)" : "Confirm New Password"}
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          startIcon={<Lock className="h-4 w-4" aria-hidden="true" />}
        />
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="md"
          className="font-semibold text-xs px-6"
          isLoading={isLoading}
        >
          {isTr ? "Şifreyi Güncelle" : "Update Password"}
        </Button>
      </div>
    </form>
  );
}
