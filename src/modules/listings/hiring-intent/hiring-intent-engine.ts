import type {
  ClientHistoricalMetrics,
  HiringIntentBreakdown,
  HiringIntentEvaluationInput,
  HiringIntentLevel,
  HiringIntentPenalty,
  PillarScore,
} from "./hiring-intent-types";

export class HiringIntentEngine {
  /**
   * Platform-wide conjugate Beta prior for Bayesian hire rate smoothing.
   * alpha = 2 (pseudo-hires), beta = 1 (pseudo-non-hires).
   * Prior mean expectation = 2 / 3 = 66.7%
   */
  static readonly PRIOR_ALPHA = 2;
  static readonly PRIOR_BETA = 1;

  /**
   * Calculates smoothed Bayesian hire rate to eliminate small-sample volatility
   * and division-by-zero during cold-start (n=0).
   */
  static calculateBayesianHireRate(
    matchedCount: number,
    closedCount: number
  ): { bayesianRate: number; rawRate: number } {
    const k = Math.max(0, matchedCount || 0);
    const n = Math.max(0, closedCount || 0);

    const rawRate = n > 0 ? Math.min(1, k / n) : 0;
    const bayesianRate = (k + this.PRIOR_ALPHA) / (n + this.PRIOR_ALPHA + this.PRIOR_BETA);

    return {
      bayesianRate: Math.round(bayesianRate * 100) / 100,
      rawRate: Math.round(rawRate * 100) / 100,
    };
  }

  private static resolvePillarStatus(
    score: number,
    thresholds: { excellent: number; good: number; fair: number }
  ): PillarScore["status"] {
    if (score >= thresholds.excellent) return "EXCELLENT";
    if (score >= thresholds.good) return "GOOD";
    if (score >= thresholds.fair) return "FAIR";
    return "WARNING";
  }

  /**
   * Pillar 1: Corporate & Legal Identity Verification (Max 30 Points)
   */
  static evaluateCorporateTrust(
    ownerProfile: HiringIntentEvaluationInput["ownerProfile"]
  ): PillarScore {
    let score = 0;
    const signals: string[] = [];

    if (ownerProfile?.isCompanyVerified) {
      score += 20;
      signals.push("GİB algoritmik VKN / TCKN doğrulaması tamamlanmış");

      if (ownerProfile.companyType === "AS" || ownerProfile.companyType === "LTD") {
        score += 5;
        signals.push(`Tescilli sermaye şirketi (${ownerProfile.companyType})`);
      } else if (ownerProfile.companyType === "SAHIS") {
        score += 3;
        signals.push("Kayıtlı şahıs işletmesi mükellefi");
      } else {
        score += 2;
      }

      if (ownerProfile.websiteUrl && ownerProfile.websiteUrl.startsWith("http")) {
        score += 5;
        signals.push("Doğrulanmış şirket web sitesi");
      }
    } else {
      if (ownerProfile?.emailVerified && ownerProfile?.phoneVerified) {
        score += 14;
        signals.push("Bireysel işveren: E-posta ve telefon doğrulanmış");
      } else if (ownerProfile?.emailVerified || ownerProfile?.phoneVerified) {
        score += 10;
        signals.push("Temel iletişim doğrulaması mevcut");
      } else {
        score += 6;
        signals.push("Doğrulanmamış yeni hesap");
      }
    }

    const clamped = Math.min(30, Math.max(0, score));
    const status = this.resolvePillarStatus(clamped, { excellent: 25, good: 18, fair: 12 });

    return {
      pillar: "CORPORATE_VERIFICATION",
      nameTr: "Kurumsal & Yasal Doğrulama",
      nameEn: "Corporate & Identity Verification",
      score: clamped,
      maxScore: 30,
      weightPercentage: 30,
      status,
      explanationTr: ownerProfile?.isCompanyVerified
        ? `GİB VKN/TCKN onaylı kurumsal mükellef (${ownerProfile.companyName || "Resmi Şirket"}).`
        : "Kurumsal VKN doğrulaması yapılmamış bireysel işveren profili.",
      explanationEn: ownerProfile?.isCompanyVerified
        ? `Official corporate entity verified via Tax ID (${ownerProfile.companyName || "Verified Entity"}).`
        : "Individual client profile without corporate tax ID verification.",
      signals,
    };
  }

