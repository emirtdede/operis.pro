import {
  SupportedBank,
} from "@/src/modules/engagements/milestone-service";

export const SUPPORTED_BANKS: Array<{ id: SupportedBank; nameTr: string; nameEn: string }> = [
  { id: "GARANTI_BBVA", nameTr: "Garanti BBVA", nameEn: "Garanti BBVA" },
  { id: "IS_BANKASI", nameTr: "Türkiye İş Bankası", nameEn: "Isbank" },
  { id: "YAPI_KREDI", nameTr: "Yapı Kredi", nameEn: "Yapi Kredi" },
  { id: "AKBANK", nameTr: "Akbank", nameEn: "Akbank" },
  { id: "ZIRAAT", nameTr: "Ziraat Bankası", nameEn: "Ziraat Bank" },
  { id: "VAKIFBANK", nameTr: "VakıfBank", nameEn: "VakifBank" },
  { id: "HALKBANK", nameTr: "Halkbank", nameEn: "Halkbank" },
  { id: "QNB", nameTr: "QNB Finansbank", nameEn: "QNB" },
  { id: "ENPARA", nameTr: "Enpara.com", nameEn: "Enpara" },
  { id: "DENIZBANK", nameTr: "DenizBank", nameEn: "DenizBank" },
  { id: "TEB", nameTr: "TEB (Türk Ekonomi Bankası)", nameEn: "TEB" },
  { id: "KUVEYT_TURK", nameTr: "Kuveyt Türk", nameEn: "Kuveyt Turk" },
  { id: "PAPARA", nameTr: "Papara", nameEn: "Papara" },
  { id: "OTHER", nameTr: "Diğer Banka", nameEn: "Other Bank" },
];

export function getMilestoneCardBgClass(status: string): string {
  if (status === "ACCEPTED") {
    return "bg-slate-900/40 border-emerald-500/25";
  }
  if (status === "SUBMITTED") {
    return "bg-amber-950/10 border-amber-500/30";
  }
  return "bg-slate-900/60 border-slate-800";
}

export function getMilestoneSeqBadgeClass(status: string): string {
  if (status === "ACCEPTED") {
    return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
  }
  if (status === "SUBMITTED") {
    return "bg-amber-500/20 text-amber-300 border-amber-500/40";
  }
  return "bg-slate-800 text-slate-300 border-slate-700";
}

export function getTransferChannelSubtext(ch: string): string {
  if (ch === "FAST") {
    return "7/24 Anında";
  }
  if (ch === "EFT") {
    return "Farklı Banka";
  }
  return "Aynı Banka";
}
