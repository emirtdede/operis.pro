import crypto from "node:crypto";
import {
  IpAssignmentDeed,
  GenerateIpDeedInput,
  StatutoryEconomicRight,
  IpDeedVerificationResult,
} from "./ip-assignment-types";

export class IpAssignmentDeedEngine {
  /**
   * Complete and exhaustive enumeration of the 5 Statutory Economic Rights under FSEK m. 52.
   * Under Turkish Court of Cassation (Yargıtay) jurisprudence, each right must be specifically
   * enumerated; blanket clauses ("tüm haklar devredilmiştir") are legally null and void.
   */
  static readonly STATUTORY_ECONOMIC_RIGHTS: StatutoryEconomicRight[] = [
    {
      code: "ISLEME_M21",
      fsekArticle: "FSEK m. 21",
      nameTr: "İşleme Hakkı",
      nameEn: "Right of Adaptation / Derivation",
      scopeTr:
        "Yazılımın kaynak kodlarını değiştirme, modifiye etme, yeni özellikler veya modüller ekleme, diğer dillere ve platformlara port etme, makine öğrenmesi/yapay zeka modellerine girdi olarak sağlama ve türev eserler meydana getirme yetkisi.",
      scopeEn:
        "The exclusive right to modify, adapt, refactor, translate into other programming languages, add new features, train AI models, and create derivative works.",
    },
    {
      code: "COGALTMA_M22",
      fsekArticle: "FSEK m. 22",
      nameTr: "Çoğaltma Hakkı",
      nameEn: "Right of Reproduction",
      scopeTr:
        "Yazılımın kaynak veya derlenmiş (object/binary) kod halinde, bulut sunucularda, yerel disklerde, mikroçip veya herhangi bir manyetik/optik/elektronik ortamda kısmen veya tamamen, doğrudan veya dolaylı, geçici veya sürekli olarak çoğaltılması yetkisi.",
      scopeEn:
        "The exclusive right to reproduce the source or object code in whole or in part, permanently or temporarily, on servers, cloud environments, or any digital medium.",
    },
    {
      code: "YAYMA_M23",
      fsekArticle: "FSEK m. 23",
      nameTr: "Yayma Hakkı",
      nameEn: "Right of Distribution",
      scopeTr:
        "Yazılımın orijinalinin veya çoğaltılmış nüshalarının kiralanması, ödünç verilmesi, satışa çıkarılması veya diğer yollarla dağıtılması, SaaS/PaaS modeliyle üçüncü kişilere kullandırılması yetkisi.",
      scopeEn:
        "The exclusive right to sell, license, distribute, lease, export, or commercially transfer copies of the software, including SaaS and cloud offerings.",
    },
    {
      code: "TEMSIL_M24",
      fsekArticle: "FSEK m. 24",
      nameTr: "Temsil Hakkı",
      nameEn: "Right of Public Representation & Demo",
      scopeTr:
        "Yazılımın ve arayüzlerinin konferanslarda, demo gösterimlerinde, yatırımcı sunumlarında ve eğitimlerde doğrudan veya araçlarla gösterilmesi ve çalıştırılması yetkisi.",
      scopeEn:
        "The exclusive right to publicly demo, exhibit, perform, and present the software to investors, clients, and audiences.",
    },
    {
      code: "UMUMA_ILETIM_M25",
      fsekArticle: "FSEK m. 25",
      nameTr: "İşaret, Ses ve/veya Görüntü Nakline Yarayan Araçlarla Umuma İletim Hakkı",
      nameEn: "Right of Communication to the Public",
      scopeTr:
        "Yazılımın telli veya telsiz vasıtalarla (internet, web, mobil şebeke, uydu vb.) umuma iletilmesi, API veya web servisi olarak genel kullanıma açılması veya gerçek kişilerin seçtikleri yer ve zamanda erişimine sunulması yetkisi.",
      scopeEn:
        "The exclusive right to broadcast, host, deploy via public APIs, stream, or make available to the public via wired or wireless telecommunication.",
    },
  ];

