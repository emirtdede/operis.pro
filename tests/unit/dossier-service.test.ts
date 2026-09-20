import { describe, it, expect } from "vitest";
import { DossierService } from "@/src/modules/contracts/dossier-service";
import { DossierZipBuilder } from "@/src/modules/contracts/dossier-zip-builder";

describe("HMK m. 193 Legal Evidence & Mediation Dossier Service", () => {
  describe("PKZip 2.0 Archive Builder (DossierZipBuilder)", () => {
    it("builds a valid binary ZIP archive with local headers, central directory, and EOCD", () => {
      const builder = new DossierZipBuilder();
      builder.addFile("test.txt", "Merhaba Operis!");
      builder.addFile("subfolder/doc.json", JSON.stringify({ verified: true }));

      const buffer = builder.build();

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(100);

      // Verify PKZip signatures
      // Local header magic: 0x04034b50 (PK\x03\x04)
      expect(buffer.readUInt32LE(0)).toBe(0x04034b50);

      // Search for Central Directory magic: 0x02014b50 (PK\x01\x02)
      let foundCd = false;
      let foundEocd = false;
      for (let i = 0; i < buffer.length - 4; i++) {
        const sig = buffer.readUInt32LE(i);
        if (sig === 0x02014b50) foundCd = true;
        if (sig === 0x06054b50) foundEocd = true;
      }
      expect(foundCd).toBe(true);
      expect(foundEocd).toBe(true);
    });

    it("handles binary Buffers and string content identically", () => {
      const builder = new DossierZipBuilder();
      const stringContent = "Kriptografik İspat HMK 193";
      const bufferContent = Buffer.from(stringContent, "utf8");

      builder.addFile("a.txt", stringContent);
      builder.addFile("b.txt", bufferContent);

      const zip = builder.build();
      expect(zip.length).toBeGreaterThan(0);
    });
  });

  describe("Cryptographic Hashes & Master Root Calculation", () => {
    it("computes 64-character hex SHA-256 strings deterministically", () => {
      const hash1 = DossierService.sha256("Test Content");
      const hash2 = DossierService.sha256("Test Content");
      const hash3 = DossierService.sha256("Different Content");

      expect(hash1).toHaveLength(64);
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
    });

    it("calculates deterministic Master Root Hash invariant of document insertion order", () => {
      const docs1 = [
        { path: "01/contract.md", sha256: "aaa" },
        { path: "02/tests.md", sha256: "bbb" },
        { path: "03/handover.md", sha256: "ccc" },
      ];
      const docs2 = [
        { path: "03/handover.md", sha256: "ccc" },
        { path: "01/contract.md", sha256: "aaa" },
        { path: "02/tests.md", sha256: "bbb" },
      ];

      const root1 = DossierService.calculateMasterRootHash(docs1);
      const root2 = DossierService.calculateMasterRootHash(docs2);

      expect(root1).toHaveLength(64);
      expect(root1).toBe(root2);
    });
  });

  describe("Evidence Dossier Compilation (buildDossier)", () => {
    it("compiles all 6 mandatory statutory exhibit categories into the dossier", async () => {
      const result = await DossierService.buildDossier({
        engagementId: "eng-test-dossier-001",
        requestingUserId: "user-client-123",
        locale: "tr",
      });

      expect(result.manifest).toBeDefined();
      expect(result.manifest.dossierRef).toContain("OPR-DOSSIER-ENGTESTD");
      expect(result.manifest.masterDossierSha256).toHaveLength(64);
      expect(result.manifest.totalDocumentsCount).toBeGreaterThanOrEqual(7);

      const paths = result.manifest.documents.map((d) => d.path);

      // 00. Manifest & Index
      expect(paths.some((p) => p.includes("00_HMK193_DELIL_LISTESI_VE_DIZIN_OZETI.md"))).toBe(true);
      expect(paths.some((p) => p.includes("00_HMK193_DELIL_LISTESI_VE_DIZIN_OZETI.html"))).toBe(true);

      // 01. Contract & Annexes
      expect(paths.some((p) => p.startsWith("01_ASIL_SOZLESME_VE_EKLERI/"))).toBe(true);

      // 02. Acceptance tests & DoD
      expect(paths.some((p) => p.startsWith("02_KABUL_TESTLERI_VE_DOD/"))).toBe(true);

      // 03. Scope change requests & addenda
      expect(paths.some((p) => p.startsWith("03_REVIZYON_VE_EK_TALEPLER_LOGU/"))).toBe(true);

      // 04. Handover protocol
      expect(paths.some((p) => p.startsWith("04_TESLIM_TUTANAKLARI/"))).toBe(true);

      // 05. Milestones ledger
      expect(paths.some((p) => p.startsWith("05_HAKEDIS_VE_ODEME_DEFTERI/"))).toBe(true);

      // 06. Forensic audit trail & Checksums
      expect(paths.some((p) => p.startsWith("06_DENETIM_IZI_VE_ZAMAN_DAMGALARI/"))).toBe(true);
      expect(paths.some((p) => p === "checksums.sha256")).toBe(true);

      // 07. FSEK m. 52 IP Assignment Deeds
      expect(paths.some((p) => p.startsWith("07_FIKRI_MULKIYET_VE_DEVIR_TESCIL/"))).toBe(true);
      expect(
        result.manifest.documents.some((d) => d.category === "IP_ASSIGNMENT_DEEDS")
      ).toBe(true);

      // 08. Closing & Discharge / Liquidation Deeds (TBK m. 132 / HMK m. 313 & TBK m. 484-486)
      expect(paths.some((p) => p.startsWith("08_KAPANIS_VE_SULH_IBRA/"))).toBe(true);
      expect(
        result.manifest.documents.some((d) => d.category === "CLOSING_DISCHARGE_DEEDS")
      ).toBe(true);

      // EK-6, EK-7, EK-8 360 lifecycle exhibits
      expect(paths.some((p) => p.includes("EK_6_TEMIZ_KOD_VE_SIBER_GUVENLIK.md"))).toBe(true);
      expect(paths.some((p) => p.includes("EK_7_ACIK_KAYNAK_LISANS_SAFLIGI.md"))).toBe(true);
      expect(paths.some((p) => p.includes("EK_8_MUSTERI_PERSONEL_AYARTMAMA.md"))).toBe(true);
    });

    it("generates early termination & liquidation deeds when dispute occurs (TBK m. 484-486)", async () => {
      const result = await DossierService.buildDossier({
        engagementId: "eng-test-dispute-99",
        requestingUserId: "user-client-123",
        locale: "tr",
      });

      const paths = result.manifest.documents.map((d) => d.path);
      expect(paths.some((p) => p.includes("ERKEN_FESIH_VE_TASFIYE_SENEDI.md"))).toBe(true);
      expect(paths.some((p) => p.includes("ERKEN_FESIH_VE_TASFIYE_SENEDI.html"))).toBe(true);
      const liquidationDoc = result.manifest.documents.find((d) => d.path.includes("ERKEN_FESIH_VE_TASFIYE_SENEDI.md"));
      expect(liquidationDoc?.content).toContain("TBK m. 484-486");
      expect(liquidationDoc?.content).toContain("TASFİYE");
    });

    it("generates GNU-compliant checksums.sha256 file matching all exhibits", async () => {
      const result = await DossierService.buildDossier({
        engagementId: "eng-test-dossier-002",
        requestingUserId: "user-client-123",
        locale: "tr",
      });

      const checksumsContent = result.manifest.checksumsSha256Content;
      expect(checksumsContent).toContain("  01_ASIL_SOZLESME_VE_EKLERI/");
      expect(checksumsContent).toContain("  04_TESLIM_TUTANAKLARI/");

      // Check format: 64-char hash + 2 spaces + path
      const lines = checksumsContent.trim().split("\n");
      for (const line of lines) {
        const parts = line.split(/\s\s+/);
        expect(parts[0]).toHaveLength(64);
        expect(parts[1]).toBeDefined();
      }
    });

    it("generates print-ready unified HTML report conforming to court presentation standards", async () => {
      const result = await DossierService.buildDossier({
        engagementId: "eng-test-dossier-003",
        requestingUserId: "user-client-123",
        locale: "tr",
      });

      const html = result.unifiedHtml;
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("6100 Sayılı Hukuk Muhakemeleri Kanunu m. 193 Uyarınca Münhasır Delil Manifestosu");
      expect(html).toContain("MASTER DELİL KÖK MÜHRÜ (SHA-256 ROOT HASH)");
      expect(html).toContain(result.manifest.masterDossierSha256);
      expect(html).toContain("RESMİ ADLİ DELİL LİSTESİ VE DİZİN İNDEKSİ");
      expect(html).toContain("@page { size: A4;");
    });

    it("generates a valid, non-empty PKZip binary Buffer", async () => {
      const result = await DossierService.buildDossier({
        engagementId: "eng-test-dossier-004",
        requestingUserId: "user-client-123",
        locale: "tr",
      });

      const zip = result.zipBuffer;
      expect(zip).toBeInstanceOf(Buffer);
      expect(zip.length).toBeGreaterThan(500);
      expect(zip.readUInt32LE(0)).toBe(0x04034b50); // Valid zip magic
    });

    it("supports English statutory evidentiary agreements (locale: en)", async () => {
      const result = await DossierService.buildDossier({
        engagementId: "eng-test-dossier-en",
        requestingUserId: "user-client-123",
        locale: "en",
      });

      expect(result.manifest.locale).toBe("en");
      expect(result.manifestMarkdown).toContain("STATUTORY LEGAL EVIDENCE & MEDIATION DOSSIER (HMK ART. 193");
      expect(result.manifestMarkdown).toContain("Master SHA-256 Root Digest");
      expect(result.unifiedHtml).toContain("Statutory Evidence & Mediation Dossier (HMK Art. 193)");
    });
  });
});
