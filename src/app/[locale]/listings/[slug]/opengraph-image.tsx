import { ImageResponse } from "next/og";
import { FeedService } from "@/src/modules/listings/feed/service";

export const alt = "Operis listing";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";
export const runtime = "nodejs";

export default async function ListingOpenGraphImage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const isTr = locale === "tr";
  const data = await FeedService.getListingBySlug(slug, undefined, undefined, locale).catch(
    () => null
  );
  const title = data?.listing.title ?? (isTr ? "Teknoloji İlanı" : "Technology Listing");
  const category = data?.categoryName ?? (isTr ? "Operis İlanları" : "Operis Listings");

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "linear-gradient(135deg, #081225 0%, #122447 55%, #173b67 100%)",
        color: "#f8fafc",
        padding: "72px 80px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", fontSize: 34, fontWeight: 700 }}>
        Operis
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            color: "#7dd3fc",
            fontSize: 26,
            fontWeight: 600,
            marginBottom: 22,
          }}
        >
          {category}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: title.length > 70 ? 46 : 58,
            fontWeight: 800,
            lineHeight: 1.12,
            letterSpacing: "-1.5px",
          }}
        >
          {title}
        </div>
      </div>
      <div style={{ display: "flex", color: "#cbd5e1", fontSize: 24 }}>
        {isTr ? "Doğrudan bağlantı · %0 komisyon" : "Direct connections · 0% commission"}
      </div>
    </div>,
    size
  );
}
