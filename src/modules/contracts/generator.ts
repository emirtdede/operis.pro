import { createHash } from "crypto";
import { ContractGeneratorInput, GeneratedContractResult, ContractMilestone } from "./types";
import { AcceptanceEngine } from "./acceptance-engine";
import { InflationHedgingEngine } from "../finance/inflation-hedging";
import { DpaEngine } from "./dpa-engine";
import { SafeHarborEngine } from "./safe-harbor-engine";
import { AiGovernanceEngine } from "./ai-governance-engine";
import { SoftwareExportEngine } from "../finance/software-export-engine";
import {
  parseBudgetAmount,
  calculateFreelanceTax,
  generateContractTaxMarkdownTable,
  generateContractTaxHtmlTable,
} from "../finance/tax-calculator";
import { ComprehensiveDeedEngine } from "./comprehensive-deed-engine";
import type { ComprehensivePartyInfo } from "./comprehensive-deed-types";
import { BilingualLayoutEngine } from "./bilingual-layout-engine";

export const DEFAULT_MILESTONES: ContractMilestone[] = [
  {
    phase: 1,
    percentage: 30,
    titleTr: "Tasarım ve Mimari Altyapı Onayı",
    titleEn: "Design & System Architecture Approval",
    descriptionTr:
      "Teknik gereksinimler, arayüz prototipleri ve altyapı kurulumu sonrası avans hak edişi.",
    descriptionEn:
      "Initial advance fee upon technical specifications, prototypes, and baseline scaffolding sign-off.",
  },
  {
    phase: 2,
    percentage: 40,
    titleTr: "Fonksiyonel Demo ve Kullanıcı Kabul Testi",
    titleEn: "Functional Prototype Demo & User Acceptance Testing",
    descriptionTr:
      "Çalışır durumdaki prototipin sunumu, testlerin koşturulması ve temel fonksiyonların teyidi sonrası ara hak ediş.",
    descriptionEn:
      "Interim payment upon delivery of working prototype, test runs, and core functional acceptance.",
  },
  {
    phase: 3,
    percentage: 30,
    titleTr: "Kaynak Kod Teslimi, Canlıya Alma ve Fikri Mülkiyet Devri",
    titleEn: "Source Code Handover, Production Deployment & IP Transfer",
    descriptionTr:
      "Tüm kaynak kodların, dokümantasyonun ve erişimlerin eksiksiz teslimiyle birlikte FSEK m. 52 mali hak devri ve son ödeme.",
    descriptionEn:
      "Final payment and statutory IP assignment upon clean repository handover, deployment, and acceptance.",
  },
];

export class ContractGeneratorService {
  /**
   * Generates a deterministic SHA-256 hash for document fingerprinting.
   */
  static calculateSha256(content: string): string {
    return createHash("sha256").update(content, "utf8").digest("hex");
  }

