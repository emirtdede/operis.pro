export function resolveProxyProvider(env: NodeJS.ProcessEnv): "vercel" | "cloudflare" | "none" {
  const configured = env.TRUSTED_PROXY_PROVIDER?.trim().toLowerCase();
  const vercel = env.VERCEL === "1";
  if (configured && !["vercel", "cloudflare", "none"].includes(configured)) {
    throw new Error("Invalid TRUSTED_PROXY_PROVIDER");
  }
  if (vercel && configured && configured !== "vercel")
    throw new Error("Conflicting proxy providers");
  const provider = configured || (vercel ? "vercel" : "none");
  if (provider === "cloudflare" && !env.CLOUDFLARE_PROXY_SECRET?.trim()) {
    throw new Error("CLOUDFLARE_PROXY_SECRET is required for Cloudflare origin authentication");
  }
  return provider as "vercel" | "cloudflare" | "none";
}
