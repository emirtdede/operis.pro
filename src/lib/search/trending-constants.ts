/**
 * Client-safe Trending Searches Constants & Seeds
 * Pure TypeScript, zero server/database dependencies.
 */

export const SEED_TRENDING_SEARCHES: Record<string, string[]> = {
  tr: [
    "Next.js",
    "React",
    "TypeScript",
    "Tailwind CSS",
    "Yapay Zeka",
  ],
  en: [
    "Next.js",
    "React",
    "TypeScript",
    "Tailwind CSS",
    "AI / LLM",
  ],
};

export function getSeedTrending(locale: string = "tr"): string[] {
  return SEED_TRENDING_SEARCHES[locale] ?? SEED_TRENDING_SEARCHES.tr ?? [];
}
