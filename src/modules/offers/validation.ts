import { z } from "zod";
import { validateContentAppropriateness } from "@/src/lib/security/content-moderator";

const EMOJI_REGEX =
  /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/u;

export const REJECTION_CODES = [
  "BUDGET_MISMATCH",
  "TIMELINE_MISMATCH",
  "SCOPE_MISMATCH",
  "EXPERIENCE_MISMATCH",
  "OTHER",
] as const;

export type RejectionCode = (typeof REJECTION_CODES)[number];

export const squadMemberSchema = z.object({
  displayName: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  roleTitle: z.string().trim().min(2, "Role title is required").max(60),
  revenueSharePercentage: z.number().min(1, "Minimum %1 share").max(99, "Maximum %99 share"),
  scopeSummary: z.string().trim().max(300).optional().nullable(),
  handleOrEmail: z.string().trim().max(100).optional().nullable(),
  isLead: z.boolean().default(false),
  userId: z.string().optional().nullable(),
});

export type SquadMemberSchemaInput = z.infer<typeof squadMemberSchema>;

export const submitOfferSchema = z
  .object({
    listingId: z.string().min(1, "Invalid listing ID"),
    message: z
      .string()
      .trim()
      .min(50, "Offer message must be at least 50 characters")
      .max(3000, "Offer message cannot exceed 3000 characters")
      .refine((val) => !EMOJI_REGEX.test(val), {
        message: "Emojis are strictly prohibited",
      })
      .refine((val) => validateContentAppropriateness(val).isValid, {
        message:
          "Mesajınız topluluk kurallarımıza aykırı uygunsuz ifadeler (küfür, hakaret veya saldırgan dil) içerdiği için engellendi.",
      }),
    budgetCurrency: z.enum(["TRY", "USD", "EUR", "GBP"]).optional().nullable(),
    budgetMin: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, "Invalid budget format")
      .optional()
      .nullable(),
    budgetMax: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, "Invalid budget format")
      .optional()
      .nullable(),
    estimatedDurationValue: z.number().int().positive().optional().nullable(),
    estimatedDurationUnit: z.enum(["DAYS", "WEEKS", "MONTHS"]).optional().nullable(),
    isSquadOffer: z.boolean().default(false).optional(),
    squadTitle: z.string().trim().max(120).optional().nullable(),
    squadMembers: z.array(squadMemberSchema).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.budgetMin && data.budgetMax) {
        return parseFloat(data.budgetMin) <= parseFloat(data.budgetMax);
      }
      return true;
    },
    {
      message: "Minimum budget cannot exceed maximum budget",
      path: ["budgetMax"],
    }
  )
  .refine(
    (data) => {
      if (data.isSquadOffer) {
        if (!data.squadMembers || data.squadMembers.length < 2 || data.squadMembers.length > 5) {
          return false;
        }
        const leads = data.squadMembers.filter((m) => m.isLead);
        if (leads.length !== 1) {
          return false;
        }
        const total = data.squadMembers.reduce(
          (sum, m) => sum + (Number(m.revenueSharePercentage) || 0),
          0
        );
        return Math.abs(Math.round(total * 100) / 100 - 100) <= 0.01;
      }
      return true;
    },
    {
      message:
        "Squad offer revenue share must equal exactly 100% across 2 to 5 members with exactly 1 Lead Contractor (Lider Yüklenici)",
      path: ["squadMembers"],
    }
  );

export type SubmitOfferInput = z.infer<typeof submitOfferSchema>;