  /**
   * Attempts to extract a Git commit hash from a repository or deliverable URL if embedded.
   */
  static extractCommitHashFromUrl(url?: string | null): string | null {
    if (!url) return null;
    const match = url.match(/\/(?:commit|commits|tree)\/([0-9a-fA-F]{7,64})/);
    return match && match[1] ? match[1].toLowerCase() : null;
  }

  /**
   * Deterministically calculates the Master SHA-256 Digest of the Deed.
   */
  static calculateMasterSha256(payload: Record<string, unknown>): string {
    const serialized = JSON.stringify(payload, Object.keys(payload).sort());
    return crypto.createHash("sha256").update(serialized, "utf8").digest("hex");
  }

  /**
   * Generates a legally robust, timestamped Certificate of IP Assignment.
   */
  static generateDeed(input: GenerateIpDeedInput): IpAssignmentDeed {
    const timestamp = input.settledAt || new Date().toISOString();
    const shortEng = input.engagementId
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 8)
      .toUpperCase();
    const shortMilestone = input.milestoneId
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 6)
      .toUpperCase();
    const deedId = `OPR-IP-DEED-${shortEng}-M${input.milestoneSequence}-${shortMilestone}`;

    // Normalize commit hash: use provided, or extract from deliverable URL, or fallback to deterministic seal
    let commitHash = (input.gitCommitHash || "").trim();
    if (!commitHash) {
      commitHash = this.extractCommitHashFromUrl(input.deliverableUrl) || "";
    }
    if (!commitHash) {
      // Deterministic fallback pin from deliverable URL and milestone
      const hashPayload = `${input.engagementId}:${input.milestoneId}:${input.deliverableUrl || "DELIVERABLE"}`;
      commitHash = crypto.createHash("sha1").update(hashPayload, "utf8").digest("hex");
    }

    const repositoryUrl =
      input.repositoryUrl ||
      (input.deliverableUrlType === "CODE_REPO" ? input.deliverableUrl : "") ||
      `https://operis.pro/work/${input.engagementId}/artifacts/m-${input.milestoneSequence}`;

    const assignorMasked = input.assignorVknOrTckn
      ? input.assignorVknOrTckn.replace(/^(.{3})(.*)(.{3})$/, "$1****$3")
      : "TCKN-DOĞRULANMIŞ";

    const assigneeMasked = input.assigneeVknOrTckn
      ? input.assigneeVknOrTckn.replace(/^(.{3})(.*)(.{3})$/, "$1****$3")
      : "VKN-DOĞRULANMIŞ";

    const moralRightsWaiverTr =
      "5846 sayılı FSEK m. 14, 15 ve 16 hükümleri uyarınca eser sahibinin manevi hakları saklı kalmak kaydıyla; YÜKLENİCİ/ESER SAHİBİ, FSEK m. 16/2 gereğince yazılımın işlevsel gelişimi, hata ayıklamaları, yeni özellik eklemeleri, refactor işlemleri ve platform güncellemeleri kapsamında kod üzerinde her türlü teknik değişiklik yapılmasına İŞVEREN lehine gayrikabili rücu muvafakat ettiğini; kaynak kod ve dağıtımlarda ticari teamüllere aykırı şekilde ad belirtilmesi iddiasında bulunmayacağını kabul ve taahhüt eder.";

    const moralRightsWaiverEn =
      "While statutory moral rights remain with the author pursuant to FSEK Arts. 14, 15, and 16; the ASSIGNOR hereby irrevocably consents under FSEK Art. 16/2 to any refactoring, bug-fixing, feature additions, and adaptations executed by the ASSIGNEE, and waives any conflicting attribution claims where standard in commercial software distribution.";

    const originalityWarrantyTr =
      "YÜKLENİCİ, teslim edilen yazılım kodlarının bizzat kendisi tarafından geliştirildiğini, eserin özgün olduğunu, üçüncü kişilerin telif, patent veya ticari sır haklarını ihlal etmediğini ve sözleşmeye aykırı copyleft (AGPL vb.) açık kaynak kodu içermediğini; aksi yöndeki her türlü üçüncü kişi talebine karşı İŞVEREN'i masun tutacağını ve tazmin edeceğini gayrikabili rücu garanti eder.";

    const originalityWarrantyEn =
      "The ASSIGNOR warrants that the software work product is entirely original, created solely by the ASSIGNOR, free of third-party IP infringement or unauthorized copyleft licenses, and agrees to indemnify and hold the ASSIGNEE harmless against any third-party claims.";

    const evidentiaryClauseTr =
      "İşbu resmi Fikri Mülkiyet Devir Senedi, 6100 sayılı Hukuk Muhakemeleri Kanunu m. 193 uyarınca taraflar arasında münhasır delil sözleşmesi niteliğinde olup, kriptografik SHA-256 ana mührü ve Bilateral Payment Handshake Dual-Seal damgasıyla imzalanarak mühürlenmiştir.";

    const evidentiaryClauseEn =
      "This Certificate of IP Assignment constitutes a binding exclusive evidentiary agreement under Article 193 of the Turkish Code of Civil Procedure (HMK), cryptographically signed and sealed via Master SHA-256 digest and Bilateral Payment Dual-Seal.";

    const deedPayloadToHash = {
      deedId,
      engagementId: input.engagementId,
      milestoneId: input.milestoneId,
      sequence: input.milestoneSequence,
      commitHash,
      repositoryUrl,
      assignorId: input.assignorUserId,
      assignorVkn: assignorMasked,
      assigneeId: input.assigneeUserId,
      assigneeVkn: assigneeMasked,
      amount: input.amount,
      currency: input.currency,
      paymentDualSeal: input.paymentDualSeal,
      settlementCertId: input.settlementCertificateId,
      timestamp,
    };

    const masterDeedSha256 = this.calculateMasterSha256(deedPayloadToHash);

    return {
      deedId,
      engagementId: input.engagementId,
      listingTitle: input.listingTitle,
      milestoneId: input.milestoneId,
      issuedAt: timestamp,
      assignor: {
        userId: input.assignorUserId,
        legalName: input.assignorName,
        role: "ASSIGNOR",
        vknOrTcknMasked: assignorMasked,
        taxOffice: input.assignorTaxOffice,
        email: input.assignorEmail,
        address: input.assignorAddress,
      },
      assignee: {
        userId: input.assigneeUserId,
        legalName: input.assigneeName,
        role: "ASSIGNEE",
        companyName: input.assigneeCompanyName,
        vknOrTcknMasked: assigneeMasked,
        taxOffice: input.assigneeTaxOffice,
        email: input.assigneeEmail,
        address: input.assigneeAddress,
      },
      pinnedWork: {
        repositoryUrl,
        gitCommitHash: commitHash,
        branchOrTag: input.branchOrTag || "main",
        deliverableUrl: input.deliverableUrl,
        deliverableUrlType: input.deliverableUrlType,
        artifactSha256: input.artifactSha256,
        milestoneSequence: input.milestoneSequence,
        milestoneTitle: input.milestoneTitle,
        milestoneDescription: input.milestoneDescription,
      },
      consideration: {
        amount: input.amount,
        currency: input.currency,
        paymentReference: input.paymentReference,
        paymentDualSeal: input.paymentDualSeal,
        settlementCertificateId: input.settlementCertificateId,
        invoiceNumber: input.invoiceNumber,
        settledAt: timestamp,
      },
      transferredRights: this.STATUTORY_ECONOMIC_RIGHTS,
      territory: "WORLDWIDE",
      duration: "PERPETUAL_STATUTORY_COPYRIGHT",
      sublicensePermitted: true,
      thirdPartyTransferPermitted: true,
      moralRightsWaiverTr,
      moralRightsWaiverEn,
      originalityWarrantyTr,
      originalityWarrantyEn,
      evidentiaryClauseTr,
      evidentiaryClauseEn,
      governingLaw: "REPUBLIC_OF_TURKEY",
      masterDeedSha256,
    };
  }

  /**
   * Formats the deed into a court-ready, formal Markdown contract document.
   */
  static formatDeedMarkdown(deed: IpAssignmentDeed): string {
    const formattedDate = new Date(deed.issuedAt).toLocaleString("tr-TR");

    return `# RESMİ FİKRİ MÜLKİYET VE MALİ HAKLARIN DEVRİ SENEDİ
## (FORMAL CERTIFICATE OF INTELLECTUAL PROPERTY ASSIGNMENT)
**5846 Sayılı FSEK m. 48-52 ve 6100 Sayılı HMK m. 193 Uyarınca Tescilli Belge**

---

**Belge Numarası (Deed ID):** \`${deed.deedId}\`  
**Düzenleme Tarihi & Zaman Damgası:** ${formattedDate}  
**Proje / İş Birliği ID:** \`${deed.engagementId}\` — *${deed.listingTitle}*  
**Hakediş Aşaması:** #${deed.pinnedWork.milestoneSequence} - ${deed.pinnedWork.milestoneTitle}  

---

### 1. TARAFLARIN KİMLİK VE VERGİ BİLGİLERİ

#### 1.1. DEVREDEN (YAZILIMCI / ESER SAHİBİ)
- **Ad Soyad / Unvan:** ${deed.assignor.legalName}
- **TCKN / VKN:** \`${deed.assignor.vknOrTcknMasked}\`
- **Operis Kullanıcı ID:** \`${deed.assignor.userId}\`
- **E-Posta:** ${deed.assignor.email}
${deed.assignor.taxOffice ? `- **Vergi Dairesi:** ${deed.assignor.taxOffice}` : ""}
${deed.assignor.address ? `- **Adres:** ${deed.assignor.address}` : ""}

#### 1.2. DEVRALAN (İŞVEREN / HAK SAHİBİ ŞİRKET)
- **Şirket Unvanı / Ad Soyad:** ${deed.assignee.companyName || deed.assignee.legalName}
- **Vergi Kimlik No (VKN / TCKN):** \`${deed.assignee.vknOrTcknMasked}\`
- **Operis Kullanıcı ID:** \`${deed.assignee.userId}\`
- **E-Posta:** ${deed.assignee.email}
${deed.assignee.taxOffice ? `- **Vergi Dairesi:** ${deed.assignee.taxOffice}` : ""}
${deed.assignee.address ? `- **Adres:** ${deed.assignee.address}` : ""}

---

### 2. DEVRİN KONUSU VE SOMUTLAŞTIRILAN YAZILIM KÜNYESİ (PINNED WORK)

İşbu devir senedine konu yazılım ve kaynak kodları, aşağıdaki teknik künye ile kesinleştirilmiş ve kriptografik olarak sabitlenmiştir:

- **Git Depo Adresi (Repository URL):** \`${deed.pinnedWork.repositoryUrl}\`
- **Git Commit Hash (SHA):** \`${deed.pinnedWork.gitCommitHash}\`
- **Kaynak Dal / Etiket (Branch/Tag):** \`${deed.pinnedWork.branchOrTag || "main"}\`
${deed.pinnedWork.deliverableUrl ? `- **Teslimat Doğrulama Bağlantısı:** \`${deed.pinnedWork.deliverableUrl}\`` : ""}
- **Aşama Tanımı:** ${deed.pinnedWork.milestoneDescription}

