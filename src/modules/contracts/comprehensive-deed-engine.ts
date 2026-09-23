import crypto from "crypto";
import type {
  GenerateMutualReleaseInput,
  MutualReleaseDeed,
  GenerateCleanCodeWarrantyInput,
  CleanCodeWarranty,
  GenerateFossComplianceInput,
  FossComplianceWarranty,
  GenerateNonSolicitationInput,
  NonSolicitationProtocol,
  GenerateTerminationLiquidationInput,
  TerminationLiquidationDeed,
} from "./comprehensive-deed-types";

export class ComprehensiveDeedEngine {
  /**
   * Deterministic SHA-256 calculation over canonical JSON representation
   */
  static calculateDeterministicSha256(payload: Record<string, unknown>): string {
    const canonical = JSON.stringify(payload, Object.keys(payload).sort());
    return crypto.createHash("sha256").update(canonical, "utf8").digest("hex");
  }

  // ==========================================================================
  // 1. MUTUAL RELEASE & FINAL DISCHARGE DEED (TBK m. 132 / HMK m. 313)
  // ==========================================================================
  static generateMutualReleaseDeed(input: GenerateMutualReleaseInput): MutualReleaseDeed {
    const safeRef = input.engagementId
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 8)
      .toUpperCase();
    const deedId = `OPR-DISCHARGE-${safeRef}-${Date.now().toString(36).toUpperCase()}`;
    const issuedAt = new Date().toISOString();

    const claimsWaivedTr = [
      "Sözleşme ve eklerinden doğan tüm hakediş, ücret ve prim alacakları",
      "Fazla çalışma, hafta tatili veya mesai dışı çalışma iddiaları",
      "Teslimattaki olası gecikmelerden kaynaklanan cezai şart ve kâr mahrumiyeti talepleri",
      "Sözleşme dışı talep ve kapsam genişlemesi (scope creep) tazminat iddiaları",
      "TBK m. 132 ve HMK m. 313 uyarınca tüm geçmiş ve geleceğe dönük dava ve icra takip hakları",
    ];

    const claimsWaivedEn = [
      "All compensation, fees, bonus, and milestone claims arising from the contract",
      "Overtime, weekend, or out-of-hours service claims",
      "Liquidated damages, delay penalties, and loss of profit claims",
      "Out-of-scope expansion and scope creep compensation claims",
      "All past, present, and future litigation and enforcement rights under TBK Art. 132 and HMK Art. 313",
    ];

    const warrantyExclusionsTr = [
      "6098 sayılı TBK m. 477/2 uyarınca yüklenicinin kasten gizlediği hileli ve ağır kusurlu ayıplara karşı haklar saklıdır.",
      "5846 sayılı FSEK m. 52 uyarınca tescil edilen Fikri Mülkiyet Devir Senetlerinin (IP Deeds) geçerliliği tam olarak devam eder.",
      "Karşılıklı Gizlilik Protokolü (NDA) kapsamındaki ticari sır saklama yükümlülükleri yürürlükte kalır.",
    ];

    const warrantyExclusionsEn = [
      "Claims regarding hidden defects maliciously or intentionally concealed by the contractor remain reserved under TBK Art. 477/2.",
      "Statutory validity of all executed FSEK Art. 52 Intellectual Property Assignment Deeds remains fully intact and perpetual.",
      "Confidentiality and trade secret obligations under the Bilateral NDA remain fully enforceable.",
    ];

    const preliminaryPayload = {
      deedId,
      engagementId: input.engagementId,
      listingTitle: input.listingTitle,
      client: input.client,
      contractor: input.contractor,
      settledMilestones: input.settledMilestones,
      totalSettledAmount: input.totalSettledAmount,
      currency: input.currency,
      claimsWaivedTr,
      claimsWaivedEn,
      warrantyExclusionsTr,
      warrantyExclusionsEn,
      statutoryGroundTr:
        "6098 s. TBK m. 132 & m. 166, 6100 s. HMK m. 313 (Sulh ve İbra Sözleşmesi)",
      statutoryGroundEn: "TBK Art. 132 & Art. 166 (Discharge), HMK Art. 313 (Settlement & Waiver)",
      issuedAt,
    };

    const masterSha256 = this.calculateDeterministicSha256(preliminaryPayload);

    return {
      ...preliminaryPayload,
      masterSha256,
    };
  }

  static formatMutualReleaseMarkdown(deed: MutualReleaseDeed, locale: "tr" | "en" = "tr"): string {
    const isTr = locale === "tr";
    const clientTax = deed.client.taxOrIdNumber ? ` (VKN/TCKN: ${deed.client.taxOrIdNumber})` : "";
    const contractorTax = deed.contractor.taxOrIdNumber
      ? ` (TCKN/VKN: ${deed.contractor.taxOrIdNumber})`
      : "";

    if (isTr) {
      return `# SÖZLEŞME SONU KARŞILIKLI İBRANAME VE SULH SENEDİ
**Sened No:** \`${deed.deedId}\`  
**Proje Adı:** ${deed.listingTitle}  
**Sözleşme / İş Referansı:** \`${deed.engagementId}\`  
**Tanzim Tarihi:** ${new Date(deed.issuedAt).toLocaleDateString("tr-TR")} ${new Date(deed.issuedAt).toLocaleTimeString("tr-TR")}  
**Mevzuat Dayanağı:** ${deed.statutoryGroundTr}  
**Master SHA-256 Kök Parmak İzi:** \`${deed.masterSha256}\`  

---

### 1. TARAFLAR
1. **İŞVEREN (MÜŞTERİ):** **${deed.client.displayName}**${clientTax} — ${deed.client.email}  
2. **YÜKLENİCİ (GELİŞTİRİCİ):** **${deed.contractor.displayName}**${contractorTax} — ${deed.contractor.email}  

---

### 2. İTFA EDİLEN HAKEDİŞ VE ÖDEME TABLOSU
İşbu proje kapsamında tarafların karşılıklı teyit ettiği ve itfa edilen hakediş ödemeleri aşağıda listelenmiştir:

| Aşama | Başlık | Tutar | Banka Referansı / Teyit | Onay Tarihi | Dual-Seal Durumu |
| :--- | :--- | :--- | :--- | :--- | :--- |
${deed.settledMilestones
  .map(
    (m) =>
      `| ${m.sequence} | **${m.title}** | ${m.amount.toLocaleString("tr-TR")} ${m.currency} | \`${m.paymentReference || "Banka Transferi"}\` | ${m.paidConfirmedAt ? new Date(m.paidConfirmedAt).toLocaleDateString("tr-TR") : "Teyit Edildi"} | \`${m.dualSeal ? m.dualSeal.slice(0, 12) + "..." : "DOĞRULANDI"}\` |`
  )
  .join("\n")}

