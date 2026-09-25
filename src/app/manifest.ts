import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Operis — Komisyonsuz Freelance Yazılım Platformu",
    short_name: "Operis",
    description:
      "Aracısız ve %0 komisyonlu serbest çalışma ağı. Yazılım ve teknoloji profesyonelleriyle doğrudan iletişim kurun, güvenle iş birliği yapın.",
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
