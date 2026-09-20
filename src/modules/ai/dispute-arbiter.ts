/**
 * Operis AI Dispute Arbiter & Evidence Analyzer (Operis AI Tahkim Motoru)
 *
 * Algorithmic Online Dispute Resolution (ODR) Engine compliant with:
 * - 6098 sayılı Türk Borçlar Kanunu (TBK m. 470 Eser Sözleşmesi Ücret Hakkı)
 * - TBK m. 474 & 477 (Muayene ve Kabul Kuralı - 7 İş Günü Zımni Kabul)
 * - TBK m. 480/2 (Öngörülemeyen Ek Masraflar ve Kapsam Aşımı / Scope Creep)
 * - 5846 sayılı Fikir ve Sanat Eserleri Kanunu (FSEK m. 52 Fikri Mülkiyet Devri)
 * - 6325 sayılı Hukuk Uyuşmazlıklarında Arabuluculuk Kanunu (Doğrudan Arabuluculuk)
 * - Operis Resmi Hizmet Sözleşmesi Madde 4.3 (Azami 2 Revizyon Sınırı) ve Madde 7 (30 Gün Ayıp Garantisi)
 */

import type { DeliveryHealthReport } from "../engagements/delivery-inspector";
import { ShapleyDisputeSolver } from "./dispute-game-theory";

export type BreachSeverity = "CRITICAL" | "MODERATE" | "MINOR";
export type BreachParty = "CLIENT" | "CONTRACTOR";

export interface ContractBreachItem {
  party: BreachParty;
  severity: BreachSeverity;
  clause: string;
  titleTr: string;
  titleEn: string;
  descriptionTr: string;
  descriptionEn: string;
  evidenceSnippet: string;
}

export interface EvidenceArtifactSummary {
  contractRef: string;
  agreedBudget: string;
  agreedDeadlineDays: number | null;
  repositoryDelivered: boolean;
  repositoryUrl: string | null;
  liveDemoUrl: string | null;
  liveDemoStatus: number | null;
  liveDemoSsl: boolean;
  liveDemoLatencyMs: number | null;
  powSealVerified: boolean;
  changeRequestsCount: number;
  approvedAddendumsCount: number;
  inspectionDaysElapsed: number;
  revisionRoundsCount: number;
  milestonesTotalCount?: number;
  milestonesAcceptedCount?: number;
  milestonesPaidCount?: number;
}

export type VerdictRecommendation =
  "FORCE_COMPLETE" | "FORCE_CANCEL" | "RECOMMENDED_COMPROMISE" | "SPLIT_EQUAL";

export interface DisputeArbitrationReport {
  engagementId: string;
  generatedAt: string;
  freelancerEntitlementPercent: number; // 0 - 100
  clientRefundPercent: number; // 0 - 100
  verdictRecommendation: VerdictRecommendation;
  verdictSummaryTr: string;
  verdictSummaryEn: string;
  identifiedBreaches: ContractBreachItem[];
  evidenceSummary: EvidenceArtifactSummary;
  recommendedActionTr: string;
  recommendedActionEn: string;
  statutoryLegalGroundsTr: string[];
  statutoryLegalGroundsEn: string[];
  markdownReportTr: string;
  markdownReportEn: string;
}

export interface DisputeAnalysisInput {
  engagementId: string;
  listingTitle: string;
  category: string;
  matchedAt: Date | string;
  agreedBudgetLabel?: string | null;
  agreedTimelineLabel?: string | null;
  // Handover data (if any)
  handover?: {
    repositoryUrl?: string | null;
    commitHash?: string | null;
    liveUrl?: string | null;
    submittedAt?: Date | string | null;
    inspectionExpiresAt?: Date | string | null;
    status?: string | null; // SUBMITTED, ACCEPTED, REVISION_REQUESTED
    revisionNotes?: string | null;
    deliveryHealth?: DeliveryHealthReport | null;
  } | null;
  // Change requests (Scope Shield addendums)
  changeRequests?: Array<{
    title: string;
    reason: string;
    scopeItems?: string[] | null;
    additionalBudget?: string | number;
    costDelta?: string | number;
    additionalDays?: number;
    scheduleDeltaDays?: number;
    status: string; // PENDING, APPROVED, REJECTED, CANCELLED
    createdAt: Date | string;
  }> | null;
  // Communication notes, objection reasons, or chat log snippets
  messages?: Array<{
    senderRole: "CLIENT" | "CONTRACTOR";
    content: string;
    createdAt?: Date | string;
  }> | null;
  // Revision count
  revisionRoundsCount?: number;
  // Dispute mark timestamps
  disputedAt?: Date | string | null;
  // Milestone ledger progress (Zero-escrow deliverables & confirmed payouts)
  milestones?: Array<{
    id: string;
    title: string;
    percentage: number;
    deliverableStatus: "PENDING" | "SUBMITTED" | "ACCEPTED" | "REVISION_REQUESTED";
    paymentStatus: "PENDING" | "MARKED_PAID" | "CONFIRMED_PAID";
    deliverableUrl?: string | null;
  }> | null;
}

