import { createHash } from "crypto";
import type { ContractGeneratorInput, BilingualClausePair, ContractSignatureBlock } from "./types";
import { DEFAULT_MILESTONES } from "./generator";
import { InflationHedgingEngine } from "../finance/inflation-hedging";
import { parseBudgetAmount } from "../finance/tax-calculator";

export class BilingualLayoutEngine {
  /**
   * Deterministic SHA-256 calculation for the bilingual document
   */
  static calculateDeterministicSha256(content: string): string {
    return createHash("sha256").update(content, "utf8").digest("hex");
  }

  /**
   * Builds synchronized clause pairs across all standard articles and active addendums.
   */
  static buildBilingualClauses(input: ContractGeneratorInput): BilingualClausePair[] {
    const clauses: BilingualClausePair[] = [];
    const isWhiteLabel = Boolean(input.whiteLabel);
    const clientName = input.client.displayName || "İşveren / Client";
    const contractorName = input.contractor.displayName || "Yüklenici / Contractor";
    const cleanScope = input.scopeSummary.replace(/[\r\n]+/g, " ").trim();
    const budget = input.budgetLabel || "Karşılıklı belirlenecektir / To be mutually agreed";
    const timeline = input.timelineLabel || "Karşılıklı mutabakatla / Mutual agreement";
    const revisionLimit = input.revisionLimit ?? 2;
    const inspectionDays = input.inspectionPeriodDays ?? 7;
    const warrantyDays = input.warrantyPeriodDays ?? 30;
    const ndaYears = input.ndaYears ?? 3;
    const prevalence = input.prevalenceLanguage || "tr";

    const isSquad = Boolean(
      input.isSquadContract || (input.squadMembers && input.squadMembers.length > 0)
    );
    const squadTitle = input.squadTitle || "Çevik Yazılımcı Kolektifi / Agile Software Collective";
    const squadMembers = input.squadMembers || [];

    const selected = input.selectedContracts;
    const includeFsek = !selected || selected.includes("FSEK_IP_TRANSFER");
    const includeNda = !selected || selected.includes("BILATERAL_NDA");
    const includeDpa = Boolean(
      input.dpaConfig?.enabled && (!selected || selected.includes("KVKK_DPA"))
    );
    const includeSafeHarbor = Boolean(
      input.safeHarborConfig?.enabled && (!selected || selected.includes("SAFE_HARBOR"))
    );
    const includeAiGov = Boolean(
      input.aiGovernanceConfig?.enabled && (!selected || selected.includes("AI_GOVERNANCE"))
    );
    const includeSoftwareExport = Boolean(
      input.softwareExportConfig?.enabled && (!selected || selected.includes("SOFTWARE_EXPORT"))
    );
    const includeInflation = Boolean(
      input.inflationShield?.enabled && (!selected || selected.includes("INFLATION_SHIELD"))
    );
    const acceptanceCriteria = input.acceptanceCriteria || [];
    const hasAcceptanceCriteria = acceptanceCriteria.length > 0;

    // 0. PREAMBLE & PREVALENCE CLAUSE
    const prevalenceBadgeTr =
      prevalence === "tr" ? "Türkçe Metin Esastır" : "İngilizce Metin Esastır";
    const prevalenceBadgeEn =
      prevalence === "tr" ? "Turkish Text Prevails" : "English Text Prevails";

    clauses.push({
      id: "preamble-prevalence",
      articleNumber: "ÖN PROTOKOL / PREAMBLE",
      titleTr: "DİL, ŞEKİL VE HÜKÜM ÖNCELİĞİ (PREVALENCE RULE)",
      titleEn: "LANGUAGE, DUAL-COLUMN FORMAT & PREVALENCE CLAUSE",
      badgeTr: prevalenceBadgeTr,
      badgeEn: prevalenceBadgeEn,
      bodyTr: `İşbu Sözleşme, Türkçe ve İngilizce dillerinde çift sütunlu paralel metin (Parallel-Column) olarak tanzim edilmiştir. Her iki dil versiyonu aynı hukuki iradeyi yansıtmak üzere düzenlenmiştir. Bununla birlikte, iki metin arasında herhangi bir kelime, anlam, çeviri veya yorum uyuşmazlığı bulunması durumunda; tarafların tabi olduğu Türk Borçlar Kanunu ve yetkili İstanbul Mahkemeleri nezdinde ${
        prevalence === "tr" ? "**TÜRKÇE METİN**" : "**İNGİLİZCE METİN**"
      } esas alınacak ve nihai bağlayıcı kabul edilecektir.`,
      bodyEn: `This Agreement is executed in synchronized parallel dual-columns in both Turkish and English languages. Both language columns reflect identical mutual legal intent. However, in the event of any semantic ambiguity, translation discrepancy, or interpretive conflict between the two texts, the ${
        prevalence === "tr" ? "**TURKISH VERSION**" : "**ENGLISH VERSION**"
      } shall govern and prevail in all respects before designated courts and arbitration tribunals.`,
    });

    // 1. ARTICLE 1: PARTIES
    let squadTextTr = "";
    let squadTextEn = "";
    if (isSquad && squadMembers.length > 0) {
      squadTextTr =
        `\n\n**👥 ÇEVİK KONSORSİYUM (TBK m. 620):** Kolektif: ${squadTitle} | Lider Yüklenici: ${contractorName} (${input.contractor.email}). Ortak yükleniciler teknik ifadan ve ayıpsız teslimattan müştereken sorumludur.\n` +
        squadMembers
          .map(
            (m, i) =>
              `• ${i + 1}. ${m.displayName} (${m.roleTitle}): %${m.revenueSharePercentage} pay`
          )
          .join("\n");
      squadTextEn =
        `\n\n**👥 AGILE SQUAD CONSORTIUM (TBK Art. 620):** Collective: ${squadTitle} | Lead Contractor: ${contractorName} (${input.contractor.email}). All consortium members remain jointly bound for proper execution.\n` +
        squadMembers
          .map(
            (m, i) =>
              `• ${i + 1}. ${m.displayName} (${m.roleTitle}): ${m.revenueSharePercentage}% share`
          )
          .join("\n");
    }

    clauses.push({
      id: "article-1-parties",
      articleNumber: "MADDE 1 / ARTICLE 1",
      titleTr: "TARAFLAR VE HUKUKİ NİTELİK",
      titleEn: "PARTIES & LEGAL CAPACITY",
      bodyTr: `İşbu Sözleşme, aşağıda bilgileri kayıtlı taraflar arasında akdedilmiştir:\n1. **İŞ SAHİBİ (MÜŞTERİ):** ${clientName} (${input.client.email})\n2. **YÜKLENİCİ (FREELANCER / UZMAN):** ${contractorName} (${input.contractor.email})${squadTextTr}`,
      bodyEn: `This Agreement is entered into between the following parties:\n1. **CLIENT:** ${clientName} (${input.client.email})\n2. **CONTRACTOR (DEVELOPER / SPECIALIST):** ${contractorName} (${input.contractor.email})${squadTextEn}`,
    });

    // 2. ARTICLE 2: SCOPE & DELIVERABLES (TBK m. 470)
    clauses.push({
      id: "article-2-scope",
      articleNumber: "MADDE 2 / ARTICLE 2",
      titleTr: "SÖZLEŞMENİN KONUSU VE TEKNİK KAPSAMI (TBK m. 470)",
      titleEn: "SUBJECT MATTER & TECHNICAL SCOPE (TBK Art. 470)",
      bodyTr: `İşbu Sözleşmenin konusu; Yüklenici tarafından İş Sahibi için aşağıda teknik özellikleri belirtilen **"${input.listingTitle}"** projesine ilişkin yazılım geliştirme, tasarım ve teknoloji hizmetlerinin TBK m. 470 anlamında bağımsız bir "eser" olarak meydana getirilmesi ve teslimidir.\n- **Kategori:** ${input.category}\n- **Teknik Kapsam:** ${cleanScope}`,
      bodyEn: `The subject matter of this Agreement is the development, design, and delivery of **"${input.listingTitle}"** as an independent statutory "work" under Article 470 of the Turkish Code of Obligations (TBK).\n- **Category:** ${input.category}\n- **Agreed Technical Scope:** ${cleanScope}`,
    });

    // 3. ARTICLE 3: PRICE, TAX & MILESTONES
    const milestones =
      input.milestones && input.milestones.length > 0 ? input.milestones : DEFAULT_MILESTONES;
    const milestoneScheduleTr = milestones
      .map((m, i) => `• Aşama ${i + 1} (%${m.percentage}): ${m.titleTr} — ${m.descriptionTr}`)
      .join("\n");
    const milestoneScheduleEn = milestones
      .map((m, i) => `• Phase ${i + 1} (${m.percentage}%): ${m.titleEn} — ${m.descriptionEn}`)
      .join("\n");

    const taxClauseTr = includeSoftwareExport && input.softwareExportConfig
      ? `• **3.2.1. İhracat Rejimi:** Hizmet, GVK m. 89/13 ve KDVK m. 11/1-a uyarınca Yazılım İhracatı mahiyetindedir.\n• **3.2.2. Vergi İstisnası:** %0 KDV (İstisna Kodu: 302) uygulanır, stopaj kesintisi yapılmaz.\n• **3.2.3. Tevsik:** Şartlar ve döviz transferi EK-5 İhracat Şartnamesine tabidir.`
      : `• **3.2.1. Ödeme Şekli:** Bedel, Yüklenici IBAN hesabına havale/EFT veya SMM / e-fatura mukabilinde ödenir.\n• **3.2.2. Tevkifat (GVK m. 94):** Kurumsal işveren kanuni stopajı (%20) kesip muhtasar ile beyan eder.\n• **3.2.3. KDV:** Yasal orandaki Katma Değer Vergisi Yüklenici'ye ödenir; bireysel müşteride stopaj doğmaz.`;

    const taxClauseEn = includeSoftwareExport && input.softwareExportConfig
      ? `• **3.2.1. Export Status:** Qualifies as cross-border Software Export under GVK Art. 89/13 & KDVK Art. 11/1-a.\n• **3.2.2. Tax Exemption:** Subject to 0% VAT (Exemption Code 302) with zero statutory withholding.\n• **3.2.3. Certifications:** Governed by ANNEX-5 Software Export & Tax Exemption Addendum.`
      : `• **3.2.1. Payment:** Remitted to Contractor IBAN or against freelance invoice (SMM).\n• **3.2.2. Withholding (GVK Art. 94):** Corporate client remits statutory 20% tax withholding.\n• **3.2.3. VAT:** Applicable VAT is remitted to Contractor; individual consumers are exempt from withholding.`;

    let inflationTextTr = "";
    let inflationTextEn = "";
    if (includeInflation && input.inflationShield) {
      const parsed = parseBudgetAmount(input.budgetLabel);
      const shield = InflationHedgingEngine.generateInflationClauseText(
        input.inflationShield,
        "tr",
        parsed?.numericAmount || 0
      );
      const shieldEn = InflationHedgingEngine.generateInflationClauseText(
        input.inflationShield,
        "en",
        parsed?.numericAmount || 0
      );
      inflationTextTr = `\n\n**Enflasyon ve Kur Koruma Klozu (TBK m. 138):** ${shield.summaryTr}`;
      inflationTextEn = `\n\n**Inflation & Currency Shield (TBK Art. 138):** ${shieldEn.summaryEn}`;
    }

    const platformDisclaimerTr = isWhiteLabel
      ? "3.3. **Doğrudan İki Taraflı Ödeme:** Taraflar ödemelerin doğrudan kendi aralarında yapılacağını, üçüncü şahıslar nezdinde emanet havuzu tutulmadığını kabul eder."
      : "3.3. **Platform Sorumsuzluğu:** Operis emanet havuzu tutmaz, ödeme garantörü değildir.";

    const platformDisclaimerEn = isWhiteLabel
      ? "3.3. **Direct Bilateral Remittance:** Parties agree that payments are settled directly between parties without third-party escrow or custody."
      : "3.3. **Platform Disclaimer:** Operis does not hold escrow and provides no financial payment guarantee.";

    clauses.push({
      id: "article-3-price",
      articleNumber: "MADDE 3 / ARTICLE 3",
      titleTr: "PROJE BEDELİ, VERGİ VE KİLOMETRE TAŞLARI",
      titleEn: "PROJECT FEE, TAX REGIME & MILESTONE SCHEDULE",
      bodyTr: `3.1. **Kararlaştırılan Bedel:** ${budget}\n3.2. **Faturalandırma ve Vergi Rejimi:**\n${taxClauseTr}\n${platformDisclaimerTr}\n3.4. **Hakediş Takvimi:**\n${milestoneScheduleTr}${inflationTextTr}`,
      bodyEn: `3.1. **Agreed Fee:** ${budget}\n3.2. **Invoicing & Tax Regime:**\n${taxClauseEn}\n${platformDisclaimerEn}\n3.4. **Milestone Schedule:**\n${milestoneScheduleEn}${inflationTextEn}`,
    });

    // 4. ARTICLE 4: DELIVERY & ACCEPTANCE (TBK m. 474)
    clauses.push({
      id: "article-4-delivery",
      articleNumber: "MADDE 4 / ARTICLE 4",
      titleTr: "TESLİMAT, KABUL MUAYENESİ VE SÜRE HESABI (TBK m. 474)",
      titleEn: "DELIVERY, INSPECTION & TIME COMPUTATION (TBK Art. 474)",
      bodyTr: `4.1. **Teslim Süresi:** ${timeline}\n4.2. **Muayene ve Kabul:** İş Sahibi teslimatı takip eden ${inspectionDays} (yedi) iş günü içinde incelemekle yükümlüdür. Bu sürede yazılı itiraz yapılmazsa eser zımnen eksiksiz kabul edilmiş sayılır.\n4.3. **Revizyon Sınırı:** Azami ${revisionLimit} tur revizyon hakkı bulunmaktadır; kapsam dışı talepler ayrı hakedişe tabidir.\n4.4. **Sürelerin Hesabı:** "İş günü" resmi tatil ve hafta sonlarını hariç tutar; "takvim günü" kesintisiz işler.`,
      bodyEn: `4.1. **Delivery Timeline:** ${timeline}\n4.2. **Inspection & Acceptance:** The Client shall inspect deliverables within ${inspectionDays} business days. Failure to object in writing constitutes formal deemed acceptance.\n4.3. **Revision Cap:** Maximum ${revisionLimit} rounds of revisions are included; out-of-scope requests require separate compensation.\n4.4. **Computation of Time:** "Business days" exclude holidays and weekends; "calendar days" run continuously.`,
    });

    // 5. ARTICLE 5: INTELLECTUAL PROPERTY RIGHTS (FSEK m. 48-52)
    const fsekTextTr = includeFsek
      ? `Yüklenici; meydana getirilen yazılım, kaynak kodları ve tasarımlar üzerindeki 5846 sayılı FSEK m. 21 (İşleme), m. 22 (Çoğaltma), m. 23 (Yayma), m. 24 (Temsil) ve m. 25 (Umuma İletim) mali haklarını, kararlaştırılan hakedişin tam ödenmesi koşuluyla, münhasıran ve geri dönülemez şekilde İş Sahibi'ne devretmeyi kabul ve taahhüt eder. Manevi haklar saklıdır; Yüklenici portfolyo referansı gösterme hakkını korur.`
      : `Taraflar bu projede genel telif mevzuatı hükümlerinin uygulanmasını kararlaştırmıştır.`;
    const fsekTextEn = includeFsek
      ? `Subject to full payment of the agreed fee, the Contractor irrevocably assigns to the Client all statutory economic rights under FSEK Articles 21 (Processing), 22 (Reproduction), 23 (Distribution), 24 (Representation), and 25 (Public Transmission). Moral rights remain reserved; Contractor retains portfolio showcase rights.`
      : `Parties agree to standard statutory intellectual property provisions.`;

    clauses.push({
      id: "article-5-ip-transfer",
      articleNumber: "MADDE 5 / ARTICLE 5",
      titleTr: "FİKRİ MÜLKİYET VE MALİ HAKLARIN DEVRİ (FSEK m. 48-52)",
      titleEn: "INTELLECTUAL PROPERTY & ECONOMIC RIGHTS TRANSFER (FSEK Art. 48-52)",
      bodyTr: fsekTextTr,
      bodyEn: fsekTextEn,
    });

    // 6. ARTICLE 6: CONFIDENTIALITY & DATA PROTECTION (NDA & KVKK)
    const ndaTextTr = includeNda
      ? `Taraflar edindikleri tüm kaynak kodları, ticari sırlar ve teknik verileri kesin bir gizlilikle koruyacak olup bu yükümlülük sözleşmenin sona ermesinden itibaren ${ndaYears} yıl boyunca yürürlükte kalacaktır.`
      : `Taraflar dürüstlük kuralı çerçevesinde edindikleri gizli bilgileri korumayı taahhüt eder.`;
    const ndaTextEn = includeNda
      ? `Both parties agree to hold all source codes, trade secrets, and technical data in strict confidence for a period of ${ndaYears} years following completion.`
      : `Parties undertake to safeguard mutual confidential business information in good faith.`;

    clauses.push({
      id: "article-6-nda",
      articleNumber: "MADDE 6 / ARTICLE 6",
      titleTr: "GİZLİLİK VE TİCARİ SIRLARIN KORUNMASI (NDA)",
      titleEn: "CONFIDENTIALITY & TRADE SECRETS (NDA)",
      bodyTr: ndaTextTr,
      bodyEn: ndaTextEn,
    });

    // 7. ARTICLE 7: WARRANTY & DEFECT LIABILITY
    clauses.push({
      id: "article-7-warranty",
      articleNumber: "MADDE 7 / ARTICLE 7",
      titleTr: "AYIP GARANTİSİ VE TEKNİK DESTEK (TBK m. 477/2)",
      titleEn: "DEFECT WARRANTY & REMEDIATION (TBK Art. 477/2)",
      bodyTr: `7.1. **Garanti Süresi:** Yüklenici, nihai teslimatı takip eden ${warrantyDays} (otuz) takvim günü boyunca eserin teknik gereksinimlere uygunluğunu garanti eder.\n7.2. **Müdahale Süresi:** Bu sürede ortaya çıkan kritik hatalar azami 3 iş günü içinde ek bedelsiz düzeltilir. Ağır kusur ve hileli ayıplara karşı haklar süresiz saklıdır.`,
      bodyEn: `7.1. **Warranty Period:** The Contractor warrants conformity with specifications for ${warrantyDays} calendar days following final handover.\n7.2. **Remediation Window:** Critical bugs shall be rectified without extra charge within 3 business days. Concealed defects remain covered under TBK Art. 477/2.`,
    });

    // 8. ARTICLE 8: INDEPENDENT CONTRACTOR SAFE HARBOR
    clauses.push({
      id: "article-8-safe-harbor",
      articleNumber: "MADDE 8 / ARTICLE 8",
      titleTr: "BAĞIMSIZ YÜKLENİCİ STATÜSÜ (İŞ KANUNU m. 8)",
      titleEn: "INDEPENDENT CONTRACTOR STATUS (LABOR ACT Art. 8)",
      bodyTr: `Taraflar arasında 4857 sayılı İş Kanunu anlamında herhangi bir işçi-işveren, hizmet akdi veya vekalet bağı kurulmamıştır. Yüklenici bağımsız statüde olup kendi vergi ve SGK yükümlülüklerinden bizzat sorumludur.`,
      bodyEn: `No employer-employee, agency, or partnership relationship is created under Labor Act No. 4857. The Contractor operates autonomously and remains solely responsible for their own tax and social security filings.`,
    });

    // 9. ARTICLE 9: SAFE HARBOR & EXEMPTION
    clauses.push({
      id: "article-9-platform-exemption",
      articleNumber: "MADDE 9 / ARTICLE 9",
      titleTr: isWhiteLabel
        ? "TEKNOLOJİ VE ALTYAPI SAĞLAYICISININ HUKUKİ SORUMSUZLUĞU (TBK m. 26/115 & 5651)"
        : "OPERİS PLATFORMUNUN HUKUKİ SORUMSUZLUĞU (TBK m. 26/115 & 5651)",
      titleEn: isWhiteLabel
        ? "INFRASTRUCTURE PROVIDER EXEMPTION & SAFE HARBOR (TBK Art. 26/115 & 5651)"
        : "OPERIS PLATFORM EXEMPTION & SAFE HARBOR (TBK Art. 26/115 & 5651)",
      bodyTr: isWhiteLabel
        ? `İşbu Sözleşme münhasıran İş Sahibi ile Yüklenici arasında akdedilmiştir. Kullanılan dijital sözleşme şablonu ve teknoloji altyapısı sağlayıcıları bağımsız bir yer sağlayıcı olup sözleşmenin tarafı, garantörü veya vekili değildir. Her türlü uyuşmazlık doğrudan taraflar arasında çözülür; taraflar teknoloji altyapısı aleyhine dava ve takip haklarından feragat eder (HMK m. 193 / TBK m. 115).`
        : `İşbu Sözleşme münhasıran İş Sahibi ile Yüklenici arasında akdedilmiştir. Operis bağımsız bir yer sağlayıcıdır; sözleşmenin tarafı, garantörü, vekili veya hakemi değildir. Her türlü uyuşmazlık doğrudan taraflar arasında çözülür; taraflar Operis aleyhine dava ve icra takibi haklarından peşinen feragat eder (HMK m. 193).`,
      bodyEn: isWhiteLabel
        ? `This Agreement is executed exclusively between Client and Contractor. Any software infrastructure or template provider is an independent hosting intermediary and is not a party, guarantor, or arbiter. Any dispute shall be resolved solely between the parties; parties irrevocably waive all claims against the infrastructure provider (HMK Art. 193 / TBK Art. 115).`
        : `This Agreement is executed exclusively between Client and Contractor. Operis is an independent hosting intermediary and is not a party, guarantor, or arbiter. Any dispute shall be resolved solely between the parties; parties irrevocably waive all claims against Operis (HMK Art. 193).`,
    });

    // 10. ARTICLE 10: DISPUTE RESOLUTION & ARBITRATION
    clauses.push({
      id: "article-10-dispute-resolution",
      articleNumber: "MADDE 10 / ARTICLE 10",
      titleTr: "ARABULUCULUK, TAHKİM VE UYUŞMAZLIK ÇÖZÜMÜ",
      titleEn: "MANDATORY MEDIATION, ISTAC ARBITRATION & JURISDICTION",
      bodyTr: `10.1. **Zorunlu Arabuluculuk:** Taraflar dava açmadan önce 6325 sayılı Kanun uyarınca zorunlu arabuluculuğa başvurmayı taahhüt eder.\n10.2. **Tahkim ve Mahkeme:** Çözülemeyen ihtilaflarda tarafların mutabakatıyla ISTAC Hızlı Tahkim Kuralları (tek hakem) veya İstanbul (Çağlayan) Mahkemeleri yetkilidir.\n10.3. **Münhasır Delil (HMK m. 193):** Dijital kayıtlar, e-postalar, Git commit kayıtları ve SHA-256 mühürleri kesin delildir.`,
      bodyEn: `10.1. **Mandatory Mediation:** Parties submit to mandatory mediation under Law No. 6325 before filing legal claims.\n10.2. **Arbitration & Courts:** Unresolved disputes shall be resolved by ISTAC Fast-Track Arbitration (sole arbitrator) or exclusively before Istanbul (Caglayan) Courts.\n10.3. **Statutory Evidence (HMK Art. 193):** Digital logs, emails, Git commit records, and SHA-256 seals constitute conclusive evidence.`,
    });

    // ADDENDUMS & SPECIAL ANNEXES
    if (hasAcceptanceCriteria) {
      clauses.push({
        id: "annex-1-acceptance",
        articleNumber: "EK-1 / ANNEX-1",
        titleTr: "OBJEKTİF KABUL KRİTERLERİ & DEFINITION OF DONE",
        titleEn: "OBJECTIVE ACCEPTANCE CRITERIA & DEFINITION OF DONE",
        bodyTr: acceptanceCriteria
          .map((c, i) => `${i + 1}. [${c.category}] ${c.humanCriterionTr}`)
          .join("\n"),
        bodyEn: acceptanceCriteria
          .map((c, i) => `${i + 1}. [${c.category}] ${c.humanCriterionEn}`)
          .join("\n"),
      });
    }

    if (includeDpa && input.dpaConfig) {
      clauses.push({
        id: "annex-2-dpa",
        articleNumber: "EK-2 / ANNEX-2",
        titleTr: "VERİ İŞLEME VE BİLGİ GÜVENLİĞİ PROTOKOLÜ (KVKK m. 12)",
        titleEn: "DATA PROCESSING ADDENDUM (KVKK Art. 12 & GDPR Art. 28)",
        bodyTr: `Veri işleyen sıfatıyla Yüklenici; kişisel verileri yalnızca sözleşme amaçlarıyla sınırlı işleyecek, KVKK m. 12 ve ISO 27001 güvenlik önlemlerini alacak ve sözleşme bitiminde tüm verileri imha edecektir.`,
        bodyEn: `As data processor, Contractor shall process personal data solely for agreed scope, maintain KVKK Art. 12 / ISO 27001 safeguards, and delete all personal data upon project termination.`,
      });
    }

    if (includeSafeHarbor && input.safeHarborConfig) {
      clauses.push({
        id: "annex-3-safe-harbor",
        articleNumber: "EK-3 / ANNEX-3",
        titleTr: "BAĞIMSIZ YÜKLENİCİ STATÜSÜ PROTOKOLÜ",
        titleEn: "INDEPENDENT CONTRACTOR CLASSIFICATION PROTOCOL",
        bodyTr: `Yüklenici çalışma yerini ve saatlerini kendisi belirler; iş araçlarını bizzat temin eder ve serbest meslek erbabı olarak bağımsız faaliyet gösterir.`,
        bodyEn: `Contractor retains sole control over working hours and location, utilizes own equipment, and provides technology services as an autonomous entity.`,
      });
    }

    if (includeAiGov && input.aiGovernanceConfig) {
      clauses.push({
        id: "annex-4-ai-gov",
        articleNumber: "EK-4 / ANNEX-4",
        titleTr: "YAPAY ZEKA YÖNETİŞİMİ VE LİSANS SAFLIĞI ŞARTNAMESİ",
        titleEn: "AI GOVERNANCE & LICENSE PURITY SPECIFICATION",
        bodyTr: `Yüklenici; kullanılan yapay zeka araçlarının kaynak kodları umumi havuzda saklamadığını (Zero Data Retention), insani fikri katkının (Human-in-the-Loop) sağlandığını ve copyleft bulaşmasının olmadığını taahhüt eder.`,
        bodyEn: `Contractor warrants that all AI tooling adheres to Zero Data Retention, preserves human-in-the-loop statutory copyright eligibility, and prevents copyleft contamination.`,
      });
    }

    if (includeSoftwareExport && input.softwareExportConfig) {
      clauses.push({
        id: "annex-5-software-export",
        articleNumber: "EK-5 / ANNEX-5",
        titleTr: "YAZILIM İHRACATI VE VERGİ İSTİSNASI ŞARTNAMESİ",
        titleEn: "CROSS-BORDER SOFTWARE EXPORT & TAX RELIEF PROTOCOL",
        bodyTr: `Hizmet; 193 sayılı GVK m. 89/13 ve KDVK m. 11/1-a gereğince yurt dışı faydalanmalı hizmet ihracatı olup bedelin Türkiye'ye döviz transferi/SWIFT ile getirildiğinin tevsiki Yüklenici'ye aittir.`,
        bodyEn: `Service qualifies as software export under GVK Art. 89/13 and KDVK Art. 11/1-a, subject to documentary proof of foreign currency repatriation to a Turkish banking entity.`,
      });
    }

    if (input.cleanCodeConfig) {
      clauses.push({
        id: "annex-6-clean-code",
        articleNumber: "EK-6 / ANNEX-6",
        titleTr: "TEMİZ KOD VE SİBER GÜVENLİK TAAHHÜTNAMESİ (TCK m. 243-245)",
        titleEn: "CLEAN CODE & NO-BACKDOOR WARRANTY (PENAL CODE Art. 243-245)",
        bodyTr: `Yüklenici teslim edilen kaynak kodlarda gizli arka kapı, yetkisiz erişim mekanizması veya kötü amaçlı kod bulunmadığını taahhüt eder.`,
        bodyEn: `Contractor explicitly warrants that delivered repository contains zero backdoors, undisclosed logic bombs, or malicious routines.`,
      });
    }

    if (input.fossConfig) {
      clauses.push({
        id: "annex-7-foss",
        articleNumber: "EK-7 / ANNEX-7",
        titleTr: "AÇIK KAYNAK LİSANS SAFLIĞI VE COPYLEFT BULAŞMAMA ŞARTNAMESİ",
        titleEn: "FOSS LICENSE PURITY & CONTAMINATION SHIELD",
        bodyTr: `Yüklenici teslim edilen kodun münhasır mülkiyeti ihlal edecek veya tescilli kodu kamusallaştıracak (GPL/AGPL viral) lisans içermediğini garanti eder.`,
        bodyEn: `Contractor warrants delivered code does not breach third-party open source licenses and triggers no viral copyleft contamination on proprietary assets.`,
      });
    }

    if (input.nonSolicitationConfig) {
      clauses.push({
        id: "annex-8-non-solicitation",
        articleNumber: "EK-8 / ANNEX-8",
        titleTr: "MÜŞTERİ VE PERSONEL AYARTMAMA PROTOKOLÜ (TTK m. 55)",
        titleEn: "NON-SOLICITATION & PLATFORM INTEGRITY PROTOCOL",
        bodyTr: `Taraflar sözleşme süresince ve bitiminden itibaren ${input.nonSolicitationConfig.durationMonths || 12} ay boyunca birbirlerinin çalışanlarını veya müşterilerini ayartmamayı kabul eder.`,
        bodyEn: `Parties agree not to solicit employees or direct clients of each other for ${input.nonSolicitationConfig.durationMonths || 12} months post completion.`,
      });
    }

    return clauses;
  }

