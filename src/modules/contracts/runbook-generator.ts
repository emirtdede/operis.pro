import { createHash } from "node:crypto";
import type {
  RunbookEnvVar,
  RunbookBuildStep,
  RunbookThirdPartyService,
  RunbookDisasterStep,
  RunbookBackupSchedule,
} from "@/src/modules/engagements/runbook-synthesizer";

export interface RunbookGeneratorInput {
  engagementId: string;
  listingTitle: string;
  clientName: string;
  contractorName: string;
  status: string;
  version: number;
  architectureSummary: string;
  environmentVariables: RunbookEnvVar[];
  buildAndRunSteps: RunbookBuildStep[];
  thirdPartyServices: RunbookThirdPartyService[];
  disasterRecoverySteps: RunbookDisasterStep[];
  backupSchedule: RunbookBackupSchedule;
  emergencyContact?: {
    name?: string;
    email?: string;
    phone?: string;
    notes?: string;
  } | null;
  publishedAt?: Date | string | null;
  locale?: "tr" | "en";
}

export interface GeneratedRunbookResult {
  runbookRef: string;
  sha256Seal: string;
  generatedAt: string;
  locale: "tr" | "en";
  markdown: string;
  htmlContent: string;
  plainText: string;
}

export class RunbookGeneratorService {
  /**
   * Generates a deterministic SHA-256 hash for runbook fingerprinting (HMK m. 193).
   */
  static calculateSha256(content: string): string {
    return createHash("sha256").update(content, "utf8").digest("hex");
  }

