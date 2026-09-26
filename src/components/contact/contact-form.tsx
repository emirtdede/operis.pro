"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  User,
  Send,
  CheckCircle2,
  AlertCircle,
  Building2,
  Clock,
  ShieldCheck,
  ArrowRight,
  Headphones,
  Briefcase,
  ShieldAlert,
  Scale,
  Newspaper,
  LucideIcon,
  Paperclip,
  UploadCloud,
  X,
  FileText,
  Check,
} from "lucide-react";
import { Button } from "../ui/button";
import { TextInput } from "../ui/text-input";
import { TextArea } from "../ui/text-area";
import { TurnstileWidget } from "../security/turnstile-widget";
import { EMOJI_REGEX, validateContentAppropriateness } from "@/src/lib/security/content-moderator";

export interface DepartmentConfig {
  id: string;
  labelTr: string;
  labelEn: string;
  slaTr: string;
  slaEn: string;
  badgeTr: string;
  badgeEn: string;
  color: string;
  icon: LucideIcon;
}

export const DEPARTMENTS: DepartmentConfig[] = [
  {
    id: "general",
    labelTr: "Teknik Destek & Platform Operasyonları",
    labelEn: "Technical Support & Platform Ops",
    slaTr: "< 6 İş Saati",
    slaEn: "< 6 Business Hours",
    badgeTr: "Teknik Destek",
    badgeEn: "Tech Team",
    color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
    icon: Headphones,
  },
  {
    id: "enterprise",
    labelTr: "Kurumsal & Girişim Çözümleri",
    labelEn: "Enterprise & Partnerships",
    slaTr: "< 4 İş Saati",
    slaEn: "< 4 Business Hours",
    badgeTr: "Kurumsal Masa",
    badgeEn: "Enterprise Desk",
    color: "text-blue-400 border-blue-500/20 bg-blue-500/10",
    icon: Briefcase,
  },
  {
    id: "security",
    labelTr: "Güvenlik & Bug Bounty Masası",
    labelEn: "Security & Vulnerability Disclosure",
    slaTr: "< 2 Saat (7/24)",
    slaEn: "< 2 Hours (24/7)",
    badgeTr: "Güvenlik Masası",
    badgeEn: "Security Desk",
    color: "text-rose-400 border-rose-500/20 bg-rose-500/10",
    icon: ShieldAlert,
  },
  {
    id: "legal",
    labelTr: "Hukuk & Uyuşmazlık Müşavirliği",
    labelEn: "Legal Counsel & Statutory Disputes",
    slaTr: "< 12 İş Saati",
    slaEn: "< 12 Business Hours",
    badgeTr: "Hukuk Müşavirliği",
    badgeEn: "Legal Counsel",
    color: "text-purple-400 border-purple-500/20 bg-purple-500/10",
    icon: Scale,
  },
  {
    id: "privacy",
    labelTr: "KVKK & Veri Gizliliği Masası",
    labelEn: "Privacy & Data Protection Desk",
    slaTr: "< 12 İş Saati",
    slaEn: "< 12 Business Hours",
    badgeTr: "KVKK",
    badgeEn: "Privacy",
    color: "text-cyan-400 border-cyan-500/20 bg-cyan-500/10",
    icon: ShieldCheck,
  },
  {
    id: "billing",
    labelTr: "Faturalandırma & Finans Masası",
    labelEn: "Billing & Accounting Desk",
    slaTr: "< 6 İş Saati",
    slaEn: "< 6 Business Hours",
    badgeTr: "Finans",
    badgeEn: "Billing",
    color: "text-amber-400 border-amber-500/20 bg-amber-500/10",
    icon: FileText,
  },
  {
    id: "press",
    labelTr: "Basın & Medya İletişimi",
    labelEn: "Press & Media Relations",
    slaTr: "< 24 İş Saati",
    slaEn: "< 24 Business Hours",
    badgeTr: "İletişim Masası",
    badgeEn: "PR Desk",
    color: "text-amber-400 border-amber-500/20 bg-amber-500/10",
    icon: Newspaper,
  },
];

