import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  HandoverGeneratorService,
  HandoverProtocolInput,
} from "@/src/modules/contracts/handover-generator";
import { HandoverService } from "@/src/modules/engagements/handover-service";
import { DEFAULT_USER } from "@/src/modules/auth/demo-user";
import * as sessionModule from "@/src/modules/auth/session";
import * as rateLimitModule from "@/src/lib/security/rate-limit";

describe("Proof of Delivery & Handover Protocol (TBK m. 474 & 477, FSEK m. 52, HMK m. 193)", () => {
  const sampleProtocolInput: HandoverProtocolInput = {
    engagementId: "eng-demo-101",
    listingTitle: "Next.js Kurumsal SaaS Mimarisi & API Entegrasyonu",
    category: "Web & SaaS Geliştirme",
    client: {
      displayName: "Operis İşveren",
      email: "employer@operis.dev",
      phone: "+905321112233",
      handle: "employer_pro",
      city: "İstanbul",
    },
    contractor: {
      displayName: "Ahmet Yılmaz",
      email: "ahmet@techcorp.com",
      phone: "+905429998877",
      handle: "ahmetyilmaz",
      city: "Ankara",
    },
    repositoryUrl: "https://github.com/techcorp/enterprise-nextjs-saas",
    commitHash: "e4b2a8f9c1d07e6b5a3f",
    liveUrl: "https://saas-demo.operis.dev",
    accessChecklist: {
      dnsTransferred: true,
      hostingTransferred: true,
      adminAccountsTransferred: true,
      apiKeysTransferred: true,
    },
    documentationNotes:
      "Tüm kaynak kodlar, Vercel/Supabase ortam değişkenleri ve veritabanı migration kılavuzu teslim edilmiştir.",
    status: "SUBMITTED",
    submittedAt: "2026-09-10T10:00:00Z",
    inspectionExpiresAt: "2026-09-20T10:00:00Z",
    acceptedAt: null,
    totalAgreedBudget: "45000",
    currency: "TRY",
    locale: "tr",
  };

  const createMockSession = (userId: string, email: string): sessionModule.SessionPayload => ({
    type: "SESSION",
    userId,
    email,
    role: "USER",
    status: "ACTIVE",
    authVersion: 1,
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 86400000,
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    HandoverService._resetInMemory();
    vi.spyOn(rateLimitModule, "evaluateSecurityAccessAsync").mockResolvedValue({
      allowed: true,
    } as unknown as Awaited<ReturnType<typeof rateLimitModule.evaluateSecurityAccessAsync>>);
  });

  describe("1. HandoverGeneratorService - Deterministic SHA-256 Seal & Legal Text", () => {
    it("generates deterministic SHA-256 cryptographic seal with 64 hex characters", () => {
      const seal1 = HandoverGeneratorService.calculateSha256("test-canonical-content");
      const seal2 = HandoverGeneratorService.calculateSha256("test-canonical-content");
      const differentSeal = HandoverGeneratorService.calculateSha256("test-canonical-content-modified");

      expect(seal1).toBeDefined();
      expect(seal1).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(seal1)).toBe(true);
      expect(seal1).toBe(seal2);
      expect(seal1).not.toBe(differentSeal);
    });

    it("generates complete Turkish statutory handover protocol with TBK m. 474, TBK m. 477 and FSEK m. 52", () => {
      const result = HandoverGeneratorService.generateProtocol(sampleProtocolInput);

      expect(result.protocolRef).toBe("OPR-TESLIM-ENGDEMO1");
      expect(result.sha256Seal).toHaveLength(64);
      expect(result.locale).toBe("tr");
      expect(result.metadata.tbk474ClauseIncluded).toBe(true);
      expect(result.metadata.tbk477TacitClauseIncluded).toBe(true);
      expect(result.metadata.fsekFinalTransferIncluded).toBe(true);
      expect(result.metadata.sha256Verified).toBe(true);

      const text = result.markdown;
      expect(text).toContain("TÜRK BORÇLAR KANUNU (TBK M. 474 VE M. 477)");
      expect(text).toContain("5846 SAYILI FSEK UYARINCA");
      expect(text).toContain("RESMİ YAZILIM ESERİ TESLİM-TESELLÜM VE KABUL TUTANAĞI");
      expect(text).toContain("MADDE 1 — TESLİM EDİLEN DİJİTAL ÇIKTILAR VE KAYNAK KODLAR");
      expect(text).toContain("https://github.com/techcorp/enterprise-nextjs-saas");
      expect(text).toContain("e4b2a8f9c1d07e6b5a3f");
      expect(text).toContain("MADDE 2 — ERİŞİM VE ALTYAPI DEVİR KONTROL LİSTESİ");
      expect(text).toContain("MADDE 3 — TBK M. 474 UYARINCA MUAYENE VE İHBAR REJİMİ");
      expect(text).toContain("MADDE 4 — TBK M. 477 UYARINCA ESERİN KABULÜ VE SORUMLULUĞUN DÜŞMESİ");
      expect(text).toContain("MADDE 5 — 5846 SAYILI FSEK M. 52 MALİ HAKLARIN KESİN İNTİKALİ");
      expect(text).toContain("MADDE 7 — HMK M. 193 ELEKTRONİK DELİL SÖZLEŞMESİ VE DİJİTAL MÜHÜR");
    });

    it("generates English statutory handover protocol for cross-border engagements", () => {
      const enInput: HandoverProtocolInput = {
        ...sampleProtocolInput,
        locale: "en",
      };

      const result = HandoverGeneratorService.generateProtocol(enInput);

      expect(result.locale).toBe("en");
      expect(result.markdown).toContain("OFFICIAL SOFTWARE HANDOVER & STATUTORY ACCEPTANCE PROTOCOL");
      expect(result.markdown).toContain("TURKISH CODE OF OBLIGATIONS (TBK ART. 474 & 477)");
      expect(result.markdown).toContain("ARTICLE 3 — STATUTORY INSPECTION REGIME (TBK ART. 474)");
      expect(result.markdown).toContain("ARTICLE 4 — DISCHARGE OF LIABILITY VIA ACCEPTANCE (TBK ART. 477)");
      expect(result.markdown).toContain("TBK Art. 477/2 - Tacit Acceptance");
      expect(result.htmlContent).toContain("@page { size: A4; margin: 20mm 15mm; }");
    });

    it("formats A4 antetli printable layout with watermark and signatures", () => {
      const result = HandoverGeneratorService.generateProtocol(sampleProtocolInput);

      expect(result.htmlContent).toContain("<!DOCTYPE html>");
      expect(result.htmlContent).toContain("RESMİ YAZILIM ESERİ TESLİM-TESELLÜM VE KABUL TUTANAĞI");
      expect(result.htmlContent).toContain(result.sha256Seal);
      expect(result.htmlContent).toContain("HMK m. 193 Uyarınca Dijital Teslimat Mührü");
      expect(result.htmlContent).toContain("@media print");
    });
  });

  describe("2. HandoverService - Lifecycle & Statutory 7-Business-Day Countdown", () => {
    it("calculates statutory inspection deadline 10 calendar days in future (7 business days)", () => {
      const now = new Date("2026-09-01T12:00:00Z");
      const deadline = HandoverService.calculateInspectionDeadline(now);

      const diffDays = Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(10);
    });

    it("allows freelancer to submit deliverables and initiates SUBMITTED state", async () => {
      const freelancerId = "u-techcorp-1";
      const submitted = await HandoverService.submitHandover(freelancerId, {
        engagementId: "eng-demo-101",
        repositoryUrl: "https://github.com/techcorp/nextjs-saas",
        commitHash: "c8f12a4",
        liveUrl: "https://saas-demo.operis.dev",
        documentationNotes: "Kurulum ve dağıtım adımları README içerisinde belirtilmiştir.",
        accessChecklist: {
          dnsTransferred: true,
          hostingTransferred: true,
          adminAccountsTransferred: true,
          apiKeysTransferred: true,
        },
      });

      expect(submitted.status).toBe("SUBMITTED");
      expect(submitted.freelancerUserId).toBe(freelancerId);
      expect(submitted.repositoryUrl).toBe("https://github.com/techcorp/nextjs-saas");
      expect(submitted.sha256Seal).toBeDefined();
      expect(submitted.inspectionExpiresAt).toBeDefined();

      const details = await HandoverService.getHandover(freelancerId, "eng-demo-101");
      expect(details).not.toBeNull();
      expect(details?.handover?.status).toBe("SUBMITTED");
      expect(details?.isFreelancer).toBe(true);
      expect(details?.canSubmit).toBe(true);
      expect(details?.canAccept).toBe(false); // only client can accept
    });

    it("rejects invalid repository URL during submission", async () => {
      await expect(
        HandoverService.submitHandover("u-techcorp-1", {
          engagementId: "eng-demo-101",
          repositoryUrl: "invalid-url-not-http",
          documentationNotes: "Kurulum açıklaması en az 10 karakter.",
          accessChecklist: {
            dnsTransferred: false,
            hostingTransferred: false,
            adminAccountsTransferred: false,
            apiKeysTransferred: false,
          },
        })
      ).rejects.toThrow("VALIDATION_ERROR");
    });

    it("rejects client attempting to submit freelancer deliverables (unauthorized)", async () => {
      const ownerUserId = DEFAULT_USER.id; // client
      await expect(
        HandoverService.submitHandover(ownerUserId, {
          engagementId: "eng-demo-101",
          repositoryUrl: "https://github.com/techcorp/repo",
          documentationNotes: "Kurulum açıklaması en az 10 karakter.",
          accessChecklist: {
            dnsTransferred: false,
            hostingTransferred: false,
            adminAccountsTransferred: false,
            apiKeysTransferred: false,
          },
        })
      ).rejects.toThrow("UNAUTHORIZED");
    });

    it("allows client to expressly accept deliverables (TBK m. 477/1 Açık Kabul)", async () => {
      // 1. Submit handover first
      await HandoverService.submitHandover("u-techcorp-1", {
        engagementId: "eng-demo-101",
        repositoryUrl: "https://github.com/techcorp/nextjs-saas",
        documentationNotes: "Tüm kaynak kodlar eksiksiz teslim edildi.",
        accessChecklist: {
          dnsTransferred: true,
          hostingTransferred: true,
          adminAccountsTransferred: true,
          apiKeysTransferred: true,
        },
      });

      // 2. Client expressly accepts
      const ownerUserId = DEFAULT_USER.id;
      const accepted = await HandoverService.acceptHandover(ownerUserId, "eng-demo-101");

      expect(accepted.status).toBe("ACCEPTED_EXPRESS");
      expect(accepted.acceptanceType).toBe("EXPRESS");
      expect(accepted.acceptedByUserId).toBe(ownerUserId);
      expect(accepted.acceptedAt).toBeDefined();

      // 3. Verify protocol reflects express acceptance
      const details = await HandoverService.getHandover(ownerUserId, "eng-demo-101");
      expect(details?.handover?.status).toBe("ACCEPTED_EXPRESS");
      expect(details?.protocol?.markdown).toContain("Açık Kabul Beyanı (TBK m. 477/1");
    });

    it("allows client to request revisions within the inspection window", async () => {
      // 1. Submit handover
      await HandoverService.submitHandover("u-techcorp-1", {
        engagementId: "eng-demo-101",
        repositoryUrl: "https://github.com/techcorp/nextjs-saas",
        documentationNotes: "İlk teslimat paketi.",
        accessChecklist: {
          dnsTransferred: true,
          hostingTransferred: true,
          adminAccountsTransferred: true,
          apiKeysTransferred: true,
        },
      });

      // 2. Client requests revision
      const ownerUserId = DEFAULT_USER.id;
      const revised = await HandoverService.requestRevision(ownerUserId, {
        engagementId: "eng-demo-101",
        revisionNotes: "Mobil arayüzde kırılma mevcut ve veritabanı migration komutu eksik.",
      });

      expect(revised.status).toBe("REVISION_REQUESTED");
      expect(revised.revisionNotes).toContain("Mobil arayüzde kırılma");

      const details = await HandoverService.getHandover("u-techcorp-1", "eng-demo-101");
      expect(details?.handover?.status).toBe("REVISION_REQUESTED");
      expect(details?.canSubmit).toBe(true); // freelancer can now re-submit
    });

    it("TBK m. 477 Tacit Statutory Acceptance: auto-promotes to ACCEPTED_TACIT when inspection window elapses", async () => {
      // 1. Submit handover
      await HandoverService.submitHandover("u-techcorp-1", {
        engagementId: "eng-demo-101",
        repositoryUrl: "https://github.com/techcorp/nextjs-saas",
        documentationNotes: "Teslimat yapıldı ve 7 iş günü muayene süresi geçti.",
        accessChecklist: {
          dnsTransferred: true,
          hostingTransferred: true,
          adminAccountsTransferred: true,
          apiKeysTransferred: true,
        },
      });

      // 2. Simulate time decay: Set inspectionExpiresAt in the past (e.g. 2 days ago)
      const currentHandover = (await HandoverService.getHandover("u-techcorp-1", "eng-demo-101"))?.handover;
      expect(currentHandover).toBeDefined();

      if (currentHandover) {
        currentHandover.inspectionExpiresAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      }

      // 3. Querying handover should now dynamically trigger TBK m. 477 tacit acceptance
      const resolved = await HandoverService.getHandover("u-techcorp-1", "eng-demo-101");
      expect(resolved?.handover?.status).toBe("ACCEPTED_TACIT");
      expect(resolved?.handover?.acceptanceType).toBe("TACIT");
      expect(resolved?.isInspectionExpired).toBe(true);
      expect(resolved?.inspectionRemainingMs).toBe(0);
      expect(resolved?.protocol?.markdown).toContain("Zımni/Örtülü Yasal Kabul (TBK m. 477/2");
    });

    it("rejects revision requests when inspection period has already expired (TBK m. 477 statutory bar)", async () => {
      // 1. Submit handover
      await HandoverService.submitHandover("u-techcorp-1", {
        engagementId: "eng-demo-101",
        repositoryUrl: "https://github.com/techcorp/nextjs-saas",
        documentationNotes: "Zaman aşımına uğrayacak teslimat.",
        accessChecklist: {
          dnsTransferred: true,
          hostingTransferred: true,
          adminAccountsTransferred: true,
          apiKeysTransferred: true,
        },
      });

      // 2. Backdate inspection expiration
      const currentHandover = (await HandoverService.getHandover("u-techcorp-1", "eng-demo-101"))?.handover;
      if (currentHandover) {
        currentHandover.inspectionExpiresAt = new Date(Date.now() - 1000);
      }

      // 3. Client revision request must be rejected under TBK m. 477
      const ownerUserId = DEFAULT_USER.id;
      await expect(
        HandoverService.requestRevision(ownerUserId, {
          engagementId: "eng-demo-101",
          revisionNotes: "Geç kalmış itiraz bildirimi.",
        })
      ).rejects.toThrow("INSPECTION_PERIOD_EXPIRED");
    });
  });

  describe("3. Handover API Routes (/api/work/[id]/handover and export)", () => {
    it("returns 401 when user is not authenticated", async () => {
      const { GET } = await import("@/src/app/api/work/[id]/handover/route");
      vi.spyOn(sessionModule, "getSession").mockResolvedValue(null);

      const req = new Request("https://operis.pro/api/work/eng-demo-101/handover");
      const res = await GET(req, { params: Promise.resolve({ id: "eng-demo-101" }) });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it("returns handover protocol details when authenticated", async () => {
      // Submit handover first
      await HandoverService.submitHandover("u-techcorp-1", {
        engagementId: "eng-demo-101",
        repositoryUrl: "https://github.com/techcorp/nextjs-saas",
        documentationNotes: "Tüm kaynak kodlar teslim edilmiştir.",
        accessChecklist: {
          dnsTransferred: true,
          hostingTransferred: true,
          adminAccountsTransferred: true,
          apiKeysTransferred: true,
        },
      });

      const { GET } = await import("@/src/app/api/work/[id]/handover/route");
      vi.spyOn(sessionModule, "getSession").mockResolvedValue(
        createMockSession(DEFAULT_USER.id, DEFAULT_USER.email)
      );

      const req = new Request("https://operis.pro/api/work/eng-demo-101/handover?lang=tr");
      const res = await GET(req, { params: Promise.resolve({ id: "eng-demo-101" }) });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.protocol).toBeDefined();
      expect(data.protocol.protocolRef).toContain("OPR-TESLIM");
    });

    it("handles SUBMIT, ACCEPT, and REVISION actions via POST", async () => {
      const { POST } = await import("@/src/app/api/work/[id]/handover/route");
      // Authenticate as freelancer
      vi.spyOn(sessionModule, "getSession").mockResolvedValue(
        createMockSession("u-techcorp-1", "ahmet@techcorp.com")
      );

      // Submit
      const submitReq = new Request("https://operis.pro/api/work/eng-demo-101/handover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBMIT",
          repositoryUrl: "https://github.com/techcorp/api-tested",
          documentationNotes: "API teslimat notları ve kurulum adımları.",
          accessChecklist: {
            dnsTransferred: true,
            hostingTransferred: true,
            adminAccountsTransferred: true,
            apiKeysTransferred: true,
          },
        }),
      });

      const submitRes = await POST(submitReq, { params: Promise.resolve({ id: "eng-demo-101" }) });
      expect(submitRes.status).toBe(200);
      const submitData = await submitRes.json();
      expect(submitData.success).toBe(true);
      expect(submitData.handover.status).toBe("SUBMITTED");

      // Now authenticate as employer and accept
      vi.spyOn(sessionModule, "getSession").mockResolvedValue(
        createMockSession(DEFAULT_USER.id, DEFAULT_USER.email)
      );

      const acceptReq = new Request("https://operis.pro/api/work/eng-demo-101/handover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ACCEPT" }),
      });

      const acceptRes = await POST(acceptReq, { params: Promise.resolve({ id: "eng-demo-101" }) });
      expect(acceptRes.status).toBe(200);
      const acceptData = await acceptRes.json();
      expect(acceptData.success).toBe(true);
      expect(acceptData.handover.status).toBe("ACCEPTED_EXPRESS");
    });

    it("exports handover protocol as markdown and HTML via export route", async () => {
      // Submit handover first
      await HandoverService.submitHandover("u-techcorp-1", {
        engagementId: "eng-demo-101",
        repositoryUrl: "https://github.com/techcorp/nextjs-saas",
        documentationNotes: "Tüm kaynak kodlar teslim edilmiştir.",
        accessChecklist: {
          dnsTransferred: true,
          hostingTransferred: true,
          adminAccountsTransferred: true,
          apiKeysTransferred: true,
        },
      });

      const { GET: ExportGET } = await import("@/src/app/api/work/[id]/handover/export/route");
      vi.spyOn(sessionModule, "getSession").mockResolvedValue(
        createMockSession(DEFAULT_USER.id, DEFAULT_USER.email)
      );

      // 1. Export as markdown
      const mdReq = new Request("https://operis.pro/api/work/eng-demo-101/handover/export?format=markdown&lang=tr");
      const mdRes = await ExportGET(mdReq, { params: Promise.resolve({ id: "eng-demo-101" }) });
      expect(mdRes.status).toBe(200);
      expect(mdRes.headers.get("Content-Type")).toContain("text/markdown");
      const mdContent = await mdRes.text();
      expect(mdContent).toContain("RESMİ YAZILIM ESERİ TESLİM-TESELLÜM VE KABUL TUTANAĞI");

      // 2. Export as printable HTML
      const htmlReq = new Request("https://operis.pro/api/work/eng-demo-101/handover/export?format=html&lang=tr");
      const htmlRes = await ExportGET(htmlReq, { params: Promise.resolve({ id: "eng-demo-101" }) });
      expect(htmlRes.status).toBe(200);
      expect(htmlRes.headers.get("Content-Type")).toContain("text/html");
      const htmlContent = await htmlRes.text();
      expect(htmlContent).toContain("<!DOCTYPE html>");
      expect(htmlContent).toContain("@page { size: A4");
    });
  });
});