  /**
   * Builds the official bilateral Freelance Service & NDA Contract.
   */
  static generateContract(input: ContractGeneratorInput): GeneratedContractResult {
    const isBilingual = input.locale === "bilingual";
    const isTr = input.locale === "en" ? false : true;
    const isWhiteLabel = Boolean(input.whiteLabel);
    const engagementShort = input.engagementId.replace(/-/g, "").slice(0, 8).toUpperCase();
    const contractRef = isWhiteLabel ? `CTR-${engagementShort}` : `OPR-CONTR-${engagementShort}`;
    const generatedAtDate = new Date();

    const matchedDateFormatted = new Date(input.matchedAt).toLocaleDateString(
      isTr ? "tr-TR" : "en-US",
      { year: "numeric", month: "long", day: "numeric" }
    );

    const generatedDateFormatted = generatedAtDate.toLocaleDateString(isTr ? "tr-TR" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const clientName = input.client.displayName || "İşveren / Client";
    const clientEmail = input.client.email || "—";
    const clientPhone =
      input.client.phone || (isTr ? "Gizli / Eşleşme Onaylı" : "Private / Match Approved");

    const contractorName = input.contractor.displayName || "Yüklenici / Contractor";
    const contractorEmail = input.contractor.email || "—";
    const contractorPhone =
      input.contractor.phone || (isTr ? "Gizli / Eşleşme Onaylı" : "Private / Match Approved");

    const cleanScope = input.scopeSummary.replace(/[\r\n]+/g, " ").trim();
    const budget =
      input.budgetLabel || (isTr ? "Karşılıklı belirlenecektir" : "To be mutually agreed");
    const timeline = input.timelineLabel || (isTr ? "Karşılıklı mutabakatla" : "Mutual agreement");
    const revisionLimit = input.revisionLimit ?? 2;
    const inspectionDays = input.inspectionPeriodDays ?? 7;
    const warrantyDays = input.warrantyPeriodDays ?? 30;
    const ndaYears = input.ndaYears ?? 3;

    // Software Export Regime Setup (GVK 89/13 & KDVK 11/1-a Kod 302)
    const hasSoftwareExport = Boolean(input.softwareExportConfig?.enabled);

    // Parse numeric budget for statutory tax breakdown calculation
    const parsedBudget = parseBudgetAmount(input.budgetLabel);
    let statutoryTaxMarkdown = "";
    let statutoryTaxHtml = "";

    if (parsedBudget) {
      const taxResult = calculateFreelanceTax({
        amount: parsedBudget.numericAmount,
        direction: "GROSS_TO_NET",
        clientType: "CORPORATE",
        documentType: "SMM",
        currency: parsedBudget.currency,
        isSoftwareExport: hasSoftwareExport,
        exportConfig: input.softwareExportConfig || undefined,
      });
      statutoryTaxMarkdown = `\n\n${generateContractTaxMarkdownTable(taxResult, isTr)}\n`;
      statutoryTaxHtml = generateContractTaxHtmlTable(taxResult, isTr);
    }

    // Squad Consortium Configuration (TBK m. 620)
    const isSquad = Boolean(
      input.isSquadContract || (input.squadMembers && input.squadMembers.length > 0)
    );
    const squadTitle =
      input.squadTitle || (isTr ? "Çevik Yazılımcı Kolektifi" : "Agile Software Collective");
    const squadMembers = input.squadMembers || [];

    let squadPartyMarkdownTr = `2. **YÜKLENİCİ (FREELANCER / YAZILIM VE TEKNOLOJİ UZMANI):**\n   - **Adı / Unvanı:** ${contractorName}\n   - **E-posta Adresi:** ${contractorEmail}\n   - **İletişim Kanalı:** ${contractorPhone}`;
    let squadPartyMarkdownEn = `2. **CONTRACTOR (INDEPENDENT DEVELOPER / TECH SPECIALIST):**\n   - **Name / Entity:** ${contractorName}\n   - **Email:** ${contractorEmail}\n   - **Contact Channel:** ${contractorPhone}`;
    let squadClausesTr = "";
    let squadClausesEn = "";

    if (isSquad && squadMembers.length > 0) {
      squadPartyMarkdownTr = `2. **ORTAK YÜKLENİCİLER KONSORSİYUMU (ÇEVİK EKİP - TBK m. 620):**
   - **Kolektif / Konsorsiyum Adı:** ${squadTitle}
   - **LİDER YÜKLENİCİ (Tek Yetkili Koordinatör & Muhatap):** ${contractorName} (${contractorEmail})
   - **KONSORSİYUM ÜYELERİ VE HAKEDİŞ DAĞILIMI:**

| Sıra | Adı Soyadı / Uzman | Rol / Uzmanlık Alanı | Hakediş Oranı (%) | Sorumluluk / İş Kapsamı |
|---|---|---|---|---|
${squadMembers.map((m, i) => `| ${i + 1} | **${m.displayName}** ${m.isLead ? "*(Lider Yüklenici)*" : ""} | ${m.roleTitle} | %${m.revenueSharePercentage} | ${m.scopeSummary || "Proje içi geliştirme ve teslimat"} |`).join("\n")}`;

      squadClausesTr = `\n1.3. **Konsorsiyum Hukuki Statüsü ve Lider Yüklenici Yetkisi (TBK m. 620 & TBK m. 162):** Ortak Yükleniciler, 6098 sayılı Türk Borçlar Kanunu Madde 620 vd. uyarınca bir adi ortaklık / konsorsiyum teşkil etmiştir. İş Sahibi nezdinde teknik koordinasyonu yürütmek, aşama teslimatlarını sunmak ve bildirimleri kabule yetkili tek muhatap ${contractorName} ("Lider Yüklenici") olarak belirlenmiştir. Ortak Yüklenicilerin her biri kendi üstlendiği uzmanlık alanındaki işlerin ayıpsız ifasından ve teslimatın bütünlüğünden işverene karşı müştereken sorumludur.\n`;

      squadPartyMarkdownEn = `2. **CONSORTIUM OF CO-CONTRACTORS (AGILE SQUAD - TBK Art. 620):**
   - **Consortium Name:** ${squadTitle}
   - **LEAD CONTRACTOR (Designated Liaison & Coordinator):** ${contractorName} (${contractorEmail})
   - **CONSORTIUM MEMBERS & REVENUE SHARE BREAKDOWN:**

| No | Specialist Name | Role Title | Revenue Share (%) | Scope Responsibilities |
|---|---|---|---|---|
${squadMembers.map((m, i) => `| ${i + 1} | **${m.displayName}** ${m.isLead ? "*(Lead Contractor)*" : ""} | ${m.roleTitle} | ${m.revenueSharePercentage}% | ${m.scopeSummary || "Project development and technical deliverables"} |`).join("\n")}`;

      squadClausesEn = `\n1.3. **Consortium Legal Framework & Lead Authority (TBK Art. 620 & 162):** Co-Contractors constitute an agile consortium / partnership under TBK Art. 620. ${contractorName} is appointed Lead Contractor with full operational authority to liaise with Client, submit deliverables, and coordinate sign-offs. All Co-Contractors remain jointly bound for seamless technical completion.\n`;
    }

    // Milestones and Acceptance Criteria Setup
    const milestones =
      input.milestones && input.milestones.length > 0 ? input.milestones : DEFAULT_MILESTONES;
    const acceptanceCriteria = input.acceptanceCriteria || [];
    const hasAcceptanceCriteria = acceptanceCriteria.length > 0;

    // Inflation Shield (TBK 138 & Decree 32) Setup
    const hasInflationShield = Boolean(input.inflationShield?.enabled);
    let inflationShieldMarkdownTr = "";
    let inflationShieldMarkdownEn = "";
    let inflationShieldHtml = "";

    if (hasInflationShield && input.inflationShield) {
      const shieldAmount = parsedBudget?.numericAmount || 0;
      const clauseTr = InflationHedgingEngine.generateInflationClauseText(
        input.inflationShield,
        "tr",
        shieldAmount
      );
      const clauseEn = InflationHedgingEngine.generateInflationClauseText(
        input.inflationShield,
        "en",
        shieldAmount
      );

      inflationShieldMarkdownTr = clauseTr.markdown;
      inflationShieldMarkdownEn = clauseEn.markdown;
      inflationShieldHtml = isTr ? clauseTr.html : clauseEn.html;
    }

    const [d0, d1, d2] = DEFAULT_MILESTONES;
    const defaultScheduleTr = [
      `- **1. Aşama (%30 Avans):** ${d0?.titleTr ?? ""} — ${d0?.descriptionTr ?? ""}`,
      `- **2. Aşama (%40 Ara Hakediş):** ${d1?.titleTr ?? ""} — ${d1?.descriptionTr ?? ""}`,
      `- **3. Aşama (%30 Kapanış ve Devir):** ${d2?.titleTr ?? ""} — ${d2?.descriptionTr ?? ""}`,
    ].join("\n");

    const defaultScheduleEn = [
      `- **Phase 1 (30% Advance):** ${d0?.titleEn ?? ""} — ${d0?.descriptionEn ?? ""}`,
      `- **Phase 2 (40% Interim):** ${d1?.titleEn ?? ""} — ${d1?.descriptionEn ?? ""}`,
      `- **Phase 3 (30% Final Handover):** ${d2?.titleEn ?? ""} — ${d2?.descriptionEn ?? ""}`,
    ].join("\n");

    const milestoneScheduleMarkdownTr =
      input.milestones && input.milestones.length > 0
        ? input.milestones
            .map(
              (m, i) =>
                `- **${i + 1}. Aşama (%${m.percentage}):** ${m.titleTr} — ${m.descriptionTr}`
            )
            .join("\n")
        : defaultScheduleTr;

    const milestoneScheduleMarkdownEn =
      input.milestones && input.milestones.length > 0
        ? input.milestones
            .map(
              (m, i) => `- **Phase ${i + 1} (${m.percentage}%):** ${m.titleEn} — ${m.descriptionEn}`
            )
            .join("\n")
        : defaultScheduleEn;

    const inspectionClauseTr = hasAcceptanceCriteria
      ? `İş Sahibi, Yüklenici tarafından yapılan teslimatı takip eden **${inspectionDays} (yedi) iş günü** içinde teslimatı EK-1'de kararlaştırılan Objektif Kabul Kriterleri çerçevesinde incelemekle yükümlüdür. İşbu kriterleri karşılayan teslimat ayıpsız sayılır; işveren keyfi ret yapamaz, ancak EK-1'deki somut kriter eksikliklerini gerekçe göstererek revizyon isteyebilir. Bu süre içinde yazılı itiraz yapılmadığı takdirde eser zımnen eksiksiz ve ayıpsız kabul edilmiş sayılır.`
      : `İş Sahibi, Yüklenici tarafından yapılan teslimatı takip eden **${inspectionDays} (yedi) iş günü** içinde eseri incelemek ve varsa teknik ayıp/kusurları yazılı olarak bildirmekle yükümlüdür. Bu süre içinde yazılı itiraz yapılmadığı takdirde eser zımnen eksiksiz ve ayıpsız kabul edilmiş sayılır.`;

    const inspectionClauseEn = hasAcceptanceCriteria
      ? `The Client shall inspect deliverables within **${inspectionDays} business days** of handover in strict accordance with the Objective Acceptance Criteria specified in ANNEX-1. Deliverables meeting said criteria are deemed accepted; the Client may not reject subjectively and may only request revisions citing specific unmet criteria in ANNEX-1. Failure to submit written objections within this window constitutes formal deemed acceptance.`
      : `The Client shall inspect deliverables within **${inspectionDays} business days** of handover. Failure to submit written objections within this window constitutes formal deemed acceptance.`;

    const annexMarkdownTr = hasAcceptanceCriteria
      ? `\n\n---\n\n${AcceptanceEngine.generateContractAnnexMarkdown(acceptanceCriteria, "tr")}`
      : "";
    const annexMarkdownEn = hasAcceptanceCriteria
      ? `\n\n---\n\n${AcceptanceEngine.generateContractAnnexMarkdown(acceptanceCriteria, "en")}`
      : "";

    // Data Processing Addendum (KVKK m. 12 & GDPR Art. 28) Setup
    const hasDpa = Boolean(input.dpaConfig?.enabled);
    const dpaMarkdownTr =
      hasDpa && input.dpaConfig
        ? `\n\n---\n\n${DpaEngine.generateDpaAnnexMarkdown(input.dpaConfig, "tr", clientName, contractorName)}`
        : "";
    const dpaMarkdownEn =
      hasDpa && input.dpaConfig
        ? `\n\n---\n\n${DpaEngine.generateDpaAnnexMarkdown(input.dpaConfig, "en", clientName, contractorName)}`
        : "";
    const dpaHtml =
      hasDpa && input.dpaConfig
        ? DpaEngine.generateDpaAnnexHtml(input.dpaConfig, isTr ? "tr" : "en")
        : "";

    // Independent Contractor Safe Harbor (İş Kanunu m. 8 & TBK m. 470) Setup
    const hasSafeHarbor = Boolean(input.safeHarborConfig?.enabled);
    const safeHarborMarkdownTr =
      hasSafeHarbor && input.safeHarborConfig
        ? `\n\n---\n\n${SafeHarborEngine.generateSafeHarborAnnexMarkdown(input.safeHarborConfig, "tr", clientName, contractorName)}`
        : "";
    const safeHarborMarkdownEn =
      hasSafeHarbor && input.safeHarborConfig
        ? `\n\n---\n\n${SafeHarborEngine.generateSafeHarborAnnexMarkdown(input.safeHarborConfig, "en", clientName, contractorName)}`
        : "";
    const safeHarborHtml =
      hasSafeHarbor && input.safeHarborConfig
        ? SafeHarborEngine.generateSafeHarborAnnexHtml(input.safeHarborConfig, isTr ? "tr" : "en")
        : "";

    // AI Governance, License Purity & FSEK m. 52 Addendum (EU AI Act & TBK m. 474) Setup
    const hasAiGovernance = Boolean(input.aiGovernanceConfig?.enabled);
    const aiGovernanceMarkdownTr =
      hasAiGovernance && input.aiGovernanceConfig
        ? `\n\n---\n\n${AiGovernanceEngine.generateAiGovernanceAnnexMarkdown(input.aiGovernanceConfig, "tr", clientName, contractorName)}`
        : "";
    const aiGovernanceMarkdownEn =
      hasAiGovernance && input.aiGovernanceConfig
        ? `\n\n---\n\n${AiGovernanceEngine.generateAiGovernanceAnnexMarkdown(input.aiGovernanceConfig, "en", clientName, contractorName)}`
        : "";
    const aiGovernanceHtml =
      hasAiGovernance && input.aiGovernanceConfig
        ? AiGovernanceEngine.generateAiGovernanceAnnexHtml(
            input.aiGovernanceConfig,
            isTr ? "tr" : "en"
          )
        : "";

    // Software Export & Tax Exemption Addendum (GVK m. 89/13 & KDVK m. 11/1-a) Setup
    const softwareExportMarkdownTr =
      hasSoftwareExport && input.softwareExportConfig
        ? `\n\n---\n\n${SoftwareExportEngine.generateExportAnnexMarkdown(input.softwareExportConfig, "tr", clientName, contractorName)}`
        : "";
    const softwareExportMarkdownEn =
      hasSoftwareExport && input.softwareExportConfig
        ? `\n\n---\n\n${SoftwareExportEngine.generateExportAnnexMarkdown(input.softwareExportConfig, "en", clientName, contractorName)}`
        : "";
    const softwareExportHtml =
      hasSoftwareExport && input.softwareExportConfig
        ? SoftwareExportEngine.generateExportAnnexHtml(
            input.softwareExportConfig,
            isTr ? "tr" : "en"
          )
        : "";

    // Check selected contracts filter
    const selected = input.selectedContracts;
    const includeFsek = !selected || selected.includes("FSEK_IP_TRANSFER");
    const includeNda = !selected || selected.includes("BILATERAL_NDA");
    const includeDpa = Boolean(hasDpa && (!selected || selected.includes("KVKK_DPA")));
    const includeSafeHarbor = Boolean(
      hasSafeHarbor && (!selected || selected.includes("SAFE_HARBOR"))
    );
    const includeAiGov = Boolean(
      hasAiGovernance && (!selected || selected.includes("AI_GOVERNANCE"))
    );
    const includeSoftwareExport = Boolean(
      hasSoftwareExport && (!selected || selected.includes("SOFTWARE_EXPORT"))
    );
    const includeInflation = Boolean(
      hasInflationShield && (!selected || selected.includes("INFLATION_SHIELD"))
    );

    // Comprehensive 360 Lifecycle Deeds & Warranties Setup
    const compClient: ComprehensivePartyInfo = {
      userId: "client-id",
      displayName: clientName,
      email: clientEmail,
      phone: clientPhone,
      city: input.client.city || null,
      role: "CLIENT",
    };
    const compContractor: ComprehensivePartyInfo = {
      userId: "contractor-id",
      displayName: contractorName,
      email: contractorEmail,
      phone: contractorPhone,
      city: input.contractor.city || null,
      role: "CONTRACTOR",
    };

    const includeCleanCode = Boolean(
      (selected && selected.includes("CYBER_SECURITY_CLEAN_CODE")) ||
      (!selected && input.cleanCodeConfig)
    );
    const cleanCodeWarranty = includeCleanCode
      ? ComprehensiveDeedEngine.generateCleanCodeWarranty({
          engagementId: input.engagementId,
          listingTitle: input.listingTitle,
          contractor: compContractor,
          client: compClient,
          repositoryUrl: input.cleanCodeConfig?.repositoryUrl || null,
          commitHash: input.cleanCodeConfig?.commitHash || null,
          locale: isTr ? "tr" : "en",
        })
      : null;
    const cleanCodeMarkdownTr = cleanCodeWarranty
      ? `\n\n---\n\n${ComprehensiveDeedEngine.formatCleanCodeMarkdown(cleanCodeWarranty, "tr")}`
      : "";
    const cleanCodeMarkdownEn = cleanCodeWarranty
      ? `\n\n---\n\n${ComprehensiveDeedEngine.formatCleanCodeMarkdown(cleanCodeWarranty, "en")}`
      : "";
    const cleanCodeHtml = cleanCodeWarranty
      ? `<div style="margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
          <h3>${isTr ? "EK-6: Temiz Kod ve Siber Güvenlik Taahhütnamesi (TCK m. 243-245)" : "ANNEX-6: Clean Code & No-Backdoor Warranty"}</h3>
          <p style="font-size: 9pt; color: #334155;">${isTr ? cleanCodeWarranty.noBackdoorDeclarationTr : cleanCodeWarranty.noBackdoorDeclarationEn}</p>
          <div style="font-size: 8.5pt; color: #64748b; font-family: monospace;">SHA-256: ${cleanCodeWarranty.sha256}</div>
        </div>`
      : "";

    const includeFoss = Boolean(
      (selected && selected.includes("FOSS_LICENSE_COMPLIANCE")) || (!selected && input.fossConfig)
    );
    const fossWarranty = includeFoss
      ? ComprehensiveDeedEngine.generateFossComplianceWarranty({
          engagementId: input.engagementId,
          listingTitle: input.listingTitle,
          contractor: compContractor,
          client: compClient,
          repositoryUrl: input.fossConfig?.repositoryUrl || null,
          commitHash: input.fossConfig?.commitHash || null,
          locale: isTr ? "tr" : "en",
        })
      : null;
    const fossMarkdownTr = fossWarranty
      ? `\n\n---\n\n${ComprehensiveDeedEngine.formatFossComplianceMarkdown(fossWarranty, "tr")}`
      : "";
    const fossMarkdownEn = fossWarranty
      ? `\n\n---\n\n${ComprehensiveDeedEngine.formatFossComplianceMarkdown(fossWarranty, "en")}`
      : "";
    const fossHtml = fossWarranty
      ? `<div style="margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
          <h3>${isTr ? "EK-7: Açık Kaynak Lisans Saflığı ve Copyleft Bulaşmama Şartnamesi" : "ANNEX-7: FOSS & License Contamination Shield"}</h3>
          <p style="font-size: 9pt; color: #334155;">${isTr ? fossWarranty.licensePurityDeclarationTr : fossWarranty.licensePurityDeclarationEn}</p>
          <div style="font-size: 8.5pt; color: #64748b; font-family: monospace;">SHA-256: ${fossWarranty.sha256}</div>
        </div>`
      : "";

    const includeNonSolicitation = Boolean(
      (selected && selected.includes("NON_SOLICITATION")) ||
      (!selected && input.nonSolicitationConfig)
    );
    const nonSolicitationProtocol = includeNonSolicitation
      ? ComprehensiveDeedEngine.generateNonSolicitationProtocol({
          engagementId: input.engagementId,
          listingTitle: input.listingTitle,
          contractor: compContractor,
          client: compClient,
          durationMonths: input.nonSolicitationConfig?.durationMonths || 12,
          locale: isTr ? "tr" : "en",
        })
      : null;
    const nonSolicitationMarkdownTr = nonSolicitationProtocol
      ? `\n\n---\n\n${ComprehensiveDeedEngine.formatNonSolicitationMarkdown(nonSolicitationProtocol, "tr")}`
      : "";
    const nonSolicitationMarkdownEn = nonSolicitationProtocol
      ? `\n\n---\n\n${ComprehensiveDeedEngine.formatNonSolicitationMarkdown(nonSolicitationProtocol, "en")}`
      : "";
    const nonSolicitationHtml = nonSolicitationProtocol
      ? `<div style="margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
          <h3>${isTr ? "EK-8: Müşteri ve Personel Ayartmama Protokolü (TTK m. 55)" : "ANNEX-8: Non-Solicitation & Platform Integrity Protocol"}</h3>
          <p style="font-size: 9pt; color: #334155;">${isTr ? nonSolicitationProtocol.customerProtectionTr : nonSolicitationProtocol.customerProtectionEn}</p>
          <div style="font-size: 8.5pt; color: #64748b; font-family: monospace;">SHA-256: ${nonSolicitationProtocol.sha256}</div>
        </div>`
      : "";

    const includeMutualRelease = Boolean(selected && selected.includes("MUTUAL_RELEASE_DISCHARGE"));
    const includeLiquidation = Boolean(selected && selected.includes("TERMINATION_LIQUIDATION"));

    // Safe Harbor Warning Banner
    const safeHarborBannerTr = isWhiteLabel
      ? `> ℹ️ **YASAL UYARI VE SÖZLEŞME METNİ BİLGİLENDİRMESİ (TBK m. 26, m. 115 / HMK m. 193):**  
> *İşbu sözleşme tamamen tarafların serbest iradesiyle münhasıran İş Sahibi (Müşteri) ile Yüklenici (Serbest Çalışan) arasında akdedilmiştir. Sözleşmenin hazırlanmasında veya tarafların iletişiminde yararlanılan dijital teknoloji, şablon ve iletişim altyapısı sağlayıcıları hiçbir surette işbu sözleşmenin tarafı, garantörü, kefili veya hakemi değildir. Doğabilecek her türlü uyuşmazlık münhasıran taraflar arasında çözümlenir.*

---
`
      : `> ⚠️ **YASAL UYARI VE PLATFORM DAVA MUAFİYETİ (TBK m. 26, m. 115 / HMK m. 193 / 5651 Sayılı Kanun m. 8-9):**  
> *İşbu sözleşme tamamen opsiyonel olup; münhasıran İş Sahibi (Müşteri) ile Yüklenici (Serbest Çalışan) arasında akdedilmiştir. Operis platformu ve bağlı işleticisi; yalnızca tarafları bir araya getiren bağımsız bir teknoloji ve iletişim yer sağlayıcısıdır. Operis bu sözleşmenin hiçbir surette tarafı, garantörü, kefili, vekili, işvereni veya hakemi değildir. İşbu sözleşmeden doğabilecek her türlü hukuki, cezai ve mali uyuşmazlık ile davalar MÜNHASIRAN İş Sahibi ile Yüklenici arasında çözümlenir. Taraflar Operis aleyhine herhangi bir dava ikame edemez, icra takibi veya tazminat talebinde bulunamazlar.*

---
`;

    const safeHarborBannerEn = isWhiteLabel
      ? `> ℹ️ **LEGAL NOTICE & STATUTORY INFORMATION (TBK Art. 26, Art. 115 / HMK Art. 193):**  
> *This Agreement is entered into strictly and voluntarily between Client and Contractor under freedom of contract. Any technology platform, template engine, or communication infrastructure provider utilized herein is neither a party, guarantor, surety, nor arbiter to this Agreement. All disputes shall be resolved solely between the executing parties.*

---
`
      : `> ⚠️ **STATUTORY SAFE HARBOR & PLATFORM LIABILITY WAIVER (TBK Art. 26, Art. 115 / HMK Art. 193 / Law No. 5651):**  
> *This Agreement is entirely optional and entered into strictly between Client and Contractor. The Operis platform is exclusively an independent intermediary venue and hosting provider under Law No. 5651. Operis is not a party, employer, partner, guarantor, or arbiter. All disputes shall be resolved solely between the parties. The parties irrevocably release Operis from any claims or litigation.*

---
`;

    // Signatures Markdown block
    const clientSigMd = input.clientSignature
      ? `✅ **E-İmzalandı:** ${input.clientSignature.signerName}  \n**Tarih:** ${input.clientSignature.signedAt}  \n**HMK m. 199 Damgası:** \`${input.clientSignature.ipHash || "HMK-199-VERIFIED"}\``
      : `**İmza / Kaşe:** ___________________  \n**Tarih:** ${matchedDateFormatted}`;

    const contractorSigMd = input.contractorSignature
      ? `✅ **E-İmzalandı:** ${input.contractorSignature.signerName}  \n**Tarih:** ${input.contractorSignature.signedAt}  \n**HMK m. 199 Damgası:** \`${input.contractorSignature.ipHash || "HMK-199-VERIFIED"}\``
      : `**İmza / Kaşe:** ___________________  \n**Tarih:** ${matchedDateFormatted}`;

    // Build canonical Markdown content
    const markdown = isTr
      ? `${safeHarborBannerTr}# BAĞIMSIZ YAZILIM VE TEKNOLOJİ HİZMET SÖZLEŞMESİ (ESER SÖZLEŞMESİ VE GİZLİLİK PROTOKOLÜ)
**Referans Kodu:** \`${contractRef}\`  
**Tanzim Tarihi:** ${matchedDateFormatted}  
**Dijital Üretim Damgası:** ${generatedDateFormatted}  
**Mevzuat Dayanağı:** 6098 sayılı Türk Borçlar Kanunu (TBK m. 470 vd.${isSquad ? ", m. 620" : ""}) ve 5846 sayılı Fikir ve Sanat Eserleri Kanunu (FSEK m. 52)

---

### MADDE 1: TARAFLAR
İşbu Sözleşme, aşağıda bilgileri yer alan taraflar arasında akdedilmiştir:

1. **İŞ SAHİBİ (MÜŞTERİ):**
   - **Adı / Unvanı:** ${clientName}
   - **E-posta Adresi:** ${clientEmail}
   - **İletişim Kanalı:** ${clientPhone}
${squadPartyMarkdownTr}${squadClausesTr}
---

### MADDE 2: SÖZLEŞMENİN KONUSU VE TEKNİK KAPSAMI (TBK m. 470)
İşbu Sözleşmenin konusu; Yüklenici tarafından İş Sahibi için aşağıda teknik özellikleri ve başlığı belirtilen **"${input.listingTitle}"** projesine ilişkin yazılım geliştirme, arayüz tasarımı, mimari yapılandırma ve ilgili teknoloji hizmetlerinin TBK m. 470 anlamında bağımsız bir "eser" olarak meydana getirilmesi ve teslimidir.
- **Kategori:** ${input.category}
- **Mutabık Kalınan Teknik Kapsam:** ${cleanScope}

---

### MADDE 3: PROJE BEDELİ, FATURALANDIRMA VE KİLOMETRE TAŞLARI
3.1. **Kararlaştırılan Proje Bedeli:** ${budget}  
3.2. **Ödeme Şekli, Faturalandırma ve Vergi Rejimi:**
${
  includeSoftwareExport
    ? `   - **3.2.1. Ödeme Kanalı ve İhracat Rejimi:** Bedel, doğrudan İş Sahibi tarafından Yüklenici'nin Türkiye'deki banka nezdinde açılmış döviz/TL hesabına (IBAN) transfer/SWIFT yoluyla ödenecektir.
   - **3.2.2. GVK m. 89/13 ve KDVK m. 11/1-a Kapsamı:** İşbu sözleşme konusu hizmet; 193 sayılı Gelir Vergisi Kanunu'nun 89/13. maddesi ve 3065 sayılı Katma Değer Vergisi Kanunu'nun 11/1-a ve 12/2. maddeleri kapsamında münhasıran yurt dışındaki müşteri için üretilmiş ve Türkiye dışında faydalanılmış **Yazılım İhracatı** mahiyetindedir.
   - **3.2.3. Vergi İstisnası ve Tevkifat:** Hizmet bedeli üzerinden %0 KDV hesaplanacak (GİB İstisna Kodu: 302) ve yurt içi tevkifat (stopaj) uygulanmayacaktır.
   - **3.2.4. Tevsik Mükellefiyeti:** Hizmet ihracatı rejiminin şartları, döviz tevsik mükellefiyeti ve yasal klozlar ayrılmaz ek niteliğindeki **EK-5 Yazılım İhracatı ve Vergi İstisnası Şartnamesi** hükümlerine tabidir.`
    : `   - **3.2.1. Ödeme Kanalı ve Brüt Bedel İlkesi:** Bedel, doğrudan İş Sahibi tarafından Yüklenici'nin bildireceği banka hesabına (IBAN) havale/EFT yoluyla veya düzenlenecek serbest meslek makbuzu (SMM) / e-fatura mukabilinde ödenecektir. Kararlaştırılan bedel aksi açıkça belirtilmedikçe BRÜT hizmet bedelidir.
   - **3.2.2. Kurumsal Müşterilerde Stopaj Tevkifatı (GVK m. 94/2-b):** İş Sahibi'nin 193 sayılı Gelir Vergisi Kanunu kapsamında tevkifat yapma sorumluluğu bulunan kurumsal bir vergi mükellefi olması halinde; kanuni oranda (%20) stopaj kesilerek muhtasar beyanname ile vergi dairesine yatırılacaktır.
   - **3.2.3. Katma Değer Vergisi (3065 s. KDVK):** KDV mevzuatı uyarınca hesaplanan Katma Değer Vergisi (%20) İş Sahibi tarafından Yüklenici'ye ödenecek; Yüklenici tarafından 1 No.lu KDV beyannamesi ile devlete iletilecektir.
   - **3.2.4. Bireysel Tüketiciler ve Muafiyet:** İş Sahibi'nin stopaj yükümlüsü olmayan nihai tüketici (gerçek kişi) olması durumunda stopaj tevkifatı uygulanmaz.`
}${statutoryTaxMarkdown}
${
  isWhiteLabel
    ? `3.3. **Doğrudan İki Taraflı Ödeme:** Taraflar ödemelerin doğrudan kendi aralarında yapılacağını, üçüncü şahıslar nezdinde herhangi bir emanet hesabı (escrow) tutulmadığını ve üçüncü tarafların ödeme garantörü olmadığını kabul eder.`
    : `3.3. **Platform Sorumsuzluğu:** Operis platformu hiçbir surette emanet hesabı (escrow) tutmaz, komisyon almaz, finansal transferlere aracılık etmez ve ödeme garantörü değildir.`
}  
3.4. **Kararlaştırılan Hakediş ve Kilometre Taşları Çizelgesi:**
${milestoneScheduleMarkdownTr}${includeInflation ? `\n\n${inflationShieldMarkdownTr}` : ""}

---

### MADDE 4: TESLİMAT, KABUL MUAYENESİ VE REVİZYON SINIRLARI (TBK m. 474)
4.1. **Öngörülen Teslimat Süresi:** ${timeline}  
4.2. **Muayene ve Kabul (TBK m. 474):** ${inspectionClauseTr}  
4.3. **Revizyon Sınırı:** Madde 2'de tanımlanan kapsam dahilinde azami **${revisionLimit} (iki) tur** revizyon hakkı bulunmaktadır. Kapsamı aşan yeni fonksiyon, ekran veya mimari değişiklik talepleri ek iş (Scope Creep) niteliğinde olup ayrı bedel ve takvime tabidir.  
4.4. **Sürelerin ve Günlerin Hesabı Kuralı:** İşbu sözleşmede "iş günü" olarak belirlenen sürelerin hesabında resmi tatil günleri ile Cumartesi ve Pazar günleri hesaba katılmaz. "Takvim günü" veya "gün" olarak belirlenen süreler ise resmi tatiller dahil kesintisiz takvim günü esasına tabidir.

---

### MADDE 5: 5846 SAYILI FSEK m. 52 UYARINCA MALİ VE FİKRİ MÜLKİYET HAKLARININ DEVRİ
${
  includeFsek
    ? `5.1. **Münferit Mali Hak Devri:** Yüklenici tarafından meydana getirilen yazılım, kaynak kodları, tasarım ögeleri ve teknik dokümantasyon üzerindeki 5846 sayılı Fikir ve Sanat Eserleri Kanunu'nda (FSEK) sayılan;
   - **İşleme Hakkı** (FSEK m. 21),
   - **Çoğaltma Hakkı** (FSEK m. 22),
   - **Yayma Hakkı** (FSEK m. 23),
   - **Temsil Hakkı** (FSEK m. 24),
   - **İşaret, Ses ve/veya Görüntü Nakline Yarayan Araçlarla Umuma İletim Hakkı** (FSEK m. 25),
mali haklarını, yurt içinde ve yurt dışında herhangi bir yer, süre ve mecra kısıtlaması olmaksızın, projenin Madde 3'te kararlaştırılan hakediş bedelinin eksiksiz ödenmesi şartına bağlı olarak, münhasıran ve geri dönülemez surette İş Sahibi'ne devretmeyi kabul, beyan ve taahhüt eder.  
5.2. **Manevi Haklar ve Portfolyo Referansı:** Eser sahibinin FSEK kapsamındaki manevi hakları saklıdır. Yüklenici, işbu projeyi ticari sırları ihlal etmeksizin kendi mesleki portfolyosunda referans olarak sergileme hakkını saklı tutar.${isSquad ? `\n5.3. **Konsorsiyum Ortak Telif Güvencesi:** Ortak Yükleniciler konsorsiyumu üyeleri, proje kapsamında ürettikleri tüm fikri çıktıları işbu sözleşme şartları dahilinde FSEK m. 52 uyarınca İŞVEREN'e kayıtsız ve şartsız devretmeyi müştereken taahhüt ederler.\n` : ""}${includeAiGov ? `\n5.4. **Yapay Zeka ve Fikri Mülkiyet Protokolü:** Eserin meydana getirilmesinde yararlanılan yapay zeka araçları, telif devrinin geçerliliği, insani fikri katkı (Human-in-the-Loop) ve copyleft lisans temizliği güvenceleri, sözleşmenin ayrılmaz bir parçası olan **EK-4 Yapay Zeka Telif Devri, Lisans Temizliği ve Halüsinasyon Sorumluluk Şartnamesi** hükümlerine tabidir.\n` : ""}`
    : `5.1. **Telif ve Fikri Haklar:** Taraflar bu projede ayrı bir telif devir protokolü seçmemiştir; genel mevzuat hükümleri caridir.`
}

---

### MADDE 6: GİZLİLİK VE TİCARİ SIRLARIN KORUNMASI (NDA)
${
  includeNda
    ? `Taraflar, işbu sözleşmenin ifası kapsamında birbirleri hakkında edindikleri kaynak kodları, sistem şifreleri, müşteri veritabanları, iş modelleri ve her türlü gizli bilgiyi üçüncü şahıslara açıklamama konusunda kesin bir gizlilik yükümlülüğü altındadır. Bu yükümlülük sözleşmenin sona ermesinden itibaren **${ndaYears} (üç) yıl** boyunca yürürlükte kalacaktır.${includeDpa ? `\n\n6.2. **Kişisel Verilerin Korunması (KVKK m. 12 & DPA):** İşbu sözleşme kapsamında gerçekleştirilen kişisel veri işleme faaliyetleri, sözleşmenin ayrılmaz bir parçası olan **EK-2 Veri İşleme ve Bilgi Güvenliği Protokolü** hükümlerine tabidir.` : ""}${includeAiGov ? `\n\n6.3. **Yapay Zeka Modelleri ve Sıfır Saklama (Zero Data Retention):** Yüklenici, İş Sahibi'ne ait kaynak kodları, mimari tasarımları ve veritabanı şemalarını genel yapay zeka modellerinin eğitim havuzuna aktarmayacağını; yalnızca kurumsal sıfır saklama veya çevrimdışı yerel ortamlarda çalışacağını gayrikabili rücu taahhüt eder.` : ""}`
    : `Taraflar mesleki etik ve dürüstlük kuralı çerçevesinde edindikleri bilgileri üçüncü kişilerle haksız rekabet oluşturacak şekilde paylaşmamayı taahhüt eder.`
}

---

### MADDE 7: AYIP GARANTİSİ VE TEKNİK DESTEK (TBK m. 477/2)
7.1. Yüklenici, teslimat ve kabulü takiben **${warrantyDays} (otuz) TAKVİM GÜNÜ** içerisinde eserin sözleşmede belirtilen teknik gereksinimleri karşılamasını garanti eder.  
7.2. Bu süre zarfında ortaya çıkabilecek kodlama hataları ve kritik fonksiyonel arızalar Yüklenici tarafından ek bir ücret talep edilmeksizin azami 3 (üç) iş günü içinde ivedilikle giderilecektir. TBK m. 477/2 uyarınca kasten gizlenen ağır kusur ve hileli ayıplara karşı haklar süresiz saklıdır.

---

### MADDE 8: BAĞIMSIZ YÜKLENİCİ STATÜSÜ
Taraflar arasında 4857 sayılı İş Kanunu anlamında herhangi bir işçi-işveren, vekalet veya ortaklık ilişkisi doğmamıştır. Yüklenici, bağımsız bir yüklenici olup vergi, SGK ve yasal mükellefiyetlerinden bizzat sorumludur.

---

${
  isWhiteLabel
    ? `### MADDE 9: TEKNOLOJİ VE İLETİŞİM ALTYAPISI SAĞLAYICISININ HUKUKİ STATÜSÜ (5651 Sayılı Kanun & TBK m. 115)
9.1. **Sözleşmenin Tamamen Opsiyonel ve İki Taraflı Niteliği:** İşbu Sözleşme, 6098 sayılı Türk Borçlar Kanunu Madde 26'daki Sözleşme Özgürlüğü prensibi uyarınca, tarafların kendi serbest iradeleriyle münhasıran İş Sahibi ile Yüklenici arasında bağımsız olarak akdedilmiştir.
9.2. **Altyapı Sağlayıcısının Taraf Olmaması:** İşbu sözleşmenin hazırlanmasında, imzalanmasında veya tarafların iletişiminde yararlanılan dijital teknoloji, iletişim ve yazılım altyapısı sağlayıcıları 5651 sayılı Kanun kapsamında bağımsız "Yer Sağlayıcı" statüsündedir. Altyapı ve teknoloji sağlayıcıları hiçbir surette işbu sözleşmenin tarafı, işvereni, alt yüklenicisi, ortağı, vekili, garantörü veya kefili değildir.
9.3. **Dava ve İhtilaf Muafiyeti:** Sözleşmenin ifası, eksik veya ayıplı ifa (TBK m. 474/477), gecikme, telif hakları (FSEK m. 52), kişisel verilerin korunması (KVKK m. 12), ücret ödemeleri veya vergi mükellefiyetleri dahil doğabilecek her türlü hukuki, cezai, idari ve mali uyuşmazlık ile davalar MÜNHASIRAN İş Sahibi ile Yüklenici arasında çözümlenir. Taraflar, sözleşme şablonu, dijital mühürleme ve teknoloji altyapısı sağlayıcıları aleyhine herhangi bir alacak, tazminat, rücu talebinde bulunamayacaklarını ve dava ikame edemeyeceklerini TBK m. 115 ve HMK m. 193 uyarınca gayrikabili rücu kabul, beyan ve taahhüt ederler.`
    : `### MADDE 9: OPERİS PLATFORMUNUN HUKUKİ STATÜSÜ VE DAVA MUAFİYETİ (TAM SORUMSUZLUK, TBK m. 26, m. 115 & 5651 Sayılı Kanun)
9.1. **Sözleşmenin Tamamen Opsiyonel ve İki Taraflı Niteliği:** İşbu Sözleşme, 6098 sayılı Türk Borçlar Kanunu Madde 26'daki Sözleşme Özgürlüğü prensibi uyarınca, tarafların kendi serbest iradeleriyle münhasıran İş Sahibi ile Yüklenici arasında bağımsız olarak akdedilmiştir. Sözleşmenin imzalanması Operis platformu tarafından zorunlu tutulmamış olup, tamamen tarafların karşılıklı tercihi doğrultusunda gerçekleşmiştir.
9.2. **Platformun Taraf Olmaması:** Operis platformu (ve platformu işleten şirket/yöneticileri); 5651 sayılı Kanun kapsamında bağımsız bir "Yer Sağlayıcı" ve iletişim/teknoloji aracı sağlayıcısıdır. Operis hiçbir surette işbu sözleşmenin tarafı, işvereni, alt yüklenicisi, ortağı, vekili, garantörü veya kefili değildir.
9.3. **Dava ve İhtilaf Muafiyeti:** Sözleşmenin ifası, eksik veya ayıplı ifa (TBK m. 474/477), gecikme, telif hakları (FSEK m. 52), kişisel verilerin korunması (KVKK m. 12), ücret ödemeleri veya vergi mükellefiyetleri dahil doğabilecek her türlü hukuki, cezai, idari ve mali uyuşmazlık ile davalar MÜNHASIRAN İş Sahibi ile Yüklenici arasında çözümlenir. Taraflar, Operis aleyhine herhangi bir alacak, tazminat, rücu talebinde bulunamayacaklarını ve dava ikame edemeyeceklerini TBK m. 115 ve HMK m. 193 uyarınca gayrikabili rücu kabul, beyan ve taahhüt ederler.`
}

---

### MADDE 10: ARABULUCULUK, TAHKİM VE UYUŞMAZLIK ÇÖZÜMÜ
10.1. **Zorunlu Dava Şartı Arabuluculuk:** Taraflar, çıkabilecek uyuşmazlıklarda dava açmadan veya icra takibi başlatmadan önce 6325 sayılı Hukuk Uyuşmazlıklarında Arabuluculuk Kanunu uyarınca doğrudan arabuluculuk yoluna başvurmayı peşinen taahhüt ederler.  
10.2. **Tahkim ve Mahkeme Yetkisi:** Arabuluculuk yoluyla çözülemeyen uyuşmazlıklarda;
   a) Tarafların karşılıklı yazılı mutabakatı halinde uyuşmazlık, **İstanbul Tahkim Merkezi (ISTAC) Hızlı Tahkim Kuralları (Fast-Track Rules)** uyarınca tek hakem marifetiyle nihai ve bağlayıcı olarak çözümlenir. Tahkim dili Türkçe, tahkim yeri İstanbul'dur.  
   b) Tahkime gidilmemesi durumunda münhasıran **İstanbul (Çağlayan) Mahkemeleri ve İcra Daireleri** yetkilidir.  