  /**
   * Pillar 2: Budget Realism & Market Benchmark Alignment (Max 25 Points)
   */
  static evaluateBenchmarkAlignment(
    budgetMin: number | string | null | undefined,
    budgetMax: number | string | null | undefined,
    budgetMode: string | undefined,
    _currency: string | null | undefined,
    categoryBenchmark: HiringIntentEvaluationInput["categoryBenchmark"]
  ): PillarScore {
    let score = 0;
    const signals: string[] = [];

    const numMin = typeof budgetMin === "string" ? parseFloat(budgetMin) : Number(budgetMin) || 0;
    const numMax = typeof budgetMax === "string" ? parseFloat(budgetMax) : Number(budgetMax) || 0;
    const effectiveBudget = Math.max(numMin, numMax);

    if (categoryBenchmark && categoryBenchmark.hasBenchmark && (categoryBenchmark.min || categoryBenchmark.median)) {
      const bMin = categoryBenchmark.min || categoryBenchmark.median || 0;

      if (effectiveBudget >= bMin) {
        score = 25;
        signals.push("Bütçe kategori piyasa benchmark aralığında veya üzerinde (IQR P25+)");
      } else if (effectiveBudget >= bMin * 0.7) {
        score = 17;
        signals.push("Bütçe piyasa ortalamasının hafif altında ancak makul müzakere edilebilir");
      } else if (effectiveBudget >= bMin * 0.4) {
        score = 10;
        signals.push("Bütçe piyasa standartlarının altında; düşük fiyatlı teklif riski");
      } else if (effectiveBudget > 0) {
        score = 5;
        signals.push("Bütçe kategori piyasa tabanının %40'ından daha düşük (Aşırı düşük bütçe)");
      } else {
        score = 12;
        signals.push("Bütçe aralığı belirtilmemiş");
      }
    } else {
      // Cold-Start Category: No benchmark data yet in this category (< 3 samples).
      // NEVER penalize the employer for the platform's young category data!
      if (effectiveBudget > 0) {
        score = 22;
        signals.push("Kategoride henüz benchmark oluşmadığı için belirtilen somut bütçe geçerli kabul edildi");
      } else if (budgetMode === "OPEN_BID" || budgetMode === "NEGOTIABLE") {
        score = 16;
        signals.push("Açık teklif / esnek bütçe modu");
      } else {
        score = 14;
        signals.push("Bütçe belirtilmemiş");
      }
    }

    const clamped = Math.min(25, Math.max(0, score));
    const status = this.resolvePillarStatus(clamped, { excellent: 22, good: 16, fair: 10 });

    let explanationTr = "Ayrılan bütçe piyasa tabanının altındadır; kapsam daraltılması gerekebilir.";
    if (clamped >= 22) {
      explanationTr = "Ayrılan bütçe piyasa standartlarına ve projenin gereksinimlerine uygundur.";
    } else if (clamped >= 15) {
      explanationTr = "Bütçe piyasa ortalamasına yakın ancak müzakereye açıktır.";
    }

    return {
      pillar: "BUDGET_BENCHMARK",
      nameTr: "Bütçe & Piyasa Benchmark Uyumu",
      nameEn: "Budget & Market Benchmark Realism",
      score: clamped,
      maxScore: 25,
      weightPercentage: 25,
      status,
      explanationTr,
      explanationEn:
        clamped >= 22
          ? "Budget aligns comfortably with category market rates and project scope."
          : "Budget is slightly sub-market; scope adjustment or negotiation expected.",
      signals,
    };
  }

