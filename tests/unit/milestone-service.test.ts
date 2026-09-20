import { describe, it, expect, beforeEach } from "vitest";
import { MilestoneSynthesizer } from "@/src/modules/engagements/milestone-synthesizer";
import {
  MilestoneService,
  inMemoryMilestones,
} from "@/src/modules/engagements/milestone-service";
import { DisputeArbiterService } from "@/src/modules/ai/dispute-arbiter";
import { IpAssignmentDeedEngine } from "@/src/modules/engagements/ip-assignment/ip-assignment-engine";

describe("MilestoneSynthesizer Engine", () => {
  it("synthesizes fullstack web/software milestones totaling exactly 100%", () => {
    const result = MilestoneSynthesizer.synthesizeMilestonesForListing({
      categoryKey: "web-development",
      title: "Next.js & Supabase B2B SaaS Platform",
      budgetLabel: "100.000 TL",
    });

    expect(result.length).toBeGreaterThanOrEqual(3);
    const totalPercentage = result.reduce((sum, m) => sum + m.percentage, 0);
    expect(Math.round(totalPercentage)).toBe(100);

    // Verify amounts sum up correctly
    const totalAmount = result.reduce((sum, m) => sum + m.amount, 0);
    expect(totalAmount).toBe(100000);

    // Verify sequence numbers are sequential
    result.forEach((m, idx) => {
      expect(m.sequenceNumber).toBe(idx + 1);
    });
  });

  it("synthesizes mobile app development milestones with appropriate deliverable types", () => {
    const result = MilestoneSynthesizer.synthesizeMilestonesForListing({
      categoryKey: "mobile-development",
      title: "React Native iOS & Android FinTech App",
      budgetLabel: "75.000 TL",
    });

    expect(result.length).toBe(4);
    const totalPercentage = result.reduce((sum, m) => sum + m.percentage, 0);
    expect(Math.round(totalPercentage)).toBe(100);

    const urlTypes = result.map((m) => m.suggestedUrlType);
    expect(urlTypes).toContain("CODE_REPO");
    expect(urlTypes).toContain("STAGING_URL");
  });

  it("synthesizes AI & Data science milestones", () => {
    const result = MilestoneSynthesizer.synthesizeMilestonesForListing({
      sectorKey: "ai-data",
      title: "LLM RAG Pipeline & Embedding Microservice",
      budgetLabel: "60.000 TL",
    });

    expect(result.length).toBe(3);
    const totalPercentage = result.reduce((sum, m) => sum + m.percentage, 0);
    expect(Math.round(totalPercentage)).toBe(100);
    expect(result[0]!.suggestedUrlType).toBe("CODE_REPO");
  });

  it("synthesizes UI/UX & Design milestones", () => {
    const result = MilestoneSynthesizer.synthesizeMilestonesForListing({
      sectorKey: "design-creative",
      title: "Mobile App Design System & Prototype",
      budgetLabel: "40.000 TL",
    });

    expect(result.length).toBe(3);
    const totalPercentage = result.reduce((sum, m) => sum + m.percentage, 0);
    expect(Math.round(totalPercentage)).toBe(100);
    expect(result[0]!.suggestedUrlType).toBe("DESIGN_PROTOTYPE");
  });

  it("synthesizes DevOps & Security milestones", () => {
    const result = MilestoneSynthesizer.synthesizeMilestonesForListing({
      sectorKey: "security-devops",
      title: "Kubernetes Cluster Setup & CI/CD Hardening",
      budgetLabel: "50.000 TL",
    });

    expect(result.length).toBe(3);
    const totalPercentage = result.reduce((sum, m) => sum + m.percentage, 0);
    expect(Math.round(totalPercentage)).toBe(100);
  });

  it("handles empty or generic categories gracefully with a valid 3-phase fallback", () => {
    const result = MilestoneSynthesizer.synthesizeMilestonesForListing({
      categoryKey: "unknown-misc",
      title: "Özel Danışmanlık Projesi",
      budgetLabel: "30.000 TL",
    });

    expect(result.length).toBe(3);
    const totalPercentage = result.reduce((sum, m) => sum + m.percentage, 0);
    expect(Math.round(totalPercentage)).toBe(100);
    const totalAmount = result.reduce((sum, m) => sum + m.amount, 0);
    expect(totalAmount).toBe(30000);
  });
});

