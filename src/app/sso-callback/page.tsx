import { Suspense } from "react";
import { OperisClerkProvider } from "@/src/components/auth/clerk-provider-wrapper";
import { SSOCallbackHandler } from "@/src/components/auth/sso-callback-handler";

export const dynamic = "force-dynamic";

export default function RootSSOCallbackPage() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 px-4 text-center">
        <p className="text-sm font-medium text-slate-300">
          Kimlik doğrulama anahtarı eksik.
        </p>
      </div>
    );
  }

  return (
    <OperisClerkProvider locale="tr">
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 px-4 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <p className="text-sm font-medium text-slate-300">
              Yetkilendirme tamamlanıyor, lütfen bekleyin...
            </p>
          </div>
        }
      >
        <SSOCallbackHandler />
      </Suspense>
    </OperisClerkProvider>
  );
}

