/**
 * Freelance Squads & Consortium Revenue Engine (Operis Offers Module)
 *
 * Implements multi-disciplinary collective proposal logic under
 * 6098 sayılı Türk Borçlar Kanunu (TBK) m. 620 (Adi Ortaklık / Konsorsiyum)
 * and m. 162+ (Müşterek ve Müteselsil Taahhüt).
 */

export interface SquadMemberInput {
  displayName: string;
  roleTitle: string;
  revenueSharePercentage: number;
  scopeSummary?: string | null;
  handleOrEmail?: string | null;
  isLead?: boolean;
  userId?: string | null;
}

export interface SquadMemberDto extends SquadMemberInput {
  id?: string;
  offerId?: string;
  createdAt?: string;
}

export interface SquadPayoutBreakdown {
  displayName: string;
  roleTitle: string;
  isLead: boolean;
  percentage: number;
  allocatedAmount: number;
  calculatedAmount: number;
  formattedAmount?: string;
  currency: string;
}

export interface SquadValidationResult {
  isValid: boolean;
  totalPercentage: number;
  error?: string;
  errorTr?: string;
  errorEn?: string;
}

export class SquadRevenueEngine {
  /**
   * Validates revenue distribution and structural invariants for a squad proposal:
   * 1. 2 to 5 members required
   * 2. Exactly 1 lead contractor
   * 3. Total revenue share must equal exactly 100%
   * 4. Each share between 1% and 99%
   */
  static validateSquadDistribution(members: SquadMemberInput[]): SquadValidationResult {
    if (!members || !Array.isArray(members)) {
      return {
        isValid: false,
        totalPercentage: 0,
        error: "Çevik ekip üye listesi boş olamaz.",
        errorTr: "Çevik ekip üye listesi boş olamaz.",
        errorEn: "Squad members list cannot be empty.",
      };
    }

    if (members.length < 2) {
      return {
        isValid: false,
        totalPercentage: members.reduce((sum, m) => sum + (Number(m.revenueSharePercentage) || 0), 0),
        error: "Çevik ekip teklifi en az 2 uzmandan (1 Lider + 1 Eş Yüklenici) oluşmalıdır.",
        errorTr: "Çevik ekip teklifi en az 2 uzmandan (1 Lider + 1 Eş Yüklenici) oluşmalıdır.",
        errorEn: "A squad proposal must include at least 2 specialists (1 Lead + 1 Co-Contractor).",
      };
    }

    if (members.length > 5) {
      return {
        isValid: false,
        totalPercentage: members.reduce((sum, m) => sum + (Number(m.revenueSharePercentage) || 0), 0),
        error: "Çevik ekip koordinasyon güvenliği için en fazla 5 uzmandan oluşabilir.",
        errorTr: "Çevik ekip koordinasyon güvenliği için en fazla 5 uzmandan oluşabilir.",
        errorEn: "Squad cannot exceed 5 specialists to maintain agile coordination integrity.",
      };
    }

    let leadCount = 0;
    let total = 0;

    for (const member of members) {
      if (!member.displayName || member.displayName.trim().length < 2) {
        return {
          isValid: false,
          totalPercentage: total,
          error: "Her ekip üyesinin geçerli bir isim ve unvana sahip olması zorunludur. Ad Soyad ve Rol alanları doldurulmalıdır.",
          errorTr: "Her ekip üyesinin geçerli bir isim ve unvana sahip olması zorunludur. Ad Soyad ve Rol alanları doldurulmalıdır.",
          errorEn: "Each squad member must have a valid display name.",
        };
      }

      if (!member.roleTitle || member.roleTitle.trim().length < 2) {
        return {
          isValid: false,
          totalPercentage: total,
          error: `${member.displayName} için uzmanlık rolü belirtilmelidir (örn: Backend Geliştirici). Ad Soyad ve Rol alanları doldurulmalıdır.`,
          errorTr: `${member.displayName} için uzmanlık rolü belirtilmelidir (örn: Backend Geliştirici). Ad Soyad ve Rol alanları doldurulmalıdır.`,
          errorEn: `Specialty role title must be specified for ${member.displayName}.`,
        };
      }

      const share = Number(member.revenueSharePercentage);
      if (isNaN(share) || share < 1 || share > 99) {
        return {
          isValid: false,
          totalPercentage: total,
          error: `${member.displayName} hakediş payı %1 ile %99 arasında olmalıdır.`,
          errorTr: `${member.displayName} hakediş payı %1 ile %99 arasında olmalıdır.`,
          errorEn: `Revenue share for ${member.displayName} must be between 1% and 99%.`,
        };
      }

      total += share;
      if (member.isLead) {
        leadCount++;
      }
    }

    // Cent-level float rounding protection
    const roundedTotal = Math.round(total * 100) / 100;
    if (Math.abs(roundedTotal - 100) > 0.01) {
      return {
        isValid: false,
        totalPercentage: roundedTotal,
        error: `Ekip üyelerinin hakediş payları toplamı tam olarak %100 olmalıdır. (Şu anki toplam: %${roundedTotal})`,
        errorTr: `Ekip üyelerinin hakediş payları toplamı tam olarak %100 olmalıdır. (Şu anki toplam: %${roundedTotal})`,
        errorEn: `Total squad revenue share must sum up to exactly 100%. (Current: ${roundedTotal}%)`,
      };
    }

    if (leadCount !== 1) {
      const msg = leadCount === 0
        ? "Çevik ekipte işverene karşı tek muhatap olacak tam 1 adet Lider Yüklenici seçilmelidir."
        : "Çevik ekipte işverene karşı tek muhatap olacak yalnızca 1 adet Lider Yüklenici bulunabilir.";
      return {
        isValid: false,
        totalPercentage: roundedTotal,
        error: msg,
        errorTr: msg,
        errorEn: "A squad must designate exactly 1 Lead Contractor as sole liaison.",
      };
    }

    return {
      isValid: true,
      totalPercentage: 100,
    };
  }

