import { GET as contractGet } from "../route";

/**
 * Dedicated direct Vector PDF download endpoint for contracts.
 * Query params supported:
 * - lang: "tr" | "en" | "bilingual" (default: "bilingual")
 * - prevalence: "tr" | "en" (default: "tr")
 */
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
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

  return contractGet(forwardReq, context);
}
