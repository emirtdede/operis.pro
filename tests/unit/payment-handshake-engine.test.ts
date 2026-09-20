import { describe, it, expect } from "vitest";
import { PaymentHandshakeEngine } from "@/src/modules/engagements/payment-handshake/payment-handshake-engine";

describe("PaymentHandshakeEngine Unit Tests", () => {
  describe("validateReferenceFormat", () => {
    it("rejects empty reference", () => {
      const res = PaymentHandshakeEngine.validateReferenceFormat("FAST", "   ");
      expect(res.isValid).toBe(false);
      expect(res.error).toBeDefined();
    });

    it("rejects references shorter than 6 characters", () => {
      const res = PaymentHandshakeEngine.validateReferenceFormat("EFT", "12345");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("6 karakter");
    });

    it("accepts valid reference of length >= 6", () => {
      const res = PaymentHandshakeEngine.validateReferenceFormat("HAVALE", "HV123456");
      expect(res.isValid).toBe(true);
      expect(res.error).toBeUndefined();
    });

    it("gives a warning for short FAST codes (less than 8 chars)", () => {
      const res = PaymentHandshakeEngine.validateReferenceFormat("FAST", "123456");
      expect(res.isValid).toBe(true);
      expect(res.warning).toContain("FAST");
    });

    it("accepts full-length FAST reference without warning", () => {
      const res = PaymentHandshakeEngine.validateReferenceFormat("FAST", "TR202609190019283746152431");
      expect(res.isValid).toBe(true);
      expect(res.warning).toBeUndefined();
    });
  });

  describe("getTimingGuidance", () => {
    it("provides 24/7 instant settlement guidance for FAST under 100,000 TRY", () => {
      const guidance = PaymentHandshakeEngine.getTimingGuidance("FAST", 50000);
      expect(guidance.channel).toBe("FAST");
      expect(guidance.isOutsideHours).toBe(false);
      expect(guidance.warningTr).toBeUndefined();
      expect(guidance.expectedSettlementTr).toContain("7/24");
    });

    it("warns about standard EFT fallback when FAST amount exceeds 100,000 TRY", () => {
      const guidance = PaymentHandshakeEngine.getTimingGuidance("FAST", 150000);
      expect(guidance.channel).toBe("FAST");
      expect(guidance.warningTr).toContain("100.000 TL");
      expect(guidance.warningEn).toContain("100,000 TRY");
    });

    it("provides timing warning for EFT outside business hours (weekend)", () => {
      // 2026-09-20 is Sunday
      const sunday = new Date("2026-09-20T12:00:00Z");
      const guidance = PaymentHandshakeEngine.getTimingGuidance("EFT", 25000, sunday);
      expect(guidance.channel).toBe("EFT");
      expect(guidance.isOutsideHours).toBe(true);
      expect(guidance.warningTr).toContain("mesai saatleri");
      expect(guidance.expectedSettlementTr).toContain("İlk iş günü");
    });

    it("provides normal settlement guidance for EFT during weekday business hours", () => {
      // 2026-09-21 is Monday, 11:00 UTC = 14:00 Turkey time (within 09:00 - 17:00)
      const mondayNoon = new Date("2026-09-21T11:00:00Z");
      const guidance = PaymentHandshakeEngine.getTimingGuidance("EFT", 25000, mondayNoon);
      expect(guidance.channel).toBe("EFT");
      expect(guidance.isOutsideHours).toBe(false);
      expect(guidance.warningTr).toBeUndefined();
      expect(guidance.expectedSettlementTr).toContain("15-45 dakika");
    });

    it("provides instant settlement guidance for Havale (intra-bank)", () => {
      const guidance = PaymentHandshakeEngine.getTimingGuidance("HAVALE", 80000);
      expect(guidance.channel).toBe("HAVALE");
      expect(guidance.expectedSettlementTr).toContain("Aynı banka içi havale 7/24");
    });
  });

  describe("Cryptographic Dual-Seal & Settlement Certificate", () => {
    it("generates deterministic declaration seal", () => {
      const seal1 = PaymentHandshakeEngine.calculateDeclarationSeal({
        milestoneId: "m-001",
        senderBank: "GARANTI_BBVA",
        transferChannel: "FAST",
        referenceNumber: "REF-100293",
        amount: 50000,
        currency: "TRY",
        userId: "usr-client-1",
        timestamp: "2026-09-19T21:00:00Z",
      });

      const seal2 = PaymentHandshakeEngine.calculateDeclarationSeal({
        milestoneId: "m-001",
        senderBank: "GARANTI_BBVA",
        transferChannel: "FAST",
        referenceNumber: "REF-100293",
        amount: 50000,
        currency: "TRY",
        userId: "usr-client-1",
        timestamp: "2026-09-19T21:00:00Z",
      });

      expect(seal1.length).toBe(64);
      expect(seal1).toBe(seal2);
    });

    it("creates dual-chained confirmation seal that changes if declaration changes", () => {
      const decSeal1 = "a".repeat(64);
      const decSeal2 = "b".repeat(64);

      const dual1 = PaymentHandshakeEngine.calculateConfirmationDualSeal(decSeal1, {
        milestoneId: "m-001",
        invoiceNumber: "SMM-2026-001",
        userId: "usr-dev-1",
        timestamp: "2026-09-19T21:30:00Z",
      });

      const dual2 = PaymentHandshakeEngine.calculateConfirmationDualSeal(decSeal2, {
        milestoneId: "m-001",
        invoiceNumber: "SMM-2026-001",
        userId: "usr-dev-1",
        timestamp: "2026-09-19T21:30:00Z",
      });

      expect(dual1.length).toBe(64);
      expect(dual1).not.toBe(dual2);
    });

    it("generates legal settlement certificate and renders markdown with HMK m. 193 and TBK m. 132 clauses", () => {
      const cert = PaymentHandshakeEngine.generateSettlementCertificate({
        engagementId: "eng-999",
        milestoneId: "m-001",
        milestoneSequence: 1,
        milestoneTitle: "Aşama 1: API & DB",
        amount: 50000,
        currency: "TRY",
        payerUserId: "usr-client-1",
        senderBank: "Garanti BBVA",
        transferChannel: "FAST",
        referenceNumber: "FAST-20260919-994",
        declaredAt: "2026-09-19T20:00:00Z",
        declarationSeal: "dec".padEnd(64, "0"),
        payeeUserId: "usr-dev-1",
        invoiceNumber: "SMM-2026-001",
        confirmedAt: "2026-09-19T20:15:00Z",
        confirmationSeal: "conf".padEnd(64, "0"),
        dualSeal: "dual".padEnd(64, "0"),
      });

      expect(cert.certificateId).toMatch(/^CERT-SETTLE-M-001-/);
      expect(cert.legalDischargeClauseTr).toContain("Türk Borçlar Kanunu m. 132");
      expect(cert.legalEvidentiaryClauseTr).toContain("Hukuk Muhakemeleri Kanunu m. 193");

      const markdown = PaymentHandshakeEngine.formatSettlementCertificateMarkdown(cert);
      expect(markdown).toContain("OPERIS TAHKİKAT VE İTFA BELGESİ");
      expect(markdown).toContain("50.000 TRY");
      expect(markdown).toContain("HMK m. 193");
      expect(markdown).toContain("TBK m. 132");
      expect(markdown).toContain(cert.dualSeal);
    });
  });
});
