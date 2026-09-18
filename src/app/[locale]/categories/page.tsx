import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getSession } from "@/src/modules/auth/session";
import { CategoryService } from "@/src/modules/categories/service";
import { CategoryListInteractive } from "@/src/components/categories/category-list-interactive";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = locale === "tr";

  const title = isTr
    ? "Freelance Sektörler & Uzmanlık Kategorileri | Operis"
    : "Freelance Sectors & Expertise Categories | Operis";
  const description = isTr
    ? "Yazılım, tasarım, pazarlama, yapay zeka, video, finans ve hukuk alanlarındaki kategorileri keşfedin, takip edin ve doğrudan ilanlara ulaşın."
    : "Discover and follow categories across software engineering, design, marketing, AI, video, finance, and legal to customize your direct listings feed.";

  return {
    title,
    description,
    alternates: {
      canonical: isTr ? "/tr/kategoriler" : "/en/categories",
      languages: {
        tr: "/tr/kategoriler",
        en: "/en/categories",
      },
    },
    openGraph: {
      title,
      description,
      url: isTr ? "/tr/kategoriler" : "/en/categories",
      siteName: "Operis",
      locale: isTr ? "tr_TR" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
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

export default async function CategoriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ sector?: string }>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialSector = resolvedSearchParams?.sector || "all";
  setRequestLocale(locale);

  const isTr = locale === "tr";
  const session = await getSession();
  const categories = await CategoryService.getAllCategories(
    isTr ? "tr" : "en",
    session?.userId
  ).catch(() => []);
  const initialFollowedIds = categories.filter((c) => c.isFollowed).map((c) => c.id);

  const categoriesUrl = isTr
    ? "https://operis.pro/tr/kategoriler"
    : "https://operis.pro/en/categories";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: isTr ? "Teknoloji Kategorileri" : "Technology Categories",
        description: isTr
          ? "Platform bünyesindeki tüm teknoloji ve yazılım uzmanlık kategorileri dizini."
          : "Complete directory of technology and software specialization categories.",
        url: categoriesUrl,
        inLanguage: locale,
        mainEntity: {
          "@type": "ItemList",
          itemListElement: categories.map((cat, idx) => ({
            "@type": "ListItem",
            position: idx + 1,
            name: cat.name,
            url: isTr
              ? `https://operis.pro/tr/ilanlar?category=${cat.slug}`
              : `https://operis.pro/en/listings?category=${cat.slug}`,
          })),
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
            name: isTr ? "Teknoloji Kategorileri" : "Categories",
            item: categoriesUrl,
          },
        ],
      },
    ],
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Centered Hero Header */}
      <header className="text-center max-w-4xl mx-auto space-y-4 pt-2 pb-2">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-tight sm:leading-tight">
          {isTr ? (
            <>
              Geleceğin Projelerini ve{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-blue-400 dark:via-indigo-300 dark:to-violet-400 bg-clip-text text-transparent">
                Doğru Yetenekleri
              </span>{" "}
              Keşfedin
            </>
          ) : (
            <>
              Discover Modern Projects &{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-blue-400 dark:via-indigo-300 dark:to-violet-400 bg-clip-text text-transparent">
                World-Class Talent
              </span>
            </>
          )}
        </h1>
        <p className="text-base sm:text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed">
          {isTr
            ? `Yazılımdan tasarıma, yapay zekadan dijital pazarlamaya 10 ana sektörde ${categories.length} uzmanlık alanını inceleyin. İlan akışınızı kişiselleştirin veya projeniz için en doğru yetenekle anında buluşun.`
            : `Explore ${categories.length} specialized categories across 10 major industries. Personalize your project feed, connect with top-tier freelance experts, or discover your next big opportunity.`}
        </p>
      </header>

      {/* Interactive Category List */}
      <section aria-label={isTr ? "Kategori Listesi" : "Category List"}>
        <CategoryListInteractive
          categories={categories}
          initialFollowedIds={initialFollowedIds}
          locale={locale}
          hasSession={Boolean(session?.userId)}
          initialSector={initialSector}
        />
      </section>
    </main>
  );
}