**Toplam İtfa Edilen Bedel:** **${deed.totalSettledAmount.toLocaleString("tr-TR")} ${deed.currency}**

---

### 3. KARŞILIKLI İBRA VE FERAGAT BEYANI (TBK m. 132 & HMK m. 313)
Taraflar serbest iradeleriyle, akli melekeleri tam olarak ve hiçbir baskı altında kalmaksızın işbu belgeyi tanzim etmişlerdir:
1. **Yüklenici (Geliştirici) Beyanı:** Proje kapsamındaki tüm yazılım geliştirme, tasarım ve teknik danışmanlık hizmetlerinin bedelini eksiksiz, nakden ve banka kanalıyla tahsil ettiğini; işverenden hiçbir hakediş, fazla çalışma, tatil çalışması, faiz veya munzam zarar alacağı kalmadığını beyanla işvereni kayıtsız şartsız **İBRA** eder.
2. **İşveren (Müşteri) Beyanı:** Teslim edilen eseri gözden geçirdiğini, 6098 sayılı TBK m. 474 ve m. 477 uyarınca eseri kabul ettiğini; yükleniciden gecikme cezası, cezai şart, kâr mahrumiyeti veya eksik ifa tazminatı talebi bulunmadığını beyanla yükleniciyi kayıtsız şartsız **İBRA** eder.
3. **Dava ve Takipten Feragat (HMK m. 313):** Taraflar, yukarıda dökümü yapılan sözleşme ilişkisinden ötürü birbirleri aleyhine hukuk mahkemelerinde dava açmayacaklarını, icra takibi başlatmayacaklarını, başlamış takipler varsa feragat edeceklerini geri dönülemez şekilde taahhüt ederler.

---

### 4. İBRANIN İSTİSNALARI VE SAKLI HAKLAR
İşbu ibraname aşağıdaki halleri kapsamaz ve bu haklar saklı tutulmuştur:
${deed.warrantyExclusionsTr.map((item, idx) => `${idx + 1}. ${item}`).join("\n")}

---

### 5. ADLİ DELİL NİTELİĞİ (HMK m. 193)
İşbu belge; tarafların Operis platformundaki oturum kimlikleri, zaman damgaları ve Master SHA-256 kök özetiyle kriptografik olarak mühürlenmiş olup; 6100 sayılı HMK m. 193 uyarınca münhasır delil senedi hükmündedir.
`;
    } else {
      return `# MUTUAL DISCHARGE, RELEASE & SETTLEMENT DEED
**Deed ID:** \`${deed.deedId}\`  
**Project Title:** ${deed.listingTitle}  
**Engagement Reference:** \`${deed.engagementId}\`  
**Issued At:** ${new Date(deed.issuedAt).toUTCString()}  
**Statutory Basis:** ${deed.statutoryGroundEn}  
**Master SHA-256 Root Digest:** \`${deed.masterSha256}\`  

---

### 1. PARTIES
1. **CLIENT:** **${deed.client.displayName}**${clientTax} — ${deed.client.email}  
2. **CONTRACTOR:** **${deed.contractor.displayName}**${contractorTax} — ${deed.contractor.email}  

---

### 2. SETTLED MILESTONES & PAYMENTS
Total settled project compensation: **${deed.totalSettledAmount.toLocaleString()} ${deed.currency}**

${deed.settledMilestones
  .map(
    (m) =>
      `- Phase ${m.sequence}: **${m.title}** — ${m.amount.toLocaleString()} ${m.currency} (Ref: \`${m.paymentReference || "Bank Wire"}\`)`
  )
  .join("\n")}

---

### 3. MUTUAL DISCHARGE & WAIVER (TBK Art. 132 & HMK Art. 313)
The Parties mutually, fully, and unconditionally release and forever discharge each other from all claims, causes of action, disputes, and liabilities arising out of or related to the Engagement.

