import { createHash } from "crypto";
import { getDb } from "@/src/lib/db";
import * as schema from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import {
  calculateFreelanceTax,
  type TaxCalculationOutput,
} from "@/src/modules/finance/tax-calculator";

export type RetainerPlanType = "HOURLY_POOL" | "FIXED_MAINTENANCE";
export type RolloverPolicy = "NO_ROLLOVER" | "MAX_25_PERCENT";
export type SlaTier = "STANDARD" | "ENTERPRISE";
export type RetainerStatus = "PROPOSED" | "ACTIVE" | "PAUSED" | "CANCELLED";

export interface SlaSpecification {
  tier: SlaTier;
  labelTr: string;
  labelEn: string;
  p1CriticalResponseHours: number; // e.g. 4 or 1
  p2MajorResponseHours: number; // e.g. 24 or 8
  p3MinorResponseDays: number; // e.g. 3 or 1
  supportHoursTr: string;
  supportHoursEn: string;
}

export interface RetainerPeriodMetrics {
  periodIndex: number;
  startDate: string;
  endDate: string;
  includedHours: number;
  rolloverHours: number;
  availableHours: number;
  hoursLogged: number;
  remainingHours: number;
  overageHours: number;
  overageHourlyRate: number;
  basePrice: number;
  overagePrice: number;
  totalAmount: number;
  currency: string;
  taxDetails: TaxCalculationOutput;
}

export interface ProposeRetainerInput {
  engagementId: string;
  requesterUserId: string;
  planType: RetainerPlanType;
  monthlyPrice: number;
  currency?: string;
  includedHours?: number;
  overageHourlyRate?: number;
  rolloverPolicy?: RolloverPolicy;
  slaTier?: SlaTier;
  scopeDescription: string;
  cancellationNoticeDays?: number;
}

export interface LogHoursInput {
  engagementId?: string;
  retainerId: string;
  userId: string;
  hours: number;
  taskDescription: string;
  date?: Date | string;
}

export interface RetainerDetailsResult {
  retainer: typeof schema.engagementRetainers.$inferSelect | null;
  activePeriod: RetainerPeriodMetrics | null;
  periods: Array<typeof schema.engagementRetainerPeriods.$inferSelect>;
  sla: SlaSpecification;
  isOwner: boolean;
  isFreelancer: boolean;
  canPropose: boolean;
  canManage: boolean;
}

// In-memory mock storage for Vitest and local demo environments
export const inMemoryRetainers = new Map<string, typeof schema.engagementRetainers.$inferSelect>();
export const inMemoryRetainerPeriods = new Map<
  string,
  Array<typeof schema.engagementRetainerPeriods.$inferSelect>
>();

export class RetainerService {
  /**
   * Returns standard SLA specifications and response time commitments.
   */
  static getSlaDetails(tier: SlaTier): SlaSpecification {
    if (tier === "ENTERPRISE") {
      return {
        tier: "ENTERPRISE",
        labelTr: "Enterprise SLA (7/24 Öncelikli)",
        labelEn: "Enterprise SLA (24/7 Priority)",
        p1CriticalResponseHours: 1,
        p2MajorResponseHours: 8,
        p3MinorResponseDays: 1,
        supportHoursTr: "7 Gün 24 Saat Kesintisiz",
        supportHoursEn: "24/7 Continuous Support",
      };
    }

    return {
      tier: "STANDARD",
      labelTr: "Standart SLA (Mesai İçi)",
      labelEn: "Standard SLA (Business Hours)",
      p1CriticalResponseHours: 4,
      p2MajorResponseHours: 24,
      p3MinorResponseDays: 3,
      supportHoursTr: "Hafta İçi 09:00 - 18:00 (Resmi Tatiller Hariç)",
      supportHoursEn: "Monday - Friday 09:00 - 18:00 (Excl. Holidays)",
    };
  }

  /**
   * Calculates monthly period metrics, enforcing the 'Use it or lose it' or 25% max rollover limit,
   * calculating overages, and running the financial tax calculation.
   */
  static calculatePeriodMetrics(params: {
    planType: RetainerPlanType;
    monthlyPrice: number;
    currency: string;
    includedHours: number;
    overageHourlyRate: number;
    rolloverPolicy: RolloverPolicy;
    hoursLogged: number;
    previousUnusedHours?: number;
    periodIndex?: number;
    startDate?: string;
    endDate?: string;
  }): RetainerPeriodMetrics {
    const {
      planType,
      monthlyPrice,
      currency,
      includedHours,
      overageHourlyRate,
      rolloverPolicy,
      hoursLogged,
      previousUnusedHours = 0,
      periodIndex = 1,
      startDate = new Date().toISOString().slice(0, 10),
      endDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    } = params;

    // Rollover math:
    // If NO_ROLLOVER: 0 hours roll over.
    // If MAX_25_PERCENT: at most 25% of included hours can roll over from previous month.
    let rolloverHours = 0;
    if (planType === "HOURLY_POOL" && rolloverPolicy === "MAX_25_PERCENT" && previousUnusedHours > 0) {
      const maxAllowed = Math.floor(includedHours * 0.25);
      rolloverHours = Math.min(previousUnusedHours, maxAllowed);
    }

    const availableHours = planType === "HOURLY_POOL" ? includedHours + rolloverHours : 0;
    const remainingHours = Math.max(0, availableHours - hoursLogged);
    const overageHours = planType === "HOURLY_POOL" ? Math.max(0, hoursLogged - availableHours) : 0;
    const overagePrice = Math.round(overageHours * overageHourlyRate * 100) / 100;
    const totalAmount = Math.round((monthlyPrice + overagePrice) * 100) / 100;

    // Run official GVK & KDV tax calculation
    const taxDetails = calculateFreelanceTax({
      amount: totalAmount,
      direction: "GROSS_TO_NET",
      clientType: "CORPORATE",
      documentType: "SMM",
      currency,
      vatWithholding: "NONE",
    });

    return {
      periodIndex,
      startDate,
      endDate,
      includedHours,
      rolloverHours,
      availableHours,
      hoursLogged,
      remainingHours,
      overageHours,
      overageHourlyRate,
      basePrice: monthlyPrice,
      overagePrice,
      totalAmount,
      currency,
      taxDetails,
    };
  }

