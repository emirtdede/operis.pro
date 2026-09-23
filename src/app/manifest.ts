import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Operis — Doğrudan & Komisyonsuz Yazılım İlanları",
    short_name: "Operis",
    description:
      "Türkiye ve küresel teknoloji profesyonelleri için doğrudan ve güvenli serbest çalışma platformu. Komisyon yok, aracı yok, %100 doğrudan iş birliği.",
    start_url: "/",
    display: "standalone",
    background_color: "#141517",
    theme_color: "#141517",
    icons: [
      {
        src: "/icon-48x48.png",
        sizes: "48x48",
        type: "image/png",
      },
      {
        src: "/icon-96x96.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
