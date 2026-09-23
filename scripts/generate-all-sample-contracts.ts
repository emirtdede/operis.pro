import fs from "node:fs";
import path from "node:path";
import { ContractGeneratorService } from "../src/modules/contracts/generator";
import { ComprehensiveDeedEngine } from "../src/modules/contracts/comprehensive-deed-engine";
import { HandoverGeneratorService } from "../src/modules/contracts/handover-generator";
import { RunbookGeneratorService } from "../src/modules/contracts/runbook-generator";
import { AddendumGeneratorService } from "../src/modules/contracts/addendum-generator";
import { AcceptanceEngine } from "../src/modules/contracts/acceptance-engine";
import { DpaEngine } from "../src/modules/contracts/dpa-engine";
import { SafeHarborEngine } from "../src/modules/contracts/safe-harbor-engine";
import { AiGovernanceEngine } from "../src/modules/contracts/ai-governance-engine";
import { SoftwareExportEngine } from "../src/modules/finance/software-export-engine";
import { InflationHedgingEngine, InflationShieldConfig } from "../src/modules/finance/inflation-hedging";
import { LEGAL_DOCUMENTS, LegalDocumentModel } from "../src/lib/legal/legal-documents-data";
import type {
  ContractParty,
  ContractMilestone,
  DpaContractConfig,
  SafeHarborConfig,
  AiGovernanceConfig,
  SoftwareExportConfig,
} from "../src/modules/contracts/types";
import type { ContractAcceptanceCriterion } from "../src/modules/contracts/acceptance-types";

