"use client";

import Link from "next/link";
import {
  ExternalLink,
  Radar,
  Pencil,
  Layers,
  Building2,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { PublicProfileDto } from "@/src/modules/profiles/service";
import { getPlatformConfig } from "../platform-icons";
import { VerifiedCompanyBadge } from "@/src/components/ui/verified-company-badge";

export interface PublicProfileSidebarProps {
  profile: PublicProfileDto;
  locale: string;
  isSelf: boolean;
  onOpenAboutModal: () => void;
  onOpenSkillsModal: () => void;
  onOpenLinksModal: () => void;
}

export function PublicProfileSidebar({
  profile,
  locale,
  isSelf,
  onOpenAboutModal,
  onOpenSkillsModal,
  onOpenLinksModal,
}: PublicProfileSidebarProps) {
  const isTr = locale === "tr";

  return (
    <aside className="lg:col-span-4 space-y-5">
      {/* 1. Bio / About Card */}
      <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/85 backdrop-blur-xl p-5 sm:p-6 space-y-3.5 shadow-sm transition-all hover:border-[var(--color-border-strong)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-blue-400" />
            <span>{isTr ? "Hakkında & Deneyim" : "About & Background"}</span>
          </h2>
          {isSelf && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onOpenAboutModal}
                className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
                title={isTr ? "Biyografiyi Düzenle" : "Edit Bio"}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {profile.about ? (
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
            {profile.about}
          </p>
        ) : (
          <div className="text-xs text-[var(--color-text-tertiary)] italic p-3 rounded-2xl border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30 text-center">
            {isSelf ? (
              <button
                type="button"
                onClick={onOpenAboutModal}
                className="hover:text-blue-400 transition-colors cursor-pointer inline-flex items-center gap-1.5 font-medium"
              >
                <Sparkles className="h-3 w-3 text-blue-400" />
                <span>{isTr ? "Kendinizi tanıtan profesyonel bir özet ekleyin..." : "Add your professional bio..."}</span>
              </button>
            ) : (
              <span>{isTr ? "Kullanıcı henüz bir biyografi eklemedi." : "No bio added yet."}</span>
            )}
          </div>
        )}

        {isSelf && (
          <div className="pt-2 border-t border-[var(--color-border-subtle)]/60 flex items-center justify-between text-[11px] text-[var(--color-text-tertiary)]">
            <span>{isTr ? "Detaylı metin ayarları" : "Detailed text settings"}</span>
            <Link
              href={isTr ? "/tr/ayarlar?tab=identity" : "/en/settings?tab=identity"}
              className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              <span>{isTr ? "Ayarlarda Aç" : "Open in Settings"}</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>

      {/* 2. Tech Stack Radar / Tracked Skills Card */}
      <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/85 backdrop-blur-xl p-5 sm:p-6 space-y-3.5 shadow-sm transition-all hover:border-[var(--color-border-strong)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-2">
            <Radar className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            <span>{isTr ? "Teknoloji & Yetenek Radarı" : "Tech Stack & Skills"}</span>
          </h2>
          {isSelf && (
            <button
              type="button"
              onClick={onOpenSkillsModal}
              className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors cursor-pointer"
              title={isTr ? "Becerileri Düzenle" : "Edit Skills"}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {profile.trackedSkills && profile.trackedSkills.length > 0 ? (
            profile.trackedSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 shadow-2xs hover:bg-cyan-500/20 transition-colors"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                {skill}
              </span>
            ))
          ) : (
            <div className="w-full text-xs text-[var(--color-text-tertiary)] italic p-3 rounded-2xl border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30 text-center">
              {isSelf ? (
                <button
                  type="button"
                  onClick={onOpenSkillsModal}
                  className="hover:text-cyan-400 transition-colors cursor-pointer inline-flex items-center gap-1.5 font-medium"
                >
                  <Sparkles className="h-3 w-3 text-cyan-400" />
                  <span>{isTr ? "Teknoloji ve uzmanlık alanları ekleyin..." : "Add your tech stack..."}</span>
                </button>
              ) : (
                <span>{isTr ? "Belirtilmiş yetenek bulunmuyor." : "No skills specified."}</span>
              )}
            </div>
          )}
        </div>

        {isSelf && (
          <div className="pt-2 border-t border-[var(--color-border-subtle)]/60 flex items-center justify-between text-[11px] text-[var(--color-text-tertiary)]">
            <span>{isTr ? "Müsaitlik ve saatlik kapasite" : "Availability and hours"}</span>
            <Link
              href={isTr ? "/tr/ayarlar?tab=work" : "/en/settings?tab=work"}
              className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
            >
              <span>{isTr ? "Çalışma Ayarları" : "Work Settings"}</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>

      {/* 3. Portfolio & Verified External Links Card */}
      <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/85 backdrop-blur-xl p-5 sm:p-6 space-y-3.5 shadow-sm transition-all hover:border-[var(--color-border-strong)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-2">
            <ExternalLink className="h-3.5 w-3.5 text-purple-400" />
            <span>{isTr ? "Portfolyo & Ağlar" : "Portfolio & Verified Links"}</span>
          </h2>
          {isSelf && (
            <button
              type="button"
              onClick={onOpenLinksModal}
              className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-purple-400 hover:bg-purple-500/10 transition-colors cursor-pointer"
              title={isTr ? "Bağlantıları Düzenle" : "Edit Links"}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-1">
          {profile.links && profile.links.length > 0 ? (
            profile.links.map((link) => {
              const config = getPlatformConfig(link.type, link.url);
              const Icon = config.icon;

              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all hover:scale-[1.01] shadow-2xs ${config.badgeClass}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="h-4 w-4 shrink-0 opacity-90" />
                    <span className="truncate font-semibold">{link.label || config.label}</span>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 opacity-60 shrink-0 ml-2" />
                </a>
              );
            })
          ) : (
            <div className="text-xs text-[var(--color-text-tertiary)] italic p-3 rounded-2xl border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/30 text-center">
              {isSelf ? (
                <button
                  type="button"
                  onClick={onOpenLinksModal}
                  className="hover:text-purple-400 transition-colors cursor-pointer inline-flex items-center gap-1.5 font-medium"
                >
                  <Sparkles className="h-3 w-3 text-purple-400" />
                  <span>{isTr ? "+ GitHub, LinkedIn veya portfolyo bağlantısı ekleyin..." : "+ Add links..."}</span>
                </button>
              ) : (
                <span>{isTr ? "Dış bağlantı bulunmuyor." : "No external links."}</span>
              )}
            </div>
          )}
        </div>

        {isSelf && (
          <div className="pt-2 border-t border-[var(--color-border-subtle)]/60 flex items-center justify-between text-[11px] text-[var(--color-text-tertiary)]">
            <span>{isTr ? "Maksimum 10 doğrulanmış bağlantı" : "Up to 10 verified links"}</span>
            <Link
              href={isTr ? "/tr/ayarlar?tab=identity" : "/en/settings?tab=identity"}
              className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors font-medium"
            >
              <span>{isTr ? "Ayarlarda Yönet" : "Manage in Settings"}</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>

      {/* 4. Corporate & Security Trust Card */}
      <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/85 backdrop-blur-xl p-5 sm:p-6 space-y-3.5 shadow-sm transition-all hover:border-[var(--color-border-strong)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>{isTr ? "Kurumsal Güven & Doğrulama" : "Corporate Trust & Verification"}</span>
          </h2>
        </div>

        {profile.isCompanyVerified ? (
          <div className="space-y-3 pt-1">
            <VerifiedCompanyBadge
              companyName={profile.companyName}
              taxOffice={profile.taxOffice}
              vknMasked={profile.vknMasked}
              companyType={profile.companyType}
              size="lg"
              isEn={!isTr}
            />
            <p className="text-[11px] text-[var(--color-text-tertiary)] leading-relaxed">
              {isTr
                ? "Bu kullanıcının kurumsal unvanı ve vergi kimlik numarası (VKN/TCKN) GİB entegrasyonuyla resmi olarak doğrulanmıştır."
                : "This company entity and Tax ID have been officially verified via national tax authority integration."}
            </p>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-3 p-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/40 text-xs">
              <ShieldCheck className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-[var(--color-text-primary)] block">
                  {isTr ? "Bireysel Doğrulanmış Hesap" : "Individual Verified Profile"}
                </span>
                <span className="text-[var(--color-text-secondary)] text-[11px] block">
                  {isTr
                    ? "Kimlik ve oturum verileri Operis güvenlik protokolüyle doğrulanmıştır."
                    : "Identity and session verified under Operis protocol."}
                </span>
              </div>
            </div>

            {isSelf && (
              <Link
                href={isTr ? "/tr/ayarlar?tab=corporate" : "/en/settings?tab=corporate"}
                className="inline-flex items-center justify-between w-full p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 text-xs font-semibold transition-all group"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isTr ? "Kurumsal Rozet Al (GİB VKN/TCKN)" : "Verify Company (Tax ID)"}</span>
                </div>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
