"use client";

import { useReducer, useEffect, type FormEvent } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import {
  ProfileLinkItem,
  ProfileFormState,
  profileFormReducer,
} from "./settings/profile-form-reducer";
import { ProfileSettingsFormProps, getLinkTypes } from "./settings/types";
import { ProfileGeneralTab } from "./settings/profile-general-tab";
import { ProfileSecurityVerificationsTab } from "./settings/profile-security-verifications-tab";
import { ProfilePreferencesTab } from "./settings/profile-preferences-tab";
import { ProfileLinksTab } from "./settings/profile-links-tab";
import { PhoneChangeModal } from "./settings/phone-change-modal";

export type { ProfileLinkItem } from "./settings/profile-form-reducer";
export type { ProfileSettingsFormProps } from "./settings/types";

export function ProfileSettingsForm({ initialProfile, locale }: ProfileSettingsFormProps) {
  const isTr = locale === "tr";
  const linkTypes = getLinkTypes(isTr);

  const initialFormState: ProfileFormState = {
    displayName: initialProfile.displayName || "",
    handle: initialProfile.handle || "",
    about: initialProfile.about || "",
    avatarUrl: initialProfile.avatarUrl || "",
    avatarPreviewError: false,
    showLocation: initialProfile.showLocation ?? false,
    revealPhoneAfterMatch: initialProfile.revealPhoneAfterMatch ?? false,
    preferredContactChannel: initialProfile.preferredContactChannel || "any",
    timeZone: initialProfile.timeZone || "Europe/Istanbul",
    links: initialProfile.links || [],
    newLinkType: "github",
    newLinkLabel: "",
    newLinkUrl: "",
    marketingConsent: false,
    loadingMarketingConsent: true,
    isUpdatingConsent: false,
    phoneVerified: initialProfile.phoneVerified ?? false,
    showPhoneModal: false,
    showPhoneChangeModal: false,
    newPhone: "",
    phoneChangeStep: 1,
    phoneChangeOtp: "",
    isPhoneChanging: false,
    phoneChangeError: null,
    phoneChangeSuccess: null,
    phoneChallengeId: null,
    phoneChangeChallengeId: null,
    otpCode: "",
    isSubmittingOtp: false,
    isResendingEmail: false,
    isResendingPhone: false,
    cooldownSeconds: 0,
    verificationFeedback: null,
    isLoading: false,
    feedback: null,
  };

  const [state, dispatch] = useReducer(profileFormReducer, initialFormState);

  // Timezone auto-detect if not set
  useEffect(() => {
    if (!initialProfile.timeZone) {
      try {
        const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (detected) {
          dispatch({ type: "SET_FIELD", field: "timeZone", value: detected });
        }
      } catch {
        // Fallback default is used
      }
    }
  }, [initialProfile.timeZone]);

  // Marketing consent load
  useEffect(() => {
    let isMounted = true;
    fetch("/api/profile/marketing-consent")
      .then((r) => r.json())
      .then((data) => {
        if (isMounted && data?.consent) {
          dispatch({
            type: "SET_FIELD",
            field: "marketingConsent",
            value: Boolean(data.consent.hasConsent),
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) {
          dispatch({ type: "SET_FIELD", field: "loadingMarketingConsent", value: false });
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (state.cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      dispatch({ type: "DECREMENT_COOLDOWN" });
    }, 1000);
    return () => clearInterval(timer);
  }, [state.cooldownSeconds]);

  // Phone modal challenge fetch
  useEffect(() => {
    if (state.showPhoneModal && !state.phoneChallengeId && !state.phoneVerified) {
      fetch("/api/account/phone/challenge?purpose=INITIAL_VERIFICATION")
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.challengeId) {
            dispatch({ type: "SET_FIELD", field: "phoneChallengeId", value: data.challengeId });
            if (data.secondsRemaining && data.secondsRemaining > 0) {
              dispatch({
                type: "SET_FIELD",
                field: "cooldownSeconds",
                value: Math.min(60, data.secondsRemaining),
              });
            }
          }
        })
        .catch(() => {});
    }
  }, [state.showPhoneModal, state.phoneChallengeId, state.phoneVerified]);

  // Reset avatar preview error on URL change
  useEffect(() => {
    dispatch({ type: "SET_FIELD", field: "avatarPreviewError", value: false });
  }, [state.avatarUrl]);

  const handleMarketingConsentChange = async (checked: boolean) => {
    dispatch({ type: "SET_FIELD", field: "marketingConsent", value: checked });
    dispatch({ type: "SET_FIELD", field: "isUpdatingConsent", value: true });
    try {
      const res = await fetch("/api/profile/marketing-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-locale": locale },
        body: JSON.stringify({ consent: checked }),
      });
      if (!res.ok) {
        dispatch({ type: "SET_FIELD", field: "marketingConsent", value: !checked });
      }
    } catch {
      dispatch({ type: "SET_FIELD", field: "marketingConsent", value: !checked });
    } finally {
      dispatch({ type: "SET_FIELD", field: "isUpdatingConsent", value: false });
    }
  };

  const handleResendEmail = async () => {
    if (state.cooldownSeconds > 0 || state.isResendingEmail) return;
    dispatch({ type: "SET_FIELD", field: "isResendingEmail", value: true });
    dispatch({ type: "SET_VERIFICATION_FEEDBACK", feedback: null });
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-locale": locale },
        body: JSON.stringify({ type: "email", locale }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isTr ? "E-posta gönderilemedi." : "Failed to send email."));
      }
      dispatch({
        type: "SET_VERIFICATION_FEEDBACK",
        feedback: { type: "success", message: data.message },
      });
      dispatch({ type: "SET_FIELD", field: "cooldownSeconds", value: 60 });
    } catch (err: unknown) {
      let errMsg = isTr ? "E-posta gönderilemedi." : "Failed to send email.";
      if (err instanceof Error) {
        errMsg = err.message;
      }
      dispatch({
        type: "SET_VERIFICATION_FEEDBACK",
        feedback: { type: "error", message: errMsg },
      });
    } finally {
      dispatch({ type: "SET_FIELD", field: "isResendingEmail", value: false });
    }
  };

  const handleResendPhone = async () => {
    if (state.cooldownSeconds > 0 || state.isResendingPhone) return;
    dispatch({ type: "SET_FIELD", field: "isResendingPhone", value: true });
    dispatch({ type: "SET_VERIFICATION_FEEDBACK", feedback: null });
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-locale": locale },
        body: JSON.stringify({ type: "phone", locale }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isTr ? "SMS gönderilemedi." : "Failed to send SMS."));
      }
      if (data.challengeId) {
        dispatch({ type: "SET_FIELD", field: "phoneChallengeId", value: data.challengeId });
      }
      dispatch({
        type: "SET_VERIFICATION_FEEDBACK",
        feedback: { type: "success", message: data.message },
      });
      dispatch({ type: "SET_FIELD", field: "cooldownSeconds", value: 60 });
    } catch (err: unknown) {
      let errMsg = isTr ? "SMS gönderilemedi." : "Failed to send SMS.";
      if (err instanceof Error) {
        errMsg = err.message;
      }
      dispatch({
        type: "SET_VERIFICATION_FEEDBACK",
        feedback: { type: "error", message: errMsg },
      });
    } finally {
      dispatch({ type: "SET_FIELD", field: "isResendingPhone", value: false });
    }
  };

  const handleVerifyPhone = async (e: FormEvent) => {
    e.preventDefault();
    if (state.otpCode.trim().length !== 6 || state.isSubmittingOtp) return;
    if (!state.phoneChallengeId) {
      dispatch({
        type: "SET_VERIFICATION_FEEDBACK",
        feedback: {
          type: "error",
          message: isTr
            ? "Doğrulama oturumu bulunamadı. Lütfen 'Kodu Tekrar Gönder' butonuna basarak yeni kod isteyiniz."
            : "Verification challenge not found. Please request a new code first.",
        },
      });
      return;
    }
    dispatch({ type: "SET_FIELD", field: "isSubmittingOtp", value: true });
    dispatch({ type: "SET_VERIFICATION_FEEDBACK", feedback: null });
    try {
      const res = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-locale": locale },
        body: JSON.stringify({
          code: state.otpCode.trim(),
          locale,
          challengeId: state.phoneChallengeId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isTr ? "Kod doğrulanamadı." : "Verification failed."));
      }
      dispatch({ type: "SET_FIELD", field: "phoneVerified", value: true });
      dispatch({ type: "SET_FIELD", field: "showPhoneModal", value: false });
      dispatch({ type: "SET_FIELD", field: "otpCode", value: "" });
      dispatch({
        type: "SET_VERIFICATION_FEEDBACK",
        feedback: { type: "success", message: data.message },
      });
    } catch (err: unknown) {
      let errMsg = isTr ? "Kod doğrulanamadı." : "Verification failed.";
      if (err instanceof Error) {
        errMsg = err.message;
      }
      dispatch({
        type: "SET_VERIFICATION_FEEDBACK",
        feedback: { type: "error", message: errMsg },
      });
    } finally {
      dispatch({ type: "SET_FIELD", field: "isSubmittingOtp", value: false });
    }
  };

  const handleRequestPhoneChange = async (e: FormEvent) => {
    e.preventDefault();
    if (!state.newPhone.trim() || state.isPhoneChanging) return;
    dispatch({ type: "SET_FIELD", field: "isPhoneChanging", value: true });
    dispatch({ type: "SET_FIELD", field: "phoneChangeError", value: null });

    try {
      const res = await fetch("/api/account/phone/request-change", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-locale": locale },
        body: JSON.stringify({ phone: state.newPhone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || (isTr ? "SMS kodu gönderilemedi." : "Failed to send SMS code.")
        );
      }
      if (data.challengeId) {
        dispatch({ type: "SET_FIELD", field: "phoneChangeChallengeId", value: data.challengeId });
      }
      dispatch({ type: "SET_FIELD", field: "phoneChangeStep", value: 2 });
      dispatch({ type: "SET_FIELD", field: "phoneChangeError", value: null });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "İşlem başarısız oldu.";
      dispatch({ type: "SET_FIELD", field: "phoneChangeError", value: errMsg });
    } finally {
      dispatch({ type: "SET_FIELD", field: "isPhoneChanging", value: false });
    }
  };

  const handleVerifyPhoneChange = async (e: FormEvent) => {
    e.preventDefault();
    if (!state.phoneChangeOtp.trim() || state.isPhoneChanging) return;
    if (!state.phoneChangeChallengeId) {
      dispatch({
        type: "SET_FIELD",
        field: "phoneChangeError",
        value: isTr
          ? "Doğrulama oturumu bulunamadı. Lütfen önce SMS kodu talep ediniz."
          : "Verification challenge not found. Please request an SMS code first.",
      });
      return;
    }
    dispatch({ type: "SET_FIELD", field: "isPhoneChanging", value: true });
    dispatch({ type: "SET_FIELD", field: "phoneChangeError", value: null });

    try {
      const res = await fetch("/api/account/phone/verify-change", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-locale": locale },
        body: JSON.stringify({
          phone: state.newPhone.trim(),
          code: state.phoneChangeOtp.trim(),
          challengeId: state.phoneChangeChallengeId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || (isTr ? "Doğrulama başarısız oldu." : "Verification failed.")
        );
      }
      dispatch({ type: "SET_FIELD", field: "phoneVerified", value: true });
      dispatch({
        type: "SET_FIELD",
        field: "phoneChangeSuccess",
        value: data.message || (isTr ? "Telefon numaranız güncellendi." : "Phone number updated."),
      });
      setTimeout(() => {
        dispatch({ type: "RESET_PHONE_CHANGE_MODAL" });
      }, 2000);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Doğrulama başarısız oldu.";
      dispatch({ type: "SET_FIELD", field: "phoneChangeError", value: errMsg });
    } finally {
      dispatch({ type: "SET_FIELD", field: "isPhoneChanging", value: false });
    }
  };

  const handleAddLink = () => {
    if (!state.newLinkUrl.trim()) return;
    const defaultLabel =
      linkTypes.find((t) => t.value === state.newLinkType)?.label || (isTr ? "Bağlantı" : "Link");
    const item: ProfileLinkItem = {
      type: state.newLinkType,
      label: state.newLinkLabel.trim() || defaultLabel,
      url: state.newLinkUrl.trim().startsWith("http")
        ? state.newLinkUrl.trim()
        : `https://${state.newLinkUrl.trim()}`,
    };

    dispatch({ type: "ADD_LINK", link: item });
  };

  const handleRemoveLink = (index: number) => {
    dispatch({ type: "REMOVE_LINK", index });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    dispatch({ type: "SET_FIELD", field: "isLoading", value: true });
    dispatch({ type: "SET_FEEDBACK", feedback: null });

    try {
      // 1. Update Profile Information
      const resProfile = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({
          displayName: state.displayName.trim(),
          handle: state.handle.trim(),
          about: state.about.trim() || null,
          avatarUrl: state.avatarUrl.trim() || null,
          showLocation: state.showLocation,
          revealPhoneAfterMatch: state.revealPhoneAfterMatch,
          preferredContactChannel: state.preferredContactChannel,
          timeZone: state.timeZone,
          locale,
        }),
      });

      const dataProfile = await resProfile.json();
      if (!resProfile.ok) {
        throw new Error(
          dataProfile.error || (isTr ? "Profil güncellenemedi." : "Failed to update profile.")
        );
      }

      // 2. Update Links
      const resLinks = await fetch("/api/profile/links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({ links: state.links, locale }),
      });

      const dataLinks = await resLinks.json();
      if (!resLinks.ok) {
        const linksError = dataLinks.error || (isTr ? "Bağlantılar güncellenemedi." : "Failed to update links.");
        const partialSuccess = isTr
          ? " (Ancak profil bilgileriniz kaydedildi)"
          : " (However, profile details were saved)";
        throw new Error(linksError + partialSuccess);
      }

      dispatch({
        type: "SET_FEEDBACK",
        feedback: {
          type: "success",
          message: isTr
            ? "Profiliniz ve bağlantılarınız başarıyla güncellendi!"
            : "Profile and links successfully saved!",
        },
      });
    } catch (err: unknown) {
      let errMsg = isTr ? "Güncelleme başarısız oldu." : "Update failed.";
      if (err instanceof Error) {
        errMsg = err.message;
      }
      dispatch({
        type: "SET_FEEDBACK",
        feedback: { type: "error", message: errMsg },
      });
    } finally {
      dispatch({ type: "SET_FIELD", field: "isLoading", value: false });
    }
  };

  const feedbackClasses =
    state.feedback?.type === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
      : "border-red-500/20 bg-red-500/10 text-red-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {state.feedback && (
        <div className={`flex items-center gap-3 rounded-2xl border p-4 text-xs ${feedbackClasses}`}>
          {state.feedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          )}
          <span>{state.feedback.message}</span>
        </div>
      )}

      {/* Section 1: Basic Profile Info */}
      <ProfileGeneralTab
        displayName={state.displayName}
        handle={state.handle}
        about={state.about}
        avatarUrl={state.avatarUrl}
        avatarPreviewError={state.avatarPreviewError}
        locale={locale}
        onDisplayNameChange={(val) => dispatch({ type: "SET_FIELD", field: "displayName", value: val })}
        onHandleChange={(val) => dispatch({ type: "SET_FIELD", field: "handle", value: val })}
        onAboutChange={(val) => dispatch({ type: "SET_FIELD", field: "about", value: val })}
        onAvatarUrlChange={(val) => dispatch({ type: "SET_FIELD", field: "avatarUrl", value: val })}
        onAvatarPreviewError={(val) => dispatch({ type: "SET_FIELD", field: "avatarPreviewError", value: val })}
      />

      {/* Section 2: Account and Security Verifications */}
      <ProfileSecurityVerificationsTab
        email={initialProfile.email}
        emailVerified={initialProfile.emailVerified ?? false}
        phoneVerified={state.phoneVerified}
        locale={locale}
        cooldownSeconds={state.cooldownSeconds}
        isResendingEmail={state.isResendingEmail}
        isResendingPhone={state.isResendingPhone}
        verificationFeedback={state.verificationFeedback}
        showPhoneModal={state.showPhoneModal}
        otpCode={state.otpCode}
        isSubmittingOtp={state.isSubmittingOtp}
        companyVerificationData={{
          isCompanyVerified: initialProfile.isCompanyVerified,
          companyName: initialProfile.companyName,
          companyType: initialProfile.companyType,
          taxOffice: initialProfile.taxOffice,
          vknMasked: initialProfile.vknMasked,
          companyVerifiedAt: initialProfile.companyVerifiedAt,
        }}
        onResendEmail={handleResendEmail}
        onResendPhone={handleResendPhone}
        onOpenPhoneModal={() => {
          dispatch({ type: "SET_FIELD", field: "showPhoneModal", value: true });
          if (state.cooldownSeconds === 0) {
            handleResendPhone();
          }
        }}
        onClosePhoneModal={() => dispatch({ type: "SET_FIELD", field: "showPhoneModal", value: false })}
        onOpenPhoneChangeModal={() => {
          dispatch({ type: "SET_FIELD", field: "showPhoneChangeModal", value: true });
          dispatch({ type: "SET_FIELD", field: "phoneChangeStep", value: 1 });
          dispatch({ type: "SET_FIELD", field: "phoneChangeError", value: null });
          dispatch({ type: "SET_FIELD", field: "phoneChangeSuccess", value: null });
        }}
        onOtpCodeChange={(val) => dispatch({ type: "SET_FIELD", field: "otpCode", value: val })}
        onVerifyPhone={handleVerifyPhone}
      />

      {/* Section 3: Privacy & Contact Preferences */}
      <ProfilePreferencesTab
        showLocation={state.showLocation}
        revealPhoneAfterMatch={state.revealPhoneAfterMatch}
        marketingConsent={state.marketingConsent}
        loadingMarketingConsent={state.loadingMarketingConsent}
        isUpdatingConsent={state.isUpdatingConsent}
        preferredContactChannel={state.preferredContactChannel}
        timeZone={state.timeZone}
        locale={locale}
        onShowLocationChange={(val) => dispatch({ type: "SET_FIELD", field: "showLocation", value: val })}
        onRevealPhoneChange={(val) => dispatch({ type: "SET_FIELD", field: "revealPhoneAfterMatch", value: val })}
        onMarketingConsentChange={handleMarketingConsentChange}
        onPreferredContactChannelChange={(val) => dispatch({ type: "SET_FIELD", field: "preferredContactChannel", value: val })}
        onTimeZoneChange={(val) => dispatch({ type: "SET_FIELD", field: "timeZone", value: val })}
      />

      {/* Section 4: Social & Portfolio Links */}
      <ProfileLinksTab
        links={state.links}
        newLinkType={state.newLinkType}
        newLinkLabel={state.newLinkLabel}
        newLinkUrl={state.newLinkUrl}
        locale={locale}
        onNewLinkTypeChange={(val) => dispatch({ type: "SET_FIELD", field: "newLinkType", value: val })}
        onNewLinkLabelChange={(val) => dispatch({ type: "SET_FIELD", field: "newLinkLabel", value: val })}
        onNewLinkUrlChange={(val) => dispatch({ type: "SET_FIELD", field: "newLinkUrl", value: val })}
        onAddLink={handleAddLink}
        onRemoveLink={handleRemoveLink}
      />

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="font-semibold text-sm px-8"
          isLoading={state.isLoading}
        >
          {isTr ? "Değişiklikleri Kaydet" : "Save Changes"}
        </Button>
      </div>

      {/* Phone Change Modal Dialog */}
      <PhoneChangeModal
        isOpen={state.showPhoneChangeModal}
        locale={locale}
        phoneChangeStep={state.phoneChangeStep}
        newPhone={state.newPhone}
        phoneChangeOtp={state.phoneChangeOtp}
        isPhoneChanging={state.isPhoneChanging}
        phoneChangeError={state.phoneChangeError}
        phoneChangeSuccess={state.phoneChangeSuccess}
        onClose={() => dispatch({ type: "SET_FIELD", field: "showPhoneChangeModal", value: false })}
        onNewPhoneChange={(val) => dispatch({ type: "SET_FIELD", field: "newPhone", value: val })}
        onPhoneChangeOtpChange={(val) => dispatch({ type: "SET_FIELD", field: "phoneChangeOtp", value: val })}
        onStepChange={(step) => dispatch({ type: "SET_FIELD", field: "phoneChangeStep", value: step })}
        onRequestPhoneChange={handleRequestPhoneChange}
        onVerifyPhoneChange={handleVerifyPhoneChange}
      />
    </form>
  );
}