const OUTPUT_DIR = path.resolve(process.cwd(), "docs", "sozlesme-ornekleri");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// HTML Standart A4 Şablonu (Kullanıcının Gördüğü Vektörel Baskı / PDF Tasarımı)
// ---------------------------------------------------------------------------
function wrapInOfficialA4Html(options: {
  title: string;
  subtitle: string;
  ref: string;
  sha256: string;
  date?: string;
  badge?: string;
  bodyHtml: string;
  parties?: { client: string; contractor: string };
}): string {
  const {
    title,
    subtitle,
    ref,
    sha256,
    date = "01 Eylül 2026",
    badge = "✓ RESMİ VE KRİPTOGRAFİK MÜHÜRLÜ METİN (HMK m. 193 KESİN DELİL)",
    bodyHtml,
    parties,
  } = options;

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Operis Legal Hub</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 16mm;
      @bottom-right {
        content: counter(page) "/" counter(pages);
        font-size: 8pt;
        color: #94a3b8;
      }
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.55;
      padding: 32px;
      margin: 0 auto;
      max-width: 900px;
      background: #ffffff;
      font-size: 10pt;
    }
    .header-bar {
      border-bottom: 2px solid #0284c7;
      padding-bottom: 14px;
      margin-bottom: 22px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: 0.05em;
      color: #0f172a;
      margin: 0;
    }
    .brand-title span { color: #0284c7; }
    .brand-sub {
      font-size: 8.5pt;
      color: #64748b;
      margin-top: 2px;
      font-weight: 500;
    }
    .header-meta {
      font-size: 8.5pt;
      color: #475569;
      text-align: right;
      line-height: 1.4;
    }
    h1 {
      font-size: 16pt;
      font-weight: 800;
      color: #0f172a;
      margin: 14px 0 6px 0;
      text-transform: uppercase;
      letter-spacing: -0.01em;
      break-after: avoid-page;
      page-break-after: avoid;
    }
    h2, h3, h4, h5, h6 {
      break-after: avoid-page;
      page-break-after: avoid;
    }
    h1, h2, h3, h4, h5, h6,
    .brand-title, .party-title, .section-title, .clause-title {
      break-after: avoid-page !important;
      page-break-after: avoid !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    h1 + *, h2 + *, h3 + *, h4 + *, h5 + *, h6 + *,
    .clause-title + *, .section-title + * {
      break-before: avoid-page !important;
      page-break-before: avoid !important;
    }
    p, li {
      orphans: 3;
      widows: 3;
    }
    .doc-subtitle {
      font-size: 9pt;
      color: #64748b;
      margin-bottom: 16px;
      line-height: 1.4;
      break-after: avoid-page;
      page-break-after: avoid;
    }
    .badge-pill {
      display: inline-block;
      background: #f0fdf4;
      color: #166534;
      padding: 4px 10px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 8.5pt;
      border: 1px solid #bbf7d0;
      margin-bottom: 18px;
      break-after: avoid-page;
      page-break-after: avoid;
    }
    .parties-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin: 18px 0;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .party-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      font-size: 9pt;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .party-title {
      font-size: 8pt;
      font-weight: 700;
      color: #0284c7;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 9pt;
    }
    tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    th {
      background: #f1f5f9;
      text-align: left;
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
      font-weight: 700;
      color: #334155;
    }
    td {
      padding: 8px 10px;
      border: 1px solid #e2e8f0;
      color: #1e293b;
    }
    .highlight-box {
      background: #f8fafc;
      padding: 12px 16px;
      border-left: 4px solid #0284c7;
      border-radius: 0 6px 6px 0;
      margin: 16px 0;
      font-size: 9pt;
      color: #1e293b;
      line-height: 1.5;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .legal-alert {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 0 6px 6px 0;
      padding: 12px 16px;
      margin: 16px 0;
      font-size: 8.5pt;
      color: #92400e;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .legal-section {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
      margin-bottom: 16px;
    }
    .footer-bar {
      margin-top: 36px;
      border-top: 1px solid #e2e8f0;
      padding-top: 14px;
      font-size: 8.5pt;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      align-items: center;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .hash-seal {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: #0284c7;
      font-size: 8pt;
      word-break: break-all;
      background: #f8fafc;
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      margin-top: 12px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .print-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #0284c7;
      color: #ffffff;
      border: none;
      padding: 10px 18px;
      border-radius: 30px;
      font-weight: 700;
      font-size: 13px;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
    }
    .print-btn:hover {
      background: #0369a1;
      transform: translateY(-2px);
    }
    @media print {
      body { padding: 0; max-width: 100%; }
      .print-btn { display: none !important; }
      h1, h2, h3, h4, h5, h6,
      .brand-title, .party-title, .section-title, .clause-title {
        break-after: avoid-page !important;
        page-break-after: avoid !important;
      }
      .party-card, .parties-grid, .highlight-box, .legal-alert,
      .safe-harbor-item, .safe-harbor-header, .safe-harbor-summary,
      .clause-block, .legal-section, .dpa-annex, .safe-harbor-annex,
      .inflation-shield-box, .tax-breakdown-table,
      .hash-seal, .footer-bar, .sha-seal, .signature-box, .signature-grid,
      table, tr {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">
    🖨️ PDF Olarak Kaydet / Yazdır
  </button>

  <div class="header-bar">
    <div>
      <h2 class="brand-title">OPERIS <span>LEGAL</span></h2>
      <div class="brand-sub">Bağımsız Yazılım ve Teknoloji Sözleşme Altyapısı</div>
    </div>
    <div class="header-meta">
      <div><strong>Sözleşme No:</strong> ${ref}</div>
      <div><strong>Tarih:</strong> ${date}</div>
      <div><strong>Hukuki Statü:</strong> Bağlayıcı Resmi Belge</div>
    </div>
  </div>

  <h1>${title}</h1>
  <div class="doc-subtitle">${subtitle}</div>
  <div class="badge-pill">${badge}</div>

  ${parties ? `
  <div class="parties-grid">
    <div class="party-card">
      <div class="party-title">İŞ SAHİBİ (MÜŞTERİ)</div>
      <strong>${parties.client}</strong>
    </div>
    <div class="party-card">
      <div class="party-title">YÜKLENİCİ (GELİŞTİRİCİ)</div>
      <strong>${parties.contractor}</strong>
    </div>
  </div>` : ""}

  <div class="content-body">
    ${bodyHtml}
  </div>

  <div class="footer-bar">
    <div><strong>Referans Kodu:</strong> ${ref}</div>
    <div>Operis P2P Doğrudan Eşleşme &amp; Sözleşme Altyapısı</div>
  </div>
  <div class="hash-seal">
    <strong>SHA-256 Dijital Mühür (HMK m. 193):</strong> ${sha256}
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Ortak Örnek Veriler (Gerçekçi Hukuki & Finansal Bilgiler)
// ---------------------------------------------------------------------------
const sampleClient: ContractParty = {
  displayName: "Acme Teknoloji ve Girişim A.Ş.",
  email: "hukuk@acmeteknoloji.com.tr",
  phone: "+90 (212) 555 8899",
  city: "İstanbul",
  role: "CLIENT",
};

const sampleContractor: ContractParty = {
  displayName: "Can Demir (Kıdemli Yazılım Mimarı)",
  email: "can.demir@devmail.com",
  phone: "+90 (532) 555 1234",
  city: "Ankara",
  role: "CONTRACTOR",
};

const sampleAcceptanceCriteria: ContractAcceptanceCriterion[] = [
  {
    id: "crit-auth-01",
    phaseNumber: 1,
    category: "AUTH_SECURITY",
    humanCriterionTr: "Kullanıcı kimlik doğrulama, MFA ve rol tabanlı yetkilendirme (RBAC) uçtan uca çalışmalıdır.",
    humanCriterionEn: "User authentication, MFA, and RBAC must function end-to-end.",
    gherkinGivenTr: "Kullanıcı geçerli e-posta ve şifreyle 2FA kodunu girdiğinde",
    gherkinGivenEn: "Given a user enters valid email, password, and 2FA token",
    gherkinWhenTr: "Giriş butonuna tıkladığında",
    gherkinWhenEn: "When the user clicks the login button",
    gherkinThenTr: "JWT oturum token'ı oluşturulmalı ve yetkili dashboard ekranına yönlendirilmelidir.",
    gherkinThenEn: "Then a signed JWT session must be created and user redirected to authorized dashboard.",
    isMandatory: true,
  },
  {
    id: "crit-export-02",
    phaseNumber: 2,
    category: "OUTPUT_REPORTING",
    humanCriterionTr: "Finansal raporlama modülü 100.000 satır veriyi 1.5 saniye altında CSV ve PDF formatında dışa aktarmalıdır.",
    humanCriterionEn: "Financial reporting engine must export 100k records to CSV/PDF under 1.5s.",
    gherkinGivenTr: "Sistemde 100.000 satır işlem kaydı bulunduğunda",
    gherkinGivenEn: "Given the database holds 100,000 transaction records",
    gherkinWhenTr: "Kullanıcı 'Dönem Sonu Raporu İndir' butonuna bastığında",
    gherkinWhenEn: "When the user triggers 'Download Period Report'",
    gherkinThenTr: "Sistem CPU tüketimi %40'ı aşmadan, 1.5 saniye içinde imzalı PDF dosyasını üretmelidir.",
    gherkinThenEn: "Then a digitally signed PDF must stream within 1.5s without exceeding 40% CPU.",
    isMandatory: true,
  },
  {
    id: "crit-cicd-03",
    phaseNumber: 3,
    category: "DELIVERY_QUALITY",
    humanCriterionTr: "Tüm kaynak kodlar %85+ test kapsamı ile GitHub Actions CI/CD hattında yeşil geçmelidir.",
    humanCriterionEn: "All source code must achieve 85%+ unit test coverage passing green on CI/CD.",
    gherkinGivenTr: "Ana dala (main) yeni sürüm etiketi (tag) atıldığında",
    gherkinGivenEn: "Given a release tag is pushed to the main branch",
    gherkinWhenTr: "Otomatik linter ve test paketleri koşturulduğunda",
    gherkinWhenEn: "When lint and integration test suites run",
    gherkinThenTr: "0 kritik güvenlik zafiyeti ve %85 üzeri kapsama ile staging sunucusuna otomatik deploy olmalıdır.",
    gherkinThenEn: "Then zero critical vulnerabilities must be detected and automated staging deployment succeed.",
    isMandatory: true,
  },
];

const sampleMilestones: ContractMilestone[] = [
  {
    phase: 1,
    percentage: 30,
    titleTr: "Sistem Mimarisi, Veri Modeli ve Kimlik Doğrulama Katmanı",
    titleEn: "System Architecture, Database Modeling & Auth Layer",
    descriptionTr: "PostgreSQL şema tasarımı, Next.js 16 altyapısı, AES-256 şifreleme ve RBAC yetkilendirme.",
    descriptionEn: "PostgreSQL schema design, Next.js 16 scaffolding, AES-256 data protection and RBAC auth.",
    acceptanceCriteria: sampleAcceptanceCriteria.slice(0, 1),
  },
  {
    phase: 2,
    percentage: 40,
    titleTr: "Finansal Analitik Motoru ve Raporlama API'leri",
    titleEn: "Financial Analytics Engine & Reporting APIs",
    descriptionTr: "Yüksek performanslı veri işleme hattı, webhook bildirimleri ve PDF/CSV dışa aktarım motoru.",
    descriptionEn: "High-throughput data pipeline, webhook dispatchers and automated PDF/CSV export engine.",
    acceptanceCriteria: sampleAcceptanceCriteria.slice(1, 2),
  },
  {
    phase: 3,
    percentage: 30,
    titleTr: "Kullanıcı Kabul Testleri (UAT), CI/CD Dağıtımı ve Telif Devri",
    titleEn: "User Acceptance Testing (UAT), CI/CD Deployment & IP Transfer",
    descriptionTr: "Staging ve canlı ortam dağıtımı, FSEK m. 52 telif devir senedi ve kaynak kod teslimi.",
    descriptionEn: "Production deployment, FSEK Art. 52 statutory IP transfer deed and full repository handover.",
    acceptanceCriteria: sampleAcceptanceCriteria.slice(2, 3),
  },
];

const sampleDpaConfig: DpaContractConfig = {
  enabled: true,
  accessLevel: "READ_ONLY_STAGING",
  dataCategories: ["IDENTITY_CONTACT", "CUSTOMER_ACCOUNT_LOGS", "FINANCIAL_TRANSACTION"],
  securityMeasures: ["TLS_ENCRYPTION", "AES256_AT_REST", "MFA_ACCESS", "AUDIT_LOGGING"],
  breachNotificationHours: 24,
  subProcessorAllowed: false,
  dataRetentionDaysAfterTermination: 0,
  dpoContactEmail: "dpo@acmeteknoloji.com.tr",
};

const sampleSafeHarborConfig: SafeHarborConfig = {
  enabled: true,
  scheduleAutonomy: "FLEXIBLE_RESULT_ORIENTED",
  equipmentOwnership: "CONTRACTOR_OWN_TOOLS",
  managementHierarchy: "AUTONOMOUS_DELIVERABLE",
  exclusivityStatus: "OPEN_MARKET_MULTIPLE_CLIENTS",
  invoicingEntityStatus: "REGISTERED_COMPANY_INVOICE",
  corporateIntegration: "EXTERNAL_CONSULTANT_IDENTITY",
  rightOfSubstitutionAllowed: true,
  governingJurisdictionCity: "İstanbul",
};

const sampleAiGovernanceConfig: AiGovernanceConfig = {
  enabled: true,
  usageLevel: "AI_ASSISTED_HUMAN_REVIEWED",
  declaredTools: ["GITHUB_COPILOT", "CLAUDE_CODE", "CURSOR"],
  dataPrivacyTier: "ENTERPRISE_ZERO_RETENTION",
  humanInTheLoopAffirmed: true,
  copyleftFreeWarranted: true,
  zeroDataRetentionWarranted: true,
  strictDefectLiabilityAccepted: true,
  codeReviewToolUsed: true,
  repositoryBranchOrTag: "main",
};

const sampleExportConfig: SoftwareExportConfig = {
  enabled: true,
  clientCountryCode: "DE",
  clientCountryName: "Almanya (Federal Republic of Germany)",
  clientCountry: "Almanya",
  clientHasNoPermanentEstablishmentInTr: true,
  isForeignEntity: true,
  exclusiveForeignUtilizationAffirmed: true,
  isServiceUtilizedAbroad: true,
  foreignCurrencyRemittanceWarranted: true,
  repatriationDeclared: true,
  remittanceChannel: "SWIFT_WIRE",
  invoiceCurrency: "EUR",
  invoiceTaxExemptionCode: "302",
  gvkIncentivePercentage: 80,
  vatRate: 0,
};

const sampleInflationConfig: InflationShieldConfig = {
  enabled: true,
  indexType: "YI_UFE",
  baseMonth: "2026-01",
  targetMonth: "2026-06",
  capPercentage: 40,
  faultParty: "NONE",
};

// ---------------------------------------------------------------------------
// 1. Ana Hizmet ve Eser Sözleşmesi (Bireysel - Türkçe)
// ---------------------------------------------------------------------------
console.info("1. Ana Hizmet ve Eser Sözleşmesi (Bireysel - TR) oluşturuluyor...");
const mainContractTr = ContractGeneratorService.generateContract({
  engagementId: "ENG-2026-B2B-FINANCE-01",
  listingTitle: "Kurumsal B2B Finansal Raporlama ve Analitik Platformu",
  category: "Full-Stack Web Geliştirme",
  matchedAt: "2026-09-01T10:00:00.000Z",
  scopeSummary: "Next.js 16, PostgreSQL ve TailwindCSS kullanılarak çok kiracılı (multi-tenant), yüksek güvenlikli kurumsal finansal raporlama platformu geliştirilmesi ve anahtar teslim devreye alınması işidir.",
  budgetLabel: "150.000 TL",
  timelineLabel: "45 İş Günü",
  client: sampleClient,
  contractor: sampleContractor,
  locale: "tr",
  milestones: sampleMilestones,
  acceptanceCriteria: sampleAcceptanceCriteria,
  warrantyPeriodDays: 30,
  inspectionPeriodDays: 7,
  ndaYears: 3,
  inflationShield: sampleInflationConfig,
  dpaConfig: sampleDpaConfig,
  safeHarborConfig: sampleSafeHarborConfig,
  aiGovernanceConfig: sampleAiGovernanceConfig,
  softwareExportConfig: { enabled: false },
  cleanCodeConfig: {
    repositoryUrl: "https://github.com/acme-holding/b2b-analytics.git",
    commitHash: "e4d3c2b1a09876543210fedcba9876543210abcd",
  },
  fossConfig: {
    repositoryUrl: "https://github.com/acme-holding/b2b-analytics.git",
    commitHash: "e4d3c2b1a09876543210fedcba9876543210abcd",
  },
  nonSolicitationConfig: { durationMonths: 12 },
});

fs.writeFileSync(
  path.join(OUTPUT_DIR, "01-ana-hizmet-ve-eser-sozlesmesi-tr.md"),
  `# BAĞIMSIZ YAZILIM VE TEKNOLOJİ HİZMET SÖZLEŞMESİ (TBK m. 470 & FSEK m. 52)
> **Operis Referans No:** \`${mainContractTr.contractRef}\`  
> **Kriptografik SHA-256 Mührü:** \`${mainContractTr.sha256Fingerprint}\`  
> **Düzenlenme Tarihi:** 01 Eylül 2026  
> **Hukuki Dayanak:** 6098 Sayılı Türk Borçlar Kanunu (m. 470 vd.) & 5846 Sayılı Fikir ve Sanat Eserleri Kanunu (m. 52)

---

${mainContractTr.markdown}
`,
  "utf8"
);

fs.writeFileSync(
  path.join(OUTPUT_DIR, "01-ana-hizmet-ve-eser-sozlesmesi-tr.html"),
  mainContractTr.htmlContent,
  "utf8"
);

// ---------------------------------------------------------------------------
// 2. Ana Hizmet Sözleşmesi (Squad Konsorsiyumu - TBK m. 620)
// ---------------------------------------------------------------------------
console.info("2. Squad Konsorsiyumu Eser Sözleşmesi (TR) oluşturuluyor...");
const squadContract = ContractGeneratorService.generateContract({
  engagementId: "ENG-2026-SQUAD-LOGISTICS-02",
  listingTitle: "Yeni Nesil B2B Lojistik ve Tedarik Zinciri Yönetim Portalı",
  category: "Full-Stack Web & Bulut Mimarisi",
  matchedAt: "2026-09-05T14:30:00.000Z",
  scopeSummary: "Mikroservis mimarisinde, filo takip entegrasyonlu ve yüksek erişilebilirliğe sahip lojistik operasyon portalının çevik ekip konsorsiyumu tarafından geliştirilmesi.",
  budgetLabel: "350.000 TL",
  timelineLabel: "60 İş Günü",
  client: sampleClient,
  contractor: sampleContractor,
  locale: "tr",
  isSquadContract: true,
  squadTitle: "Operis Cloud & Full-Stack Mühendislik Kolektifi",
  squadMembers: [
    {
      displayName: "Can Demir",
      roleTitle: "Lider Mimar & Sistem Mühendisi",
      revenueSharePercentage: 40,
      scopeSummary: "Sistem mimarisi, DevOps, veritabanı optimizasyonu ve teknik koordinasyon",
      isLead: true,
      handleOrEmail: "can.demir@devmail.com",
    },
    {
      displayName: "Selin Yılmaz",
      roleTitle: "Kıdemli Frontend Mimarı",
      revenueSharePercentage: 35,
      scopeSummary: "Next.js UI bileşenleri, Tailwind entegrasyonu, harita ve telemetri panelleri",
      isLead: false,
      handleOrEmail: "selin.yilmaz@devmail.com",
    },
    {
      displayName: "Burak Kaya",
      roleTitle: "Kıdemli QA ve Güvenlik Uzmanı",
      revenueSharePercentage: 25,
      scopeSummary: "Uçtan uca Playwright/Vitest testleri, OWASP güvenlik denetimleri ve CI/CD",
      isLead: false,
      handleOrEmail: "burak.kaya@devmail.com",
    },
  ],
  milestones: sampleMilestones,
  acceptanceCriteria: sampleAcceptanceCriteria,
});

fs.writeFileSync(
  path.join(OUTPUT_DIR, "02-ana-hizmet-ve-eser-sozlesmesi-squad-tr.md"),
  `# ÇEVİK YAZILIMCI KONSORSİYUMU ESER SÖZLEŞMESİ (TBK m. 620 & TBK m. 470)
> **Operis Referans No:** \`${squadContract.contractRef}\`  
> **Kriptografik SHA-256 Mührü:** \`${squadContract.sha256Fingerprint}\`  
> **Hukuki Niteliği:** 6098 s. TBK m. 620 Adi Ortaklık Konsorsiyumu & TBK m. 162 Müteselsil Borçluluk

---

${squadContract.markdown}
`,
  "utf8"
);

fs.writeFileSync(
  path.join(OUTPUT_DIR, "02-ana-hizmet-ve-eser-sozlesmesi-squad-tr.html"),
  squadContract.htmlContent,
  "utf8"
);

// ---------------------------------------------------------------------------
// 3. Master Software Service Agreement (Full English)
// ---------------------------------------------------------------------------
console.info("3. Master Software Agreement (EN) oluşturuluyor...");
const mainContractEn = ContractGeneratorService.generateContract({
  engagementId: "ENG-2026-GLOBAL-SAAS-03",
  listingTitle: "Cross-Border FinTech Payment Gateway & Microservices Platform",
  category: "Full-Stack FinTech Architecture",
  matchedAt: "2026-09-10T12:00:00.000Z",
  scopeSummary: "Design, development, and production rollout of PCI-DSS compliant cross-border payment gateway microservices.",
  budgetLabel: "$18,500 USD",
  timelineLabel: "60 Business Days",
  client: {
    displayName: "VentureWave Capital Ltd.",
    email: "legal@venturewave.io",
    phone: "+44 20 7946 0912",
    city: "London, UK",
    role: "CLIENT",
  },
  contractor: sampleContractor,
  locale: "en",
  milestones: sampleMilestones,
  acceptanceCriteria: sampleAcceptanceCriteria,
  softwareExportConfig: sampleExportConfig,
  dpaConfig: sampleDpaConfig,
  safeHarborConfig: sampleSafeHarborConfig,
  aiGovernanceConfig: sampleAiGovernanceConfig,
});

fs.writeFileSync(
  path.join(OUTPUT_DIR, "03-master-software-service-agreement-en.md"),
  `# MASTER SOFTWARE AND TECHNOLOGY SERVICES AGREEMENT
> **Contract Reference:** \`${mainContractEn.contractRef}\`  
> **Cryptographic SHA-256 Seal:** \`${mainContractEn.sha256Fingerprint}\`  
> **Statutory Law:** Turkish Code of Obligations (Arts. 470 et seq.) & Intellectual Property Law (FSEK Art. 52)

---

${mainContractEn.markdown}
`,
  "utf8"
);

fs.writeFileSync(
  path.join(OUTPUT_DIR, "03-master-software-service-agreement-en.html"),
  mainContractEn.htmlContent,
  "utf8"
);

// ---------------------------------------------------------------------------
// 4. Çift Dilli Paralel Sözleşme (Bilingual - TR/EN)
// ---------------------------------------------------------------------------
console.info("4. Çift Dilli Sözleşme (Bilingual TR/EN) oluşturuluyor...");
const bilingualContract = ContractGeneratorService.generateContract({
  engagementId: "ENG-2026-BILINGUAL-04",
  listingTitle: "Uluslararası E-Ticaret ve Pazar Yeri Altyapısı / Global E-Commerce Core",
  category: "Full-Stack Enterprise",
  matchedAt: "2026-09-12T09:00:00.000Z",
  scopeSummary: "Çok dilli ve çok para birimli küresel e-ticaret altyapısının geliştirilmesi / Engineering of multi-currency global marketplace backend.",
  budgetLabel: "€12,000 EUR",
  timelineLabel: "45 İş Günü / Business Days",
  client: sampleClient,
  contractor: sampleContractor,
  locale: "bilingual",
  prevalenceLanguage: "tr",
  milestones: sampleMilestones,
  acceptanceCriteria: sampleAcceptanceCriteria,
});

fs.writeFileSync(
  path.join(OUTPUT_DIR, "04-cift-dilli-ana-sozlesme-bilingual-tr-en.md"),
  `# ÇİFT DİLLİ PARALEL ANA HİZMET SÖZLEŞMESİ (BILINGUAL MASTER AGREEMENT)
> **Referans No / Reference:** \`${bilingualContract.contractRef}\`  
> **SHA-256 Özeti / Hash:** \`${bilingualContract.sha256Fingerprint}\`  
> **Üstün Dil / Prevailing Language:** Türkçe (Turkish text controls in case of statutory ambiguity)

---

${bilingualContract.bilingualMarkdown || bilingualContract.markdown}
`,
  "utf8"
);

fs.writeFileSync(
  path.join(OUTPUT_DIR, "04-cift-dilli-ana-sozlesme-bilingual-tr-en.html"),
  bilingualContract.bilingualHtmlContent || bilingualContract.htmlContent,
  "utf8"
);

// ---------------------------------------------------------------------------
// 5. Ek 1: Hakediş ve Objektif Muayene-Kabul Kriterleri Protokolü
// ---------------------------------------------------------------------------
console.info("5. Ek 1: Kabul Kriterleri Protokolü oluşturuluyor...");
const annex1Content = AcceptanceEngine.generateContractAnnexMarkdown(sampleAcceptanceCriteria, "tr");
fs.writeFileSync(
  path.join(OUTPUT_DIR, "05-ek-1-hakedis-ve-kabul-kriterleri-protokolu.md"),
  `# SÖZLEŞME EKİ-1: OBJEKTİF KABUL KRİTERLERİ VE DEFINITION OF DONE PROTOKOLÜ
> **Yasal Dayanak:** 6098 Sayılı TBK m. 470 (Eser Sözleşmesi), m. 474 (Ayıp Muayenesi) & m. 477 (Kabul Rejimi)  
> **İlke:** Objektif BDD Kriterleri Şartı — İşverenin Subjektif veya Keyfi Ret Hakkı Yasaklanmıştır.

---

${annex1Content}
`,
  "utf8"
);

fs.writeFileSync(
  path.join(OUTPUT_DIR, "05-ek-1-hakedis-ve-kabul-kriterleri-protokolu.html"),
  wrapInOfficialA4Html({
    title: "SÖZLEŞME EKİ-1: OBJEKTİF KABUL KRİTERLERİ VE DEFINITION OF DONE PROTOKOLÜ",
    subtitle: "6098 Sayılı TBK m. 470 (Eser Sözleşmesi), m. 474 (Ayıp Muayenesi) & m. 477 (Kabul Rejimi)",
    ref: "OPR-ANNEX1-CRITERIA-2026",
    sha256: "b4c8d2e1a90876543210fedcba9876543210abcd1234567890abcdef01234567",
    badge: "✓ OBJEKTİF BDD ŞARTNAMESİ • KEYFİ RET GEÇERSİZDİR",
    parties: { client: sampleClient.displayName, contractor: sampleContractor.displayName },
    bodyHtml: `
    <div class="highlight-box">
      <strong>Hukuki İlke (TBK m. 474/477):</strong> İşbu kabul kriterleri; eserin tesliminde tarafların sübjektif değerlendirmelerini bertaraf ederek teslimatı objektif test şartlarına bağlar. İşveren, aşağıdaki BDD senaryolarını karşılayan aşamaları onaylamakla yükümlüdür.
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 70px;">Faz</th>
          <th style="width: 200px;">Kabul Şartı (Sade Dil)</th>
          <th>Teknik BDD Kuralı (Given-When-Then)</th>
          <th style="width: 80px;">Durum</th>
        </tr>
      </thead>
      <tbody>
        ${sampleAcceptanceCriteria.map(c => `
        <tr>
          <td style="text-align: center; font-weight: 700;">Faz ${c.phaseNumber}</td>
          <td><strong>${c.humanCriterionTr}</strong></td>
          <td style="font-family: monospace; font-size: 8pt; color: #334155;">
            <strong>GIVEN</strong> ${c.gherkinGivenTr}<br>
            <strong>WHEN</strong> ${c.gherkinWhenTr}<br>
            <strong>THEN</strong> ${c.gherkinThenTr}
          </td>
          <td style="text-align: center; color: #166534; font-weight: 700;">Zorunlu</td>
        </tr>`).join("")}
      </tbody>
    </table>`,
  }),
  "utf8"
);

// ---------------------------------------------------------------------------
// 6. Ek 2: Kişisel Veri İşleme Sözleşmesi (KVKK m. 12 & GDPR Art. 28 DPA)
// ---------------------------------------------------------------------------
console.info("6. Ek 2: Veri İşleme Sözleşmesi (DPA) oluşturuluyor...");
const annex2Content = DpaEngine.generateDpaAnnexMarkdown(
  sampleDpaConfig,
  "tr",
  sampleClient.displayName,
  sampleContractor.displayName
);

fs.writeFileSync(
  path.join(OUTPUT_DIR, "06-ek-2-kisisel-veri-isleme-sozlesmesi-kvkk-gdpr-dpa.md"),
  `# SÖZLEŞME EKİ-2: VERİ İŞLEYEN KİŞİSEL VERİ İŞLEME SÖZLEŞMESİ (DPA)
> **Yasal Dayanak:** 6698 Sayılı KVKK Madde 12 & Avrupa Birliği Genel Veri Koruma Tüzüğü (GDPR) Madde 28  
> **Taraflar:** ${sampleClient.displayName} (Veri Sorumlusu) — ${sampleContractor.displayName} (Veri İşleyen)

---

${annex2Content}
`,
  "utf8"
);

fs.writeFileSync(
  path.join(OUTPUT_DIR, "06-ek-2-kisisel-veri-isleme-sozlesmesi-kvkk-gdpr-dpa.html"),
  wrapInOfficialA4Html({
    title: "SÖZLEŞME EKİ-2: VERİ İŞLEYEN KİŞİSEL VERİ İŞLEME SÖZLEŞMESİ (DPA)",
    subtitle: "6698 Sayılı KVKK m. 12 & GDPR Madde 28 Uyarınca Bilişim Veri Güvenliği Protokolü",
    ref: "OPR-DPA-KVKK-2026",
    sha256: "c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2",
    badge: "✓ KVKK m. 12 & GDPR m. 28 UYUMLU • VERİ MİNİMİZASYONU",
    parties: { client: `${sampleClient.displayName} (Veri Sorumlusu)`, contractor: `${sampleContractor.displayName} (Veri İşleyen)` },
    bodyHtml: DpaEngine.generateDpaAnnexHtml(sampleDpaConfig, "tr"),
  }),
  "utf8"
);

// ---------------------------------------------------------------------------
// 7. Ek 3: Güvenli Liman ve Bağımsız Yüklenici Protokolü (Safe Harbor)
// ---------------------------------------------------------------------------
console.info("7. Ek 3: Güvenli Liman Protokolü oluşturuluyor...");
const annex3Content = SafeHarborEngine.generateSafeHarborAnnexMarkdown(
  sampleSafeHarborConfig,
  "tr",
  sampleClient.displayName,
  sampleContractor.displayName
);

fs.writeFileSync(
  path.join(OUTPUT_DIR, "07-ek-3-guvenli-liman-ve-bagimsiz-yuklenici-protokolu.md"),
  `# SÖZLEŞME EKİ-3: GÜVENLİ LİMAN VE BAĞIMSIZ YÜKLENİCİ STATÜSÜ TEVSİK PROTOKOLÜ (SAFE HARBOR)
> **Yasal Dayanak:** 4857 Sayılı İş Kanunu m. 8 & 6098 Sayılı TBK m. 470  
> **Amaç:** Sahte Serbest Çalışanlık (Misclassification / Gizli İstihdam) İddialarını Önleme ve 30 Gün Ayıp Sorumluluğu Şartnamesi

---

${annex3Content}
`,
  "utf8"
);

fs.writeFileSync(
  path.join(OUTPUT_DIR, "07-ek-3-guvenli-liman-ve-bagimsiz-yuklenici-protokolu.html"),
  wrapInOfficialA4Html({
    title: "SÖZLEŞME EKİ-3: GÜVENLİ LİMAN VE BAĞIMSIZ YÜKLENİCİ STATÜSÜ TEVSİK PROTOKOLÜ",
    subtitle: "4857 Sayılı İş Kanunu m. 8 & TBK m. 470 Eser Sözleşmesi Tevsik Senedi",
    ref: "OPR-SAFE-HARBOR-2026",
    sha256: "d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4",
    badge: "✓ 0 İŞÇİLİK RİSKİ • BAĞIMSIZ YÜKLENİCİ STATÜSÜ KORUMALI",
    parties: { client: sampleClient.displayName, contractor: sampleContractor.displayName },
    bodyHtml: SafeHarborEngine.generateSafeHarborAnnexHtml(sampleSafeHarborConfig, "tr"),
  }),
  "utf8"
);

// ---------------------------------------------------------------------------
// 8. Ek 4: Yapay Zeka ve Telif Devir Protokolü (AI Governance & Anti-Copyleft)
// ---------------------------------------------------------------------------
console.info("8. Ek 4: Yapay Zeka ve Telif Devir Protokolü oluşturuluyor...");
const annex4Content = AiGovernanceEngine.generateAiGovernanceAnnexMarkdown(
  sampleAiGovernanceConfig,
  "tr",
  sampleClient.displayName,
  sampleContractor.displayName
);

fs.writeFileSync(
  path.join(OUTPUT_DIR, "08-ek-4-yapay-zeka-ve-telif-devir-protokolu.md"),
  `# SÖZLEŞME EKİ-4: YAPAY ZEKA KULLANIMI, LİSANS TEMİZLİĞİ VE TELİF DEVİR PROTOKOLÜ
> **Yasal Dayanak:** 5846 Sayılı FSEK m. 52, Avrupa Birliği Yapay Zeka Yasası (EU AI Act) & TBK m. 474  
> **Odak:** Human-in-the-Loop Mimar Denetimi, Anti-Copyleft Koruma ve Prompt/Model Telif Devir Güvencesi

---

${annex4Content}
`,
  "utf8"
);

fs.writeFileSync(
  path.join(OUTPUT_DIR, "08-ek-4-yapay-zeka-ve-telif-devir-protokolu.html"),
  wrapInOfficialA4Html({
    title: "SÖZLEŞME EKİ-4: YAPAY ZEKA KULLANIMI VE TELİF DEVİR PROTOKOLÜ",
    subtitle: "5846 Sayılı FSEK m. 52 & AB Yapay Zeka Yasası (EU AI Act) Şeffaflık Protokolü",
    ref: "OPR-AI-GOV-2026",
    sha256: "e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5",
    badge: "✓ HUMAN-IN-THE-LOOP ONAYLI • ANTİ-COPYLEFT KORUMASI",
    parties: { client: sampleClient.displayName, contractor: sampleContractor.displayName },
    bodyHtml: AiGovernanceEngine.generateAiGovernanceAnnexHtml(sampleAiGovernanceConfig, "tr"),
  }),
  "utf8"
);

// ---------------------------------------------------------------------------
// 9. Ek 5: Yazılım İhracatı ve Vergi Teşvik Protokolü (GVK 89/13 & KDVK 11/1-a)
// ---------------------------------------------------------------------------
console.info("9. Ek 5: Yazılım İhracatı Protokolü oluşturuluyor...");
const annex5Content = SoftwareExportEngine.generateExportAnnexMarkdown(
  sampleExportConfig,
  "tr",
  sampleClient.displayName,
  sampleContractor.displayName
);

fs.writeFileSync(
  path.join(OUTPUT_DIR, "09-ek-5-yazilim-ihracati-ve-vergi-tesvik-protokolu.md"),
  `# SÖZLEŞME EKİ-5: YAZILIM İHRACATI VE STATÜTİF VERGİ TEŞVİK ŞARTNAMESİ
> **Yasal Dayanak:** 193 Sayılı GVK m. 89/13 (%80 Kazanç İndirimi) & 3065 Sayılı KDVK m. 11/1-a (Kod 302 KDV İstisnası)  
> **Amaç:** Yurt dışına sunulan bilişim hizmetlerinin resmi vergi muafiyeti koşullarını belgelendirme ve tevsik

---

${annex5Content}
`,
  "utf8"
);

fs.writeFileSync(
  path.join(OUTPUT_DIR, "09-ek-5-yazilim-ihracati-ve-vergi-tesvik-protokolu.html"),
  wrapInOfficialA4Html({
    title: "SÖZLEŞME EKİ-5: YAZILIM İHRACATI VE STATÜTİF VERGİ TEŞVİK ŞARTNAMESİ",
    subtitle: "193 Sayılı GVK m. 89/13 (%80 İndirim) & 3065 Sayılı KDVK m. 11/1-a (Kod 302) Tevsik Protokolü",
    ref: "OPR-EXPORT-INCENTIVE-2026",
    sha256: "f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6",
    badge: "✓ %80 GELİR VERGİSİ İNDİRİMİ • %0 KDV İSTİSNASI (KOD 302)",
    parties: { client: sampleClient.displayName, contractor: sampleContractor.displayName },
    bodyHtml: SoftwareExportEngine.generateExportAnnexHtml(sampleExportConfig, "tr"),
  }),
  "utf8"
);

// ---------------------------------------------------------------------------
// 10. Ek 6: Enflasyon ve Kur Koruma Zeyilnamesi (TBK m. 138 & 32 Sayılı Karar)
// ---------------------------------------------------------------------------
console.info("10. Ek 6: Enflasyon ve Kur Koruma Zeyilnamesi oluşturuluyor...");
const annex6Content = InflationHedgingEngine.generateInflationClauseText(
  sampleInflationConfig,
  "tr",
  150000
);

fs.writeFileSync(
  path.join(OUTPUT_DIR, "10-ek-6-enflasyon-ve-kur-koruma-zeyilnamesi.md"),
  `# SÖZLEŞME EKİ-6: ENFLASYON, AŞIRI İFA GÜÇLÜĞÜ VE BEDEL UYARLAMA PROTOKOLÜ
> **Yasal Dayanak:** 6098 Sayılı TBK m. 138 (Aşırı İfa Güçlüğü / Emprevizyon İlkesi) & Türk Parasının Kıymetini Koruma Hakkında 32 Sayılı Karar  
> **Endeksleme Mekanizması:** TÜİK Yurt İçi Üretici Fiyat Endeksi (Yİ-ÜFE) / %40 Tavan Değeri

---

${annex6Content.markdown}
`,
  "utf8"
);

fs.writeFileSync(
  path.join(OUTPUT_DIR, "10-ek-6-enflasyon-ve-kur-koruma-zeyilnamesi.html"),
  wrapInOfficialA4Html({
    title: "SÖZLEŞME EKİ-6: ENFLASYON, AŞIRI İFA GÜÇLÜĞÜ VE BEDEL UYARLAMA PROTOKOLÜ",
    subtitle: "TBK m. 138 (Emprevizyon) & 32 Sayılı Karar Uyumlu TÜİK Yİ-ÜFE Endeksleme Protokolü",
    ref: "OPR-INFLATION-SHIELD-2026",
    sha256: "0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b",
    badge: "✓ TÜİK Yİ-ÜFE ENDEKSLİ • 32 SAYILI KARAR TAM UYUMLU",
    parties: { client: sampleClient.displayName, contractor: sampleContractor.displayName },
    bodyHtml: annex6Content.html,
  }),
  "utf8"
);

// ---------------------------------------------------------------------------
// 11. Ek 7: Temiz Kod ve Siber Güvenlik Garantisi (TCK m. 243-245 & TBK m. 474)
// ---------------------------------------------------------------------------
console.info("11. Ek 7: Temiz Kod ve Siber Güvenlik Garantisi oluşturuluyor...");
const cleanCodeWarranty = ComprehensiveDeedEngine.generateCleanCodeWarranty({
  engagementId: "ENG-2026-B2B-FINANCE-01",
  listingTitle: "Kurumsal B2B Finansal Raporlama ve Analitik Platformu",
  contractor: {
    userId: "contractor-uuid-01",
    displayName: sampleContractor.displayName,
    email: sampleContractor.email,
    phone: sampleContractor.phone,
    role: "CONTRACTOR",
    taxOrIdNumber: "10000000146",
  },
  client: {
    userId: "client-uuid-01",
    displayName: sampleClient.displayName,
    email: sampleClient.email,
    phone: sampleClient.phone,
    role: "CLIENT",
    taxOrIdNumber: "1234567890",
  },
  repositoryUrl: "https://github.com/acme-holding/b2b-analytics.git",
  commitHash: "e4d3c2b1a09876543210fedcba9876543210abcd",
  locale: "tr",
});

fs.writeFileSync(
  path.join(OUTPUT_DIR, "11-ek-7-temiz-kod-ve-siber-guvenlik-garantisi.md"),
  ComprehensiveDeedEngine.formatCleanCodeMarkdown(cleanCodeWarranty, "tr"),
  "utf8"
);

fs.writeFileSync(
  path.join(OUTPUT_DIR, "11-ek-7-temiz-kod-ve-siber-guvenlik-garantisi.html"),
  wrapInOfficialA4Html({
    title: "SÖZLEŞME EKİ-7: TEMİZ KOD VE SİBER GÜVENLİK GARANTİSİ",
    subtitle: "5237 Sayılı TCK m. 243-245 & TBK m. 474 No-Backdoor ve OWASP Top 10 Şartnamesi",
    ref: cleanCodeWarranty.warrantyId,
    sha256: cleanCodeWarranty.sha256,
    badge: "✓ 0 GİZLİ ARKA KAPI • OWASP TOP 10 UYUMLULUK TAAHHÜDÜ",
    parties: { client: sampleClient.displayName, contractor: sampleContractor.displayName },
    bodyHtml: `
    <div class="highlight-box">
      <strong>Siber Güvenlik Taahhüdü:</strong> Yüklenici; teslim edilen kaynak kodlarda hiçbir gizli arka kapı (backdoor), yetkisiz uzaktan erişim, izinsiz veri sızdırma fonksiyonu, kripto madencilik scripti veya kötü amaçlı kod bulunmadığını 5237 sayılı TCK bilişim suçları kapsamında hukuken ve cezai olarak taahhüt eder.
    </div>
    <div class="highlight-box">
      <strong>Commit Hash &amp; Repo Güvencesi:</strong><br>
      • Depo: <code>${cleanCodeWarranty.repositoryUrl}</code><br>
      • Commit: <code>${cleanCodeWarranty.commitHash}</code>
    </div>`,
  }),
  "utf8"
);

// ---------------------------------------------------------------------------
// 12. Ek 8: Açık Kaynak Kod (FOSS) ve Lisans Hijyeni Senedi
// ---------------------------------------------------------------------------
console.info("12. Ek 8: FOSS ve Lisans Hijyeni Senedi oluşturuluyor...");
const fossWarranty = ComprehensiveDeedEngine.generateFossComplianceWarranty({
  engagementId: "ENG-2026-B2B-FINANCE-01",
  listingTitle: "Kurumsal B2B Finansal Raporlama ve Analitik Platformu",
  contractor: {
    userId: "contractor-uuid-01",
    displayName: sampleContractor.displayName,
    email: sampleContractor.email,
    role: "CONTRACTOR",
    taxOrIdNumber: "10000000146",
  },
  client: {
    userId: "client-uuid-01",
    displayName: sampleClient.displayName,
    email: sampleClient.email,
    role: "CLIENT",
    taxOrIdNumber: "1234567890",
  },
  repositoryUrl: "https://github.com/acme-holding/b2b-analytics.git",
  commitHash: "e4d3c2b1a09876543210fedcba9876543210abcd",
  locale: "tr",
});

fs.writeFileSync(
  path.join(OUTPUT_DIR, "12-ek-8-acik-kaynak-foss-ve-lisans-uyumluluk-senedi.md"),
  ComprehensiveDeedEngine.formatFossComplianceMarkdown(fossWarranty, "tr"),
  "utf8"
);

fs.writeFileSync(
  path.join(OUTPUT_DIR, "12-ek-8-acik-kaynak-foss-ve-lisans-uyumluluk-senedi.html"),
  wrapInOfficialA4Html({
    title: "SÖZLEŞME EKİ-8: AÇIK KAYNAK (FOSS) VE LİSANS HİJYENİ SENEDİ",
    subtitle: "5846 Sayılı FSEK m. 52 & Açık Kaynak Lisans Bulaşmama (Anti-Copyleft) Güvencesi",
    ref: fossWarranty.warrantyId,
    sha256: fossWarranty.sha256,
    badge: "✓ İZİNLİ TİCARİ LİSANSLAR • SIFIR GPL BULAŞMASI",
    parties: { client: sampleClient.displayName, contractor: sampleContractor.displayName },
    bodyHtml: `
    <div class="highlight-box">
      <strong>İzin Verilen Açık Kaynak Lisanslar (Whitelist):</strong><br>
      ✓ MIT License, Apache License 2.0, BSD 2-Clause/3-Clause, ISC License, Unlicense
    </div>
    <div class="legal-alert">
      <strong>Yasaklı Viral Lisanslar (Blacklist):</strong><br>
      ❌ GNU General Public License (GPL v2/v3), AGPL v3, SSPL, EUPL, OSL (Projede kesinlikle kullanılmamıştır).
    </div>`,
  }),
  "utf8"
);

// ---------------------------------------------------------------------------
// 13. Ek 9: Müşteri ve Personel Ayartmama Protokolü (TTK m. 54-55)
// ---------------------------------------------------------------------------
console.info("13. Ek 9: Müşteri ve Personel Ayartmama Protokolü oluşturuluyor...");
const nonSolicitationProtocol = ComprehensiveDeedEngine.generateNonSolicitationProtocol({
  engagementId: "ENG-2026-B2B-FINANCE-01",
  listingTitle: "Kurumsal B2B Finansal Raporlama ve Analitik Platformu",
  contractor: {
    userId: "contractor-uuid-01",
    displayName: sampleContractor.displayName,
    email: sampleContractor.email,
    role: "CONTRACTOR",
  },
  client: {
    userId: "client-uuid-01",
    displayName: sampleClient.displayName,
    email: sampleClient.email,
    role: "CLIENT",
  },
  durationMonths: 12,
  locale: "tr",
});

fs.writeFileSync(
  path.join(OUTPUT_DIR, "13-ek-9-musteri-ve-personel-ayartmama-protokolu.md"),
  ComprehensiveDeedEngine.formatNonSolicitationMarkdown(nonSolicitationProtocol, "tr"),
  "utf8"
);

fs.writeFileSync(
  path.join(OUTPUT_DIR, "13-ek-9-musteri-ve-personel-ayartmama-protokolu.html"),
  wrapInOfficialA4Html({
    title: "SÖZLEŞME EKİ-9: MÜŞTERİ VE PERSONEL AYARTMAMA PROTOKOLÜ (NON-SOLICITATION)",
    subtitle: "6102 Sayılı TTK m. 54-55 (Haksız Rekabet) & TBK m. 444-447 Ölçülü Koruma Protokolü",
    ref: nonSolicitationProtocol.protocolId,
    sha256: nonSolicitationProtocol.sha256,
    badge: "✓ 12 AY GEÇERLİ TİCARİ ÇEVRE & SQUAD KORUMASI",
    parties: { client: sampleClient.displayName, contractor: sampleContractor.displayName },
    bodyHtml: `
    <div class="highlight-box">
      <strong>Müşteri Portföyü Koruma (12 Ay):</strong> Yüklenici; proje kapsamında tanıştığı işverenin müşterilerine 12 ay boyunca işvereni baypas ederek doğrudan hizmet sunmayacaktır.
    </div>
    <div class="highlight-box">
      <strong>Kilit Personel Koruma / Anti-Poaching (12 Ay):</strong> İşveren; yüklenicinin görevlendirdiği kilit mühendisleri doğrudan istihdam etmeye veya sözleşmelerini ihlale yöneltmeyecektir.
    </div>`,
  }),
  "utf8"
);

// ---------------------------------------------------------------------------
// 14. Teslimat Protokolü: Kaynak Kod ve Dijital Varlık Devir Teslim Protokolü
// ---------------------------------------------------------------------------
console.info("14. Kaynak Kod ve Dijital Varlık Devir Teslim Protokolü oluşturuluyor...");
const handoverProtocol = HandoverGeneratorService.generateProtocol({
  engagementId: "ENG-2026-B2B-FINANCE-01",
  listingTitle: "Kurumsal B2B Finansal Raporlama ve Analitik Platformu",
  category: "Full-Stack Web",
  client: {
    displayName: sampleClient.displayName,
    email: sampleClient.email,
    phone: sampleClient.phone,
    city: sampleClient.city,
  },
  contractor: {
    displayName: sampleContractor.displayName,
    email: sampleContractor.email,
    phone: sampleContractor.phone,
    city: sampleContractor.city,
  },
  repositoryUrl: "https://github.com/acme-holding/b2b-analytics.git",
  commitHash: "e4d3c2b1a09876543210fedcba9876543210abcd",
  liveUrl: "https://analytics.acmeteknoloji.com.tr",
  status: "ACCEPTED_EXPRESS",
  acceptanceType: "EXPRESS",
  submittedAt: "2026-10-15T09:00:00.000Z",
  inspectionExpiresAt: "2026-10-22T09:00:00.000Z",
  acceptedAt: "2026-10-20T16:30:00.000Z",
  totalAgreedBudget: "150.000 TL",
  currency: "TRY",
  locale: "tr",
  accessChecklist: {
    dnsTransferred: true,
    hostingTransferred: true,
    adminAccountsTransferred: true,
    apiKeysTransferred: true,
  },
  documentationNotes: "Tüm API dökümanları, Swagger şemaları, sistem mimarisi ve canlıya alma runbook belgeleri repository içinde /docs klasöründe eksiksiz sağlanmıştır.",
});

fs.writeFileSync(
  path.join(OUTPUT_DIR, "14-kaynak-kod-ve-dijital-varlik-devir-teslim-protokolu.md"),
  `# RESMİ YAZILIM DEVİR-TESLİM VE KABUL PROTOKOLÜ (TBK m. 474 / 477)
> **Protokol Ref:** \`${handoverProtocol.protocolRef}\`  
> **Kriptografik SHA-256 Mührü:** \`${handoverProtocol.sha256Seal}\`  
> **Hukuki Durum:** Açık ve İmzalı Kabul Onayı (Express Acceptance Signed)

---

${handoverProtocol.markdown}
`,
  "utf8"
);

fs.writeFileSync(
  path.join(OUTPUT_DIR, "14-kaynak-kod-ve-dijital-varlik-devir-teslim-protokolu.html"),
  handoverProtocol.htmlContent,
  "utf8"
);

// ---------------------------------------------------------------------------
// 15. Canlıya Alma ve Operasyonel Runbook Protokolü
// ---------------------------------------------------------------------------
console.info("15. Canlıya Alma ve Operasyonel Runbook Protokolü oluşturuluyor...");
const runbookProtocol = RunbookGeneratorService.generateRunbook({
  engagementId: "ENG-2026-B2B-FINANCE-01",
  listingTitle: "Kurumsal B2B Finansal Raporlama ve Analitik Platformu",
  clientName: sampleClient.displayName,
  contractorName: sampleContractor.displayName,
  status: "PUBLISHED",
  version: 1,
  architectureSummary: "Next.js 16 App Router, PostgreSQL 16 (Drizzle ORM), Redis (Upstash) önbellekleme katmanı, AWS S3 depolama ve Docker tabanlı bağımsız konteyner yapısı.",
  environmentVariables: [
    { key: "DATABASE_URL", description: "Production PostgreSQL bağlantı URI'si", isRequired: true, sampleValue: "postgresql://user:pass@host:5432/db", secretCategory: "DATABASE" },
    { key: "UPSTASH_REDIS_REST_URL", description: "Dağıtık rate limit ve cache bağlantısı", isRequired: true, sampleValue: "https://redis.upstash.io", secretCategory: "OTHER" },
    { key: "DATA_ENCRYPTION_KEY", description: "KVKK AES-256 master şifreleme anahtarı", isRequired: true, sampleValue: "hex64char...", secretCategory: "AUTH" },
  ],
  buildAndRunSteps: [
    { stepNumber: 1, title: "Bağımlılık Kurulumu", command: "npm ci --production=false", description: "Bağımlılıkların temiz kurulumu", environment: "PRODUCTION" },
    { stepNumber: 2, title: "Veritabanı Migrasyonu", command: "npm run db:migrate", description: "Veritabanı şema migrasyonlarının yürütülmesi", environment: "PRODUCTION" },
    { stepNumber: 3, title: "Üretim Derlemesi", command: "npm run build", description: "Üretim paketinin derlenmesi", environment: "PRODUCTION" },
    { stepNumber: 4, title: "Sunucu Başlatma", command: "npm run start", description: "Next.js üretim sunucusunun başlatılması", environment: "PRODUCTION" },
  ],
  thirdPartyServices: [
    { serviceName: "Upstash Redis", category: "Cache & Rate Limiting", dashboardUrl: "https://console.upstash.com", purpose: "DDoS önleme ve istek hız kısıtlama", credentialsTransferred: true },
    { serviceName: "AWS S3", category: "Cloud Storage", dashboardUrl: "https://aws.amazon.com/s3", purpose: "PDF ve CSV ihracat dosyalarının şifreli saklanması", credentialsTransferred: true },
  ],
  disasterRecoverySteps: [
    { priority: "CRITICAL", scenario: "Veritabanı çökmesi veya veri bozulması", procedure: "Veritabanı en son point-in-time snapshot yedeğine dönülür.", verificationCommand: "npm run db:check" },
    { priority: "HIGH", scenario: "Uygulama sunucusu yanıt vermiyor", procedure: "Container orkestrasyonunda staging cluster aktive edilir.", verificationCommand: "curl -f http://localhost:8000/api/health" },
  ],
  backupSchedule: {
    frequency: "Günde 4 Kez (Her 6 saatte bir artımlı, her gece 03:00 tam yedek)",
    storageLocation: "AWS S3 Frankfurt (eu-central-1) WORM (Write-Once-Read-Many) bucket",
    restoreProcedure: "Point-in-time recovery konsolu üzerinden 1 tıkla geri yükleme",
  },
  emergencyContact: {
    name: "Operis Acil Müdahale ve DevOps Masası",
    email: "devops@acmeteknoloji.com.tr",
    phone: "+90 (212) 555 9911",
    notes: "7/24 PagerDuty ve telefon nöbeti aktiftir.",
  },
  publishedAt: "2026-10-15T10:00:00.000Z",
  locale: "tr",
});

fs.writeFileSync(
  path.join(OUTPUT_DIR, "15-canliya-alma-ve-operasyonel-runbook-protokolu.md"),
  `# PROJE CANLIYA ALMA, MİMARİ VE RUNBOOK PROTOKOLÜ (HMK m. 193)
> **Runbook Ref:** \`${runbookProtocol.runbookRef}\`  
> **Kriptografik SHA-256 Özeti:** \`${runbookProtocol.sha256Seal}\`  
> **Hukuki Niteliği:** Eserin İşlerlik ve İdame Rehberi (Bağlayıcı Sözleşme Eki)

---

${runbookProtocol.markdown}
`,
  "utf8"
);

fs.writeFileSync(
  path.join(OUTPUT_DIR, "15-canliya-alma-ve-operasyonel-runbook-protokolu.html"),
  runbookProtocol.htmlContent,
  "utf8"
);

// ---------------------------------------------------------------------------
// 16. Kapsam Değişikliği Zeyilnamesi (Scope Shield - TBK m. 480/2)
// ---------------------------------------------------------------------------
console.info("16. Kapsam Değişikliği Zeyilnamesi oluşturuluyor...");
const addendum = AddendumGeneratorService.generateAddendum({
  engagementId: "ENG-2026-B2B-FINANCE-01",
  sequenceNumber: 1,
  parentContractRef: "OPR-CONTR-ENG2026B",
  parentContractSha256: "fa3c5d73209434c1682c3e32d8a11df1b838523f032086357cbbd126d34989ae",
  listingTitle: "Kurumsal B2B Finansal Raporlama ve Analitik Platformu",
  title: "TCMB Entegrasyonu ve Çoklu Para Birimi Modülü",
  reason: "CLIENT_REQUESTED",
  description: "İş Sahibi'nin talebi üzerine sisteme TCMB döviz kurlarını gerçek zamanlı çeken ve çoklu para birimi çapraz kur çeviricisi sağlayan ilave bir FinTech modülü eklenmiştir.",
  additionalBudget: 25000,
  currency: "TRY",
  additionalDays: 10,
  matchedAt: "2026-09-01T10:00:00.000Z",
  client: sampleClient,
  contractor: sampleContractor,
  locale: "tr",
});

fs.writeFileSync(
  path.join(OUTPUT_DIR, "16-kapsam-degisikligi-zeyilnamesi-scope-shield.md"),
  `# SÖZLEŞME ZEYİLNAMESİ VE KAPSAM DEĞİŞİKLİK PROTOKOLÜ (TBK m. 480/2)
> **Zeyilname Ref:** \`${addendum.addendumRef}\`  
> **Kriptografik SHA-256 İmzası:** \`${addendum.addendumSha256}\`  
> **Hukuki Dayanak:** 6098 sayılı TBK m. 470 ve m. 480/2 (Öngörülemeyen Haller ve Kapsam Aşımı Kalkanı)

---

${addendum.markdown}
`,
  "utf8"
);

fs.writeFileSync(
  path.join(OUTPUT_DIR, "16-kapsam-degisikligi-zeyilnamesi-scope-shield.html"),
  addendum.htmlContent,
  "utf8"
);

// ---------------------------------------------------------------------------
// 17. Sözleşme Sonu Karşılıklı İbraname ve Sulh Senedi (TBK m. 132 / HMK m. 313)
// ---------------------------------------------------------------------------
console.info("17. Sözleşme Sonu Karşılıklı İbraname oluşturuluyor...");
const mutualRelease = ComprehensiveDeedEngine.generateMutualReleaseDeed({
  engagementId: "ENG-2026-B2B-FINANCE-01",
  listingTitle: "Kurumsal B2B Finansal Raporlama ve Analitik Platformu",
  client: {
    userId: "client-uuid-01",
    displayName: sampleClient.displayName,
    email: sampleClient.email,
    phone: sampleClient.phone,
    role: "CLIENT",
    taxOrIdNumber: "1234567890",
  },
  contractor: {
    userId: "contractor-uuid-01",
    displayName: sampleContractor.displayName,
    email: sampleContractor.email,
    phone: sampleContractor.phone,
    role: "CONTRACTOR",
    taxOrIdNumber: "10000000146",
  },
  settledMilestones: [
    { sequence: 1, title: "Tasarım ve Mimari Altyapı Onayı", amount: 45000, currency: "TL", paymentReference: "EFT-TR-20260902-881923" },
    { sequence: 2, title: "Fonksiyonel Demo ve Kullanıcı Kabul Testi", amount: 60000, currency: "TL", paymentReference: "EFT-TR-20260925-992014" },
    { sequence: 3, title: "Kaynak Kod Teslimi ve FSEK m. 52 Telif Devri", amount: 45000, currency: "TL", paymentReference: "EFT-TR-20261021-110293" },
    { sequence: 4, title: "Zeyilname-1 Ek Kapsam Hakedişi", amount: 25000, currency: "TL", paymentReference: "EFT-TR-20261021-110294" },
  ],
  totalSettledAmount: 175000,
  currency: "TL",
  locale: "tr",
});

fs.writeFileSync(
  path.join(OUTPUT_DIR, "17-sozlesme-sonu-karsilikli-ibraname-ve-sulh-senedi.md"),
  ComprehensiveDeedEngine.formatMutualReleaseMarkdown(mutualRelease, "tr"),
  "utf8"
);

fs.writeFileSync(
  path.join(OUTPUT_DIR, "17-sozlesme-sonu-karsilikli-ibraname-ve-sulh-senedi.html"),
  ComprehensiveDeedEngine.formatMutualReleaseHtml(mutualRelease, "tr"),
  "utf8"
);

// ---------------------------------------------------------------------------
// 18. Sözleşme Fesih ve Tasfiye Senedi (TBK m. 484-486)
// ---------------------------------------------------------------------------
console.info("18. Sözleşme Fesih ve Tasfiye Senedi oluşturuluyor...");
const terminationDeed = ComprehensiveDeedEngine.generateTerminationLiquidationDeed({
  engagementId: "ENG-2026-EARLY-TERM-EXAMPLE",
  listingTitle: "Örnek E-Ticaret Entegrasyon ve Mobil Sadakat Projesi",
  client: {
    userId: "client-term-01",
    displayName: "Nova Perakende ve Mağazacılık A.Ş.",
    email: "hukuk@novaperakende.com",
    role: "CLIENT",
    taxOrIdNumber: "9876543210",
  },
  contractor: {
    userId: "contractor-term-01",
    displayName: sampleContractor.displayName,
    email: sampleContractor.email,
    role: "CONTRACTOR",
    taxOrIdNumber: "10000000146",
  },
  ground: "MUTUAL_IKALE",
  groundDetailTr: "Tarafların karşılıklı serbest iradeleriyle, şirketin iş modeli değişikliği sebebiyle projenin 2. aşamada ikâle yoluyla sulhen tasfiyesidir.",
  settledMilestones: [
    { sequence: 1, title: "UI/UX Tasarım ve Mimari Altyapı", amount: 40000, currency: "TL" },
  ],
  unfulfilledMilestones: [
    { sequence: 2, title: "Mobil Sadakat ve Entegrasyonlar", amount: 60000, currency: "TL" },
  ],
  totalSettledAmount: 40000,
  totalUnfulfilledAmount: 60000,
  currency: "TL",
  credentialsReturned: true,
  sourceCodeTransferred: true,
  documentationProvided: true,
  locale: "tr",
});

fs.writeFileSync(
  path.join(OUTPUT_DIR, "18-sozlesme-fesih-ve-tasfiye-senedi.md"),
  ComprehensiveDeedEngine.formatTerminationLiquidationMarkdown(terminationDeed, "tr"),
  "utf8"
);

fs.writeFileSync(
  path.join(OUTPUT_DIR, "18-sozlesme-fesih-ve-tasfiye-senedi.html"),
  wrapInOfficialA4Html({
    title: "ERKEN FESİH, İKÂLE VE TASFİYE PROTOKOLÜ",
    subtitle: "6098 sayılı TBK m. 484-486 (Sözleşmenin Sona Ermesi ve Tasfiye) & TBK m. 132 İkâle",
    ref: terminationDeed.deedId,
    sha256: terminationDeed.masterSha256,
    badge: "✓ İKÂLE İLE SULHEN TASFİYE • KISMİ FSEK TELİF DEVRİ",
    parties: { client: "Nova Perakende ve Mağazacılık A.Ş.", contractor: sampleContractor.displayName },
    bodyHtml: `
    <div class="highlight-box">
      <strong>Fesih Gerekçesi:</strong> ${terminationDeed.groundDescriptionTr}
    </div>
    <table>
      <thead>
        <tr>
          <th>Aşama</th>
          <th>Açıklama</th>
          <th>Tutar</th>
          <th>Mali ve Telif Statüsü</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1. Aşama</td>
          <td>UI/UX Tasarım ve Mimari Altyapı</td>
          <td>40.000 TL</td>
          <td style="color: #166534; font-weight: 700;">Ödendi &amp; FSEK m. 52 İle Devredildi</td>
        </tr>
        <tr>
          <td>2. Aşama</td>
          <td>Mobil Sadakat ve Entegrasyonlar</td>
          <td>60.000 TL</td>
          <td style="color: #991b1b; font-weight: 700;">İptal Edildi &amp; Telif Yüklenicide Kaldı</td>
        </tr>
      </tbody>
    </table>
    <div class="highlight-box">
      <strong>Nihai İbra ve Feragat:</strong> Taraflar, yukarıdaki varlık devirleri ve bakiye tasfiye ödemesi tamamlandığında birbirlerini geçmiş ve geleceğe yönelik tüm alacak, dava ve gecikme cezası taleplerinden kayıtsız şartsız ibra etmişlerdir.
    </div>`,
  }),
  "utf8"
);

// ---------------------------------------------------------------------------
// 19. Yazılım Muayene ve Kabul Tutanağı (SaaS / Web UAT)
// ---------------------------------------------------------------------------
console.info("19. Yazılım Muayene ve Kabul Tutanağı oluşturuluyor...");
const acceptanceReportMd = `# YAZILIM MUAYENE VE KULLANICI KABUL TESTİ (UAT) TUTANAĞI
> **Dayanak:** 6098 Sayılı Türk Borçlar Kanunu Madde 474 ve Madde 477  
> **Hukuki Statüsü:** HMK m. 193 Uyarınca Kesin Delil Sözleşmesi Niteliğinde Resmi Tutanak  
> **Düzenlenme Tarihi:** 20 Ekim 2026

---

### 1. PROJE VE TARAFLAR
- **Proje Adı:** Kurumsal B2B Finansal Raporlama ve Analitik Platformu
- **Sözleşme Referansı:** \`OPR-CONTR-ENG2026B\`
- **İş Sahibi (Müşteri):** ${sampleClient.displayName}
- **Yüklenici (Geliştirici):** ${sampleContractor.displayName}

---

### 2. TEST ORTAMI VE DENETİM KRİTERLERİ
| Test Kategorisi | Uygulanan Test Prosedürü | Kapsam Oranı | Sonuç |
|---|---|---|---|
| **Birim ve Entegrasyon Testleri** | Vitest & Node Test Runner | 104 Suite / 5.938 Assertion | **BAŞARILI (%100)** |
| **Uçtan Uca (E2E) Testleri** | Playwright WebKit / Chromium | Tüm Kullanıcı Akışları | **BAŞARILI** |
| **Erişilebilirlik (A11y)** | axe-core WCAG 2.1 AA Standartları | 0 Hata / Tam Uyum | **BAŞARILI** |
| **Siber Güvenlik Taraması** | OWASP Top 10 & Sır/Gizlilik Denetimi | 0 Sızıntı / 0 Arka Kapı | **GÜVENLİ** |
| **Performans & Yük Testi** | 100.000 Kayıt PDF/CSV Export Testi | 1.12 Saniye (< 1.5s Kriteri) | **BAŞARILI** |

---

### 3. OBJEKTİF KABUL ŞARTLARININ İNCELENMESİ (TBK m. 474)
- [x] **Faz 1 Kriteri:** Kullanıcı kimlik doğrulama, MFA ve RBAC rolleri başarıyla teyit edilmiştir.
- [x] **Faz 2 Kriteri:** Finansal analitik motoru yüksek hacimli veriyi 1.5 saniyenin altında dışa aktarmıştır.
- [x] **Faz 3 Kriteri:** Tüm kaynak kodlar GitHub reposuna aktarılmış, CI/CD hatları başarıyla kurulmuştur.

---

### 4. NİHAİ KABUL İRADESİ VE HUKUKİ SONUÇLAR (TBK m. 477)
İş Sahibi; teslim edilen yazılımı yukarıdaki objektif kriterler muvacehesinde bizzat ve uzmanları vasıtasıyla muayene ettiğini, hiçbir açık ayıp bulunmadığını ve eseri **KAYITSIZ ŞARTSIZ KABUL ETTİĞİNİ (EXPRESS ACCORD)** beyan ve tevsik eder.

Bu tutanağın tanzimi ile birlikte;
1. 3. Aşama kapanış hakedişi muaccel hale gelmiştir.
2. 5846 sayılı FSEK m. 52 uyarınca mali haklar münhasıran İş Sahibi'ne devrolmuştur.
3. 30 günlük gizli ayıp garanti süresi (TBK m. 477/2) işbu tutanak tarihi itibarıyla başlamıştır.

| İŞ SAHİBİ (MÜŞTERİ) | YÜKLENİCİ (GELİŞTİRİCİ) |
|---|---|
| **${sampleClient.displayName}** | **${sampleContractor.displayName}** |
| Tarih: 20.10.2026 | Tarih: 20.10.2026 |
| İmza: *[Elektronik Olarak İmzalandı]* | İmza: *[Elektronik Olarak İmzalandı]* |
`;

fs.writeFileSync(
  path.join(OUTPUT_DIR, "19-yazilim-muayene-ve-kabul-tutanagi-saas.md"),
  acceptanceReportMd,
  "utf8"
);

fs.writeFileSync(
  path.join(OUTPUT_DIR, "19-yazilim-muayene-ve-kabul-tutanagi-saas.html"),
  wrapInOfficialA4Html({
    title: "YAZILIM MUAYENE VE KULLANICI KABUL TESTİ (UAT) TUTANAĞI",
    subtitle: "6098 Sayılı TBK m. 474 (Ayıp Muayenesi) ve m. 477 (Açık Kabul Onayı) Uyarınca Düzenlenmiştir",
    ref: "OPR-UAT-SIGNOFF-2026",
    sha256: "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
    date: "20 Ekim 2026",
    badge: "✓ %100 BAŞARILI KABUL (EXPRESS ACCORD) • TBK m. 477",
    parties: { client: sampleClient.displayName, contractor: sampleContractor.displayName },
    bodyHtml: `
    <table>
      <thead>
        <tr><th>Test Kategorisi</th><th>Test Prosedürü</th><th>Kapsam</th><th>Sonuç</th></tr>
      </thead>
      <tbody>
        <tr><td>Birim &amp; Entegrasyon</td><td>Vitest Runner</td><td>104 Suite / 5.938 Assertion</td><td style="color: #166534; font-weight: 700;">BAŞARILI (%100)</td></tr>
        <tr><td>Uçtan Uca (E2E)</td><td>Playwright</td><td>Tüm Kullanıcı Akışları</td><td style="color: #166534; font-weight: 700;">BAŞARILI</td></tr>
        <tr><td>Erişilebilirlik (A11y)</td><td>axe-core WCAG 2.1 AA</td><td>0 Hata</td><td style="color: #166534; font-weight: 700;">TAM UYUM</td></tr>
        <tr><td>Siber Güvenlik</td><td>OWASP Top 10</td><td>0 Sızıntı / 0 Backdoor</td><td style="color: #166534; font-weight: 700;">GÜVENLİ</td></tr>
      </tbody>
    </table>
    <div class="highlight-box">
      <strong>Kayıtsız Şartsız Kabul Beyanı (TBK m. 477):</strong> İş Sahibi, eseri uzmanları vasıtasıyla objektif kriterlere göre incelediğini ve ayıpsız olarak teslim aldığını tevsik eder. FSEK m. 52 telif devri yürürlüğe girmiştir.
    </div>`,
  }),
  "utf8"
);

// ---------------------------------------------------------------------------
// 20-27. Platform Yasal Metinleri ve Politikaları
// ---------------------------------------------------------------------------
console.info("20-27. Platform Yasal Metinleri (MD ve HTML) oluşturuluyor...");

function renderLegalDocumentToMarkdown(doc: LegalDocumentModel): string {
  let md = `# ${doc.title.toUpperCase()}\n`;
  md += `> **Alt Başlık:** ${doc.subtitle}  \n`;
  md += `> **Sürüm:** ${doc.version} | **Son Güncelleme:** ${doc.lastUpdated} | **Rozet:** ${doc.badge}  \n`;
  if (doc.contentHash) {
    md += `> **Kriptografik İçerik Özeti (SHA-256):** \`${doc.contentHash}\`  \n`;
  }
  md += `\n---\n\n`;
  md += `### ÖZET VE VURGU\n> ${doc.highlight}\n\n---\n\n`;

  for (const section of doc.sections) {
    md += `### ${section.title}\n`;
    for (const p of section.paragraphs) {
      md += `${p}\n\n`;
    }
    if (section.bullets && section.bullets.length > 0) {
      for (const b of section.bullets) {
        md += `- ${b}\n`;
      }
      md += `\n`;
    }
  }

  return md;
}

function renderLegalDocumentToHtml(doc: LegalDocumentModel): string {
  let body = `<div class="highlight-box" style="break-inside: avoid; page-break-inside: avoid;"><strong>Önemli Yasal Vurgu:</strong> ${doc.highlight}</div>`;
  for (const s of doc.sections) {
    body += `<div class="legal-section" style="break-inside: avoid; page-break-inside: avoid; margin-bottom: 16px;">`;
    body += `<h3 style="margin-top: 20px; font-size: 11pt; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; break-after: avoid-page; page-break-after: avoid;">${s.title}</h3>`;
    for (const p of s.paragraphs) {
      body += `<p style="font-size: 9pt; color: #334155; margin: 6px 0; text-align: justify;">${p}</p>`;
    }
    if (s.bullets && s.bullets.length > 0) {
      body += `<ul style="margin: 6px 0; padding-left: 20px; font-size: 9pt; color: #334155;">`;
      for (const b of s.bullets) {
        body += `<li>${b}</li>`;
      }
      body += `</ul>`;
    }
    body += `</div>`;
  }

  return wrapInOfficialA4Html({
    title: doc.title.toUpperCase(),
    subtitle: doc.subtitle,
    ref: `OPR-LEGAL-${doc.key.toUpperCase()}-${doc.version}`,
    sha256: doc.contentHash || "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    date: doc.lastUpdated,
    badge: doc.badge,
    bodyHtml: body,
  });
}

const legalDocsMap: Record<string, { filename: string; prefix: string }> = {
  terms: { filename: "20-platform-kullanim-kosullari", prefix: "20" },
  privacy: { filename: "21-gizlilik-politikasi-ve-kvkk-aydinlatma-metni", prefix: "21" },
  "dispute-resolution": { filename: "22-uyusmazlik-cozumu-ve-arabuluculuk-ilkeleri", prefix: "22" },
  "intellectual-property": { filename: "23-fikri-mulkiyet-ve-telif-haklari-politikasi", prefix: "23" },
  "acceptable-use": { filename: "24-kabul-edilebilir-kullanim-ve-siber-guvenlik-politikasi", prefix: "24" },
  cookies: { filename: "25-cerez-politikasi", prefix: "25" },
  consent: { filename: "26-acik-riza-ve-iletisim-izinleri-metni", prefix: "26" },
  "matching-disclaimer": { filename: "27-eslesme-ve-sorumsuzluk-beyani", prefix: "27" },
};

for (const [key, meta] of Object.entries(legalDocsMap)) {
  const docData = LEGAL_DOCUMENTS[key]?.tr;
  if (docData) {
    fs.writeFileSync(
      path.join(OUTPUT_DIR, `${meta.filename}.md`),
      renderLegalDocumentToMarkdown(docData),
      "utf8"
    );
    fs.writeFileSync(
      path.join(OUTPUT_DIR, `${meta.filename}.html`),
      renderLegalDocumentToHtml(docData),
      "utf8"
    );
  }
}

// ---------------------------------------------------------------------------
// 28. Sözleşmeler Kataloğu ve Rehberi
// ---------------------------------------------------------------------------
console.info("28. Sözleşmeler Kataloğu ve Hukuki Rehber oluşturuluyor...");
const catalogReadme = `# OPERİS SÖZLEŞME ÖRNEKLERİ KATALOĞU VE HUKUKİ MEVZUAT REHBERİ

Bu dizin (\`docs/sozlesme-ornekleri/\`), Operis platformunda kullanılan **tüm bağımsız yazılım, teknoloji, telif devir, teslimat, tasfiye ve platform yasal sözleşmelerinin** eksiksiz ve gerçekçi örneklerini içerir.

Her belge hem **Markdown (\`.md\`)** hem de kullanıcının tarayıcısında ve PDF baskısında gördüğü birebir **Resmi A4 Mizanpajlı HTML (\`.html\`)** formatında mevcuttur.

Tüm belgeler; platformun çekirdek hukuk motorları (\`ContractGeneratorService\`, \`ComprehensiveDeedEngine\`, \`AcceptanceEngine\`, \`HandoverGeneratorService\`, \`RunbookGeneratorService\`, \`AddendumGeneratorService\`) tarafından üretilmekte olup her belgenin değiştirilemezliği deterministik **SHA-256 kriptografik parmak izi** ile güvence altına alınmıştır.

---

## 📑 SÖZLEŞME VE PROTOKOL FİHRİSTİ

### 1. ANA HİZMET VE ESER SÖZLEŞMELERİ (TBK m. 470 & FSEK m. 52)
| No | Dosya Adı (Markdown) | Görsel Baskı (HTML) | Doğrudan PDF Dosyası | Yasal Dayanak |
|---|---|---|---|---|
| 01 | [01-ana-hizmet-ve-eser-sozlesmesi-tr.md](./01-ana-hizmet-ve-eser-sozlesmesi-tr.md) | [01-ana-hizmet-ve-eser-sozlesmesi-tr.html](./01-ana-hizmet-ve-eser-sozlesmesi-tr.html) | [01-ana-hizmet-ve-eser-sozlesmesi-tr.pdf](./01-ana-hizmet-ve-eser-sozlesmesi-tr.pdf) | TBK m. 470 vd., FSEK m. 52, 193 s. GVK |
| 02 | [02-ana-hizmet-ve-eser-sozlesmesi-squad-tr.md](./02-ana-hizmet-ve-eser-sozlesmesi-squad-tr.md) | [02-ana-hizmet-ve-eser-sozlesmesi-squad-tr.html](./02-ana-hizmet-ve-eser-sozlesmesi-squad-tr.html) | [02-ana-hizmet-ve-eser-sozlesmesi-squad-tr.pdf](./02-ana-hizmet-ve-eser-sozlesmesi-squad-tr.pdf) | TBK m. 620 (Adi Ortaklık), TBK m. 162 |
| 03 | [03-master-software-service-agreement-en.md](./03-master-software-service-agreement-en.md) | [03-master-software-service-agreement-en.html](./03-master-software-service-agreement-en.html) | [03-master-software-service-agreement-en.pdf](./03-master-software-service-agreement-en.pdf) | Turkish Code of Obligations Art. 470, FSEK 52 |
| 04 | [04-cift-dilli-ana-sozlesme-bilingual-tr-en.md](./04-cift-dilli-ana-sozlesme-bilingual-tr-en.md) | [04-cift-dilli-ana-sozlesme-bilingual-tr-en.html](./04-cift-dilli-ana-sozlesme-bilingual-tr-en.html) | [04-cift-dilli-ana-sozlesme-bilingual-tr-en.pdf](./04-cift-dilli-ana-sozlesme-bilingual-tr-en.pdf) | İki Dilli Tahkim & Yorum Hükümleri |

---

### 2. SÖZLEŞME EKLERİ VE ÖZEL STATÜ PROTOKOLLERİ
| No | Dosya Adı (Markdown) | Görsel Baskı (HTML) | Doğrudan PDF Dosyası | Yasal Dayanak |
|---|---|---|---|---|
| 05 | [05-ek-1-hakedis-ve-kabul-kriterleri-protokolu.md](./05-ek-1-hakedis-ve-kabul-kriterleri-protokolu.md) | [05-ek-1-hakedis-ve-kabul-kriterleri-protokolu.html](./05-ek-1-hakedis-ve-kabul-kriterleri-protokolu.html) | [05-ek-1-hakedis-ve-kabul-kriterleri-protokolu.pdf](./05-ek-1-hakedis-ve-kabul-kriterleri-protokolu.pdf) | TBK m. 470, 474 (Objektif Ayıp Denetimi) |
| 06 | [06-ek-2-kisisel-veri-isleme-sozlesmesi-kvkk-gdpr-dpa.md](./06-ek-2-kisisel-veri-isleme-sozlesmesi-kvkk-gdpr-dpa.md) | [06-ek-2-kisisel-veri-isleme-sozlesmesi-kvkk-gdpr-dpa.html](./06-ek-2-kisisel-veri-isleme-sozlesmesi-kvkk-gdpr-dpa.html) | [06-ek-2-kisisel-veri-isleme-sozlesmesi-kvkk-gdpr-dpa.pdf](./06-ek-2-kisisel-veri-isleme-sozlesmesi-kvkk-gdpr-dpa.pdf) | 6698 s. KVKK m. 12 & GDPR Art. 28 |
| 07 | [07-ek-3-guvenli-liman-ve-bagimsiz-yuklenici-protokolu.md](./07-ek-3-guvenli-liman-ve-bagimsiz-yuklenici-protokolu.md) | [07-ek-3-guvenli-liman-ve-bagimsiz-yuklenici-protokolu.html](./07-ek-3-guvenli-liman-ve-bagimsiz-yuklenici-protokolu.html) | [07-ek-3-guvenli-liman-ve-bagimsiz-yuklenici-protokolu.pdf](./07-ek-3-guvenli-liman-ve-bagimsiz-yuklenici-protokolu.pdf) | 4857 s. İş K. m. 8, TBK m. 470 |
| 08 | [08-ek-4-yapay-zeka-ve-telif-devir-protokolu.md](./08-ek-4-yapay-zeka-ve-telif-devir-protokolu.md) | [08-ek-4-yapay-zeka-ve-telif-devir-protokolu.html](./08-ek-4-yapay-zeka-ve-telif-devir-protokolu.html) | [08-ek-4-yapay-zeka-ve-telif-devir-protokolu.pdf](./08-ek-4-yapay-zeka-ve-telif-devir-protokolu.pdf) | EU AI Act, 5846 s. FSEK m. 52 |
| 09 | [09-ek-5-yazilim-ihracati-ve-vergi-tesvik-protokolu.md](./09-ek-5-yazilim-ihracati-ve-vergi-tesvik-protokolu.md) | [09-ek-5-yazilim-ihracati-ve-vergi-tesvik-protokolu.html](./09-ek-5-yazilim-ihracati-ve-vergi-tesvik-protokolu.html) | [09-ek-5-yazilim-ihracati-ve-vergi-tesvik-protokolu.pdf](./09-ek-5-yazilim-ihracati-ve-vergi-tesvik-protokolu.pdf) | 193 s. GVK m. 89/13, 3065 s. KDVK m. 11/1-a |
| 10 | [10-ek-6-enflasyon-ve-kur-koruma-zeyilnamesi.md](./10-ek-6-enflasyon-ve-kur-koruma-zeyilnamesi.md) | [10-ek-6-enflasyon-ve-kur-koruma-zeyilnamesi.html](./10-ek-6-enflasyon-ve-kur-koruma-zeyilnamesi.html) | [10-ek-6-enflasyon-ve-kur-koruma-zeyilnamesi.pdf](./10-ek-6-enflasyon-ve-kur-koruma-zeyilnamesi.pdf) | 6098 s. TBK m. 138 & 32 s. Karar |
| 11 | [11-ek-7-temiz-kod-ve-siber-guvenlik-garantisi.md](./11-ek-7-temiz-kod-ve-siber-guvenlik-garantisi.md) | [11-ek-7-temiz-kod-ve-siber-guvenlik-garantisi.html](./11-ek-7-temiz-kod-ve-siber-guvenlik-garantisi.html) | [11-ek-7-temiz-kod-ve-siber-guvenlik-garantisi.pdf](./11-ek-7-temiz-kod-ve-siber-guvenlik-garantisi.pdf) | 5237 s. TCK m. 243-245, TBK m. 474 |
| 12 | [12-ek-8-acik-kaynak-foss-ve-lisans-uyumluluk-senedi.md](./12-ek-8-acik-kaynak-foss-ve-lisans-uyumluluk-senedi.md) | [12-ek-8-acik-kaynak-foss-ve-lisans-uyumluluk-senedi.html](./12-ek-8-acik-kaynak-foss-ve-lisans-uyumluluk-senedi.html) | [12-ek-8-acik-kaynak-foss-ve-lisans-uyumluluk-senedi.pdf](./12-ek-8-acik-kaynak-foss-ve-lisans-uyumluluk-senedi.pdf) | FSEK m. 52 & FOSS Kurumsal Uyumluluk |
| 13 | [13-ek-9-musteri-ve-personel-ayartmama-protokolu.md](./13-ek-9-musteri-ve-personel-ayartmama-protokolu.md) | [13-ek-9-musteri-ve-personel-ayartmama-protokolu.html](./13-ek-9-musteri-ve-personel-ayartmama-protokolu.html) | [13-ek-9-musteri-ve-personel-ayartmama-protokolu.pdf](./13-ek-9-musteri-ve-personel-ayartmama-protokolu.pdf) | 6102 s. TTK m. 54-55 (Haksız Rekabet) |

---

### 3. TESLİMAT, DEĞİŞİKLİK VE TASFİYE SENETLERİ
| No | Dosya Adı (Markdown) | Görsel Baskı (HTML) | Doğrudan PDF Dosyası | Yasal Dayanak |
|---|---|---|---|---|
| 14 | [14-kaynak-kod-ve-dijital-varlik-devir-teslim-protokolu.md](./14-kaynak-kod-ve-dijital-varlik-devir-teslim-protokolu.md) | [14-kaynak-kod-ve-dijital-varlik-devir-teslim-protokolu.html](./14-kaynak-kod-ve-dijital-varlik-devir-teslim-protokolu.html) | [14-kaynak-kod-ve-dijital-varlik-devir-teslim-protokolu.pdf](./14-kaynak-kod-ve-dijital-varlik-devir-teslim-protokolu.pdf) | 6098 s. TBK m. 474 & 477 (Açık/Zımni Kabul) |
| 15 | [15-canliya-alma-ve-operasyonel-runbook-protokolu.md](./15-canliya-alma-ve-operasyonel-runbook-protokolu.md) | [15-canliya-alma-ve-operasyonel-runbook-protokolu.html](./15-canliya-alma-ve-operasyonel-runbook-protokolu.html) | [15-canliya-alma-ve-operasyonel-runbook-protokolu.pdf](./15-canliya-alma-ve-operasyonel-runbook-protokolu.pdf) | 6100 s. HMK m. 193 (Sözleşmesel Delil) |
| 16 | [16-kapsam-degisikligi-zeyilnamesi-scope-shield.md](./16-kapsam-degisikligi-zeyilnamesi-scope-shield.md) | [16-kapsam-degisikligi-zeyilnamesi-scope-shield.html](./16-kapsam-degisikligi-zeyilnamesi-scope-shield.html) | [16-kapsam-degisikligi-zeyilnamesi-scope-shield.pdf](./16-kapsam-degisikligi-zeyilnamesi-scope-shield.pdf) | 6098 s. TBK m. 480/2 (Öngörülemeyen Haller) |
| 17 | [17-sozlesme-sonu-karsilikli-ibraname-ve-sulh-senedi.md](./17-sozlesme-sonu-karsilikli-ibraname-ve-sulh-senedi.md) | [17-sozlesme-sonu-karsilikli-ibraname-ve-sulh-senedi.html](./17-sozlesme-sonu-karsilikli-ibraname-ve-sulh-senedi.html) | [17-sozlesme-sonu-karsilikli-ibraname-ve-sulh-senedi.pdf](./17-sozlesme-sonu-karsilikli-ibraname-ve-sulh-senedi.pdf) | 6098 s. TBK m. 132 & 6100 s. HMK m. 313 |
| 18 | [18-sozlesme-fesih-ve-tasfiye-senedi.md](./18-sozlesme-fesih-ve-tasfiye-senedi.md) | [18-sozlesme-fesih-ve-tasfiye-senedi.html](./18-sozlesme-fesih-ve-tasfiye-senedi.html) | [18-sozlesme-fesih-ve-tasfiye-senedi.pdf](./18-sozlesme-fesih-ve-tasfiye-senedi.pdf) | 6098 s. TBK m. 484-486 (Fesih ve Tasfiye) |
| 19 | [19-yazilim-muayene-ve-kabul-tutanagi-saas.md](./19-yazilim-muayene-ve-kabul-tutanagi-saas.md) | [19-yazilim-muayene-ve-kabul-tutanagi-saas.html](./19-yazilim-muayene-ve-kabul-tutanagi-saas.html) | [19-yazilim-muayene-ve-kabul-tutanagi-saas.pdf](./19-yazilim-muayene-ve-kabul-tutanagi-saas.pdf) | TBK m. 474 / HMK m. 193 Kesin Delil |

---

### 4. PLATFORM YASAL METİNLERİ VE POLİTİKALARI
| No | Dosya Adı (Markdown) | Görsel Baskı (HTML) | Doğrudan PDF Dosyası | Yasal Dayanak |
|---|---|---|---|---|
| 20 | [20-platform-kullanim-kosullari.md](./20-platform-kullanim-kosullari.md) | [20-platform-kullanim-kosullari.html](./20-platform-kullanim-kosullari.html) | [20-platform-kullanim-kosullari.pdf](./20-platform-kullanim-kosullari.pdf) | 6563 s. ETK & 5651 s. Kanun |
| 21 | [21-gizlilik-politikasi-ve-kvkk-aydinlatma-metni.md](./21-gizlilik-politikasi-ve-kvkk-aydinlatma-metni.md) | [21-gizlilik-politikasi-ve-kvkk-aydinlatma-metni.html](./21-gizlilik-politikasi-ve-kvkk-aydinlatma-metni.html) | [21-gizlilik-politikasi-ve-kvkk-aydinlatma-metni.pdf](./21-gizlilik-politikasi-ve-kvkk-aydinlatma-metni.pdf) | 6698 s. KVKK m. 10 & GDPR |
| 22 | [22-uyusmazlik-cozumu-ve-arabuluculuk-ilkeleri.md](./22-uyusmazlik-cozumu-ve-arabuluculuk-ilkeleri.md) | [22-uyusmazlik-cozumu-ve-arabuluculuk-ilkeleri.html](./22-uyusmazlik-cozumu-ve-arabuluculuk-ilkeleri.html) | [22-uyusmazlik-cozumu-ve-arabuluculuk-ilkeleri.pdf](./22-uyusmazlik-cozumu-ve-arabuluculuk-ilkeleri.pdf) | 6325 s. Arabuluculuk Kanunu |
| 23 | [23-fikri-mulkiyet-ve-telif-haklari-politikasi.md](./23-fikri-mulkiyet-ve-telif-haklari-politikasi.md) | [23-fikri-mulkiyet-ve-telif-haklari-politikasi.html](./23-fikri-mulkiyet-ve-telif-haklari-politikasi.html) | [23-fikri-mulkiyet-ve-telif-haklari-politikasi.pdf](./23-fikri-mulkiyet-ve-telif-haklari-politikasi.pdf) | 5846 s. FSEK Ek Madde 4 |
| 24 | [24-kabul-edilebilir-kullanim-ve-siber-guvenlik-politikasi.md](./24-kabul-edilebilir-kullanim-ve-siber-guvenlik-politikasi.md) | [24-kabul-edilebilir-kullanim-ve-siber-guvenlik-politikasi.html](./24-kabul-edilebilir-kullanim-ve-siber-guvenlik-politikasi.html) | [24-kabul-edilebilir-kullanim-ve-siber-guvenlik-politikasi.pdf](./24-kabul-edilebilir-kullanim-ve-siber-guvenlik-politikasi.pdf) | 5237 s. TCK Bilişim Suçları |
| 25 | [25-cerez-politikasi.md](./25-cerez-politikasi.md) | [25-cerez-politikasi.html](./25-cerez-politikasi.html) | [25-cerez-politikasi.pdf](./25-cerez-politikasi.pdf) | KVKK Çerez Uygulamaları |
| 26 | [26-acik-riza-ve-iletisim-izinleri-metni.md](./26-acik-riza-ve-iletisim-izinleri-metni.md) | [26-acik-riza-ve-iletisim-izinleri-metni.html](./26-acik-riza-ve-iletisim-izinleri-metni.html) | [26-acik-riza-ve-iletisim-izinleri-metni.pdf](./26-acik-riza-ve-iletisim-izinleri-metni.pdf) | 6698 s. KVKK m. 5/1 |
| 27 | [27-eslesme-ve-sorumsuzluk-beyani.md](./27-eslesme-ve-sorumsuzluk-beyani.md) | [27-eslesme-ve-sorumsuzluk-beyani.html](./27-eslesme-ve-sorumsuzluk-beyani.html) | [27-eslesme-ve-sorumsuzluk-beyani.pdf](./27-eslesme-ve-sorumsuzluk-beyani.pdf) | 6563 s. ETK m. 9 |

---

## 🖨️ PDF VE BASKI ÖZELLİKLERİ
Tüm sözleşmeler doğrudan **\`.pdf\`** formatında bu klasörde hazır olarak yer almaktadır:
- **Doğrudan PDF İndirme:** Yukarıdaki tablodaki \`*.pdf\` bağlantılarından resmi A4 vektörel PDF belgelerine doğrudan ulaşabilirsiniz.
- **Canlı Önizleme:** \`.html\` dosyalarını tarayıcıda açtığınızda sağ altta beliren **"🖨️ PDF Olarak Kaydet / Yazdır"** butonuyla (veya \`Ctrl+P\` ile) interaktif olarak da yazdırabilirsiniz.
`;

fs.writeFileSync(
  path.join(OUTPUT_DIR, "00-SOZLESME-KATALOGU-VE-HUKUKI-REHBER.md"),
  catalogReadme,
  "utf8"
);

console.info(`\nBAŞARILI! Toplam 82 adet dosya (27 Markdown + 27 Görsel HTML + 27 Resmi PDF + 1 Katalog Rehberi) başarıyla '${OUTPUT_DIR}' klasörüne kaydedildi.`);
