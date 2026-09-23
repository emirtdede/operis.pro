import { describe, it, expect, beforeEach, vi } from "vitest";
import { CompanyVerificationService } from "@/src/modules/profiles/services/company-verification.service";
import { ProfileService } from "@/src/modules/profiles/service";
import { ContractSigningService } from "@/src/modules/contracts/contract-signing-service";

describe("Final Security Remediation (WP-35 & WP-36)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("WP-35: Company Verification Checksum vs Authoritative Corporate Proof", () => {
    const validVkn = "8790017566"; // Valid 10-digit VKN checksum
    const validTckn = "10000000146"; // Valid 11-digit TCKN checksum

    it("records status as FORMAT_VERIFIED and denies verified badge when only checksum is supplied in strict mode", async () => {
      const result = await CompanyVerificationService.verifyCompany("usr_corp_strict_1", {
        companyName: "Operis Teknoloji Anonim Şirketi",
        taxId: validVkn,
        taxOffice: "Kadıköy",
        strictCorporateProof: true,
      });

      // Mathematical checksum is valid, but corporate representation is not proven
      expect(result.status).toBe("FORMAT_VERIFIED");
      expect(result.isCompanyVerified).toBe(false);
      expect(result.verificationTier).toBe("FORMAT_ONLY");
      expect(result.requiresCorporateProof).toBe(true);
      expect(result.vknMasked).toBe("879***7566");
      expect(result.companyName).toBe("Operis Teknoloji A.Ş.");
    });

    it("verifies format for sole proprietorship with 11-digit TCKN", async () => {
      const result = await CompanyVerificationService.verifyCompany("usr_corp_sole_1", {
        companyName: "Demir Yazılım Danışmanlık",
        taxId: validTckn,
        taxOffice: "Beşiktaş",
        strictCorporateProof: true,
      });

      expect(result.status).toBe("FORMAT_VERIFIED");
      expect(result.isCompanyVerified).toBe(false);
      expect(result.companyType).toBe("SAHIS");
      expect(result.vknMasked).toBe("100*****146");
    });

    it("records status as PENDING_REVIEW when corporate authority proof document is provided", async () => {
      const result = await CompanyVerificationService.verifyCompany("usr_corp_strict_2", {
        companyName: "Operis Danışmanlık Limited Şirketi",
        taxId: validVkn,
        taxOffice: "Beşiktaş",
        proofDocumentUrl: "https://r2.operis.pro/proofs/imza-sirkuleri.pdf",
        authorizedTitle: "Genel Müdür",
        representativeAttestation: true,
        strictCorporateProof: true,
      });

      expect(result.status).toBe("PENDING_REVIEW");
      expect(result.isCompanyVerified).toBe(false);
      expect(result.verificationTier).toBe("FORMAT_ONLY");
      expect(result.requiresCorporateProof).toBe(true);
    });

    it("activates corporate badge when administrator reviews and approves corporate proof", async () => {
      // 1. Submit for review
      await CompanyVerificationService.verifyCompany("usr_corp_strict_3", {
        companyName: "Atlas Bilişim Hizmetleri A.Ş.",
        taxId: validVkn,
        taxOffice: "Şişli",
        proofDocumentUrl: "https://r2.operis.pro/proofs/vergi-levhasi.pdf",
        authorizedTitle: "Yönetim Kurulu Başkanı",
        strictCorporateProof: true,
      });

      // 2. Admin approves
      const approval = await ProfileService.approveCompanyVerification(
        "admin_user_01",
        "usr_corp_strict_3"
      );

      expect(approval.success).toBe(true);
      expect(approval.status).toBe("VERIFIED");
    });

    it("rejects corporate verification and revokes badge when rejected by administrator", async () => {
      const rejection = await ProfileService.rejectCompanyVerification(
        "admin_user_01",
        "usr_corp_strict_3",
        "Yüklenen imza sirküleri geçerlilik süresi dolmuş."
      );

      expect(rejection.success).toBe(true);
      expect(rejection.status).toBe("REJECTED");
      expect(rejection.reason).toContain("imza sirküleri");
    });

    it("rejects invalid VKN checksums immediately without persisting", async () => {
      await expect(
        CompanyVerificationService.verifyCompany("usr_fail_vkn", {
          companyName: "Fake Corp",
          taxId: "1234567899", // Invalid check digit
          taxOffice: "Mecidiyeköy",
        })
      ).rejects.toThrow(/Vergi Kimlik Numarası \(VKN\) algoritması geçersizdir/i);
    });
  });

  describe("WP-36: First Contract Signature Transitions Status to PARTIALLY_SIGNED", () => {
    const validPngSignature =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    it("sets package status to PARTIALLY_SIGNED upon first valid signature submission", async () => {
      const engId = "eng-test-wp36-remediation";

      // 1. Client submits signature
      const clientSign = await ContractSigningService.submitSignature({
        engagementId: engId,
        userId: "user-client-real",
        role: "CLIENT",
        signerName: "Ahmet Yılmaz",
        signatureType: "DRAWN",
        signatureDataUrl: validPngSignature,
        legalAcknowledged: true,
      });

      expect(clientSign.success).toBe(true);
      expect(clientSign.status).toBe("PARTIALLY_SIGNED");
      expect(clientSign.isFullySigned).toBe(false);

      // 2. Read package back to ensure persisted / mapped status is strictly PARTIALLY_SIGNED
      const { packageDetails } = await ContractSigningService.getOrInitPackage(engId, "user-client-real");
      expect(packageDetails.status).toBe("PARTIALLY_SIGNED");
      expect(packageDetails.clientSignature).not.toBeNull();
      expect(packageDetails.contractorSignature).toBeNull();
    });

    it("transitions from PARTIALLY_SIGNED to FULLY_SIGNED once contractor signs", async () => {
      const engId = "eng-test-wp36-remediation";

      // 2. Contractor ("u-techcorp-1") signs
      const contractorSign = await ContractSigningService.submitSignature({
        engagementId: engId,
        userId: "u-techcorp-1",
        role: "CONTRACTOR",
        signerName: "Zeynep Kaya",
        signatureType: "DRAWN",
        signatureDataUrl: validPngSignature,
        legalAcknowledged: true,
      });

      expect(contractorSign.success).toBe(true);
      expect(contractorSign.status).toBe("FULLY_SIGNED");
      expect(contractorSign.isFullySigned).toBe(true);

      // 3. Read back package
      const { packageDetails } = await ContractSigningService.getOrInitPackage(engId, "u-techcorp-1");
      expect(packageDetails.status).toBe("FULLY_SIGNED");
      expect(packageDetails.clientSignature).not.toBeNull();
      expect(packageDetails.contractorSignature).not.toBeNull();
    });
  });
});