10.3. **Münhasır Delil Sözleşmesi (HMK m. 193):** HMK m. 193 uyarınca tarafların kayıtlı e-posta yazışmaları, Git commit/PR kayıtları, sunucu erişim logları ve SHA-256 dijital mühürleri kesin ve münhasır delil teşkil eder.

---

| İŞ SAHİBİ (MÜŞTERİ) | YÜKLENİCİ (GELİŞTİRİCİ) |
| :--- | :--- |
| **İsim / Unvan:** ${clientName} | **İsim / Unvan:** ${contractorName} |
| ${clientSigMd} | ${contractorSigMd} |
${annexMarkdownTr}${includeDpa ? dpaMarkdownTr : ""}${includeSafeHarbor ? safeHarborMarkdownTr : ""}${includeAiGov ? aiGovernanceMarkdownTr : ""}${includeSoftwareExport ? softwareExportMarkdownTr : ""}${includeCleanCode ? cleanCodeMarkdownTr : ""}${includeFoss ? fossMarkdownTr : ""}${includeNonSolicitation ? nonSolicitationMarkdownTr : ""}`
      : `${safeHarborBannerEn}# INDEPENDENT SOFTWARE & TECHNOLOGY SERVICES AGREEMENT (CONTRACT FOR WORK & NDA)
