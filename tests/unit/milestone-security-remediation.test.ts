import { describe, it, expect, beforeEach } from "vitest";
import {
  MilestoneService,
  inMemoryMilestones,
} from "@/src/modules/engagements/milestone-service";

describe("Milestone Security & Handshake Remediation Suite (WP-11, WP-12, WP-13)", () => {
  const engagementId = "eng-test-payout-guards-101";
  const clientUserId = "user-client-001";
  const contractorUserId = "user-freelancer-001";

  beforeEach(() => {
    inMemoryMilestones.delete(engagementId);
  });

  describe("WP-12: Strict State Transitions & Handshake Guards", () => {
    it("rejects confirming payment on an UNPAID milestone", async () => {
      const plan = await MilestoneService.getMilestones(engagementId, clientUserId);
      const mId = plan.milestones[0]!.id;

      // Freelancer attempts to confirm payment before employer has marked it paid
      await expect(
        MilestoneService.confirmPayment(
          engagementId,
          mId,
          { invoiceNumber: "INV-2026-001" },
          contractorUserId
        )
      ).rejects.toThrow(/İşveren henüz ödeme bildirimi yapmamıştır/);
    });

    it("rejects reverting payment on an UNPAID milestone", async () => {
      const plan = await MilestoneService.getMilestones(engagementId, clientUserId);
      const mId = plan.milestones[0]!.id;

      // Employer attempts to revert payment when nothing was marked
      await expect(
        MilestoneService.revertPayment(engagementId, mId, clientUserId)
      ).rejects.toThrow(/Ödeme bildirimi yapılmamış bir hakediş geri alınamaz/);
    });

    it("rejects disputing payment on an UNPAID milestone", async () => {
      const plan = await MilestoneService.getMilestones(engagementId, clientUserId);
      const mId = plan.milestones[0]!.id;

      // Freelancer attempts to dispute payment when nothing was declared
      await expect(
        MilestoneService.disputePayment(
          engagementId,
          mId,
          { disputeReason: "FUNDS_NOT_RECEIVED", disputeNote: "Para gelmedi" },
          contractorUserId
        )
      ).rejects.toThrow(/Bildirilmemiş ödeme için itiraz yapılamaz/);
    });

    it("rejects re-marking, reverting, or disputing an already CONFIRMED_PAID milestone", async () => {
      const plan = await MilestoneService.getMilestones(engagementId, clientUserId);
      const mId = plan.milestones[0]!.id;

      // 1. Mark paid as client
      await MilestoneService.markPayment(
        engagementId,
        mId,
        { paymentReference: "EFT-TEST-999" },
        clientUserId
      );

      // 2. Confirm paid as freelancer
      await MilestoneService.confirmPayment(
        engagementId,
        mId,
        { invoiceNumber: "INV-2026-CONFIRMED" },
        contractorUserId
      );

      // 3. Employer cannot mark paid again
      await expect(
        MilestoneService.markPayment(
          engagementId,
          mId,
          { paymentReference: "EFT-ATTACK-000" },
          clientUserId
        )
      ).rejects.toThrow(/Bu hakedişin ödemesi zaten kesinleşmiştir/);

      // 4. Employer cannot revert confirmed payment
      await expect(
        MilestoneService.revertPayment(engagementId, mId, clientUserId)
      ).rejects.toThrow(/Kesinleşmiş \(onaylanmış\) ödeme geri alınamaz/);

      // 5. Freelancer cannot dispute confirmed payment
      await expect(
        MilestoneService.disputePayment(
          engagementId,
          mId,
          { disputeReason: "FUNDS_NOT_RECEIVED", disputeNote: "Para henüz hesabıma yansımadı" },
          contractorUserId
        )
      ).rejects.toThrow(/Kesinleşmiş \(onaylanmış\) ödeme için itiraz bildirilemez/);
    });

    it("idempotently returns success when confirming an already confirmed milestone", async () => {
      const plan = await MilestoneService.getMilestones(engagementId, clientUserId);
      const mId = plan.milestones[0]!.id;

      await MilestoneService.markPayment(
        engagementId,
        mId,
        { paymentReference: "EFT-IDEMPOTENT-1" },
        clientUserId
      );

      const firstConfirm = await MilestoneService.confirmPayment(
        engagementId,
        mId,
        { invoiceNumber: "INV-IDEM-001" },
        contractorUserId
      );
      expect(firstConfirm.success).toBe(true);

      const secondConfirm = await MilestoneService.confirmPayment(
        engagementId,
        mId,
        { invoiceNumber: "INV-IDEM-001" },
        contractorUserId
      );
      expect(secondConfirm.success).toBe(true);
      expect(secondConfirm.milestone.paymentStatus).toBe("CONFIRMED_PAID");
    });
  });

  describe("WP-13: True Participant Identities & Immutable Certificate Snapshots", () => {
    it("returns identical immutable settlement certificates for both client and contractor", async () => {
      const plan = await MilestoneService.getMilestones(engagementId, clientUserId);
      const mId = plan.milestones[0]!.id;

      await MilestoneService.markPayment(
        engagementId,
        mId,
        {
          paymentReference: "FAST-TR-998877",
          senderBank: "GARANTI_BBVA",
          transferChannel: "FAST",
        },
        clientUserId
      );

      await MilestoneService.confirmPayment(
        engagementId,
        mId,
        { invoiceNumber: "SMM-2026-IMMUTABLE" },
        contractorUserId
      );

      // Fetch certificate as Client
      const certForClient = await MilestoneService.getSettlementCertificate(
        engagementId,
        mId,
        clientUserId
      );

      // Fetch certificate as Freelancer
      const certForContractor = await MilestoneService.getSettlementCertificate(
        engagementId,
        mId,
        contractorUserId
      );

      expect(certForClient).toBeDefined();
      expect(certForContractor).toBeDefined();

      // Certificate content must be completely identical
      expect(certForClient!.certificateId).toBe(certForContractor!.certificateId);
      expect(certForClient!.dualSeal).toBe(certForContractor!.dualSeal);
      expect(certForClient!.payer.userId).toBe(clientUserId);
      expect(certForClient!.payee.userId).toBe(contractorUserId);
      expect(certForClient!.payer.referenceNumber).toBe("FAST-TR-998877");
      expect(certForClient!.payer.senderBank).toBe("GARANTI_BBVA");
      expect(certForClient!.payer.transferChannel).toBe("FAST");
      expect(certForClient!.payee.invoiceNumber).toBe("SMM-2026-IMMUTABLE");

      // Verify payee is NOT inverted to client even when requested by client!
      expect(certForClient!.payer.userId).not.toBe(certForClient!.payee.userId);
    });
  });

  describe("WP-11: Milestone Plan Protection Against Modification of Paid Milestones", () => {
    it("rejects plan re-structuring when any milestone is already marked or confirmed", async () => {
      const plan = await MilestoneService.getMilestones(engagementId, clientUserId);
      const mId = plan.milestones[0]!.id;

      // Mark payment on first milestone
      await MilestoneService.markPayment(
        engagementId,
        mId,
        { paymentReference: "EFT-LOCK-PLAN" },
        clientUserId
      );

      // Attempt to re-plan milestones
      await expect(
        MilestoneService.updateMilestonePlan(
          engagementId,
          [
            {
              sequenceNumber: 1,
              title: "Tamamı Tek Hakediş",
              description: "Tek aşamalı anahtar teslim hakediş",
              percentage: 100,
              amount: 30000,
            },
          ],
          clientUserId
        )
      ).rejects.toThrow(/Ödemesi yapılmış veya teyit edilmiş hakedişler varken/);
    });
  });
});