export class DisputeArbiterService {
  /**
   * Analyzes an engagement dispute using multi-factor legal tech heuristic algorithms.
   */
  static analyzeDispute(input: DisputeAnalysisInput): DisputeArbitrationReport {
    const matchedAtDate = new Date(input.matchedAt);
    const disputedAtDate = input.disputedAt ? new Date(input.disputedAt) : new Date();

    const breaches: ContractBreachItem[] = [];
    let freelancerScore = 50; // Neutral starting baseline

    // 1. Deliverable & Proof-of-Work (PoW) Analysis (Max Impact: +35 / -35)
    const handover = input.handover;
    const hasRepo = Boolean(handover?.repositoryUrl && handover.repositoryUrl.trim().length > 0);
    const hasCommit = Boolean(
      handover?.commitHash && /^[0-9a-fA-F]{7,40}$/.test(handover.commitHash)
    );
    const liveDemoUrl = handover?.liveUrl?.trim() || null;
    const health = handover?.deliveryHealth;

    const repositoryDelivered = Boolean(hasRepo && (!handover?.commitHash || hasCommit));
    let liveDemoStatus: number | null = null;
    let liveDemoSsl = false;
    let liveDemoLatencyMs: number | null = null;
    let powSealVerified = false;

    const probe = health?.liveDeployment;
    const isProbeHealthy = Boolean(health?.isHealthy || probe?.isAccessible);
    if (probe) {
      liveDemoStatus = probe.httpStatus ?? null;
      liveDemoSsl = Boolean(probe.sslValid);
      liveDemoLatencyMs = probe.responseTimeMs ?? null;
    }
    if (health?.powSeal) {
      powSealVerified = health.powSeal.length > 0;
    }

    if (!handover || !hasRepo) {
      // Critical contractor breach: No code deliverable provided
      breaches.push({
        party: "CONTRACTOR",
        severity: "CRITICAL",
        clause: "TBK m. 470 & Sözleşme Madde 2 (Eser Teslim Yükümlülüğü)",
        titleTr: "Kaynak Kod ve Eser Teslim Edilmedi",
        titleEn: "Source Code & Deliverables Not Handed Over",
        descriptionTr:
          "Yüklenici uyuşmazlık anına kadar doğrulanabilir bir Git kaynak kod deposu teslim etmemiştir.",
        descriptionEn:
          "Contractor failed to provide a verifiable Git source code repository deliverable.",
        evidenceSnippet: handover?.repositoryUrl
          ? `Geçersiz/Erişilemeyen Depo: ${handover.repositoryUrl}`
          : "Hiçbir repo veya teslimat linki sunulmamıştır.",
      });
      freelancerScore -= 35;
    } else if (health && isProbeHealthy && liveDemoStatus === 200) {
      // Verified healthy live deployment
      freelancerScore += 25;
      if (powSealVerified) freelancerScore += 5;
    }

    if (liveDemoUrl && health && (!isProbeHealthy || (liveDemoStatus && liveDemoStatus >= 400))) {
      // Live demo URL was provided but crashed / returned HTTP 4xx/5xx or SSL failure
      const errorMsg = probe?.error || `HTTP ${liveDemoStatus || 500}`;
      breaches.push({
        party: "CONTRACTOR",
        severity: "MODERATE",
        clause: "Sözleşme Madde 7 & TBK m. 474 (Çalışır Sistem ve Ayıp Garantisi)",
        titleTr: "Canlı Demo ve Çalışır Sistem Hatası (HTTP " + (liveDemoStatus || "Crash") + ")",
        titleEn: "Live Deployment Failure (HTTP " + (liveDemoStatus || "Crash") + ")",
        descriptionTr: `Sunulan canlı demo linki (${liveDemoUrl}) sunucu tarafından doğrulanırken HTTP ${liveDemoStatus || "Hata"} yanıtı vermiş veya erişilememiştir.`,
        descriptionEn: `Submitted live demo URL (${liveDemoUrl}) failed automated health probe with status HTTP ${liveDemoStatus || "Error"}.`,
        evidenceSnippet: errorMsg,
      });
      freelancerScore -= 20;
    }

    // 2. Scope Creep & Unauthorized Changes Analysis (Max Impact: +25 / -15)
    const changeRequests = input.changeRequests || [];
    const approvedAddendums = changeRequests.filter((cr) => cr.status === "APPROVED");
    const messages = input.messages || [];

    // Detect scope creep keywords in client messages
    const scopeCreepPatterns = [
      /ekran\s+ekle/i,
      /şunu\s+da\s+yap/i,
      /şunu\s+da\s+ekle/i,
      /yeni\s+sayfa/i,
      /ödeme\s+adım/i,
      /tasarım[ıı]\s+değiştir/i,
      /bunu\s+da\s+bağla/i,
      /mobil\s+versiyon\s+da/i,
      /kapsam\s+dışı/i,
      /add\s+screen/i,
      /extra\s+feature/i,
      /new\s+page/i,
    ];

    const clientMessages = messages.filter((m) => m.senderRole === "CLIENT");
    const scopeCreepEvidence: string[] = [];

    for (const msg of clientMessages) {
      const msgText = msg.content || ((msg as Record<string, unknown>).text as string) || "";
      for (const pat of scopeCreepPatterns) {
        if (pat.test(msgText)) {
          scopeCreepEvidence.push(msgText.slice(0, 140));
          break;
        }
      }
    }

    if (scopeCreepEvidence.length > 0 && approvedAddendums.length === 0) {
      // Client demanded out-of-scope tasks without signing an Addendum (TBK m. 480/2 breach)
      breaches.push({
        party: "CLIENT",
        severity: "CRITICAL",
        clause: "TBK m. 480/2 & Sözleşme Madde 4.3 (Yetkisiz Kapsam Aşımı / Scope Creep)",
        titleTr: "Sözleşme Dışı İlave İş Talebi (Zeyilname Eksikliği)",
        titleEn: "Unauthorized Scope Creep without Signed Addendum",
        descriptionTr:
          "İşveren, Madde 4.3 ve TBK m. 480/2 hükümlerine aykırı olarak Sözleşme Zeyilnamesi düzenlemeksizin kapsam dışı ek fonksiyon talep etmiştir.",
        descriptionEn:
          "Client demanded features exceeding contractual scope without formal Addendum execution.",
        evidenceSnippet: scopeCreepEvidence[0] || "Mesaj geçmişinde tespit edilen ek iş talepleri.",
      });
      freelancerScore += 20;
    }

    // 3. Timeline & Overdue Delivery Analysis (Max Impact: -15 / +10)
    let agreedDays = 14; // default
    if (input.agreedTimelineLabel) {
      const match = input.agreedTimelineLabel.match(/(\d+)\s*(gün|hafta|ay|day|week|month)/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        const unit = (match[2] || "").toLowerCase();
        if (unit.startsWith("hafta") || unit.startsWith("week")) agreedDays = num * 7;
        else if (unit.startsWith("ay") || unit.startsWith("month")) agreedDays = num * 30;
        else agreedDays = num;
      }
    }

    const elapsedDays = Math.max(
      1,
      Math.round((disputedAtDate.getTime() - matchedAtDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    if (elapsedDays > agreedDays + 3) {
      const daysOverdue = elapsedDays - agreedDays;
      if (scopeCreepEvidence.length === 0) {
        // Unexcused delay by contractor
        breaches.push({
          party: "CONTRACTOR",
          severity: daysOverdue > 14 ? "CRITICAL" : "MODERATE",
          clause: "Sözleşme Madde 4.1 & TBK m. 473 (Taahhüt Edilen Teslim Tarihi Aşımı)",
          titleTr: `Teslim Tarihinde ${daysOverdue} Günlük Gecikme`,
          titleEn: `Delivery Delay of ${daysOverdue} Days`,
          descriptionTr: `Yüklenici kararlaştırılan ${agreedDays} günlük süreyi ${daysOverdue} gün aşarak teslimat takvimine uymamıştır.`,
          descriptionEn: `Contractor exceeded agreed timeline of ${agreedDays} days by ${daysOverdue} days.`,
          evidenceSnippet: `Taahhüt: ${agreedDays} gün, Geçen Süre: ${elapsedDays} gün.`,
        });
        freelancerScore -= Math.min(15, Math.ceil(daysOverdue / 7) * 5);
      }
    }

    // 4. Inspection Window & Revision Limit Analysis (TBK m. 474 & Madde 4.3)
    let inspectionDaysElapsed = 0;
    if (handover?.submittedAt) {
      const submitDate = new Date(handover.submittedAt);
      inspectionDaysElapsed = Math.round(
        (disputedAtDate.getTime() - submitDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // TBK m. 474: 7 business days (~10 calendar days).
      if (inspectionDaysElapsed > 10 && handover.status === "SUBMITTED") {
        breaches.push({
          party: "CLIENT",
          severity: "MODERATE",
          clause: "TBK m. 474 & 477 (Yasal 7 İş Günü Muayene ve Zımni Kabul Kuralı)",
          titleTr: "Yasal Muayene ve İtiraz Süresi Aşıldı (Zımni Kabul)",
          titleEn: "Statutory Inspection Window Exceeded (Deemed Acceptance)",
          descriptionTr:
            "İşveren teslimatı takip eden 7 iş günü içinde yazılı kusur bildirimi yapmayarak eseri TBK m. 474/477 uyarınca zımnen kabul etmiştir.",
          descriptionEn:
            "Client failed to provide written defect notice within statutory 7 business days, triggering deemed acceptance.",
          evidenceSnippet: `Teslimattan bu yana ${inspectionDaysElapsed} gün geçti.`,
        });
        freelancerScore += 15;
      }
    }

    // Revision rounds limit check (Madde 4.3: max 2 rounds)
    const revisionCount =
      input.revisionRoundsCount ?? (handover?.status === "REVISION_REQUESTED" ? 1 : 0);
    if (revisionCount > 2) {
      breaches.push({
        party: "CLIENT",
        severity: "MODERATE",
        clause: "Sözleşme Madde 4.3 (Azami 2 Tur Revizyon Sınırı)",
        titleTr: `Revizyon Sınırı Aşıldı (${revisionCount} Tur)`,
        titleEn: `Revision Limit Exceeded (${revisionCount} Rounds)`,
        descriptionTr: `Sözleşme Madde 4.3 gereği azami 2 tur revizyon hakkı tanınmış olup, ${revisionCount}. tur revizyon talebi ek ücrete tabidir.`,
        descriptionEn: `Contract Article 4.3 stipulates a maximum of 2 revision rounds; round ${revisionCount} requires separate consideration.`,
        evidenceSnippet: `Talep edilen revizyon adedi: ${revisionCount}.`,
      });
      freelancerScore += 10;
    }

    // 5. Milestone Progress & Partial Performance Analysis (TBK m. 470 & m. 474)
    const milestones = input.milestones || [];
    let acceptedDeliverablePercent = 0;
    let confirmedPaidPercent = 0;
    let milestonesAcceptedCount = 0;
    let milestonesPaidCount = 0;

    if (milestones.length > 0) {
      for (const m of milestones) {
        if (m.deliverableStatus === "ACCEPTED") {
          acceptedDeliverablePercent += m.percentage;
          milestonesAcceptedCount++;
        }
        if (m.paymentStatus === "CONFIRMED_PAID") {
          confirmedPaidPercent += m.percentage;
          milestonesPaidCount++;
        }
      }

      acceptedDeliverablePercent = Math.min(100, Math.round(acceptedDeliverablePercent));
      confirmedPaidPercent = Math.min(100, Math.round(confirmedPaidPercent));

      if (acceptedDeliverablePercent > 0) {
        // Irrevocable partial performance under TBK m. 470
        // Freelancer must receive at least the percentage of accepted deliverables
        freelancerScore = Math.max(freelancerScore, acceptedDeliverablePercent);

        if (acceptedDeliverablePercent > confirmedPaidPercent) {
          breaches.push({
            party: "CLIENT",
            severity: "MODERATE",
            clause: "TBK m. 470 & 474 (Onaylanan Kilometre Taşları Hakediş Hakkı)",
            titleTr: `Onaylanan Ara Teslimat Hakedişi (%${acceptedDeliverablePercent})`,
            titleEn: `Accepted Milestone Deliverable Entitlement (${acceptedDeliverablePercent}%)`,
            descriptionTr: `İşveren toplamda %${acceptedDeliverablePercent} oranındaki kilometre taşını inceleyip kabul etmiş ancak karşılık gelen ödeme teyidi tamamlanmamıştır.`,
            descriptionEn: `Client accepted ${acceptedDeliverablePercent}% of milestone deliverables, creating an irrevocable statutory entitlement.`,
            evidenceSnippet: `Kabul Edilen Aşama: %${acceptedDeliverablePercent}, Teyit Edilen Ödeme: %${confirmedPaidPercent}.`,
          });
        }
      }
    }

    // Cooperative Game Theory (Shapley Value Allocation)
    // Computes axiomatic division of disputed balance satisfying Efficiency & Symmetry
    const contractorClaim = Math.max(0, Math.min(100, Math.round(freelancerScore)));
    const clientClaim = Math.max(0, Math.min(100, 100 - contractorClaim));

    const shapleySolution = ShapleyDisputeSolver.solve({
      contractorClaimPercent: contractorClaim,
      clientClaimPercent: clientClaim,
    });

    const clampedFreelancer = shapleySolution.freelancerEntitlementPercent;
    const clampedClient = shapleySolution.clientRefundPercent;

    // Determine verdict recommendation
    let verdictRecommendation: VerdictRecommendation = "RECOMMENDED_COMPROMISE";
    if (clampedFreelancer >= 80) {
      verdictRecommendation = "FORCE_COMPLETE";
    } else if (clampedFreelancer <= 25) {
      verdictRecommendation = "FORCE_CANCEL";
    } else if (clampedFreelancer === 50) {
      verdictRecommendation = "SPLIT_EQUAL";
    }

    // Construct summaries and legal texts
    let verdictSummaryTr = `Her iki tarafın sözleşmesel ihlalleri mevcuttur (İşveren kapsam aşımı / Yüklenici gecikmesi). Tarafsız uzlaşma formülü: %${clampedFreelancer} Yüklenici Hakedişi / %${clampedClient} İşveren İadesi.`;
    let verdictSummaryEn = `Bilateral contractual infractions detected (Scope creep vs delay). Recommended compromise: ${clampedFreelancer}% Contractor Entitlement / ${clampedClient}% Client Refund.`;
    let recommendedActionTr = `Taraflara 6325 sayılı kanun uyarınca %${clampedFreelancer} / %${clampedClient} oranında kısmi sulh mutabakatı öneriniz; uyuşmazlık devam ederse idari hakemlik kararıyla sonlandırınız.`;
    let recommendedActionEn = `Submit formal compromise settlement to parties: ${clampedFreelancer}% Contractor / ${clampedClient}% Client refund under Mediation Law.`;

    if (verdictRecommendation === "FORCE_COMPLETE") {
      verdictSummaryTr = `Deliller ve PoW doğrulaması, yüklenicinin temel edimini yerine getirdiğini göstermektedir. Projenin %${clampedFreelancer} oranında yüklenici hakedişiyle TAMAMLANMASI (FORCE COMPLETE) önerilir.`;
      verdictSummaryEn = `Evidence & PoW inspection confirm core deliverables met. Recommended verdict: FORCE COMPLETE with ${clampedFreelancer}% contractor entitlement.`;
      recommendedActionTr = "Yönetici panelinden 'Hakem Kararıyla Tamamla (Force Complete)' butonuna basarak projeyi onaylayınız ve FSEK m. 52 fikri mülkiyet devrini yürürlüğe koyunuz.";
      recommendedActionEn = "Apply 'Force Complete' decree in Admin console and execute statutory IP assignment under FSEK Art. 52.";
    } else if (verdictRecommendation === "FORCE_CANCEL") {
      verdictSummaryTr = `Teslim edilen kaynak kodun bulunmaması veya kritik canlı hatalar sebebiyle işverenin haklılığı ağır basmaktadır. Projenin %${clampedClient} iade ile İPTAL EDİLMESİ (FORCE CANCEL) önerilir.`;
      verdictSummaryEn = `Critical delivery failures or missing codebase attribute primary liability to contractor. Recommended verdict: FORCE CANCEL with ${clampedClient}% client refund.`;
      recommendedActionTr = "Yönetici panelinden 'Hakem Kararıyla İptal Et (Force Cancel)' butonuna basarak projeyi feshediniz ve işverenin bütçesini iade ediniz.";
      recommendedActionEn = "Apply 'Force Cancel' decree in Admin console and release full refund to Client.";
    }

    const statutoryLegalGroundsTr = [
      "TBK m. 470: Eser sözleşmesinde yüklenicinin meydana getirdiği bağımsız eserin ayıpsız teslimi oranında ücrete hak kazanması kuralı.",
      "TBK m. 474 & 477: Teslimatı izleyen 7 iş günü içinde yazılı kusur bildirilmemesi halinde eserin kanunen kabul edilmiş sayılması.",
      "TBK m. 480/2 & Madde 4.3: Kapsamı aşan yeni ekran ve fonksiyon taleplerinin yazılı Sözleşme Zeyilnamesi olmaksızın dayatılamayacağı.",
      "Madde 7: Kritik yazılımsal ayıpların teslimden itibaren 30 gün içinde yazılımcı tarafından ücretsiz giderilmesi zorunluluğu.",
      "6325 sayılı Kanun: Dava öncesi doğrudan arabuluculuk ve tarafsız uzlaşma protokolü.",
    ];

    const statutoryLegalGroundsEn = [
      "TBK Art. 470: Consideration entitlement proportional to defect-free delivery of contracted work.",
      "TBK Art. 474 & 477: Statutory 7-business-day inspection window; silence triggers formal deemed acceptance.",
      "TBK Art. 480/2 & Clause 4.3: Out-of-scope demands require signed Addendum and cannot be compelled unilaterally.",
      "Clause 7: Mandatory 30-day warranty coverage for critical software defects without extra charge.",
      "Mediation Law No. 6325: Pre-litigation mediation and neutral compromise protocol.",
    ];

    const evidenceSummary: EvidenceArtifactSummary = {
      contractRef: `OPR-CONTR-${input.engagementId.slice(0, 8).toUpperCase()}`,
      agreedBudget: input.agreedBudgetLabel || "50.000 TL",
      agreedDeadlineDays: agreedDays,
      repositoryDelivered,
      repositoryUrl: handover?.repositoryUrl || null,
      liveDemoUrl,
      liveDemoStatus,
      liveDemoSsl,
      liveDemoLatencyMs,
      powSealVerified,
      changeRequestsCount: changeRequests.length,
      approvedAddendumsCount: approvedAddendums.length,
      inspectionDaysElapsed,
      revisionRoundsCount: revisionCount,
      milestonesTotalCount: milestones.length,
      milestonesAcceptedCount,
      milestonesPaidCount,
    };

    let demoProbeStatusTr = "⚠️ Canlı Link Belirtilmedi";
    let demoProbeStatusEn = "⚠️ No Live URL";
    if (isProbeHealthy && liveDemoStatus === 200) {
      const sslTr = liveDemoSsl ? "Doğrulandı" : "Geçersiz";
      const sslEn = liveDemoSsl ? "Verified" : "Invalid";
      demoProbeStatusTr = `✅ HTTP 200 OK (${liveDemoLatencyMs ?? 0}ms, SSL ${sslTr})`;
      demoProbeStatusEn = `✅ HTTP 200 OK (${liveDemoLatencyMs ?? 0}ms, SSL ${sslEn})`;
    } else if (liveDemoUrl) {
      demoProbeStatusTr = `❌ Hata (HTTP ${liveDemoStatus || "Crash"})`;
      demoProbeStatusEn = `❌ Probe Failure (HTTP ${liveDemoStatus || "Crash"})`;
    }

    // Executive Markdown Report in TR
    const markdownReportTr = [
      `# ⚖️ OPERİS AI TARAFSIZ TAHKİM VE DELİL RAPORU`,
      `**Uyuşmazlık ID:** \`${input.engagementId}\` | **Tarih:** ${new Date().toLocaleDateString("tr-TR")}`,
      ``,
      `### 📊 TAHKİM HAKLILIK ORANI VE UZLAŞMA ÖNERİSİ`,
      `- **Yazılımcı Hakediş Oranı:** %${clampedFreelancer}`,
      `- **İşveren İade / Kesinti Oranı:** %${clampedClient}`,
      `- **Önerilen Karar:** \`${verdictRecommendation}\``,
      `> **Özet Hüküm:** ${verdictSummaryTr}`,
      ``,
      `### 🚩 TESPİT EDİLEN SÖZLEŞME İHLALLERİ (${breaches.length} Adet)`,
      breaches.length === 0
        ? `*Herhangi bir açık kural ihlali tespit edilmemiştir.*`
        : breaches
            .map(
              (b, idx) =>
                `${idx + 1}. **[${b.party === "CLIENT" ? "İŞVEREN KUSURU" : "YAZILIMCI KUSURU"} - ${b.severity}]** ${b.titleTr}\n   - **Dayanak:** ${b.clause}\n   - **Açıklama:** ${b.descriptionTr}\n   - **Delil:** \`${b.evidenceSnippet}\``
            )
            .join("\n"),
      ``,
      `### 🧪 PROOF-OF-WORK (PoW) VE TESLİMAT DOĞRULAMA DURUMU`,
      `- **Kaynak Kod Deposu:** ${repositoryDelivered ? "✅ Teslim Edildi" : "❌ Eksik / Geçersiz"}`,
      `- **Canlı Demo Uptime:** ${demoProbeStatusTr}`,
      `- **Kriptografik PoW Mührü:** ${powSealVerified ? "✅ Doğrulandı (SHA-256)" : "—"}`,
      `- **Scope Shield Zeyilnameleri:** ${changeRequests.length} Talep (${approvedAddendums.length} Onaylı)`,
      ``,
      `### ⚖️ HUKUKİ MEVZUAT DAYANAKLARI`,
      statutoryLegalGroundsTr.map((g) => `- ${g}`).join("\n"),
    ].join("\n");

    const markdownReportEn = [
      `# ⚖️ OPERIS NEUTRAL ARBITRATION & SETTLEMENT REPORT`,
      `**Dispute ID:** \`${input.engagementId}\` | **Date:** ${new Date().toLocaleDateString("en-US")}`,
      ``,
      `### 📊 ARBITRATION ENTITLEMENT & SETTLEMENT FORMULA`,
      `- **Contractor Entitlement:** ${clampedFreelancer}%`,
      `- **Client Refund / Retention:** ${clampedClient}%`,
      `- **Recommended Verdict:** \`${verdictRecommendation}\``,
      `> **Verdict Summary:** ${verdictSummaryEn}`,
      ``,
      `### 🚩 IDENTIFIED CONTRACTUAL BREACHES (${breaches.length})`,
      breaches.length === 0
        ? `*No contractual breaches identified.*`
        : breaches
            .map(
              (b, idx) =>
                `${idx + 1}. **[${b.party === "CLIENT" ? "CLIENT LIABILITY" : "CONTRACTOR LIABILITY"} - ${b.severity}]** ${b.titleEn}\n   - **Clause:** ${b.clause}\n   - **Finding:** ${b.descriptionEn}\n   - **Evidence:** \`${b.evidenceSnippet}\``
            )
            .join("\n"),
      ``,
      `### 🧪 PROOF-OF-WORK (PoW) & DELIVERABLE STATUS`,
      `- **Git Repository:** ${repositoryDelivered ? "✅ Handed Over" : "❌ Missing / Invalid"}`,
      `- **Live Demo Probe:** ${demoProbeStatusEn}`,
      `- **Cryptographic PoW Seal:** ${powSealVerified ? "✅ Verified (SHA-256)" : "—"}`,
      `- **Scope Shield Addendums:** ${changeRequests.length} Requested (${approvedAddendums.length} Signed)`,
    ].join("\n");

    return {
      engagementId: input.engagementId,
      generatedAt: new Date().toISOString(),
      freelancerEntitlementPercent: clampedFreelancer,
      clientRefundPercent: clampedClient,
      verdictRecommendation,
      verdictSummaryTr,
      verdictSummaryEn,
      identifiedBreaches: breaches,
      evidenceSummary,
      recommendedActionTr,
      recommendedActionEn,
      statutoryLegalGroundsTr,
      statutoryLegalGroundsEn,
      markdownReportTr,
      markdownReportEn,
    };
  }
}