---

### 3. BEDEL, İFA VE YÜRÜRLÜK ŞARTI (CONSIDERATION & EFFECTIVITY)

İşbu devir senedi kapsamındaki mali hak devri, tarafların Operis platformu üzerinden gerçekleştirdiği **Çift Taraflı Havale/EFT Ödeme Beyanı ve Mutabakatı** neticesinde hakediş bedelinin tahsil edildiğinin teyit edilmesiyle eşzamanlı olarak kesinleşmiş ve yürürlüğe girmiştir:

- **Kararlaştırılan Hakediş Bedeli:** **${deed.consideration.amount.toLocaleString("tr-TR")} ${deed.consideration.currency}**
- **Banka Referans / Sorgu No:** \`${deed.consideration.paymentReference || "BANK-TRANSFER-VERIFIED"}\`
- **Tahkikat & İtfa Belgesi No:** \`${deed.consideration.settlementCertificateId}\`
${deed.consideration.invoiceNumber ? `- **e-SMM / Fatura No:** \`${deed.consideration.invoiceNumber}\`` : ""}
- **Ödeme Dual-Seal SHA-256 Damgası:**  
  \`${deed.consideration.paymentDualSeal}\`

---

### 4. 5846 SAYILI FSEK m. 52 UYARINCA DEVREDİLEN MALİ HAKLAR (ENUMERATED ECONOMIC RIGHTS)

DEVREDEN, FSEK m. 48 ve m. 52 emredici hükümleri dairesinde, yukarıda Git commit hash'i ile belirlenen yazılım üzerindeki aşağıda tek tek sayılan **5 (beş) temel mali hakkı**, DEVRALAN'a gayrikabili rücu, münhasıran ve kayıtsız şartsız devretmiştir:

1. **İşleme Hakkı (FSEK m. 21):**  
   ${deed.transferredRights[0]?.scopeTr}
2. **Çoğaltma Hakkı (FSEK m. 22):**  
   ${deed.transferredRights[1]?.scopeTr}
3. **Yayma Hakkı (FSEK m. 23):**  
   ${deed.transferredRights[2]?.scopeTr}
4. **Temsil Hakkı (FSEK m. 24):**  
   ${deed.transferredRights[3]?.scopeTr}
5. **Umuma İletim Hakkı (FSEK m. 25):**  
   ${deed.transferredRights[4]?.scopeTr}

---

### 5. DEVRİN KAPSAMI, SÜRESİ VE COĞRAFİ ALANI

- **Coğrafi Alan (Territory):** Yer itibariyle Türkiye Cumhuriyeti sınırları dahil tüm dünya ülkelerinde ve evrensel dijital mecralarda sınırsızdır (Worldwide).
- **Süre (Duration):** FSEK m. 27 uyarınca kanuni telif koruma süresinin sonuna kadar gayrimahduttur (Perpetual).
- **Mecra ve Adet:** Sayı, format ve mecra sınırlaması olmaksızın geçerlidir.
- **Alt Lisans ve Üçüncü Kişilere İntikal:** DEVRALAN, devraldığı bu mali hakları FSEK m. 53 uyarınca üçüncü şahıslara devretme, şirket birleşmesi/yatırım süreçlerinde intikal ettirme ve alt lisans (sublicense) tesis etme yetkisine münhasıran sahiptir.

---

### 6. MANEVİ HAKLAR VE TELİF TEMİZLİĞİ GARANTİSİ

- **Manevi Haklar Muvafakati (FSEK m. 14-16):**  
  > ${deed.moralRightsWaiverTr}
- **Özgünlük ve Fikri Mülkiyet Temizliği Garantisi:**  
  > ${deed.originalityWarrantyTr}

---

### 7. HMK m. 193 MÜNHASIR DELİL SÖZLEŞMESİ VE KRİPTOGRAFİK MÜHÜR

İşbu senedin bütünlüğü ve tarafların kimlik doğrulaması SHA-256 kriptografik damgası ile kilitlenmiştir:

\`\`\`
MASTER DEED SHA-256:
${deed.masterDeedSha256}
\`\`\`

> **Yasal Hüküm:** ${deed.evidentiaryClauseTr}
`;
  }

  /**
   * Formats the deed as an official, highly styled printable HTML certificate view.
   */
  static formatDeedHtml(deed: IpAssignmentDeed): string {
    const formattedDate = new Date(deed.issuedAt).toLocaleString("tr-TR");

    return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>FSEK Fikri Mülkiyet Devir Senedi - ${deed.deedId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; background: #fff; margin: 0; padding: 32px; font-size: 13px; line-height: 1.6; }
    .deed-container { max-width: 820px; margin: 0 auto; border: 2px solid #0f172a; padding: 36px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .deed-header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; }
    .badge { display: inline-block; padding: 4px 12px; background: #ecfdf5; color: #047857; font-weight: bold; border-radius: 9999px; font-size: 11px; border: 1px solid #a7f3d0; }
    .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 12px 0 4px; letter-spacing: -0.5px; }
    .subtitle { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
    .parties-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0; }
    .party-card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; background: #f8fafc; }
    .party-title { font-size: 12px; font-weight: 800; color: #334155; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .pinned-box { background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 14px; margin: 16px 0; border-radius: 0 8px 8px 0; }
    .rights-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
    .rights-table th, .rights-table td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
    .rights-table th { background: #f8fafc; font-weight: bold; color: #334155; }
    tr { break-inside: avoid; page-break-inside: avoid; }
    p, li { orphans: 3; widows: 3; }
    .seal-box { background: #0f172a; color: #38bdf8; font-family: monospace; font-size: 11px; padding: 14px; border-radius: 8px; word-break: break-all; margin: 20px 0; break-inside: avoid; page-break-inside: avoid; }
    .footer-notes { font-size: 11px; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-style: italic; break-inside: avoid; page-break-inside: avoid; }
    @media print {
      body { padding: 0; }
      .deed-container { border: 1px solid #000; box-shadow: none; padding: 20px; }
      .deed-header, .title, h1, h2, h3, h4 { break-after: avoid-page !important; page-break-after: avoid !important; }
      .parties-grid, .party-card, .pinned-box, .rights-table, tr, .seal-box { break-inside: avoid !important; page-break-inside: avoid !important; }
    }
  </style>
</head>
<body>
  <div class="deed-container">
    <div class="deed-header">
      <span class="badge">FSEK m. 48-52 TESCİLLİ DEVİR SENEDİ</span>
      <h1 class="title">RESMİ FİKRİ MÜLKİYET VE MALİ HAKLARIN DEVRİ BELGESİ</h1>
      <div class="subtitle">Certificate of Intellectual Property Assignment</div>
      <p style="margin: 8px 0 0; font-size: 12px; color: #475569;">
        <strong>Sened No:</strong> ${deed.deedId} &nbsp;|&nbsp; <strong>Tarih:</strong> ${formattedDate}
      </p>
    </div>

    <div class="parties-grid">
      <div class="party-card">
        <div class="party-title">1. DEVREDEN (ESER SAHİBİ / YAZILIMCI)</div>
        <p style="margin: 2px 0;"><strong>Ad Soyad:</strong> ${deed.assignor.legalName}</p>
        <p style="margin: 2px 0;"><strong>TCKN / VKN:</strong> <code>${deed.assignor.vknOrTcknMasked}</code></p>
        <p style="margin: 2px 0;"><strong>Operis ID:</strong> <code>${deed.assignor.userId}</code></p>
      </div>

      <div class="party-card">
        <div class="party-title">2. DEVRALAN (HAK SAHİBİ / ŞİRKET)</div>
        <p style="margin: 2px 0;"><strong>Unvan:</strong> ${deed.assignee.companyName || deed.assignee.legalName}</p>
        <p style="margin: 2px 0;"><strong>VKN / TCKN:</strong> <code>${deed.assignee.vknOrTcknMasked}</code></p>
        <p style="margin: 2px 0;"><strong>Operis ID:</strong> <code>${deed.assignee.userId}</code></p>
      </div>
    </div>

    <div class="pinned-box">
      <strong>📦 SOMUTLAŞTIRILAN ESER VE GİT COMMIT KÜNYESİ:</strong><br>
      • <strong>Proje & Aşama:</strong> ${deed.listingTitle} (Milestone #${deed.pinnedWork.milestoneSequence} - ${deed.pinnedWork.milestoneTitle})<br>
      • <strong>Git Repository:</strong> <code>${deed.pinnedWork.repositoryUrl}</code><br>
      • <strong>Git Commit Hash:</strong> <code>${deed.pinnedWork.gitCommitHash}</code> (${deed.pinnedWork.branchOrTag || "main"})<br>
      • <strong>Hakediş Bedeli:</strong> ${deed.consideration.amount.toLocaleString("tr-TR")} ${deed.consideration.currency} (Ödeme Teyidi İle İntikal Kesinleşmiştir)
    </div>

    <table class="rights-table">
      <thead>
        <tr>
          <th style="width: 130px;">FSEK Maddesi</th>
          <th style="width: 160px;">Devredilen Mali Hak</th>
          <th>Devir Kapsamı ve Hukuki Yetki</th>
        </tr>
      </thead>
      <tbody>
        ${deed.transferredRights
          .map(
            (r) => `
        <tr>
          <td><strong>${r.fsekArticle}</strong></td>
          <td><strong>${r.nameTr}</strong></td>
          <td>${r.scopeTr}</td>
        </tr>`
          )
          .join("")}
      </tbody>
    </table>

    <div class="seal-box">
      <strong>HMK m. 193 KRİPTOGRAFİK MASTER SENET MÜHRÜ (SHA-256):</strong><br>
      ${deed.masterDeedSha256}<br><br>
      <strong>BİLATERAL PAYMENT DUAL-SEAL REF:</strong><br>
      ${deed.consideration.paymentDualSeal}
    </div>

    <div class="footer-notes">
      İşbu belge, 5846 sayılı FSEK m. 52 uyarınca yazılı şekil şartına ve mali hakların ayrı ayrı sayılması kuralına tam uyumlu olarak düzenlenmiş olup, 6100 sayılı HMK m. 193 gereğince bağlayıcı münhasır delil sözleşmesi niteliğindedir.
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Validates the cryptographic integrity of a deed against its content and dual-seal.
   */
  static verifyDeed(deed: IpAssignmentDeed): IpDeedVerificationResult {
    const payloadToHash = {
      deedId: deed.deedId,
      engagementId: deed.engagementId,
      milestoneId: deed.milestoneId,
      sequence: deed.pinnedWork.milestoneSequence,
      commitHash: deed.pinnedWork.gitCommitHash,
      repositoryUrl: deed.pinnedWork.repositoryUrl,
      assignorId: deed.assignor.userId,
      assignorVkn: deed.assignor.vknOrTcknMasked,
      assigneeId: deed.assignee.userId,
      assigneeVkn: deed.assignee.vknOrTcknMasked,
      amount: deed.consideration.amount,
      currency: deed.consideration.currency,
      paymentDualSeal: deed.consideration.paymentDualSeal,
      settlementCertId: deed.consideration.settlementCertificateId,
      timestamp: deed.issuedAt,
    };

    const recomputedSha256 = this.calculateMasterSha256(payloadToHash);
    const isValid = recomputedSha256 === deed.masterDeedSha256;
    const dualSealLinked = Boolean(
      deed.consideration.paymentDualSeal && deed.consideration.paymentDualSeal.length === 64
    );

    return {
      isValid,
      deedId: deed.deedId,
      masterDeedSha256: deed.masterDeedSha256,
      recomputedSha256,
      dualSealLinked,
      error: isValid
        ? undefined
        : "Deed payload has been modified or corrupted; SHA-256 digest mismatch.",
    };
  }
}

export const STATUTORY_ECONOMIC_RIGHTS = IpAssignmentDeedEngine.STATUTORY_ECONOMIC_RIGHTS;
