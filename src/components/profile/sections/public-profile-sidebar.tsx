"use client";

import {
  ExternalLink,
  Radar,
  Pencil,
  Layers,
} from "lucide-react";
import { PublicProfileDto } from "@/src/modules/profiles/service";
import { getPlatformConfig } from "../platform-icons";

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
      {/* Bio / About Card */}
      <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-xl p-5 sm:p-6 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-blue-400" />
            <span>{isTr ? "Hakkında" : "About"}</span>
          </h2>
          {isSelf && (
            <button
              type="button"
              onClick={onOpenAboutModal}
              className="p-1 rounded-lg text-[var(--color-text-tertiary)] hover:text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
              title={isTr ? "Biyografiyi Düzenle" : "Edit Bio"}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {profile.about ? (
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
            {profile.about}
          </p>
        ) : (
          <div className="text-xs text-[var(--color-text-tertiary)] italic">
            {isSelf ? (
              <button
                type="button"
                onClick={onOpenAboutModal}
                className="hover:text-blue-400 transition-colors cursor-pointer"
              >
                {isTr ? "+ Kendinizi tanıtan bir özet ekleyin..." : "+ Add summary..."}
              </button>
            ) : (
              <span>{isTr ? "Kullanıcı henüz biyografi eklemedi." : "No bio added yet."}</span>
            )}
          </div>
        )}
      </div>

      {/* Tech Radar / Tracked Skills Card */}
      <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-xl p-5 sm:p-6 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-2">
            <Radar className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            <span>{isTr ? "Teknoloji Radarı" : "Tech Stack Radar"}</span>
          </h2>
          {isSelf && (
            <button
              type="button"
              onClick={onOpenSkillsModal}
              className="p-1 rounded-lg text-[var(--color-text-tertiary)] hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors cursor-pointer"
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
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 shadow-2xs"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                {skill}
              </span>
            ))
          ) : (
            <span className="text-xs text-[var(--color-text-tertiary)] italic">
              {isSelf ? (
                <button
                  type="button"
                  onClick={onOpenSkillsModal}
                  className="hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {isTr ? "+ Teknoloji ve yetenek ekleyin..." : "+ Add skills..."}
                </button>
              ) : (
                <span>{isTr ? "Beceri belirtilmemiş." : "No skills specified."}</span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Portfolio & Verified Links Card */}
      <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-xl p-5 sm:p-6 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-2">
            <ExternalLink className="h-3.5 w-3.5 text-purple-400" />
            <span>{isTr ? "Portfolyo & Ağlar" : "Portfolio & Links"}</span>
          </h2>
          {isSelf && (
            <button
              type="button"
              onClick={onOpenLinksModal}
              className="p-1 rounded-lg text-[var(--color-text-tertiary)] hover:text-purple-400 hover:bg-purple-500/10 transition-colors cursor-pointer"
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
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className="h-4 w-4 shrink-0 opacity-90" />
                    <span className="truncate font-semibold">{link.label || config.label}</span>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 opacity-60 shrink-0 ml-2" />
                </a>
              );
            })
          ) : (
            <span className="text-xs text-[var(--color-text-tertiary)] italic">
              {isSelf ? (
                <button
                  type="button"
                  onClick={onOpenLinksModal}
                  className="hover:text-purple-400 transition-colors cursor-pointer"
                >
                  {isTr ? "+ GitHub, LinkedIn veya portfolyo bağlantısı ekleyin..." : "+ Add links..."}
                </button>
              ) : (
                <span>{isTr ? "Dış bağlantı bulunmuyor." : "No external links."}</span>
              )}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