**Reference Code:** \`${contractRef}\`  
**Execution Date:** ${matchedDateFormatted}  
**Digital Timestamp:** ${generatedDateFormatted}  
**Governing Baseline:** Turkish Code of Obligations (TBK Art. 470 et seq.) & Law on Intellectual and Artistic Works (FSEK Art. 52)

---

### ARTICLE 1: PARTIES
This Agreement is entered into between:

1. **CLIENT:**
   - **Name / Entity:** ${clientName}
   - **Email:** ${clientEmail}
   - **Contact Channel:** ${clientPhone}
${squadPartyMarkdownEn}${squadClausesEn}
---

### ARTICLE 2: SUBJECT MATTER & TECHNICAL SCOPE (TBK Art. 470)
The Contractor agrees to produce and deliver an independent technological work entitled **"${input.listingTitle}"**, encompassing software engineering, system architecture, and interface design as specified below.
- **Category:** ${input.category}
- **Agreed Technical Scope:** ${cleanScope}

---

### ARTICLE 3: FEES, INVOICING & TAX REGIME
3.1. **Contract Price:** ${budget}  
3.2. **Payment Method, Invoicing & Statutory Tax Regime:**
${
  hasSoftwareExport
    ? `   - **3.2.1. Payment Remittance & Export Status:** Payment shall be remitted directly to the Contractor's designated bank account in Turkey via SWIFT / international wire.
   - **3.2.2. Statutory Export Classification:** Services constitute **Cross-Border Software Export** within the statutory meaning of Income Tax Law (GVK) Art. 89/13 and VAT Law (KDVK) Art. 11/1-a and Art. 12/2, exclusively utilized outside Turkey.
   - **3.2.3. Tax Exemption & Zero Withholding:** Invoicing shall be issued at 0% VAT (GİB Exemption Code 302) with zero domestic tax withholding.
   - **3.2.4. Statutory Certifications:** Repatriation obligations and certifications are governed by **ANNEX-5 Software Export & Tax Exemption Addendum**.`
    : `   - **3.2.1. Payment Channel & Gross Basis:** Payments shall be remitted directly to the Contractor's designated bank account (IBAN) or against a statutory invoice / receipt (SMM). Unless agreed otherwise in writing, the contracted sum constitutes the GROSS service fee.
   - **3.2.2. Corporate Withholding (GVK Art. 94):** If the Client is a corporate tax entity subject to withholding, statutory withholding (20%) shall be deducted and remitted directly to the tax authority via withholding tax return.
   - **3.2.3. Value Added Tax (VAT):** Statutory VAT (20%) calculated on the fee shall be paid to the Contractor, who shall report it via standard VAT returns.
   - **3.2.4. Individual Consumers:** Where the Client is an individual final consumer, zero withholding applies.`
}${statutoryTaxMarkdown}
${
  isWhiteLabel
    ? `3.3. **Direct Bilateral Remittance:** The parties agree that payments shall be remitted directly between the parties, and that no third-party escrow or custody is maintained.`
    : `3.3. **Zero Platform Escrow:** The Operis platform does not hold escrow, charge commissions, or process financial payments. Operis is not a guarantor.`
}  
3.4. **Agreed Milestone Schedule:**
${milestoneScheduleMarkdownEn}${hasInflationShield ? `\n\n${inflationShieldMarkdownEn}` : ""}

---

### ARTICLE 4: DELIVERY, INSPECTION & COMPUTATION OF TIME (TBK Art. 474)
4.1. **Target Timeline:** ${timeline}  
4.2. **Inspection & Acceptance (TBK Art. 474):** ${inspectionClauseEn}  
4.3. **Revision Boundaries:** Up to **${revisionLimit} revision cycles** are included within agreed scope. Out-of-scope requests (Scope Creep) require a separate written addendum and fee.  
4.4. **Computation of Time:** Days designated as "business days" exclude official public holidays and weekends. Periods designated as "calendar days" run continuously inclusive of non-working days.

---

### ARTICLE 5: STATUTORY INTELLECTUAL PROPERTY ASSIGNMENT (FSEK Art. 52)
5.1. **Express Enumeration of Assigned Economic Rights:** Conditioned upon full payment of the agreed fee, the Contractor irrevocably and exclusively assigns all statutory economic rights under Law No. 5846:
   - **Right of Adaptation / Modification** (FSEK Art. 21),
   - **Right of Reproduction** (FSEK Art. 22),
   - **Right of Distribution** (FSEK Art. 23),
   - **Right of Public Performance / Representation** (FSEK Art. 24),
   - **Right of Communication to the Public via Wire/Wireless Means** (FSEK Art. 25).  
5.2. **Moral Rights:** Moral rights under statutory law remain with the author; the Contractor retains the right to cite the project for personal professional portfolio purposes.${isSquad ? `\n5.3. **Consortium Joint IP Assignment:** All Co-Contractors jointly assign all statutory economic rights to the Client upon full settlement.\n` : ""}${hasAiGovernance ? `\n5.4. **AI Governance & Intellectual Property Protocol:** The deployment of generative AI tools, the statutory validity of economic rights transfer (Human-in-the-Loop authorship), and anti-copyleft license warranties are governed by **ANNEX-4 AI Governance & Intellectual Property Addendum**.\n` : ""}

---

### ARTICLE 6: CONFIDENTIALITY & TRADE SECRETS (NDA)
Both parties shall protect source code, database architectures, credentials, and business information as strictly confidential for a term of **${ndaYears} years** following execution.${hasDpa ? `\n\n6.2. **Personal Data Processing (KVKK Art. 12 & GDPR Art. 28):** All personal data processing activities conducted under this Agreement are strictly governed by **ANNEX-2 Data Processing Addendum**.` : ""}${hasAiGovernance ? `\n\n6.3. **AI Models & Zero Data Retention:** The Contractor covenants and agrees that the Client's source code, architectural schemas, and confidential data shall never be submitted to public consumer AI models for model training, operating strictly under enterprise zero-data-retention or local air-gapped environments.` : ""}