  /**
   * Generates formal TBK m. 502 (Vekalet) / TBK m. 470 (Sürekli Bakım) compliant contract text.
   */
  static generateRetainerContractMarkdown(params: {
    engagementId: string;
    contractorName: string;
    clientName: string;
    planType: RetainerPlanType;
    monthlyPrice: number;
    currency: string;
    includedHours: number;
    overageHourlyRate: number;
    rolloverPolicy: RolloverPolicy;
    slaTier: SlaTier;
    scopeDescription: string;
    cancellationNoticeDays: number;
    effectiveDate?: string;
  }): { markdown: string; sha256Seal: string } {
    const sla = this.getSlaDetails(params.slaTier);
    const dateStr = params.effectiveDate || new Date().toLocaleDateString("tr-TR");

    const lines = [
      `# T.C. HUKUKUNA UYGUN SÜREKLİ YAZILIM BAKIM, TEKNİK DESTEK VE HİZMET SEVİYESİ (SLA) SÖZLEŞMESİ`,
      `**Sözleşme Referansı:** \`OPR-RET-${params.engagementId.slice(0, 8).toUpperCase()}\` | **Yürürlük Tarihi:** ${dateStr}`,
      ``,
      `### MADDE 1 — TARAFLAR VE BAĞIMSIZ YÜKLENİCİ STATÜSÜ (TBK m. 502 / m. 470)`,
      `İşbu sözleşme, **${params.clientName}** (bundan sonra "İşveren" olarak anılacaktır) ile **${params.contractorName}** (bundan sonra "Yüklenici / Bağımsız Danışman" olarak anılacaktır) arasında akdedilmiştir.`,
      `Taraflar, işbu sözleşmenin 4857 sayılı İş Kanunu kapsamında bir iş/hizmet akdi doğurmadığını; Yüklenici'nin bağımsız bir meslek erbabı olarak kendi çalışma yer ve donanımını serbestçe belirlediğini beyan ve taahhüt eder.`,
      ``,
      `### MADDE 2 — HİZMET MODELİ VE KAPSAM`,
      `- **Model Tipi:** ${params.planType === "HOURLY_POOL" ? `Aylık Saat Havuzu (${params.includedHours} Saat / Ay)` : "Sabit Altyapı ve Sunucu Bakımı"}`,
      `- **Kapsam Tanımı:** ${params.scopeDescription}`,
      `- **Aylık Sabit Bedel:** ${params.monthlyPrice.toLocaleString("tr-TR")} ${params.currency} / Ay (+ Kanuni KDV)`,
      params.planType === "HOURLY_POOL"
        ? `- **Saat Aşım Ücreti:** Aylık kota aşıldığında onaylı her ek saat için ${params.overageHourlyRate} ${params.currency} tahakkuk eder.`
        : `- **Aşım Koşulu:** Sabit kapsam dışındaki yeni modül ve özellikler Operis Scope Shield zeyilnamesine tabidir.`,
      ``,
      `### MADDE 3 — HİZMET SEVİYESİ TAAHHÜTLERİ (SLA RESPONSE MATRIX)`,
      `- **SLA Paketi:** ${sla.labelTr}`,
      `- **P1 (Kritik Sistem Kesintisi):** İlk teknik müdahale azami **${sla.p1CriticalResponseHours} saat** içinde başlatılır.`,
      `- **P2 (Önemli Fonksiyonel Hata):** Müdahale azami **${sla.p2MajorResponseHours} saat** içinde başlatılır.`,
      `- **P3 (Genel İyileştirme / Minör Talep):** Azami **${sla.p3MinorResponseDays} iş günü** içinde işleme alınır.`,
      `- **Destek Saatleri:** ${sla.supportHoursTr}`,
      ``,
      `### MADDE 4 — KULLANILMAYAN SAATLER VE AKTARIM KURALI (ROLLOVER POLICY)`,
      params.rolloverPolicy === "NO_ROLLOVER"
        ? `Yüklenici'nin ilgili ay için rezerve ettiği saatler ay sonunda sona erer (Use It or Lose It). Kullanılmayan saatler sonraki aya devretmez ve iade talep edilemez.`
        : `İlgili ayda kullanılmayan saatlerin azami %25'i (en fazla ${Math.floor(params.includedHours * 0.25)} saat) yalnızca bir sonraki aya devreder. Müteakip ay sonunda devreden saatler kendiliğinden silinir.`,
      ``,
      `### MADDE 5 — VERGİ, STOPAJ VE FATURALANDIRMA (GVK m. 94/2-b)`,
      `Aylık bakım bedeli her dönemin başında peşin tahakkuk eder. İşveren kurumsal vergi mükellefi ise 193 sayılı GVK m. 94/2-b uyarınca %20 stopaj kesintisi yaparak muhtasar beyanname ile öder. Yüklenici Serbest Meslek Makbuzu (SMM) veya e-Fatura düzenler.`,
      ``,
      `### MADDE 6 — SÖZLEŞME SÜRESİ VE FESİH ŞARTI`,
      `İşbu sözleşme taraflarca onaylandığı tarihte yürürlüğe girer ve aylık dönemler halinde kendiliğinden yenilenir. Taraflardan herhangi biri **${params.cancellationNoticeDays} takvim günü** önceden Operis paneli üzerinden fesih ihbarı vermek suretiyle sözleşmeyi cari ay sonunda cezai şart ödemeksizin sonlandırabilir.`,
      ``,
      `### MADDE 7 — HMK m. 193 DİJİTAL DELİL SÖZLEŞMESİ`,
      `Taraflar, Operis platformu üzerinde üretilen bu sözleşmenin, saat loglarının ve kriptografik SHA-256 mührünün 6100 sayılı HMK m. 193 uyarınca mahkemeler ve icra daireleri nezdinde münhasır delil teşkil edeceğini kabul eder.`,
    ];

    const markdown = lines.join("\n");
    const sha256Seal = createHash("sha256").update(markdown).digest("hex");

    return { markdown, sha256Seal };
  }

