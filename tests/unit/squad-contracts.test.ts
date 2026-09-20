import { describe, it, expect } from "vitest";
import { ContractGeneratorService } from "@/src/modules/contracts/generator";
import type { ContractGeneratorInput } from "@/src/modules/contracts/types";

describe("Squad Agile Consortium Contract Generator (TBK m. 620 & FSEK m. 52)", () => {
  const squadInput: ContractGeneratorInput = {
    engagementId: "eng-squad-998877",
    listingTitle: "Kurumsal B2B Mobil Uygulama & Mikroservis Mimarisi",
    category: "Mobil & Backend Çözümleri",
    matchedAt: "2026-09-19T10:00:00Z",
    scopeSummary: "iOS/Android mobil istemci, Node.js GraphQL mikroservisleri ve Figma tasarım sistemi.",
    budgetLabel: "200.000 TL",
    timelineLabel: "8 Hafta",
    client: {
      displayName: "Teknoloji Yatırımları A.Ş.",
      email: "info@techyatirim.com",
      phone: "+902123334455",
      handle: "techyatirim",
      city: "İstanbul",
      role: "CLIENT",
    },
    contractor: {
      displayName: "Ahmet Yılmaz",
      email: "ahmet@operis.pro",
      phone: "+905321112233",
      handle: "ahmetyilmaz",
      city: "Ankara",
      role: "CONTRACTOR",
    },
    locale: "tr",
    isSquadContract: true,
    squadTitle: "Mobil & Bulut Entegre Çözüm Kolektifi",
    squadMembers: [
      {
        displayName: "Ahmet Yılmaz",
        roleTitle: "Lider Yüklenici & Mobil Mimar",
        revenueSharePercentage: 50,
        scopeSummary: "Proje yönetimi, mobil mimari ve işveren koordinasyonu",
        isLead: true,
      },
      {
        displayName: "Mehmet Demir",
        roleTitle: "Kıdemli Backend Mühendisi",
        revenueSharePercentage: 35,
        scopeSummary: "GraphQL API ve PostgreSQL veri katmanı",
        isLead: false,
      },
      {
        displayName: "Ayşe Kaya",
        roleTitle: "UI/UX Tasarımcısı",
        revenueSharePercentage: 15,
        scopeSummary: "Figma arayüz ve kullanıcı deneyimi tasarımı",
        isLead: false,
      },
    ],
  };

  it("should generate a valid squad contract with SHA-256 fingerprint seal", () => {
    const result = ContractGeneratorService.generateContract(squadInput);

    expect(result.contractRef).toBe("OPR-CONTR-ENGSQUAD");
    expect(result.sha256Fingerprint).toHaveLength(64);
    expect(result.metadata.sha256Verified).toBe(true);
    expect(result.isSquadContract).toBe(true);
    expect(result.squadTitle).toBe("Mobil & Bulut Entegre Çözüm Kolektifi");
    expect(result.squadMembers).toHaveLength(3);
  });

  it("should reference TBK m. 620 Adi Ortaklık / Konsorsiyum in contracting parties", () => {
    const result = ContractGeneratorService.generateContract(squadInput);
    const text = result.plainText;

    expect(text).toContain("ORTAK YÜKLENİCİLER KONSORSİYUMU (ÇEVİK EKİP - TBK m. 620)");
    expect(text).toContain("LİDER YÜKLENİCİ");
    expect(text).toContain("Ahmet Yılmaz");
  });

  it("should establish Lead Contractor authority as sole employer liaison under Madde 1.3", () => {
    const result = ContractGeneratorService.generateContract(squadInput);
    const text = result.plainText;

    expect(text).toContain("1.3. Konsorsiyum Hukuki Statüsü ve Lider Yüklenici Yetkisi (TBK m. 620 & TBK m. 162)");
    expect(text).toContain("Lider Yüklenici");
    expect(text).toContain("müştereken sorumludur");
  });

  it("should include formatted consortium revenue split table in markdown and HTML", () => {
    const result = ContractGeneratorService.generateContract(squadInput);

    // Markdown Table
    expect(result.markdown).toContain("| Sıra | Adı Soyadı / Uzman | Rol / Uzmanlık Alanı | Hakediş Oranı (%) | Sorumluluk / İş Kapsamı |");
    expect(result.markdown).toContain("Lider Yüklenici & Mobil Mimar");
    expect(result.markdown).toContain("%50");
    expect(result.markdown).toContain("%35");
    expect(result.markdown).toContain("%15");

    // HTML Table
    expect(result.htmlContent).toContain("<table");
    expect(result.htmlContent).toContain("Kıdemli Backend Mühendisi");
    expect(result.htmlContent).toContain("UI/UX Tasarımcısı");
  });

  it("should enforce joint FSEK m. 52 IP assignment across all squad members", () => {
    const result = ContractGeneratorService.generateContract(squadInput);
    const text = result.plainText;

    expect(text).toContain("Konsorsiyum Ortak Telif Güvencesi");
    expect(text).toContain(
      "FSEK m. 52 uyarınca İŞVEREN'e kayıtsız ve şartsız devretmeyi müştereken taahhüt ederler"
    );
  });

  it("should generate English consortium terms when locale is 'en'", () => {
    const enInput: ContractGeneratorInput = {
      ...squadInput,
      locale: "en",
    };

    const result = ContractGeneratorService.generateContract(enInput);
    const text = result.plainText;

    expect(result.locale).toBe("en");
    expect(text).toContain("CONSORTIUM OF CO-CONTRACTORS (AGILE SQUAD - TBK Art. 620)");
    expect(text).toContain("LEAD CONTRACTOR");
    expect(text).toContain("1.3. Consortium Legal Framework & Lead Authority (TBK Art. 620 & 162)");
    expect(result.markdown).toContain("| No | Specialist Name | Role Title | Revenue Share (%) | Scope Responsibilities |");
  });

  it("should not inject squad consortium clauses for solo contracts", () => {
    const soloInput: ContractGeneratorInput = {
      ...squadInput,
      isSquadContract: false,
      squadMembers: undefined,
      squadTitle: undefined,
    };

    const result = ContractGeneratorService.generateContract(soloInput);
    const text = result.plainText;

    expect(result.isSquadContract).toBe(false);
    expect(text).not.toContain("ORTAK YÜKLENİCİLER KONSORSİYUMU (ÇEVİK EKİP - TBK m. 620)");
    expect(text).not.toContain("1.3. Konsorsiyum Hukuki Statüsü");
    expect(result.markdown).not.toContain("| Sıra | Adı Soyadı / Uzman |");
  });
});