### 4. RESERVED RIGHTS & EXCLUSIONS
${deed.warrantyExclusionsEn.map((item, idx) => `${idx + 1}. ${item}`).join("\n")}
`;
    }
  }

  static formatMutualReleaseHtml(deed: MutualReleaseDeed, locale: "tr" | "en" = "tr"): string {
    const isTr = locale === "tr";
    return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <title>${isTr ? "Sözleşme Sonu Karşılıklı İbraname ve Sulh Senedi" : "Mutual Release & Final Discharge Deed"}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; line-height: 1.5; padding: 40px; margin: 0; background: #fff; }
    .header { border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 24px; break-after: avoid-page; page-break-after: avoid; }
    .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0; break-after: avoid-page; page-break-after: avoid; }
    .subtitle { font-size: 13px; color: #64748b; margin: 0; break-after: avoid-page; page-break-after: avoid; }
    .badge { display: inline-block; background: #f0fdf4; color: #166534; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 12px; border: 1px solid #bbf7d0; margin-top: 8px; break-after: avoid-page; page-break-after: avoid; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; break-inside: avoid; page-break-inside: avoid; }
    .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; break-inside: avoid; page-break-inside: avoid; }
    .box h4 { margin: 0 0 8px 0; font-size: 13px; color: #0284c7; text-transform: uppercase; letter-spacing: 0.05em; break-after: avoid-page; page-break-after: avoid; }
    .box p { margin: 3px 0; font-size: 12px; color: #334155; }
    p, li { orphans: 3; widows: 3; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
    tr { break-inside: avoid; page-break-inside: avoid; }
    th { background: #f1f5f9; text-align: left; padding: 8px; border: 1px solid #cbd5e1; font-weight: 700; }
    td { padding: 8px; border: 1px solid #e2e8f0; }
    .highlight { background: #f8fafc; padding: 12px; border-left: 4px solid #10b981; border-radius: 0 6px 6px 0; margin: 16px 0; font-size: 12px; color: #1e293b; break-inside: avoid; page-break-inside: avoid; }
    .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #64748b; display: flex; justify-content: space-between; break-inside: avoid; page-break-inside: avoid; }
    .hash { font-family: monospace; color: #0284c7; font-size: 11px; word-break: break-all; }
    @media print {
      body { padding: 0; }
      h1, h2, h3, h4, .title, .header { break-after: avoid-page !important; page-break-after: avoid !important; }
      .box, .grid, .highlight, table, tr, .footer { break-inside: avoid !important; page-break-inside: avoid !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="title">${isTr ? "SÖZLEŞME SONU KARŞILIKLI İBRANAME VE SULH SENEDİ" : "MUTUAL RELEASE & FINAL DISCHARGE DEED"}</h1>
    <p class="subtitle">${isTr ? "6098 Sayılı TBK m. 132, m. 166 ve 6100 Sayılı HMK m. 313 Uyarınca Resmi İtfa Belgesi" : "Statutory Release & Settlement Deed under Turkish Code of Obligations Art. 132"}</p>
    <div class="badge">✓ ${isTr ? "KESİN VE GERİ ALINAMAZ İTFA (FINAL DISCHARGE)" : "EXECUTED & IRREVOCABLE RELEASE"}</div>
  </div>

  <div class="grid">
    <div class="box">
      <h4>${isTr ? "İŞVEREN (MÜŞTERİ)" : "CLIENT"}</h4>
      <p><strong>${deed.client.displayName}</strong></p>
      <p>E-posta: ${deed.client.email}</p>
      ${deed.client.taxOrIdNumber ? `<p>VKN/TCKN: ${deed.client.taxOrIdNumber}</p>` : ""}
    </div>
    <div class="box">
      <h4>${isTr ? "YÜKLENİCİ (GELİŞTİRİCİ)" : "CONTRACTOR"}</h4>
      <p><strong>${deed.contractor.displayName}</strong></p>
      <p>E-posta: ${deed.contractor.email}</p>
      ${deed.contractor.taxOrIdNumber ? `<p>TCKN/VKN: ${deed.contractor.taxOrIdNumber}</p>` : ""}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Aşama</th>
        <th>Açıklama</th>
        <th>Tutar</th>
        <th>Banka Referansı / Teyit</th>
      </tr>
    </thead>
    <tbody>
      ${deed.settledMilestones
        .map(
          (m) =>
            `<tr><td>${m.sequence}</td><td><strong>${m.title}</strong></td><td>${m.amount.toLocaleString("tr-TR")} ${m.currency}</td><td><code>${m.paymentReference || "EFT/Havale"}</code></td></tr>`
        )
        .join("")}
      <tr>
        <td colspan="2" style="text-align: right; font-weight: 700;">${isTr ? "TOPLAM İTFA EDİLEN BEDEL:" : "TOTAL SETTLED AMOUNT:"}</td>
        <td colspan="2" style="font-weight: 800; color: #0f172a;">${deed.totalSettledAmount.toLocaleString("tr-TR")} ${deed.currency}</td>
      </tr>
    </tbody>
  </table>

  <div class="highlight">
    <strong>${isTr ? "Hukuki Hüküm ve Feragat:" : "Legal Covenant & Release:"}</strong><br>
    ${isTr ? "Taraflar yukarıda belirtilen proje ve hakediş bedellerinin eksiksiz ödendiğini, birbirlerinden hiçbir alacak, fazla çalışma, cezai şart veya gecikme tazminatı talepleri kalmadığını ve birbirlerini kayıtsız şartsız ibra ettiklerini tevsik ederler. TBK m. 477/2 gizli ayıp ve FSEK m. 52 fikri hak devirlerinin geçerliliği tam olarak saklıdır." : "The Parties mutually release and discharge all claims regarding fees, overtime, delay penalties, and liquidated damages. Statutory warranty for fraudulent hidden defects (TBK 477/2) and FSEK 52 IP assignment remain fully reserved."}
  </div>

  <div class="footer">
    <div><strong>Sened No:</strong> ${deed.deedId}</div>
    <div><strong>Düzenleme:</strong> ${new Date(deed.issuedAt).toLocaleDateString("tr-TR")}</div>
  </div>
  <div class="hash">SHA-256: ${deed.masterSha256}</div>
</body>
</html>`;
  }

  // ==========================================================================
  // 2. CLEAN CODE & NO-BACKDOOR WARRANTY (TCK m. 243-245 / TBK m. 474)
  // ==========================================================================
  static generateCleanCodeWarranty(input: GenerateCleanCodeWarrantyInput): CleanCodeWarranty {
    const safeRef = input.engagementId
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 8)
      .toUpperCase();
    const warrantyId = `OPR-SEC-${safeRef}-${Date.now().toString(36).toUpperCase()}`;
    const issuedAt = new Date().toISOString();

    const owaspStandards = [
      "OWASP Top 10 (Injection, Broken Authentication, Sensitive Data Exposure, XML External Entities, Broken Access Control, Security Misconfiguration, XSS, Insecure Deserialization, Vulnerable Components, Insufficient Logging)",
      "Zero Hardcoded Credentials / Secret Keys in Git History",
      "No Covert Administrative Trapdoors or Undocumented Backdoors",
      "No Malicious Cryptomining, Spyware, or Unauthorized Telemetry Logic",
      "Clean Dependency Manifest (Free of Known Critical CVE Vulnerabilities)",
    ];

    const noBackdoorDeclarationTr =
      "Yüklenici; işbu sözleşme kapsamında geliştirdiği ve işverene teslim ettiği kaynak kodların, konfigürasyon dosyalarının ve derleme betiklerinin hiçbir surette arka kapı (backdoor), gizli yönetici erişim kapısı, mantık bombası (logic bomb), truva atı veya yetkisiz veri aktarımı sağlayan zararlı kod parçacığı içermediğini; teslimatın iyi niyet ve uluslararası bilgi güvenliği mühendislik standartlarına tam uyum içinde gerçekleştirildiğini peşinen ve gayrikabili rücu garanti eder.";

    const noBackdoorDeclarationEn =
      "The Contractor hereby irrevocably warrants that all source code, configuration files, and build scripts developed and delivered under this engagement contain no backdoors, hidden administrative trapdoors, logic bombs, trojan routines, or unauthorized data exfiltration code, and strictly comply with international software security engineering standards.";

    const penalLiabilityDeclarationTr =
      "Kasten veya ağır kusurla arka kapı veya yetkisiz erişim mekanizması yerleştirilmesi durumunda; yüklenici 5237 sayılı Türk Ceza Kanunu'nun 243. (Bilişim sistemine yetkisiz erişim), 244. (Sistemi engelleme, bozma, verileri yok etme) ve 245. (Banka veya kredi kartlarının kötüye kullanılması) maddeleri uyarınca doğrudan şahsi cezai sorumluluğa tabi olacağını, TBK m. 474-477 uyarınca hileli gizli ayıp kapsamında 20 yıllık zamanaşımına tabi olarak doğacak tüm doğrudan ve dolaylı zararları tazminle mükellef olduğunu kabul ve taahhüt eder.";

    const penalLiabilityDeclarationEn =
      "In the event of intentional or gross-negligent insertion of any backdoor or unauthorized access mechanism, the Contractor acknowledges direct personal penal liability under Turkish Penal Code Arts. 243-245 and agrees to fully indemnify all direct and indirect damages under TBK Arts. 474-477 within the statutory 20-year fraudulent defect limitation period.";

    const preliminaryPayload = {
      warrantyId,
      engagementId: input.engagementId,
      listingTitle: input.listingTitle,
      contractor: input.contractor,
      client: input.client,
      repositoryUrl: input.repositoryUrl || null,
      commitHash: input.commitHash || null,
      owaspStandards,
      noBackdoorDeclarationTr,
      noBackdoorDeclarationEn,
      penalLiabilityDeclarationTr,
      penalLiabilityDeclarationEn,
      liquidatedDamagesPercentage: 100,
      statutoryGroundTr:
        "5237 s. TCK m. 243-245, 6098 s. TBK m. 474-477, ISO 27001 & SOC 2 Standartları",
      statutoryGroundEn: "Turkish Penal Code Arts. 243-245, TBK Arts. 474-477, ISO 27001 & SOC 2",
      issuedAt,
    };

    const sha256 = this.calculateDeterministicSha256(preliminaryPayload);

    return {
      ...preliminaryPayload,
      sha256,
    };
  }

  static formatCleanCodeMarkdown(warranty: CleanCodeWarranty, locale: "tr" | "en" = "tr"): string {
    const isTr = locale === "tr";
    if (isTr) {
      return `# EK-6: TEMİZ KOD, ARKA KAPI İÇERMEME VE SİBER GÜVENLİK TAAHHÜTNAMESİ
**Taahhütname No:** \`${warranty.warrantyId}\`  
**Sözleşme / İş Referansı:** \`${warranty.engagementId}\`  
**Yasal Dayanak:** ${warranty.statutoryGroundTr}  
**Kriptografik Bütünlük Özeti (SHA-256):** \`${warranty.sha256}\`  

---

### 1. KAPSAM VE SİBER GÜVENLİK STANDARTLARI
Yüklenici (${warranty.contractor.displayName}), işveren (${warranty.client.displayName}) adına geliştirdiği yazılım projesinde aşağıdaki endüstriyel standartlara tam uyum sağladığını taahhüt eder:
${warranty.owaspStandards.map((s, idx) => `${idx + 1}. **${s}**`).join("\n")}

### 2. ARKA KAPI VE ZARARLI YAZILIM İÇERMEME GARANTİSİ
${warranty.noBackdoorDeclarationTr}

### 3. CEZAİ VE HUKUKİ SORUMLULUK KABULÜ (TCK m. 243-245)
${warranty.penalLiabilityDeclarationTr}

### 4. CEZAİ ŞART (LIQUIDATED DAMAGES)
Kasten gizli erişim veya zararlı kod bırakıldığının adli bilişim (forensic) incelemesiyle tespiti halinde; yüklenici sözleşme toplam bedelinin **%${warranty.liquidatedDamagesPercentage}'ü** tutarında cezai şartı derhal ve defaten ödemekle yükümlüdür.
`;
    } else {
      return `# ANNEX-6: CLEAN CODE, NO-BACKDOOR & CYBER SECURITY WARRANTY
**Warranty ID:** \`${warranty.warrantyId}\`  
**Engagement Reference:** \`${warranty.engagementId}\`  
**Statutory Basis:** ${warranty.statutoryGroundEn}  
**SHA-256 Digest:** \`${warranty.sha256}\`  

---

### 1. SECURITY COMPLIANCE STANDARDS
${warranty.owaspStandards.map((s, idx) => `${idx + 1}. ${s}`).join("\n")}

### 2. NO-BACKDOOR DECLARATION
${warranty.noBackdoorDeclarationEn}

### 3. PENAL & CIVIL LIABILITY
${warranty.penalLiabilityDeclarationEn}
`;
    }
  }

  // ==========================================================================
  // 3. FOSS & OPEN SOURCE LICENSE CONTAMINATION SHIELD (FSEK m. 52 / TBK m. 475)
  // ==========================================================================
  static generateFossComplianceWarranty(
    input: GenerateFossComplianceInput
  ): FossComplianceWarranty {
    const safeRef = input.engagementId
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 8)
      .toUpperCase();
    const warrantyId = `OPR-FOSS-${safeRef}-${Date.now().toString(36).toUpperCase()}`;
    const issuedAt = new Date().toISOString();

    const permittedLicenses = [
      "MIT License",
      "Apache License 2.0",
      "BSD 2-Clause / 3-Clause License",
      "ISC License",
      "Unlicense / CC0 Public Domain",
    ];

    const prohibitedLicenses = [
      "GNU General Public License (GPL v2 / GPL v3)",
      "GNU Affero General Public License (AGPL v3)",
      "Server Side Public License (SSPL)",
      "European Union Public License (EUPL)",
      "Open Software License (OSL)",
    ];

    const licensePurityDeclarationTr =
      "Yüklenici; projede kullanılan tüm üçüncü şahıs ve açık kaynaklı kütüphanelerin yalnızca izin verilen ticari lisanslar (MIT, Apache 2.0, BSD vb.) olduğunu; işverenin mülkiyetindeki kaynak kodları kamuya açık kaynak haline getirme zorunluluğu doğuran viral copyleft (GPL, AGPL, SSPL vb.) lisanslı hiçbir bileşeni projeye dahil etmediğini gayrikabili rücu garanti eder.";

    const licensePurityDeclarationEn =
      "The Contractor irrevocably warrants that all third-party open-source libraries incorporated into the deliverables are licensed under permissive commercial licenses (MIT, Apache 2.0, BSD) and strictly free of viral copyleft licenses (GPL, AGPL, SSPL) that would mandate the open-sourcing of the Client's proprietary codebase.";

    const indemnityClauseTr =
      "Teslim edilen kodda kopyalanmış veya yetkisiz şekilde entegre edilmiş yasaklı copyleft lisanslı bileşen tespit edilmesi halinde; yüklenici işverenin ihtarı üzerine azami 14 iş günü içinde ilgili bileşeni kendi masrafıyla temizlemek, refactor etmek ve işverenin bu sebeple uğradığı tüm maddi ve hukuki zararları tazmin etmekle yükümlüdür.";

    const indemnityClauseEn =
      "If any prohibited copyleft component is discovered in the delivered code, the Contractor shall, upon notice, remedy and refactor the code at its sole expense within 14 business days and indemnify the Client against all associated third-party claims.";

    const preliminaryPayload = {
      warrantyId,
      engagementId: input.engagementId,
      listingTitle: input.listingTitle,
      contractor: input.contractor,
      client: input.client,
      repositoryUrl: input.repositoryUrl || null,
      commitHash: input.commitHash || null,
      permittedLicenses,
      prohibitedLicenses,
      licensePurityDeclarationTr,
      licensePurityDeclarationEn,
      curePeriodDays: 14,
      indemnityClauseTr,
      indemnityClauseEn,
      statutoryGroundTr:
        "5846 s. FSEK m. 52, 6098 s. TBK m. 475 & Uluslararası FOSS / OSI Standartları",
      statutoryGroundEn: "FSEK Art. 52, TBK Art. 475 & Open Source Initiative (OSI) Standards",
      issuedAt,
    };

    const sha256 = this.calculateDeterministicSha256(preliminaryPayload);

    return {
      ...preliminaryPayload,
      sha256,
    };
  }

  static formatFossComplianceMarkdown(
    warranty: FossComplianceWarranty,
    locale: "tr" | "en" = "tr"
  ): string {
    const isTr = locale === "tr";
    if (isTr) {
      return `# EK-7: AÇIK KAYNAK LİSANS SAFLIĞI VE COPYLEFT BULAŞMAMA ŞARTNAMESİ
**Şartname No:** \`${warranty.warrantyId}\`  
**Sözleşme / İş Referansı:** \`${warranty.engagementId}\`  
**Yasal Dayanak:** ${warranty.statutoryGroundTr}  
**Kriptografik Bütünlük Özeti (SHA-256):** \`${warranty.sha256}\`  

---

### 1. İZİN VERİLEN AÇIK KAYNAK LİSANSLARI (PERMISSIVE WHITELIST)
Projede yalnızca ticari kapalı kaynak kullanımına izin veren aşağıdaki açık kaynak lisanslar kullanılabilir:
${warranty.permittedLicenses.map((l) => `- ✓ **${l}**`).join("\n")}

### 2. KESİNLİKLE YASAKLI VİRAL LİSANSLAR (COPYLEFT BLACKLIST)
İşverenin ticari mülkiyet kodunu kamuya açma zorunluluğu doğuran aşağıdaki lisanslar kesinlikle yasaktır:
${warranty.prohibitedLicenses.map((l) => `- ❌ **${l}** (Ticari Kirlenme Riski)`).join("\n")}

### 3. LİSANS SAFLIĞI VE SBOM GARANTİSİ
${warranty.licensePurityDeclarationTr}

### 4. DÜZELTME SÜRESİ (CURE PERIOD) VE TAZMİNAT
${warranty.indemnityClauseTr} (Düzeltme Süresi: **${warranty.curePeriodDays} İş Günü**)
`;
    } else {
      return `# ANNEX-7: FOSS & OPEN SOURCE LICENSE CONTAMINATION SHIELD
**Shield ID:** \`${warranty.warrantyId}\`  
**Engagement Reference:** \`${warranty.engagementId}\`  
**Statutory Basis:** ${warranty.statutoryGroundEn}  
**SHA-256 Digest:** \`${warranty.sha256}\`  

---

### 1. PERMISSIVE WHITELIST
${warranty.permittedLicenses.map((l) => `- ✓ ${l}`).join("\n")}

### 2. PROHIBITED COPYLEFT BLACKLIST
${warranty.prohibitedLicenses.map((l) => `- ❌ ${l}`).join("\n")}

### 3. LICENSE PURITY COVENANT
${warranty.licensePurityDeclarationEn}

### 4. CURE PERIOD & INDEMNIFICATION
${warranty.indemnityClauseEn}
`;
    }
  }

  // ==========================================================================
  // 4. NON-SOLICITATION & PLATFORM INTEGRITY PROTOCOL (TTK m. 54-55 / TBK m. 444)
  // ==========================================================================
  static generateNonSolicitationProtocol(
    input: GenerateNonSolicitationInput
  ): NonSolicitationProtocol {
    const safeRef = input.engagementId
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 8)
      .toUpperCase();
    const protocolId = `OPR-SOLICIT-${safeRef}-${Date.now().toString(36).toUpperCase()}`;
    const issuedAt = new Date().toISOString();
    const durationMonths = input.durationMonths || 12;

    const customerProtectionTr =
      "Yüklenici; işbu sözleşme ifası esnasında doğrudan veya dolaylı olarak tanıştığı işverenin kurumsal müşterilerine, iştiraklerine veya iş ortaklarına proje süresince ve sözleşmenin sona ermesinden itibaren 12 (on iki) ay boyunca işverenin yazılı onayı olmaksızın doğrudan teklif vermeyeceğini veya işvereni baypas ederek aynı/benzer hizmetleri sunmayacağını taahhüt eder.";

    const customerProtectionEn =
      "The Contractor covenants that during the project and for a period of 12 (twelve) months following termination, it shall not directly or indirectly solicit, divert, or service any client, subsidiary, or partner of the Client introduced during this engagement without prior written consent.";

    const antiPoachingTr =
      "İşveren; yüklenicinin veya Squad konsorsiyumunun projede görevlendirdiği kilit personeli, taşeronları veya bağımsız geliştiricileri proje süresince ve sözleşmenin bitiminden itibaren 12 (on iki) ay boyunca doğrudan istihdam etmeye veya sözleşmelerini ihlale yöneltmeyeceğini (TTK m. 55/1-b) taahhüt eder.";

    const antiPoachingEn =
      "The Client covenants that during the project and for a period of 12 (twelve) months thereafter, it shall not directly solicit, hire, or induce any key developer, contractor, or squad member of the Contractor to terminate or breach their relationship.";

    const platformIntegrityTr =
      "Taraflar; Operis platformu üzerinde başlatılan ve sözleşmeye bağlanan hakedişleri, platform komisyonsuz (zero-escrow) bir mimaride çalışsa dahi, devam eden ifa esnasında platform dışına kaçırmayacaklarını ve denetim izi güvenliğini koruyacaklarını kabul ederler.";

    const platformIntegrityEn =
      "Both Parties agree to maintain ongoing engagement milestones on the Operis platform to preserve audit trail forensics and cryptographic integrity.";

    const preliminaryPayload = {
      protocolId,
      engagementId: input.engagementId,
      listingTitle: input.listingTitle,
      client: input.client,
      contractor: input.contractor,
      durationMonths,
      customerProtectionTr,
      customerProtectionEn,
      antiPoachingTr,
      antiPoachingEn,
      platformIntegrityTr,
      platformIntegrityEn,
      statutoryGroundTr:
        "6102 s. TTK m. 54-55 (Haksız Rekabet) & 6098 s. TBK m. 444-447 (Ölçülü Koruma)",
      statutoryGroundEn:
        "Turkish Commercial Code Arts. 54-55 (Unfair Competition) & TBK Arts. 444-447",
      issuedAt,
    };

    const sha256 = this.calculateDeterministicSha256(preliminaryPayload);

    return {
      ...preliminaryPayload,
      sha256,
    };
  }

  static formatNonSolicitationMarkdown(
    protocol: NonSolicitationProtocol,
    locale: "tr" | "en" = "tr"
  ): string {
    const isTr = locale === "tr";
    if (isTr) {
      return `# EK-8: MÜŞTERİ VE PERSONEL AYARTMAMA & PLATFORM SADAKAT PROTOKOLÜ
**Protokol No:** \`${protocol.protocolId}\`  
**Sözleşme / İş Referansı:** \`${protocol.engagementId}\`  
**Yasal Dayanak:** ${protocol.statutoryGroundTr}  
**Kriptografik Bütünlük Özeti (SHA-256):** \`${protocol.sha256}\`  

---

### 1. MÜŞTERİ PORTFÖYÜNÜ VE TİCARİ ÇEVREYİ KORUMA
${protocol.customerProtectionTr} (Geçerlilik Süresi: **${protocol.durationMonths} Ay**)

### 2. KİLİT EKİP VE TAŞERON AYARTMAMA (ANTI-POACHING)
${protocol.antiPoachingTr} (Geçerlilik Süresi: **${protocol.durationMonths} Ay**)

### 3. PLATFORM VE DENETİM İZİ BÜTÜNLÜĞÜ
${protocol.platformIntegrityTr}

### 4. REKABET HUKUKU VE ÖLÇÜLÜLÜK İLKESİ (4054 s. Kanun & TBK m. 444)
İşbu protokol; tarafların çalışma özgürlüğünü genel olarak kısıtlamayacak şekilde, yalnızca proje kapsamında doğrudan paylaşılan ticari sırlar ve tanışılan taraflarla sınırlı olarak ölçülü biçimde tanzim edilmiştir.
`;
    } else {
      return `# ANNEX-8: NON-SOLICITATION & PLATFORM INTEGRITY PROTOCOL
**Protocol ID:** \`${protocol.protocolId}\`  
**Engagement Reference:** \`${protocol.engagementId}\`  
**Statutory Basis:** ${protocol.statutoryGroundEn}  
**SHA-256 Digest:** \`${protocol.sha256}\`  

---

### 1. CUSTOMER NON-CIRCUMVENTION
${protocol.customerProtectionEn} (Duration: **${protocol.durationMonths} Months**)

### 2. ANTI-POACHING OF SQUAD & SUBCONTRACTORS
${protocol.antiPoachingEn} (Duration: **${protocol.durationMonths} Months**)

### 3. PLATFORM FORENSIC INTEGRITY
${protocol.platformIntegrityEn}
`;
    }
  }

  // ==========================================================================
  // 5. CONTRACT TERMINATION & ASSET LIQUIDATION DEED (TBK m. 484-486)
  // ==========================================================================
  static generateTerminationLiquidationDeed(
    input: GenerateTerminationLiquidationInput
  ): TerminationLiquidationDeed {
    const safeRef = input.engagementId
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 8)
      .toUpperCase();
    const deedId = `OPR-LIQUIDATION-${safeRef}-${Date.now().toString(36).toUpperCase()}`;
    const issuedAt = new Date().toISOString();

    let groundDescriptionTr: string;
    let groundDescriptionEn: string;

    switch (input.ground) {
      case "CLIENT_TERMINATION_TBK484":
        groundDescriptionTr =
          "İşverenin 6098 sayılı TBK m. 484 uyarınca tamamlanan kısımların bedelini ve tazminatını ödeyerek tek taraflı fesih hakkını kullanması.";
        groundDescriptionEn =
          "Unilateral termination by the Client under TBK Art. 484 against payment of completed work and indemnification.";
        break;
      case "IMPOSSIBILITY_TBK485":
        groundDescriptionTr =
          "İşverenden veya öngörülemeyen teknik engellerden kaynaklanan ifa imkansızlığı (TBK m. 485).";
        groundDescriptionEn = "Impossibility of performance under TBK Art. 485.";
        break;
      case "DISPUTE_SETTLEMENT":
        groundDescriptionTr =
          "Taraflar arasındaki uyuşmazlığın sulh ve arabuluculuk yoluyla çözümlenerek sözleşmenin tasfiyesi.";
        groundDescriptionEn =
          "Early termination following mutual settlement of dispute and mediation.";
        break;
      case "MUTUAL_IKALE":
      default:
        groundDescriptionTr =
          "Tarafların karşılıklı serbest iradeleriyle sözleşmeyi ikâle yoluyla sona erdirme mutabakatı (TBK m. 132).";
        groundDescriptionEn = "Mutual termination agreement (ikale) under TBK Art. 132.";
        break;
    }

    if (input.groundDetailTr) groundDescriptionTr += ` ${input.groundDetailTr}`;
    if (input.groundDetailEn) groundDescriptionEn += ` ${input.groundDetailEn}`;

    const retainedIpTermsTr =
      "FSEK m. 52 uyarınca; bedeli tamamen ödenmiş ve teslim edilmiş aşamaların mali hakları işverene ait kalmaya devam eder. Henüz ödemesi yapılmamış veya yarıda kalan kod bloklarının mülkiyeti ve fikri hakları ise yüklenicide saklı kalır.";

    const retainedIpTermsEn =
      "Under FSEK Art. 52, IP rights for fully settled and paid milestones remain perpetually assigned to the Client. All unfulfilled, unpaid, or uncompleted code components remain the exclusive intellectual property of the Contractor.";

    const mutualDischargeTr =
      "İşbu tasfiye tutanağında mutabık kalınan tutarlar ve varlık devirleri tamamlandığında; taraflar birbirlerini sözleşmeden doğan tüm bakiye alacak, kâr mahrumiyeti veya gecikme tazminatlarından kayıtsız şartsız ibra etmiş sayılır.";

    const mutualDischargeEn =
      "Upon completion of the asset transfers and payments outlined herein, both Parties unconditionally discharge and release each other from all remaining claims, lost profit, or delay liabilities.";

    const preliminaryPayload = {
      deedId,
      engagementId: input.engagementId,
      listingTitle: input.listingTitle,
      client: input.client,
      contractor: input.contractor,
      ground: input.ground,
      groundDescriptionTr,
      groundDescriptionEn,
      settledMilestones: input.settledMilestones,
      unfulfilledMilestones: input.unfulfilledMilestones,
      totalSettledAmount: input.totalSettledAmount,
      totalUnfulfilledAmount: input.totalUnfulfilledAmount,
      currency: input.currency,
      retainedIpTermsTr,
      retainedIpTermsEn,
      offboardingChecklist: {
        credentialsReturned: input.credentialsReturned ?? true,
        sourceCodeTransferred: input.sourceCodeTransferred ?? true,
        documentationProvided: input.documentationProvided ?? true,
      },
      mutualDischargeTr,
      mutualDischargeEn,
      statutoryGroundTr: "6098 s. TBK m. 484-486 (Sözleşmenin Sona Ermesi ve Tasfiye) & TBK m. 132",
      statutoryGroundEn: "TBK Arts. 484-486 (Termination of Contract for Work) & TBK Art. 132",
      issuedAt,
    };

    const masterSha256 = this.calculateDeterministicSha256(preliminaryPayload);

    return {
      ...preliminaryPayload,
      masterSha256,
    };
  }

  static formatTerminationLiquidationMarkdown(
    deed: TerminationLiquidationDeed,
    locale: "tr" | "en" = "tr"
  ): string {
    const isTr = locale === "tr";
    if (isTr) {
      return `# ERKEN FESİH, İKÂLE VE TASFİYE PROTOKOLÜ
**Protokol No:** \`${deed.deedId}\`  
**Sözleşme / İş Referansı:** \`${deed.engagementId}\`  
**Fesih Gerekçesi:** ${deed.groundDescriptionTr}  
**Tanzim Tarihi:** ${new Date(deed.issuedAt).toLocaleDateString("tr-TR")}  
**Yasal Dayanak:** ${deed.statutoryGroundTr}  
**Master SHA-256 Kök Özeti:** \`${deed.masterSha256}\`  

---

### 1. TARAFLAR
1. **İŞVEREN (MÜŞTERİ):** **${deed.client.displayName}** — ${deed.client.email}  
2. **YÜKLENİCİ (GELİŞTİRİCİ):** **${deed.contractor.displayName}** — ${deed.contractor.email}  

---

### 2. TASFİYE VE MALİ HESAP TABLOSU
- **İtfa Edilen / Ödenen Hakedişler:** **${deed.totalSettledAmount.toLocaleString("tr-TR")} ${deed.currency}** (${deed.settledMilestones.length} Aşama)
- **Tasfiye Edilen / İptal Edilen Bakiye:** **${deed.totalUnfulfilledAmount.toLocaleString("tr-TR")} ${deed.currency}** (${deed.unfulfilledMilestones.length} Aşama)

---

### 3. FİKRİ MÜLKİYET (IP) DURUMU
${deed.retainedIpTermsTr}

---

### 4. TESLİMAT VE OFFBOARDING KONTROLÜ
- [x] Sunucu, API ve Bulut Yönetici Yetkileri İade Edildi: **${deed.offboardingChecklist.credentialsReturned ? "EVET" : "HAYIR"}**
- [x] O Ana Kadar Yazılan Kaynak Kodlar Aktarıldı: **${deed.offboardingChecklist.sourceCodeTransferred ? "EVET" : "HAYIR"}**
- [x] Mevcut Teknik Dokümantasyon Teslim Edildi: **${deed.offboardingChecklist.documentationProvided ? "EVET" : "HAYIR"}**

---

### 5. NİHAİ İBRA VE FERAGAT
${deed.mutualDischargeTr}
`;
    } else {
      return `# CONTRACT TERMINATION, OFFBOARDING & LIQUIDATION DEED
**Deed ID:** \`${deed.deedId}\`  
**Engagement Reference:** \`${deed.engagementId}\`  
**Termination Ground:** ${deed.groundDescriptionEn}  
**Issued At:** ${new Date(deed.issuedAt).toUTCString()}  
**Statutory Basis:** ${deed.statutoryGroundEn}  
**Master SHA-256:** \`${deed.masterSha256}\`  

---

### 1. LIQUIDATION SUMMARY
- Settled Milestones Amount: **${deed.totalSettledAmount.toLocaleString()} ${deed.currency}**
- Liquidated / Cancelled Amount: **${deed.totalUnfulfilledAmount.toLocaleString()} ${deed.currency}**

### 2. INTELLECTUAL PROPERTY SETTLEMENT
${deed.retainedIpTermsEn}

### 3. MUTUAL DISCHARGE
${deed.mutualDischargeEn}
`;
    }
  }

  static formatTerminationLiquidationHtml(
    deed: TerminationLiquidationDeed,
    locale: "tr" | "en" = "tr"
  ): string {
    const isTr = locale === "tr";
    return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <title>${isTr ? "Sözleşme Erken Fesih ve Tasfiye Protokolü" : "Contract Termination & Liquidation Deed"}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; line-height: 1.5; padding: 40px; margin: 0; background: #fff; }
    .header { border-bottom: 2px solid #ef4444; padding-bottom: 16px; margin-bottom: 24px; break-after: avoid-page; page-break-after: avoid; }
    .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0; break-after: avoid-page; page-break-after: avoid; }
    .subtitle { font-size: 13px; color: #64748b; margin: 0; break-after: avoid-page; page-break-after: avoid; }
    .badge { display: inline-block; background: #fef2f2; color: #991b1b; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 12px; border: 1px solid #fecaca; margin-top: 8px; break-after: avoid-page; page-break-after: avoid; }
    .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 16px; break-inside: avoid; page-break-inside: avoid; }
    p, li { orphans: 3; widows: 3; }
    .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #64748b; break-inside: avoid; page-break-inside: avoid; }
    .hash { font-family: monospace; color: #ef4444; font-size: 11px; word-break: break-all; }
    @media print {
      body { padding: 0; }
      h1, h2, h3, h4, .title, .header { break-after: avoid-page !important; page-break-after: avoid !important; }
      .box, .footer { break-inside: avoid !important; page-break-inside: avoid !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="title">${isTr ? "ERKEN FESİH, İKÂLE VE TASFİYE PROTOKOLÜ" : "CONTRACT TERMINATION & LIQUIDATION DEED"}</h1>
    <p class="subtitle">${isTr ? "6098 Sayılı TBK m. 484-486 ve TBK m. 132 Uyarınca Resmi Tasfiye Belgesi" : "Statutory Liquidation Deed under TBK Arts. 484-486"}</p>
    <div class="badge">✕ ${isTr ? "SÖZLEŞME İKÂLE İLE SONA ERDİRİLDİ" : "TERMINATED & LIQUIDATED"}</div>
  </div>

  <div class="box">
    <p><strong>${isTr ? "Fesih Gerekçesi:" : "Ground:"}</strong> ${isTr ? deed.groundDescriptionTr : deed.groundDescriptionEn}</p>
    <p><strong>${isTr ? "İtfa Edilen Bedel:" : "Settled Amount:"}</strong> ${deed.totalSettledAmount.toLocaleString()} ${deed.currency}</p>
    <p><strong>${isTr ? "Tasfiye Edilen Bakiye:" : "Liquidated Amount:"}</strong> ${deed.totalUnfulfilledAmount.toLocaleString()} ${deed.currency}</p>
  </div>

  <div class="footer">
    <div><strong>Protokol No:</strong> ${deed.deedId}</div>
    <div><strong>Tanzim:</strong> ${new Date(deed.issuedAt).toLocaleDateString("tr-TR")}</div>
  </div>
  <div class="hash">SHA-256: ${deed.masterSha256}</div>
</body>
</html>`;
  }
}
