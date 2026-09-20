import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as milestonesGetHandler, POST as milestonesPostHandler } from "@/src/app/api/work/[id]/milestones/route";
import { POST as deliverablePostHandler } from "@/src/app/api/work/[id]/milestones/[milestoneId]/deliverable/route";
import { GET as paymentGetHandler, POST as paymentPostHandler } from "@/src/app/api/work/[id]/milestones/[milestoneId]/payment/route";
import { inMemoryMilestones } from "@/src/modules/engagements/milestone-service";
import * as sessionModule from "@/src/modules/auth/session";

vi.mock("@/src/modules/auth/session", () => ({
  getSession: vi.fn().mockResolvedValue({
    userId: "user-client-001",
    role: "CLIENT",
    email: "client@operis.pro",
    status: "ACTIVE",
    type: "specialist",
    authVersion: 1,
    createdAt: Date.now(),
    expiresAt: Date.now() + 86400000,
  } as any),
}));

vi.mock("@/src/lib/security/rate-limit", () => ({
  evaluateSecurityAccessAsync: vi.fn().mockResolvedValue({ allowed: true }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  normalizeIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

describe("Zero-Escrow Milestone API Routes", () => {
  const engagementId = "eng-test-route-101";

  beforeEach(() => {
    inMemoryMilestones.delete(engagementId);
    vi.spyOn(sessionModule, "getSession").mockResolvedValue({
      userId: "user-client-001",
      role: "CLIENT",
      email: "client@operis.pro",
      status: "ACTIVE",
      type: "specialist",
      authVersion: 1,
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000,
    } as any);
  });

  it("GET /api/work/[id]/milestones returns synthesized roadmap and metrics", async () => {
    const req = new Request(`http://localhost/api/work/${engagementId}/milestones`);
    const res = await milestonesGetHandler(req, {
      params: Promise.resolve({ id: engagementId }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.milestones).toBeDefined();
    expect(json.milestones.length).toBeGreaterThan(0);
    expect(json.totalAmount).toBeGreaterThan(0);
  });

  it("POST /api/work/[id]/milestones rejects roadmaps where total percentage != 100%", async () => {
    const req = new Request(`http://localhost/api/work/${engagementId}/milestones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        milestones: [
          {
            sequenceNumber: 1,
            title: "Aşama 1",
            description: "İlk adım",
            percentage: 40,
            amount: 20000,
          },
          {
            sequenceNumber: 2,
            title: "Aşama 2",
            description: "İkinci adım",
            percentage: 30, // 40 + 30 = 70%
            amount: 15000,
          },
        ],
      }),
    });

    const res = await milestonesPostHandler(req, {
      params: Promise.resolve({ id: engagementId }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/100/);
  });

  it("POST /api/work/[id]/milestones accepts valid custom roadmap totaling 100%", async () => {
    const req = new Request(`http://localhost/api/work/${engagementId}/milestones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        milestones: [
          {
            sequenceNumber: 1,
            title: "1. Tasarım & Mimari",
            description: "Figma ve DB şeması",
            percentage: 30,
            amount: 15000,
            deliverableUrlType: "DESIGN_PROTOTYPE",
          },
          {
            sequenceNumber: 2,
            title: "2. Fonksiyonel Test Sürümü",
            description: "Staging deployment",
            percentage: 40,
            amount: 20000,
            deliverableUrlType: "STAGING_URL",
          },
          {
            sequenceNumber: 3,
            title: "3. Kod Teslimi & Canlıya Alma",
            description: "Prod deployment & IP assignment",
            percentage: 30,
            amount: 15000,
            deliverableUrlType: "CODE_REPO",
          },
        ],
      }),
    });

    const res = await milestonesPostHandler(req, {
      params: Promise.resolve({ id: engagementId }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.milestones.length).toBe(3);
  });

  it("POST /api/work/[id]/milestones/[milestoneId]/deliverable handles UPDATE and ACCEPT", async () => {
    // First initialize plan
    const initReq = new Request(`http://localhost/api/work/${engagementId}/milestones`);
    const initRes = await milestonesGetHandler(initReq, {
      params: Promise.resolve({ id: engagementId }),
    });
    const { milestones } = await initRes.json();
    const mId = milestones[0].id;

    // 1. Submit deliverable
    const updateReq = new Request(`http://localhost/api/work/${engagementId}/milestones/${mId}/deliverable`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "UPDATE",
        status: "SUBMITTED",
        deliverableUrl: "https://github.com/my-org/my-project",
        deliverableUrlType: "CODE_REPO",
        deliverableNote: "İlk teslimat hazır.",
      }),
    });

    const updateRes = await deliverablePostHandler(updateReq, {
      params: Promise.resolve({ id: engagementId, milestoneId: mId }),
    });
    expect(updateRes.status).toBe(200);
    const updateJson = await updateRes.json();
    expect(updateJson.milestone.deliverableStatus).toBe("SUBMITTED");
    expect(updateJson.milestone.sha256Seal).toBeDefined();

    // 2. Accept deliverable
    const acceptReq = new Request(`http://localhost/api/work/${engagementId}/milestones/${mId}/deliverable`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ACCEPT",
      }),
    });

    const acceptRes = await deliverablePostHandler(acceptReq, {
      params: Promise.resolve({ id: engagementId, milestoneId: mId }),
    });
    expect(acceptRes.status).toBe(200);
    const acceptJson = await acceptRes.json();
    expect(acceptJson.milestone.deliverableStatus).toBe("ACCEPTED");
  });

  it("POST /api/work/[id]/milestones/[milestoneId]/payment handles MARK_PAID, REVERT_PAID, and CONFIRM_PAID", async () => {
    // Initialize plan
    const initReq = new Request(`http://localhost/api/work/${engagementId}/milestones`);
    const initRes = await milestonesGetHandler(initReq, {
      params: Promise.resolve({ id: engagementId }),
    });
    const { milestones } = await initRes.json();
    const mId = milestones[0].id;

    // 1. Mark paid
    const markReq = new Request(`http://localhost/api/work/${engagementId}/milestones/${mId}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "MARK_PAID",
        paymentReference: "EFT-8839210",
      }),
    });

    const markRes = await paymentPostHandler(markReq, {
      params: Promise.resolve({ id: engagementId, milestoneId: mId }),
    });
    expect(markRes.status).toBe(200);
    const markJson = await markRes.json();
    expect(markJson.milestone.paymentStatus).toBe("MARKED_PAID");

    // 2. Revert payment (zero-escrow reversibility)
    const revertReq = new Request(`http://localhost/api/work/${engagementId}/milestones/${mId}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "REVERT_PAID",
      }),
    });

    const revertRes = await paymentPostHandler(revertReq, {
      params: Promise.resolve({ id: engagementId, milestoneId: mId }),
    });
    expect(revertRes.status).toBe(200);
    const revertJson = await revertRes.json();
    expect(revertJson.milestone.paymentStatus).toBe("UNPAID");

    // 3. Re-mark and then Confirm Paid
    await paymentPostHandler(markReq, {
      params: Promise.resolve({ id: engagementId, milestoneId: mId }),
    });

    const confirmReq = new Request(`http://localhost/api/work/${engagementId}/milestones/${mId}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "CONFIRM_PAID",
        invoiceNumber: "SMM-2026-0001",
      }),
    });

    const confirmRes = await paymentPostHandler(confirmReq, {
      params: Promise.resolve({ id: engagementId, milestoneId: mId }),
    });
    expect(confirmRes.status).toBe(200);
    const confirmJson = await confirmRes.json();
    expect(confirmJson.milestone.paymentStatus).toBe("CONFIRMED_PAID");
    expect(confirmJson.milestone.invoiceNumber).toBe("SMM-2026-0001");
  });

  it("POST /api/work/[id]/milestones/[milestoneId]/payment handles DISPUTE_PAID and GET returns settlement certificate", async () => {
    // 1. Initialize plan
    const initReq = new Request(`http://localhost/api/work/${engagementId}/milestones`);
    const initRes = await milestonesGetHandler(initReq, {
      params: Promise.resolve({ id: engagementId }),
    });
    const { milestones } = await initRes.json();
    const mId = milestones[0].id;

    // 2. Mark payment sent
    const markReq = new Request(`http://localhost/api/work/${engagementId}/milestones/${mId}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "MARK_PAID",
        paymentReference: "FAST-20260919-8819",
        senderBank: "GARANTI_BBVA",
        transferChannel: "FAST",
      }),
    });
    await paymentPostHandler(markReq, {
      params: Promise.resolve({ id: engagementId, milestoneId: mId }),
    });

    // 3. Specialist files dispute
    const disputeReq = new Request(`http://localhost/api/work/${engagementId}/milestones/${mId}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "DISPUTE_PAID",
        disputeReason: "FUNDS_NOT_RECEIVED",
        disputeNote: "Para henüz hesabıma yansımadı, dekont sorgusu bulunamadı.",
      }),
    });

    const disputeRes = await paymentPostHandler(disputeReq, {
      params: Promise.resolve({ id: engagementId, milestoneId: mId }),
    });

    expect(disputeRes.status).toBe(200);
    const disputeJson = await disputeRes.json();
    expect(disputeJson.milestone.paymentStatus).toBe("DISPUTED_PAID");
    expect(disputeJson.milestone.disputeReason).toBe("FUNDS_NOT_RECEIVED");

    // 4. Specialist subsequently confirms payment when resolved
    const confirmReq = new Request(`http://localhost/api/work/${engagementId}/milestones/${mId}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "CONFIRM_PAID",
        invoiceNumber: "SMM-2026-9912",
      }),
    });

    const confirmRes = await paymentPostHandler(confirmReq, {
      params: Promise.resolve({ id: engagementId, milestoneId: mId }),
    });
    expect(confirmRes.status).toBe(200);

    // 5. GET /payment returns the HMK m. 193 Settlement Certificate and markdown representation
    const certGetReq = new Request(`http://localhost/api/work/${engagementId}/milestones/${mId}/payment`);
    const certGetRes = await paymentGetHandler(certGetReq, {
      params: Promise.resolve({ id: engagementId, milestoneId: mId }),
    });

    expect(certGetRes.status).toBe(200);
    const certJson = await certGetRes.json();
    expect(certJson.success).toBe(true);
    expect(certJson.certificate).toBeDefined();
    expect(certJson.certificate.dualSeal).toBeDefined();
    expect(certJson.certificate.dualSeal.length).toBe(64);
    expect(certJson.certificate.payer.senderBank).toBe("GARANTI_BBVA");
    expect(certJson.certificate.payee.invoiceNumber).toBe("SMM-2026-9912");
    expect(certJson.markdown).toContain("OPERIS TAHKİKAT VE İTFA BELGESİ");
    expect(certJson.markdown).toContain(certJson.certificate.dualSeal);
  });
});