  /**
   * Pillar 3: Scope Clarity & Specification Richness (Max 25 Points)
   */
  static evaluateScopeClarity(input: HiringIntentEvaluationInput): PillarScore {
    let score = 0;
    const signals: string[] = [];

    if (typeof input.clarityScore === "number" && input.clarityScore >= 0) {
      score = Math.round((input.clarityScore / 100) * 25);
      if (input.clarityScore >= 80) {
        signals.push(`Yüksek teknik netlik skoru (%${input.clarityScore})`);
      } else if (input.clarityScore >= 50) {
        signals.push(`Yeterli teknik kapsam (%${input.clarityScore})`);
      } else {
        signals.push(`Geliştirilmesi gereken kapsam (%${input.clarityScore})`);
      }
    } else {
      // Fallback heuristics if clarityScore wasn't precomputed
      const titleLen = (input.title || "").trim().length;
      const summaryLen = (input.summary || "").trim().length;
      const scopeLen = (input.scope || "").trim().length;
      const tagsCount = (input.tags || []).length;
      const answersCount = Object.keys(input.answers || {}).length;

      if (titleLen >= 15) score += 3;
      if (summaryLen >= 40) score += 4;
      if (scopeLen >= 300) {
        score += 10;
        signals.push("Kapsamlı teknik şartname (300+ karakter)");
      } else if (scopeLen >= 120) {
        score += 6;
        signals.push("Orta uzunlukta gereksinim metni");
      } else {
        score += 2;
        signals.push("Kısa ve özet iş tanımı");
      }

      if (tagsCount >= 3) {
        score += 4;
        signals.push(`${tagsCount} adet teknik beceri etiketi`);
      } else if (tagsCount >= 1) {
        score += 2;
      }

      if (answersCount >= 3) {
        score += 4;
        signals.push("Sihirbaz yapılandırılmış soruları yanıtlandı");
      }
    }

    const clamped = Math.min(25, Math.max(0, score));
    const status = this.resolvePillarStatus(clamped, { excellent: 20, good: 15, fair: 10 });

    let explanationTr = "İlan çok kısa veya muğlak ifadeler içerir; piyasa yoklama ihtimali bulunmaktadır.";
    if (clamped >= 20) {
      explanationTr = "İlanın teknik kapsamı, mimari hedefleri ve teslimat beklentileri son derece nettir.";
    } else if (clamped >= 14) {
      explanationTr = "İlan temel gereksinimleri içerir; teklif esnasında teknik detaylar netleştirilebilir.";
    }

    return {
      pillar: "SCOPE_CLARITY",
      nameTr: "Teknik Kapsam & Detay Zenginliği",
      nameEn: "Scope Clarity & Specification Richness",
      score: clamped,
      maxScore: 25,
      weightPercentage: 25,
      status,
      explanationTr,
      explanationEn:
        clamped >= 20
          ? "Exemplary technical specification with unambiguous deliverables and tech stack."
          : "Basic scope defined; further technical alignment recommended upon bidding.",
      signals,
    };
  }

  /**
   * Pillar 4: Historical Hire Rate & Behavioral Reliability (Max 20 Points)
   * Solves Cold-Start: If client is first-time (n = 0), assigns generous calibrated baseline.
   */
  static evaluateHistoricalReliability(
    clientHistory: ClientHistoricalMetrics | null | undefined,
    isCompanyVerified: boolean
  ): PillarScore {
    const isFirstTime =
      !clientHistory || clientHistory.totalListings === 0 || clientHistory.closedListings === 0;

    let score = 0;
    const signals: string[] = [];

    if (isFirstTime) {
      // COLD-START CALIBRATION:
      // A genuine first-time client posting their first job on a new platform
      // must NOT be penalized for lack of history!
      if (isCompanyVerified) {
        score = 18;
        signals.push("Yeni İşveren: VKN onaylı kurumsal hesap (Güvenli Başlangıç)");
      } else {
        score = 14;
        signals.push("Yeni İşveren: Platformdaki ilk ilanı (Nötr Başlangıç)");
      }
    } else {
      const { bayesianRate, rawRate } = this.calculateBayesianHireRate(
        clientHistory.matchedEngagements,
        clientHistory.closedListings
      );

      if (bayesianRate >= 0.8) {
        score = 20;
        signals.push(`Yüksek işe alım başarı oranı (%${Math.round(rawRate * 100)})`);
      } else if (bayesianRate >= 0.6) {
        score = 16;
        signals.push(`Düzenli işe alım geçmişi (Bayesian %${Math.round(bayesianRate * 100)})`);
      } else if (bayesianRate >= 0.4) {
        score = 10;
        signals.push("Orta düzey işe alım tamamlama oranı");
      } else {
        score = 3;
        signals.push("Düşük işe alım geçmişi (Çok sayıda ilanı sonuçsuz kapatmış)");
      }
    }

    const clamped = Math.min(20, Math.max(0, score));
    const status = this.resolvePillarStatus(clamped, { excellent: 18, good: 14, fair: 8 });

    let explanationTr = `Geçmiş ${clientHistory?.closedListings ?? 0} ilanından ${clientHistory?.matchedEngagements ?? 0} tanesini işe alımla sonuçlandırmıştır.`;
    let explanationEn = `Completed ${clientHistory?.matchedEngagements ?? 0} hires across ${clientHistory?.closedListings ?? 0} past closed listings.`;

    if (isFirstTime) {
      explanationTr = isCompanyVerified
        ? "Platformdaki ilk ilanını açan VKN onaylı yeni işveren (Soğuk başlangıç güvenceli)."
        : "Platformdaki ilk ilanını açan yeni işveren.";
      explanationEn = isCompanyVerified
        ? "Verified new employer posting their inaugural job on Operis (Cold-start protected)."
        : "New employer posting their first job.";
    }

    return {
      pillar: "HISTORICAL_RELIABILITY",
      nameTr: "İşe Alım Geçmişi & Güvenilirlik",
      nameEn: "Hiring History & Reliability",
      score: clamped,
      maxScore: 20,
      weightPercentage: 20,
      status,
      explanationTr,
      explanationEn,
      signals,
    };
  }

