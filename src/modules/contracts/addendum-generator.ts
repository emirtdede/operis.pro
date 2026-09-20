import { createHash } from "crypto";
import { AddendumGeneratorInput, GeneratedAddendumResult } from "./types";

export const CHANGE_REASON_LABELS: Record<string, { tr: string; en: string }> = {
  CLIENT_REQUESTED: {
    tr: "İş Sahibi (Müşteri) Tarafından Talep Edilen İlave Özellik / Kapsam Genişlemesi",
    en: "Client-Requested Feature Addition & Scope Expansion",
  },
  TECHNICAL_NECESSITY: {
    tr: "Sistem Mimarisi veya Altyapı Güvenliği İçin Zorunlu Teknik İyileştirme",
    en: "Technical & Architectural Necessity for Security / Stability",
  },
  SCOPE_DISCOVERY: {
    tr: "Geliştirme Sürecinde Tespit Edilen Kritik Yeni Gereksinim",
    en: "Critical Requirement Discovered During Development",
  },
  UNFORESEEN_COMPLICATION: {
    tr: "TBK m. 480/2 Kapsamında Önceden Öngörülemeyen Objektif Teknik Engel / Zorunluluk",
    en: "Unforeseen Objective Complication pursuant to TBK Art. 480/2",
  },
};

export class AddendumGeneratorService {
  /**
   * Generates a deterministic SHA-256 hash for document fingerprinting.
   */
  static calculateSha256(content: string): string {
    return createHash("sha256").update(content, "utf8").digest("hex");
  }

