"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "black";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "fp_theme_pref";
const THEME_COOKIE_KEY = "fp_theme";

export function ThemeScript() {
  const code = `(function() {
    try {
      const cookieTheme = document.cookie.match(/(?:^|; )fp_theme=([^;]*)/);
      let theme = cookieTheme ? decodeURIComponent(cookieTheme[1]) : null;
      if (!theme) {
        theme = localStorage.getItem("${THEME_STORAGE_KEY}") || localStorage.getItem("fp_theme");
      }
      if (!theme || (theme !== "light" && theme !== "dark" && theme !== "black")) {
        theme = "dark";
      }
      document.documentElement.setAttribute("data-theme", theme);
      if (theme === "dark" || theme === "black") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch (e) {}
  })();`;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);

  useEffect(() => {
    try {
      const cookieMatch = document.cookie.match(/(?:^|; )fp_theme=([^;]*)/);
      const cookieTheme = cookieMatch?.[1] ? (decodeURIComponent(cookieMatch[1]) as Theme) : null;
      const stored = (cookieTheme ||
        localStorage.getItem(THEME_STORAGE_KEY) ||
        localStorage.getItem("fp_theme")) as Theme | null;
      const finalTheme =
        stored && (stored === "light" || stored === "dark" || stored === "black") ? stored : "dark";
      setThemeState(finalTheme);
      document.documentElement.setAttribute("data-theme", finalTheme);
      if (finalTheme === "dark" || finalTheme === "black") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch {
      // Ignored in SSR or restricted storage environments
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      localStorage.setItem("fp_theme", newTheme);
      document.cookie = `${THEME_COOKIE_KEY}=${encodeURIComponent(newTheme)}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.setAttribute("data-theme", newTheme);
      if (newTheme === "dark" || newTheme === "black") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch {
      // Ignored
    }
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