  /**
   * Generates the executive-grade synchronized parallel-column HTML layout.
   */
  static renderBilingualHtml(params: {
    contractRef: string;
    listingTitle: string;
    generatedAtFormatted: string;
    matchedAtFormatted: string;
    prevalenceLanguage: "tr" | "en";
    sha256Fingerprint: string;
    clientName: string;
    contractorName: string;
    clientSig?: ContractSignatureBlock | null;
    contractorSig?: ContractSignatureBlock | null;
    clauses: BilingualClausePair[];
    isWhiteLabel?: boolean;
  }): string {
    const {
      contractRef,
      listingTitle,
      generatedAtFormatted,
      matchedAtFormatted,
      prevalenceLanguage,
      sha256Fingerprint,
      clientName,
      contractorName,
      clientSig,
      contractorSig,
      clauses,
      isWhiteLabel,
    } = params;

    const prevalenceNoticeTr =
      prevalenceLanguage === "tr"
        ? "Resmi Hüküm Önceliği: TÜRKÇE METİN (TBK / Türk Hukuku)"
        : "Official Prevalence: ENGLISH VERSION (International Standard)";
    const prevalenceNoticeEn =
      prevalenceLanguage === "tr"
        ? "Prevalence: TURKISH VERSION (Governing under TBK)"
        : "Prevalence: ENGLISH VERSION (Governing under Arbitration)";

    return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${contractRef} - ${listingTitle} (Bilingual Parallel Contract)</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 12mm 16mm 12mm;
      @bottom-right {
        content: counter(page) " / " counter(pages);
        font-size: 8pt;
        color: #64748b;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
    }
    *, *:before, *:after { box-sizing: border-box; }
    body {
      font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 9pt;
      line-height: 1.5;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 16px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header {
      border-bottom: 2px solid #2563eb;
      padding-bottom: 10px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand-title {
      font-size: 16pt;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .brand-sub {
      font-size: 7.5pt;
      color: #475569;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }
    .meta-box {
      font-size: 8pt;
      color: #475569;
      text-align: right;
      line-height: 1.4;
    }
    .prevalence-banner {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #2563eb;
      border-radius: 4px;
      padding: 6px 12px;
      margin-bottom: 16px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      font-size: 8pt;
      font-weight: 700;
      color: #1e293b;
    }
    .document-title-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 14px;
      padding-bottom: 8px;
      border-bottom: 1px solid #cbd5e1;
    }
    .doc-col-title {
      font-size: 11pt;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.3;
    }
    .doc-col-sub {
      font-size: 7.5pt;
      color: #64748b;
      margin-top: 3px;
    }
    /* SYNCHRONIZED CLAUSE ROW GRID */
    .bilingual-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      padding: 10px 0;
      border-bottom: 1px solid #e2e8f0;
      page-break-inside: avoid;
      break-inside: avoid;
      align-items: stretch;
    }
    .col-tr {
      border-right: 1px solid #e2e8f0;
      padding-right: 14px;
      text-align: justify;
    }
    .col-en {
      padding-left: 6px;
      color: #334155;
      text-align: justify;
    }
    .clause-number {
      font-size: 7.5pt;
      font-weight: 700;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .clause-title {
      font-size: 9.5pt;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 6px;
      line-height: 1.3;
      break-after: avoid-page;
      page-break-after: avoid;
    }
    .clause-body {
      font-size: 8.5pt;
      line-height: 1.5;
      white-space: pre-line;
      orphans: 3;
      widows: 3;
    }
    .clause-badge {
      display: inline-block;
      font-size: 7pt;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 3px;
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      margin-bottom: 6px;
    }
    /* SIGNATURE BLOCKS */
    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 24px;
      padding-top: 14px;
      border-top: 2px solid #0f172a;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .sig-card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 14px;
      font-size: 8pt;
    }
    .sig-role {
      font-size: 7.5pt;
      font-weight: 800;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .sig-name {
      font-size: 9.5pt;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .sig-stamp {
      font-family: monospace;
      font-size: 7.5pt;
      color: #059669;
      margin-top: 4px;
    }
    .footer-seal {
      margin-top: 20px;
      background: #f1f5f9;
      border: 1px dashed #94a3b8;
      border-radius: 4px;
      padding: 8px 12px;
      font-family: monospace;
      font-size: 7.5pt;
      color: #475569;
      word-break: break-all;
      display: flex;
      justify-content: space-between;
      align-items: center;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
      .clause-title, .clause-number, .brand-title, .doc-col-title {
        break-after: avoid-page !important;
        page-break-after: avoid !important;
      }
      .bilingual-row, .signature-grid, .footer-seal, .meta-box, .sig-card {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand-title">${isWhiteLabel ? "CONTRACT & ACCORD" : "OPERIS"}</div>
      <div class="brand-sub">${
        isWhiteLabel
          ? "Bilingual Parallel-Column Agreement • Çift Dilli Paralel Hizmet Sözleşmesi"
          : "Bilingual Parallel-Column Legal Infrastructure • Çift Dilli Paralel Sözleşme"
      }</div>
    </div>
    <div class="meta-box">
      <div><strong>Ref:</strong> ${contractRef}</div>
      <div><strong>Tarih / Date:</strong> ${matchedAtFormatted}</div>
      <div><strong>Statü:</strong> Hukuken Bağlayıcı / Legally Binding</div>
    </div>
  </div>

  <div class="prevalence-banner">
    <div>⚖️ ${prevalenceNoticeTr}</div>
    <div>⚖️ ${prevalenceNoticeEn}</div>
  </div>

  <div class="document-title-row">
    <div>
      <div class="doc-col-title">BAĞIMSIZ YAZILIM VE TEKNOLOJİ HİZMET SÖZLEŞMESİ</div>
      <div class="doc-col-sub">6098 sayılı TBK m. 470 (Eser Sözleşmesi) ve 5846 sayılı FSEK m. 52 Uyarınca</div>
    </div>
    <div>
      <div class="doc-col-title">INDEPENDENT SOFTWARE & TECHNOLOGY SERVICES AGREEMENT</div>
      <div class="doc-col-sub">Statutory Contract for Work pursuant to TBK Art. 470 and FSEK Art. 52</div>
    </div>
  </div>

  <!-- CLAUSES ACCORDION -->
  ${clauses
    .map((c) => {
      const badgeTr = c.badgeTr ? `<span class="clause-badge">${c.badgeTr}</span><br>` : "";
      const badgeEn = c.badgeEn ? `<span class="clause-badge">${c.badgeEn}</span><br>` : "";
      return `
  <div class="bilingual-row" id="${c.id}">
    <div class="col-tr">
      ${c.articleNumber ? `<div class="clause-number">${c.articleNumber}</div>` : ""}
      <div class="clause-title">${c.titleTr}</div>
      ${badgeTr}
      <div class="clause-body">${c.bodyTr}</div>
    </div>
    <div class="col-en">
      ${c.articleNumber ? `<div class="clause-number">${c.articleNumber}</div>` : ""}
      <div class="clause-title">${c.titleEn}</div>
      ${badgeEn}
      <div class="clause-body">${c.bodyEn}</div>
    </div>
  </div>`;
    })
    .join("")}

  <!-- SIGNATURES -->
  <div class="signature-grid">
    <div class="sig-card">
      <div class="sig-role">İŞ SAHİBİ / CLIENT</div>
      <div class="sig-name">${clientName}</div>
      ${
        clientSig
          ? `<div class="sig-stamp">✅ E-İmzalandı: ${clientSig.signerName}</div><div class="sig-stamp">Tarih: ${clientSig.signedAt}</div><div class="sig-stamp">HMK 199: ${clientSig.ipHash || "HMK-199-VERIFIED"}</div>`
          : `<div>İmza / Kaşe: ____________________</div><div>Tarih: ${matchedAtFormatted}</div>`
      }
    </div>
    <div class="sig-card">
      <div class="sig-role">YÜKLENİCİ / CONTRACTOR</div>
      <div class="sig-name">${contractorName}</div>
      ${
        contractorSig
          ? `<div class="sig-stamp">✅ E-İmzalandı: ${contractorSig.signerName}</div><div class="sig-stamp">Tarih: ${contractorSig.signedAt}</div><div class="sig-stamp">HMK 199: ${contractorSig.ipHash || "HMK-199-VERIFIED"}</div>`
          : `<div>İmza / Kaşe: ____________________</div><div>Tarih: ${matchedAtFormatted}</div>`
      }
    </div>
  </div>

  <div class="footer-seal">
    <div>🔒 HMK m. 199 E-Mühür SHA-256: <strong>${sha256Fingerprint}</strong></div>
    <div>${isWhiteLabel ? "Cryptographically Verified" : "Operis Verified"} • ${generatedAtFormatted}</div>
  </div>
</body>
</html>`;
  }

  /**
   * Generates paired bilingual Markdown representation.
   */
  static renderBilingualMarkdown(params: {
    contractRef: string;
    listingTitle: string;
    generatedAtFormatted: string;
    matchedAtFormatted: string;
    prevalenceLanguage: "tr" | "en";
    sha256Fingerprint: string;
    clientName: string;
    contractorName: string;
    clauses: BilingualClausePair[];
  }): string {
    const {
      contractRef,
      listingTitle,
      generatedAtFormatted,
      matchedAtFormatted,
      prevalenceLanguage,
      sha256Fingerprint,
      clientName,
      contractorName,
      clauses,
    } = params;

    const prevalenceHeader =
      prevalenceLanguage === "tr"
        ? "> ⚖️ **HÜKÜM ÖNCELİĞİ:** Anlam veya yorum çelişkisi halinde **TÜRKÇE METİN** esas alınacaktır (TBK m. 470).  \n> ⚖️ **PREVALENCE:** In case of discrepancy, the **TURKISH VERSION** shall prevail."
        : "> ⚖️ **HÜKÜM ÖNCELİĞİ:** Anlam veya yorum çelişkisi halinde **İNGİLİZCE METİN** esas alınacaktır.  \n> ⚖️ **PREVALENCE:** In case of discrepancy, the **ENGLISH VERSION** shall prevail.";

    const mdRows = clauses.map((c) => {
      const cleanTr = c.bodyTr.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
      const cleanEn = c.bodyEn.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
      return `### ${c.articleNumber || ""}: ${c.titleTr} / ${c.titleEn}\n\n| SOL SÜTUN (TÜRKÇE - RESMİ METİN) | SAĞ SÜTUN (ENGLISH - OFFICIAL TRANSLATION) |\n| :--- | :--- |\n| **${c.titleTr}**<br><br>${cleanTr} | **${c.titleEn}**<br><br>${cleanEn} |\n`;
    });

    return `# BAĞIMSIZ YAZILIM VE TEKNOLOJİ HİZMET SÖZLEŞMESİ (BILINGUAL PARALLEL-COLUMN)
**Proje / Project:** ${listingTitle}  
**Referans / Reference:** \`${contractRef}\`  
**Tanzim Tarihi / Execution Date:** ${matchedAtFormatted}  
**Dijital Zaman Damgası / Timestamp:** ${generatedAtFormatted}  

${prevalenceHeader}

---

${mdRows.join("\n---\n\n")}

---

| İŞ SAHİBİ (CLIENT) | YÜKLENİCİ (CONTRACTOR) |
| :--- | :--- |
| **İsim / Name:** ${clientName} | **İsim / Name:** ${contractorName} |
| **İmza / Signature:** ____________________ | **İmza / Signature:** ____________________ |
| **Tarih / Date:** ${matchedAtFormatted} | **Tarih / Date:** ${matchedAtFormatted} |

---
**HMK m. 199 Dijital Parmak İzi (SHA-256):** \`${sha256Fingerprint}\`
`;
  }
}
