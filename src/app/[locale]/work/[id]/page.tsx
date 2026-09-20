import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Handshake, MessageSquare, CheckCircle2, ShieldCheck } from "lucide-react";
import { getSession } from "@/src/modules/auth/session";
import { ProfileService } from "@/src/modules/profiles/service";
import { EngagementService } from "@/src/modules/engagements/service";
import { MatchDetailsView } from "@/src/components/engagements/match-details-view";
import { serializeJsonLd } from "@/src/lib/security/json-ld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const isTr = locale === "tr";

  return {
    title: isTr ? "Ortak Çalışma Alanı & Doğrudan İletişim" : "Collaboration Workspace & Contact",
    description: isTr
      ? "Kabul edilen teklif detayları, doğrulanmış iletişim bilgileri ve karşılıklı tamamlama çalışma alanı."
      : "Accepted offer details, verified contact channels, and bilateral mutual completion workspace.",
    alternates: {
      canonical: isTr ? `/tr/calisma-alani/${id}` : `/en/workspace/${id}`,
      languages: {
        tr: `/tr/calisma-alani/${id}`,
        en: `/en/workspace/${id}`,
      },
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export const dynamic = "force-dynamic";

function getEstimatedDurationUnitLabel(unit: string, isTr: boolean): string {
  if (unit === "DAYS") {
    return isTr ? "gün" : "days";
  }
  if (unit === "WEEKS") {
    return isTr ? "hafta" : "weeks";
  }
  return isTr ? "ay" : "months";
}

export default async function MatchPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const isTr = locale === "tr";
  const session = await getSession();

  if (!session?.userId) {
    redirect(isTr ? "/tr/giris" : "/en/login");
  }

  const currentProfile = await ProfileService.getProfileByUserId(session.userId);
  const currentUser = {
    displayName: currentProfile?.displayName || session.email.split("@")[0],
    email: session.email,
  };

  let workspace;
  try {
    workspace = await EngagementService.getEngagementDetails(session.userId, id);
  } catch {
    workspace = null;
  }

  if (!workspace) {
    notFound();
  }

  const { engagement, listing, acceptedOffer, counterpartyContact, completionMarks } = workspace;

  const userMark = completionMarks.find((m: { userId: string }) => m.userId === session.userId);
  const counterpartyMark = completionMarks.find(
    (m: { userId: string }) => m.userId !== session.userId
  );

  // Format budget label
  let budgetLabel: string | null = null;
  if (acceptedOffer.budgetMin && acceptedOffer.budgetMax) {
    budgetLabel = `${parseFloat(acceptedOffer.budgetMin).toLocaleString(isTr ? "tr-TR" : "en-US")} – ${parseFloat(acceptedOffer.budgetMax).toLocaleString(isTr ? "tr-TR" : "en-US")} ${acceptedOffer.budgetCurrency ?? ""}`;
  } else if (acceptedOffer.budgetMin) {
    budgetLabel = `${parseFloat(acceptedOffer.budgetMin).toLocaleString(isTr ? "tr-TR" : "en-US")} ${acceptedOffer.budgetCurrency ?? ""}`;
  }

  // Format timeline label
  let timelineLabel: string | null = null;
  if (acceptedOffer.estimatedDurationValue && acceptedOffer.estimatedDurationUnit) {
    const unitLabel = getEstimatedDurationUnitLabel(acceptedOffer.estimatedDurationUnit, isTr);
    timelineLabel = `~${acceptedOffer.estimatedDurationValue} ${unitLabel}`;
  }

  const counterparty = counterpartyContact ?? {
    userId: "unknown",
    displayName: isTr ? "Eski Kullanıcı" : "Former User",
    handle: "deleted",
    email: "—",
    phone: null,
  };

  const workspaceUrl = isTr
    ? `https://operis.pro/tr/calisma-alani/${id}`
    : `https://operis.pro/en/workspace/${id}`;

  const jsonLd = {
    "@context": "https://schema.org",
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
        name: isTr ? "İlanlarım" : "My Listings",
        item: `https://operis.pro${isTr ? "/tr/panel/ilanlarim" : "/en/dashboard/listings"}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: isTr ? "Çalışma Alanı" : "Workspace",
        item: workspaceUrl,
      },
    ],
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      {/* Bilateral Engagement Guidance Banner */}
      <section
        aria-label={isTr ? "Eşleşme Süreci Rehberi" : "Match Process Guide"}
        className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Handshake className="h-5 w-5 text-blue-400" aria-hidden="true" />
            <h1 className="text-base font-bold text-[var(--color-text-primary)]">
              {isTr ? "Doğrudan Proje Çalışma Alanı" : "Direct Project Workspace"}
            </h1>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            <span>{isTr ? "%0 Komisyon" : "Zero Fee"}</span>
          </span>
        </div>

        {/* 3 Step Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-4 text-xs space-y-1.5 transition-all duration-300 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5">
            <div className="flex items-center gap-2 font-semibold text-[var(--color-text-primary)]">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span>{isTr ? "1. Doğrudan İletişim" : "1. Direct Communication"}</span>
            </div>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              {isTr
                ? "Açılan e-posta ve telefon üzerinden proje gereksinimlerini doğrudan netleştirin."
                : "Clarify scope directly via verified email and phone contact channels."}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-4 text-xs space-y-1.5 transition-all duration-300 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5 hover:-translate-y-0.5">
            <div className="flex items-center gap-2 font-semibold text-[var(--color-text-primary)]">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span>{isTr ? "2. Bağımsız Teslimat" : "2. Autonomous Delivery"}</span>
            </div>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              {isTr
                ? "İş ve ödeme koşullarınızı kendi aranızda belirleyerek projeyi tamamlayın."
                : "Deliver work and process payments on your own agreed terms."}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-4 text-xs space-y-1.5 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5">
            <div className="flex items-center gap-2 font-semibold text-[var(--color-text-primary)]">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span>{isTr ? "3. Karşılıklı Onay" : "3. Bilateral Confirmation"}</span>
            </div>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              {isTr
                ? "İki taraf da tamamlandı onayı verdiğinde profilinize doğrulanmış iş olarak işlenir."
                : "When both parties mark complete, it is permanently verified on your profile."}
            </p>
          </div>
        </div>
      </section>

      {/* Match Details Component */}
      <MatchDetailsView
        engagementId={id}
        listingTitle={listing?.title ?? (isTr ? "Eşleşen Proje" : "Matched Project")}
        category={engagement.listingCategorySnapshot ?? "Technology"}
        matchedAt={engagement.matchedAt}
        status={engagement.status}
        offerMessage={acceptedOffer.message}
        budgetLabel={budgetLabel}
        timelineLabel={timelineLabel}
        counterparty={counterparty}
        currentUser={currentUser}
        currentUserId={session.userId}
        ownerUserId={engagement.ownerUserId}
        isCompleted={engagement.status === "COMPLETED"}
        userCompletionStatus={userMark?.status ?? null}
        counterpartyCompletionStatus={counterpartyMark?.status ?? null}
        initialEndorsements={workspace.endorsements ?? []}
        locale={locale}
      />
    </main>
  );
}