---

### ARTICLE 7: DEFECT WARRANTY & MAINTENANCE (TBK Art. 477/2)
7.1. The Contractor warrants deliverables against critical reproducible bugs for **${warrantyDays} CALENDAR DAYS** following handover at no additional charge.  
7.2. Critical defects reported within this warranty window shall be remediated promptly within 3 (three) business days. Statutory remedies for intentionally concealed defects (TBK Art. 477/2) remain fully reserved.

---

### ARTICLE 8: INDEPENDENT CONTRACTOR RELATIONSHIP
The relationship is strictly that of independent contractor. No employment, agency, or partnership relationship is created.

---

${
  isWhiteLabel
    ? `### ARTICLE 9: TECHNOLOGY INFRASTRUCTURE PROVIDER STATUS & SAFE HARBOR (TBK Art. 26, Art. 115 & Law No. 5651)
9.1. **Voluntary Bilateral Agreement:** This Agreement is executed strictly between the Client and the Contractor pursuant to the principle of Freedom of Contract under Turkish Code of Obligations Art. 26.
9.2. **Infrastructure Provider Independent Status:** Any digital technology, template, or communication infrastructure provider utilized in connection with this Agreement is strictly an independent intermediary venue provider under Law No. 5651. The infrastructure provider is not a party, employer, contractor, partner, agent, guarantor, or surety to this Agreement.
9.3. **Exclusive Bilateral Dispute Resolution:** All claims, liabilities, statutory defect claims (TBK Art. 474/477), intellectual property disputes (FSEK Art. 52), data privacy liabilities (KVKK Art. 12 / GDPR Art. 28), and fee disputes shall be resolved exclusively between the Client and Contractor. The parties irrevocably waive and release any claims, lawsuits, or demands against the infrastructure and software providers pursuant to TBK Art. 115 and HMK Art. 193.`
    : `### ARTICLE 9: OPERIS PLATFORM INDEPENDENT STATUS, COMPLETE LIABILITY WAIVER & SAFE HARBOR (TBK Art. 26, Art. 115 & Law No. 5651)
9.1. **Voluntary Bilateral Agreement:** This Agreement is executed strictly between the Client and the Contractor pursuant to the principle of Freedom of Contract under Turkish Code of Obligations Art. 26. Contract execution is completely voluntary and is not mandated by the platform.
9.2. **Platform Independent Venue Provider:** Operis (and its operating entity) is strictly an independent intermediary venue provider under Law No. 5651. Operis is not a party, employer, contractor, partner, agent, guarantor, or surety to this Agreement.
9.3. **Exclusive Bilateral Dispute Resolution:** All claims, liabilities, statutory defect claims (TBK Art. 474/477), intellectual property disputes (FSEK Art. 52), data privacy liabilities (KVKK Art. 12 / GDPR Art. 28), and fee disputes shall be resolved exclusively between the Client and Contractor. The parties irrevocably waive and release any claims, lawsuits, or demands against Operis and its management pursuant to TBK Art. 115 and HMK Art. 193.`
}

