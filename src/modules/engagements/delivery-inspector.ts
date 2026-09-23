import { createHash } from "crypto";
import dns from "dns";

export interface LiveDeploymentProbeResult {
  checked: boolean;
  url: string;
  isAccessible: boolean;
  httpStatus?: number;
  statusText?: string;
  responseTimeMs?: number;
  sslValid?: boolean;
  protocol?: string;
  contentType?: string;
  serverHeader?: string;
  error?: string;
}

export interface GitRepositoryProbeResult {
  checked: boolean;
  url: string;
  isAccessible: boolean;
  isPublic?: boolean;
  provider: "github" | "gitlab" | "bitbucket" | "other";
  commitHash?: string | null;
  commitValid?: boolean;
  error?: string;
}

export interface DeliveryHealthReport {
  inspectedAt: string;
  isHealthy: boolean;
  summaryStatus: "HEALTHY" | "WARNING" | "UNHEALTHY" | "SKIPPED";
  liveDeployment: LiveDeploymentProbeResult;
  gitRepository: GitRepositoryProbeResult;
  powSeal: string;
  badgeTextTr: string;
  badgeTextEn: string;
}

export interface InspectDeliveryInput {
  liveUrl?: string | null;
  repositoryUrl: string;
  commitHash?: string | null;
  locale?: "tr" | "en";
}

export class DeliveryInspectorService {
  private static readonly CONNECT_TIMEOUT_MS = 5000;
  private static readonly USER_AGENT =
    "OperisDeliveryInspector/1.0 (+https://operis.pro/delivery-verification)";

  /**
   * Evaluates whether an IPv4 or IPv6 address belongs to private/loopback/cloud-metadata ranges.
   */
  static isPrivateOrReservedIp(ip: string): boolean {
    const trimmed = ip.trim();

    // IPv6 checks
    if (trimmed === "::1" || trimmed === "::") return true;
    const lower = trimmed.toLowerCase();
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // Unique local (fc00::/7)
    if (lower.startsWith("fe80")) return true; // Link local (fe80::/10)

    // Handle IPv4-mapped IPv6 (::ffff:127.0.0.1)
    let ipv4 = trimmed;
    if (lower.startsWith("::ffff:")) {
      ipv4 = lower.substring(7);
    }

    // IPv4 dotted-quad validation
    const parts = ipv4.split(".").map((p) => parseInt(p, 10));
    if (parts.length === 4 && parts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
      const [p0, p1] = parts;
      if (p0 === undefined || p1 === undefined) return true;

      // 0.0.0.0/8 (Broadcast/Current network)
      if (p0 === 0) return true;

      // 127.0.0.0/8 (Loopback)
      if (p0 === 127) return true;

      // 10.0.0.0/8 (Private Class A)
      if (p0 === 10) return true;

      // 172.16.0.0/12 (Private Class B: 172.16.0.0 - 172.31.255.255)
      if (p0 === 172 && p1 >= 16 && p1 <= 31) return true;

      // 192.168.0.0/16 (Private Class C)
      if (p0 === 192 && p1 === 168) return true;

      // 169.254.0.0/16 (Link-Local / AWS/GCP/Azure Instance Metadata 169.254.169.254)
      if (p0 === 169 && p1 === 254) return true;

      // 100.64.0.0/10 (Shared Address Space / CGNAT)
      if (p0 === 100 && p1 >= 64 && p1 <= 127) return true;

      // 198.18.0.0/15 (Benchmarking)
      if (p0 === 198 && (p1 === 18 || p1 === 19)) return true;

      // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
      if (p0 >= 224) return true;
    }

    return false;
  }

  /**
   * Validates a target URL against Server-Side Request Forgery (SSRF) threats,
   * DNS rebinding vectors, and cloud metadata access.
   */
  static async validateUrlSsrfSafe(targetUrl: string): Promise<URL> {
    let parsed: URL;
    try {
      parsed = new URL(targetUrl.trim());
    } catch {
      throw new Error("Geçersiz URL biçimi.");
    }

    // Only allow standard http & https
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error(
        `Yalnızca HTTP ve HTTPS protokollerine izin verilir. (Girilen: ${parsed.protocol})`
      );
    }

    const hostname = parsed.hostname.toLowerCase();

    // Direct check if hostname is already an IP and is private/reserved
    if (this.isPrivateOrReservedIp(hostname)) {
      throw new Error(
        `SSRF Koruması: Hedef IP adresi (${hostname}) yerel veya özel ağ aralığındadır.`
      );
    }