  /**
   * Allocates gross budget across squad members with exact penny/cent precision.
   * Any residual penny rounding disparity is assigned to the Lead Contractor.
   */
  static calculatePayouts(
    totalBudget: number,
    currency = "TRY",
    members: SquadMemberInput[]
  ): SquadPayoutBreakdown[] {
    if (!totalBudget || totalBudget <= 0 || !members || members.length === 0) {
      return [];
    }

    let allocatedSum = 0;
    const results: SquadPayoutBreakdown[] = [];
    let leadIndex = -1;

    members.forEach((m, idx) => {
      const share = Number(m.revenueSharePercentage) || 0;
      // Truncate to 2 decimal places
      const amount = Math.floor(totalBudget * (share / 100) * 100) / 100;
      allocatedSum += amount;

      if (m.isLead) {
        leadIndex = idx;
      }

      results.push({
        displayName: m.displayName,
        roleTitle: m.roleTitle,
        isLead: Boolean(m.isLead),
        percentage: share,
        allocatedAmount: amount,
        calculatedAmount: amount,
        currency,
        formattedAmount: `${new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)} ${currency}`,
      });
    });

    // Residual rounding delta balancing
    const remainder = Math.round((totalBudget - allocatedSum) * 100) / 100;
    if (remainder !== 0 && leadIndex >= 0 && results[leadIndex]) {
      const balanced = Math.round((results[leadIndex]!.allocatedAmount + remainder) * 100) / 100;
      results[leadIndex]!.allocatedAmount = balanced;
      results[leadIndex]!.calculatedAmount = balanced;
      results[leadIndex]!.formattedAmount = `${new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(balanced)} ${currency}`;
    }

    return results;
  }

