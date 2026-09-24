"use client";

import { useState, useEffect, useCallback } from "react";

export interface FeedCustomizationSettings {
  // Left Panel Widgets
  showProfileCard: boolean;
  showWorkspaceShortcuts: boolean;
  showFollowedCategories: boolean;
  showQuickFilters?: boolean;

  // Right Panel Widgets
  showPublishCta: boolean;
  showTrendingTech: boolean;
  showSuggestedCategories: boolean;
  showFreshnessRadar?: boolean;
  showSafeHarborTrust?: boolean;

  // Feed Behavior
  defaultFeedMode: "all" | "following";
  density: "comfortable" | "compact";
}

export const DEFAULT_FEED_CUSTOMIZATION: FeedCustomizationSettings = {
  showProfileCard: true,
  showWorkspaceShortcuts: true,
  showFollowedCategories: true,
  showQuickFilters: false,
  showPublishCta: true,
  showTrendingTech: true,
  showSuggestedCategories: true,
  showFreshnessRadar: false,
  showSafeHarborTrust: false,
  defaultFeedMode: "all",
  density: "comfortable",
};

const STORAGE_KEY = "operis_feed_customization_v1";

export function useFeedCustomization() {
  const [settings, setSettings] = useState<FeedCustomizationSettings>(DEFAULT_FEED_CUSTOMIZATION);
  const [isMounted, setIsMounted] = useState(false);

  // Load from localStorage on mount (prevents SSR hydration mismatch)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // Fallback to defaults
    } finally {
      setIsMounted(true);
    }
  }, []);

  const updateSettings = useCallback((newSettings: Partial<FeedCustomizationSettings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {
        // Non-blocking
      }
      return merged;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_FEED_CUSTOMIZATION);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Non-blocking
    }
  }, []);

  return {
    settings,
    isMounted,
    updateSettings,
    resetSettings,
  };
}