export interface ContactFormProps {
  locale: string;
  selectedDepartment?: string;
  onDepartmentChange?: (deptId: string) => void;
}

function getFileUploadPrompt(isDragging: boolean, isTr: boolean): string {
  if (isDragging) {
    return isTr ? "Dosyayı yüklemek için şimdi buraya bırakın" : "Drop your file here to attach";
  }
  return isTr ? "Dosyayı buraya sürükleyip bırakın veya tıklayın" : "Drag and drop your file here, or click to browse";
}

function getFileTypeBadge(isImage: boolean, isPdf: boolean, isZip: boolean, isTr: boolean): string {
  if (isImage) return isTr ? "Görsel Önizleme" : "Image Preview";
  if (isPdf) return isTr ? "PDF Belgesi" : "PDF Document";
  if (isZip) return isTr ? "Arşiv Paketi" : "Archive Package";
  return isTr ? "Doküman" : "Document";
}

function renderFileThumbnail(
  file: { name: string; data?: string },
  isImage: boolean,
  isPdf: boolean,
  isZip: boolean
) {
  if (isImage && file.data) {
    return (
      <div className="relative shrink-0 group/img">
        <img
          src={file.data}
          alt={file.name}
          className="h-24 w-24 sm:h-28 sm:w-28 object-cover rounded-2xl border-2 border-blue-500/40 shadow-xl shadow-blue-500/20 ring-4 ring-blue-500/10"
        />
        <span className="absolute -bottom-1.5 -right-1.5 h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-[var(--color-surface-base)] shadow-sm">
          <Check className="h-3.5 w-3.5 stroke-[3]" />
        </span>
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="relative shrink-0 h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-gradient-to-br from-rose-500/20 via-rose-500/10 to-rose-500/5 border-2 border-rose-500/30 flex flex-col items-center justify-center shadow-lg shadow-rose-500/10">
        <FileText className="h-9 w-9 text-rose-400" />
        <span className="text-[10px] font-mono font-black text-rose-300 uppercase mt-1 px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/30">
          PDF
        </span>
        <span className="absolute -bottom-1.5 -right-1.5 h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-[var(--color-surface-base)] shadow-sm">
          <Check className="h-3.5 w-3.5 stroke-[3]" />
        </span>
      </div>
    );
  }

  if (isZip) {
    return (
      <div className="relative shrink-0 h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-amber-500/5 border-2 border-amber-500/30 flex flex-col items-center justify-center shadow-lg shadow-amber-500/10">
        <FileText className="h-9 w-9 text-amber-400" />
        <span className="text-[10px] font-mono font-black text-amber-300 uppercase mt-1 px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30">
          ZIP
        </span>
        <span className="absolute -bottom-1.5 -right-1.5 h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-[var(--color-surface-base)] shadow-sm">
          <Check className="h-3.5 w-3.5 stroke-[3]" />
        </span>
      </div>
    );
  }

  return (
    <div className="relative shrink-0 h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-blue-500/5 border-2 border-blue-500/30 flex flex-col items-center justify-center shadow-lg shadow-blue-500/10">
      <FileText className="h-9 w-9 text-blue-400" />
      <span className="text-[10px] font-mono font-black text-blue-300 uppercase mt-1 px-2 py-0.5 rounded-md bg-blue-500/20 border border-blue-500/30">
        BELGE
      </span>
      <span className="absolute -bottom-1.5 -right-1.5 h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-[var(--color-surface-base)] shadow-sm">
        <Check className="h-3.5 w-3.5 stroke-[3]" />
      </span>
    </div>
  );
}

