import { describe, it, expect } from "vitest";
import { SemanticVectorMatcher } from "@/src/modules/engagements/scope-sentinel/semantic-vector-matcher";

describe("SemanticVectorMatcher (Trigram TF-IDF Vector Engine)", () => {
  it("extracts character trigrams with word boundary anchors", () => {
    const trigrams = SemanticVectorMatcher.extractTrigrams("pos");
    expect(trigrams).toContain("^po");
    expect(trigrams).toContain("pos");
    expect(trigrams).toContain("os$");
  });

  it("builds L2-normalized unit vectors where dot product with itself is 1.0", () => {
    const text = "kredi kartı ödeme altyapısı";
    const vec = SemanticVectorMatcher.buildUnitVector(text);
    const selfSim = SemanticVectorMatcher.cosineSimilarity(vec, vec);
    expect(selfSim).toBeCloseTo(1.0, 4);
  });

  it("yields high cosine similarity for morphological variations and synonyms", () => {
    const vecTarget = SemanticVectorMatcher.buildUnitVector("kredi kartı sanal pos tahsilat çekim");
    // Notice inflected Turkish form "kartından", "çekimler", "posumuz"
    const vecCandidate = SemanticVectorMatcher.buildUnitVector(
      "müşterilerin kartından çekimler yapacak posumuz olsun"
    );
    const sim = SemanticVectorMatcher.cosineSimilarity(vecTarget, vecCandidate);
    expect(sim).toBeGreaterThan(0.25);
  });

  it("yields near-zero cosine similarity for unrelated domains", () => {
    const vecPayment = SemanticVectorMatcher.buildUnitVector(
      "kredi kartı ödeme sanal pos checkout"
    );
    const vecDesign = SemanticVectorMatcher.buildUnitVector(
      "butonun rengini mavi yapıp fontu büyütelim"
    );
    const sim = SemanticVectorMatcher.cosineSimilarity(vecPayment, vecDesign);
    expect(sim).toBeLessThan(0.1);
  });

  it("identifies out-of-scope semantic payment capabilities even without exact keyword matches", () => {
    const candidateText = "müşterilerin kartından çekim yapabileceğimiz tahsilat altyapısı kuralım";
    const baselineCorpus = "tanıtım sayfası hakkımızda vizyon misyon ve iletişim formu";

    const matches = SemanticVectorMatcher.match(candidateText, baselineCorpus, 0.22);
    expect(matches.length).toBeGreaterThanOrEqual(1);

    const paymentMatch = matches.find((m) => m.capabilityKey === "PAYMENT_GATEWAY");
    expect(paymentMatch).toBeDefined();
    expect(paymentMatch?.coveredInBaseline).toBe(false);
    expect(paymentMatch?.similarity).toBeGreaterThan(0.22);
  });

  it("marks capabilities as covered if baseline already contains semantic matches", () => {
    const candidateText = "müşterilerin kartından tahsilat provizyonu alalım";
    const baselineCorpus =
      "e-ticaret sitesi sanal pos checkout kredi kartı ödeme tahsilat altyapısı";

    const matches = SemanticVectorMatcher.match(candidateText, baselineCorpus, 0.22);
    const paymentMatch = matches.find((m) => m.capabilityKey === "PAYMENT_GATEWAY");
    expect(paymentMatch).toBeDefined();
    expect(paymentMatch?.coveredInBaseline).toBe(true);
  });
});
