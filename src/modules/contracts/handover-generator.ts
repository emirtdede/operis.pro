import { createHash } from "crypto";
import { HandoverParty, AccessTransferChecklist } from "./types";
import type { DeliveryHealthReport } from "@/src/modules/engagements/delivery-inspector";

export interface HandoverProtocolInput {
  engagementId: string;
  contractRef?: string;
  listingTitle: string;
  category: string;
  client: HandoverParty;
  contractor: HandoverParty;
  repositoryUrl: string;
  commitHash?: string | null;
  liveUrl?: string | null;
  deliveryHealth?: DeliveryHealthReport | null;
  accessChecklist: AccessTransferChecklist;
  documentationNotes: string;
  status: "SUBMITTED" | "ACCEPTED_EXPRESS" | "ACCEPTED_TACIT" | "REVISION_REQUESTED";
  acceptanceType?: "EXPRESS" | "TACIT" | null;
  submittedAt: Date | string;
  inspectionExpiresAt: Date | string;
  acceptedAt?: Date | string | null;
  revisionNotes?: string | null;
  totalAgreedBudget?: string | null;
  currency?: string | null;
  locale?: "tr" | "en";
}

export interface GeneratedHandoverResult {
  protocolRef: string;
  sha256Seal: string;
  generatedAt: string;
  locale: "tr" | "en";
  markdown: string;
  htmlContent: string;
  plainText: string;
  metadata: {
    tbk474ClauseIncluded: boolean;
    tbk477TacitClauseIncluded: boolean;
    fsekFinalTransferIncluded: boolean;
    sha256Verified: boolean;
  };
}

export class HandoverGeneratorService {
  /**
   * Generates a deterministic SHA-256 hash for handover protocol fingerprinting.
   */
  static calculateSha256(content: string): string {
    return createHash("sha256").update(content, "utf8").digest("hex");
  }