  /**
   * Evaluates anti-gaming penalties for lowball pricing, duplicate spam, or abandonment.
   */
  static evaluatePenalties(
    input: HiringIntentEvaluationInput,
    history: ClientHistoricalMetrics | null | undefined
  ): HiringIntentPenalty[] {
    const penalties: HiringIntentPenalty[] = [];

    const numMin = typeof input.budgetMin === "string" ? parseFloat(input.budgetMin) : Number(input.budgetMin) || 0;
    const numMax = typeof input.budgetMax === "string" ? parseFloat(input.budgetMax) : Number(input.budgetMax) || 0;
    const effectiveBudget = Math.max(numMin, numMax);

    // 1. Extreme Lowball / Exploitative Budget Penalty
    if (
      input.categoryBenchmark &&
      input.categoryBenchmark.hasBenchmark &&
      input.categoryBenchmark.median &&
      effectiveBudget > 0 &&
      effectiveBudget < input.categoryBenchmark.median * 0.15
    ) {
      penalties.push({
        id: "EXTREME_LOWBALL_BUDGET",
        nameTr: "Aşırı Gerçek Dışı Bütçe Kesintisi",
        nameEn: "Extreme Sub-Market Lowball Penalty",
        pointsDeducted: 15,
        reasonTr: "Belirtilen bütçe kategori medyanının %15'inden düşüktür; piyasa yoklama veya hayalet ilan göstergesidir.",
        reasonEn: "Declared budget is under 15% of market median, strongly indicating price discovery.",
      });
    }

    // 2. Serial Ghost Abandonment (Ignored proposals on past jobs)
    if (history && (history.unreviewedOffersCount || 0) >= 6 && history.matchedEngagements === 0) {
      penalties.push({
        id: "SERIAL_GHOST_ABANDONMENT",
        nameTr: "Teklif İhmali ve Hayalet İlan Geçmişi",
        nameEn: "Serial Proposal Abandonment Penalty",
        pointsDeducted: 20,
        reasonTr: "Önceki ilanlarda gelen teklifler incelenmeden ilanlar sonuçsuz bırakılmıştır.",
        reasonEn: "Past listings had multiple unreviewed proposals left abandoned without hiring.",
      });
    }

    return penalties;
  }

