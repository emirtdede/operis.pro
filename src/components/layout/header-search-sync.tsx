"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface HeaderSearchSyncProps {
  onQueryChange: (query: string) => void;
}

/**
 * Isolated search param sync component.
 * Synchronizes URL ?q= parameter to header state ONLY when the URL actually changes (navigation / back / forward),
 * without interfering with or overriding user keystrokes in the search input.
 */
export function HeaderSearchSync({ onQueryChange }: HeaderSearchSyncProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const lastSyncedUrlQueryRef = useRef<string | null>(null);
  const lastPathnameRef = useRef(pathname);

  const urlQuery = searchParams?.get("q") ?? "";

  useEffect(() => {
    const isListingsPage =
      pathname?.includes("/ilanlar") || pathname?.includes("/listings");

    if (isListingsPage) {
      // Only sync if the URL search parameter itself changed
      if (lastSyncedUrlQueryRef.current !== urlQuery) {
        lastSyncedUrlQueryRef.current = urlQuery;
        onQueryChange(urlQuery);
      }
    } else {
      // Navigated away from listings to another page: clear query once
      if (
        lastPathnameRef.current?.includes("/ilanlar") ||
        lastPathnameRef.current?.includes("/listings")
      ) {
        lastSyncedUrlQueryRef.current = null;
        onQueryChange("");
      }
    }

    lastPathnameRef.current = pathname;
  }, [pathname, urlQuery, onQueryChange]);

  return null;
}
