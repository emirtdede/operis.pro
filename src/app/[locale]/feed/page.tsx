import { redirect } from "next/navigation";
import { getLocalizedRoute } from "@/src/lib/i18n/routes";

export const dynamic = "force-dynamic";

export default async function FeedPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const basePath = getLocalizedRoute("listings", locale);

  const query = new URLSearchParams();
  query.set("view", "stream");

  for (const [key, val] of Object.entries(sp)) {
    if (val && key !== "view") {
      query.set(key, val);
    }
  }

  const queryString = query.toString();
  redirect(`${basePath}${queryString ? `?${queryString}` : ""}`);
}