describe("MilestoneService Core Business Logic", () => {
  const engagementId = "eng-test-milestone-001";
  const ownerUserId = "user-client-001";
  const freelancerUserId = "user-freelancer-001";
  const outsiderUserId = "user-outsider-999";

  beforeEach(() => {
    inMemoryMilestones.delete(engagementId);
  });

  it("auto-synthesizes initial milestones when none exist", async () => {
    const plan = await MilestoneService.getMilestones(
      engagementId,
      ownerUserId
    );

    expect(plan.engagementId).toBe(engagementId);
    expect(plan.milestones.length).toBeGreaterThan(0);
    expect(plan.deliverablesProgressPercent).toBe(0);
    expect(plan.paymentProgressPercent).toBe(0);
    expect(plan.allDeliverablesAccepted).toBe(false);
    expect(plan.allPaymentsConfirmed).toBe(false);
  });

  it("updates milestone plan with customized roadmap and validates 100% total", async () => {
    // 1. Should reject if percentage does not equal 100%
    await expect(
      MilestoneService.updateMilestonePlan(
        engagementId,
        [
          {
            sequenceNumber: 1,
            title: "Aşama 1",
            description: "İlk adım",
            percentage: 40,
            amount: 20000,
            deliverableUrlType: "CODE_REPO",
          },
          {
            sequenceNumber: 2,
            title: "Aşama 2",
            description: "İkinci adım",
            percentage: 50, // 40 + 50 = 90% (Not 100%)
            amount: 25000,
            deliverableUrlType: "STAGING_URL",
          },
        ],
        ownerUserId
      )
    ).rejects.toThrow(/100/);

    // 2. Should accept valid custom roadmap totaling 100%
    const updateResult = await MilestoneService.updateMilestonePlan(
      engagementId,
      [
        {
          sequenceNumber: 1,
          title: "1. Aşama - Tasarım & API Şeması",
          description: "Figma ve OpenAPI şeması",
          percentage: 25,
          amount: 12500,
          deliverableUrlType: "DESIGN_PROTOTYPE",
        },
        {
          sequenceNumber: 2,
          title: "2. Aşama - MVP & Çekirdek Özellikler",
          description: "Kullanıcı kayıt ve ödeme modülü",
          percentage: 45,
          amount: 22500,
          deliverableUrlType: "STAGING_URL",
        },
        {
          sequenceNumber: 3,
          title: "3. Aşama - Canlıya Alma & Kod Devri",
          description: "Prod deploy ve kaynak kod teslimi",
          percentage: 30,
          amount: 15000,
          deliverableUrlType: "CODE_REPO",
        },
      ],
      ownerUserId
    );

    expect(updateResult.success).toBe(true);
    expect(updateResult.milestones.length).toBe(3);
    expect(updateResult.milestones[0]!.percentage).toBe(25);
    expect(updateResult.milestones[1]!.percentage).toBe(45);
    expect(updateResult.milestones[2]!.percentage).toBe(30);
  });

  it("handles complete deliverable submission, acceptance, payment marking, reverting, and invoice confirmation", async () => {
    // 1. Initialize
    const plan = await MilestoneService.getMilestones(
      engagementId,
      freelancerUserId
    );

    const firstMilestoneId = plan.milestones[0]!.id;

    // 2. Freelancer submits deliverable URL
    const deliverableRes = await MilestoneService.updateDeliverable(
      engagementId,
      firstMilestoneId,
      {
        status: "SUBMITTED",
        deliverableUrl: "https://github.com/operis-demo/phase-1-repo",
        deliverableUrlType: "CODE_REPO",
        deliverableNote: "Tüm mimari ve ilk commitler yüklendi.",
      },
      freelancerUserId
    );

    expect(deliverableRes.success).toBe(true);
    expect(deliverableRes.milestone.deliverableStatus).toBe("SUBMITTED");
    expect(deliverableRes.milestone.deliverableUrl).toBe("https://github.com/operis-demo/phase-1-repo");
    expect(deliverableRes.milestone.sha256Seal).toBeDefined();
    expect(deliverableRes.milestone.sha256Seal?.length).toBe(64);

    // 3. Client accepts deliverable
    const acceptRes = await MilestoneService.acceptDeliverable(
      engagementId,
      firstMilestoneId,
      ownerUserId
    );

    expect(acceptRes.success).toBe(true);
    expect(acceptRes.milestone.deliverableStatus).toBe("ACCEPTED");

    // 4. Client marks payment sent (EFT/Havale)
    const markPaidRes = await MilestoneService.markPayment(
      engagementId,
      firstMilestoneId,
      {
        paymentReference: "GARANTI-EFT-994821",
      },
      ownerUserId
    );

    expect(markPaidRes.success).toBe(true);
    expect(markPaidRes.milestone.paymentStatus).toBe("MARKED_PAID");
    expect(markPaidRes.milestone.paymentReference).toBe("GARANTI-EFT-994821");

    // 5. Client accidentally marked wrong milestone, uses zero-escrow reversibility
    const revertRes = await MilestoneService.revertPayment(
      engagementId,
      firstMilestoneId,
      ownerUserId
    );

    expect(revertRes.success).toBe(true);
    expect(revertRes.milestone.paymentStatus).toBe("UNPAID");

    // 6. Client re-marks payment with correct info
    await MilestoneService.markPayment(
      engagementId,
      firstMilestoneId,
      {
        paymentReference: "GARANTI-EFT-CORRECT-994822",
      },
      ownerUserId
    );

    // 7. Freelancer verifies bank account and confirms payment with invoice/SMM
    const confirmRes = await MilestoneService.confirmPayment(
      engagementId,
      firstMilestoneId,
      {
        invoiceNumber: "GIB2026-00000412",
      },
      freelancerUserId
    );

    expect(confirmRes.success).toBe(true);
    expect(confirmRes.milestone.paymentStatus).toBe("CONFIRMED_PAID");
    expect(confirmRes.milestone.invoiceNumber).toBe("GIB2026-00000412");

    // Verify updated plan metrics reflect progress
    const updatedPlan = await MilestoneService.getMilestones(
      engagementId,
      ownerUserId
    );
    expect(updatedPlan.paymentProgressPercent).toBeGreaterThan(0);
  });

  it("enforces strict privacy: outsider user cannot view private deliverable link", async () => {
    // 1. Setup plan
    const plan = await MilestoneService.getMilestones(
      engagementId,
      ownerUserId
    );

    const mId = plan.milestones[0]!.id;

    // 2. Freelancer submits secret repo link
    await MilestoneService.updateDeliverable(
      engagementId,
      mId,
      {
        status: "SUBMITTED",
        deliverableUrl: "https://secret-internal-git.corp/vault/code",
        deliverableUrlType: "CODE_REPO",
      },
      freelancerUserId
    );

    // 3. Authenticated participant sees deliverableUrl
    const participantView = await MilestoneService.getMilestones(
      engagementId,
      ownerUserId
    );
    expect(participantView.milestones[0]!.deliverableUrl).toBe(
      "https://secret-internal-git.corp/vault/code"
    );

    // 4. Outsider sees deliverableUrl masked as null
    const outsiderView = await MilestoneService.getMilestones(
      engagementId,
      outsiderUserId
    );
    expect(outsiderView.milestones[0]!.deliverableUrl).toBeNull();
  });

  it("executes full Bilateral Handshake Protocol with bank details, channel, dispute, and dual-seal certificate", async () => {
    // 1. Initialize
    const plan = await MilestoneService.getMilestones(engagementId, ownerUserId);
    const mId = plan.milestones[0]!.id;

    // 2. Client marks payment via FAST with rich banking metadata
    const markRes = await MilestoneService.markPayment(
      engagementId,
      mId,
      {
        paymentReference: "FAST-TR-99882211",
        senderBank: "GARANTI_BBVA",
        transferChannel: "FAST",
        transferDate: "2026-09-19",
        transferTime: "15:30",
        paymentReceiptUrl: "https://operis.blob/receipt1.pdf",
      },
      ownerUserId
    );

    expect(markRes.success).toBe(true);
    expect(markRes.milestone.paymentStatus).toBe("MARKED_PAID");
    expect(markRes.milestone.senderBank).toBe("GARANTI_BBVA");
    expect(markRes.milestone.transferChannel).toBe("FAST");
    expect(markRes.milestone.transferDate).toBe("2026-09-19");
    expect(markRes.milestone.transferTime).toBe("15:30");
    expect(markRes.milestone.timingGuidance).toBeDefined();
    expect(markRes.milestone.auditTrail?.length).toBeGreaterThan(0);
    expect(markRes.milestone.auditTrail?.[0]?.action).toBe("PAYMENT_DECLARED");

    // 3. Freelancer disputes payment (funds not received)
    const disputeRes = await MilestoneService.disputePayment(
      engagementId,
      mId,
      {
        disputeReason: "FUNDS_NOT_RECEIVED",
        disputeNote: "Mobil bankacılığı kontrol ettim, henüz bakiye girişi görünmüyor.",
      },
      freelancerUserId
    );

    expect(disputeRes.success).toBe(true);
    expect(disputeRes.milestone.paymentStatus).toBe("DISPUTED_PAID");
    expect(disputeRes.milestone.disputeReason).toBe("FUNDS_NOT_RECEIVED");
    expect(disputeRes.milestone.disputeNote).toContain("Mobil bankacılığı");

    // Verify audit trail logged dispute
    const lastAudit = disputeRes.milestone.auditTrail?.slice(-1)[0];
    expect(lastAudit?.action).toBe("PAYMENT_DISPUTED");
    expect(lastAudit?.actorRole).toBe("SPECIALIST");

    // 4. Employer reverts payment mark after seeing dispute
    const revertRes = await MilestoneService.revertPayment(engagementId, mId, ownerUserId);
    expect(revertRes.milestone.paymentStatus).toBe("UNPAID");

    // 5. Employer makes real transfer and re-marks payment
    await MilestoneService.markPayment(
      engagementId,
      mId,
      {
        paymentReference: "FAST-TR-99882299-VALID",
        senderBank: "IS_BANKASI",
        transferChannel: "FAST",
      },
      ownerUserId
    );

    // 6. Freelancer sees money in account and confirms receipt
    const confirmRes = await MilestoneService.confirmPayment(
      engagementId,
      mId,
      { invoiceNumber: "SMM2026-00099" },
      freelancerUserId
    );

    expect(confirmRes.success).toBe(true);
    expect(confirmRes.milestone.paymentStatus).toBe("CONFIRMED_PAID");
    expect(confirmRes.milestone.dualSeal).toBeDefined();
    expect(confirmRes.milestone.dualSeal?.length).toBe(64);
    expect(confirmRes.milestone.settlementCertificate).toBeDefined();
    expect(confirmRes.milestone.settlementCertificate?.payer.senderBank).toBe("IS_BANKASI");
    expect(confirmRes.milestone.settlementCertificate?.payee.invoiceNumber).toBe("SMM2026-00099");
    expect(confirmRes.milestone.settlementCertificate?.legalEvidentiaryClauseTr).toContain("Hukuk Muhakemeleri Kanunu m. 193");

    // 7. Test persistence: Reload milestone plan from store
    const reloadedPlan = await MilestoneService.getMilestones(engagementId, ownerUserId);
    const reloadedM = reloadedPlan.milestones.find((m) => m.id === mId);
    expect(reloadedM?.paymentStatus).toBe("CONFIRMED_PAID");
    expect(reloadedM?.dualSeal).toBe(confirmRes.milestone.dualSeal);
    expect(reloadedM?.settlementCertificate).toBeDefined();
  });

  it("validates payment reference and rejects invalid formats (< 6 chars)", async () => {
    const plan = await MilestoneService.getMilestones(engagementId, ownerUserId);
    const mId = plan.milestones[0]!.id;

    await expect(
      MilestoneService.markPayment(
        engagementId,
        mId,
        { paymentReference: "123" }, // Less than 6 chars
        ownerUserId
      )
    ).rejects.toThrow(/en az 6 karakter/);
  });

  it("automatically mints formal FSEK m. 52 IP Assignment Deed upon payment confirmation and restricts outsider access", async () => {
    const plan = await MilestoneService.getMilestones(engagementId, ownerUserId);
    const mId = plan.milestones[0]!.id;

    // 1. Submit deliverable with explicit Git Commit Hash
    const devRes = await MilestoneService.updateDeliverable(
      engagementId,
      mId,
      {
        status: "SUBMITTED",
        deliverableUrl: "https://github.com/operis-client/payment-core/commit/8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b",
        deliverableUrlType: "CODE_REPO",
        gitCommitHash: "8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b",
        deliverableNote: "Core engine deliverable ready.",
      },
      freelancerUserId
    );
    expect(devRes.milestone.gitCommitHash).toBe("8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b");

    // 2. Accept deliverable
    await MilestoneService.acceptDeliverable(engagementId, mId, ownerUserId);

    // 3. Mark payment
    await MilestoneService.markPayment(
      engagementId,
      mId,
      {
        paymentReference: "FAST-TEST-554433",
        senderBank: "IS_BANKASI",
        transferChannel: "FAST",
      },
      ownerUserId
    );

    // 4. Confirm payment (Freelancer) -> Triggers automatic IP Assignment Deed minting
    const confirmRes = await MilestoneService.confirmPayment(
      engagementId,
      mId,
      {
        invoiceNumber: "INV-2026-0099",
      },
      freelancerUserId
    );

    expect(confirmRes.success).toBe(true);
    expect(confirmRes.milestone.paymentStatus).toBe("CONFIRMED_PAID");
    expect(confirmRes.milestone.ipAssignmentDeed).toBeDefined();

    const deed = confirmRes.milestone.ipAssignmentDeed!;
    expect(deed.deedId).toMatch(/^OPR-IP-DEED-/);
    expect(deed.pinnedWork.gitCommitHash).toBe("8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b");
    expect(deed.transferredRights).toHaveLength(5);
    expect(deed.masterDeedSha256).toBeDefined();

    // 5. Query deed via MilestoneService.getIpAssignmentDeed
    const queryDeed = await MilestoneService.getIpAssignmentDeed(engagementId, mId, ownerUserId);
    expect(queryDeed).toBeDefined();
    expect(queryDeed?.deedId).toBe(deed.deedId);
    expect(queryDeed?.pinnedWork.gitCommitHash).toBe("8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b");

    const md = IpAssignmentDeedEngine.formatDeedMarkdown(queryDeed!);
    expect(md).toContain("5846 SAYILI FSEK");

    const html = IpAssignmentDeedEngine.formatDeedHtml(queryDeed!);
    expect(html).toContain("<!DOCTYPE html>");

    const verification = IpAssignmentDeedEngine.verifyDeed(queryDeed!);
    expect(verification.isValid).toBe(true);

    // 6. Query all deeds for engagement
    const allDeeds = await MilestoneService.getEngagementIpDeeds(engagementId, freelancerUserId);
    expect(allDeeds.length).toBeGreaterThanOrEqual(1);

    // 7. Outsider access must be blocked
    await expect(
      MilestoneService.getIpAssignmentDeed(engagementId, mId, outsiderUserId)
    ).rejects.toThrow(/Unauthorized|Yetkisiz/);
  });
});

