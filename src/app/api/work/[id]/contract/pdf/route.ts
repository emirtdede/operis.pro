import { GET as contractGet } from "../route";
import { handleApiError } from "@/src/lib/api/error-response";

/**
 * Dedicated direct Vector PDF download endpoint for contracts.
 * Query params supported:
 * - lang: "tr" | "en" | "bilingual" (default: "bilingual")
 * - prevalence: "tr" | "en" (default: "tr")
 */
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const isEn = req.headers.get("x-locale") === "en";

  try {
    const url = new URL(req.url);
    // Default to bilingual vector PDF if not specified
    if (!url.searchParams.has("lang")) {
      url.searchParams.set("lang", "bilingual");
    }
    url.searchParams.set("format", "pdf");

    const forwardReq = new Request(url.toString(), {
      method: "GET",
      headers: req.headers,
    });

    return await contractGet(forwardReq, context);
  } catch (error: unknown) {
    return handleApiError(
      error,
      {
        en: "Failed to generate contract PDF",
        tr: "Sözleşme PDF belgesi oluşturulamadı",
      },
      { isEn, logPrefix: "[Contract PDF Error]", status: 500 }
    );
  }
}