  /**
   * Suggests default squad composition based on listing category and keywords.
   */
  static suggestDefaultSquad(
    categoryKey?: string | null,
    title?: string | null
  ): { squadTitle: string; title: string; members: SquadMemberInput[] } {
    const combined = `${categoryKey || ""} ${title || ""}`.toLowerCase();

    // 1. Mobile Development Squad
    if (combined.includes("mobile") || combined.includes("mobil") || combined.includes("ios") || combined.includes("android")) {
      const squadTitle = "Mobil & Backend Çevik Konsorsiyumu";
      return {
        squadTitle,
        title: squadTitle,
        members: [
          {
            displayName: "Lider Yüklenici (Sen)",
            roleTitle: "Kıdemli Mobil Geliştirici (iOS/Android)",
            revenueSharePercentage: 50,
            scopeSummary: "Mobil uygulama mimarisi, ekran kodlaması ve mağaza dağıtımı.",
            isLead: true,
          },
          {
            displayName: "Backend Uzmanı",
            roleTitle: "Cloud & API Mimarı",
            revenueSharePercentage: 35,
            scopeSummary: "Veritabanı tasarımı, REST/GraphQL uç noktaları ve auth servisi.",
            isLead: false,
          },
          {
            displayName: "UI/UX Tasarımcısı",
            roleTitle: "Ürün & Arayüz Tasarımcısı",
            revenueSharePercentage: 15,
            scopeSummary: "Figma prototipleri, tasarım sistemi ve mobil kullanıcı deneyimi.",
            isLead: false,
          },
        ],
      };
    }

    // 2. AI & Machine Learning Squad
    if (combined.includes("ai") || combined.includes("yapay zeka") || combined.includes("llm") || combined.includes("rag")) {
      const squadTitle = "Yapay Zeka & Fullstack Çözüm Ekibi";
      return {
        squadTitle,
        title: squadTitle,
        members: [
          {
            displayName: "Lider Yüklenici (Sen)",
            roleTitle: "AI & RAG Pipeline Mühendisi",
            revenueSharePercentage: 50,
            scopeSummary: "Vektör veritabanı, prompt orkestrasyonu ve model entegrasyonu.",
            isLead: true,
          },
          {
            displayName: "Veri & Backend Mühendisi",
            roleTitle: "Vektör DB & API Mimarı",
            revenueSharePercentage: 30,
            scopeSummary: "ETL boru hatları, PostgreSQL/pgvector ve veri hazırlama.",
            isLead: false,
          },
          {
            displayName: "UI/UX & Frontend Geliştirici",
            roleTitle: "Model Arayüzü & Next.js",
            revenueSharePercentage: 20,
            scopeSummary: "Next.js kullanıcı arayüzü, prompt playground ve sohbet arayüzü.",
            isLead: false,
          },
        ],
      };
    }

    // 3. Default: Fullstack Web & Product Squad
    const defaultTitle = "Fullstack Web & Tasarım Kolektifi";
    return {
      squadTitle: defaultTitle,
      title: defaultTitle,
      members: [
        {
          displayName: "Lider Yüklenici (Sen)",
          roleTitle: "Kıdemli Fullstack Geliştirici",
          revenueSharePercentage: 50,
          scopeSummary: "Sistem mimarisi, backend servisleri, API ve veritabanı kurulumu.",
          isLead: true,
        },
        {
          displayName: "Frontend Geliştirici",
          roleTitle: "Modern Web & UI Geliştirici",
          revenueSharePercentage: 35,
          scopeSummary: "Next.js/React arayüz bileşenleri, istemci etkileşimleri ve SEO.",
          isLead: false,
        },
        {
          displayName: "UI/UX Tasarımcısı",
          roleTitle: "Arayüz & Deneyim Tasarımcısı",
          revenueSharePercentage: 15,
          scopeSummary: "Figma tasarım sistemi, wireframe'ler ve tasarım varlıkları.",
          isLead: false,
        },
      ],
    };
  }
}
