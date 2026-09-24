"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";

/**
 * Ensures Operis custom session (fp_session) is 100% synchronized with Clerk.
 * If user is authenticated via Clerk but fp_session cookie is missing,
 * automatically self-heals by invoking /api/auth/clerk-sync in the background.
 */
export function ClerkSessionSync() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return;

    // Check if fp_session cookie exists in browser
    const hasFpSession = typeof document !== "undefined" && document.cookie.includes("fp_session=");

    if (!hasFpSession && !hasSyncedRef.current) {
      hasSyncedRef.current = true;
      fetch("/api/auth/clerk-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkUserId: userId }),
      })
        .then((res) => {
          if (!res.ok) {
            hasSyncedRef.current = false;
          }
        })
        .catch(() => {
          hasSyncedRef.current = false;
        });
    }
  }, [isLoaded, isSignedIn, userId]);

  return null;
}