---

### ARTICLE 10: DISPUTE RESOLUTION, ISTAC ARBITRATION & JURISDICTION
10.1. **Mandatory Mediation:** Parties agree to submit disputes to mandatory mediation under Law No. 6325 before instituting formal legal proceedings.  
10.2. **Arbitration & Governing Courts:** Disputes not resolved through mediation shall be resolved either:
   a) By final and binding arbitration administered by the **Istanbul Arbitration Centre (ISTAC)** under its Fast-Track Arbitration Rules by a sole arbitrator in Istanbul; or  
   b) Exclusively before the **Courts and Execution Offices of Istanbul (Caglayan)**.  
10.3. **Statutory Evidence Agreement (HMK Art. 193):** Server access logs, Git commit logs, cryptographic SHA-256 seals, and verified emails constitute definitive and exclusive legal evidence under HMK Art. 193.

---

| CLIENT | CONTRACTOR |
| :--- | :--- |
| **Name:** ${clientName} | **Name:** ${contractorName} |
| ${
          input.clientSignature
            ? `✅ **E-Signed:** ${input.clientSignature.signerName}  \n**Timestamp:** ${input.clientSignature.signedAt}  \n**HMK Art. 199 Seal:** \`${input.clientSignature.ipHash || "HMK-199-VERIFIED"}\``
            : `**Signature / Stamp:** ___________________  \n**Date:** ${matchedDateFormatted}`
        } | ${
          input.contractorSignature
            ? `✅ **E-Signed:** ${input.contractorSignature.signerName}  \n**Timestamp:** ${input.contractorSignature.signedAt}  \n**HMK Art. 199 Seal:** \`${input.contractorSignature.ipHash || "HMK-199-VERIFIED"}\``
            : `**Signature / Stamp:** ___________________  \n**Date:** ${matchedDateFormatted}`
        } |
