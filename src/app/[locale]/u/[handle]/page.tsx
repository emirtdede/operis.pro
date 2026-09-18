import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import {
  MapPin,
  ExternalLink,
  CheckCircle2,
  ArrowLeft,
  Award,
  Radar,
  Quote,
  ShieldCheck,
} from "lucide-react";
import { ProfileService } from "@/src/modules/profiles/service";
import { AvatarInitials } from "@/src/components/ui/avatar-initials";
import { Badge } from "@/src/components/ui/badge";
import { EmptyState } from "@/src/components/ui/empty-state";
import { Button } from "@/src/components/ui/button";
import { ProfileShareButton } from "@/src/components/profile/profile-share-button";
import { ProfileActionsMenu } from "@/src/components/profile/profile-actions-menu";
import { getSession } from "@/src/modules/auth/session";
import { getLocalizedProfilePath } from "@/src/lib/i18n/routes";
import { serializeJsonLd } from "@/src/lib/security/json-ld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>;
}): Promise<Metadata> {
  const { locale, handle } = await params;
  const isTr = locale === "tr";
  const profile = await ProfileService.getPublicProfileByHandle(handle);

  if (!profile) {
    return {
      title: isTr ? "Profil Bulunamadı" : "Profile Not Found",
    };
  }

  const title = isTr
    ? `${profile.displayName} (@${profile.handle}) — Doğrulanmış Profil`
    : `${profile.displayName} (@${profile.handle}) — Verified Profile`;
  const description =
    profile.about ??
    (isTr
      ? `${profile.displayName} kullanıcısının Operis profili ve doğrulanmış iş geçmişi.`
      : `Public profile and verified project history for ${profile.displayName} on Operis.`);

  return {
    title,
    description,
    alternates: {
      canonical: getLocalizedProfilePath(handle, locale),
      languages: {
        tr: getLocalizedProfilePath(handle, "tr"),
        en: getLocalizedProfilePath(handle, "en"),
      },
    },
    openGraph: {
      title,
      description,
      url: getLocalizedProfilePath(handle, locale),
      siteName: "Operis",
      locale: isTr ? "tr_TR" : "en_US",
      type: "profile",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>;
}) {
  const { locale, handle } = await params;
  setRequestLocale(locale);

  const isTr = locale === "tr";
  const [profile, session] = await Promise.all([
    ProfileService.getPublicProfileByHandle(handle),
    getSession(),
  ]);

  if (!profile) {
    notFound();
  }

  const profileUrl = isTr
    ? `https://operis.pro/tr/profil/${profile.handle}`
    : `https://operis.pro/en/profile/${profile.handle}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        name: `${profile.displayName} (@${profile.handle})`,
        url: profileUrl,
        mainEntity: {
          "@type": "Person",
          name: profile.displayName,
          alternateName: profile.handle,
          description: profile.about,
          address: profile.location
            ? {
                "@type": "PostalAddress",
                addressLocality: profile.location.city,
                addressCountry: profile.location.countryCode,
              }
            : undefined,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: isTr ? "Ana Sayfa" : "Home",
            item: `https://operis.pro/${locale}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: profile.displayName,
            item: profileUrl,
          },
        ],
      },
    ],
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      {/* Navigation Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]"
      >
        <Link
          href={isTr ? "/tr/ilanlar" : "/en/listings"}
          className="inline-flex items-center gap-1 hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{isTr ? "İlanlara Dön" : "Back to Listings"}</span>
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-[var(--color-text-secondary)] font-medium">@{profile.handle}</span>
      </nav>

      {/* Profile Card */}
      <article className="relative overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-6 sm:p-10 space-y-6 shadow-xl">
        {/* Ambient background glows */}
        <div
          className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-purple-500/10 blur-3xl"
          aria-hidden="true"
        />

        <header className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-5">
            <AvatarInitials name={profile.displayName} size="lg" avatarUrl={profile.avatarUrl} />
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
                {profile.displayName}
              </h1>
              <div className="text-sm font-mono text-blue-400">@{profile.handle}</div>
              {profile.location && (
                <div className="text-xs text-[var(--color-text-secondary)] pt-1 flex items-center gap-1">
                  <MapPin
                    className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]"
                    aria-hidden="true"
                  />
                  <span>
                    {profile.location.city}, {profile.location.countryCode}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 self-start sm:self-center flex items-center gap-2">
            <ProfileShareButton locale={locale} />
            <ProfileActionsMenu
              targetUserId={profile.userId}
              targetHandle={profile.handle}
              targetDisplayName={profile.displayName}
              locale={locale}
              isSelf={Boolean(session?.userId && session.userId === profile.userId)}
            />
          </div>
        </header>

        {/* About Bio */}
        {profile.about && (
          <div className="border-t border-[var(--color-border-subtle)] pt-4 text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
            {profile.about}
          </div>
        )}

        {/* Links */}
        {profile.links && profile.links.length > 0 && (
          <section
            className="space-y-3"
            aria-label={isTr ? "Portfolyo ve Dış Bağlantılar" : "Portfolio & External Links"}
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] flex items-center justify-between">
              <span>
                {isTr
                  ? "Portfolyo ve Doğrulanmış Dış Bağlantılar"
                  : "Portfolio & External Profiles"}
              </span>
              <span className="text-[10px] lowercase font-normal opacity-70">
                {isTr ? "doğrudan yönlendirme" : "direct referral"}
              </span>
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {profile.links.map((link: { id: string; url: string; label: string }) => {
                const u = link.url.toLowerCase();
                const isGithub = u.includes("github.com");
                const isBehance = u.includes("behance.net");
                const isDribbble = u.includes("dribbble.com");
                const isFigma = u.includes("figma.com");
                const isLinkedin = u.includes("linkedin.com");
                const isGitlab = u.includes("gitlab.com");
                const isMedium = u.includes("medium.com");

                const badgeColor = isGithub
                  ? "border-neutral-500/30 bg-neutral-500/10 text-neutral-200 hover:border-neutral-400"
                  : isBehance
                    ? "border-blue-500/30 bg-blue-500/10 text-blue-400 hover:border-blue-400"
                    : isDribbble
                      ? "border-pink-500/30 bg-pink-500/10 text-pink-400 hover:border-pink-400"
                      : isFigma
                        ? "border-purple-500/30 bg-purple-500/10 text-purple-400 hover:border-purple-400"
                        : isLinkedin
                          ? "border-sky-500/30 bg-sky-500/10 text-sky-400 hover:border-sky-400"
                          : isGitlab
                            ? "border-orange-500/30 bg-orange-500/10 text-orange-400 hover:border-orange-400"
                            : isMedium
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:border-emerald-400"
                              : "border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)]";

                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className={`inline-flex items-center gap-2 max-w-full rounded-xl border px-3.5 py-2 text-xs font-medium transition-all hover:scale-[1.02] shadow-sm ${badgeColor}`}
                  >
                    <span className="truncate max-w-[200px] xs:max-w-[260px] sm:max-w-[340px]">
                      {link.label || link.url}
                    </span>
                    <ExternalLink className="h-3 w-3 opacity-70 shrink-0" aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* Stack Radar: Tracked Technologies */}
        {profile.trackedSkills && profile.trackedSkills.length > 0 && (
          <section
            className="space-y-2 border-t border-[var(--color-border-subtle)] pt-4"
            aria-label={isTr ? "Teknoloji Radarı" : "Tech Stack Radar"}
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
              <Radar className="h-3.5 w-3.5 text-cyan-400 animate-pulse" aria-hidden="true" />
              <span>
                {isTr ? "Teknoloji Radarı (Aktif Takip)" : "Tech Stack Radar (Active Tracking)"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {profile.trackedSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Action Bar: Propose a Project */}
        <div className="border-t border-[var(--color-border-subtle)] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-0.5 text-center sm:text-left">
            <span className="text-sm font-bold text-[var(--color-text-primary)]">
              {isTr
                ? "Bu uzmanla çalışmak mı istiyorsunuz?"
                : "Want to collaborate with this specialist?"}
            </span>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {isTr
                ? "Yeni bir ilan oluşturarak uzmanın doğrudan teklif sunmasını sağlayabilirsiniz."
                : "Post a listing to receive a direct 1-to-1 proposal."}
            </p>
          </div>
          <Link
            href={isTr ? "/tr/ilanlar/yeni" : "/en/listings/new"}
            className="shrink-0 w-full sm:w-auto"
          >
            <Button variant="shimmer" size="sm" className="w-full sm:w-auto">
              <span>{isTr ? "İlan Yayınla" : "Post a Listing"}</span>
            </Button>
          </Link>
        </div>
      </article>

      {/* Verified Endorsements Section (Topluluk Tavsiye Notları - No Star Revenge) */}
      <section
        className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-6 sm:p-8 space-y-6 shadow-sm"
        aria-label={isTr ? "Doğrulanmış Tavsiyeler" : "Verified Endorsements"}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-400" aria-hidden="true" />
              <span>
                {isTr ? "Doğrulanmış Topluluk Tavsiyeleri" : "Verified Community Endorsements"}
              </span>
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              {isTr
                ? "Yıldızlı intikam puanlamaları yerine, başarıyla tamamlanan projeler sonrasında bırakılan 1 paragraflık doğrulanmış mektuplar."
                : "Instead of revenge star ratings, verified 1-paragraph testimonial letters left upon mutual project completion."}
            </p>
          </div>
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
            {profile.endorsements?.length ?? 0}
          </Badge>
        </div>

        {!profile.endorsements || profile.endorsements.length === 0 ? (
          <EmptyState
            title={isTr ? "Henüz tavsiye mektubu bırakılmamış" : "No verified endorsements yet"}
            description={
              isTr
                ? "Bu uzman ile bir proje tamamlandığında karşılıklı doğrulanmış tavsiye mektubu bırakılabilir."
                : "Once an engagement is mutually completed, both parties can leave verified recommendation letters."
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.endorsements.map((item) => {
              const compDate = new Date(item.createdAt);
              const formattedDate = new Intl.DateTimeFormat(isTr ? "tr-TR" : "en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              }).format(compDate);

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] p-5 space-y-3 flex flex-col justify-between relative group hover:border-amber-500/30 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <ShieldCheck className="h-3 w-3" />
                        {isTr ? "Doğrulanmış İş Birliği" : "Verified Engagement"}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-tertiary)]">
                        {formattedDate}
                      </span>
                    </div>

                    <div className="relative pl-5 text-xs text-[var(--color-text-primary)] leading-relaxed italic border-l-2 border-amber-500/40 py-0.5">
                      <Quote className="h-3 w-3 text-amber-400/50 absolute -left-1.5 -top-1" />"
                      {item.content}"
                    </div>
                  </div>

                  <div className="border-t border-[var(--color-border-subtle)] pt-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <AvatarInitials name={item.authorDisplayName} size="sm" />
                      <div>
                        <Link
                          href={getLocalizedProfilePath(item.authorHandle, locale)}
                          className="font-medium text-[var(--color-text-primary)] hover:text-amber-400 transition-colors block text-xs"
                        >
                          {item.authorDisplayName}
                        </Link>
                        <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">
                          @{item.authorHandle}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] text-[var(--color-text-tertiary)] max-w-[130px] truncate text-right font-medium">
                      {item.projectTitle}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Completed Work History (Only bilateral mutual completions) */}
      <section
        className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-6 sm:p-8 space-y-6 shadow-sm"
        aria-label={isTr ? "Tamamlanan Projeler" : "Completed Projects"}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden="true" />
              <span>
                {isTr ? "Doğrulanmış Tamamlanan Projeler" : "Verified Completed Projects"}
              </span>
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              {isTr
                ? "Yalnızca her iki tarafça karşılıklı onaylanan başarıyla tamamlanmış işler. Satın alınamaz veya sahte oluşturulamaz."
                : "Only mutually confirmed completed engagements appear here. Cryptographically verifiable, cannot be faked."}
            </p>
          </div>
          <Badge variant="secondary">{profile.completedWork?.length ?? 0}</Badge>
        </div>

        {!profile.completedWork || profile.completedWork.length === 0 ? (
          <EmptyState
            title={
              isTr ? "Henüz tamamlanmış proje kaydı bulunmuyor" : "No completed project records yet"
            }
            description={
              isTr
                ? "Bu uzman platformda yeni veya işleri şu an aktif geliştirme aşamasında. Hemen ücretsiz bir ilan oluşturarak ilk iş birliğini siz başlatabilirsiniz."
                : "This specialist is active on the platform. Publish a free listing to start the first direct collaboration."
            }
            action={
              <Link href={isTr ? "/tr/ilanlar/yeni" : "/en/listings/new"}>
                <Button variant="secondary" size="sm">
                  {isTr ? "İlan Oluştur" : "Post a Listing"}
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {profile.completedWork.map((work) => {
              const compDate = new Date(work.completedAt);
              const formattedDate = new Intl.DateTimeFormat(isTr ? "tr-TR" : "en-US", {
                year: "numeric",
                month: "short",
              }).format(compDate);

              return (
                <div
                  key={work.engagementId}
                  className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-[var(--color-text-primary)]">
                      {work.title}
                    </span>
                    <Badge variant="outline" size="sm">
                      {work.category}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)] pt-1">
                    <span>
                      {isTr ? "Tamamlanma:" : "Completed:"} {formattedDate}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[var(--color-text-tertiary)]">
                        {isTr ? "İş Ortağı:" : "Counterparty:"}
                      </span>
                      {!work.counterparty.isDeleted ? (
                        <Link
                          href={getLocalizedProfilePath(work.counterparty.handle, locale)}
                          className="font-medium text-[var(--color-accent-primary)] hover:underline"
                        >
                          {work.counterparty.displayName}
                        </Link>
                      ) : (
                        <span className="text-[var(--color-text-tertiary)] italic">
                          {work.counterparty.displayName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
