import { DossierZipBuilder } from "../dossier-zip-builder";
import type {
  DossierPartyInfo,
  EvidenceFileItem,
  LegalDossierManifest,
} from "../dossier-types";

export class DossierExportService {
  /**
   * Generates official Markdown index and manifest for the evidentiary dossier.
   */
  static generateManifestMarkdown(data: {
    dossierRef: string;
    engagementId: string;
    listingTitle: string;
    client: DossierPartyInfo;
    contractor: DossierPartyInfo;
    generatedAt: string;
    locale: "tr" | "en";
    masterDossierSha256: string;
    documents: EvidenceFileItem[];
    disputeStatus: string;
  }): string {
    const isTr = data.locale === "tr";
    const dateFormatted = new Date(data.generatedAt).toLocaleString(isTr ? "tr-TR" : "en-US");

    if (isTr) {
      return `# T.C. ARABULUCULUK BÜROSU VE MAHKEMELERİ NEZDİNDE HMK m. 193 RESMİ ADLİ DELİL DOSYASI

**Delil Dosyası Referansı:** \`${data.dossierRef}\`  
**Tanzim Tarihi ve Saati:** ${dateFormatted}  
**Uyuşmazlık Konusu Proje:** ${data.listingTitle}  
**Mevzuat Dayanağı:** 6100 sayılı HMK m. 193 (Delil Sözleşmesi), m. 199 (Elektronik Belge), m. 205 ve 6325 sayılı Kanun m. 18  
**Master SHA-256 Kök Parmak İzi:** \`${data.masterDossierSha256}\`

---

### 1. TARAFLARIN KİMLİK VE İLETİŞİM BİLGİLERİ

1. **İŞ SAHİBİ (MÜŞTERİ):**
   - **Adı / Unvanı:** ${data.client.displayName}
   - **Vergi / TC Kimlik No:** ${data.client.taxOrIdNumber || "—"}
   - **E-posta Adresi:** ${data.client.email}
   - **Telefon:** ${data.client.phone || "—"}
   - **Yerleşim Yeri:** ${data.client.city || "—"}

2. **YÜKLENİCİ (GELİŞTİRİCİ):**
   - **Adı / Unvanı:** ${data.contractor.displayName}
   - **Vergi / TC Kimlik No:** ${data.contractor.taxOrIdNumber || "—"}
   - **E-posta Adresi:** ${data.contractor.email}
   - **Telefon:** ${data.contractor.phone || "—"}
   - **Yerleşim Yeri:** ${data.contractor.city || "—"}

---

### 2. HUKUKİ NİTELİK VE HMK m. 193 DELİL SÖZLEŞMESİ ŞERHİ
İşbu Delil Dosyası; taraflar arasında akdedilen Bağımsız Yazılım Sözleşmesi'nin "Uyuşmazlık Çözümü ve Delil Sözleşmesi" maddesi gereğince, 6100 sayılı Hukuk Muhakemeleri Kanunu'nun (HMK) 193. maddesi uyarınca **münhasır ve kesin delil** teşkil etmek üzere Operis platformu tarafından otomatik olarak tanzim edilmiştir.

Dosyada yer alan tüm sözleşme metinleri, kabul kriterleri, revizyon logları, Git commit özetleri ve zaman damgalı işlem kütükleri; değiştirilemez **SHA-256 kriptografik hash fonksiyonları** ile mühürlenmiş olup, GNU standart \`checksums.sha256\` dosyası üzerinden terminalden (\`sha256sum -c checksums.sha256\`) doğrulanabilir.

---

### 3. ADLİ DELİL LİSTESİ VE DİZİN TABLOSU

| Sıra | Delil Belgesi | Kategori | Yasal Dayanak | SHA-256 Dijital Mühür |
| :--- | :--- | :--- | :--- | :--- |
${data.documents
  .map(
    (d, i) =>
      `| ${i + 1} | **${d.title}**<br>\`${d.path}\` | \`${d.category}\` | ${d.legalGroundTr} | \`${d.sha256.slice(0, 16)}...\` |`
  )
  .join("\n")}

---

### 4. BÜTÜNLÜK DOĞRULAMA VE BİLİRKİŞİ REHBERİ
Hakimler, mahkeme heyeti ve bilirkişiler; işbu dosyanın orijinalliğini ve üzerinde herhangi bir oynama yapılmadığını şu yöntemlerle bağımsız olarak teyit edebilir:
1. Arşiv içerisindeki \`checksums.sha256\` dosyası açılır.
2. Terminal üzerinden \`sha256sum -c checksums.sha256\` çalıştırıldığında her bir dosya için \`OK\` çıktısı alınmalıdır.
3. Dosyaların tamamının SHA-256 listesinden üretilen **Master Kök Özeti:** \`${data.masterDossierSha256}\` ile eşleşmelidir.
`;
    }

    return `# STATUTORY LEGAL EVIDENCE & MEDIATION DOSSIER (HMK ART. 193 & MEDIATION LAW)

**Dossier Reference:** \`${data.dossierRef}\`  
**Generated Timestamp:** ${dateFormatted}  
**Listing Title:** ${data.listingTitle}  
**Master SHA-256 Root Digest:** \`${data.masterDossierSha256}\`

### 1. PARTIES
- **Client:** ${data.client.displayName} (${data.client.email})
- **Contractor:** ${data.contractor.displayName} (${data.contractor.email})

### 2. STATUTORY EVIDENCE AGREEMENT (HMK ART. 193)
This Dossier constitutes binding evidentiary proof pursuant to Turkish Code of Civil Procedure (HMK) Art. 193 and Mediation Law No. 6325 Art. 18.
`;
  }

  /**
   * Generates a unified court-ready print HTML document combining all exhibits.
   */
  static generateUnifiedDossierHtml(manifest: LegalDossierManifest): string {
    const isTr = manifest.locale === "tr";
    const dateFormatted = new Date(manifest.generatedAt).toLocaleString(isTr ? "tr-TR" : "en-US");

    return `<!DOCTYPE html>
<html lang="${manifest.locale}">
<head>
  <meta charset="utf-8">
  <title>Operis Adli Delil Dosyası - ${manifest.dossierRef}</title>
  <style>
    @page { size: A4; margin: 15mm 15mm 20mm 15mm; }
    body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; font-size: 9pt; line-height: 1.45; color: #0f172a; margin: 0; padding: 15px; }
    .court-header { border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
    .court-title { font-size: 13pt; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
    .court-subtitle { font-size: 8.5pt; color: #475569; margin-top: 2px; }
    .meta-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; font-size: 8pt; text-align: right; }
    .party-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 12px 0; }
    .party-card { border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; background: #ffffff; }
    .party-card h4 { margin: 0 0 6px 0; font-size: 8.5pt; color: #1e293b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .seal-box { background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 10px; margin: 12px 0; }
    .seal-title { font-size: 8.5pt; font-weight: 700; color: #166534; display: flex; align-items: center; gap: 6px; }
    .seal-hash { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 8pt; color: #14532d; word-break: break-all; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 8pt; }
    th { background: #e2e8f0; border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; font-weight: 700; color: #1e293b; }
    td { border: 1px solid #cbd5e1; padding: 6px 8px; vertical-align: top; }
    tr:nth-child(even) { background: #f8fafc; }
    .section-title { font-size: 10pt; font-weight: 700; color: #0f172a; margin-top: 18px; margin-bottom: 6px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; break-after: avoid-page; page-break-after: avoid; }
    .statutory-notice { font-size: 7.5pt; color: #64748b; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 8px; text-align: justify; break-inside: avoid; page-break-inside: avoid; }
    p, li { orphans: 3; widows: 3; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
      .page-break { page-break-before: always; break-before: page; }
      .court-header, .court-title, .section-title, h1, h2, h3, h4 { break-after: avoid-page !important; page-break-after: avoid !important; }
      .party-grid, .party-card, .seal-box, table, tr, .meta-box { break-inside: avoid !important; page-break-inside: avoid !important; }
    }
  </style>
</head>
<body>
  <div class="court-header">
    <div>
      <div class="court-title">⚖️ ${isTr ? "T.C. Uyuşmazlık Arabuluculuk Bürosu & Mahkemeleri Delil Dosyası" : "Statutory Evidence & Mediation Dossier (HMK Art. 193)"}</div>
      <div class="court-subtitle">6100 Sayılı Hukuk Muhakemeleri Kanunu m. 193 Uyarınca Münhasır Delil Manifestosu</div>
    </div>
    <div class="meta-box">
      <div>Referans: <strong>${manifest.dossierRef}</strong></div>
      <div>Tarih: <strong>${dateFormatted}</strong></div>
      <div>Uyuşmazlık Durumu: <strong>${manifest.disputeStatus}</strong></div>
    </div>
  </div>

  <div class="party-grid">
    <div class="party-card">
      <h4>${isTr ? "İŞ SAHİBİ (MÜŞTERİ)" : "CLIENT"}</h4>
      <div><strong>${manifest.client.displayName}</strong></div>
      <div>VKN / TCKN: ${manifest.client.taxOrIdNumber || "—"}</div>
      <div>E-posta: ${manifest.client.email}</div>
      <div>Telefon: ${manifest.client.phone || "—"}</div>
      <div>Yerleşim: ${manifest.client.city || "—"}</div>
    </div>
    <div class="party-card">
      <h4>${isTr ? "YÜKLENİCİ (GELİŞTİRİCİ)" : "CONTRACTOR"}</h4>
      <div><strong>${manifest.contractor.displayName}</strong></div>
      <div>VKN / TCKN: ${manifest.contractor.taxOrIdNumber || "—"}</div>
      <div>E-posta: ${manifest.contractor.email}</div>
      <div>Telefon: ${manifest.contractor.phone || "—"}</div>
      <div>Yerleşim: ${manifest.contractor.city || "—"}</div>
    </div>
  </div>

  <div class="seal-box">
    <div class="seal-title">🔒 MASTER DELİL KÖK MÜHRÜ (SHA-256 ROOT HASH)</div>
    <div class="seal-hash">${manifest.masterDossierSha256}</div>
    <div style="font-size: 7.5pt; color: #15803d; margin-top: 4px;">
      ${
        isTr
          ? "Dosyadaki tüm evrakların kriptografik parmak izleri birleştirilerek tek kök karma oluşturulmuştur. Bilirkişi ve mahkeme heyeti arşivdeki 'checksums.sha256' dosyasıyla tahrifat kontrolünü anında gerçekleştirebilir."
          : "Master root hash sealing all evidentiary exhibits. Verified against checksums.sha256."
      }
    </div>
  </div>

  <div class="section-title">${isTr ? "RESMİ ADLİ DELİL LİSTESİ VE DİZİN İNDEKSİ" : "OFFICIAL EVIDENCE EXHIBITS INDEX"}</div>
  <table>
    <thead>
      <tr>
        <th style="width: 35px;">No</th>
        <th>Delil Belgesi & Arşiv Yolu</th>
        <th style="width: 130px;">Kategori</th>
        <th style="width: 170px;">Yasal Dayanak</th>
        <th style="width: 130px;">SHA-256 Özeti</th>
      </tr>
    </thead>
    <tbody>
      ${manifest.documents
        .map(
          (d, idx) => `<tr>
        <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
        <td><strong>${d.title}</strong><br><span style="font-family: monospace; font-size: 7.5pt; color: #475569;">${d.path}</span></td>
        <td><span style="background: #f1f5f9; padding: 2px 5px; border-radius: 4px; font-size: 7pt;">${d.category}</span></td>
        <td style="font-size: 7.5pt;">${d.legalGroundTr}</td>
        <td style="font-family: monospace; font-size: 7pt; word-break: break-all;">${d.sha256.slice(0, 16)}...</td>
      </tr>`
        )
        .join("")}
    </tbody>
  </table>

  <div class="statutory-notice">
    <strong>HMK m. 193 Yasal Şerhi:</strong> İşbu resmi delil dosyası ve ekleri; taraflar arasındaki sözleşme hükümleri uyarınca 6100 sayılı Hukuk Muhakemeleri Kanunu m. 193 (Delil Sözleşmesi), m. 199 (Elektronik Belge) ve 6325 sayılı Arabuluculuk Kanunu m. 18 uyarınca taraflar nezdinde kesin delil niteliğindedir. Operis platformu tarafından bağımsız ve tarafsız olarak kriptografik yöntemlerle üretilmiştir.
  </div>
</body>
</html>`;
  }

  /**
   * Compiles the deterministic PKZip archive for all evidence documents.
   */
  static buildZipArchive(documents: EvidenceFileItem[], dossierRef: string): Buffer {
    const zipBuilder = new DossierZipBuilder();
    const folderPrefix = `OPERIS_DELIL_DOSYASI_${dossierRef}`;

    for (const doc of documents) {
      zipBuilder.addFile(`${folderPrefix}/${doc.path}`, doc.content, new Date(doc.createdAt));
    }

    return zipBuilder.build();
  }
}