export function ContactForm({ locale, selectedDepartment, onDepartmentChange }: ContactFormProps) {
  const isTr = locale === "tr";

  const [department, setDepartment] = useState(selectedDepartment || "general");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [ticketRef, setTicketRef] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Optional File Attachment State (Strict 5MB Limit)
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    size: string;
    type: string;
    data?: string;
  } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = React.useRef(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB Limit
  const ALLOWED_EXTENSIONS = [
    ".pdf",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".zip",
    ".rar",
    ".txt",
    ".docx",
    ".xlsx",
    ".csv",
  ];

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFileChange = (file: File | undefined | null) => {
    setFileError(null);
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(
        isTr
          ? `Dosya boyutu çok yüksek (${formatFileSize(file.size)}). Maksimum izin verilen boyut 5 MB'dir.`
          : `File size is too large (${formatFileSize(file.size)}). Maximum allowed size is 5 MB.`
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFileError(
        isTr
          ? `Geçersiz dosya türü (${ext || "uzantısız"}). Yalnızca PDF, görsel (PNG/JPG/WEBP), arşiv (ZIP/RAR) veya belge/tablo dosyaları kabul edilir.`
          : `Unsupported file format (${ext || "none"}). Only PDF, image (PNG/JPG/WEBP), archive (ZIP/RAR), or document/sheet files are accepted.`
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile({
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type || ext,
        data: typeof reader.result === "string" ? reader.result : undefined,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileChange(files[0]);
    }
  };


  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAttachedFile(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Sync state if controlled from outside
  useEffect(() => {
    if (selectedDepartment && selectedDepartment !== department) {
      setDepartment(selectedDepartment);
    }
  }, [selectedDepartment, department]);

  const handleDeptSelect = (deptId: string) => {
    setDepartment(deptId);
    onDepartmentChange?.(deptId);
  };

  const defaultDept = DEPARTMENTS[0] as (typeof DEPARTMENTS)[number];
  const currentDept = DEPARTMENTS.find((d) => d.id === department) ?? defaultDept;
  const CurrentIcon = currentDept.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (
      EMOJI_REGEX.test(name) ||
      EMOJI_REGEX.test(company) ||
      EMOJI_REGEX.test(subject) ||
      EMOJI_REGEX.test(message)
    ) {
      setError(
        isTr
          ? "Form alanlarında emoji kullanılamaz. Lütfen profesyonel iş metni kullanınız."
          : "Form fields cannot contain emojis. Please use plain text."
      );
      return;
    }

    if (
      !validateContentAppropriateness(subject).isValid ||
      !validateContentAppropriateness(message).isValid
    ) {
      setError(
        isTr
          ? "Mesajınız veya konu topluluk kurallarımıza aykırı uygunsuz ifadeler içermektedir."
          : "Subject or message contains inappropriate content violating guidelines."
      );
      return;
    }

    setIsLoading(true);

    try {
      const deptBadge = isTr ? currentDept.badgeTr : currentDept.badgeEn;
      const deptLabel = isTr ? currentDept.labelTr : currentDept.labelEn;
      const formattedSubject = `[${deptBadge}] ${subject.trim()}`;
      const formattedMessage = company.trim()
        ? `Kurum/Şirket: ${company.trim()}\nDepartman: ${deptLabel}\n\n${message.trim()}`
        : `Departman: ${deptLabel}\n\n${message.trim()}`;

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: formattedSubject,
          message: formattedMessage,
          turnstileToken,
          locale: isTr ? "tr" : "en",
          attachmentName: attachedFile?.name,
          attachmentSize: attachedFile?.size,
        }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || (isTr ? "Mesaj iletilemedi." : "Failed to send message."));

      const generatedRef = `OPR-REQ-${Date.now().toString(36).slice(-6).toUpperCase()}`;
      setTicketRef(generatedRef);
      setIsSuccess(true);
      setName("");
      setCompany("");
      setEmail("");
      setSubject("");
      setMessage("");
      setAttachedFile(null);
      setFileError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: unknown) {
      const fallbackMsg = isTr
        ? "İşlem başarısız oldu. Lütfen tekrar deneyiniz."
        : "Failed to dispatch inquiry. Please try again.";
      setError(err instanceof Error ? err.message : fallbackMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 via-[var(--color-surface-base)] to-[var(--color-surface-base)] p-8 sm:p-10 text-center space-y-6 shadow-2xl">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono font-semibold text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>{ticketRef || "OPR-REQ-OK"}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--color-text-primary)]">
            {isTr ? "Talebiniz Yetkili Masaya İletildi" : "Inquiry Successfully Dispatched"}
          </h2>

          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-lg mx-auto">
            {isTr
              ? `Talebiniz ${currentDept.labelTr} birimimize doğrudan aktarılmıştır. Taahhüt edilen SLA süresi (${currentDept.slaTr}) içinde kayıtlı e-posta adresinize resmi yanıt iletilecektir.`
              : `Your request has been routed to our ${currentDept.labelEn} desk. A formal response will be delivered to your email within our committed SLA window (${currentDept.slaEn}).`}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--color-surface-hover)]/60 border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-tertiary)] max-w-sm mx-auto flex items-center justify-between font-mono">
          <span>{isTr ? "Hedef Masa:" : "Target Desk:"}</span>
          <span className="font-bold text-[var(--color-text-primary)]">
            {isTr ? currentDept.badgeTr : currentDept.badgeEn}
          </span>
        </div>

        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => setIsSuccess(false)}
            className="text-xs font-semibold gap-2"
          >
            <span>{isTr ? "Yeni Talep Gönder" : "Submit Another Inquiry"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between space-y-4 sm:space-y-5">
      {/* 1. Unified Target Desk & SLA Console (Synchronized with selected desk) */}
      <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/50 p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-sm transition-all">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${currentDept.color}`}>
            <CurrentIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-tertiary)]">
                {isTr ? "Hedef Masa" : "Target Desk"}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h4 className="text-xs sm:text-[13px] font-bold text-[var(--color-text-primary)] tracking-tight whitespace-nowrap">
              {isTr ? currentDept.labelTr : currentDept.labelEn}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Clock className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-[11px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-xl border border-blue-500/20 whitespace-nowrap">
            {isTr ? currentDept.slaTr : currentDept.slaEn}
          </span>
        </div>
      </div>

      {/* Mobile quick-switch chips for small screens */}
      <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {DEPARTMENTS.map((dept) => {
          const isCurrent = dept.id === department;
          return (
            <button
              key={dept.id}
              type="button"
              onClick={() => handleDeptSelect(dept.id)}
              className={`shrink-0 px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all ${
                isCurrent
                  ? "bg-blue-600 text-white shadow-sm font-bold"
                  : "bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-white"
              }`}
            >
              {isTr ? dept.badgeTr : dept.badgeEn}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Row 1: Name & Company (No double asterisks, clean short placeholders) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextInput
          label={isTr ? "Adınız ve Soyadınız" : "Full Name"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={isTr ? "Adınız Soyadınız" : "Your full name"}
          required
          startIcon={<User className="h-4 w-4" aria-hidden="true" />}
        />

        <TextInput
          label={isTr ? "Şirket / Kurum (Opsiyonel)" : "Company (Optional)"}
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder={isTr ? "Örn: Şirket Adı" : "e.g. Acme Corp"}
          startIcon={<Building2 className="h-4 w-4" aria-hidden="true" />}
        />
      </div>

      {/* Row 2: Email & Subject (Clean short placeholders) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextInput
          label={isTr ? "Kurumsal / İletişim E-postası" : "Work / Contact Email"}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="adiniz@sirket.com"
          required
          startIcon={<Mail className="h-4 w-4" aria-hidden="true" />}
        />

        <TextInput
          label={isTr ? "Konu Başlığı" : "Subject"}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={
            isTr
              ? "Örn: Kurumsal API / Destek"
              : "e.g. API Integration / Support"
          }
          required
        />
      </div>

      {/* Row 3: Message Textarea */}
      <TextArea
        label={isTr ? "Detaylı Mesajınız" : "Detailed Message"}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={
          isTr
            ? "Talebinizi, kurumsal ihtiyacınızı veya teknik detayları açıklayınız (en az 10 karakter)..."
            : "Describe your inquiry, business requirement, or technical specifications in detail (min 10 characters)..."
        }
        required
        rows={4}
        className="min-h-[105px]"
      />

      {/* Row 4: Optional File Attachment (Enlarged Dropzone + Drag-and-Drop + Image/File Preview) */}
      <div className="flex-1 flex flex-col space-y-1.5 min-h-[220px] sm:min-h-[260px]">
        <div className="flex items-center justify-between text-xs">
          <label
            htmlFor="contact-file-input"
            className="font-medium text-[var(--color-text-secondary)] select-none flex items-center gap-1.5 cursor-pointer"
          >
            <Paperclip className="h-3.5 w-3.5 text-blue-400" />
            <span>{isTr ? "Ek Dosya / Ekran Görüntüsü Referansı" : "Attachment / File Reference"}</span>
            <span className="text-[11px] text-[var(--color-text-tertiary)] font-normal">
              ({isTr ? "Opsiyonel" : "Optional"})
            </span>
          </label>
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)]">
            {isTr ? "Maks. 5 MB" : "Max 5 MB"}
          </span>
        </div>
        <p className="text-[11px] text-[var(--color-text-tertiary)]">
          {isTr
            ? "Dosya ismi ve doğrulanmış boyutu bilet kaydınıza işlenir; gizli sözleşme evrakları için bilet referansınızla ilgili masanın e-posta adresini de kullanabilirsiniz."
            : "File metadata is attached to your ticket; for confidential documents you may also reference your ticket ID via the dedicated desk email."}
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.zip,.rar,.txt,.docx,.xlsx,.csv"
          onChange={(e) => handleFileChange(e.target.files?.[0])}
          className="hidden"
          id="contact-file-input"
        />

        {attachedFile ? (
          /* Attached State - Spacious Card with Real Image / File Preview */
          (() => {
            const isImage = Boolean(
              attachedFile.type?.startsWith("image/") ||
                [".png", ".jpg", ".jpeg", ".webp"].some((ext) =>
                  attachedFile.name.toLowerCase().endsWith(ext)
                )
            );
            const isPdf = Boolean(
              attachedFile.type === "application/pdf" ||
                attachedFile.name.toLowerCase().endsWith(".pdf")
            );
            const isZip = Boolean(
              [".zip", ".rar", ".7z", ".tar", ".gz"].some((ext) =>
                attachedFile.name.toLowerCase().endsWith(ext)
              )
            );

            return (
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex-1 w-full relative p-5 sm:p-7 rounded-2xl border transition-all flex flex-col justify-between gap-4 animate-in fade-in min-h-[190px] sm:min-h-[220px] overflow-hidden ${
                  isDragging
                    ? "border-blue-500 bg-blue-500/20 ring-4 ring-blue-500/20 shadow-2xl"
                    : "bg-blue-500/[0.07] border-blue-500/30 hover:border-blue-500/40"
                }`}
              >
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 flex-1 justify-center sm:justify-start">
                  {/* File Preview Thumbnail / Badge */}
                  {renderFileThumbnail(attachedFile, isImage, isPdf, isZip)}

                  {/* File Metadata & Badges */}
                  <div className="space-y-2 flex-1 min-w-0 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/25 text-blue-400 text-[11px] font-mono font-bold uppercase">
                        {getFileTypeBadge(isImage, isPdf, isZip, isTr)}
                      </span>
                      <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{isTr ? "Doğrulandı & Gönderime Hazır" : "Verified & Ready"}</span>
                      </span>
                    </div>

                    <p className="text-sm font-bold text-[var(--color-text-primary)] truncate max-w-[280px] sm:max-w-[340px] mx-auto sm:mx-0">
                      {attachedFile.name}
                    </p>

                    <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-mono text-[var(--color-text-tertiary)]">
                      <span className="px-2 py-0.5 rounded-md bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] font-medium">
                        {attachedFile.size}
                      </span>
                      <span>•</span>
                      <span>{isTr ? "Maks. 5 MB Kapsamında" : "Within 5 MB Limit"}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions inside Attached Card */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-blue-500/20">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[var(--color-text-secondary)] hover:text-white bg-[var(--color-surface-hover)] hover:bg-[var(--color-surface-hover)]/80 border border-[var(--color-border-subtle)] hover:border-blue-500/40 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Paperclip className="h-3.5 w-3.5 text-blue-400" />
                    <span>{isTr ? "Farklı Dosya Seç" : "Replace File"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    title={isTr ? "Dosyayı Kaldır" : "Remove file"}
                    aria-label={isTr ? "Dosyayı Kaldır" : "Remove file"}
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>{isTr ? "Kaldır" : "Remove"}</span>
                  </button>
                </div>

                {/* Drag Hover Overlay if dragging another file */}
                {isDragging && (
                  <div className="absolute inset-0 bg-blue-600/90 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center text-white gap-2 pointer-events-none animate-in fade-in">
                    <UploadCloud className="h-8 w-8 animate-bounce" />
                    <p className="text-xs sm:text-sm font-bold">
                      {isTr ? "Yeni dosyayı yüklemek için buraya bırakın" : "Drop to replace with new file"}
                    </p>
                  </div>
                )}
              </div>
            );
          })()
        ) : (
          /* Empty Dropzone: Expanded Height to Gracefully Fill the Column */
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex-1 w-full group relative cursor-pointer rounded-2xl border-2 border-dashed transition-all py-8 sm:py-10 px-4 flex flex-col items-center justify-center text-center gap-3.5 min-h-[190px] sm:min-h-[220px] overflow-hidden ${
              isDragging
                ? "border-blue-500 bg-blue-500/15 ring-4 ring-blue-500/20 shadow-xl shadow-blue-500/10 scale-[1.01]"
                : "border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30 hover:border-blue-500/40 hover:bg-[var(--color-surface-hover)]/60"
            }`}
          >
            <div className="pointer-events-none flex flex-col items-center justify-center text-center gap-2.5 max-w-sm">
              <div
                className={`h-12 w-12 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center transition-all ${
                  isDragging
                    ? "bg-blue-500 text-white scale-110 shadow-lg shadow-blue-500/30 animate-pulse"
                    : "bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:scale-105 group-hover:border-blue-500/40 group-hover:bg-blue-500/20 shadow-sm"
                }`}
              >
                <UploadCloud className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>

              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)] group-hover:text-blue-400 transition-colors">
                  {getFileUploadPrompt(isDragging, isTr)}
                </p>
                <p className="text-[11px] text-[var(--color-text-tertiary)]">
                  {isTr
                    ? "PDF, Görsel (PNG/JPG/WEBP), ZIP veya Belge • Maks. 5 MB"
                    : "PDF, Image (PNG/JPG/WEBP), ZIP or Docs • Max 5 MB"}
                </p>
              </div>

              {/* Prominent Action Button inside File Upload Area */}
              <div className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] group-hover:border-blue-500/50 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-all shadow-sm">
                <Paperclip className="h-3.5 w-3.5 text-blue-400" />
                <span>{isTr ? "Cihazdan Dosya Seç" : "Browse from Device"}</span>
              </div>
            </div>
          </div>
        )}

        {fileError && (
          <p className="text-[11px] text-red-400 flex items-center gap-1.5 pt-0.5 animate-in fade-in">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{fileError}</span>
          </p>
        )}
      </div>

      {/* Cloudflare Turnstile Bot Defense (Interaction-Only) */}
      <TurnstileWidget
        appearance="interaction-only"
        onVerify={(token) => setTurnstileToken(token)}
        onExpire={() => setTurnstileToken(null)}
      />

      {/* Premium Submit Button with Luxury Gradient, Larger Hitbox & Glow */}
      <Button
        type="submit"
        size="lg"
        className="w-full text-sm sm:text-base font-bold gap-2.5 cursor-pointer text-white bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.008] active:scale-[0.995] transition-all py-4 rounded-2xl border-none mt-1"
        isLoading={isLoading}
      >
        <Send className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
        <span>
          {isTr
            ? `${currentDept.badgeTr} Masasına İlet`
            : `Dispatch to ${currentDept.badgeEn}`}
        </span>
      </Button>
    </form>
  );
}