export const updateOfferSchema = z
  .object({
    offerId: z.string().min(1, "Invalid offer ID"),
    message: z
      .string()
      .trim()
      .min(50, "Offer message must be at least 50 characters")
      .max(3000, "Offer message cannot exceed 3000 characters")
      .refine((val) => !EMOJI_REGEX.test(val), {
        message: "Emojis are strictly prohibited",
      })
      .refine((val) => validateContentAppropriateness(val).isValid, {
        message:
          "Mesajınız topluluk kurallarımıza aykırı uygunsuz ifadeler (küfür, hakaret veya saldırgan dil) içerdiği için engellendi.",
      }),
    budgetCurrency: z.enum(["TRY", "USD", "EUR", "GBP"]).optional().nullable(),
    budgetMin: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, "Invalid budget format")
      .optional()
      .nullable(),
    budgetMax: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, "Invalid budget format")
      .optional()
      .nullable(),
    estimatedDurationValue: z.number().int().positive().optional().nullable(),
    estimatedDurationUnit: z.enum(["DAYS", "WEEKS", "MONTHS"]).optional().nullable(),
    isSquadOffer: z.boolean().default(false).optional(),
    squadTitle: z.string().trim().max(120).optional().nullable(),
    squadMembers: z.array(squadMemberSchema).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.budgetMin && data.budgetMax) {
        return parseFloat(data.budgetMin) <= parseFloat(data.budgetMax);
      }
      return true;
    },
    {
      message: "Minimum budget cannot exceed maximum budget",
      path: ["budgetMax"],
    }
  )
  .refine(
    (data) => {
      if (data.isSquadOffer) {
        if (!data.squadMembers || data.squadMembers.length < 2 || data.squadMembers.length > 5) {
          return false;
        }
        const leads = data.squadMembers.filter((m) => m.isLead);
        if (leads.length !== 1) {
          return false;
        }
        const total = data.squadMembers.reduce(
          (sum, m) => sum + (Number(m.revenueSharePercentage) || 0),
          0
        );
        return Math.abs(Math.round(total * 100) / 100 - 100) <= 0.01;
      }
      return true;
    },
    {
      message:
        "Squad offer revenue share must equal exactly 100% across 2 to 5 members with exactly 1 Lead Contractor (Lider Yüklenici)",
      path: ["squadMembers"],
    }
  );

export type UpdateOfferInput = z.infer<typeof updateOfferSchema>;

export const rejectOfferSchema = z.object({
  offerId: z.string().min(1, "Invalid offer ID"),
  rejectionCode: z.enum(REJECTION_CODES).optional().nullable(),
  rejectionNote: z
    .string()
    .max(500, "Rejection note cannot exceed 500 characters")
    .refine((val) => !EMOJI_REGEX.test(val), {
      message: "Emojis are strictly prohibited",
    })
    .optional()
    .nullable(),
});

export type RejectOfferInput = z.infer<typeof rejectOfferSchema>;

// Batch Offer Item Schema (Individual Proposal inside Batch)
export const batchOfferItemSchema = z
  .object({
    listingId: z.string().min(1, "Invalid listing ID"),
    message: z
      .string()
      .min(50, "Offer message must be at least 50 characters")
      .max(3000, "Offer message cannot exceed 3000 characters")
      .refine((val) => !EMOJI_REGEX.test(val), {
        message: "Emojis are strictly prohibited",
      })
      .refine((val) => validateContentAppropriateness(val).isValid, {
        message:
          "Mesajınız topluluk kurallarımıza aykırı uygunsuz ifadeler (küfür, hakaret veya saldırgan dil) içerdiği için engellendi.",
      }),
    budgetCurrency: z.enum(["TRY", "USD", "EUR", "GBP"]).optional().nullable(),
    budgetMin: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, "Invalid budget format")
      .optional()
      .nullable(),
    budgetMax: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, "Invalid budget format")
      .optional()
      .nullable(),
    estimatedDurationValue: z.number().int().positive().optional().nullable(),
    estimatedDurationUnit: z.enum(["DAYS", "WEEKS", "MONTHS"]).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.budgetMin && data.budgetMax) {
        return parseFloat(data.budgetMin) <= parseFloat(data.budgetMax);
      }
      return true;
    },
    {
      message: "Minimum budget cannot exceed maximum budget",
      path: ["budgetMax"],
    }
  );

export type BatchOfferItemInput = z.infer<typeof batchOfferItemSchema>;

// Batch Offer Schema (Max 5 proposals per request as anti-spam safeguard)
export const batchSubmitOffersSchema = z.object({
  items: z
    .array(batchOfferItemSchema)
    .min(1, "En az 1 ilan seçilmelidir")
    .max(5, "Tek bir toplu işlemde en fazla 5 ilana teklif verilebilir"),
  idempotencyKey: z.string().max(100).optional(),
  capacityConfirmed: z.boolean().optional(),
});

export type BatchSubmitOffersInput = z.infer<typeof batchSubmitOffersSchema>;