${annexMarkdownEn}${includeDpa ? dpaMarkdownEn : ""}${includeSafeHarbor ? safeHarborMarkdownEn : ""}${includeAiGov ? aiGovernanceMarkdownEn : ""}${includeSoftwareExport ? softwareExportMarkdownEn : ""}${includeCleanCode ? cleanCodeMarkdownEn : ""}${includeFoss ? fossMarkdownEn : ""}${includeNonSolicitation ? nonSolicitationMarkdownEn : ""}
`;

    // Compute canonical SHA-256 fingerprint of the markdown contract text
    const sha256Fingerprint = this.calculateSha256(markdown);

    const renderSignatureBlock = (
      sig: typeof input.clientSignature,
      altText: string
    ) => {
      if (sig?.signatureDataUrl) {
        return `<div style="margin-top: 8px;"><img src="${sig.signatureDataUrl}" style="max-height: 44px; max-width: 180px; object-fit: contain;" alt="${altText}" /></div>`;
      }
      if (sig) {
        return `<div style="margin-top: 14px; color: #10b981; font-weight: bold;">✅ E-İmzalandı</div>`;
      }
      return `<div style="margin-top: 24px; color: #94a3b8;">İmza / Kaşe: ____________________</div>`;
    };

    // Build executive-ready HTML for clean @media print PDF conversion
    let headerBrandText = "OPERIS";
    if (isWhiteLabel) {
      headerBrandText = isTr ? "SÖZLEŞME VE PROTOKOL METNİ" : "OFFICIAL SERVICE AGREEMENT";
    }

    let headerSubText: string;
    if (isWhiteLabel) {
      headerSubText = isTr
        ? "Bağımsız Yazılım ve Teknoloji Hizmet Sözleşmesi"
        : "Independent Software & Technology Services Agreement";
    } else {
      headerSubText = isTr
        ? "Bağımsız Yazılım ve Teknoloji Sözleşme Altyapısı"
        : "Independent Software & Technology Services Agreement Infrastructure";
    }

    let sealNoticeText: string;
    if (isWhiteLabel) {
      sealNoticeText = isTr
        ? "Metin bütünlüğü ve kriptografik doğruluğu bağımsız SHA-256 algoritmasıyla tanzim edilmiştir."
        : "Text integrity and cryptographic proof verified via deterministic SHA-256 algorithm.";
    } else {
      sealNoticeText = isTr
        ? "Metin bütünlüğü Operis platformu tarafından doğrulanabilir deterministik algoritmayla tanzim edilmiştir."
        : "Document integrity verified via Operis deterministic cryptographic seal.";
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="${isTr ? "tr" : "en"}">
<head>
  <meta charset="utf-8" />
  <title>${contractRef} - ${input.listingTitle}</title>
  <style>
    @page { size: A4; margin: 18mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.55;
      color: #1a1a1a;
      background: #ffffff;
      margin: 0;
      padding: 24px;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand { font-size: 18pt; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
    .meta { font-size: 9pt; color: #64748b; text-align: right; }
    h1 { font-size: 14pt; margin: 16px 0 8px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; break-after: avoid-page; page-break-after: avoid; }
    h2 { font-size: 12pt; margin: 16px 0 6px; color: #1e293b; break-after: avoid-page; page-break-after: avoid; }
    h3 { font-size: 10.5pt; margin: 12px 0 4px; color: #334155; break-after: avoid-page; page-break-after: avoid; }
    h4, h5, h6 { break-after: avoid-page; page-break-after: avoid; }
    h1, h2, h3, h4, h5, h6,
    .brand, .party-title, .clause-title, .section-title {
      break-after: avoid-page !important;
      page-break-after: avoid !important;
    }
    h1 + *, h2 + *, h3 + *, h4 + *, h5 + *, h6 + *,
    .clause-title + *, .section-title + * {
      break-before: avoid-page !important;
      page-break-before: avoid !important;
    }
    p { margin: 6px 0; text-align: justify; }
    p, li {
      orphans: 3;
      widows: 3;
    }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 14px 0; break-inside: avoid; page-break-inside: avoid; }
    .party-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; font-size: 9.5pt; break-inside: avoid; page-break-inside: avoid; }
    .party-title { font-weight: 700; color: #1e293b; margin-bottom: 4px; text-transform: uppercase; font-size: 8.5pt; letter-spacing: 0.5px; }
    .clause-block { break-inside: avoid !important; page-break-inside: avoid !important; margin: 14px 0; }
    .sha-seal {
      margin-top: 24px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 8pt;
      font-family: monospace;
      word-break: break-all;
      color: #475569;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    .footer { margin-top: 30px; font-size: 8pt; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 9.5pt; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
    th { background: #f1f5f9; font-weight: 600; color: #334155; }
    ul { padding-left: 20px; margin: 6px 0; }
    li { margin-bottom: 3px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
      h1, h2, h3, h4, h5, h6 { break-after: avoid-page !important; page-break-after: avoid !important; }
      .clause-block, .safe-harbor-item, .safe-harbor-header, .safe-harbor-summary,
      .party-card, .parties, .sha-seal, .signature-grid, .signature-box, table, tr {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">${headerBrandText}</div>
      <div style="font-size: 8pt; color: #64748b; margin-top: 2px;">${headerSubText}</div>
    </div>
    <div class="meta">
      <div><strong>Ref:</strong> ${contractRef}</div>
      <div><strong>Tarih:</strong> ${matchedDateFormatted}</div>
      <div><strong>Durum:</strong> Hukuken Bağlayıcı Belge</div>
    </div>
  </div>

  <h1>${
    isTr
      ? "BAĞIMSIZ YAZILIM VE TEKNOLOJİ HİZMET SÖZLEŞMESİ"
      : "INDEPENDENT SOFTWARE & TECHNOLOGY SERVICES AGREEMENT"
  }</h1>
  <p style="font-size: 9pt; color: #64748b;">
    ${
      isTr
        ? "6098 sayılı Türk Borçlar Kanunu (m. 470 vd.) ve 5846 sayılı Fikir ve Sanat Eserleri Kanunu (m. 52) uyarınca düzenlenmiştir."
        : "Executed pursuant to Turkish Code of Obligations (Art. 470 et seq.) and Law on Intellectual Property (Art. 52)."
    }
  </p>

  <div class="parties">
    <div class="party-card">
      <div class="party-title">${isTr ? "İŞ SAHİBİ (MÜŞTERİ)" : "CLIENT"}</div>
      <div><strong>${clientName}</strong></div>
      <div>${clientEmail}</div>
      <div>${clientPhone}</div>
    </div>
    <div class="party-card">
      <div class="party-title">${isTr ? "YÜKLENİCİ (FREELANCER / UZMAN)" : "CONTRACTOR"}</div>
      <div><strong>${contractorName}</strong></div>
      <div>${contractorEmail}</div>
      <div>${contractorPhone}</div>
    </div>
  </div>

  ${
    isSquad && squadMembers.length > 0
      ? `
  <div style="margin: 14px 0; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <div style="background-color: #f1f5f9; padding: 8px 12px; font-weight: 700; font-size: 11px; color: #0f172a; border-bottom: 1px solid #cbd5e1;">
      ${isTr ? "👥 ÇEVİK YAZILIMCI KONSORSİYUMU VE HAKEDİŞ DAĞILIMI (TBK m. 620)" : "👥 AGILE CONSORTIUM MEMBERS & REVENUE SHARE (TBK Art. 620)"}
    </div>
    <table style="width: 100%; border-collapse: collapse; font-size: 11px; line-height: 1.4;">
      <thead style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
        <tr>
          <th style="padding: 6px 10px; text-align: left; color: #475569;">${isTr ? "Sıra" : "No"}</th>
          <th style="padding: 6px 10px; text-align: left; color: #475569;">${isTr ? "Adı Soyadı / Uzman" : "Specialist"}</th>
          <th style="padding: 6px 10px; text-align: left; color: #475569;">${isTr ? "Rol / Uzmanlık Alanı" : "Role"}</th>
          <th style="padding: 6px 10px; text-align: center; color: #475569;">${isTr ? "Hakediş Oranı (%)" : "Share (%)"}</th>
          <th style="padding: 6px 10px; text-align: left; color: #475569;">${isTr ? "Sorumluluk / İş Kapsamı" : "Scope"}</th>
        </tr>
      </thead>
      <tbody>
        ${squadMembers
          .map(
            (m, i) => {
              let leadBadge = "";
              if (m.isLead) {
                leadBadge = isTr ? "<em>(Lider Yüklenici)</em>" : "<em>(Lead)</em>";
              }
              return `
        <tr style="border-bottom: 1px solid #e2e8f0; background-color: #ffffff;">
          <td style="padding: 6px 10px; color: #64748b;">${i + 1}</td>
          <td style="padding: 6px 10px; font-weight: 600; color: #0f172a;">${m.displayName} ${leadBadge}</td>
          <td style="padding: 6px 10px; color: #334155;">${m.roleTitle}</td>
          <td style="padding: 6px 10px; text-align: center; font-weight: 700; font-family: monospace; color: #0284c7;">%${m.revenueSharePercentage}</td>
          <td style="padding: 6px 10px; color: #64748b;">${m.scopeSummary || (isTr ? "Proje içi geliştirme ve teslimat" : "Project development")}</td>
        </tr>`;
            }
          )
          .join("")}
      </tbody>
    </table>
  </div>`
      : ""
  }

  <div class="clause-block">
    <h3>${isTr ? "1. Hizmet Kapsamı ve İş Tanımı" : "1. Scope & Deliverables"}</h3>
    <p><strong>${input.listingTitle}</strong>: ${cleanScope}</p>
  </div>

  <div class="clause-block">
    <h3>${isTr ? "2. Hakediş ve Kilometre Taşları" : "2. Milestone Schedule"}</h3>
    <ul>
      ${milestones.map((m, i) => `<li><strong>%${m.percentage} (${i + 1}. Aşama):</strong> ${isTr ? m.titleTr : m.titleEn} (${isTr ? m.descriptionTr : m.descriptionEn})</li>`).join("\n      ")}
    </ul>
    ${statutoryTaxHtml}${hasInflationShield ? `\n  ${inflationShieldHtml}` : ""}
  </div>

  ${
    hasAcceptanceCriteria
      ? `
  <div class="clause-block" style="margin: 20px 0; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 8px; padding: 14px; break-inside: avoid; page-break-inside: avoid;">
    <div style="font-weight: 700; color: #0f172a; font-size: 10pt; margin-bottom: 8px; break-after: avoid-page; page-break-after: avoid;">
      📋 ${isTr ? "EK-1: Objektif Kabul Kriterleri & Definition of Done (TBK m. 470/474)" : "ANNEX-1: Objective Acceptance Criteria (TBK Art. 470/474)"}
    </div>
    <div style="font-size: 8.5pt; color: #475569; margin-bottom: 10px;">
      ${
        isTr
          ? "TBK m. 474 uyarınca teslimat ayıpsızlık muayenesi aşağıdaki objektif şartlara bağlanmıştır. Keyfi ret yapılamaz."
          : "Pursuant to TBK Art. 474, non-defective acceptance is bound to the following objective conditions. Subjective rejection is barred."
      }
    </div>
    <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
      <thead>
        <tr style="background: #e2e8f0; text-align: left;">
          <th style="border: 1px solid #cbd5e1; padding: 6px 8px; width: 60px;">${isTr ? "Aşama" : "Phase"}</th>
          <th style="border: 1px solid #cbd5e1; padding: 6px 8px;">${isTr ? "Kabul Şartı (Sade Dil)" : "Acceptance Requirement"}</th>
          <th style="border: 1px solid #cbd5e1; padding: 6px 8px;">${isTr ? "Teknik BDD Kuralı" : "BDD Scenario"}</th>
        </tr>
      </thead>
      <tbody>
        ${acceptanceCriteria
          .map(
            (c) => `<tr>
          <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-weight: 600;">Faz ${c.phaseNumber}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 8px;"><strong>${isTr ? c.humanCriterionTr : c.humanCriterionEn}</strong></td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-family: monospace; font-size: 8pt; color: #334155;">GIVEN ${isTr ? c.gherkinGivenTr : c.gherkinGivenEn}<br>WHEN ${isTr ? c.gherkinWhenTr : c.gherkinWhenEn}<br>THEN ${isTr ? c.gherkinThenTr : c.gherkinThenEn}</td>
        </tr>`
          )
          .join("")}
      </tbody>
    </table>
  </div>`
      : ""
  }
  ${hasDpa ? dpaHtml : ""}
  ${hasSafeHarbor ? safeHarborHtml : ""}
  ${hasAiGovernance ? aiGovernanceHtml : ""}
  ${hasSoftwareExport ? softwareExportHtml : ""}
  ${includeCleanCode ? cleanCodeHtml : ""}
  ${includeFoss ? fossHtml : ""}
  ${includeNonSolicitation ? nonSolicitationHtml : ""}

  <div class="clause-block">
    <h3>${isTr ? "3. 5846 Sayılı FSEK m. 52 Uyarınca Fikri Mülkiyet Devri" : "3. Statutory IP Rights Transfer (FSEK Art. 52)"}</h3>
    <p>${
      isTr
        ? "Bedelin ödenmesi şartıyla; FSEK m.21 (İşleme), m.22 (Çoğaltma), m.23 (Yayma), m.24 (Temsil) ve m.25 (Umuma İletim) mali hakları münhasıran ve sınırsız olarak İş Sahibi'ne devredilmiştir."
        : "Subject to full payment, all economic rights under FSEK Art. 21 (Adaptation), Art. 22 (Reproduction), Art. 23 (Distribution), Art. 24 (Performance), and Art. 25 (Communication to the Public) are exclusively transferred to the Client."
    }</p>
  </div>

  <div class="clause-block">
    <h3>${isTr ? "4. Muayene, Kabul ve Revizyon Sınırları" : "4. Inspection & Revisions"}</h3>
    <p>${
      isTr
        ? `İş Sahibi teslimden itibaren ${inspectionDays} iş günü içinde incelemeyi tamamlar. Azami ${revisionLimit} tur revizyon dahildir. Kapsam dışı talepler ek ücrete tabidir.`
        : `The Client shall complete inspection within ${inspectionDays} business days. Up to ${revisionLimit} revision rounds are included; scope creep requires a separate addendum.`
    }</p>
  </div>

  <div class="clause-block">
    <h3>${isTr ? "5. Gizlilik (NDA), Garanti ve Uyuşmazlık Çözümü" : "5. Confidentiality, Warranty & Mediation"}</h3>
    <p>${
      isTr
        ? `Ticari sırlar ${ndaYears} yıl gizlidir. Kritik hatalar ${warrantyDays} gün ücretsiz giderilir. Uyuşmazlıklarda 6325 sayılı kanun gereği dava öncesi arabuluculuk zorunludur. Yetkili merci İstanbul Mahkemeleridir.`
        : `Confidentiality persists for ${ndaYears} years. Defect warranty covers ${warrantyDays} days. Mandatory mediation applies prior to litigation; jurisdiction is Istanbul.`
    }</p>
  </div>

  <div class="sha-seal">
    <div><strong>DİJİTAL SÖZLEŞME GÜVENLİK MÜHRÜ (SHA-256):</strong></div>
    <div>${sha256Fingerprint}</div>
    <div style="font-size: 7.5pt; margin-top: 2px;">${sealNoticeText}</div>
  </div>

  <div class="signature-grid">
    <div class="signature-box">
      <div><strong>İŞ SAHİBİ (MÜŞTERİ)</strong></div>
      <div style="margin-top: 4px; font-weight: 600;">${input.clientSignature?.signerName || clientName}</div>
      ${renderSignatureBlock(input.clientSignature, "İşveren İmzası")}
      <div style="font-size: 7.5pt; color: #64748b; margin-top: 6px;">
        ${
          input.clientSignature
            ? `Zaman: ${input.clientSignature.signedAt} • HMK m. 199: ${input.clientSignature.ipHash || "CERT-OK"}`
            : `Tarih: ${matchedDateFormatted}`
        }
      </div>
    </div>
    <div class="signature-box">
      <div><strong>YÜKLENİCİ (GELİŞTİRİCİ)</strong></div>
      <div style="margin-top: 4px; font-weight: 600;">${input.contractorSignature?.signerName || contractorName}</div>
      ${renderSignatureBlock(input.contractorSignature, "Yüklenici İmzası")}
      <div style="font-size: 7.5pt; color: #64748b; margin-top: 6px;">
        ${
          input.contractorSignature
            ? `Zaman: ${input.contractorSignature.signedAt} • HMK m. 199: ${input.contractorSignature.ipHash || "CERT-OK"}`
            : `Tarih: ${matchedDateFormatted}`
        }
      </div>
    </div>
  </div>
</body>
</html>`;

    // Compile synchronized bilingual parallel-column assets
    const bilingualClauses = BilingualLayoutEngine.buildBilingualClauses(input);
    const bilingualMarkdown = BilingualLayoutEngine.renderBilingualMarkdown({
      contractRef,
      listingTitle: input.listingTitle,
      generatedAtFormatted: generatedDateFormatted,
      matchedAtFormatted: matchedDateFormatted,
      prevalenceLanguage: input.prevalenceLanguage || "tr",
      sha256Fingerprint,
      clientName,
      contractorName,
      clauses: bilingualClauses,
    });
    const bilingualSha256 = BilingualLayoutEngine.calculateDeterministicSha256(bilingualMarkdown);
    const bilingualHtmlContent = BilingualLayoutEngine.renderBilingualHtml({
      contractRef,
      listingTitle: input.listingTitle,
      generatedAtFormatted: generatedDateFormatted,
      matchedAtFormatted: matchedDateFormatted,
      prevalenceLanguage: input.prevalenceLanguage || "tr",
      sha256Fingerprint: bilingualSha256,
      clientName,
      contractorName,
      clientSig: input.clientSignature,
      contractorSig: input.contractorSignature,
      clauses: bilingualClauses,
      isWhiteLabel,
    });

    const activeSha256 = isBilingual ? bilingualSha256 : sha256Fingerprint;
    const activeMarkdown = isBilingual ? bilingualMarkdown : markdown;
    const activeHtmlContent = isBilingual ? bilingualHtmlContent : htmlContent;

    return {
      contractRef,
      sha256Fingerprint: activeSha256,
      generatedAt: generatedAtDate.toISOString(),
      locale: input.locale || "tr",
      prevalenceLanguage: input.prevalenceLanguage || "tr",
      isWhiteLabel,
      markdown: activeMarkdown,
      plainText: activeMarkdown.replace(/[#*`_]/g, ""),
      htmlContent: activeHtmlContent,
      bilingualHtmlContent,
      bilingualMarkdown,
      bilingualClauses,
      isSquadContract: isSquad,
      squadTitle: input.squadTitle || null,
      squadMembers: input.squadMembers || null,
      acceptanceCriteria: hasAcceptanceCriteria ? acceptanceCriteria : null,
      inflationShield: hasInflationShield && input.inflationShield ? input.inflationShield : null,
      dpaConfig: hasDpa && input.dpaConfig ? input.dpaConfig : null,
      dpaEvaluation: hasDpa && input.dpaConfig ? DpaEngine.evaluateDpaRisk(input.dpaConfig) : null,
      safeHarborConfig: hasSafeHarbor && input.safeHarborConfig ? input.safeHarborConfig : null,
      safeHarborEvaluation:
        hasSafeHarbor && input.safeHarborConfig
          ? SafeHarborEngine.evaluateMisclassificationRisk(input.safeHarborConfig)
          : null,
      aiGovernanceConfig:
        hasAiGovernance && input.aiGovernanceConfig ? input.aiGovernanceConfig : null,
      aiGovernanceEvaluation:
        hasAiGovernance && input.aiGovernanceConfig
          ? AiGovernanceEngine.evaluateAiGovernanceRisk(input.aiGovernanceConfig)
          : null,
      softwareExportConfig:
        hasSoftwareExport && input.softwareExportConfig ? input.softwareExportConfig : null,
      softwareExportEvaluation:
        hasSoftwareExport && input.softwareExportConfig
          ? SoftwareExportEngine.evaluateExportEligibility(input.softwareExportConfig)
          : null,
      metadata: {
        fsekClauseIncluded: true,
        tbkClauseIncluded: true,
        mediationIncluded: true,
        sha256Verified: true,
        isWhiteLabel,
        isSquadContract: isSquad,
        hasAcceptanceCriteria,
        inflationShieldIncluded: hasInflationShield,
        dpaIncluded: hasDpa,
        safeHarborIncluded: hasSafeHarbor,
        aiGovernanceIncluded: hasAiGovernance,
        softwareExportIncluded: hasSoftwareExport,
        cleanCodeWarrantyIncluded: Boolean(includeCleanCode),
        fossComplianceIncluded: Boolean(includeFoss),
        nonSolicitationIncluded: Boolean(includeNonSolicitation),
        mutualReleaseIncluded: Boolean(includeMutualRelease),
        terminationLiquidationIncluded: Boolean(includeLiquidation),
      },
    };
  }
}