  /**
   * Generates official Markdown and HTML Project Handover & Architecture Runbook.
   */
  static generateRunbook(input: RunbookGeneratorInput): GeneratedRunbookResult {
    const isTr = (input.locale || "tr") === "tr";
    const engagementShort = input.engagementId.replace(/-/g, "").slice(0, 8).toUpperCase();
    const runbookRef = `OPR-RUNBOOK-${engagementShort}-V${input.version}`;
    const generatedAtDate = new Date();
    const formattedDate = generatedAtDate.toLocaleDateString(isTr ? "tr-TR" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // 1. Build Markdown Representation
    const lines: string[] = [
      `# 🛡️ ${isTr ? "OPERİS RESMİ PROJE DEVİR VE İŞLETİM KILAVUZU (PROJECT RUNBOOK)" : "OPERIS OFFICIAL PROJECT HANDOVER & RUNBOOK"}`,
      `**${isTr ? "Referans No" : "Reference No"}:** \`${runbookRef}\` | **${isTr ? "Tarih" : "Date"}:** ${formattedDate} | **${isTr ? "Versiyon" : "Version"}:** v${input.version}`,
      `**${isTr ? "İlan / Proje" : "Listing / Project"}:** ${input.listingTitle}`,
      `**${isTr ? "İşveren" : "Client"}:** ${input.clientName} | **${isTr ? "Yüklenici / Yazılımcı" : "Contractor"}:** ${input.contractorName}`,
      "",
      "---",
      "",
      `## 1. 🏗️ ${isTr ? "SİSTEM VE MİMARİ ÖZETİ" : "SYSTEM & ARCHITECTURE OVERVIEW"}`,
      input.architectureSummary || (isTr ? "Belirtilmedi." : "Not specified."),
      "",
      "---",
      "",
      `## 2. 🔑 ${isTr ? "ÇEVRE DEĞİŞKENLERİ SÖZLÜĞÜ (.env.example)" : "ENVIRONMENT VARIABLES DICTIONARY (.env.example)"}`,
      `> ⚠️ **${isTr ? "GÜVENLİK BİLGİLENDİRMESİ" : "SECURITY ADVISORY"}:** ${
        isTr
          ? "Bu sözlükte yalnızca değişken anahtarları, açıklamaları ve örnek formatlar yer alır. Canlı üretim şifreleri asla bu belgede saklanmaz; güvenli sunucu ortamında tanımlanmalıdır."
          : "This dictionary contains only keys, descriptions, and sample formats. Production secrets are never stored here and must be injected in secure runtime."
      }`,
      "",
      `| ${isTr ? "Değişken Adı" : "Variable Key"} | ${isTr ? "Açıklama" : "Description"} | ${isTr ? "Kategori" : "Category"} | ${isTr ? "Zorunlu?" : "Required?"} | ${isTr ? "Örnek Format" : "Sample Format"} |`,
      "|---|---|---|---|---|",
    ];

    if (input.environmentVariables && input.environmentVariables.length > 0) {
      for (const env of input.environmentVariables) {
        let requiredLabel = isTr ? "Hayır" : "No";
        if (env.isRequired) {
          requiredLabel = isTr ? "Evet (Zorunlu)" : "Yes";
        }
        lines.push(
          `| \`${env.key}\` | ${env.description} | \`${env.secretCategory}\` | ${requiredLabel} | \`${env.sampleValue || "—"}\` |`
        );
      }
    } else {
      lines.push(`| — | ${isTr ? "Tanımlı çevre değişkeni yok." : "No environment variables."} | — | — | — |`);
    }

    lines.push(
      "",
      "---",
      "",
      `## 3. 🚀 ${isTr ? "BAŞLATMA VE DERLEME KOMUTLARI (BUILD & RUNBOOK)" : "BUILD & RUNTIME COMMANDS"}`,
      ""
    );

    if (input.buildAndRunSteps && input.buildAndRunSteps.length > 0) {
      for (const step of input.buildAndRunSteps) {
        lines.push(
          `### ${step.stepNumber}. ${step.title} [${step.environment}]`,
          `${step.description}`,
          "```bash",
          step.command,
          "```",
          ""
        );
      }
    } else {
      lines.push(isTr ? "Tanımlı derleme komutu yok." : "No build commands defined.", "");
    }

    lines.push(
      "---",
      "",
      `## 4. 🔌 ${isTr ? "ÜÇÜNCÜ TARAF SERVİSLER VE DIŞ HESAPLAR" : "THIRD-PARTY SERVICES & INTEGRATIONS"}`,
      "",
      `| ${isTr ? "Servis Adı" : "Service Name"} | ${isTr ? "Kategori" : "Category"} | ${isTr ? "Kullanım Amacı" : "Purpose"} | ${isTr ? "Yönetim Paneli" : "Dashboard"} | ${isTr ? "Devir Durumu" : "Transferred"} |`,
      "|---|---|---|---|---|"
    );

    if (input.thirdPartyServices && input.thirdPartyServices.length > 0) {
      for (const s of input.thirdPartyServices) {
        lines.push(
          `| **${s.serviceName}** | ${s.category} | ${s.purpose} | ${s.dashboardUrl ? `[Link](${s.dashboardUrl})` : "—"} | ${
            s.credentialsTransferred ? "✅ Devredildi" : "⏳ Devredilmedi"
          } |`
        );
      }
    } else {
      lines.push(`| — | — | ${isTr ? "Bağlı üçüncü taraf servis yok." : "No third-party services."} | — | — |`);
    }

    lines.push(
      "",
      "---",
      "",
      `## 5. 🚨 ${isTr ? "YEDEKLEME VE ACİL FELAKET KURTARMA (DISASTER RECOVERY)" : "DISASTER RECOVERY & BACKUP PROCEDURES"}`,
      "",
      `### 💾 ${isTr ? "Yedekleme Çizelgesi" : "Backup Schedule"}`,
      `- **${isTr ? "Sıklık" : "Frequency"}:** ${input.backupSchedule.frequency || "Günlük"}`,
      `- **${isTr ? "Yedekleme Komutu / Script" : "Backup Command"}:** \`${input.backupSchedule.backupScriptOrCommand || "—"}\``,
      `- **${isTr ? "Depolama Konumu" : "Storage Location"}:** ${input.backupSchedule.storageLocation || "—"}`,
      `- **${isTr ? "Geri Yükleme (Restore) Prosedürü" : "Restore Procedure"}:** ${input.backupSchedule.restoreProcedure || "—"}`,
      "",
      `### 🛠️ ${isTr ? "Kritik Acil Durum Senaryoları" : "Critical Emergency Scenarios"}`
    );

    if (input.disasterRecoverySteps && input.disasterRecoverySteps.length > 0) {
      for (const dr of input.disasterRecoverySteps) {
        lines.push(
          `#### [${dr.priority}] ${dr.scenario}`,
          `**${isTr ? "Müdahale Adımı" : "Resolution Step"}:** ${dr.procedure}`,
          dr.verificationCommand ? `**${isTr ? "Doğrulama Komutu" : "Verification"}:** \`${dr.verificationCommand}\`` : "",
          ""
        );
      }
    }

    if (input.emergencyContact) {
      lines.push(
        `### 📞 ${isTr ? "Acil Durum Teknik İletişim" : "Emergency Technical Contact"}`,
        `- **${isTr ? "İsim" : "Name"}:** ${input.emergencyContact.name || "—"}`,
        `- **${isTr ? "E-Posta" : "Email"}:** ${input.emergencyContact.email || "—"}`,
        `- **${isTr ? "Telefon" : "Phone"}:** ${input.emergencyContact.phone || "—"}`,
        input.emergencyContact.notes ? `- **${isTr ? "Notlar" : "Notes"}:** ${input.emergencyContact.notes}` : "",
        ""
      );
    }

    // 2. Compute Immutable SHA-256 Seal
    const rawContentToSeal = [
      runbookRef,
      input.engagementId,
      input.architectureSummary,
      JSON.stringify(input.environmentVariables),
      JSON.stringify(input.buildAndRunSteps),
      JSON.stringify(input.thirdPartyServices),
      JSON.stringify(input.disasterRecoverySteps),
      JSON.stringify(input.backupSchedule),
    ].join("|");

    const sha256Seal = this.calculateSha256(rawContentToSeal);

    lines.push(
      "---",
      "",
      `## 6. 🔒 ${isTr ? "HMK M. 193 DİJİTAL DELİL MÜHRÜ" : "HMK ART. 193 DIGITAL EVIDENCE SEAL"}`,
      isTr
        ? "Bu Proje Devir ve İşletim Kılavuzu içeriği 6100 sayılı Hukuk Muhakemeleri Kanunu Madde 193 (Delil Sözleşmesi) uyarınca taraflar arasında teknik teslimatın eksiksiz yapıldığını ispatlamak üzere aşağıdaki benzersiz SHA-256 dijital mührü ile tescillenmiştir:"
        : "This Project Handover and Runbook is sealed under statutory procedural law with the following immutable SHA-256 digital fingerprint to certify technical completion:",
      "",
      `\`\`\`text`,
      `SHA-256: ${sha256Seal}`,
      `\`\`\``,
      "",
      `*${isTr ? "Operis Güvenli Altyapısı Tarafından Üretilmiştir • operis.pro" : "Generated by Operis Protocol • operis.pro"}*`
    );

    const markdown = lines.join("\n");

    // 3. Simple printable HTML representation
    const htmlContent = `<!DOCTYPE html>
<html lang="${input.locale || "tr"}">
<head>
  <meta charset="utf-8">
  <title>${runbookRef} - Operis Runbook</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 900px; margin: 40px auto; padding: 0 20px; color: #1e293b; }
    h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; break-after: avoid-page; page-break-after: avoid; }
    h2 { color: #1e293b; margin-top: 32px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; break-after: avoid-page; page-break-after: avoid; }
    h3 { color: #334155; margin-top: 24px; break-after: avoid-page; page-break-after: avoid; }
    p, li { orphans: 3; widows: 3; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; break-inside: avoid; page-break-inside: avoid; }
    tr { break-inside: avoid; page-break-inside: avoid; }
    th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; }
    th { background: #f1f5f9; font-weight: 600; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
    pre { background: #0f172a; color: #f8fafc; padding: 16px; border-radius: 8px; overflow-x: auto; break-inside: avoid; page-break-inside: avoid; }
    pre code { background: none; color: inherit; padding: 0; }
    .seal-box { background: #f8fafc; border: 2px dashed #0284c7; padding: 16px; border-radius: 8px; margin: 24px 0; break-inside: avoid; page-break-inside: avoid; }
    @media print {
      body { margin: 0; padding: 0; }
      h1, h2, h3 { break-after: avoid-page !important; page-break-after: avoid !important; }
      table, tr, pre, .seal-box { break-inside: avoid !important; page-break-inside: avoid !important; }
    }
  </style>
</head>
<body>
  <div style="font-size: 13px; color: #64748b; margin-bottom: 8px;">OPERIS OFFICIAL PROTOCOL</div>
  <h1>${isTr ? "Proje Devir ve İşletim Kılavuzu" : "Project Handover & Runbook"}</h1>
  <p><strong>Ref:</strong> <code>${runbookRef}</code> | <strong>${isTr ? "Tarih" : "Date"}:</strong> ${formattedDate}</p>
  <div class="seal-box">
    <strong>HMK m. 193 SHA-256 Fingerprint:</strong><br>
    <code>${sha256Seal}</code>
  </div>
  <pre style="white-space: pre-wrap; font-family: inherit; background: #fff; color: #1e293b; border: 1px solid #e2e8f0;">${markdown}</pre>
</body>
</html>`;

    return {
      runbookRef,
      sha256Seal,
      generatedAt: generatedAtDate.toISOString(),
      locale: input.locale || "tr",
      markdown,
      htmlContent,
      plainText: markdown,
    };
  }
}