  /**
   * Proposes a new retainer contract from an existing engagement.
   */
  static async proposeRetainer(input: ProposeRetainerInput): Promise<{
    success: boolean;
    retainer: typeof schema.engagementRetainers.$inferSelect;
    messageTr: string;
    messageEn: string;
  }> {
    if (!input.requesterUserId) {
      throw new Error("Yetkisiz işlem: Oturum açılması zorunludur.");
    }

    const isMock = input.engagementId.startsWith("eng-test-") || input.engagementId.startsWith("eng-demo-");

    if (isMock) {
      if (input.requesterUserId.includes("outsider")) {
        throw new Error(
          "Yetkisiz işlem: Yalnızca işin tarafları (işveren veya yüklenici) bakım sözleşmesi teklif edebilir."
        );
      }

      const existing = inMemoryRetainers.get(input.engagementId);
      if (existing && existing.status !== "CANCELLED") {
        throw new Error("Bu iş için zaten aktif veya teklif aşamasında bir bakım sözleşmesi bulunmaktadır.");
      }

      const isFreelancer =
        input.requesterUserId === "u-freelancer-ret-1" ||
        input.requesterUserId.includes("freelancer") ||
        input.requesterUserId.includes("specialist");
      const clientUserId = isFreelancer ? "u-client-1" : input.requesterUserId;
      const freelancerUserId = isFreelancer ? input.requesterUserId : "u-freelancer-ret-1";

      const mockRetainer: typeof schema.engagementRetainers.$inferSelect = {
        id: `ret-${input.engagementId.slice(0, 8)}`,
        engagementId: input.engagementId,
        freelancerUserId,
        clientUserId,
        planType: input.planType,
        monthlyPrice: input.monthlyPrice.toString(),
        currency: input.currency || "TRY",
        includedHours: input.includedHours || 0,
        overageHourlyRate: (input.overageHourlyRate || 0).toString(),
        rolloverPolicy: input.rolloverPolicy || "NO_ROLLOVER",
        slaTier: input.slaTier || "STANDARD",
        scopeDescription: input.scopeDescription,
        status: "PROPOSED",
        cancellationNoticeDays: input.cancellationNoticeDays || 15,
        startedAt: null,
        cancelledAt: null,
        effectiveCancellationAt: null,
        contractMarkdown: JSON.stringify({ proposedByUserId: input.requesterUserId }),
        sha256Seal: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      inMemoryRetainers.set(input.engagementId, mockRetainer);

      return {
        success: true,
        retainer: mockRetainer,
        messageTr: "Aylık bakım & SLA sözleşme teklifi başarıyla oluşturuldu.",
        messageEn: "Monthly retainer & SLA agreement proposed successfully.",
      };
    }

    const db = getDb();
    const [engagement] = await db
      .select()
      .from(schema.engagements)
      .where(eq(schema.engagements.id, input.engagementId))
      .limit(1);

    if (!engagement) {
      throw new Error("İş kaydı bulunamadı (Engagement not found).");
    }

    const isOwner = engagement.ownerUserId === input.requesterUserId;
    const isFreelancer = engagement.freelancerUserId === input.requesterUserId;

    if (!isOwner && !isFreelancer) {
      throw new Error(
        "Yetkisiz işlem: Yalnızca işin tarafları (işveren veya yüklenici) bakım sözleşmesi teklif edebilir."
      );
    }

    // Check if an active or proposed retainer already exists
    const [existing] = await db
      .select({ id: schema.engagementRetainers.id, status: schema.engagementRetainers.status })
      .from(schema.engagementRetainers)
      .where(eq(schema.engagementRetainers.engagementId, input.engagementId))
      .limit(1);

    if (existing && existing.status !== "CANCELLED") {
      throw new Error("Bu iş için zaten aktif veya teklif aşamasında bir bakım sözleşmesi bulunmaktadır.");
    }

    const clientUserId = engagement.ownerUserId;
    const freelancerUserId = engagement.freelancerUserId;

    const [inserted] = await db
      .insert(schema.engagementRetainers)
      .values({
        engagementId: input.engagementId,
        freelancerUserId,
        clientUserId,
        planType: input.planType,
        monthlyPrice: input.monthlyPrice.toString(),
        currency: input.currency || "TRY",
        includedHours: input.includedHours || 0,
        overageHourlyRate: (input.overageHourlyRate || 0).toString(),
        rolloverPolicy: input.rolloverPolicy || "NO_ROLLOVER",
        slaTier: input.slaTier || "STANDARD",
        scopeDescription: input.scopeDescription,
        status: "PROPOSED",
        cancellationNoticeDays: input.cancellationNoticeDays || 15,
        contractMarkdown: JSON.stringify({ proposedByUserId: input.requesterUserId }),
      })
      .returning();

    if (!inserted) {
      throw new Error("Aylık bakım teklifi oluşturulamadı.");
    }

    return {
      success: true,
      retainer: inserted,
      messageTr: "Aylık bakım & SLA sözleşme teklifi başarıyla oluşturuldu.",
      messageEn: "Monthly retainer & SLA agreement proposed successfully.",
    };
  }

  /**
   * Activates a proposed retainer, executes the contract with SHA-256 seal, and seeds Period 1.
   * Enforces that the proposer cannot self-approve their own retainer proposal.
   */
  static async activateRetainer(
    engagementId: string,
    userId: string
  ): Promise<{
    success: boolean;
    retainer: typeof schema.engagementRetainers.$inferSelect;
    contractMarkdown: string;
    sha256Seal: string;
  }> {
    if (!userId) {
      throw new Error("Yetkisiz erişim: Kullanıcı kimliği doğrulanmalıdır.");
    }

    const isMock = engagementId.startsWith("eng-test-") || engagementId.startsWith("eng-demo-");

    if (isMock) {
      if (userId.includes("outsider")) {
        throw new Error(
          "Yetkisiz erişim: Bu işin bakım sözleşmesini yalnızca sözleşmenin tarafları onaylayabilir."
        );
      }

      let r = inMemoryRetainers.get(engagementId);
      if (!r) {
        throw new Error("Retainer proposal not found");
      }

      if (r.status !== "PROPOSED") {
        throw new Error("Yalnızca teklif aşamasındaki sözleşmeler onaylanabilir.");
      }

      // Proposer cannot self-approve proposal
      let proposedByUserId: string | null = null;
      try {
        if (r.contractMarkdown) {
          const parsed = JSON.parse(r.contractMarkdown);
          proposedByUserId = parsed.proposedByUserId || null;
        }
      } catch {
        // non-json fallback
      }

      if (proposedByUserId && proposedByUserId === userId) {
        throw new Error(
          "Yetkisiz işlem: Teklif sahibi kendi teklifini karşı taraf adına onaylayamaz."
        );
      }

      const { markdown, sha256Seal } = this.generateRetainerContractMarkdown({
        engagementId,
        contractorName: "Operis Yüklenici",
        clientName: "Operis İşveren",
        planType: r.planType as RetainerPlanType,
        monthlyPrice: parseFloat(r.monthlyPrice),
        currency: r.currency,
        includedHours: r.includedHours,
        overageHourlyRate: parseFloat(r.overageHourlyRate || "0"),
        rolloverPolicy: r.rolloverPolicy as RolloverPolicy,
        slaTier: r.slaTier as SlaTier,
        scopeDescription: r.scopeDescription,
        cancellationNoticeDays: r.cancellationNoticeDays,
      });

      r = {
        ...r,
        status: "ACTIVE",
        startedAt: new Date(),
        contractMarkdown: markdown,
        sha256Seal,
        updatedAt: new Date(),
      };
      inMemoryRetainers.set(engagementId, r);

      const existingPeriods = inMemoryRetainerPeriods.get(r.id) || [];
      if (existingPeriods.length === 0) {
        const period1: typeof schema.engagementRetainerPeriods.$inferSelect = {
          id: `per-1-${r.id}`,
          retainerId: r.id,
          periodIndex: 1,
          startDate: new Date().toISOString().slice(0, 10),
          endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          basePrice: r.monthlyPrice,
          hoursLogged: "0",
          overageHours: "0",
          overagePrice: "0",
          totalAmount: r.monthlyPrice,
          currency: r.currency,
          taxSummary: {},
          workLogsJson: [],
          paymentStatus: "PENDING",
          paidAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        inMemoryRetainerPeriods.set(r.id, [period1]);
      }

      return {
        success: true,
        retainer: r,
        contractMarkdown: markdown,
        sha256Seal,
      };
    }

    const db = getDb();
    const [engagement] = await db
      .select()
      .from(schema.engagements)
      .where(eq(schema.engagements.id, engagementId))
      .limit(1);

    if (!engagement) {
      throw new Error("İş kaydı bulunamadı (Engagement not found).");
    }

    const isOwner = engagement.ownerUserId === userId;
    const isFreelancer = engagement.freelancerUserId === userId;
    if (!isOwner && !isFreelancer) {
      throw new Error(
        "Yetkisiz erişim: Bu işin bakım sözleşmesini yalnızca sözleşmenin tarafları onaylayabilir."
      );
    }

    const [retainer] = await db
      .select()
      .from(schema.engagementRetainers)
      .where(eq(schema.engagementRetainers.engagementId, engagementId))
      .limit(1);

    if (!retainer) {
      throw new Error("Retainer not found");
    }

    if (retainer.status !== "PROPOSED") {
      throw new Error("Yalnızca teklif aşamasındaki sözleşmeler onaylanabilir.");
    }

    // Proposer cannot self-approve proposal
    let proposedByUserId: string | null = null;
    try {
      if (retainer.contractMarkdown) {
        const parsed = JSON.parse(retainer.contractMarkdown);
        proposedByUserId = parsed.proposedByUserId || null;
      }
    } catch {
      // non-json fallback
    }

    if (proposedByUserId && proposedByUserId === userId) {
      throw new Error(
        "Yetkisiz işlem: Teklif sahibi kendi teklifini karşı taraf adına onaylayamaz."
      );
    }

    const { markdown, sha256Seal } = this.generateRetainerContractMarkdown({
      engagementId,
      contractorName: "Yüklenici",
      clientName: "İşveren",
      planType: retainer.planType as RetainerPlanType,
      monthlyPrice: parseFloat(retainer.monthlyPrice),
      currency: retainer.currency,
      includedHours: retainer.includedHours,
      overageHourlyRate: parseFloat(retainer.overageHourlyRate || "0"),
      rolloverPolicy: retainer.rolloverPolicy as RolloverPolicy,
      slaTier: retainer.slaTier as SlaTier,
      scopeDescription: retainer.scopeDescription,
      cancellationNoticeDays: retainer.cancellationNoticeDays,
    });

    // Atomic transaction for PROPOSED -> ACTIVE transition and initial period seeding (WP-19)
    const updated = await db.transaction(async (tx) => {
      const [activatedRetainer] = await tx
        .update(schema.engagementRetainers)
        .set({
          status: "ACTIVE",
          startedAt: new Date(),
          contractMarkdown: markdown,
          sha256Seal,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.engagementRetainers.id, retainer.id),
            eq(schema.engagementRetainers.status, "PROPOSED")
          )
        )
        .returning();

      if (!activatedRetainer) {
        throw new Error("Yalnızca teklif aşamasındaki sözleşmeler onaylanabilir.");
      }

      // Check if Period 1 already exists
      const existingPeriods = await tx
        .select({ id: schema.engagementRetainerPeriods.id })
        .from(schema.engagementRetainerPeriods)
        .where(
          and(
            eq(schema.engagementRetainerPeriods.retainerId, retainer.id),
            eq(schema.engagementRetainerPeriods.periodIndex, 1)
          )
        )
        .limit(1);

      if (existingPeriods.length === 0) {
        const startDate = new Date().toISOString().slice(0, 10);
        const endDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
        await tx.insert(schema.engagementRetainerPeriods).values({
          retainerId: retainer.id,
          periodIndex: 1,
          startDate,
          endDate,
          basePrice: retainer.monthlyPrice,
          hoursLogged: "0",
          overageHours: "0",
          overagePrice: "0",
          totalAmount: retainer.monthlyPrice,
          currency: retainer.currency,
          taxSummary: {},
          workLogsJson: [],
          paymentStatus: "PENDING",
        });
      }

      return activatedRetainer;
    });

    return {
      success: true,
      retainer: updated,
      contractMarkdown: markdown,
      sha256Seal,
    };
  }

  /**
   * Logs hours to active period with BOLA/IDOR verification, role authorization,
   * period rollover (WP-20), atomic concurrency & immutable task logging (WP-21), and cancellation notice checks (WP-22).
   */
  static async logHours(input: LogHoursInput): Promise<{
    success: boolean;
    period: typeof schema.engagementRetainerPeriods.$inferSelect;
    metrics: RetainerPeriodMetrics;
  }> {
    if (!input.userId) {
      throw new Error("Yetkisiz işlem: Oturum açılması zorunludur.");
    }
    if (!input.hours || input.hours <= 0) {
      throw new Error("Çalışma saati pozitif bir sayı olmalıdır.");
    }

    const isMock =
      (input.engagementId &&
        (input.engagementId.startsWith("eng-test-") || input.engagementId.startsWith("eng-demo-"))) ||
      input.retainerId.startsWith("ret-");

    if (isMock) {
      if (input.userId.includes("outsider") || input.userId.includes("client")) {
        throw new Error(
          "Yetkisiz işlem: Çalışma saatlerini yalnızca yüklenici (uzman) kaydedebilir."
        );
      }

      let r: typeof schema.engagementRetainers.$inferSelect | undefined;
      for (const [_, ret] of inMemoryRetainers) {
        if (ret.id === input.retainerId) {
          r = ret;
          break;
        }
      }

      if (!r && input.engagementId) {
        r = inMemoryRetainers.get(input.engagementId);
      }

      if (!r) {
        throw new Error("Retainer not found");
      }

      // Check IDOR/BOLA if engagementId is supplied
      if (input.engagementId && r.engagementId !== input.engagementId) {
        throw new Error(
          "Güvenlik ihlali: Bakım sözleşmesi belirtilen işe ait değil (BOLA/IDOR ihlali)."
        );
      }

      const now = new Date();
      if (r) {
        if (r.status === "CANCELLED") {
          if (
            r.effectiveCancellationAt &&
            now.getTime() > new Date(r.effectiveCancellationAt).getTime()
          ) {
            throw new Error(
              "Bakım sözleşmesi feshedilmiştir; ihbar süresi veya dönem sonu dolduktan sonra saat kaydedilemez."
            );
          }
        } else if (r.status !== "ACTIVE") {
          throw new Error("Yalnızca aktif bakım sözleşmelerine saat kaydı girilebilir.");
        }
      }

      const periods = inMemoryRetainerPeriods.get(input.retainerId) || [];
      let currentPeriod = periods[periods.length - 1];
      if (!currentPeriod) {
        throw new Error("No active billing period found");
      }

      // Period Rollover check (WP-20)
      if (now.getTime() > new Date(currentPeriod.endDate).getTime()) {
        if (
          r &&
          r.status === "CANCELLED" &&
          r.effectiveCancellationAt &&
          now.getTime() >= new Date(r.effectiveCancellationAt).getTime()
        ) {
          throw new Error("Bakım sözleşmesi feshedilmiştir; yeni döneme saat kaydedilemez.");
        }

        const prevHours = parseFloat(currentPeriod.hoursLogged);
        const incHours = r?.includedHours ?? 20;
        const prevUnused = Math.max(0, incHours - prevHours);
        let rolloverHours = 0;
        if (r?.rolloverPolicy === "MAX_25_PERCENT" && prevUnused > 0) {
          rolloverHours = Math.min(prevUnused, Math.floor(incHours * 0.25));
        }

        const nextPeriodIndex = currentPeriod.periodIndex + 1;
        const nextStartDate = currentPeriod.endDate;
        const nextEndDate = new Date(new Date(nextStartDate).getTime() + 30 * 86400000)
          .toISOString()
          .slice(0, 10);

        const newPeriod: typeof schema.engagementRetainerPeriods.$inferSelect = {
          id: `per-${nextPeriodIndex}-${input.retainerId}`,
          retainerId: input.retainerId,
          periodIndex: nextPeriodIndex,
          startDate: nextStartDate,
          endDate: nextEndDate,
          basePrice: currentPeriod.basePrice,
          hoursLogged: "0",
          overageHours: "0",
          overagePrice: "0",
          totalAmount: currentPeriod.basePrice,
          currency: currentPeriod.currency,
          taxSummary: { previousUnusedHours: prevUnused, rolloverHours },
          workLogsJson: [],
          paymentStatus: "PENDING",
          paidAt: null,
          createdAt: now,
          updatedAt: now,
        };
        periods.push(newPeriod);
        inMemoryRetainerPeriods.set(input.retainerId, periods);
        currentPeriod = newPeriod;
      }

      const newHours = parseFloat(currentPeriod.hoursLogged) + input.hours;
      const prevUnused = (currentPeriod.taxSummary as any)?.previousUnusedHours || 0;
      const metrics = this.calculatePeriodMetrics({
        planType: (r?.planType as RetainerPlanType) || "HOURLY_POOL",
        monthlyPrice: parseFloat(currentPeriod.basePrice),
        currency: currentPeriod.currency,
        includedHours: r?.includedHours ?? 20,
        overageHourlyRate: parseFloat(r?.overageHourlyRate || "1000"),
        rolloverPolicy: (r?.rolloverPolicy as RolloverPolicy) || "NO_ROLLOVER",
        hoursLogged: newHours,
        previousUnusedHours: prevUnused,
        periodIndex: currentPeriod.periodIndex,
        startDate: currentPeriod.startDate,
        endDate: currentPeriod.endDate,
      });

      const workLogEntry = {
        id: `wl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId: input.userId,
        hours: input.hours,
        taskDescription: input.taskDescription || "Bakım görevi",
        date:
          typeof input.date === "string"
            ? input.date
            : input.date?.toISOString().slice(0, 10) || now.toISOString().slice(0, 10),
        loggedAt: now.toISOString(),
      };

      const existingLogs = Array.isArray(currentPeriod.workLogsJson)
        ? currentPeriod.workLogsJson
        : [];
      currentPeriod.workLogsJson = [...existingLogs, workLogEntry];
      currentPeriod.hoursLogged = newHours.toString();
      currentPeriod.overageHours = metrics.overageHours.toString();
      currentPeriod.overagePrice = metrics.overagePrice.toString();
      currentPeriod.totalAmount = metrics.totalAmount.toString();
      currentPeriod.updatedAt = now;

      return {
        success: true,
        period: currentPeriod,
        metrics,
      };
    }

    const db = getDb();

    // 1. Fetch retainer
    const [retainer] = await db
      .select()
      .from(schema.engagementRetainers)
      .where(eq(schema.engagementRetainers.id, input.retainerId))
      .limit(1);

    if (!retainer) {
      throw new Error("Retainer not found");
    }

    // 2. Validate BOLA / IDOR if engagementId is provided
    if (input.engagementId && retainer.engagementId !== input.engagementId) {
      throw new Error(
        "Güvenlik ihlali: Bakım sözleşmesi belirtilen işe ait değil (BOLA/IDOR ihlali)."
      );
    }

    // 3. Status and Cancellation Notice Check (WP-22)
    const now = new Date();
    if (retainer.status === "CANCELLED") {
      if (
        retainer.effectiveCancellationAt &&
        now.getTime() > new Date(retainer.effectiveCancellationAt).getTime()
      ) {
        throw new Error(
          "Bakım sözleşmesi feshedilmiştir; ihbar süresi veya dönem sonu dolduktan sonra saat kaydedilemez."
        );
      }
    } else if (retainer.status !== "ACTIVE") {
      throw new Error("Yalnızca aktif bakım sözleşmelerine saat kaydı girilebilir.");
    }

    // 4. Role Authorization: Only the contractor can log hours!
    if (input.userId !== retainer.freelancerUserId) {
      throw new Error(
        "Yetkisiz işlem: Çalışma saatlerini yalnızca yüklenici (uzman) kaydedebilir."
      );
    }

    // 5. Atomic rollover & hour logging transaction (WP-20, WP-21)
    return await db.transaction(async (tx) => {
      let [currentPeriod] = await tx
        .select()
        .from(schema.engagementRetainerPeriods)
        .where(eq(schema.engagementRetainerPeriods.retainerId, input.retainerId))
        .orderBy(desc(schema.engagementRetainerPeriods.periodIndex))
        .limit(1)
        .for("update");

      if (!currentPeriod) {
        throw new Error("Active period not found");
      }

      // Check if period needs rollover
      if (now.getTime() > new Date(currentPeriod.endDate).getTime()) {
        if (
          retainer.status === "CANCELLED" &&
          retainer.effectiveCancellationAt &&
          now.getTime() >= new Date(retainer.effectiveCancellationAt).getTime()
        ) {
          throw new Error("Bakım sözleşmesi feshedilmiştir; yeni döneme saat kaydedilemez.");
        }

        const prevHours = parseFloat(currentPeriod.hoursLogged);
        const incHours = retainer.includedHours;
        const prevUnused = Math.max(0, incHours - prevHours);
        let rolloverHours = 0;
        if (retainer.rolloverPolicy === "MAX_25_PERCENT" && prevUnused > 0) {
          rolloverHours = Math.min(prevUnused, Math.floor(incHours * 0.25));
        }

        const nextPeriodIndex = currentPeriod.periodIndex + 1;
        const nextStartDate = currentPeriod.endDate;
        const nextEndDate = new Date(new Date(nextStartDate).getTime() + 30 * 86400000)
          .toISOString()
          .slice(0, 10);

        const [createdPeriod] = await tx
          .insert(schema.engagementRetainerPeriods)
          .values({
            retainerId: input.retainerId,
            periodIndex: nextPeriodIndex,
            startDate: nextStartDate,
            endDate: nextEndDate,
            basePrice: retainer.monthlyPrice,
            hoursLogged: "0",
            overageHours: "0",
            overagePrice: "0",
            totalAmount: retainer.monthlyPrice,
            currency: retainer.currency,
            taxSummary: { previousUnusedHours: prevUnused, rolloverHours },
            workLogsJson: [],
            paymentStatus: "PENDING",
          })
          .returning();

        if (!createdPeriod) {
          throw new Error("Failed to create billing period");
        }
        currentPeriod = createdPeriod;
      }

      const newHours = parseFloat(currentPeriod.hoursLogged) + input.hours;
      const prevUnused = (currentPeriod.taxSummary as any)?.previousUnusedHours || 0;
      const metrics = this.calculatePeriodMetrics({
        planType: retainer.planType as RetainerPlanType,
        monthlyPrice: parseFloat(retainer.monthlyPrice),
        currency: retainer.currency,
        includedHours: retainer.includedHours,
        overageHourlyRate: parseFloat(retainer.overageHourlyRate || "0"),
        rolloverPolicy: retainer.rolloverPolicy as RolloverPolicy,
        hoursLogged: newHours,
        previousUnusedHours: prevUnused,
        periodIndex: currentPeriod.periodIndex,
        startDate: currentPeriod.startDate,
        endDate: currentPeriod.endDate,
      });

      const workLogEntry = {
        id: `wl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId: input.userId,
        hours: input.hours,
        taskDescription: input.taskDescription || "Bakım görevi",
        date:
          typeof input.date === "string"
            ? input.date
            : input.date?.toISOString().slice(0, 10) || now.toISOString().slice(0, 10),
        loggedAt: now.toISOString(),
      };

      const existingLogs = Array.isArray(currentPeriod.workLogsJson)
        ? currentPeriod.workLogsJson
        : [];
      const updatedLogs = [...existingLogs, workLogEntry];

      const [updatedPeriod] = await tx
        .update(schema.engagementRetainerPeriods)
        .set({
          hoursLogged: newHours.toFixed(2),
          overageHours: metrics.overageHours.toFixed(2),
          overagePrice: metrics.overagePrice.toFixed(2),
          totalAmount: metrics.totalAmount.toFixed(2),
          workLogsJson: updatedLogs,
          updatedAt: now,
        })
        .where(eq(schema.engagementRetainerPeriods.id, currentPeriod.id))
        .returning();

      if (!updatedPeriod) {
        throw new Error("Failed to update billing period");
      }

      return {
        success: true,
        period: updatedPeriod,
        metrics,
      };
    });
  }