describe("Dispute Arbiter Milestone Integration", () => {
  it("recognizes accepted milestones as statutory entitlement under TBK m. 470", () => {
    const report = DisputeArbiterService.analyzeDispute({
      engagementId: "eng-dispute-milestone-test",
      listingTitle: "SaaS Mimarisi",
      category: "software-development",
      matchedAt: new Date(Date.now() - 20 * 86400000),
      milestones: [
        {
          id: "m1",
          title: "Mimari & Tasarım",
          percentage: 30,
          deliverableStatus: "ACCEPTED",
          paymentStatus: "CONFIRMED_PAID",
        },
        {
          id: "m2",
          title: "Fonksiyonel Demo",
          percentage: 40,
          deliverableStatus: "ACCEPTED",
          paymentStatus: "PENDING", // Client accepted demo, but withheld payment!
        },
        {
          id: "m3",
          title: "Kapanış",
          percentage: 30,
          deliverableStatus: "PENDING",
          paymentStatus: "PENDING",
        },
      ],
      messages: [],
    });

    // Freelancer entitlement should be at least 70% (30% + 40% accepted)
    expect(report.freelancerEntitlementPercent).toBeGreaterThanOrEqual(70);

    // Identified breaches must flag client withholding payment for accepted deliverables
    const clientBreach = report.identifiedBreaches.find(
      (b) => b.party === "CLIENT" && b.clause.includes("TBK m. 470")
    );
    expect(clientBreach).toBeDefined();
    expect(clientBreach?.evidenceSnippet).toContain("%70");
  });
});
