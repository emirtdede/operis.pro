import { Briefcase, Sparkles, Rocket, Building2 } from "lucide-react";
import type { PublicProfileDto } from "@/src/modules/profiles/service";

export interface PublicProfileViewProps {
  initialProfile: PublicProfileDto;
  locale: string;
  isSelf: boolean;
}

export function getEmptyListingsDescription(isSelf: boolean, isTr: boolean): string {
  if (!isTr) {
    return "No open listings published at the moment.";
  }
  if (isSelf) {
    return "Hemen yeni bir ilan yayınlayarak bağımsız uzmanlardan doğrudan ve komisyonsuz teklifler alabilirsiniz.";
  }
  return "Bu kullanıcının şu an yayında açık bir ilanı bulunmamaktadır.";
}

export function formatListingBudget(
  hasBudget: boolean,
  budgetMin: number | null | undefined,
  budgetMax: number | null | undefined,
  budgetCurrency: string | null | undefined,
  isTr: boolean
): string {
  if (hasBudget) {
    const minStr = budgetMin?.toLocaleString("tr-TR") || "0";
    const maxStr = budgetMax?.toLocaleString("tr-TR") || "";
    const currStr = budgetCurrency || "TRY";
    return `${minStr} - ${maxStr} ${currStr}`;
  }
  return isTr ? "Teklif Usulü" : "Open Bid";
}

export function getReviewsRoleFilterLabel(r: "ALL" | "EMPLOYER" | "FREELANCER", isTr: boolean): string {
  if (r === "ALL") return isTr ? "Tümü" : "All";
  if (r === "EMPLOYER") return isTr ? "İşveren Olarak Aldığı" : "As Employer";
  return isTr ? "Uzman Olarak Aldığı" : "As Specialist";
}

export function getRoleBadges(isTr: boolean) {
  return [
    {
      id: "employer",
      label: isTr ? "İş Veren" : "Employer",
      icon: Briefcase,
      color: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    },
    {
      id: "freelancer",
      label: isTr ? "Bağımsız Uzman" : "Specialist",
      icon: Sparkles,
      color: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    },
    {
      id: "founder",
      label: isTr ? "Girişimci" : "Founder",
      icon: Rocket,
      color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    },
    {
      id: "agency",
      label: isTr ? "Ajans" : "Agency",
      icon: Building2,
      color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    },
  ];
}
