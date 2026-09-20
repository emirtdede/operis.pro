import { describe, it, expect } from "vitest";
import {
  IpAssignmentDeedEngine,
  STATUTORY_ECONOMIC_RIGHTS,
} from "@/src/modules/engagements/ip-assignment/ip-assignment-engine";
import type {
  GenerateIpDeedInput,
  IpAssignmentDeed,
  StatutoryEconomicRight,
} from "@/src/modules/engagements/ip-assignment/ip-assignment-types";

describe("IpAssignmentDeedEngine (FSEK m. 48-52 IP Assignment Deed)", () => {
  const sampleInput: GenerateIpDeedInput = {
    engagementId: "eng-fintech-2026",
    listingTitle: "Mobil Bankacılık & Ödeme Altyapısı",
    milestoneId: "ms-01",
    milestoneSequence: 1,
    milestoneTitle: "Faz 1: Çekirdek Bankacılık API ve Veri Modeli",
    milestoneDescription: "PostgreSQL şeması, Drizzle modelleri ve FAST transfer uç noktaları.",
    amount: 45000,
    currency: "TRY",
    repositoryUrl: "https://github.com/operis-client/core-banking",
    gitCommitHash: "7f8a9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a",
    deliverableUrl: "https://github.com/operis-client/core-banking/commit/7f8a9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a",
    deliverableUrlType: "CODE_REPO",
    paymentReference: "FAST-20260918-009988",
    paymentDualSeal: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    settlementCertificateId: "CERT-ENG-001-M01",
    invoiceNumber: "OPR-SMM-2026-001",
    settledAt: "2026-09-18T14:30:00.000Z",
    assignorUserId: "usr-dev-123",
    assignorName: "Ahmet Yılmaz",
    assignorEmail: "ahmet@devstudio.io",
    assignorVknOrTckn: "12345678901",
    assignorAddress: "Ankara",
    assigneeUserId: "usr-client-456",
    assigneeName: "Operis Teknoloji A.Ş.",
    assigneeCompanyName: "Operis Teknoloji A.Ş.",
    assigneeEmail: "legal@operis.io",
    assigneeVknOrTckn: "9876543210",
    assigneeAddress: "İstanbul",
  };

  describe("FSEK m. 52 Mandatory Specificity (Ayrı Ayrı Belirtilme İlkesi)", () => {
    it("should enumerate all 5 mandatory economic rights defined in FSEK", () => {
      expect(STATUTORY_ECONOMIC_RIGHTS).toHaveLength(5);
      const rightCodes = STATUTORY_ECONOMIC_RIGHTS.map((r: StatutoryEconomicRight) => r.code);
      expect(rightCodes).toEqual([
        "ISLEME_M21",
        "COGALTMA_M22",
        "YAYMA_M23",
        "TEMSIL_M24",
        "UMUMA_ILETIM_M25",
      ]);

      const articles = STATUTORY_ECONOMIC_RIGHTS.map((r: StatutoryEconomicRight) => r.fsekArticle);
      expect(articles).toContain("FSEK m. 21");
      expect(articles).toContain("FSEK m. 22");
      expect(articles).toContain("FSEK m. 23");
      expect(articles).toContain("FSEK m. 24");
      expect(articles).toContain("FSEK m. 25");
    });
  });

  describe("Git Commit Extraction Helper", () => {
    it("should extract 40-character SHA-1 commit hash from GitHub URL", () => {
      const url = "https://github.com/operis-client/core/commit/7f8a9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a";
      const hash = IpAssignmentDeedEngine.extractCommitHashFromUrl(url);
      expect(hash).toBe("7f8a9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a");
    });

    it("should extract 7-character short commit hash from GitLab URL", () => {
      const url = "https://gitlab.com/group/project/-/commit/abc1234";
      const hash = IpAssignmentDeedEngine.extractCommitHashFromUrl(url);
      expect(hash).toBe("abc1234");
    });

    it("should return null when URL has no commit path", () => {
      const url = "https://github.com/operis-client/core/tree/main";
      const hash = IpAssignmentDeedEngine.extractCommitHashFromUrl(url);
      expect(hash).toBeNull();
    });

    it("should return null for undefined or invalid string", () => {
      expect(IpAssignmentDeedEngine.extractCommitHashFromUrl(undefined)).toBeNull();
      expect(IpAssignmentDeedEngine.extractCommitHashFromUrl("")).toBeNull();
    });
  });

  describe("Deed Generation & Cryptographic Sealing", () => {
    it("should generate a complete, valid IP assignment deed", () => {
      const deed = IpAssignmentDeedEngine.generateDeed(sampleInput);

      expect(deed.deedId).toMatch(/^OPR-IP-DEED-[A-Z0-9]+-M1-[A-Z0-9]+$/);
      expect(deed.engagementId).toBe(sampleInput.engagementId);
      expect(deed.milestoneId).toBe(sampleInput.milestoneId);
      expect(deed.pinnedWork.milestoneSequence).toBe(1);

      // Parties
      expect(deed.assignor.legalName).toBe("Ahmet Yılmaz");
      expect(deed.assignor.vknOrTcknMasked).toContain("123");
      expect(deed.assignee.companyName).toBe("Operis Teknoloji A.Ş.");
      expect(deed.assignee.vknOrTcknMasked).toContain("987");

      // Pinned Git Work
      expect(deed.pinnedWork.gitCommitHash).toBe("7f8a9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a");
      expect(deed.pinnedWork.repositoryUrl).toBe("https://github.com/operis-client/core-banking");

      // Consideration
      expect(deed.consideration.amount).toBe(45000);
      expect(deed.consideration.paymentReference).toBe("FAST-20260918-009988");
      expect(deed.consideration.paymentDualSeal).toBe(sampleInput.paymentDualSeal);

      // 5 Economic rights individually attached
      expect(deed.transferredRights).toHaveLength(5);

      // Moral rights waiver and originality warranty
      expect(deed.moralRightsWaiverTr).toContain("5846 sayılı FSEK");
      expect(deed.originalityWarrantyTr).toContain("üçüncü kişilerin");

      // Master SHA-256 seal
      expect(deed.masterDeedSha256).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should fallback to extracting commit hash from deliverableUrl when gitCommitHash is omitted", () => {
      const inputWithoutDirectHash: GenerateIpDeedInput = {
        ...sampleInput,
        gitCommitHash: undefined,
      };

      const deed = IpAssignmentDeedEngine.generateDeed(inputWithoutDirectHash);
      expect(deed.pinnedWork.gitCommitHash).toBe("7f8a9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a");
    });
  });

  describe("Cryptographic Verification & Tamper Detection", () => {
    it("should successfully verify an untampered deed", () => {
      const deed = IpAssignmentDeedEngine.generateDeed(sampleInput);
      const verification = IpAssignmentDeedEngine.verifyDeed(deed);

      expect(verification.isValid).toBe(true);
      expect(verification.recomputedSha256).toBe(deed.masterDeedSha256);
      expect(verification.dualSealLinked).toBe(true);
      expect(verification.error).toBeUndefined();
    });

    it("should detect tampering if the git commit hash is modified", () => {
      const deed = IpAssignmentDeedEngine.generateDeed(sampleInput);
      const tampered: IpAssignmentDeed = {
        ...deed,
        pinnedWork: {
          ...deed.pinnedWork,
          gitCommitHash: "0000000000000000000000000000000000000000",
        },
      };

      const verification = IpAssignmentDeedEngine.verifyDeed(tampered);
      expect(verification.isValid).toBe(false);
      expect(verification.recomputedSha256).not.toBe(tampered.masterDeedSha256);
      expect(verification.error).toBeDefined();
    });

    it("should detect tampering if consideration amount is altered", () => {
      const deed = IpAssignmentDeedEngine.generateDeed(sampleInput);
      const tampered: IpAssignmentDeed = {
        ...deed,
        consideration: {
          ...deed.consideration,
          amount: 999999,
        },
      };

      const verification = IpAssignmentDeedEngine.verifyDeed(tampered);
      expect(verification.isValid).toBe(false);
      expect(verification.recomputedSha256).not.toBe(tampered.masterDeedSha256);
    });
  });

  describe("Markdown and HTML Contract Formatting", () => {
    it("should format deed into a valid legal Markdown document", () => {
      const deed = IpAssignmentDeedEngine.generateDeed(sampleInput);
      const md = IpAssignmentDeedEngine.formatDeedMarkdown(deed);

      expect(md).toContain("5846 SAYILI FSEK");
      expect(md).toContain(deed.deedId);
      expect(md).toContain("Ahmet Yılmaz");
      expect(md).toContain("Operis Teknoloji A.Ş.");
      expect(md).toContain("7f8a9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a");
      expect(md).toContain("İşleme Hakkı");
      expect(md).toContain("Çoğaltma Hakkı");
      expect(md).toContain("Yayma Hakkı");
      expect(md).toContain("Temsil Hakkı");
      expect(md).toContain("Umuma İletim");
      expect(md).toContain(deed.masterDeedSha256);
    });

    it("should format deed into a valid printable HTML certificate", () => {
      const deed = IpAssignmentDeedEngine.generateDeed(sampleInput);
      const html = IpAssignmentDeedEngine.formatDeedHtml(deed);

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain(deed.deedId);
      expect(html).toContain("7f8a9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a");
      expect(html).toContain("Ahmet Yılmaz");
      expect(html).toContain("Operis Teknoloji A.Ş.");
      expect(html).toContain("Devredilen Mali Hak");
      expect(html).toContain(deed.masterDeedSha256);
    });
  });
});
