"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User,
  AtSign,
  Mail,
  Phone,
  MapPin,
  Lock,
  ShieldAlert,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "../ui/button";
import { TextInput } from "../ui/text-input";
import { Checkbox } from "../ui/checkbox";
import { DatePicker } from "../ui/date-picker";
import { LegalModal } from "../ui/legal-modal";
import { SocialLoginButtons } from "./social-login-buttons";
import { TurnstileWidget } from "../security/turnstile-widget";

export interface RegisterFormProps {
  locale: string;
  returnUrl?: string;
}

export function RegisterForm({ locale, returnUrl }: RegisterFormProps) {
  const isTr = locale === "tr";

  // Form Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [cityOfResidence, setCityOfResidence] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Legal Consents
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  const [matchingAcknowledged, setMatchingAcknowledged] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  // Legal Modal State
  const [activeLegalDoc, setActiveLegalDoc] = useState<string | null>(null);

  const handleLegalAccept = (docKey: string) => {
    if (docKey === "terms") setTermsAccepted(true);
    if (docKey === "privacy") setPrivacyAcknowledged(true);
    if (docKey === "matching-disclaimer") setMatchingAcknowledged(true);
  };

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Frontend validation
    if (password !== confirmPassword) {
      setError(isTr ? "Şifreler eşleşmiyor." : "Passwords do not match.");
      return;
    }

    if (password.length < 12) {
      setError(
        isTr
          ? "Şifre en az 12 karakter olmalıdır."
          : "Password must be at least 12 characters long."
      );
      return;
    }

    // 18+ Age validation
    if (!dateOfBirth) {
      setError(isTr ? "Doğum tarihinizi girmelisiniz." : "Please provide your date of birth.");
      return;
    }
    const dob = new Date(dateOfBirth);
    const today = new Date();
    const age =
      today.getFullYear() -
      dob.getFullYear() -
      (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);

    if (age < 18) {
      setError(
        isTr
          ? "Platformu kullanabilmek için en az 18 yaşında olmalısınız."
          : "You must be at least 18 years old to use the platform."
      );
      return;
    }

    if (!termsAccepted || !privacyAcknowledged || !matchingAcknowledged || !ageConfirmed) {
      setError(
        isTr
          ? "Devam etmek için tüm yasal onay kutularını işaretlemelisiniz."
          : "You must accept all legal acknowledgements to proceed."
      );
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({
          legalFirstName: firstName.trim(),
          legalLastName: lastName.trim(),
          handle: handle.trim().toLowerCase(),
          displayName: displayName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          dateOfBirth,
          city: cityOfResidence.trim(),
          countryCode: "TR",
          password,
          confirmPassword,
          termsAccepted,
          privacyAcknowledged,
          matchingAcknowledged,
          ageConfirmed,
          marketingConsent,
          turnstileToken,
          focusCategoryKeys: ["web-development", "frontend-ui"],
          locale: isTr ? "tr" : "en",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || (isTr ? "Kayıt işlemi başarısız oldu" : "Registration failed")
        );
      }

      setSuccess(true);
    } catch (err: unknown) {
      const defaultErrMsg = isTr
        ? "Kayıt işlemi gerçekleştirilemedi. Lütfen bilgilerinizi kontrol edin."
        : "Registration failed. Please check your information.";
      setError(err instanceof Error ? err.message : defaultErrMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const loginBasePath = isTr ? "/tr/giris" : "/en/login";
  const successLoginHref = returnUrl
    ? `${loginBasePath}?returnUrl=${encodeURIComponent(returnUrl)}`
    : loginBasePath;

  let passwordToggleLabel = isTr ? "Şifreyi göster" : "Show password";
  if (showPassword) {
    passwordToggleLabel = isTr ? "Şifreyi gizle" : "Hide password";
  }

  let confirmPasswordToggleLabel = isTr ? "Şifre tekrarını göster" : "Show password confirmation";
  if (showConfirmPassword) {
    confirmPasswordToggleLabel = isTr ? "Şifre tekrarını gizle" : "Hide password confirmation";
  }

  if (success) {
    return (
      <div className="space-y-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-8 sm:p-10 text-center backdrop-blur-xl">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">
          {isTr ? "Kaydınız Başarıyla Alındı" : "Registration Complete"}
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-md mx-auto">
          {isTr
            ? "Hesabınız oluşturuldu. E-posta adresinize gönderilen doğrulama bağlantısına tıklayarak veya doğrudan giriş yaparak başlayabilirsiniz."
            : "Your account has been created. Please check your email inbox to verify your address or sign in to continue."}
        </p>
        <div className="pt-3">
          <Link href={successLoginHref}>
            <Button variant="primary" size="lg" className="font-semibold">
              {isTr ? "Giriş Yap Ekranına Git" : "Go to Sign In"}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400">
          <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Name row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextInput
          label={isTr ? "Yasal adınız" : "Legal first name"}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder={isTr ? "Adınız" : "First name"}
          required
          startIcon={<User className="h-4 w-4" aria-hidden="true" />}
        />
        <TextInput
          label={isTr ? "Yasal soyadınız" : "Legal last name"}
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder={isTr ? "Soyadınız" : "Last name"}
          required
          startIcon={<User className="h-4 w-4" aria-hidden="true" />}
        />
      </div>

      {/* Profile identifiers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextInput
          label={isTr ? "Kullanıcı adı" : "Username"}
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="ornekkullanici"
          required
          startIcon={<AtSign className="h-4 w-4" aria-hidden="true" />}
        />
        <TextInput
          label={isTr ? "Görünen ad" : "Display name"}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={isTr ? "Ad Soyad veya Takma Ad" : "Full Name or Nickname"}
          required
          startIcon={<User className="h-4 w-4" aria-hidden="true" />}
        />
      </div>

      {/* Contact info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextInput
          label={isTr ? "E-posta adresi" : "Email address"}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ornek@alanadi.com"
          required
          startIcon={<Mail className="h-4 w-4" aria-hidden="true" />}
        />
        <TextInput
          label={isTr ? "Cep telefonu" : "Mobile phone"}
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+90 (555) 000 00 00"
          required
          startIcon={<Phone className="h-4 w-4" aria-hidden="true" />}
        />
      </div>

      {/* Age & Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DatePicker
          label={isTr ? "Doğum tarihi" : "Date of birth"}
          value={dateOfBirth}
          onChange={(date) => setDateOfBirth(date)}
          placeholder="gg.aa.yyyy"
          required
          locale={locale}
        />
        <TextInput
          label={isTr ? "İkamet şehri" : "City of residence"}
          value={cityOfResidence}
          onChange={(e) => setCityOfResidence(e.target.value)}
          placeholder="İstanbul, Ankara, İzmir..."
          required
          startIcon={<MapPin className="h-4 w-4" aria-hidden="true" />}
        />
      </div>

      {/* Password row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextInput
          label={isTr ? "Şifre" : "Password"}
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
          required
          autoComplete="new-password"
          startIcon={<Lock className="h-4 w-4" aria-hidden="true" />}
          endIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              aria-label={passwordToggleLabel}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          }
        />
        <TextInput
          label={isTr ? "Şifre tekrarı" : "Confirm password"}
          type={showConfirmPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••••••"
          required
          autoComplete="new-password"
          startIcon={<Lock className="h-4 w-4" aria-hidden="true" />}
          endIcon={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="p-1 rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              aria-label={confirmPasswordToggleLabel}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          }
        />
      </div>

      {/* Legal Checkboxes */}
      <div className="space-y-3 pt-4 border-t border-[var(--color-border-subtle)]/80 text-xs">
        <Checkbox
          label={
            <span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveLegalDoc("terms");
                }}
                className="font-medium text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors hover:underline cursor-pointer inline text-left"
              >
                {isTr ? "Kullanım Koşulları" : "Terms of Service"}
              </button>
              {isTr ? "'nı okudum ve kabul ediyorum." : "'s terms are accepted."}
            </span>
          }
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          required
        />

        <Checkbox
          label={
            <span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveLegalDoc("privacy");
                }}
                className="font-medium text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors hover:underline cursor-pointer inline text-left"
              >
                {isTr ? "Gizlilik ve KVKK Aydınlatma Metni" : "Privacy Notice"}
              </button>
              {isTr
                ? "'ni okudum, kişisel verilerimin işlenmesi hakkında bilgilendirildim."
                : " has been read and understood."}
            </span>
          }
          checked={privacyAcknowledged}
          onChange={(e) => setPrivacyAcknowledged(e.target.checked)}
          required
        />

        <Checkbox
          label={
            <span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveLegalDoc("matching-disclaimer");
                }}
                className="font-medium text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors hover:underline cursor-pointer inline text-left"
              >
                {isTr ? "Eşleştirme ve Sorumluluk Reddi Bildirimi" : "Matching & Disclaimer Notice"}
              </button>
              {isTr
                ? "'ni okudum; platformun emanet, ödeme veya sözleşme hizmeti sunmadığını kabul ediyorum."
                : " acknowledges the platform provides matching only, not escrow or payment processing."}
            </span>
          }
          checked={matchingAcknowledged}
          onChange={(e) => setMatchingAcknowledged(e.target.checked)}
          required
        />

        <Checkbox
          label={
            isTr
              ? "18 yaşımı doldurmuş olduğumu beyan ve teyit ederim."
              : "I confirm that I am at least 18 years of age."
          }
          checked={ageConfirmed}
          onChange={(e) => setAgeConfirmed(e.target.checked)}
          required
        />

        <Checkbox
          label={
            isTr
              ? "Operis platform duyuruları, bültenler ve yeni özellikler hakkında bilgilendirme e-postaları almak istiyorum (İsteğe bağlı)."
              : "I would like to receive product announcements, updates, and newsletters (Optional)."
          }
          checked={marketingConsent}
          onChange={(e) => setMarketingConsent(e.target.checked)}
        />
      </div>

      {/* Cloudflare Turnstile Bot Defense (Invisible / Interaction-Only) */}
      <TurnstileWidget
        appearance="interaction-only"
        onVerify={(token) => setTurnstileToken(token)}
        onExpire={() => setTurnstileToken(null)}
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full mt-3 font-semibold text-sm cursor-pointer"
        isLoading={isLoading}
      >
        {isTr ? "Hesap Oluştur" : "Create Account"}
      </Button>

      {/* 5 Circular Social Sign-Up Buttons */}
      <div className="pt-2">
        <SocialLoginButtons
          locale={locale}
          returnUrl={returnUrl}
          onError={(msg) => setError(msg)}
        />
      </div>

      <div className="pt-2 text-center text-xs text-[var(--color-text-secondary)]">
        {isTr ? "Zaten bir hesabınız var mı?" : "Already have an account?"}{" "}
        <Link
          href={
            returnUrl
              ? `/${locale}/login?returnUrl=${encodeURIComponent(returnUrl)}`
              : `/${locale}/login`
          }
          className="font-medium text-blue-400 hover:text-blue-300 transition-colors hover:underline"
        >
          {isTr ? "Giriş Yapın" : "Sign In"}
        </Link>
      </div>

      {/* Centered Legal Pop-Up Modal */}
      <LegalModal
        isOpen={!!activeLegalDoc}
        onClose={() => setActiveLegalDoc(null)}
        documentKey={activeLegalDoc}
        locale={isTr ? "tr" : "en"}
        onAccept={handleLegalAccept}
      />
    </form>
  );
}
