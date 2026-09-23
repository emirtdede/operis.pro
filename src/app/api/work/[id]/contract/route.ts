import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { EngagementService } from "@/src/modules/engagements/service";
import { OfferService } from "@/src/modules/offers/service";
import { ContractGeneratorService } from "@/src/modules/contracts/generator";
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from "@/src/lib/security/rate-limit";
import { getDb, schema } from "@/src/lib/db";
import { eq } from "drizzle-orm";
import { DEFAULT_USER } from "@/src/modules/auth/demo-user";
import type { ContractParty } from "@/src/modules/contracts/types";
import type {
  DpaAccessLevel,
  DpaContractConfig,
  DpaDataCategory,
  DpaSecurityMeasure,
} from "@/src/modules/contracts/dpa-types";
import type {
  SafeHarborConfig,
  ScheduleAutonomy,
  EquipmentOwnership,
  ManagementHierarchy,
  ExclusivityStatus,
  InvoicingEntityStatus,
  CorporateIntegration,
} from "@/src/modules/contracts/safe-harbor-types";
import type {
  AiGovernanceConfig,
  AiUsageLevel,
  AiToolProvider,
  AiDataPrivacyTier,
} from "@/src/modules/contracts/ai-governance-types";
import type {
  SoftwareExportConfig,
  ForeignRemittanceChannel,
} from "@/src/modules/finance/software-export-types";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const isEnHeader = req.headers.get("x-locale") === "en";
  const ip = getClientIp(req);

  const access = await evaluateSecurityAccessAsync({
    ip,
    purpose: "work:contract",
    subject: normalizeIp(ip),
    limit: 60,
    windowMs: 60 * 1000,
    isEn: isEnHeader,
  });

  if (!access.allowed) {
    return access.response;
  }

  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: isEnHeader ? "Unauthorized. Please sign in." : "Oturum açmanız gerekmektedir." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const url = new URL(req.url);
    const langParam = url.searchParams.get("lang");
    let lang: "tr" | "en" | "bilingual" = "tr";
    if (langParam === "en") {
      lang = "en";
    } else if (langParam === "bilingual") {
      lang = "bilingual";
    }
    const prevalenceParam = url.searchParams.get("prevalence");
    const prevalenceLanguage: "tr" | "en" = prevalenceParam === "en" ? "en" : "tr";
    const whiteLabelParam = url.searchParams.get("whiteLabel");
    const whiteLabel = whiteLabelParam === "true" || whiteLabelParam === "1";
    const format = url.searchParams.get("format") || "json";

    const details = await EngagementService.getEngagementDetails(session.userId, id);
    if (!details || !details.engagement) {
      return NextResponse.json(
        {
          error: isEnHeader
            ? "Engagement not found or unauthorized."
            : "İş birliği bulunamadı veya erişim yetkiniz yok.",
        },
        { status: 404 }
      );
    }

    const { engagement, listing, acceptedOffer, counterpartyContact } = details;
    const isOwner = session.userId === engagement.ownerUserId;

    // Fetch viewer user details
    let viewerDisplayName: string = isOwner ? "İşveren" : "Yüklenici";
    let viewerEmail: string = "—";
    let viewerHandle: string | undefined = undefined;

    if (session.userId === DEFAULT_USER.id) {
      viewerDisplayName = DEFAULT_USER.profile.displayName;
      viewerEmail = DEFAULT_USER.email;
      viewerHandle = DEFAULT_USER.profile.handle;
    } else {
      try {
        const db = getDb();
        const [profileRow] = await db
          .select({
            displayName: schema.profiles.displayName,
            handle: schema.profiles.handle,
            email: schema.users.email,
          })
          .from(schema.profiles)
          .innerJoin(schema.users, eq(schema.users.id, schema.profiles.userId))
          .where(eq(schema.profiles.userId, session.userId))
          .limit(1);

        if (profileRow) {
          viewerDisplayName = profileRow.displayName;
          viewerEmail = profileRow.email;
          viewerHandle = profileRow.handle;
        }
      } catch {
        // Fallback gracefully
      }
    }

    const clientParty: ContractParty = isOwner
      ? {
          displayName: viewerDisplayName,
          email: viewerEmail,
          handle: viewerHandle,
          role: "CLIENT",
        }
      : {
          displayName: counterpartyContact?.displayName || "İşveren",
          email: counterpartyContact?.email || "—",
          phone: counterpartyContact?.phone || undefined,
          handle: counterpartyContact?.handle,
          city: counterpartyContact?.city || undefined,
          role: "CLIENT",
        };

    const contractorParty: ContractParty = isOwner
      ? {
          displayName: counterpartyContact?.displayName || "Yüklenici",
          email: counterpartyContact?.email || "—",
          phone: counterpartyContact?.phone || undefined,
          handle: counterpartyContact?.handle,
          city: counterpartyContact?.city || undefined,
          role: "CONTRACTOR",
        }
      : {
          displayName: viewerDisplayName,
          email: viewerEmail,
          handle: viewerHandle,
          role: "CONTRACTOR",
        };

    // Calculate formatted budget
    const offerBudgetMin = acceptedOffer?.budgetMin ? Number(acceptedOffer.budgetMin) : null;
    const offerBudgetMax = acceptedOffer?.budgetMax ? Number(acceptedOffer.budgetMax) : null;
    const currency = acceptedOffer?.budgetCurrency || listing?.budgetCurrency || "TRY";

    let budgetLabel: string | undefined;
    if (offerBudgetMin && offerBudgetMax) {
      budgetLabel =
        offerBudgetMin === offerBudgetMax
          ? `${offerBudgetMin.toLocaleString("tr-TR")} ${currency}`
          : `${offerBudgetMin.toLocaleString("tr-TR")} - ${offerBudgetMax.toLocaleString("tr-TR")} ${currency}`;
    } else if (listing?.budgetMin && listing?.budgetMax) {
      const bMin = Number(listing.budgetMin);
      const bMax = Number(listing.budgetMax);
      budgetLabel =
        bMin === bMax
          ? `${bMin.toLocaleString("tr-TR")} ${currency}`
          : `${bMin.toLocaleString("tr-TR")} - ${bMax.toLocaleString("tr-TR")} ${currency}`;
    }

    // Calculate timeline label
    let timelineLabel: string | undefined;
    if (acceptedOffer?.estimatedDurationValue && acceptedOffer?.estimatedDurationUnit) {
      const val = acceptedOffer.estimatedDurationValue;
      const unit = acceptedOffer.estimatedDurationUnit;
      if (unit === "DAYS") {
        timelineLabel = lang === "en" ? `${val} Days` : `${val} Gün`;
      } else if (unit === "WEEKS") {
        timelineLabel = lang === "en" ? `${val} Weeks` : `${val} Hafta`;
      } else if (unit === "MONTHS") {
        timelineLabel = lang === "en" ? `${val} Months` : `${val} Ay`;
      }
    }

    const squadMembers = acceptedOffer?.id
      ? await OfferService.getOfferSquadMembers(acceptedOffer.id)
      : [];

    const inflationShieldParam = url.searchParams.get("inflationShield");
    const indexTypeParam = url.searchParams.get("indexType") as "TUFE" | "YI_UFE" | "HYBRID" | null;
    const capParam = url.searchParams.get("cap");
    const parsedCap = capParam ? parseFloat(capParam) : null;

    const inflationShield =
      inflationShieldParam === "true" || inflationShieldParam === "1"
        ? {
            enabled: true,
            indexType: indexTypeParam || ("HYBRID" as const),
            capPercentage: parsedCap && !isNaN(parsedCap) ? parsedCap : undefined,
          }
        : undefined;

    const dpaParam = url.searchParams.get("dpa");
    const dpaAccessLevelParam = url.searchParams.get("dpaAccessLevel") as DpaAccessLevel | null;
    const dpaCategoriesParam = url.searchParams.get("dpaCategories");
    const dpaMeasuresParam = url.searchParams.get("dpaMeasures");
    const dpaSubProcessorParam = url.searchParams.get("dpaSubProcessor");
    const dpaBreachHoursParam = url.searchParams.get("dpaBreachHours");

    let dpaConfig: DpaContractConfig | undefined = undefined;
    if (dpaParam === "true" || dpaParam === "1") {
      const parsedCategories = dpaCategoriesParam
        ? (dpaCategoriesParam
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean) as DpaDataCategory[])
        : (["CUSTOMER_ACCOUNT_LOGS"] as DpaDataCategory[]);

      const parsedMeasures = dpaMeasuresParam
        ? (dpaMeasuresParam
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean) as DpaSecurityMeasure[])
        : (["TLS_ENCRYPTION", "MFA_ACCESS", "LOCAL_STORAGE_PROHIBITED"] as DpaSecurityMeasure[]);

      dpaConfig = {
        enabled: true,
        accessLevel: dpaAccessLevelParam || "FULL_PRODUCTION_ACCESS",
        dataCategories: parsedCategories.length > 0 ? parsedCategories : ["CUSTOMER_ACCOUNT_LOGS"],
        securityMeasures: parsedMeasures,
        subProcessorAllowed: dpaSubProcessorParam === "true" || dpaSubProcessorParam === "1",
        breachNotificationHours: dpaBreachHoursParam ? parseInt(dpaBreachHoursParam, 10) : 24,
      };
    }

    const safeHarborParam = url.searchParams.get("safeHarbor");
    const shScheduleParam = url.searchParams.get("shSchedule") as ScheduleAutonomy | null;
    const shEquipmentParam = url.searchParams.get("shEquipment") as EquipmentOwnership | null;
    const shHierarchyParam = url.searchParams.get("shHierarchy") as ManagementHierarchy | null;
    const shExclusivityParam = url.searchParams.get("shExclusivity") as ExclusivityStatus | null;
    const shInvoicingParam = url.searchParams.get("shInvoicing") as InvoicingEntityStatus | null;
    const shIntegrationParam = url.searchParams.get("shIntegration") as CorporateIntegration | null;
    const shSubstitutionParam = url.searchParams.get("shSubstitution");

    let safeHarborConfig: SafeHarborConfig | undefined = undefined;
    if (safeHarborParam === "true" || safeHarborParam === "1") {
      safeHarborConfig = {
        enabled: true,
        scheduleAutonomy: shScheduleParam || "FLEXIBLE_RESULT_ORIENTED",
        equipmentOwnership: shEquipmentParam || "CONTRACTOR_OWN_TOOLS",
        managementHierarchy: shHierarchyParam || "AUTONOMOUS_DELIVERABLE",
        exclusivityStatus: shExclusivityParam || "OPEN_MARKET_MULTIPLE_CLIENTS",
        invoicingEntityStatus: shInvoicingParam || "REGISTERED_COMPANY_INVOICE",
        corporateIntegration: shIntegrationParam || "EXTERNAL_CONSULTANT_IDENTITY",
        rightOfSubstitutionAllowed:
          shSubstitutionParam === "false" || shSubstitutionParam === "0" ? false : true,
      };
    }

    const aiGovParam = url.searchParams.get("aiGov");
    const aiUsageParam = url.searchParams.get("aiUsage") as AiUsageLevel | null;
    const aiToolsParam = url.searchParams.get("aiTools");
    const aiPrivacyParam = url.searchParams.get("aiPrivacy") as AiDataPrivacyTier | null;
    const aiHumanLoopParam = url.searchParams.get("aiHumanLoop");
    const aiCopyleftParam = url.searchParams.get("aiCopyleft");
    const aiZeroRetentionParam = url.searchParams.get("aiZeroRetention");
    const aiDefectLiabilityParam = url.searchParams.get("aiDefectLiability");
    const aiCodeReviewParam = url.searchParams.get("aiCodeReview");

    let aiGovernanceConfig: AiGovernanceConfig | undefined = undefined;
    if (aiGovParam === "true" || aiGovParam === "1") {
      const parsedTools = aiToolsParam
        ? (aiToolsParam
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean) as AiToolProvider[])
        : (["CURSOR", "GITHUB_COPILOT"] as AiToolProvider[]);

      aiGovernanceConfig = {
        enabled: true,
        usageLevel: aiUsageParam || "AI_ASSISTED_HUMAN_REVIEWED",
        declaredTools: parsedTools.length > 0 ? parsedTools : ["CURSOR", "GITHUB_COPILOT"],
        dataPrivacyTier: aiPrivacyParam || "ENTERPRISE_ZERO_RETENTION",
        humanInTheLoopAffirmed:
          aiHumanLoopParam === "false" || aiHumanLoopParam === "0" ? false : true,
        copyleftFreeWarranted:
          aiCopyleftParam === "false" || aiCopyleftParam === "0" ? false : true,
        zeroDataRetentionWarranted:
          aiZeroRetentionParam === "false" || aiZeroRetentionParam === "0" ? false : true,
        strictDefectLiabilityAccepted:
          aiDefectLiabilityParam === "false" || aiDefectLiabilityParam === "0" ? false : true,
        codeReviewToolUsed:
          aiCodeReviewParam === "false" || aiCodeReviewParam === "0" ? false : true,
      };
    }

    const exportParam = url.searchParams.get("exportMode");
    const exportCountryParam = url.searchParams.get("exportCountry");
    const exportForeignClientParam = url.searchParams.get("exportForeignClient");
    const exportForeignUseParam = url.searchParams.get("exportForeignUse");
    const exportCurrencyParam = url.searchParams.get("exportCurrency");
    const exportChannelParam = url.searchParams.get(
      "exportChannel"
    ) as ForeignRemittanceChannel | null;
    const exportRepatriationParam = url.searchParams.get("exportRepatriation");

    // Auto-detect foreign currency or foreign engagement
    const isForeignBudget = Boolean(budgetLabel && /[$€£]|USD|EUR|GBP/i.test(budgetLabel));

    let softwareExportConfig: SoftwareExportConfig | undefined = undefined;
    if (
      exportParam === "true" ||
      exportParam === "1" ||
      (exportParam === null && isForeignBudget)
    ) {
      let detectedExportCurrency = "USD";
      if (budgetLabel?.includes("EUR")) {
        detectedExportCurrency = "EUR";
      } else if (budgetLabel?.includes("GBP")) {
        detectedExportCurrency = "GBP";
      }

      softwareExportConfig = {
        enabled: true,
        clientCountry:
          exportCountryParam || (lang === "en" ? "United States" : "Yurt Dışı / Global"),
        isForeignEntity:
          exportForeignClientParam === "false" || exportForeignClientParam === "0" ? false : true,
        isServiceUtilizedAbroad:
          exportForeignUseParam === "false" || exportForeignUseParam === "0" ? false : true,
        remittanceChannel: exportChannelParam || "SWIFT_WIRE",
        repatriationDeclared:
          exportRepatriationParam === "false" || exportRepatriationParam === "0" ? false : true,
        invoiceCurrency: exportCurrencyParam || detectedExportCurrency,
      };
    }

    const contract = ContractGeneratorService.generateContract({
      engagementId: engagement.id,
      listingTitle:
        listing?.title || engagement.listingTitleSnapshot || "Yazılım / Teknoloji Hizmeti",
      category: "Yazılım / Teknoloji",
      matchedAt: engagement.matchedAt || new Date(),
      scopeSummary:
        acceptedOffer?.message ||
        listing?.scope ||
        listing?.summary ||
        "İşveren ile Yüklenici arasında mutabık kalınan teknik kapsam.",
      budgetLabel,
      timelineLabel,
      client: clientParty,
      contractor: contractorParty,
      locale: lang,
      prevalenceLanguage,
      whiteLabel,
      isSquadContract: Boolean(
        acceptedOffer?.isSquadOffer || (squadMembers && squadMembers.length > 0)
      ),
      squadTitle: acceptedOffer?.squadTitle,
      squadMembers,
      inflationShield,
      dpaConfig,
      safeHarborConfig,
      aiGovernanceConfig,
      softwareExportConfig,
    });

    const filenamePrefix = whiteLabel ? "sozlesme-" : "operis-contract-";

    if (format === "markdown") {
      return new NextResponse(contract.markdown, {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filenamePrefix}${contract.contractRef}${lang === "bilingual" ? "-bilingual" : ""}.md"`,
        },
      });
    }

    if (format === "html") {
      return new NextResponse(contract.htmlContent, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    if (format === "pdf") {
      try {
        const { VectorPdfEngine } = await import("@/src/lib/pdf/vector-pdf-engine");
        const cacheKey = `${contract.contractRef}-${contract.sha256Fingerprint}-${lang}-${prevalenceLanguage}${whiteLabel ? "-wl" : ""}`;
        const pdfBuffer = await VectorPdfEngine.generateVectorPdf(contract.htmlContent, cacheKey);

        return new NextResponse(pdfBuffer as unknown as BodyInit, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filenamePrefix}${contract.contractRef}${lang === "bilingual" ? "-bilingual" : ""}.pdf"`,
            "X-Contract-Sha256": contract.sha256Fingerprint,
          },
        });
      } catch {
        // Fallback to printable HTML if headless Chromium fails in restricted host
        return new NextResponse(
          contract.htmlContent + `<script>window.onload=function(){window.print();}</script>`,
          {
            status: 200,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "X-PDF-Fallback": "client-print",
            },
          }
        );
      }
    }

    return NextResponse.json({
      success: true,
      contract,
    });
  } catch (err: unknown) {
    let message = isEnHeader
      ? "Failed to generate contract draft."
      : "Sözleşme taslağı oluşturulamadı.";
    if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