  /**
   * Generates official Bilateral Software Handover & Acceptance Protocol under TBK m. 474 / 477.
   */
  static generateProtocol(input: HandoverProtocolInput): GeneratedHandoverResult {
    const isTr = (input.locale || "tr") === "tr";
    const engagementShort = input.engagementId.replace(/-/g, "").slice(0, 8).toUpperCase();
    const protocolRef = `OPR-TESLIM-${engagementShort}`;
    const contractRef = input.contractRef || `OPR-CONTR-${engagementShort}`;
    const generatedAtDate = new Date();

    const submittedDateFormatted = new Date(input.submittedAt).toLocaleDateString(
      isTr ? "tr-TR" : "en-US",
      { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }
    );

    const inspectionExpiryFormatted = new Date(input.inspectionExpiresAt).toLocaleDateString(
      isTr ? "tr-TR" : "en-US",
      { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }
    );

    let acceptedDateFormatted = isTr
      ? "Henüz Onaylanmadı (Muayene Sürecinde)"
      : "Pending Inspection";
    if (input.acceptedAt) {
      acceptedDateFormatted = new Date(input.acceptedAt).toLocaleDateString(
        isTr ? "tr-TR" : "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    }

    const generatedDateFormatted = generatedAtDate.toLocaleDateString(
      isTr ? "tr-TR" : "en-US",
      { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }
    );

    const clientName = input.client.displayName || "İşveren / Client";
    const clientEmail = input.client.email || "—";
    const clientPhone = input.client.phone || (isTr ? "Gizli / Eşleşme Onaylı" : "Private / Verified");

    const contractorName = input.contractor.displayName || "Yüklenici / Freelancer";
    const contractorEmail = input.contractor.email || "—";
    const contractorPhone = input.contractor.phone || (isTr ? "Gizli / Eşleşme Onaylı" : "Private / Verified");

    const ACCEPTANCE_LABELS = {
      tr: {
        ACCEPTED_EXPRESS: "Açık Kabul Beyanı (TBK m. 477/1 - Express Acceptance)",
        ACCEPTED_TACIT: "Zımni/Örtülü Yasal Kabul (TBK m. 477/2 - Yasal Muayene Süresinde İtiraz Edilmeyerek)",
        REVISION_REQUESTED: "Revizyon / Ayıp İnceleme Talebi (TBK m. 474)",
        DEFAULT: "Teslim Edildi, Muayene Aşamasında (TBK m. 474)",
      },
      en: {
        ACCEPTED_EXPRESS: "Express Acceptance (TBK Art. 477/1)",
        ACCEPTED_TACIT: "Tacit Statutory Acceptance (TBK Art. 477/2 - Inspection Window Expired Without Dispute)",
        REVISION_REQUESTED: "Defect Revision Notice (TBK Art. 474)",
        DEFAULT: "Submitted, In Inspection Window (TBK Art. 474)",
      },
    };
    const lang = isTr ? "tr" : "en";
    const acceptanceTypeLabel =
      ACCEPTANCE_LABELS[lang][input.status as keyof (typeof ACCEPTANCE_LABELS)["tr"]] ??
      ACCEPTANCE_LABELS[lang].DEFAULT;

    const resolveTransferStatus = (transferred: boolean, customTransferredText?: string) => {
      if (transferred) {
        if (customTransferredText) return customTransferredText;
        return isTr ? "Eksiksiz Devredildi" : "Transferred";
      }
      return isTr ? "Gerekli Görülmedi / Kapsam Dışı" : "Not Required / N/A";
    };

    const dnsStatus = resolveTransferStatus(input.accessChecklist.dnsTransferred);
    const hostingStatus = resolveTransferStatus(input.accessChecklist.hostingTransferred);
    const adminStatus = resolveTransferStatus(input.accessChecklist.adminAccountsTransferred);
    const apiKeysStatus = resolveTransferStatus(
      input.accessChecklist.apiKeysTransferred,
      isTr ? "Eksiksiz Devredildi (.env güvenli teslim)" : "Transferred (.env secure handover)"
    );

    const canonicalText = `OPERIS-HANDOVER-PROTOCOL-CANONICAL-V1|ENG:${input.engagementId}|REF:${protocolRef}|CONTR:${contractRef}|TITLE:${input.listingTitle}|CLIENT:${clientName}:${clientEmail}|CONTR:${contractorName}:${contractorEmail}|REPO:${input.repositoryUrl}|COMMIT:${input.commitHash || "HEAD"}|LIVE:${input.liveUrl || "N/A"}|STATUS:${input.status}|SUBMITTED:${new Date(input.submittedAt).toISOString()}|EXPIRES:${new Date(input.inspectionExpiresAt).toISOString()}|ACCEPTED:${input.acceptedAt ? new Date(input.acceptedAt).toISOString() : "PENDING"}`;

    const sha256Seal = this.calculateSha256(canonicalText);

    let markdown: string;
    if (isTr) {
      markdown = `# TÜRK BORÇLAR KANUNU (TBK M. 474 VE M. 477) VE 5846 SAYILI FSEK UYARINCA
# RESMİ YAZILIM ESERİ TESLİM-TESELLÜM VE KABUL TUTANAĞI

**Tutanak Referans No:** \`${protocolRef}\`  
**Dayanak Hizmet Sözleşmesi:** \`${contractRef}\`  
**Eşleşme Kimliği:** \`${input.engagementId}\`  
**Proje Adı:** ${input.listingTitle}  
**Kategori:** ${input.category}  
**Teslimat Tarihi:** ${submittedDateFormatted}  
**TBK m. 474 Yasal Muayene Bitiş Tarihi:** ${inspectionExpiryFormatted}  
**Kabul Tarihi:** ${acceptedDateFormatted}  
**Kabul ve Geçerlilik Durumu:** **${acceptanceTypeLabel}**  
**HMK m. 193 Dijital Teslimat Mührü (SHA-256):** \`${sha256Seal}\`  

---

### TARAFLAR

**1. İŞVEREN (İŞ SAHİBİ):**
- **Ad Soyad / Unvan:** ${clientName}
- **Kullanıcı Tanıtıcısı:** @${input.client.handle || "isveren"}
- **E-Posta:** ${clientEmail}
- **İletişim / Tel:** ${clientPhone}
- **Konum / Şehir:** ${input.client.city || "Türkiye"}

**2. YÜKLENİCİ (SERBEST ÇALIŞAN UZMAN):**
- **Ad Soyad / Unvan:** ${contractorName}
- **Kullanıcı Tanıtıcısı:** @${input.contractor.handle || "yuklenici"}
- **E-Posta:** ${contractorEmail}
- **İletişim / Tel:** ${contractorPhone}
- **Konum / Şehir:** ${input.contractor.city || "Türkiye"}

---

### MADDE 1 — TESLİM EDİLEN DİJİTAL ÇIKTILAR VE KAYNAK KODLAR
Yüklenici, dayanak sözleşme kapsamında taahhüt edilen yazılım ve tasarım eserine ait tüm çıktıları işbu tutanağın tanzim tarihi itibarıyla İşveren'e eksiksiz sunduğunu beyan eder:
- **Kaynak Kod Deposu (Git Repository):** [${input.repositoryUrl}](${input.repositoryUrl})
- **Sürüm / Commit / Tag Bilgisi:** \`${input.commitHash || "HEAD (Güncel Dağıtım Sürümü)"}\`
- **Çalışır Canlı / Dağıtım Ortamı:** ${input.liveUrl ? `[${input.liveUrl}](${input.liveUrl})` : "Sözleşme gereği lokal/arşiv teslimi"}
${input.deliveryHealth ? `- **Canlı Sistem Sağlık Denetimi (Proof-of-Work / Uptime):** ${input.deliveryHealth.badgeTextTr}  \n  *(PoW Denetim Mührü: \`${input.deliveryHealth.powSeal.slice(0, 24)}...\`)*\n` : ""}- **Teknik Kurulum & Devir Notları:**  
${input.documentationNotes || "README ve standart teknik dağıtım kılavuzu depo içerisinde teslim edilmiştir."}

---

### MADDE 2 — ERİŞİM VE ALTYAPI DEVİR KONTROL LİSTESİ
- **Alan Adı / DNS Yönetim Erişimleri:** ${dnsStatus}
- **Sunucu / Bulut (Cloud/Hosting) Yetkileri:** ${hostingStatus}
- **Yönetici (Admin/Superuser) Hesapları:** ${adminStatus}
- **Gizli Anahtarlar ve API Entegrasyonları (.env):** ${apiKeysStatus}

---

### MADDE 3 — TBK M. 474 UYARINCA MUAYENE VE İHBAR REJİMİ
1. 6098 sayılı Türk Borçlar Kanunu’nun 474. maddesi uyarınca İşveren, eserin tesliminden itibaren işlerin olağan akışına göre imkân bulur bulmaz eseri gözden geçirmekle ve varsa ayıpları Yüklenici'ye süresi içinde bildirmekle mükelleftir.
2. Taraflar, dayanak sözleşmede kabul ettikleri üzere **muayene ve kabul test süresinin azami 7 (yedi) iş günü (en geç ${inspectionExpiryFormatted})** olduğunu peşinen kabul etmişlerdir.

---

### MADDE 4 — TBK M. 477 UYARINCA ESERİN KABULÜ VE SORUMLULUĞUN DÜŞMESİ
1. **Açık veya Örtülü (Zımni) Kabul:** Eserin İşveren tarafından açıkça onaylanması veya TBK m. 477/2 gereğince 7 iş günlük yasal muayene süresi içinde Yüklenici'ye haklı ve somut bir ayıp bildiriminde bulunulmaması halinde, **eser kanunen zımnen kabul edilmiş sayılır**.
2. **Sorumluluğun Sona Ermesi:** TBK m. 477/1 hükmü uyarınca, eserin açıkça veya örtülü olarak kabulüyle birlikte Yüklenici eserin ayıplarından doğan her türlü sorumluluktan kurtulur. Yüklenici tarafından kasten gizlenen ayıplar saklıdır.
${input.revisionNotes ? `\n> **Muayene Notu / Revizyon Şerhi:** ${input.revisionNotes}\n` : ""}

---

### MADDE 5 — 5846 SAYILI FSEK M. 52 MALİ HAKLARIN KESİN İNTİKALİ
Dayanak sözleşmenin ilgili hükümleri ve işbu Teslim-Tesellüm Tutanağı uyarınca; kararlaştırılan proje bedelinin Yüklenici'ye ödenmesiyle birlikte, 5846 sayılı Fikir ve Sanat Eserleri Kanunu’nun 21, 22, 23, 24 ve 25. maddelerinde düzenlenen mali haklar (İşleme, Çoğaltma, Yayma, Temsil, Umuma İletim) herhangi bir ek protokole gerek kalmaksızın kesin ve gayrikabili rücu olarak İşveren’e intikal eder.

---

### MADDE 6 — 30 GÜNLÜK HATA GİDERME VE TEKNİK DESTEK
Yüklenici, işbu kabul tarihinden itibaren **30 (otuz) gün süreyle**, teslim edilen kodlarda ortaya çıkabilecek ve sözleşme kapsamındaki teknik gereksinimlere aykırılık teşkil eden kritik yazılım hatalarını (bugs) ek ücret talep etmeksizin gidereceğini taahhüt eder. Yeni özellik talepleri kapsam dışıdır.

---

### MADDE 7 — HMK M. 193 ELEKTRONİK DELİL SÖZLEŞMESİ VE DİJİTAL MÜHÜR
İşbu tutanak ve içeriği, 6100 sayılı Hukuk Muhakemeleri Kanunu m. 193 uyarınca münhasır delil niteliğinde olup, içeriğin kanonik özeti **SHA-256: \`${sha256Seal}\`** kriptografik algoritması ile mühürlenmiştir. Taraflar, Operis platform kayıtlarının kesin delil teşkil edeceğini kabul eder.

**DÜZENLEME TARİHİ:** ${generatedDateFormatted}  
**DİJİTAL MÜHÜR (SHA-256):** \`${sha256Seal}\``;
    } else {
      markdown = `# OFFICIAL SOFTWARE HANDOVER & STATUTORY ACCEPTANCE PROTOCOL
### PURSUANT TO TURKISH CODE OF OBLIGATIONS (TBK ART. 474 & 477) & STATUTORY COPYRIGHT (FSEK ART. 52)

**Protocol Ref:** \`${protocolRef}\`  
**Master Contract Ref:** \`${contractRef}\`  
**Engagement ID:** \`${input.engagementId}\`  
**Project Title:** ${input.listingTitle}  
**Category:** ${input.category}  
**Handover Submission Date:** ${submittedDateFormatted}  
**TBK Art. 474 Inspection Expiry:** ${inspectionExpiryFormatted}  
**Final Acceptance Date:** ${acceptedDateFormatted}  
**Acceptance Status:** **${acceptanceTypeLabel}**  
**Digital Cryptographic Seal (SHA-256):** \`${sha256Seal}\`  

---

### PARTIES

**1. CLIENT:**
- **Name / Entity:** ${clientName}
- **Handle:** @${input.client.handle || "client"}
- **Email:** ${clientEmail}
- **Contact / Phone:** ${clientPhone}
- **Location:** ${input.client.city || "International"}

**2. CONTRACTOR (SOFTWARE SPECIALIST):**
- **Name / Entity:** ${contractorName}
- **Handle:** @${input.contractor.handle || "contractor"}
- **Email:** ${contractorEmail}
- **Contact / Phone:** ${contractorPhone}
- **Location:** ${input.contractor.city || "International"}

---

### ARTICLE 1 — DELIVERABLES & SOURCE REPOSITORY HANDOVER
The Contractor certifies that all agreed deliverables and source code have been transferred to the Client:
- **Repository URL:** [${input.repositoryUrl}](${input.repositoryUrl})
- **Release / Commit Tag:** \`${input.commitHash || "HEAD (Latest Deployment Release)"}\`
- **Live / Staging Deployment:** ${input.liveUrl ? `[${input.liveUrl}](${input.liveUrl})` : "Local / Source Archive Handover"}
${input.deliveryHealth ? `- **Live System Health Inspection (Proof-of-Work / Uptime):** ${input.deliveryHealth.badgeTextEn}  \n  *(PoW Inspection Seal: \`${input.deliveryHealth.powSeal.slice(0, 24)}...\`)*\n` : ""}- **Technical Handover Notes:**  
${input.documentationNotes || "README and deployment instructions are included in the repository."}

---

### ARTICLE 2 — CREDENTIALS & INFRASTRUCTURE TRANSFER
- **Domain & DNS Management:** ${dnsStatus}
- **Server & Cloud Permissions:** ${hostingStatus}
- **Administrator Superuser Accounts:** ${adminStatus}
- **API Keys & Environment Secrets (.env):** ${apiKeysStatus}

---

### ARTICLE 3 — STATUTORY INSPECTION REGIME (TBK ART. 474)
Under Article 474 of the Turkish Code of Obligations (TBK), the Client is obligated to inspect the delivered work promptly in accordance with regular business practice. The agreed inspection window is **7 business days (expiring on ${inspectionExpiryFormatted})**.

---

### ARTICLE 4 — DISCHARGE OF LIABILITY VIA ACCEPTANCE (TBK ART. 477)
1. **Express or Tacit Acceptance:** If the Client explicitly approves this protocol, or fails to file a defect objection before the inspection window expires, **the work is deemed accepted by law (TBK Art. 477/2 - Tacit Acceptance)**.
2. **Discharge:** Upon express or tacit acceptance, the Contractor is fully released from liability for defects in accordance with TBK Art. 477/1, except for defects fraudulently concealed.

---

### ARTICLE 5 — INTELLECTUAL PROPERTY & ECONOMIC RIGHTS TRANSFER
Upon complete payment of the agreed consideration, all exclusive economic rights under Articles 21-25 of the Copyright Law No. 5846 are irrevocably assigned to the Client.

---

### ARTICLE 6 — 30-DAY CRITICAL BUG WARRANTY
The Contractor provides a 30-day warranty starting from the acceptance date to resolve critical reproducible defects without additional charge.

---

### ARTICLE 7 — EVIDENCE AGREEMENT (HMK ART. 193) & SHA-256 SEAL
This document constitutes conclusive evidence under HMK Art. 193, sealed deterministically with **SHA-256: \`${sha256Seal}\`**.

**ISSUANCE DATE:** ${generatedDateFormatted}  
**DIGITAL SEAL (SHA-256):** \`${sha256Seal}\``;
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="${isTr ? "tr" : "en"}">
<head>
<meta charset="utf-8">
<title>${protocolRef} - ${isTr ? "Resmi Teslim-Tesellüm ve Kabul Tutanağı" : "Official Handover & Acceptance Protocol"}</title>
<style>
  @page { size: A4; margin: 20mm 15mm; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #1e293b; background: #ffffff; margin: 0; padding: 0; }
  .protocol-card { max-width: 800px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 20px; }
  .brand { font-size: 20pt; font-weight: 800; color: #0284c7; letter-spacing: -0.5px; }
  .brand-sub { font-size: 8.5pt; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
  .meta-right { text-align: right; font-size: 9pt; color: #475569; }
  .meta-right strong { color: #0f172a; font-family: monospace; }
  .title-block { text-align: center; margin: 20px 0 25px 0; break-after: avoid-page; page-break-after: avoid; }
  .title-block h1 { font-size: 14pt; font-weight: 800; color: #0f172a; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.3; break-after: avoid-page; page-break-after: avoid; }
  .title-block p { font-size: 9pt; color: #0369a1; margin: 0; font-weight: 700; text-transform: uppercase; }
  .seal-box { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 10px 14px; margin: 15px 0; display: flex; justify-content: space-between; align-items: center; break-inside: avoid; page-break-inside: avoid; }
  .seal-label { font-size: 8pt; text-transform: uppercase; font-weight: 700; color: #166534; }
  .seal-hash { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 8pt; color: #0f172a; word-break: break-all; font-weight: 600; }
  .section-title { font-size: 11pt; font-weight: 700; color: #0369a1; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin: 20px 0 10px 0; text-transform: uppercase; letter-spacing: 0.2px; break-after: avoid-page !important; page-break-after: avoid !important; }
  .parties-table, .deliverables-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 9.5pt; break-inside: avoid; page-break-inside: avoid; }
  .parties-table td { width: 50%; vertical-align: top; padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; }
  .deliverables-table th { background: #f1f5f9; text-align: left; padding: 6px 10px; font-weight: 700; border: 1px solid #cbd5e1; font-size: 8.5pt; }
  .deliverables-table td { padding: 6px 10px; border: 1px solid #cbd5e1; font-size: 9pt; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  p, li { font-size: 9.5pt; color: #334155; line-height: 1.5; margin: 0 0 8px 0; orphans: 3; widows: 3; }
  ol { margin: 0; padding-left: 20px; }
  .signatures { display: flex; justify-content: space-between; margin-top: 35px; page-break-inside: avoid; break-inside: avoid; }
  .sig-block { width: 45%; border-top: 1px dashed #94a3b8; padding-top: 8px; font-size: 9pt; break-inside: avoid; page-break-inside: avoid; }
  .badge-status { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 8.5pt; font-weight: 700; background: #e0f2fe; color: #0369a1; }
  @media print {
    body { font-size: 10pt; }
    .no-print { display: none; }
    .section-title, .title-block, h1, h2, h3 { break-after: avoid-page !important; page-break-after: avoid !important; }
    .parties-table, .deliverables-table, .signatures, .seal-box, tr { break-inside: avoid !important; page-break-inside: avoid !important; }
  }
</style>
</head>
<body>
<div class="protocol-card">
  <div class="header">
    <div>
      <div class="brand">OPERIS</div>
      <div class="brand-sub">${isTr ? "Doğrulanmış İş Teslimat & Kabul Protokolü" : "Verified Handover & Acceptance Protocol"}</div>
    </div>
    <div class="meta-right">
      <div>${isTr ? "Tutanak No:" : "Protocol Ref:"} <strong>${protocolRef}</strong></div>
      <div>${isTr ? "Dayanak Sözleşme:" : "Master Contract:"} <strong>${contractRef}</strong></div>
      <div>${isTr ? "Tarih:" : "Date:"} ${generatedDateFormatted}</div>
    </div>
  </div>

  <div class="title-block">
    <h1>${isTr ? "TÜRK BORÇLAR KANUNU (TBK M. 474-477) VE FSEK M. 52 UYARINCA" : "PURSUANT TO TBK ART. 474-477 & FSEK ART. 52"}</h1>
    <h1>${isTr ? "RESMİ YAZILIM ESERİ TESLİM-TESELLÜM VE KABUL TUTANAĞI" : "OFFICIAL SOFTWARE HANDOVER & ACCEPTANCE PROTOCOL"}</h1>
    <p>${input.listingTitle} (${input.category})</p>
  </div>

  <div class="seal-box">
    <div>
      <div class="seal-label">${isTr ? "HMK m. 193 Uyarınca Dijital Teslimat Mührü" : "HMK Art. 193 Digital Delivery Seal"}</div>
      <div class="seal-hash">${sha256Seal}</div>
    </div>
    <div class="badge-status">${input.status}</div>
  </div>

  <div class="section-title">${isTr ? "Taraflar" : "Parties"}</div>
  <table class="parties-table">
    <tr>
      <td>
        <strong>${isTr ? "İŞVEREN (İŞ SAHİBİ)" : "CLIENT"}:</strong><br>
        <strong>${clientName}</strong> (@${input.client.handle || "isveren"})<br>
        ${isTr ? "E-Posta:" : "Email:"} ${clientEmail}<br>
        ${isTr ? "Tel:" : "Phone:"} ${clientPhone}<br>
        ${isTr ? "Şehir:" : "City:"} ${input.client.city || "Türkiye"}
      </td>
      <td>
        <strong>${isTr ? "YÜKLENİCİ (FREELANCER)" : "CONTRACTOR"}:</strong><br>
        <strong>${contractorName}</strong> (@${input.contractor.handle || "yuklenici"})<br>
        ${isTr ? "E-Posta:" : "Email:"} ${contractorEmail}<br>
        ${isTr ? "Tel:" : "Phone:"} ${contractorPhone}<br>
        ${isTr ? "Şehir:" : "City:"} ${input.contractor.city || "Türkiye"}
      </td>
    </tr>
  </table>

  <div class="section-title">${isTr ? "1. Teslim Edilen Çıktılar ve Kaynak Kodlar" : "1. Deliverables & Repository"}</div>
  <table class="deliverables-table">
    <tr>
      <th style="width: 30%;">${isTr ? "Bileşen" : "Component"}</th>
      <th>${isTr ? "Teslim Detayı & Bağlantı" : "Details & Link"}</th>
    </tr>
    <tr>
      <td>${isTr ? "Kaynak Kod Deposu" : "Source Code Repo"}</td>
      <td><strong>${input.repositoryUrl}</strong></td>
    </tr>
    <tr>
      <td>${isTr ? "Commit / Tag Sürümü" : "Commit / Tag Version"}</td>
      <td><code>${input.commitHash || "HEAD"}</code></td>
    </tr>
    <tr>
      <td>${isTr ? "Canlı / Dağıtım Ortamı" : "Live Deployment"}</td>
      <td>${input.liveUrl || "—"}</td>
    </tr>
    ${input.deliveryHealth ? `
    <tr>
      <td>${isTr ? "Canlı Sistem Sağlık Denetimi (PoW)" : "Delivery Health Inspection (PoW)"}</td>
      <td>
        <span style="color: #10b981; font-weight: bold;">${isTr ? input.deliveryHealth.badgeTextTr : input.deliveryHealth.badgeTextEn}</span>
        <br><small style="color: #64748b; font-family: monospace;">PoW SHA-256: ${input.deliveryHealth.powSeal.slice(0, 32)}...</small>
      </td>
    </tr>` : ""}
    <tr>
      <td>${isTr ? "Devir Notları & Kurulum" : "Handover Notes"}</td>
      <td>${input.documentationNotes || "README"}</td>
    </tr>
  </table>

  <div class="section-title">${isTr ? "2. Erişim ve Yönetim Devir Listesi" : "2. Access Checklist"}</div>
  <table class="deliverables-table">
    <tr>
      <td style="width: 50%;">DNS / Alan Adı Yönetimi: <strong>${dnsStatus}</strong></td>
      <td style="width: 50%;">Sunucu / Bulut Yetkileri: <strong>${hostingStatus}</strong></td>
    </tr>
    <tr>
      <td>Yönetici (Admin) Hesapları: <strong>${adminStatus}</strong></td>
      <td>API Anahtarları & Gizli Veriler: <strong>${apiKeysStatus}</strong></td>
    </tr>
  </table>

  <div class="section-title">${isTr ? "3. Muayene ve Yasal Kabul Hükümleri" : "3. Inspection & Legal Acceptance"}</div>
  <p>${isTr
    ? `İşveren, TBK m. 474 uyarınca teslim tarihinden (${submittedDateFormatted}) itibaren 7 iş günü içinde (${inspectionExpiryFormatted} tarihine kadar) eseri muayene etmekle mükelleftir. Süre sonuna kadar haklı bir ayıp ihbarında bulunulmaması halinde eser TBK m. 477 uyarınca zımnen kabul edilmiş sayılır.`
    : `Client is obligated to inspect the work under TBK Art. 474 within 7 business days until ${inspectionExpiryFormatted}. Failure to notify defects within this window constitutes tacit statutory acceptance under TBK Art. 477.`}
  </p>
  <p><strong>${isTr ? "Mevcut Durum:" : "Current Status:"}</strong> ${acceptanceTypeLabel} (${acceptedDateFormatted})</p>

  <div class="signatures">
    <div class="sig-block">
      <strong>${isTr ? "İşveren / İş Sahibi" : "Client"}</strong><br>
      ${clientName}<br>
      <small style="color: #64748b;">${isTr ? "Eşleşme Onayı ve Kabul Beyanı" : "Verified Acceptance"}</small>
    </div>
    <div class="sig-block">
      <strong>${isTr ? "Yüklenici / Serbest Çalışan" : "Contractor"}</strong><br>
      ${contractorName}<br>
      <small style="color: #64748b;">${isTr ? "Dijital Teslim İmzası (SHA-256)" : "Digital Delivery Seal"}</small>
    </div>
  </div>
</div>
</body>
</html>`;

    return {
      protocolRef,
      sha256Seal,
      generatedAt: generatedDateFormatted,
      locale: isTr ? "tr" : "en",
      markdown,
      htmlContent,
      plainText: canonicalText,
      metadata: {
        tbk474ClauseIncluded: true,
        tbk477TacitClauseIncluded: true,
        fsekFinalTransferIncluded: true,
        sha256Verified: true,
      },
    };
  }
}