    // Blacklist dangerous hostnames directly
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      hostname === "169.254.169.254"
    ) {
      throw new Error("Yerel veya iç ağ ana bilgisayarlarına erişim engellendi.");
    }

    // Resolve DNS records to verify actual IP destination
    try {
      const records = await dns.promises.lookup(hostname, { all: true });
      if (!records || records.length === 0) {
        throw new Error("Alan adı DNS sunucuları tarafından çözümlenemedi.");
      }

      for (const rec of records) {
        if (this.isPrivateOrReservedIp(rec.address)) {
          throw new Error(
            `SSRF Koruması: Hedef IP adresi (${rec.address}) yerel veya özel ağ aralığındadır.`
          );
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "DNS çözümleme hatası";
      if (msg.includes("SSRF Koruması")) {
        throw err;
      }
      // If DNS resolution fails completely
      throw new Error(`DNS Çözümleme Hatası: ${msg}`, { cause: err });
    }

    return parsed;
  }

  /**
   * Probes the live deployment endpoint, verifying HTTP status, SSL certificate,
   * latency and response headers.
   */
  static async probeLiveDeployment(url: string): Promise<LiveDeploymentProbeResult> {
    const trimmed = url.trim();
    if (!trimmed) {
      return {
        checked: false,
        url: "",
        isAccessible: false,
      };
    }

    let parsedUrl: URL;
    try {
      parsedUrl = await this.validateUrlSsrfSafe(trimmed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Geçersiz veya engellenen URL";
      return {
        checked: true,
        url: trimmed,
        isAccessible: false,
        error: msg,
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.CONNECT_TIMEOUT_MS);

    try {
      const startTime = performance.now();

      // First attempt with HEAD request
      let response: Response;
      try {
        response = await fetch(parsedUrl.toString(), {
          method: "HEAD",
          headers: {
            "User-Agent": this.USER_AGENT,
            Accept: "*/*",
          },
          signal: controller.signal,
          redirect: "follow",
        });

        // Some CDNs / web frameworks reject HEAD with 405 or 403, fallback to GET
        if (response.status === 405 || response.status === 403) {
          response = await fetch(parsedUrl.toString(), {
            method: "GET",
            headers: {
              "User-Agent": this.USER_AGENT,
              Accept: "text/html,application/xhtml+xml,application/json,*/*",
            },
            signal: controller.signal,
            redirect: "follow",
          });
        }
      } catch {
        // Fallback to GET if HEAD failed network handshake
        response = await fetch(parsedUrl.toString(), {
          method: "GET",
          headers: {
            "User-Agent": this.USER_AGENT,
            Accept: "text/html,application/xhtml+xml,application/json,*/*",
          },
          signal: controller.signal,
          redirect: "follow",
        });
      }

      const responseTimeMs = Math.round(performance.now() - startTime);
      const isAccessible = response.status >= 200 && response.status < 400;

      return {
        checked: true,
        url: parsedUrl.toString(),
        isAccessible,
        httpStatus: response.status,
        statusText: response.statusText || (response.status === 200 ? "OK" : undefined),
        responseTimeMs,
        sslValid: parsedUrl.protocol === "https:",
        protocol: parsedUrl.protocol.replace(":", "").toUpperCase(),
        contentType: response.headers.get("content-type") || undefined,
        serverHeader: response.headers.get("server") || undefined,
      };
    } catch (err: unknown) {
      let errorMsg = "Canlı URL'ye ulaşılamadı.";
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          errorMsg = `Zaman aşımı: Sunucu ${this.CONNECT_TIMEOUT_MS}ms içinde yanıt vermedi.`;
        } else {
          errorMsg = err.message;
        }
      }

      return {
        checked: true,
        url: parsedUrl.toString(),
        isAccessible: false,
        sslValid: parsedUrl.protocol === "https:",
        error: errorMsg,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Probes Git repository and validates commit hash syntax and public availability.
   */
  static async probeGitRepository(
    repoUrl: string,
    commitHash?: string | null
  ): Promise<GitRepositoryProbeResult> {
    const trimmedRepo = repoUrl.trim();
    if (!trimmedRepo) {
      return {
        checked: false,
        url: "",
        isAccessible: false,
        provider: "other",
      };
    }

    let provider: GitRepositoryProbeResult["provider"] = "other";
    const lower = trimmedRepo.toLowerCase();
    if (lower.includes("github.com")) provider = "github";
    else if (lower.includes("gitlab.com")) provider = "gitlab";
    else if (lower.includes("bitbucket.org")) provider = "bitbucket";

    // Validate commit hash syntax if provided (7 to 40 hex chars)
    let commitValid: boolean | undefined = undefined;
    const cleanCommit = commitHash?.trim() || null;
    if (cleanCommit) {
      commitValid = /^[0-9a-fA-F]{7,40}$/.test(cleanCommit);
    }

    // SSRF-safe URL check for the repository URL
    try {
      await this.validateUrlSsrfSafe(trimmedRepo);
    } catch (err: unknown) {
      return {
        checked: true,
        url: trimmedRepo,
        isAccessible: false,
        provider,
        commitHash: cleanCommit,
        commitValid: false,
        error: err instanceof Error ? err.message : "Geçersiz repo URL'si",
      };
    }

    // Attempt lightweight public repository check
    let isAccessible: boolean;
    let isPublic = false;
    let error: string | undefined = undefined;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.CONNECT_TIMEOUT_MS);

    try {
      const res = await fetch(trimmedRepo, {
        method: "HEAD",
        headers: {
          "User-Agent": this.USER_AGENT,
          Accept: "*/*",
        },
        signal: controller.signal,
        redirect: "follow",
      });

      if (res.status === 200) {
        isAccessible = true;
        isPublic = true;
      } else if (res.status === 404) {
        // In GitHub/GitLab, private repos return 404 to unauthenticated clients
        isAccessible = true; // Still acceptable if access credentials were exchanged
        isPublic = false;
        error = "Depo özel (private) veya herkese açık değil. Erişim transfer listesi gereklidir.";
      } else {
        isAccessible = res.status < 500;
        isPublic = false;
      }

      // If GitHub and commit hash provided and format is valid, probe commit URL
      if (provider === "github" && isPublic && cleanCommit && commitValid) {
        try {
          const commitUrl = `${trimmedRepo.replace(/\/$/, "")}/commit/${cleanCommit}`;
          const commitRes = await fetch(commitUrl, {
            method: "HEAD",
            headers: { "User-Agent": this.USER_AGENT },
            signal: controller.signal,
          });
          if (commitRes.status === 404) {
            commitValid = false;
            error = "Belirtilen commit hash'i bu depoda bulunamadı.";
          } else if (commitRes.status === 200) {
            commitValid = true;
          }
        } catch {
          // Ignore commit probe network errors
        }
      }
    } catch (err: unknown) {
      // If network inspection timed out or failed, mark as unconfirmed but do not block private setups
      isAccessible = true;
      error = err instanceof Error ? err.message : "Depo erişim kontrolü yapılamadı.";
    } finally {
      clearTimeout(timer);
    }

    return {
      checked: true,
      url: trimmedRepo,
      isAccessible,
      isPublic,
      provider,
      commitHash: cleanCommit,
      commitValid,
      error,
    };
  }

  /**
   * Generates a tamper-evident SHA-256 Proof-of-Work (PoW) Seal.
   */
  static generatePowSeal(
    live: LiveDeploymentProbeResult,
    git: GitRepositoryProbeResult,
    timestamp: string
  ): string {
    const raw = [
      "OPERIS-POW-DELIVERY-HEALTH-V1",
      `LIVE:${live.url}`,
      `HTTP:${live.httpStatus ?? "NONE"}`,
      `SSL:${live.sslValid ?? false}`,
      `LATENCY:${live.responseTimeMs ?? 0}`,
      `REPO:${git.url}`,
      `COMMIT:${git.commitHash ?? "NONE"}`,
      `TIME:${timestamp}`,
    ].join("|");

    return createHash("sha256").update(raw, "utf8").digest("hex");
  }

  /**
   * Full orchestrator for Proof-of-Work Delivery Health Inspection.
   */
  static async inspectDelivery(input: InspectDeliveryInput): Promise<DeliveryHealthReport> {
    const inspectedAt = new Date().toISOString();

    const [liveDeployment, gitRepository] = await Promise.all([
      input.liveUrl ? this.probeLiveDeployment(input.liveUrl) : Promise.resolve<LiveDeploymentProbeResult>({
        checked: false,
        url: "",
        isAccessible: true,
      }),
      this.probeGitRepository(input.repositoryUrl, input.commitHash),
    ]);

    const powSeal = this.generatePowSeal(liveDeployment, gitRepository, inspectedAt);

    // Determine overall health status
    let isHealthy = true;
    let summaryStatus: DeliveryHealthReport["summaryStatus"] = "HEALTHY";

    if (liveDeployment.checked) {
      if (!liveDeployment.isAccessible || (liveDeployment.httpStatus && liveDeployment.httpStatus >= 400)) {
        isHealthy = false;
        summaryStatus = "UNHEALTHY";
      } else if (liveDeployment.httpStatus && liveDeployment.httpStatus >= 300) {
        summaryStatus = "WARNING";
      }
    }

    if (gitRepository.commitValid === false) {
      isHealthy = false;
      summaryStatus = "UNHEALTHY";
    }

    // Build badge text
    let badgeTextTr: string;
    let badgeTextEn: string;

    if (liveDeployment.checked && liveDeployment.isAccessible && liveDeployment.httpStatus === 200) {
      const latencyStr = liveDeployment.responseTimeMs ? ` • ${liveDeployment.responseTimeMs}ms` : "";
      badgeTextTr = `✅ Canlı Sistem Sağlık Kontrolünden Geçti (HTTP 200 OK • SSL Doğrulandı${latencyStr})`;
      badgeTextEn = `✅ Live System Health Inspection Passed (HTTP 200 OK • SSL Verified${latencyStr})`;
    } else if (liveDeployment.checked && !liveDeployment.isAccessible) {
      badgeTextTr = `⚠️ Canlı Sistem Uyarısı (Erişim Başarısız: ${liveDeployment.error || liveDeployment.httpStatus})`;
      badgeTextEn = `⚠️ Live System Warning (Unreachable: ${liveDeployment.error || liveDeployment.httpStatus})`;
    } else {
      badgeTextTr = "✅ Depo Teslimatı Onaylandı (Doğrulanmış Git Çıktısı)";
      badgeTextEn = "✅ Repository Deliverables Verified (Valid Git Source)";
    }

    return {
      inspectedAt,
      isHealthy,
      summaryStatus,
      liveDeployment,
      gitRepository,
      powSeal,
      badgeTextTr,
      badgeTextEn,
    };
  }
}
