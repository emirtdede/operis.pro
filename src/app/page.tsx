import { permanentRedirect } from "next/navigation";
import { headers, cookies } from "next/headers";

function isExplicitEnglishPreferred(acceptLanguage: string | null): boolean {
  if (!acceptLanguage || acceptLanguage.trim().length === 0) {
    return false;
  }

  const lower = acceptLanguage.toLowerCase();
  // If user has tr in preferences, keep Turkish as primary
  if (lower.includes("tr")) {
    return false;
  }

  return lower.startsWith("en");
}

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value || cookieStore.get("fp_locale")?.value;

  if (cookieLocale === "en") {
    permanentRedirect("/en");
  }

  if (cookieLocale === "tr") {
    permanentRedirect("/tr");
  }

  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language");

  if (isExplicitEnglishPreferred(acceptLanguage)) {
    permanentRedirect("/en");
  }

  // Primary market default matches x-default: /tr
  permanentRedirect("/tr");
}

