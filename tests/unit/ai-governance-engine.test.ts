import { describe, it, expect } from "vitest";
import { AiGovernanceEngine } from "@/src/modules/contracts/ai-governance-engine";
import type { AiGovernanceConfig } from "@/src/modules/contracts/ai-governance-types";
import { ContractGeneratorService } from "@/src/modules/contracts/generator";
import { DossierService } from "@/src/modules/contracts/dossier-service";

describe("EU AI Act & FSEK m. 52 AI Governance & IP Warranty Engine Suite", () => {
  const defaultAiConfig = AiGovernanceEngine.getDefaultConfig();

  describe("1. evaluateAiGovernanceRisk - Deterministic Risk Index", () => {
    it("evaluates default recommended configuration as PRISTINE_IP_SAFE (10 risk score)", () => {
      // default: AI_ASSISTED_HUMAN_REVIEWED (15p) + ENTERPRISE_ZERO_RETENTION (0p)
      // all affirmations true (0 penalty) + codeReviewToolUsed (-5p discount) = 10p
      const evaluation = AiGovernanceEngine.evaluateAiGovernanceRisk(defaultAiConfig);

      expect(evaluation.riskScore).toBe(10);
      expect(evaluation.riskLevel).toBe("PRISTINE_IP_SAFE");
      expect(evaluation.summaryTr).toContain("Kusursuz Telif Güvencesi");
      expect(evaluation.summaryEn).toContain("Pristine IP Safe");
      expect(evaluation.legalGroundTr).toContain("5846 sayılı FSEK");
      expect(evaluation.legalGroundTr).toContain("m. 52");
      expect(evaluation.legalGroundTr).toContain("AB Yapay Zeka Yasası");
      expect(evaluation.factorBreakdown.length).toBeGreaterThanOrEqual(5);
    });

    it("evaluates pure human coding (AI_FREE_HUMAN_ONLY) with zero risk (0 score)", () => {
      const pureHumanConfig: AiGovernanceConfig = {
        enabled: true,
        usageLevel: "AI_FREE_HUMAN_ONLY", // 0p
        declaredTools: ["NONE"],
        dataPrivacyTier: "LOCAL_OFFLINE_EXECUTION", // 0p
        humanInTheLoopAffirmed: true,
        copyleftFreeWarranted: true,
        zeroDataRetentionWarranted: true,
        strictDefectLiabilityAccepted: true,
        codeReviewToolUsed: false,
      };

      const evaluation = AiGovernanceEngine.evaluateAiGovernanceRisk(pureHumanConfig);

      expect(evaluation.riskScore).toBe(0);
      expect(evaluation.riskLevel).toBe("PRISTINE_IP_SAFE");
    });

    it("evaluates heavy autonomous AI with lack of safeguards as COPYRIGHT_CONTAMINATION_HAZARD (high score)", () => {
      const hazardousConfig: AiGovernanceConfig = {
        enabled: true,
        usageLevel: "HEAVY_AI_GENERATED", // 35p
        declaredTools: ["CURSOR", "CUSTOM_PROPRIETARY"],
        dataPrivacyTier: "CONSUMER_PUBLIC_TRAINING_RISK", // 25p
        humanInTheLoopAffirmed: false, // 20p penalty (FSEK m. 1/B invalidity)
        copyleftFreeWarranted: false, // 15p penalty (GPL virus risk)
        zeroDataRetentionWarranted: false,
        strictDefectLiabilityAccepted: false, // 10p penalty (disclaiming defect liability)
        codeReviewToolUsed: false,
      };

      // 35 + 25 + 20 + 15 + 10 = 105 -> clamped to 100
      const evaluation = AiGovernanceEngine.evaluateAiGovernanceRisk(hazardousConfig);

      expect(evaluation.riskScore).toBe(100);
      expect(evaluation.riskLevel).toBe("COPYRIGHT_CONTAMINATION_HAZARD");
      expect(evaluation.summaryTr).toContain("Yüksek Telif ve Bulaşma Riski");
      expect(evaluation.summaryEn).toContain("Copyright & Contamination Hazard");
      expect(evaluation.primaryRisksTr.length).toBeGreaterThanOrEqual(4);
      expect(evaluation.remedialMitigationsTr.length).toBeGreaterThanOrEqual(4);
    });

    it("evaluates commercially viable monitored tier (COMMERCIALLY_VIABLE_MONITORED)", () => {
      const viableConfig: AiGovernanceConfig = {
        enabled: true,
        usageLevel: "AI_ASSISTED_HUMAN_REVIEWED", // 15p
        declaredTools: ["CURSOR", "GITHUB_COPILOT"],
        dataPrivacyTier: "CONSUMER_PUBLIC_TRAINING_RISK", // 25p
        humanInTheLoopAffirmed: true, // 0 penalty
        copyleftFreeWarranted: true, // 0 penalty
        zeroDataRetentionWarranted: true,
        strictDefectLiabilityAccepted: true,
        codeReviewToolUsed: false, // Gross = 40p -> tier: 25-54 COMMERCIALLY_VIABLE_MONITORED
      };

      const evaluation = AiGovernanceEngine.evaluateAiGovernanceRisk(viableConfig);

      expect(evaluation.riskScore).toBe(40);
      expect(evaluation.riskLevel).toBe("COMMERCIALLY_VIABLE_MONITORED");
      expect(evaluation.summaryTr).toContain("Ticarileştirilebilir Standart");
      expect(evaluation.summaryEn).toContain("Commercially Viable");
    });

    it("applies automated code review tool discount (-5 points)", () => {
      const configWithTool: AiGovernanceConfig = {
        enabled: true,
        usageLevel: "AI_ASSISTED_HUMAN_REVIEWED", // 15p
        declaredTools: ["CLAUDE_CODE"],
        dataPrivacyTier: "ENTERPRISE_ZERO_RETENTION", // 0p
        humanInTheLoopAffirmed: true,
        copyleftFreeWarranted: true,
        zeroDataRetentionWarranted: true,
        strictDefectLiabilityAccepted: true,
        codeReviewToolUsed: true, // -5p discount -> 10p
      };

      const evalWith = AiGovernanceEngine.evaluateAiGovernanceRisk(configWithTool);
      const evalWithout = AiGovernanceEngine.evaluateAiGovernanceRisk({
        ...configWithTool,
        codeReviewToolUsed: false,
      });

      expect(evalWithout.riskScore).toBe(15);
      expect(evalWith.riskScore).toBe(10);
    });
  });

  describe("2. Annex-4 Markdown & HTML Generation", () => {
    it("generates comprehensive Turkish Markdown addendum with statutory and EU AI Act articles", () => {
      const md = AiGovernanceEngine.generateAiGovernanceAnnexMarkdown(
        defaultAiConfig,
        "tr",
        "FinTech Bankacılık A.Ş.",
        "Zeynep Kaya"
      );

      expect(md).toContain("### EK-4: 5846 SAYILI FSEK m. 52 VE AB YAPAY ZEKA YASASI");
      expect(md).toContain("FinTech Bankacılık A.Ş.");
      expect(md).toContain("Zeynep Kaya");
      expect(md).toContain("MADDE 1: ŞEFFAFLIK VE YASAL BEYAN YÜKÜMLÜLÜĞÜ (EU AI ACT m. 50 UYUMU)");
      expect(md).toContain("MADDE 2: FSEK m. 52 UYARINCA İNSANİ HUSUSİYET (HUMAN-IN-THE-LOOP)");
      expect(md).toContain("MADDE 3: AÇIK KAYNAK VE COPYLEFT (GPL/AGPL) LİSANS BULAŞMA YASAĞI");
      expect(md).toContain("MADDE 4: MÜŞTERİ VERİ GİZLİLİĞİ VE SIFIR SAKLAMA (ZERO-DATA-RETENTION)");
      expect(md).toContain("MADDE 5: HALÜSİNASYON, GÜVENLİK AÇIKLARI VE AYIP SORUMLULUĞU (TBK m. 474)");
      expect(md).toContain("MADDE 6: TEST VE STATİK ANALİZ DENETİMİ");
      expect(md).toContain("MADDE 7: FİKRİ MÜLKİYET İHLALİ TAZMİNATI");
      expect(md).toContain("MADDE 8: MÜNHASIR DELİL SÖZLEŞMESİ (HMK m. 193)");
    });

    it("generates comprehensive English Markdown addendum matching international IP doctrine", () => {
      const md = AiGovernanceEngine.generateAiGovernanceAnnexMarkdown(
        defaultAiConfig,
        "en",
        "Global FinTech Corp",
        "John Doe"
      );

      expect(md).toContain("### ANNEX-4: AI-ASSISTED CODE INTELLECTUAL PROPERTY");
      expect(md).toContain("Global FinTech Corp");
      expect(md).toContain("John Doe");
      expect(md).toContain("SECTION 1: TRANSPARENCY & STATUTORY DISCLOSURE (EU AI ACT ART. 50)");
      expect(md).toContain("SECTION 2: HUMAN-IN-THE-LOOP & VALIDITY OF COPYRIGHT ASSIGNMENT");
      expect(md).toContain("SECTION 3: LICENSE HYGIENE & ANTI-COPYLEFT (GPL/AGPL) WARRANTY");
      expect(md).toContain("SECTION 4: CLIENT DATA CONFIDENTIALITY & ZERO DATA RETENTION");
      expect(md).toContain("SECTION 5: AI HALLUCINATIONS, SECURITY DEFECTS & WARRANTY (TBK ART. 474)");
      expect(md).toContain("SECTION 6: RIGOROUS TESTING & CODE AUDIT PROTOCOL");
      expect(md).toContain("SECTION 7: INTELLECTUAL PROPERTY INDEMNIFICATION");
      expect(md).toContain("SECTION 8: EXCLUSIVE EVIDENCE CONTRACT (HMK ART. 193)");
    });

    it("generates clean print-ready HTML with risk badge and statutory citations", () => {
      const html = AiGovernanceEngine.generateAiGovernanceAnnexHtml(defaultAiConfig, "tr");

      expect(html).toContain("EK-4: YAPAY ZEKA TELİF DEVRİ VE LİSANS TEMİZLİĞİ ŞARTNAMESİ");
      expect(html).toContain("FSEK m. 52");
      expect(html).toContain("EU AI Act m. 50/53");
      expect(html).toContain("HMK m. 193");
      expect(html).toContain("10/100");
    });
  });

  describe("3. Contract Generator Service Integration", () => {
    const baseContractInput = {
      engagementId: "eng-ai-test-101",
      listingTitle: "AI-Powered CRM Platform",
      category: "Full-Stack Development",
      matchedAt: new Date("2026-09-15T12:00:00Z"),
      scopeSummary: "Enterprise AI-driven Customer Relationship Management System",
      client: {
        displayName: "Nexus Solutions",
        email: "legal@nexus.com",
        role: "CLIENT" as const,
      },
      contractor: {
        displayName: "Burak Yılmaz",
        email: "burak@codeforge.io",
        role: "CONTRACTOR" as const,
      },
      locale: "tr" as const,
    };

    it("attaches EK-4, includes cross-references, and signs SHA-256 fingerprint when AI Governance is enabled", () => {
      const contract = ContractGeneratorService.generateContract({
        ...baseContractInput,
        aiGovernanceConfig: defaultAiConfig,
      });

      expect(contract.metadata.aiGovernanceIncluded).toBe(true);
      expect(contract.aiGovernanceConfig).toBeDefined();
      expect(contract.aiGovernanceEvaluation).toBeDefined();
      expect(contract.aiGovernanceEvaluation?.riskScore).toBe(10);
      expect(contract.markdown).toContain("EK-4: 5846 SAYILI FSEK m. 52 VE AB YAPAY ZEKA YASASI");
      expect(contract.markdown).toContain("5.4. **Yapay Zeka ve Fikri Mülkiyet Protokolü:**");
      expect(contract.markdown).toContain("6.3. **Yapay Zeka Modelleri ve Sıfır Saklama");
      expect(contract.htmlContent).toContain("EK-4: YAPAY ZEKA TELİF DEVRİ VE LİSANS TEMİZLİĞİ ŞARTNAMESİ");
      expect(contract.sha256Fingerprint).toBeDefined();
      expect(contract.sha256Fingerprint.length).toBe(64);
    });

    it("omits EK-4 when AI Governance is disabled", () => {
      const contract = ContractGeneratorService.generateContract({
        ...baseContractInput,
        aiGovernanceConfig: null,
      });

      expect(contract.metadata.aiGovernanceIncluded).toBe(false);
      expect(contract.aiGovernanceConfig).toBeNull();
      expect(contract.aiGovernanceEvaluation).toBeNull();
      expect(contract.markdown).not.toContain("EK-4: 5846 SAYILI FSEK");
      expect(contract.htmlContent).not.toContain("EK-4: YAPAY ZEKA TELİF DEVRİ");
    });
  });

  describe("4. HMK m. 193 Legal Dossier Export Integration", () => {
    it("includes EK-4 exhibit in the forensic evidence dossier when aiGovernanceConfig is provided", async () => {
      const dossier = await DossierService.buildDossier({
        engagementId: "eng-test-ai-dossier-001",
        requestingUserId: "user-test-client-1",
        locale: "tr",
        aiGovernanceConfig: defaultAiConfig,
      });

      const aiGovExhibit = dossier.manifest.documents.find(
        (doc) => doc.path === "01_ASIL_SOZLESME_VE_EKLERI/EK_4_YAPAY_ZEKA_VE_TELIF_PROTOKOLU.md"
      );

      expect(aiGovExhibit).toBeDefined();
      expect(aiGovExhibit?.title).toContain("EK-4: FSEK m. 52");
      expect(aiGovExhibit?.legalGroundTr).toContain("5846 s. FSEK m. 52");
      expect(aiGovExhibit?.sha256).toBeDefined();
      expect(dossier.manifest.checksumsSha256Content).toContain("EK_4_YAPAY_ZEKA_VE_TELIF_PROTOKOLU.md");
      expect(dossier.zipBuffer.length).toBeGreaterThan(0);
    });
  });
});