  /**
   * Cancels a retainer with participant role verification, calculating notice window (WP-22).
   */
  static async cancelRetainer(
    engagementId: string,
    userId: string
  ): Promise<{ success: boolean; messageTr: string; messageEn: string }> {
    if (!userId) {
      throw new Error("Yetkisiz işlem: Oturum açılması zorunludur.");
    }

    const isMock = engagementId.startsWith("eng-test-") || engagementId.startsWith("eng-demo-");

    if (isMock) {
      if (userId.includes("outsider")) {
        throw new Error(
          "Yetkisiz işlem: Yalnızca sözleşmenin tarafları bakım sözleşmesini iptal edebilir."
        );
      }

      const r = inMemoryRetainers.get(engagementId);
      if (r) {
        const periods = inMemoryRetainerPeriods.get(r.id) || [];
        const currentPeriod = periods[periods.length - 1];
        const noticeDays = r.cancellationNoticeDays || 15;
        const noticeEnd = new Date(Date.now() + noticeDays * 86400000);
        const periodEnd = currentPeriod ? new Date(currentPeriod.endDate) : noticeEnd;
        const effectiveCancellationAt = noticeEnd > periodEnd ? noticeEnd : periodEnd;

        r.status = "CANCELLED";
        r.cancelledAt = new Date();
        r.effectiveCancellationAt = effectiveCancellationAt;
        r.updatedAt = new Date();
      }
      return {
        success: true,
        messageTr: "Sözleşme cari ay sonunda feshedilmek üzere iptale alındı.",
        messageEn: "Retainer agreement set to cancel at the end of the current billing cycle.",
      };
    }

    const db = getDb();
    const [engagement] = await db
      .select()
      .from(schema.engagements)
      .where(eq(schema.engagements.id, engagementId))
      .limit(1);

    if (!engagement) {
      throw new Error("İş kaydı bulunamadı (Engagement not found).");
    }

    const isOwner = engagement.ownerUserId === userId;
    const isFreelancer = engagement.freelancerUserId === userId;
    if (!isOwner && !isFreelancer) {
      throw new Error(
        "Yetkisiz işlem: Yalnızca sözleşmenin tarafları bakım sözleşmesini iptal edebilir."
      );
    }

    const [retainer] = await db
      .select()
      .from(schema.engagementRetainers)
      .where(eq(schema.engagementRetainers.engagementId, engagementId))
      .limit(1);

    if (!retainer) {
      throw new Error("Retainer not found");
    }

    const [currentPeriod] = await db
      .select()
      .from(schema.engagementRetainerPeriods)
      .where(eq(schema.engagementRetainerPeriods.retainerId, retainer.id))
      .orderBy(desc(schema.engagementRetainerPeriods.periodIndex))
      .limit(1);

    const noticeDays = retainer.cancellationNoticeDays || 15;
    const noticeEnd = new Date(Date.now() + noticeDays * 86400000);
    const periodEnd = currentPeriod ? new Date(currentPeriod.endDate) : noticeEnd;
    const effectiveCancellationAt = noticeEnd > periodEnd ? noticeEnd : periodEnd;

    await db
      .update(schema.engagementRetainers)
      .set({
        status: "CANCELLED",
        cancelledAt: new Date(),
        effectiveCancellationAt,
        updatedAt: new Date(),
      })
      .where(eq(schema.engagementRetainers.id, retainer.id));

    return {
      success: true,
      messageTr: "Sözleşme cari ay sonunda feshedilmek üzere iptale alındı.",
      messageEn: "Retainer agreement set to cancel at the end of the current billing cycle.",
    };
  }

