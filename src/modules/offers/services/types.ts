import { schema } from "@/src/lib/db";
import type { SquadMemberDto } from "../squad-engine";
export type { SquadMemberDto };
export type { OfferTemplateInput } from "../validation";

export interface SentOfferDto {
  offer: typeof schema.offers.$inferSelect;
  listing: {
    id: string;
    slug: string;
    title: string;
    status: string;
    activeUntil: Date | null;
  };
  engagementId?: string | null;
  squadMembers?: SquadMemberDto[];
}

export interface ReceivedOfferDto {
  offer: typeof schema.offers.$inferSelect;
  offerorProfile: {
    userId: string;
    handle: string;
    displayName: string;
  };
  listing: {
    id: string;
    slug: string;
    title: string;
    status: string;
    activeUntil: Date | null;
    ownerUserId?: string;
  };
  engagementId?: string | null;
  squadMembers?: SquadMemberDto[];
}

export interface BatchOfferResultItem {
  listingId: string;
  status: "SUCCESS" | "FAILED";
  offerId?: string;
  code?: string;
  message?: string;
  offer?: typeof schema.offers.$inferSelect;
}

export interface BatchOfferResponse {
  batchId: string;
  total: number;
  succeededCount: number;
  failedCount: number;
  results: BatchOfferResultItem[];
}

export interface OfferTemplateDto {
  id: string;
  userId: string;
  name: string;
  message: string;
  budgetCurrency?: "TRY" | "USD" | "EUR" | "GBP" | null;
  budgetMin?: string | null;
  budgetMax?: string | null;
  estimatedDurationValue?: number | null;
  estimatedDurationUnit?: "DAYS" | "WEEKS" | "MONTHS" | null;
  createdAt: Date;
}

export interface CounterProposalDto {
  id: string;
  offerId: string;
  round: number;
  proposerUserId: string;
  recipientUserId: string;
  budgetCurrency: string;
  budgetMin: string;
  budgetMax: string;
  estimatedDurationValue: number;
  estimatedDurationUnit: string;
  message: string;
  status: string;
  expiresAt: Date;
  createdAt: Date;
  resolvedAt: Date | null;
}

export interface NegotiationTimelineDto {
  offer: {
    id: string;
    listingId: string;
    status: string;
    isCountered: boolean;
    counterRound: number;
    currentTurnUserId: string | null;
    activeCounterProposalId: string | null;
    budgetCurrency?: string | null;
    budgetMin?: string | null;
    budgetMax?: string | null;
    estimatedDurationValue?: number | null;
    estimatedDurationUnit?: string | null;
    initialMessage?: string;
    offerorUserId: string;
    ownerUserId: string;
  };
  isViewerTurn: boolean;
  canCounter: boolean;
  canAccept: boolean;
  canReject: boolean;
  canWithdraw: boolean;
  maxRoundsReached: boolean;
  activeProposal: (CounterProposalDto & {
    isByViewer: boolean;
    isExpired: boolean;
    timeRemainingMs: number;
  }) | null;
  history: Array<CounterProposalDto & {
    isByViewer: boolean;
    isExpired: boolean;
    timeRemainingMs: number;
  }>;
}

// In-memory runtime stores for session/testing (singleton instances)
export const inMemorySentOffers: SentOfferDto[] = [];
export const inMemoryReceivedOffers: ReceivedOfferDto[] = [];
export const inMemoryCounterProposals: CounterProposalDto[] = [];
export const inMemoryBatchIdempotencyStore = new Map<string, BatchOfferResponse>();
export const inMemoryOfferTemplates = new Map<string, OfferTemplateDto[]>();
export const inMemorySquadMembers = new Map<string, SquadMemberDto[]>();

export const DEFAULT_STARTER_TEMPLATES = (userId: string, locale?: string): OfferTemplateDto[] => {
  const isEn = locale === "en";
  return [
    {
      id: "default-1",
      userId,
      name: isEn ? "Standard Listing Offer" : "Standart İlan Teklifi",
      message: isEn
        ? "Hello {{owner_name}}, I have carefully reviewed the technical requirements for '{{project_title}}'. With my experience in {{category}} and relevant reference work, I can ensure high-quality delivery within your target timeline."
        : "Merhaba {{ilan_sahibi}}, '{{ilan_basligi}}' başlıklı ilanınızın teknik gereksinimlerini detaylıca inceledim. {{kategori}} alanındaki deneyimim ve benzer referanslarımla hedeflenen takvim içerisinde yüksek kaliteli teslimat sağlayabilirim.",
      budgetCurrency: isEn ? "USD" : "TRY",
      budgetMin: isEn ? "500" : "15000",
      budgetMax: isEn ? "1500" : "35000",
      estimatedDurationValue: 2,
      estimatedDurationUnit: "WEEKS",
      createdAt: new Date(),
    },
    {
      id: "default-2",
      userId,
      name: isEn ? "Fast Advisory & Solution" : "Hızlı Danışmanlık & Çözüm",
      message: isEn
        ? "Hello, I can provide direct architectural guidance and development support for '{{project_title}}'. We can quickly clarify the requirements and begin immediately."
        : "Merhaba, '{{ilan_basligi}}' ilanınız için teknik mimari ve uygulama sürecinde doğrudan danışmanlık ve geliştirme desteği sunabilirim. Gereksinimleri hızla netleştirip başlayabiliriz.",
      budgetCurrency: isEn ? "USD" : "TRY",
      budgetMin: isEn ? "250" : "5000",
      budgetMax: isEn ? "600" : "15000",
      estimatedDurationValue: 1,
      estimatedDurationUnit: "WEEKS",
      createdAt: new Date(),
    },
  ];
};
