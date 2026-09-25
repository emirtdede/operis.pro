import type { Metadata } from "next";
import "@/src/styles/tokens.css";
import { LivingBackground } from "@/src/components/ui/living-background";

import { ThemeScript } from "@/src/components/layout/theme-provider";

export const metadata: Metadata = {
  title: "Operis — Komisyonsuz Freelance Yazılım Platformu",
  description: "Aracısız ve %0 komisyonlu serbest çalışma ağı. Yazılım ve teknoloji profesyonelleriyle doğrudan iletişim kurun, güvenle iş birliği yapın.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="tr"
      dir="ltr"
      className="dark scroll-smooth md:snap-y md:snap-proximity"
      data-theme="dark"
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="relative min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] antialiased transition-colors selection:bg-blue-500/20 selection:text-blue-500 overflow-x-hidden">
        <LivingBackground />
        <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
      </body>
    </html>
  );
}
