"use client";

import React from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { ClerkSessionSync } from "./clerk-session-sync";

export interface OperisClerkProviderProps {
  children: React.ReactNode;
  locale?: string;
}

export function OperisClerkProvider({ children, locale = "tr" }: OperisClerkProviderProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return <>{children}</>;
  }

  const isTr = locale === "tr";

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl={isTr ? "/tr/giris" : "/en/login"}
      signUpUrl={isTr ? "/tr/kayit" : "/en/register"}
    >
      <ClerkSessionSync />
      {children}
      <div id="clerk-captcha" />
    </ClerkProvider>
  );
}