  /**
   * Main evaluation entry point: Computes composite Hiring Intent Index (0 - 100).
   */
  static evaluateHiringIntent(input: HiringIntentEvaluationInput): HiringIntentBreakdown {
    const isCompanyVerified = Boolean(input.ownerProfile?.isCompanyVerified);
    const isFirstTime =
      !input.clientHistory ||
      input.clientHistory.totalListings === 0 ||
      input.clientHistory.closedListings === 0;

    const p1 = this.evaluateCorporateTrust(input.ownerProfile);
    const p2 = this.evaluateBenchmarkAlignment(
      input.budgetMin,
      input.budgetMax,
      input.budgetMode,
      input.budgetCurrency,
      input.categoryBenchmark
    );
    const p3 = this.evaluateScopeClarity(input);
    const p4 = this.evaluateHistoricalReliability(input.clientHistory, isCompanyVerified);

    const penalties = this.evaluatePenalties(input, input.clientHistory);
    const totalPenaltyPoints = penalties.reduce((acc, p) => acc + p.pointsDeducted, 0);

    const rawTotal = p1.score + p2.score + p3.score + p4.score - totalPenaltyPoints;
    const overallScore = Math.min(100, Math.max(0, Math.round(rawTotal)));

    // Determine Level and Badge
    let level: HiringIntentLevel = "ACTIVE_HIRING_LIKELY";
    let badgeLabelTr = `%${overallScore} İşe Alım Niyeti`;
    let badgeLabelEn = `${overallScore}% Hiring Intent`;
    let shortBadgeLabelTr = `%${overallScore} Niyet`;
    let shortBadgeLabelEn = `${overallScore}% Intent`;
    let badgeClass = "bg-sky-500/10 text-sky-400 border-sky-500/30";
    let dotColor = "bg-sky-400";
    let summaryTr = "Bu ilan standart aktif işe alım potansiyeline sahiptir.";
    let summaryEn = "This listing exhibits solid, active hiring potential.";

    if (isFirstTime && isCompanyVerified && overallScore >= 78) {
      level = "VERIFIED_NEW_CLIENT";
      badgeLabelTr = `✨ Yeni İşveren (%${overallScore} Güven)`;
      badgeLabelEn = `✨ Verified New Client (${overallScore}% Trust)`;
      shortBadgeLabelTr = `✨ Yeni İşveren`;
      shortBadgeLabelEn = `✨ New Client`;
      badgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]";
      dotColor = "bg-emerald-400 animate-pulse";
      summaryTr = "Platformda ilk ilanını açan VKN onaylı kurumsal işveren. Yüksek işe alım niyeti ve güvenli başlangıç güvencesi taşır.";
      summaryEn = "Verified corporate client posting their inaugural listing on Operis with high intent and verified credentials.";
    } else if (overallScore >= 85) {
      level = "PROVEN_HIGH_INTENT";
      badgeLabelTr = `🟢 %${overallScore} İşe Alım Niyeti`;
      badgeLabelEn = `🟢 ${overallScore}% High Hiring Intent`;
      shortBadgeLabelTr = `🟢 %${overallScore} Niyet`;
      shortBadgeLabelEn = `🟢 ${overallScore}% Intent`;
      badgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]";
      dotColor = "bg-emerald-400 animate-pulse";
      summaryTr = "İşverenin kurumsal doğrulaması, piyasa bütçesi ve detaylı teknik şartnamesi yüksek işe alım ciddiyeti göstermektedir.";
      summaryEn = "Proven high hiring probability backed by verified corporate identity, realistic budget, and clear deliverables.";
    } else if (overallScore >= 70) {
      level = "ACTIVE_HIRING_LIKELY";
      badgeLabelTr = `🔵 %${overallScore} İşe Alım Bekleniyor`;
      badgeLabelEn = `🔵 ${overallScore}% Hiring Expected`;
      shortBadgeLabelTr = `🔵 %${overallScore} Niyet`;
      shortBadgeLabelEn = `🔵 ${overallScore}% Intent`;
      badgeClass = "bg-sky-500/10 text-sky-400 border-sky-500/30";
      dotColor = "bg-sky-400";
      summaryTr = "İlan yeterli kapsam ve gerçekçi bütçeye sahiptir; işe alımla sonuçlanma olasılığı yüksektir.";
      summaryEn = "Solid listing scope and feasible budget indicate a genuine hiring timeline.";
    } else if (overallScore >= 50) {
      level = "MODERATE_INTENT";
      badgeLabelTr = `🟡 %${overallScore} Orta Düzey Niyet`;
      badgeLabelEn = `🟡 ${overallScore}% Moderate Intent`;
      shortBadgeLabelTr = `🟡 %${overallScore} Niyet`;
      shortBadgeLabelEn = `🟡 ${overallScore}% Intent`;
      badgeClass = "bg-amber-500/10 text-amber-400 border-amber-500/30";
      dotColor = "bg-amber-400";
      summaryTr = "Bütçe veya teknik şartnamede bazı belirsizlikler bulunmaktadır. Teklif verirken kapsamı teyit etmeniz önerilir.";
      summaryEn = "Some ambiguity present in budget or specifications; clarify milestones prior to committing extensive proposal effort.";
    } else {
      level = "PRICE_CHECK_RISK";
      badgeLabelTr = `🟠 %${overallScore} Piyasa Yoklama Riski`;
      badgeLabelEn = `🟠 ${overallScore}% Price Discovery Risk`;
      shortBadgeLabelTr = `🟠 %${overallScore} Riskli`;
      shortBadgeLabelEn = `🟠 ${overallScore}% Risk`;
      badgeClass = "bg-rose-500/10 text-rose-400 border-rose-500/30";
      dotColor = "bg-rose-400";
      summaryTr = "Aşırı düşük bütçe, yetersiz teknik detay veya sonuçsuz ilan geçmişi sebebiyle 'hayalet ilan' riski taşımaktadır.";
      summaryEn = "Elevated risk of price-checking or ghost listing due to sub-market budget or vague specifications.";
    }

    // Freelancer Advice
    let freelancerGuidanceTr = "";
    let freelancerGuidanceEn = "";
    if (level === "PROVEN_HIGH_INTENT" || level === "VERIFIED_NEW_CLIENT") {
      freelancerGuidanceTr = "Bu işveren ciddi ve hazırdır. Detaylı teknik teklif ve mimari çözüm hazırlamak için harcanan zamanın karşılık bulma ihtimali çok yüksektir.";
      freelancerGuidanceEn = "High-priority client with high hiring probability. Investing time in tailored technical proposals is strongly recommended.";
    } else if (level === "ACTIVE_HIRING_LIKELY") {
      freelancerGuidanceTr = "Standart aktif bir ilandır. Portföyünüze uygunsa güvenle teklif verebilirsiniz.";
      freelancerGuidanceEn = "Legitimate active listing. Submitting competitive proposals is recommended.";
    } else {
      freelancerGuidanceTr = "İşverenin niyetini anlamak için uzun mimari dokümanlar hazırlamadan önce kısa ve net bir ön teklifle bütçe/kapsam uyumunu sorgulayın.";
      freelancerGuidanceEn = "Qualify scope and budget via concise preliminary questions before investing extensive unbilled hours in proposal drafting.";
    }

    // Client Tips to increase score
    const clientTipsTr: string[] = [];
    const clientTipsEn: string[] = [];

    if (!isCompanyVerified) {
      clientTipsTr.push("VKN / TCKN kurumsal doğrulaması yaparak güven skorunuzu anında +20 puan yükseltin.");
      clientTipsEn.push("Verify your Corporate Tax ID (VKN) to immediately gain +20 trust points.");
    }
    if (p2.score < 20) {
      clientTipsTr.push("Bütçenizi kategori piyasa benchmark seviyesine çekerek kıdemli uzmanların teklif vermesini sağlayın.");
      clientTipsEn.push("Align budget with category market benchmarks to attract senior engineering talent.");
    }
    if (p3.score < 20) {
      clientTipsTr.push("Teknik teslimatları ve kabul kriterlerini detaylandırarak ilan netlik puanınızı artırın.");
      clientTipsEn.push("Detail technical deliverables and acceptance criteria to boost clarity.");
    }

    return {
      listingId: input.listingId,
      overallScore,
      level,
      isFirstTimeClient: isFirstTime,
      pillars: {
        CORPORATE_VERIFICATION: p1,
        BUDGET_BENCHMARK: p2,
        SCOPE_CLARITY: p3,
        HISTORICAL_RELIABILITY: p4,
      },
      penaltiesApplied: penalties,
      badgeLabelTr,
      badgeLabelEn,
      shortBadgeLabelTr,
      shortBadgeLabelEn,
      badgeClass,
      dotColor,
      summaryTr,
      summaryEn,
      freelancerGuidanceTr,
      freelancerGuidanceEn,
      clientTipsTr,
      clientTipsEn,
    };
  }
}
