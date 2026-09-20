import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/src/lib/db";
import * as schema from "@/db/schema";
import { ContractRecommendationEngine } from "./recommendation-engine";
import { ContractGeneratorService } from "./generator";
import {
  uploadEphemeralSignature,
  deleteEphemeralSignatures,
} from "@/src/modules/storage/r2-client";
import type {
  ContractPackageDetails,
  PackageSigningStatus,
  SubmitSignatureInput,
  SubmitSignatureResponse,
} from "./signing-types";
import { EngagementService } from "../engagements/service";
import { DEFAULT_USER } from "../auth/demo-user";
import { notificationPubSub } from "../notifications/pubsub";
import { NotificationService } from "../notifications/service";

// In-memory fallback for local environments or test runs without live DB
const inMemoryPackages = new Map<string, any>();

export class ContractSigningService {
  /**
   * Hashes IP address for privacy-preserving HMK m. 199 electronic certificate proof.
   */
  static hashIp(ip: string | undefined): string {
    if (!ip) return "ip-unspecified";
    return crypto.createHash("sha256").update(ip.trim()).digest("hex").slice(0, 16);
  }

  /**
   * Retrieves or initializes the engagement's contract package with smart recommendations.
   */
  static async getOrInitPackage(
    engagementId: string,
    currentUserId: string,
    locale: string = "tr"
  ): Promise<{
    packageDetails: ContractPackageDetails;
    recommendations: ReturnType<typeof ContractRecommendationEngine.evaluateRecommendations>;
  }> {
    // 1. Fetch engagement details
    const engagementData = await EngagementService.getEngagementDetails(currentUserId, engagementId);
    if (!engagementData || !engagementData.engagement) {
      throw new Error("Engagement not found or unauthorized access.");
    }

    const { engagement, listing, acceptedOffer } = engagementData;

    // 2. Evaluate Smart Contract Recommendations
    const rawBudgetMin = acceptedOffer?.budgetMin ?? listing?.budgetMin;
    const recBudgetMin = rawBudgetMin !== null && rawBudgetMin !== undefined ? Number(rawBudgetMin) : undefined;
    const rawBudgetMax = acceptedOffer?.budgetMax ?? listing?.budgetMax;
    const recBudgetMax = rawBudgetMax !== null && rawBudgetMax !== undefined ? Number(rawBudgetMax) : undefined;
    const recCurrency = acceptedOffer?.budgetCurrency || listing?.budgetCurrency || "TRY";

    const recInput = {
      engagementId: engagement.id,
      listingTitle: listing?.title || engagement.listingTitleSnapshot,
      categorySlug: undefined,
      categoryName: engagement.listingCategorySnapshot,
      budgetCurrency: recCurrency,
      budgetMin: recBudgetMin,
      budgetMax: recBudgetMax,
      scopeSummary: acceptedOffer?.message || listing?.summary || listing?.scope,
      tags: listing?.tags ? JSON.parse(JSON.stringify(listing.tags)) : [],
      isCorporateClient: Boolean((listing as Record<string, unknown>)?.ownerIsCompanyVerified),
      companyType: ((listing as Record<string, unknown>)?.ownerCompanyType as string) || null,
      isSquadEngagement: Boolean(engagement.isSquadEngagement),
      hasForeignClient: Boolean(recCurrency && /USD|EUR|GBP/i.test(recCurrency)),
      locale,
    };

    const recommendations = ContractRecommendationEngine.evaluateRecommendations(recInput);
    const defaultSelectedKeys = recommendations.recommendedContracts.map((c) => c.id);

    // 3. Query existing package from DB or in-memory
    let pkgRow: any = null;
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.engagementContractPackages)
        .where(eq(schema.engagementContractPackages.engagementId, engagementId));
      if (rows.length > 0) {
        pkgRow = rows[0];
      }
    } catch {
      pkgRow = inMemoryPackages.get(engagementId) || null;
    }

    if (!pkgRow) {
      // Create new package draft
      const newPkg = {
        id: crypto.randomUUID(),
        engagementId,
        selectedContracts: defaultSelectedKeys,
        status: "PENDING_SIGNATURES" as PackageSigningStatus,
        version: 1,
        tamperResetCount: 0,
        clientSignerUserId: null,
        clientSignerName: null,
        clientSignedAt: null,
        clientIpHash: null,
        clientSignatureR2Key: null,
        clientSignatureDataUrl: null,
        freelancerSignerUserId: null,
        freelancerSignerName: null,
        freelancerSignedAt: null,
        freelancerIpHash: null,
        freelancerSignatureR2Key: null,
        freelancerSignatureDataUrl: null,
        compiledMarkdown: null,
        compiledHtml: null,
        sha256Seal: null,
        signedAt: null,
        ephemeralCleanedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      try {
        const db = getDb();
        const [inserted] = await db
          .insert(schema.engagementContractPackages)
          .values({
            id: newPkg.id,
            engagementId: newPkg.engagementId,
            selectedContracts: newPkg.selectedContracts,
            status: newPkg.status,
            version: newPkg.version,
            tamperResetCount: newPkg.tamperResetCount,
          })
          .returning();
        pkgRow = inserted || newPkg;
      } catch {
        inMemoryPackages.set(engagementId, newPkg);
        pkgRow = newPkg;
      }
    }

    return {
      packageDetails: this.mapRowToDetails(pkgRow),
      recommendations,
    };
  }

  /**
   * Updates the chosen contracts in the package before execution.
   * If any party had already signed, modifying contract selection immediately invalidates
   * the prior signature(s), reverts status to PENDING_SIGNATURES, increments tamperResetCount,
   * and purges orphaned ephemeral R2 files to prevent legal scope tampering.
   */
  static async updateSelectedContracts(
    engagementId: string,
    currentUserId: string,
    selectedContracts: string[]
  ): Promise<ContractPackageDetails> {
    const pkg = await this.getOrInitPackage(engagementId, currentUserId);
    if (pkg.packageDetails.status === "FULLY_SIGNED") {
      throw new Error("Cannot modify contract selection after full bilateral signature execution.");
    }

    // Ensure CORE_SERVICE is always preserved as base
    const validatedContracts = Array.from(new Set(["CORE_SERVICE", ...selectedContracts]));

    const hasAnySignature = Boolean(
      pkg.packageDetails.clientSignature || pkg.packageDetails.contractorSignature
    );

    const currentSet = new Set(pkg.packageDetails.selectedContracts);
    const hasChanged =
      validatedContracts.length !== currentSet.size ||
      validatedContracts.some((c) => !currentSet.has(c));

    let signaturesInvalidated = false;
    const r2KeysToPurge: string[] = [];

    const nextVersion = (pkg.packageDetails.version || 1) + 1;
    const updatePayload: any = {
      selectedContracts: validatedContracts,
      version: nextVersion,
      updatedAt: new Date(),
    };

    if (hasChanged && hasAnySignature) {
      signaturesInvalidated = true;
      updatePayload.clientSignerUserId = null;
      updatePayload.clientSignerName = null;
      updatePayload.clientSignedAt = null;
      updatePayload.clientIpHash = null;
      updatePayload.clientSignatureR2Key = null;
      updatePayload.clientSignatureDataUrl = null;

      updatePayload.freelancerSignerUserId = null;
      updatePayload.freelancerSignerName = null;
      updatePayload.freelancerSignedAt = null;
      updatePayload.freelancerIpHash = null;
      updatePayload.freelancerSignatureR2Key = null;
      updatePayload.freelancerSignatureDataUrl = null;

      updatePayload.status = "PENDING_SIGNATURES";
      updatePayload.tamperResetCount = (pkg.packageDetails.tamperResetCount || 0) + 1;

      if (pkg.packageDetails.clientSignature?.signatureR2Key) {
        r2KeysToPurge.push(pkg.packageDetails.clientSignature.signatureR2Key);
      }
      if (pkg.packageDetails.contractorSignature?.signatureR2Key) {
        r2KeysToPurge.push(pkg.packageDetails.contractorSignature.signatureR2Key);
      }
    }

    if (r2KeysToPurge.length > 0) {
      await deleteEphemeralSignatures(r2KeysToPurge);
    }

    let updatedRow: any = null;
    try {
      const db = getDb();
      const [row] = await db
        .update(schema.engagementContractPackages)
        .set(updatePayload)
        .where(eq(schema.engagementContractPackages.engagementId, engagementId))
        .returning();
      updatedRow = row;
    } catch {
      const existing = inMemoryPackages.get(engagementId) || pkg.packageDetails;
      Object.assign(existing, updatePayload);
      inMemoryPackages.set(engagementId, existing);
      updatedRow = existing;
    }

    const details = this.mapRowToDetails(updatedRow);
    if (signaturesInvalidated) {
      details.signaturesInvalidated = true;
      notificationPubSub.emitContractEvent(engagementId, {
        type: "CONTRACT_SIGNATURES_INVALIDATED",
        engagementId,
        packageId: updatedRow.id,
        status: "PENDING_SIGNATURES",
        version: nextVersion,
        selectedContracts: validatedContracts,
        noticeTr:
          "Sözleşme seçimi değiştiği için önceden atılmış olan imza(lar) güvenlik amacıyla sıfırlandı. Lütfen güncel paketi inceleyin.",
        noticeEn:
          "Contract selection changed; prior signature(s) were invalidated. Please review the updated package.",
        timestamp: new Date().toISOString(),
      });
    } else if (hasChanged) {
      notificationPubSub.emitContractEvent(engagementId, {
        type: "CONTRACT_SELECTION_UPDATED",
        engagementId,
        packageId: updatedRow.id,
        status: updatedRow.status,
        version: nextVersion,
        selectedContracts: validatedContracts,
        timestamp: new Date().toISOString(),
      });
    }
    return details;
  }

  /**
   * Submits a party's signature (drawn canvas or uploaded stamp/signature image).
   * Automatically executes and batch-signs the entire package when both signatures are ready,
   * then purges temporary signature images from Cloudflare R2 storage.
   */
  static async submitSignature(input: SubmitSignatureInput): Promise<SubmitSignatureResponse> {
    if (!input.legalAcknowledged) {
      throw new Error(
        "Taraflar Operis platformunun sorumsuzluğunu ve dava muafiyetini onaylamadan sözleşme imzalanamaz."
      );
    }

    if (!input.signatureDataUrl || !input.signatureDataUrl.startsWith("data:")) {
      throw new Error("Geçerli bir dijital imza görseli veya çizim verisi gereklidir.");
    }

    // 1. Fetch engagement details
    const engagementData = await EngagementService.getEngagementDetails(input.userId, input.engagementId);
    if (!engagementData || !engagementData.engagement) {
      throw new Error("Engagement not found or unauthorized signer.");
    }

    const { engagement, listing, acceptedOffer, counterpartyContact } = engagementData;
    const isClient = input.role === "CLIENT";

    // 2. Decode signature image buffer and upload to Cloudflare R2 (10 GB free tier ephemeral storage)
    const base64Data = input.signatureDataUrl.split(",")[1] || "";
    const imageBuffer = Buffer.from(base64Data, "base64");
    const mimeMatch = input.signatureDataUrl.match(/data:([^;]+);/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/webp";

    const r2Result = await uploadEphemeralSignature(
      input.engagementId,
      input.role,
      imageBuffer,
      mimeType
    );

    const ipHash = this.hashIp(input.clientIp);
    const now = new Date();

    // 3. Retrieve or create package record
    const { packageDetails } = await this.getOrInitPackage(input.engagementId, input.userId);

    // Optimistic Concurrency Control (CAS)
    const currentVersion = Number(packageDetails.version || 1);
    if (input.expectedVersion !== undefined && input.expectedVersion !== currentVersion) {
      throw new Error(
        "CONCURRENCY_CONFLICT: Sözleşme paketi başka bir işlem tarafından güncellendi. Lütfen sayfayı yenileyip en güncel sözleşmeleri inceleyin."
      );
    }

    const nextVersion = currentVersion + 1;
    const selectedContracts = input.selectedContracts || packageDetails.selectedContracts || ["CORE_SERVICE"];

    // Update in DB or memory
    const updatePayload: any = {
      selectedContracts,
      version: nextVersion,
      updatedAt: now,
    };

    if (isClient) {
      updatePayload.clientSignerUserId = input.userId;
      updatePayload.clientSignerName = input.signerName;
      updatePayload.clientSignedAt = now;
      updatePayload.clientIpHash = ipHash;
      updatePayload.clientSignatureR2Key = r2Result.key;
      updatePayload.clientSignatureDataUrl = input.signatureDataUrl;
    } else {
      updatePayload.freelancerSignerUserId = input.userId;
      updatePayload.freelancerSignerName = input.signerName;
      updatePayload.freelancerSignedAt = now;
      updatePayload.freelancerIpHash = ipHash;
      updatePayload.freelancerSignatureR2Key = r2Result.key;
      updatePayload.freelancerSignatureDataUrl = input.signatureDataUrl;
    }

    let updatedPkg: any = null;
    try {
      const db = getDb();
      const [row] = await db
        .update(schema.engagementContractPackages)
        .set(updatePayload)
        .where(eq(schema.engagementContractPackages.engagementId, input.engagementId))
        .returning();
      updatedPkg = row;
    } catch {
      const existing = inMemoryPackages.get(input.engagementId) || packageDetails;
      Object.assign(existing, updatePayload);
      inMemoryPackages.set(input.engagementId, existing);
      updatedPkg = existing;
    }

    // 4. Check if BOTH parties have now signed
    const hasClientSigned = Boolean(updatedPkg.clientSignedAt);
    const hasFreelancerSigned = Boolean(updatedPkg.freelancerSignedAt);
    const isFullySigned = hasClientSigned && hasFreelancerSigned;

    if (isFullySigned) {
      // 5. AUTO-EXECUTE & COMPILE BATCH PACKAGE
      const clientName = updatedPkg.clientSignerName || "İşveren";
      const contractorName = updatedPkg.freelancerSignerName || "Yüklenici";

      const rawBudgetAmt = acceptedOffer?.budgetMin ?? listing?.budgetMin;
      const budgetAmt = rawBudgetAmt !== null && rawBudgetAmt !== undefined ? Number(rawBudgetAmt) : null;
      const budgetCurr = acceptedOffer?.budgetCurrency || listing?.budgetCurrency || "TRY";
      const budgetLabel = budgetAmt ? `${budgetAmt.toLocaleString("tr-TR")} ${budgetCurr}` : null;

      let clientEmail = counterpartyContact?.email || "—";
      if (isClient) {
        clientEmail = input.userId === DEFAULT_USER.id ? DEFAULT_USER.email : "client@operis.local";
      }

      let contractorEmail = counterpartyContact?.email || "—";
      if (!isClient) {
        contractorEmail = input.userId === DEFAULT_USER.id ? DEFAULT_USER.email : "contractor@operis.local";
      }

      const compiledResult = ContractGeneratorService.generateContract({
        engagementId: engagement.id,
        listingTitle: listing?.title || engagement.listingTitleSnapshot,
        category: engagement.listingCategorySnapshot,
        matchedAt: engagement.matchedAt || now,
        scopeSummary: acceptedOffer?.message || listing?.summary || listing?.scope || "Teknik Kapsam",
        budgetLabel,
        client: {
          displayName: clientName,
          email: clientEmail,
          role: "CLIENT",
        },
        contractor: {
          displayName: contractorName,
          email: contractorEmail,
          role: "CONTRACTOR",
        },
        selectedContracts,
        clientSignature: {
          signerName: clientName,
          signedAt: new Date(updatedPkg.clientSignedAt).toISOString(),
          ipHash: updatedPkg.clientIpHash,
          signatureDataUrl: updatedPkg.clientSignatureDataUrl,
        },
        contractorSignature: {
          signerName: contractorName,
          signedAt: new Date(updatedPkg.freelancerSignedAt).toISOString(),
          ipHash: updatedPkg.freelancerIpHash,
          signatureDataUrl: updatedPkg.freelancerSignatureDataUrl,
        },
      });

      const sha256Seal = ContractGeneratorService.calculateSha256(compiledResult.markdown);

      // 6. EPHEMERAL CLEANUP: Purge raw signature files from Cloudflare R2
      // Now that signatures are permanently embedded into the compiled documents,
      // the temporary files are safely deleted to preserve the 10 GB free tier space.
      const keysToClean = [
        updatedPkg.clientSignatureR2Key,
        updatedPkg.freelancerSignatureR2Key,
      ].filter(Boolean) as string[];

      await deleteEphemeralSignatures(keysToClean);

      const finalUpdate = {
        status: "FULLY_SIGNED" as PackageSigningStatus,
        compiledMarkdown: compiledResult.markdown,
        compiledHtml: compiledResult.htmlContent,
        sha256Seal,
        version: nextVersion + 1,
        signedAt: now,
        ephemeralCleanedAt: now,
        updatedAt: now,
      };

      try {
        const db = getDb();
        await db
          .update(schema.engagementContractPackages)
          .set(finalUpdate)
          .where(eq(schema.engagementContractPackages.engagementId, input.engagementId));
      } catch {
        Object.assign(updatedPkg, finalUpdate);
        inMemoryPackages.set(input.engagementId, updatedPkg);
      }

      // Emit real-time event to engagement channel (triggers live celebration & UI update)
      notificationPubSub.emitContractEvent(input.engagementId, {
        type: "CONTRACT_FULLY_EXECUTED",
        engagementId: input.engagementId,
        packageId: updatedPkg.id,
        status: "FULLY_SIGNED",
        version: finalUpdate.version,
        signerRole: input.role,
        signerName: input.signerName,
        signedAt: now.toISOString(),
        sha256Seal,
        selectedContracts,
        timestamp: now.toISOString(),
      });

      // Dispatch in-app notifications to both parties
      const clientUserId = engagement.ownerUserId;
      const freelancerUserId = engagement.freelancerUserId;
      const recipientUserIds = Array.from(new Set([clientUserId, freelancerUserId].filter(Boolean) as string[]));

      for (const uid of recipientUserIds) {
        NotificationService.createNotification(
          uid,
          "CONTRACT_PACKAGE_FULLY_EXECUTED",
          "engagement",
          input.engagementId,
          {
            title: "🎉 Sözleşmeler Çift Taraflı Mühürlendi!",
            message: `"${listing?.title || "Proje"}" sözleşme paketi her iki tarafça başarıyla imzalandı ve SHA-256 kriptografik mührü oluşturuldu.`,
            actionUrl: `/tr/calisma-alani/${input.engagementId}`,
            engagementId: input.engagementId,
            sha256Seal,
          }
        ).catch(() => {});
      }

      return {
        success: true,
        packageId: updatedPkg.id,
        status: "FULLY_SIGNED",
        isFullySigned: true,
        version: finalUpdate.version,
        messageTr: "Tüm sözleşmeler her iki tarafça başarıyla imzalandı ve mühürlendi.",
        messageEn: "All agreements have been successfully executed and sealed by both parties.",
        backupDownloadPrompt: {
          showPrompt: true,
          titleTr: "Sözleşme Paketi İmzalandı — Çevrimdışı Yedeğinizi İndirin",
          titleEn: "Contract Package Signed — Download Offline Backup",
          descriptionTr:
            "Sözleşmeleriniz başarıyla akdedildi. Operis platformu sözleşmenin tarafı değildir. Olası bir hukuki ihtilafta haklarınızı korumak adına imzalı sözleşme yedeğini hemen bilgisayarınıza indirin.",
          descriptionEn:
            "Agreements executed. Operis is not a party to this contract. Download your offline signed backup now for legal protection in case of dispute.",
          downloadUrl: `/api/work/${input.engagementId}/contract?format=markdown`,
          markdownUrl: `/api/work/${input.engagementId}/contract?format=markdown`,
          htmlUrl: `/api/work/${input.engagementId}/contract?format=html`,
        },
      };
    }

    // Single-sided signature recorded: Emit real-time event
    notificationPubSub.emitContractEvent(input.engagementId, {
      type: "CONTRACT_SIGNED",
      engagementId: input.engagementId,
      packageId: updatedPkg.id,
      status: "PARTIALLY_SIGNED",
      version: nextVersion,
      signerRole: input.role,
      signerName: input.signerName,
      signedAt: now.toISOString(),
      selectedContracts,
      timestamp: now.toISOString(),
    });

    // Dispatch notification to counterparty
    const counterpartyUserId = isClient ? engagement.freelancerUserId : engagement.ownerUserId;
    if (counterpartyUserId) {
      NotificationService.createNotification(
        counterpartyUserId,
        "CONTRACT_PACKAGE_SIGNED",
        "engagement",
        input.engagementId,
        {
          title: isClient ? "İşveren Sözleşmeyi İmzaladı" : "Yüklenici Sözleşmeyi İmzaladı",
          message: `${input.signerName} sözleşme paketini imzaladı. Süreci tamamlamak için lütfen siz de imzanızı ekleyin.`,
          actionUrl: `/tr/calisma-alani/${input.engagementId}`,
          engagementId: input.engagementId,
          signerRole: input.role,
          signerName: input.signerName,
        }
      ).catch(() => {});
    }

    return {
      success: true,
      packageId: updatedPkg.id,
      status: "PARTIALLY_SIGNED",
      isFullySigned: false,
      version: nextVersion,
      messageTr: "İmzanız sisteme güvenle yüklendi. Karşı tarafın imzası bekleniyor.",
      messageEn: "Your signature has been securely submitted. Awaiting counterparty signature.",
    };
  }

  /**
   * Maps a database row or mock object to strongly typed ContractPackageDetails.
   */
  private static mapRowToDetails(row: any): ContractPackageDetails {
    let selectedContracts = ["CORE_SERVICE"];
    if (Array.isArray(row.selectedContracts)) {
      selectedContracts = row.selectedContracts;
    } else if (typeof row.selectedContracts === "string") {
      try {
        selectedContracts = JSON.parse(row.selectedContracts);
      } catch {
        selectedContracts = ["CORE_SERVICE"];
      }
    }

    return {
      id: row.id,
      engagementId: row.engagementId,
      status: row.status as PackageSigningStatus,
      selectedContracts,
      version: Number(row.version ?? 1),
      tamperResetCount: Number(row.tamperResetCount ?? 0),
      signaturesInvalidated: Boolean(row.signaturesInvalidated),
      clientSignature: row.clientSignedAt
        ? {
            signerUserId: row.clientSignerUserId || "",
            signerName: row.clientSignerName || "İşveren",
            role: "CLIENT",
            signedAt: new Date(row.clientSignedAt).toISOString(),
            ipHash: row.clientIpHash || "",
            signatureType: "DRAWN",
            signatureR2Key: row.clientSignatureR2Key,
            signatureDataUrl: row.clientSignatureDataUrl,
            legalAccepted: true,
          }
        : null,
      contractorSignature: row.freelancerSignedAt
        ? {
            signerUserId: row.freelancerSignerUserId || "",
            signerName: row.freelancerSignerName || "Yüklenici",
            role: "CONTRACTOR",
            signedAt: new Date(row.freelancerSignedAt).toISOString(),
            ipHash: row.freelancerIpHash || "",
            signatureType: "DRAWN",
            signatureR2Key: row.freelancerSignatureR2Key,
            signatureDataUrl: row.freelancerSignatureDataUrl,
            legalAccepted: true,
          }
        : null,
      compiledMarkdown: row.compiledMarkdown,
      compiledHtml: row.compiledHtml,
      sha256Seal: row.sha256Seal,
      signedAt: row.signedAt ? new Date(row.signedAt).toISOString() : null,
      ephemeralCleanedAt: row.ephemeralCleanedAt ? new Date(row.ephemeralCleanedAt).toISOString() : null,
      createdAt: new Date(row.createdAt).toISOString(),
      updatedAt: new Date(row.updatedAt).toISOString(),
    };
  }
}
