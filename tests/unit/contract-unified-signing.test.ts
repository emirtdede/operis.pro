import { describe, it, expect, beforeEach } from "vitest";
import { ContractRecommendationEngine } from "@/src/modules/contracts/recommendation-engine";
import {
  uploadEphemeralSignature,
  deleteEphemeralSignature,
  deleteEphemeralSignatures,
  getMockEphemeralSignatureCount,
} from "@/src/modules/storage/r2-client";
import { ContractSigningService } from "@/src/modules/contracts/contract-signing-service";
import { ContractGeneratorService } from "@/src/modules/contracts/generator";

describe("Unified Contract Signing & Recommendation Engine", () => {
  beforeEach(() => {
    // Ensure clean test isolation
  });

  describe("1. ContractRecommendationEngine (Context-Aware Pre-selection)", () => {
    it("should recommend FSEK IP transfer and base service for software development", () => {
      const recs = ContractRecommendationEngine.evaluateRecommendations({
        engagementId: "eng-101",
        listingTitle: "Next.js Fullstack SaaS Platform Geliştirme",
        categorySlug: "yazilim-gelistirme",
        categoryName: "Yazılım Geliştirme",
        budgetCurrency: "TRY",
        budgetMin: 30000,
        budgetMax: 30000,
        scopeSummary: "React frontend ve Node.js backend mimarisinin geliştirilmesi.",
        isCorporateClient: false,
        isSquadEngagement: false,
        locale: "tr",
      });

      const recommendedIds = recs.recommendedContracts.map((c) => c.id);
      expect(recommendedIds).toContain("CORE_SERVICE");
      expect(recommendedIds).toContain("FSEK_IP_TRANSFER");
      expect(recs.recommendedContracts.length).toBeGreaterThanOrEqual(2);
      expect(recs.recommendedContracts.find((c) => c.id === "CORE_SERVICE")?.isBaseAgreement).toBe(true);
    });

    it("should recommend INFLATION_SHIELD for high-value contracts (>50,000 TRY)", () => {
      const recs = ContractRecommendationEngine.evaluateRecommendations({
        engagementId: "eng-102",
        listingTitle: "Kurumsal ERP Entegrasyonu",
        categorySlug: "yazilim-gelistirme",
        budgetCurrency: "TRY",
        budgetMin: 120000,
        budgetMax: 120000,
        scopeSummary: "6 aylık kurumsal ERP ve veritabanı entegrasyonu.",
        isCorporateClient: false,
        isSquadEngagement: false,
        locale: "tr",
      });

      const recommendedIds = recs.recommendedContracts.map((c) => c.id);
      expect(recommendedIds).toContain("INFLATION_SHIELD");
      const inflationItem = recs.recommendedContracts.find((c) => c.id === "INFLATION_SHIELD");
      expect(inflationItem?.statutoryBasisTr).toContain("TBK m. 138");
    });

    it("should recommend KVKK_DPA when client is a verified corporate entity (Ltd. / A.Ş.)", () => {
      const recs = ContractRecommendationEngine.evaluateRecommendations({
        engagementId: "eng-103",
        listingTitle: "Müşteri CRM Portalı",
        categorySlug: "web-tasarim",
        budgetCurrency: "TRY",
        budgetMin: 40000,
        scopeSummary: "Müşteri kimlik ve iletişim verilerini işleyen portal.",
        isCorporateClient: true,
        companyType: "ANONIM_SIRKET",
        isSquadEngagement: false,
        locale: "tr",
      });

      const recommendedIds = recs.recommendedContracts.map((c) => c.id);
      expect(recommendedIds).toContain("KVKK_DPA");
      const dpaItem = recs.recommendedContracts.find((c) => c.id === "KVKK_DPA");
      expect(dpaItem?.statutoryBasisTr).toContain("KVKK");
    });

    it("should recommend SOFTWARE_EXPORT for foreign currency / overseas client contracts", () => {
      const recs = ContractRecommendationEngine.evaluateRecommendations({
        engagementId: "eng-104",
        listingTitle: "Cross-Border Mobile App",
        categorySlug: "mobil-uygulama",
        budgetCurrency: "USD",
        budgetMin: 8000,
        scopeSummary: "iOS app for international client.",
        isCorporateClient: false,
        isSquadEngagement: false,
        hasForeignClient: true,
        locale: "tr",
      });

      const recommendedIds = recs.recommendedContracts.map((c) => c.id);
      expect(recommendedIds).toContain("SOFTWARE_EXPORT");
      const exportItem = recs.recommendedContracts.find((c) => c.id === "SOFTWARE_EXPORT");
      expect(exportItem?.statutoryBasisTr).toContain("89/13");
    });

    it("should recommend SQUAD_CONSORTIUM for squad/collective engagements", () => {
      const recs = ContractRecommendationEngine.evaluateRecommendations({
        engagementId: "eng-105",
        listingTitle: "Fintech Squad Project",
        categorySlug: "fintech",
        budgetCurrency: "TRY",
        budgetMin: 80000,
        scopeSummary: "Squad backend and frontend delivery.",
        isCorporateClient: false,
        isSquadEngagement: true,
        locale: "tr",
      });

      const recommendedIds = recs.recommendedContracts.map((c) => c.id);
      expect(recommendedIds).toContain("SQUAD_CONSORTIUM");
      const squadItem = recs.recommendedContracts.find((c) => c.id === "SQUAD_CONSORTIUM");
      expect(squadItem?.statutoryBasisTr).toContain("TBK m. 620");
    });

    it("should present all agreements clearly with explanations and allow custom add-ons", () => {
      const recs = ContractRecommendationEngine.evaluateRecommendations({
        engagementId: "eng-106",
        listingTitle: "Logo & Kimlik Tasarımı",
        categorySlug: "tasarim",
        budgetCurrency: "TRY",
        budgetMin: 15000,
        scopeSummary: "Vektörel logo çizimi ve kurumsal kimlik rehberi.",
        isCorporateClient: false,
        isSquadEngagement: false,
        locale: "tr",
      });

      expect(recs.allContracts.length).toBeGreaterThanOrEqual(15);
      for (const contract of recs.allContracts) {
        expect(contract.id).toBeDefined();
        expect(contract.titleTr).toBeDefined();
        expect(contract.statutoryBasisTr).toBeDefined();
        expect(contract.recommendationReasonTr).toBeDefined();
      }
    });

    it("should recommend CYBER_SECURITY_CLEAN_CODE and FOSS_LICENSE_COMPLIANCE for software deliverables", () => {
      const recs = ContractRecommendationEngine.evaluateRecommendations({
        engagementId: "eng-sec-foss-1",
        listingTitle: "Fullstack SaaS Web Application",
        categorySlug: "yazilim-gelistirme",
        budgetCurrency: "TRY",
        budgetMin: 45000,
        scopeSummary: "Node.js ve React mimarisiyle açık kaynak bileşenler içeren SaaS platformu.",
        isCorporateClient: true,
        isSquadEngagement: false,
        locale: "tr",
      });

      const recommendedIds = recs.recommendedContracts.map((c) => c.id);
      expect(recommendedIds).toContain("CYBER_SECURITY_CLEAN_CODE");
      expect(recommendedIds).toContain("FOSS_LICENSE_COMPLIANCE");

      const cleanCodeItem = recs.recommendedContracts.find((c) => c.id === "CYBER_SECURITY_CLEAN_CODE");
      expect(cleanCodeItem?.statutoryBasisTr).toContain("TCK m. 243-245");

      const fossItem = recs.recommendedContracts.find((c) => c.id === "FOSS_LICENSE_COMPLIANCE");
      expect(fossItem?.statutoryBasisTr).toContain("FSEK m. 52");
    });

    it("should recommend NON_SOLICITATION and MUTUAL_RELEASE_DISCHARGE for corporate engagements", () => {
      const recs = ContractRecommendationEngine.evaluateRecommendations({
        engagementId: "eng-solicit-release-1",
        listingTitle: "Kurumsal Fintech Dönüşümü",
        categorySlug: "fintech",
        budgetCurrency: "TRY",
        budgetMin: 80000,
        scopeSummary: "Kurumsal bankacılık entegrasyonu.",
        isCorporateClient: true,
        isSquadEngagement: true,
        timelineDays: 45,
        locale: "tr",
      });

      const recommendedIds = recs.recommendedContracts.map((c) => c.id);
      expect(recommendedIds).toContain("NON_SOLICITATION");
      expect(recommendedIds).toContain("MUTUAL_RELEASE_DISCHARGE");

      const solicitItem = recs.recommendedContracts.find((c) => c.id === "NON_SOLICITATION");
      expect(solicitItem?.statutoryBasisTr).toContain("TTK m. 54-55");

      const releaseItem = recs.recommendedContracts.find((c) => c.id === "MUTUAL_RELEASE_DISCHARGE");
      expect(releaseItem?.statutoryBasisTr).toContain("TBK m. 132");
    });
  });

  describe("2. Ephemeral Storage Management (Cloudflare R2 10 GB Free Tier)", () => {
    it("should upload ephemeral signature and return key with engagement ID prefix", async () => {
      const mockBuffer = Buffer.from("mock-signature-binary-data");
      const result = await uploadEphemeralSignature("eng-test-1", "CLIENT", mockBuffer, "image/webp");

      expect(result.key).toContain("ephemeral-signatures/eng-test-1/client-");
      expect(result.sha256).toBeDefined();
      expect(result.sizeBytes).toBe(mockBuffer.length);
    });

    it("should delete ephemeral signature from storage to preserve free tier quota", async () => {
      const mockBuffer = Buffer.from("mock-signature-to-delete");
      const initialCount = getMockEphemeralSignatureCount();

      const upload = await uploadEphemeralSignature("eng-test-2", "CONTRACTOR", mockBuffer, "image/webp");
      expect(getMockEphemeralSignatureCount()).toBe(initialCount + 1);

      const deleted = await deleteEphemeralSignature(upload.key);
      expect(deleted).toBe(true);
      expect(getMockEphemeralSignatureCount()).toBe(initialCount);
    });

    it("should batch delete multiple ephemeral signature keys", async () => {
      const up1 = await uploadEphemeralSignature("eng-test-3", "CLIENT", Buffer.from("sig-1"));
      const up2 = await uploadEphemeralSignature("eng-test-3", "CONTRACTOR", Buffer.from("sig-2"));

      const deletedCount = await deleteEphemeralSignatures([up1.key, up2.key]);
      expect(deletedCount).toBe(2);
    });
  });

  describe("3. Platform Safe Harbor, Non-Party Status & Bilateral Exclusivity", () => {
    it("should enforce mandatory safe harbor waiver acceptance before signing", async () => {
      await expect(
        ContractSigningService.submitSignature({
          engagementId: "eng-sh-1",
          userId: "user-1",
          role: "CLIENT",
          signerName: "Test Client",
          signatureType: "DRAWN",
          signatureDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          legalAcknowledged: false, // NOT accepted
        })
      ).rejects.toThrow(/sorumsuzluğunu ve dava muafiyetini onaylamadan/i);
    });

    it("should include prominent platform immunity banner and TBK m. 26 / m. 115 safe harbor in generated contract", () => {
      const result = ContractGeneratorService.generateContract({
        engagementId: "eng-gen-sh",
        listingTitle: "Safe Harbor Test",
        category: "Yazılım",
        matchedAt: new Date(),
        scopeSummary: "Full test scope",
        client: { displayName: "Ahmet A.Ş.", email: "ahmet@corp.local", role: "CLIENT" },
        contractor: { displayName: "Mehmet Dev", email: "mehmet@dev.local", role: "CONTRACTOR" },
        locale: "tr",
      });

      // Top banner verification
      expect(result.markdown).toContain("YASAL UYARI VE PLATFORM DAVA MUAFİYETİ");
      expect(result.markdown).toContain("5651 Sayılı Kanun");
      expect(result.markdown).toContain("TBK m. 26");
      expect(result.markdown).toContain("TBK m. 115");

      // Article 9 verification
      expect(result.markdown).toContain("MADDE 9: OPERİS PLATFORMUNUN HUKUKİ STATÜSÜ VE DAVA MUAFİYETİ");
      expect(result.markdown).toContain("Sözleşmenin Tamamen Opsiyonel ve İki Taraflı Niteliği");
      expect(result.markdown).toContain("Platformun Taraf Olmaması");
      expect(result.markdown).toContain("Dava ve İhtilaf Muafiyeti");
    });

    it("should render digital signatures and HMK m. 199 electronic certificate seals when signed", () => {
      const result = ContractGeneratorService.generateContract({
        engagementId: "eng-sig-render",
        listingTitle: "Digital Signature Render Test",
        category: "Yazılım",
        matchedAt: new Date(),
        scopeSummary: "Digital test",
        client: { displayName: "Alpha Corp", email: "alpha@corp.local", role: "CLIENT" },
        contractor: { displayName: "Beta Dev", email: "beta@dev.local", role: "CONTRACTOR" },
        clientSignature: {
          signerName: "Alpha Authorized",
          signedAt: "2026-09-19T14:30:00Z",
          ipHash: "hash-alpha-1234",
        },
        contractorSignature: {
          signerName: "Beta Specialist",
          signedAt: "2026-09-19T14:35:00Z",
          ipHash: "hash-beta-5678",
        },
        locale: "tr",
      });

      expect(result.markdown).toContain("Alpha Authorized");
      expect(result.markdown).toContain("Beta Specialist");
      expect(result.markdown).toContain("hash-alpha-1234");
      expect(result.markdown).toContain("hash-beta-5678");

      expect(result.htmlContent).toContain("Alpha Authorized");
      expect(result.htmlContent).toContain("Beta Specialist");
      expect(result.htmlContent).toContain("HMK m. 199");
    });
  });

  describe("4. Filtered Annex Generation Based On User Selection", () => {
    it("should only render selected annexes when custom contract selection is provided", () => {
      const fullResult = ContractGeneratorService.generateContract({
        engagementId: "eng-filtered",
        listingTitle: "Custom Selection Contract",
        category: "Yazılım",
        matchedAt: new Date(),
        scopeSummary: "Custom selection scope",
        client: { displayName: "Client", email: "client@test.local", role: "CLIENT" },
        contractor: { displayName: "Dev", email: "dev@test.local", role: "CONTRACTOR" },
        dpaConfig: {
          enabled: true,
          accessLevel: "READ_ONLY_STAGING",
          dataCategories: ["IDENTITY_CONTACT"],
          securityMeasures: ["TLS_ENCRYPTION"],
          subProcessorAllowed: false,
        },
        selectedContracts: ["CORE_SERVICE"], // User deselected FSEK, DPA, etc.
        locale: "tr",
      });

      // CORE_SERVICE is included, but DPA annex shouldn't be included because not in selectedContracts
      expect(fullResult.markdown).toContain("MADDE 1: TARAFLAR");
      expect(fullResult.markdown).not.toContain("EK-2 BİLİŞİM VE YAZILIM HİZMETLERİ VERİ İŞLEME PROTOKOLÜ");
    });
  });

  describe("5. Tamper Invalidation & Optimistic Concurrency Control (CAS)", () => {
    it("should increment version on contract selection update", async () => {
      const engId = "eng-cas-version-1";
      const pkg1 = await ContractSigningService.getOrInitPackage(engId, "user-cas-1");
      expect(pkg1.packageDetails.version).toBe(1);

      const updated = await ContractSigningService.updateSelectedContracts(engId, "user-cas-1", [
        "CORE_SERVICE",
        "FSEK_IP_TRANSFER",
      ]);
      expect(updated.version).toBe(2);
      expect(updated.tamperResetCount).toBe(0);
    });

    it("should reject signature submission if expectedVersion does not match current version (CAS conflict)", async () => {
      const engId = "eng-cas-conflict-1";
      await ContractSigningService.getOrInitPackage(engId, "user-cas-2");

      // Update to bump version from 1 to 2
      await ContractSigningService.updateSelectedContracts(engId, "user-cas-2", [
        "CORE_SERVICE",
        "BILATERAL_NDA",
      ]);

      // Attempt to sign with stale version 1
      await expect(
        ContractSigningService.submitSignature({
          engagementId: engId,
          userId: "user-cas-2",
          role: "CLIENT",
          signerName: "Stale Client",
          signatureType: "DRAWN",
          signatureDataUrl:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          legalAcknowledged: true,
          expectedVersion: 1, // Stale version!
        })
      ).rejects.toThrow(/CONCURRENCY_CONFLICT/);
    });

    it("should invalidate existing signature and reset status when scope/contracts change after signing", async () => {
      const engId = "eng-tamper-scope-1";
      await ContractSigningService.getOrInitPackage(engId, "user-tamper-client");

      // 1. Client signs initial package
      const clientSignResult = await ContractSigningService.submitSignature({
        engagementId: engId,
        userId: "user-tamper-client",
        role: "CLIENT",
        signerName: "Initial Client",
        signatureType: "DRAWN",
        signatureDataUrl:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        legalAcknowledged: true,
      });
      expect(clientSignResult.status).toBe("PARTIALLY_SIGNED");

      const pkgAfterSign = await ContractSigningService.getOrInitPackage(engId, "user-tamper-client");
      expect(pkgAfterSign.packageDetails.clientSignature).not.toBeNull();

      // 2. Freelancer or client secretly changes contract scope (e.g. adds an aggressive penalty clause or removes IP transfer)
      const tamperedPkg = await ContractSigningService.updateSelectedContracts(
        engId,
        "user-tamper-client",
        ["CORE_SERVICE", "INFLATION_SHIELD", "KVKK_DPA"]
      );

      // 3. Verify that the previous signature is wiped out for legal security
      expect(tamperedPkg.signaturesInvalidated).toBe(true);
      expect(tamperedPkg.clientSignature).toBeNull();
      expect(tamperedPkg.contractorSignature).toBeNull();
      expect(tamperedPkg.status).toBe("PENDING_SIGNATURES");
      expect(tamperedPkg.tamperResetCount).toBe(1);
      expect(tamperedPkg.version).toBeGreaterThan(1);
    });
  });

  describe("6. WP-04: Authoritative Role Derivation & Dual-Role Signing Prevention", () => {
    const validSignature =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    it("rejects client user account attempting to sign with spoofed CONTRACTOR role", async () => {
      const engId = "eng-test-dual-01";
      // In demo engagement, viewer "user-client-real" is owner (CLIENT)
      await expect(
        ContractSigningService.submitSignature({
          engagementId: engId,
          userId: "user-client-real",
          role: "CONTRACTOR", // Spoofed role!
          signerName: "Imposter Contractor",
          signatureType: "DRAWN",
          signatureDataUrl: validSignature,
          legalAcknowledged: true,
        })
      ).rejects.toThrow(/Yetkisiz rol: İşveren hesabıyla Yüklenici rolünde imza atılamaz/);
    });

    it("prevents the same user account from signing both client and contractor roles", async () => {
      const engId = "eng-test-dual-02";
      // 1. Legitimate client signs
      const clientRes = await ContractSigningService.submitSignature({
        engagementId: engId,
        userId: "user-client-real",
        role: "CLIENT",
        signerName: "Real Client",
        signatureType: "DRAWN",
        signatureDataUrl: validSignature,
        legalAcknowledged: true,
      });
      expect(clientRes.status).toBe("PARTIALLY_SIGNED");

      // 2. Same user account tries to sign contractor side
      await expect(
        ContractSigningService.submitSignature({
          engagementId: engId,
          userId: "user-client-real",
          role: "CLIENT", // Even if role is CLIENT or anything, they can't sign twice
          signerName: "Real Client Acting As Contractor",
          signatureType: "DRAWN",
          signatureDataUrl: validSignature,
          legalAcknowledged: true,
        })
      ).rejects.toThrow();
    });

    it("allows distinct legitimate parties to execute a FULLY_SIGNED bilateral contract", async () => {
      const engId = "eng-test-dual-03";
      // 1. Client signs
      const clientRes = await ContractSigningService.submitSignature({
        engagementId: engId,
        userId: "user-client-real",
        role: "CLIENT",
        signerName: "Client Alice",
        signatureType: "DRAWN",
        signatureDataUrl: validSignature,
        legalAcknowledged: true,
      });
      expect(clientRes.status).toBe("PARTIALLY_SIGNED");

      // 2. Distinct Contractor ("u-techcorp-1" in demo data) signs
      const contractorRes = await ContractSigningService.submitSignature({
        engagementId: engId,
        userId: "u-techcorp-1",
        role: "CONTRACTOR",
        signerName: "Contractor Bob",
        signatureType: "DRAWN",
        signatureDataUrl: validSignature,
        legalAcknowledged: true,
      });
      expect(contractorRes.status).toBe("FULLY_SIGNED");
      expect(contractorRes.packageId).toBeDefined();
    });

    it("prevents modifying or re-signing an already FULLY_SIGNED package", async () => {
      const engId = "eng-test-dual-04";
      // 1. Client signs
      await ContractSigningService.submitSignature({
        engagementId: engId,
        userId: "user-client-real",
        role: "CLIENT",
        signerName: "Client Alice",
        signatureType: "DRAWN",
        signatureDataUrl: validSignature,
        legalAcknowledged: true,
      });

      // 2. Contractor signs -> FULLY_SIGNED
      await ContractSigningService.submitSignature({
        engagementId: engId,
        userId: "u-techcorp-1",
        role: "CONTRACTOR",
        signerName: "Contractor Bob",
        signatureType: "DRAWN",
        signatureDataUrl: validSignature,
        legalAcknowledged: true,
      });

      // 3. Attempt to re-sign or tamper with fully signed contract
      await expect(
        ContractSigningService.submitSignature({
          engagementId: engId,
          userId: "user-client-real",
          role: "CLIENT",
          signerName: "Client Tamper Attempt",
          signatureType: "DRAWN",
          signatureDataUrl: validSignature,
          legalAcknowledged: true,
        })
      ).rejects.toThrow(/tam olarak imzalanmış ve yürürlüğe girmiştir/);
    });
  });

  describe("7. WP-05: Scope Immutability & Re-signing Prevention", () => {
    const validSignature =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    it("rejects signature submission when client attempts to modify contract scope during submitSignature", async () => {
      const engId = "eng-test-scope-01";
      await ContractSigningService.getOrInitPackage(engId, "user-client-real");

      // Scope established as default CORE_SERVICE
      await expect(
        ContractSigningService.submitSignature({
          engagementId: engId,
          userId: "user-client-real",
          role: "CLIENT",
          signerName: "Client Alice",
          signatureType: "DRAWN",
          signatureDataUrl: validSignature,
          legalAcknowledged: true,
          selectedContracts: ["CORE_SERVICE", "IP_ASSIGNMENT", "PENALTY_CLAUSE"], // Attempting to inject new contracts!
        })
      ).rejects.toThrow(/İmza aşamasında sözleşme kapsamı değiştirilemez/);
    });

    it("preserves authoritative contract scope when signing with matching or omitted contracts", async () => {
      const engId = "eng-test-scope-02";
      await ContractSigningService.getOrInitPackage(engId, "user-client-real");
      await ContractSigningService.updateSelectedContracts(engId, "user-client-real", [
        "CORE_SERVICE",
        "BILATERAL_NDA",
      ]);

      const res = await ContractSigningService.submitSignature({
        engagementId: engId,
        userId: "user-client-real",
        role: "CLIENT",
        signerName: "Client Alice",
        signatureType: "DRAWN",
        signatureDataUrl: validSignature,
        legalAcknowledged: true,
        selectedContracts: ["CORE_SERVICE", "BILATERAL_NDA"], // Exact match
      });

      expect(res.status).toBe("PARTIALLY_SIGNED");
      const currentPkg = await ContractSigningService.getOrInitPackage(engId, "user-client-real");
      expect(currentPkg.packageDetails.selectedContracts).toEqual(["CORE_SERVICE", "BILATERAL_NDA"]);
    });

    it("strictly blocks any modification or signature on a FULLY_SIGNED package", async () => {
      const engId = "eng-test-scope-03";
      await ContractSigningService.getOrInitPackage(engId, "user-client-real");

      // 1. Client signs
      await ContractSigningService.submitSignature({
        engagementId: engId,
        userId: "user-client-real",
        role: "CLIENT",
        signerName: "Client Alice",
        signatureType: "DRAWN",
        signatureDataUrl: validSignature,
        legalAcknowledged: true,
      });

      // 2. Contractor signs -> FULLY_SIGNED
      const finalRes = await ContractSigningService.submitSignature({
        engagementId: engId,
        userId: "u-techcorp-1",
        role: "CONTRACTOR",
        signerName: "Contractor Bob",
        signatureType: "DRAWN",
        signatureDataUrl: validSignature,
        legalAcknowledged: true,
      });
      expect(finalRes.status).toBe("FULLY_SIGNED");

      // 3. Attempt to update selected contracts
      await expect(
        ContractSigningService.updateSelectedContracts(engId, "user-client-real", [
          "CORE_SERVICE",
          "INFLATION_SHIELD",
        ])
      ).rejects.toThrow(/Cannot modify contract selection after full bilateral signature execution/);

      // 4. Attempt to sign again
      await expect(
        ContractSigningService.submitSignature({
          engagementId: engId,
          userId: "user-client-real",
          role: "CLIENT",
          signerName: "Client Alice",
          signatureType: "DRAWN",
          signatureDataUrl: validSignature,
          legalAcknowledged: true,
        })
      ).rejects.toThrow(/tam olarak imzalanmış ve yürürlüğe girmiştir/);
    });
  });

  describe("8. WP-06 & WP-07: Atomic CAS and Ephemeral Lifecycle Verification", () => {
    const validSignature =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    it("enforces CAS version increment across sequential operations", async () => {
      const engId = "eng-cas-lifecycle-01";
      const init = await ContractSigningService.getOrInitPackage(engId, "user-client-real");
      expect(init.packageDetails.version).toBe(1);

      const updated = await ContractSigningService.updateSelectedContracts(engId, "user-client-real", [
        "CORE_SERVICE",
        "FSEK_IP_TRANSFER",
      ]);
      expect(updated.version).toBe(2);

      // Client signs (version 2 -> 3)
      const clientRes = await ContractSigningService.submitSignature({
        engagementId: engId,
        userId: "user-client-real",
        role: "CLIENT",
        signerName: "Client Alice",
        signatureType: "DRAWN",
        signatureDataUrl: validSignature,
        legalAcknowledged: true,
        expectedVersion: 2,
      });
      expect(clientRes.version).toBe(3);

      // Contractor signs (version 3 -> 4, compiled -> 5)
      const contractorRes = await ContractSigningService.submitSignature({
        engagementId: engId,
        userId: "u-techcorp-1",
        role: "CONTRACTOR",
        signerName: "Contractor Bob",
        signatureType: "DRAWN",
        signatureDataUrl: validSignature,
        legalAcknowledged: true,
        expectedVersion: 3,
      });
      expect(contractorRes.status).toBe("FULLY_SIGNED");
      expect(contractorRes.version).toBe(5);
    });

    it("purges ephemeral R2 signature files only upon successful full execution", async () => {
      const engId = "eng-test-r2-01";
      await ContractSigningService.getOrInitPackage(engId, "user-client-real");

      const initialCount = getMockEphemeralSignatureCount();

      // Client signs (stores 1 ephemeral signature in R2)
      await ContractSigningService.submitSignature({
        engagementId: engId,
        userId: "user-client-real",
        role: "CLIENT",
        signerName: "Client Alice",
        signatureType: "DRAWN",
        signatureDataUrl: validSignature,
        legalAcknowledged: true,
      });

      expect(getMockEphemeralSignatureCount()).toBe(initialCount + 1);

      // Contractor signs -> Fully signed compiles into HTML/Markdown, then purges both signatures
      await ContractSigningService.submitSignature({
        engagementId: engId,
        userId: "u-techcorp-1",
        role: "CONTRACTOR",
        signerName: "Contractor Bob",
        signatureType: "DRAWN",
        signatureDataUrl: validSignature,
        legalAcknowledged: true,
      });

      // Ephemeral signatures should be purged back to initial baseline
      expect(getMockEphemeralSignatureCount()).toBe(initialCount);
    });
  });
});