// Quick Offer Template Schema
export const offerTemplateSchema = z
  .object({
    id: z.string().optional(),
    name: z
      .string()
      .trim()
      .min(2, "Şablon adı en az 2 karakter olmalıdır")
      .max(50, "Şablon adı en fazla 50 karakter olabilir")
      .refine((val) => !EMOJI_REGEX.test(val), {
        message: "Emojis are strictly prohibited",
      }),
    message: z
      .string()
      .trim()
      .min(50, "Şablon mesajı en az 50 karakter olmalıdır")
      .max(3000, "Şablon mesajı 3000 karakteri geçemez")
      .refine((val) => !EMOJI_REGEX.test(val), {
        message: "Emojis are strictly prohibited",
      })
      .refine((val) => validateContentAppropriateness(val).isValid, {
        message:
          "Şablon içeriği uygunsuz ifadeler (küfür veya saldırgan dil) içerdiği için engellendi.",
      }),
    budgetCurrency: z.enum(["TRY", "USD", "EUR", "GBP"]).optional().nullable(),
    budgetMin: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, "Invalid budget format")
      .optional()
      .nullable(),
    budgetMax: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, "Invalid budget format")
      .optional()
      .nullable(),
    estimatedDurationValue: z.number().int().positive().optional().nullable(),
    estimatedDurationUnit: z.enum(["DAYS", "WEEKS", "MONTHS"]).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.budgetMin && data.budgetMax) {
        return parseFloat(data.budgetMin) <= parseFloat(data.budgetMax);
      }
      return true;
    },
    {
      message: "Minimum budget cannot exceed maximum budget",
      path: ["budgetMax"],
    }
  );

export type OfferTemplateInput = z.infer<typeof offerTemplateSchema>;

// Counter-Offer / Negotiation Cycle Schemas
export const createCounterOfferSchema = z
  .object({
    offerId: z.string().min(1, "Invalid offer ID"),
    budgetCurrency: z.enum(["TRY", "USD", "EUR", "GBP"]).optional().nullable(),
    budgetMin: z
      .union([z.number(), z.string()])
      .transform((val) => String(val))
      .refine((val) => /^\d+(\.\d{1,2})?$/.test(val) && parseFloat(val) > 0, {
        message: "Minimum bütçe geçerli bir pozitif tutar olmalıdır",
      }),
    budgetMax: z
      .union([z.number(), z.string()])
      .transform((val) => String(val))
      .refine((val) => /^\d+(\.\d{1,2})?$/.test(val) && parseFloat(val) > 0, {
        message: "Maksimum bütçe geçerli bir pozitif tutar olmalıdır",
      }),
    estimatedDurationValue: z
      .number()
      .int("Süre tam sayı olmalıdır")
      .min(1, "Süre en az 1 olmalıdır")
      .max(52, "Süre en fazla 52 olabilir"),
    estimatedDurationUnit: z.enum(["DAYS", "WEEKS", "MONTHS"]),
    message: z
      .string()
      .trim()
      .min(10, "Pazarlık gerekçesi veya karşı teklif notu en az 10 karakter olmalıdır")
      .max(1000, "Karşı teklif notu en fazla 1000 karakter olabilir")
      .refine((val) => !EMOJI_REGEX.test(val), {
        message: "Emojiler kullanılamaz",
      })
      .refine(
        (val) => validateContentAppropriateness(val).isValid,
        "Karşı teklif notunuz topluluk kurallarımıza aykırı uygunsuz ifade veya doğrudan iletişim bilgisi içeremez."
      ),
    expectedRound: z.number().int().optional(),
  })
  .refine(
    (data) => parseFloat(data.budgetMin) <= parseFloat(data.budgetMax),
    {
      message: "Minimum bütçe maksimum bütçeden büyük olamaz",
      path: ["budgetMax"],
    }
  );

export type CreateCounterOfferInput = z.infer<typeof createCounterOfferSchema>;

export const acceptCounterOfferSchema = z.object({
  counterProposalId: z.string().min(1, "Geçersiz karşı teklif ID"),
  expectedRound: z.number().int().optional(),
});

export type AcceptCounterOfferInput = z.infer<typeof acceptCounterOfferSchema>;

export const rejectCounterOfferSchema = z.object({
  counterProposalId: z.string().min(1, "Geçersiz karşı teklif ID"),
  rejectionNote: z
    .string()
    .trim()
    .max(500, "Ret notu en fazla 500 karakter olabilir")
    .optional()
    .refine((val) => !val || !EMOJI_REGEX.test(val), {
      message: "Emojiler kullanılamaz",
    })
    .refine(
      (val) => !val || validateContentAppropriateness(val).isValid,
      "Ret notu uygunsuz ifadeler içeremez."
    ),
});

export type RejectCounterOfferInput = z.infer<typeof rejectCounterOfferSchema>;

export const withdrawCounterOfferSchema = z.object({
  counterProposalId: z.string().min(1, "Geçersiz karşı teklif ID"),
});

export type WithdrawCounterOfferInput = z.infer<typeof withdrawCounterOfferSchema>;