  /**
   * Builds the official bilateral Contract Addendum (Sözleşme Zeyilnamesi / Ek Protokol)
   * under TBK m. 470 and m. 480/2.
   */
  static generateAddendum(input: AddendumGeneratorInput): GeneratedAddendumResult {
    const isTr = (input.locale || "tr") === "tr";
    const engagementShort = input.engagementId.replace(/-/g, "").slice(0, 8).toUpperCase();
    const seqPadded = String(input.sequenceNumber).padStart(2, "0");
    const addendumRef = `OPR-ADDENDUM-${engagementShort}-${seqPadded}`;
    const generatedAtDate = new Date();

    const generatedDateFormatted = generatedAtDate.toLocaleDateString(
      isTr ? "tr-TR" : "en-US",
      { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }
    );

    const clientName = input.client.displayName || (isTr ? "İş Sahibi" : "Client");
    const clientEmail = input.client.email || "—";
    const clientPhone = input.client.phone || (isTr ? "Gizli / Eşleşme Onaylı" : "Private / Match Approved");

    const contractorName = input.contractor.displayName || (isTr ? "Yüklenici" : "Contractor");
    const contractorEmail = input.contractor.email || "—";
    const contractorPhone = input.contractor.phone || (isTr ? "Gizli / Eşleşme Onaylı" : "Private / Match Approved");

    const reasonLabel =
      CHANGE_REASON_LABELS[input.reason]?.[isTr ? "tr" : "en"] || input.reason;

    let formattedBudget = isTr ? "İlave bedel talep edilmemiştir (₺0,00)" : "No additional fee requested (0.00)";
    if (input.additionalBudget > 0) {
      formattedBudget = `+${input.additionalBudget.toLocaleString(isTr ? "tr-TR" : "en-US", { minimumFractionDigits: 2 })} ${input.currency}`;
    }

    let formattedDays = isTr ? "Teslimat takvimi değişmemiştir" : "Schedule unchanged";
    if (input.additionalDays > 0) {
      const unitStr = isTr ? "takvim günü" : "calendar days";
      formattedDays = `+${input.additionalDays} ${unitStr}`;
    }

    // Build canonical legal markdown
    const markdown = isTr
      ? `# SÖZLEŞME ZEYİLNAMESİ (EK PROTOKOL NO: ${seqPadded})
**Zeyilname Referans Kodu:** \`${addendumRef}\`  
**Dayanak Ana Sözleşme:** \`${input.parentContractRef}\`  
**Ana Sözleşme Parmak İzi (SHA-256):** \`${input.parentContractSha256}\`  
**Tanzim ve Onay Zamanı:** ${generatedDateFormatted}  
**Hukuki Dayanak:** 6098 sayılı Türk Borçlar Kanunu (TBK m. 470 vd. ve m. 480/2)

---

### MADDE 1: TARAFLAR VE DAYANAK SÖZLEŞME
İşbu Sözleşme Zeyilnamesi ("Zeyilname"), aşağıda bilgileri yer alan taraflar arasında akdedilmiş bulunan **"${input.listingTitle}"** konulu ve **\`${input.parentContractRef}\`** referans kodlu Bağımsız Yazılım ve Teknoloji Hizmet Sözleşmesi'nin ("Ana Sözleşme") ayrılmaz bir parçası olarak düzenlenmiştir:

1. **İŞ SAHİBİ (MÜŞTERİ):** ${clientName} (${clientEmail} / ${clientPhone})
2. **YÜKLENİCİ (GELİŞTİRİCİ):** ${contractorName} (${contractorEmail} / ${contractorPhone})

---

### MADDE 2: DEĞİŞİKLİK GEREKÇESİ VE İLAVE İŞLERİN KAPSAMI
2.1. **Değişiklik Gerekçesi:** ${reasonLabel}  
2.2. **Değişiklik Talebi Başlığı:** **${input.title}**  
2.3. **Kapsam Detayı ve Kabul Kriterleri:**  
${input.description.trim()}

İşbu maddede belirtilen ilave fonksiyon, ekran ve teknik entegrasyonlar Ana Sözleşme'nin Madde 2 kapsamına resmen dahil edilmiş olup, taraflar bu kapsamın TBK m. 470 anlamında teslim ve kabul muayenesine tabi olduğunu karşılıklı kabul ve beyan eder.

---

### MADDE 3: İLAVE PROJE BEDELİ VE VERGİLENDİRME
3.1. **İlave Hizmet Bedeli:** **${formattedBudget}**  
3.2. **Ödeme ve Vergi Hükmü:** İşbu Zeyilname ile kararlaştırılan ilave bedel, Ana Sözleşme'nin Madde 3 hükümlerine tabi olup; İş Sahibi kurumsal vergi mükellefi ise brüt tutar üzerinden yasal stopaj tevkifatı uygulanacak ve KDV ilave edilecektir. Nihai tüketici olması durumunda stopaj kesintisi yapılmaz.  
3.3. **Ödeme Zamanı:** Aksi kararlaştırılmadıkça ilave bedel, işbu Zeyilname'de tanımlanan ilave kapsamın tamamlanarak teslim edilmesiyle birlikte muaccel olur.

---

### MADDE 4: İLAVE TESLİMAT SÜRESİ VE TAKVİM UYARLAMASI
4.1. **Ek Teslimat Süresi:** **${formattedDays}**  
4.2. **Takvim Uyarlaması:** İlave kapsamın gerektirdiği geliştirme ve test eforu doğrultusunda Ana Sözleşme'deki nihai teslimat taahhüdü işbu ek süre kadar otomatik olarak uzatılmıştır. Yüklenici bu ek süreden ötürü temerrüde düşmüş sayılamaz (TBK m. 473 ve m. 117).

---

### MADDE 5: ANA SÖZLEŞME HÜKÜMLERİNİN GEÇERLİLİĞİ
İşbu Zeyilname ile açıkça tadil edilmeyen Ana Sözleşme'nin tüm maddeleri; özellikle 5846 sayılı FSEK m. 52 uyarınca fikri mülkiyet devri, gizlilik ve sır saklama yükümlülükleri (NDA), TBK m. 474 muayene/ihbar kuralları ve 6325 sayılı Arabuluculuk Kanunu uyarınca dava şartı arabuluculuk hükümleri eksiksiz ve aynen yürürlükte kalmaya devam eder.

---

### MADDE 6: DİJİTAL MÜHÜR VE BÜTÜNLÜK DOĞRULAMASI
İşbu Zeyilname, tarafların Operis platformu üzerindeki çift taraflı doğrulanmış oturumları vasıtasıyla elektronik ortamda karşılıklı olarak onaylanmış olup, aşağıdaki kriptografik SHA-256 dijital mührü ile zaman damgalı olarak tanzim edilmiştir.
`
      : `# CONTRACT ADDENDUM (AMENDMENT PROTOCOL NO: ${seqPadded})
**Addendum Reference:** \`${addendumRef}\`  
**Master Contract Reference:** \`${input.parentContractRef}\`  
**Master Contract Fingerprint (SHA-256):** \`${input.parentContractSha256}\`  
**Execution Timestamp:** ${generatedDateFormatted}  
**Governing Law:** Turkish Code of Obligations (TBK Art. 470 et seq. & Art. 480/2)

---

### ARTICLE 1: PARTIES & MASTER CONTRACT
This Contract Addendum ("Addendum") is executed as an integral part of the Independent Software Services Agreement ("Master Contract") referenced as **\`${input.parentContractRef}\`** regarding **"${input.listingTitle}"**:

1. **CLIENT:** ${clientName} (${clientEmail} / ${clientPhone})
2. **CONTRACTOR:** ${contractorName} (${contractorEmail} / ${contractorPhone})

---

### ARTICLE 2: SCOPE DELTA & ACCEPTANCE CRITERIA
2.1. **Origin of Change:** ${reasonLabel}  
2.2. **Addendum Title:** **${input.title}**  
2.3. **Technical Specifications & Deliverables:**  
${input.description.trim()}

---

### ARTICLE 3: ADDITIONAL CONSIDERATION & BILLING
3.1. **Additional Fee:** **${formattedBudget}**  
3.2. Subject to Master Contract Article 3 tax and invoicing terms.

---

### ARTICLE 4: SCHEDULE ADJUSTMENT
4.1. **Additional Delivery Timeline:** **${formattedDays}**  
4.2. Master Contract delivery milestone is extended accordingly without default penalty.

---

### ARTICLE 5: CONTINUITY OF MASTER CONTRACT TERMS
All unaffected provisions of the Master Contract, including IP Rights Transfer (FSEK Art. 52), Confidentiality (NDA), and Dispute Mediation, remain fully binding.
`;

    // Compute cryptographically chained SHA-256 seal: SHA-256(parentSha + "|" + addendumRef + "|" + canonicalMarkdown)
    const addendumSha256 = this.calculateSha256(
      `${input.parentContractSha256}|${addendumRef}|${markdown}`
    );

    const htmlContent = `<!DOCTYPE html>
<html lang="${isTr ? "tr" : "en"}">
<head>
  <meta charset="UTF-8" />
  <title>${addendumRef} - Sözleşme Zeyilnamesi</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #1e293b; max-width: 800px; margin: 0 auto; padding: 32px 24px; font-size: 9.5pt; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; }
    .brand { font-size: 18pt; font-weight: 900; letter-spacing: -0.04em; color: #0f172a; }
    .brand span { color: #3b82f6; }
    .meta-box { font-size: 8pt; color: #475569; text-align: right; line-height: 1.4; }
    h1 { font-size: 14pt; font-weight: 800; color: #0f172a; margin: 16px 0 12px; break-after: avoid-page; page-break-after: avoid; }
    h3 { font-size: 10pt; font-weight: 700; color: #1e293b; margin: 16px 0 6px; border-left: 3px solid #3b82f6; padding-left: 8px; break-after: avoid-page; page-break-after: avoid; }
    p, li { orphans: 3; widows: 3; }
    .badge-bar { display: flex; gap: 8px; margin: 12px 0; break-inside: avoid; page-break-inside: avoid; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 7.5pt; font-weight: 700; background: #e2e8f0; color: #334155; }
    .sha-seal { margin-top: 24px; padding: 10px 14px; border: 1px dashed #94a3b8; border-radius: 8px; background: #f1f5f9; font-family: monospace; font-size: 8pt; color: #475569; word-break: break-all; break-inside: avoid; page-break-inside: avoid; }
    .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 32px; page-break-inside: avoid; break-inside: avoid; }
    .signature-box { border-top: 1px solid #0f172a; padding-top: 8px; font-size: 9pt; break-inside: avoid; page-break-inside: avoid; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
      h1, h2, h3, h4, .brand, .meta-box { break-after: avoid-page !important; page-break-after: avoid !important; }
      .signature-grid, .signature-box, .sha-seal, .badge-bar { break-inside: avoid !important; page-break-inside: avoid !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">OPERIS<span>.PRO</span></div>
      <div style="font-size: 8pt; color: #64748b;">Hukuki Sözleşme Zeyilnamesi • Ek Protokol No: ${seqPadded}</div>
    </div>
    <div class="meta-box">
      <div>Zeyilname Ref: <strong>${addendumRef}</strong></div>
      <div>Ana Sözleşme: <strong>${input.parentContractRef}</strong></div>
      <div>Tarih: <strong>${generatedDateFormatted}</strong></div>
      <div>Mevzuat: <strong>TBK m.470 & m.480/2</strong></div>
    </div>
  </div>

  <h1>${isTr ? `SÖZLEŞME ZEYİLNAMESİ (EK PROTOKOL NO: ${seqPadded})` : `CONTRACT ADDENDUM (NO: ${seqPadded})`}</h1>

  <div class="badge-bar">
    <span class="badge" style="background: #e0f2fe; color: #0369a1;">${input.title}</span>
    <span class="badge" style="background: #dcfce7; color: #15803d;">${formattedBudget}</span>
    <span class="badge" style="background: #fef3c7; color: #b45309;">${formattedDays}</span>
  </div>

  <h3>${isTr ? "1. Taraflar ve Dayanak Sözleşme" : "1. Parties & Master Agreement"}</h3>
  <p><strong>${isTr ? "İş Sahibi:" : "Client:"}</strong> ${clientName} (${clientEmail}) &bull; <strong>${isTr ? "Yüklenici:" : "Contractor:"}</strong> ${contractorName} (${contractorEmail})</p>

  <h3>${isTr ? "2. Değişiklik Gerekçesi ve Kapsam Tanımı" : "2. Scope Modification & Rationale"}</h3>
  <p><strong>${isTr ? "Gerekçe:" : "Reason:"}</strong> ${reasonLabel}</p>
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; font-size: 9pt; white-space: pre-wrap;">${input.description.trim()}</div>

  <h3>${isTr ? "3. İlave Bedel ve Takvim Uyarlaması" : "3. Additional Fee & Schedule Adjustment"}</h3>
  <p>${isTr ? `İşbu zeyilname ile <strong>${formattedBudget}</strong> ilave bedel ve <strong>${formattedDays}</strong> ilave teslimat süresi kabul edilmiş, Ana Sözleşme bütçe ve takvimi bu doğrultuda resmen revize edilmiştir.` : `Additional fee of <strong>${formattedBudget}</strong> and additional timeline of <strong>${formattedDays}</strong> approved.`}</p>

  <h3>${isTr ? "4. Ana Sözleşme Hükümlerinin Aynen Geçerliliği" : "4. Severability & Master Contract Continuity"}</h3>
  <p>${isTr ? "İşbu zeyilname ile değiştirilmeyen tüm Ana Sözleşme hükümleri (FSEK m. 52 fikri mülkiyet devri, gizlilik ve arabuluculuk şartları) aynen ve eksiksiz olarak yürürlükte kalmaya devam eder." : "All unaffected clauses of the Master Contract remain fully binding."}</p>

  <div class="sha-seal">
    <div><strong>ZİNCİRLEME KRİPTOGRAFİK DİJİTAL MÜHÜR (SHA-256):</strong></div>
    <div>${addendumSha256}</div>
    <div style="font-size: 7.5pt; margin-top: 2px; color: #64748b;">Ana Sözleşme Parmak İzi: ${input.parentContractSha256}</div>
  </div>

  <div class="signature-grid">
    <div class="signature-box">
      <div><strong>İŞ SAHİBİ (MÜŞTERİ)</strong></div>
      <div style="margin-top: 2px;">${clientName}</div>
      <div style="margin-top: 16px; color: #64748b; font-size: 8pt;">✓ Çift Taraflı Dijital Onaylandı</div>
    </div>
    <div class="signature-box">
      <div><strong>YÜKLENİCİ (GELİŞTİRİCİ)</strong></div>
      <div style="margin-top: 2px;">${contractorName}</div>
      <div style="margin-top: 16px; color: #64748b; font-size: 8pt;">✓ Çift Taraflı Dijital Onaylandı</div>
    </div>
  </div>
</body>
</html>`;

    return {
      addendumRef,
      parentContractRef: input.parentContractRef,
      parentContractSha256: input.parentContractSha256,
      addendumSha256,
      sequenceNumber: input.sequenceNumber,
      generatedAt: generatedAtDate.toISOString(),
      locale: isTr ? "tr" : "en",
      markdown,
      plainText: markdown.replace(/[#*`_]/g, ""),
      htmlContent,
    };
  }
}
