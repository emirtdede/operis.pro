import type { ContractLanguage } from "@/src/modules/contracts/types";

export function parseInvoiceCurrency(label: string): "EUR" | "GBP" | "USD" {
  if (label.includes("EUR")) return "EUR";
  if (label.includes("GBP")) return "GBP";
  return "USD";
}

export function getInflationShieldLabel(active: boolean, isTr: boolean): string {
  if (active) return isTr ? "Kalkanı Gizle" : "Hide Shield";
  return isTr ? "📈 TBK 138 Enflasyon Kalkanı" : "📈 TBK 138 Inflation Shield";
}

export function getTaxCalculatorLabel(active: boolean, isTr: boolean): string {
  if (active) return isTr ? "Hesaplayıcıyı Gizle" : "Hide Calculator";
  return isTr ? "🧮 Net Kazanç & Stopaj" : "🧮 Tax & Net Earnings";
}

export function getDpaButtonLabel(enabled: boolean, isTr: boolean): string {
  if (enabled) return isTr ? "🛡️ KVKK EK-2 (Aktif)" : "🛡️ KVKK ANNEX-2 (Active)";
  return isTr ? "🛡️ 6698 KVKK & DPA Ekle" : "🛡️ Add KVKK DPA";
}

export function getSafeHarborButtonLabel(enabled: boolean, isTr: boolean): string {
  if (enabled) return isTr ? "⚖️ İş K. 8 EK-3 (Aktif)" : "⚖️ Labor Safe Harbor (Active)";
  return isTr ? "⚖️ İş K. 8 Kalkanı Ekle" : "⚖️ Add Labor Shield";
}

export function getAiGovButtonLabel(enabled: boolean, isTr: boolean): string {
  if (enabled) return isTr ? "🤖 AI & FSEK EK-4 (Aktif)" : "🤖 AI & IP ANNEX-4 (Active)";
  return isTr ? "🤖 AI & FSEK 52 Kalkanı" : "🤖 Add AI & IP Shield";
}

export function getSoftwareExportButtonLabel(enabled: boolean, isTr: boolean): string {
  if (enabled) return isTr ? "🌍 İhracat EK-5 (Aktif)" : "🌍 Export ANNEX-5 (Active)";
  return isTr ? "🌍 GVK 89/13 İhracat Kalkanı" : "🌍 Add Export Shield";
}

export function getDownloadPdfButtonLabel(activeLang: ContractLanguage, isTr: boolean): string {
  if (activeLang === "bilingual") return "Çift Dilli Vektörel PDF (.pdf)";
  return isTr ? "Vektörel PDF İndir (.pdf)" : "Download Vector PDF (.pdf)";
}

export function getWhiteLabelButtonLabel(enabled: boolean, isTr: boolean): string {
  if (enabled) return isTr ? "🏛️ Kurumsal Mod (White-Label: Açık)" : "🏛️ White-Label (Active)";
  return isTr ? "🏛️ Kurumsal Sade Mod" : "🏛️ White-Label Mode";
}