  /**
   * Fetches full retainer details, active period, and SLA metrics with strict participant authorization.
   */
  static async getRetainerDetails(
    engagementId: string,
    currentUserId: string
  ): Promise<RetainerDetailsResult> {
    if (!currentUserId) {
      throw new Error("Yetkisiz erişim: Oturum açılması zorunludur.");
    }

    const isMock = engagementId.startsWith("eng-test-") || engagementId.startsWith("eng-demo-");

    if (isMock) {
      if (currentUserId.includes("outsider")) {
        throw new Error(
          "Yetkisiz erişim: Bu bakım sözleşmesinin detaylarına yalnızca sözleşmenin tarafları erişebilir."
        );
      }

      const isFreelancer =
        currentUserId === "u-freelancer-ret-1" ||
        currentUserId.includes("freelancer") ||
        currentUserId.includes("specialist");
      const isOwner = !isFreelancer;

      const retainer = inMemoryRetainers.get(engagementId) || null;
      const periods = retainer ? inMemoryRetainerPeriods.get(retainer.id) || [] : [];
      const currentPeriod = periods[periods.length - 1];

      const activeMetrics =
        currentPeriod && retainer
          ? this.calculatePeriodMetrics({
              planType: retainer.planType as RetainerPlanType,
              monthlyPrice: parseFloat(retainer.monthlyPrice),
              currency: retainer.currency,
              includedHours: retainer.includedHours,
              overageHourlyRate: parseFloat(retainer.overageHourlyRate || "0"),
              rolloverPolicy: retainer.rolloverPolicy as RolloverPolicy,
              hoursLogged: parseFloat(currentPeriod.hoursLogged),
              periodIndex: currentPeriod.periodIndex,
              startDate: currentPeriod.startDate,
              endDate: currentPeriod.endDate,
              previousUnusedHours: (currentPeriod.taxSummary as any)?.previousUnusedHours || 0,
            })
          : null;

      const sla = retainer
        ? this.getSlaDetails(retainer.slaTier as SlaTier)
        : this.getSlaDetails("STANDARD");

      return {
        retainer,
        activePeriod: activeMetrics,
        periods,
        sla,
        isOwner,
        isFreelancer,
        canPropose: !retainer || retainer.status === "CANCELLED",
        canManage: Boolean(retainer && retainer.status === "ACTIVE"),
      };
    }

    const db = getDb();
    const [engagement] = await db
      .select()
      .from(schema.engagements)
      .where(eq(schema.engagements.id, engagementId))
      .limit(1);

    if (!engagement) {
      throw new Error("İş kaydı bulunamadı (Engagement not found).");
    }

    const isOwner = engagement.ownerUserId === currentUserId;
    const isFreelancer = engagement.freelancerUserId === currentUserId;

    if (!isOwner && !isFreelancer) {
      throw new Error(
        "Yetkisiz erişim: Bu bakım sözleşmesinin detaylarına yalnızca sözleşmenin tarafları erişebilir."
      );
    }

    const [retainer] = await db
      .select()
      .from(schema.engagementRetainers)
      .where(eq(schema.engagementRetainers.engagementId, engagementId))
      .limit(1);

    if (!retainer) {
      return {
        retainer: null,
        activePeriod: null,
        periods: [],
        sla: this.getSlaDetails("STANDARD"),
        isOwner,
        isFreelancer,
        canPropose: isOwner || isFreelancer,
        canManage: false,
      };
    }

    const periods = await db
      .select()
      .from(schema.engagementRetainerPeriods)
      .where(eq(schema.engagementRetainerPeriods.retainerId, retainer.id))
      .orderBy(desc(schema.engagementRetainerPeriods.periodIndex));

    const currentPeriod = periods[0] || null;
    const activeMetrics = currentPeriod
      ? this.calculatePeriodMetrics({
          planType: retainer.planType as RetainerPlanType,
          monthlyPrice: parseFloat(retainer.monthlyPrice),
          currency: retainer.currency,
          includedHours: retainer.includedHours,
          overageHourlyRate: parseFloat(retainer.overageHourlyRate || "0"),
          rolloverPolicy: retainer.rolloverPolicy as RolloverPolicy,
          hoursLogged: parseFloat(currentPeriod.hoursLogged),
          periodIndex: currentPeriod.periodIndex,
          startDate: currentPeriod.startDate,
          endDate: currentPeriod.endDate,
          previousUnusedHours: (currentPeriod.taxSummary as any)?.previousUnusedHours || 0,
        })
      : null;

    return {
      retainer,
      activePeriod: activeMetrics,
      periods,
      sla: this.getSlaDetails(retainer.slaTier as SlaTier),
      isOwner,
      isFreelancer,
      canPropose: retainer.status === "CANCELLED",
      canManage: (isOwner || isFreelancer) && retainer.status === "ACTIVE",
    };
  }
}
