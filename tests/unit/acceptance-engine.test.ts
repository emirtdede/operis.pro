import { describe, it, expect } from "vitest";
import { AcceptanceEngine } from "@/src/modules/contracts/acceptance-engine";
import { ContractGeneratorService } from "@/src/modules/contracts/generator";
import type { ContractGeneratorInput } from "@/src/modules/contracts/types";
import { HandoverService } from "@/src/modules/engagements/handover-service";
import { DEFAULT_USER } from "@/src/modules/auth/demo-user";

describe("Acceptance Engine (Deterministic Scope & Contract Acceptance Testing)", () => {
  describe("1. Domain Archetype Detection Algorithm", () => {
    it("should accurately detect SAAS_B2B_DASHBOARD archetype", () => {
      const result = AcceptanceEngine.detectArchetype(
        "Kurumsal Müşteri Takip ve B2B Yönetim Paneli",
        "Rol bazlı admin paneli ve raporlama ekranları geliştirilecek."
      );
      expect(result.archetype).toBe("SAAS_B2B_DASHBOARD");
      expect(result.confidence).toBeGreaterThanOrEqual(60);
      expect(result.profile.labelTr).toContain("Yönetim Paneli");
    });

    it("should accurately detect E_COMMERCE_MARKETPLACE archetype", () => {
      const result = AcceptanceEngine.detectArchetype(
        "Çok Satıcılı Pazaryeri ve E-Ticaret Platformu",
        "Sepet, iyzico 3D Secure ödeme ve kargo takip entegrasyonu."
      );
      expect(result.archetype).toBe("E_COMMERCE_MARKETPLACE");
      expect(result.confidence).toBeGreaterThanOrEqual(60);
    });

    it("should accurately detect MOBILE_ON_DEMAND archetype", () => {
      const result = AcceptanceEngine.detectArchetype(
        "Hızlı Kurye Çağırma ve Canlı Harita Takip Uygulaması",
        "Flutter ile iOS ve Android kurye takip sistemi."
      );
      expect(result.archetype).toBe("MOBILE_ON_DEMAND");
    });

    it("should accurately detect FINTECH_PAYMENTS archetype", () => {
      const result = AcceptanceEngine.detectArchetype(
        "Fintech Dijital Cüzdan ve Sanal POS Tahsilat Altyapısı",
        "Kullanıcı bakiyeleri ve para transferi yönetimi."
      );
      expect(result.archetype).toBe("FINTECH_PAYMENTS");
    });

    it("should fallback safely to CUSTOM_GENERAL when title has no matched keywords", () => {
      const result = AcceptanceEngine.detectArchetype(
        "Genel İhtiyaç Projesi",
        "Çeşitli teknik işler yapılacak."
      );
      expect(result.archetype).toBe("CUSTOM_GENERAL");
      expect(result.confidence).toBe(40);
    });
  });

  describe("2. Adaptive Scope Interview Question Tree", () => {
    it("should provide relevant interactive questions with defaults for SAAS_B2B_DASHBOARD", () => {
      const questions = AcceptanceEngine.getInterviewQuestions("SAAS_B2B_DASHBOARD");
      expect(questions.length).toBeGreaterThanOrEqual(3);

      const authQuestion = questions.find((q) => q.slotKey === "auth_roles");
      expect(authQuestion).toBeDefined();
      expect(authQuestion?.options.length).toBeGreaterThanOrEqual(2);
      expect(authQuestion?.defaultOptionValue).toBe("multi_roles");

      const exportQuestion = questions.find((q) => q.slotKey === "reporting_output");
      expect(exportQuestion).toBeDefined();
    });

    it("should provide valid questions for all 8 archetypes", () => {
      const archetypes = [
        "SAAS_B2B_DASHBOARD",
        "E_COMMERCE_MARKETPLACE",
        "MOBILE_ON_DEMAND",
        "FINTECH_PAYMENTS",
        "CONTENT_PORTFOLIO_LANDING",
        "AI_AGENT_AUTOMATION",
        "API_BACKEND_INTEGRATION",
        "CUSTOM_GENERAL",
      ] as const;

      for (const arch of archetypes) {
        const qList = AcceptanceEngine.getInterviewQuestions(arch);
        expect(qList.length).toBeGreaterThanOrEqual(2);
        for (const q of qList) {
          expect(q.slotKey).toBeTruthy();
          expect(q.titleTr).toBeTruthy();
          expect(q.options.length).toBeGreaterThanOrEqual(2);
          expect(q.defaultOptionValue).toBeTruthy();
        }
      }
    });
  });

  describe("3. Dual-Layer Acceptance Criteria Synthesis (Plain Turkish & Gherkin BDD)", () => {
    it("should synthesize criteria with both human-friendly text and Gherkin Given-When-Then specs", () => {
      const pkg = AcceptanceEngine.synthesizeScopePackage({
        archetype: "SAAS_B2B_DASHBOARD",
        title: "B2B Yönetim Paneli",
        summary: "Kurumsal dashboard geliştirme.",
        answers: {
          auth_roles: "multi_roles",
          data_source: "excel_csv_import",
          reporting_output: "excel_csv",
        },
      });

      expect(pkg.criteria.length).toBeGreaterThanOrEqual(4);

      // Check dual-layer on all criteria
      for (const c of pkg.criteria) {
        // Layer 1: Plain Turkish
        expect(c.humanCriterionTr.length).toBeGreaterThan(15);
        expect(c.humanCriterionEn.length).toBeGreaterThan(15);

        // Layer 2: Gherkin
        expect(c.gherkinGivenTr).toBeTruthy();
        expect(c.gherkinWhenTr).toBeTruthy();
        expect(c.gherkinThenTr).toBeTruthy();
        expect(c.gherkinGivenEn).toBeTruthy();
        expect(c.gherkinWhenEn).toBeTruthy();
        expect(c.gherkinThenEn).toBeTruthy();
      }

      // Check Excel download criterion
      const exportCrit = pkg.criteria.find((c) => c.slotKey === "reporting_output");
      expect(exportCrit).toBeDefined();
      expect(exportCrit?.humanCriterionTr).toContain("Excel İndir");
      expect(exportCrit?.gherkinWhenTr).toContain("Excel");

      // Check milestones distribution
      expect(pkg.suggestedMilestones.length).toBe(3);
      const totalPct = pkg.suggestedMilestones.reduce((acc, m) => acc + m.percentage, 0);
      expect(totalPct).toBe(100);
    });

    it("should generate legal contract annex markdown with TBK 470/474 statutory references", () => {
      const pkg = AcceptanceEngine.synthesizeScopePackage({
        archetype: "SAAS_B2B_DASHBOARD",
        title: "B2B Yönetim Paneli",
      });

      expect(pkg.contractAnnexMarkdownTr).toContain("EK-1: TARAFLARCA KARARLAŞTIRILAN OBJEKTİF KABUL KRİTERLERİ");
      expect(pkg.contractAnnexMarkdownTr).toContain("Türk Borçlar Kanunu (TBK) m. 470 ve m. 474");
      expect(pkg.contractAnnexMarkdownTr).toContain("GIVEN");
      expect(pkg.contractAnnexMarkdownTr).toContain("THEN");

      expect(pkg.contractAnnexMarkdownEn).toContain("ANNEX-1: AGREED OBJECTIVE ACCEPTANCE CRITERIA");
      expect(pkg.contractAnnexMarkdownEn).toContain("TBK");
    });
  });

  describe("4. Contract Generator Integration (TBK 470 & TBK 474)", () => {
    it("should append Annex-1 and cite objective criteria in contract when provided", () => {
      const pkg = AcceptanceEngine.synthesizeScopePackage({
        archetype: "SAAS_B2B_DASHBOARD",
        title: "Müşteri Yönetim Paneli",
      });

      const contractInput: ContractGeneratorInput = {
        engagementId: "eng-acceptance-test-1",
        listingTitle: "Müşteri Yönetim Paneli",
        category: "Web & SaaS",
        matchedAt: "2026-09-19T10:00:00Z",
        scopeSummary: "B2B Admin dashboard and reporting views.",
        budgetLabel: "75.000 TL",
        timelineLabel: "4 Hafta",
        client: {
          displayName: "Operis Test Client",
          email: "client@operis.dev",
          role: "CLIENT",
        },
        contractor: {
          displayName: "Operis Test Dev",
          email: "dev@operis.dev",
          role: "CONTRACTOR",
        },
        locale: "tr",
        acceptanceCriteria: pkg.criteria,
      };

      const result = ContractGeneratorService.generateContract(contractInput);

      expect(result.metadata.hasAcceptanceCriteria).toBe(true);
      expect(result.markdown).toContain("EK-1: TARAFLARCA KARARLAŞTIRILAN OBJEKTİF KABUL KRİTERLERİ");
      expect(result.markdown).toContain("Muayene ve Kabul (TBK m. 474):** İş Sahibi, Yüklenici tarafından yapılan teslimatı takip eden");
      expect(result.markdown).toContain("Objektif Kabul Kriterleri çerçevesinde incelemekle yükümlüdür");
      expect(result.htmlContent).toContain("EK-1: Objektif Kabul Kriterleri & Definition of Done");
      expect(result.sha256Fingerprint).toBeTruthy();
    });
  });

  describe("5. Subjective Rejection Shield & Evaluation (TBK m. 474)", () => {
    const sampleCriteria = [
      {
        id: "crit-1",
        phaseNumber: 1,
        category: "AUTH_SECURITY" as const,
        humanCriterionTr: "Kullanıcı doğru şifreyle giriş yapabilmelidir.",
        humanCriterionEn: "User logs in with valid password.",
        gherkinGivenTr: "Kullanıcı giriş sayfasındayken",
        gherkinWhenTr: "Doğru şifre girildiğinde",
        gherkinThenTr: "Oturum açılmalıdır",
        gherkinGivenEn: "Given login page",
        gherkinWhenEn: "When password valid",
        gherkinThenEn: "Then logged in",
        isMandatory: true,
      },
      {
        id: "crit-2",
        phaseNumber: 2,
        category: "OUTPUT_REPORTING" as const,
        humanCriterionTr: "Excel İndir butonuna basıldığında dosya inmelidir.",
        humanCriterionEn: "Clicking export downloads xlsx file.",
        gherkinGivenTr: "Rapor sayfasındayken",
        gherkinWhenTr: "Butona tıklandığında",
        gherkinThenTr: "Dosya inmelidir",
        gherkinGivenEn: "Given report page",
        gherkinWhenEn: "When clicking export",
        gherkinThenEn: "Then file downloads",
        isMandatory: true,
      },
    ];

    it("should prevent subjective rejection when all criteria are evaluated as passed", () => {
      const evaluation = AcceptanceEngine.evaluateRevisionCriteria({
        criteria: sampleCriteria,
        evaluations: {
          "crit-1": { passed: true },
          "crit-2": { passed: true },
        },
      });

      expect(evaluation.allPassed).toBe(true);
      expect(evaluation.isValidForRevision).toBe(false);
      expect(evaluation.validationError).toContain("Keyfi genel ret yapılamaz");
    });

    it("should validate revision request when at least one criterion failed with concrete reason", () => {
      const evaluation = AcceptanceEngine.evaluateRevisionCriteria({
        criteria: sampleCriteria,
        evaluations: {
          "crit-1": { passed: true },
          "crit-2": { passed: false, failureReason: "Butona basınca 500 hatası veriyor, dosya inmiyor." },
        },
      });

      expect(evaluation.allPassed).toBe(false);
      expect(evaluation.isValidForRevision).toBe(true);
      expect(evaluation.failedCount).toBe(1);
      expect(evaluation.failedCriteria[0]?.failureReason).toContain("500 hatası");
    });
  });

  describe("6. Handover Revision Notes Enrichment", () => {
    it("should compile structured criteria defect report in requestRevision", async () => {
      const demoResult = await HandoverService.requestRevision(DEFAULT_USER.id, {
        engagementId: "eng-demo-101",
        revisionNotes: "Sistemde bazı test kriterleri eksik kalmış.",
        criterionEvaluations: {
          "crit-export": {
            passed: false,
            failureReason: "Excel çıktısında KDV kolonu boş geliyor.",
          },
        },
      });

      expect(demoResult.status).toBe("REVISION_REQUESTED");
      expect(demoResult.revisionNotes).toContain("[OBJEKTİF KABUL KRİTERLERİ KUSUR LİSTESİ (TBK m. 474)]");
      expect(demoResult.revisionNotes).toContain("Excel çıktısında KDV kolonu boş geliyor.");
    });
  });
});
