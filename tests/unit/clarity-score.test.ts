import { describe, it, expect } from "vitest";
import { calculateClarityScore } from "@/src/modules/listings/wizard/scope-synthesizer";
import { getTemplateQuestions } from "@/src/modules/listings/wizard/templates";

describe("Clarity Score Algorithm & Guidance Engine", () => {
  const softwareQuestions = getTemplateQuestions("web-development", "sector-software-it");

  it("gives low score (needs_work) for incomplete inputs", () => {
    const result = calculateClarityScore(
      {
        title: "Kısa",
        summary: "Çok kısa özet",
        answers: {},
      },
      softwareQuestions,
      "tr"
    );

    expect(result.score).toBeLessThan(50);
    expect(result.level).toBe("needs_work");
    expect(result.tips.length).toBeGreaterThan(0);
  });

  it("increases score and upgrades level as title, summary, and questions are answered", () => {
    const incomplete = calculateClarityScore(
      {
        title: "Modern Next.js E-Ticaret Uygulaması Geliştirme",
        summary:
          "Yeni e-ticaret platformumuz için Next.js ve Tailwind CSS teknolojileriyle modern arayüz geliştirilecek.",
        answers: {},
      },
      softwareQuestions,
      "tr"
    );

    const complete = calculateClarityScore(
      {
        title: "Modern Next.js E-Ticaret Uygulaması Geliştirme",
        summary:
          "Yeni e-ticaret platformumuz için Next.js ve Tailwind CSS teknolojileriyle modern arayüz geliştirilecek.",
        tagsInput: "Next.js, TypeScript, Tailwind",
        projectType: "new_build",
        projectStage: "requirements_ready",
        answers: {
          projectBasis: "scratch",
          designAssets: "figma_ready",
          deploymentResponsibility: "full_cicd_deployment",
          warrantyScope: "fourteen_days_warranty",
        },
        customNotes: "Adayların en az 2 yıl Next.js tecrübesi olması gerekmektedir.",
        scope: "Uzun detaylı şartname metni...",
      },
      softwareQuestions,
      "tr"
    );

    expect(complete.score).toBeGreaterThan(incomplete.score);
    expect(complete.score).toBeGreaterThanOrEqual(80);
    expect(complete.level).toBe("excellent");
  });

  it("penalizes all-caps spam titles", () => {
    const normal = calculateClarityScore(
      {
        title: "Modern Next.js E-Ticaret Uygulaması Geliştirme",
        summary:
          "Yeni e-ticaret platformumuz için Next.js ve Tailwind CSS teknolojileriyle modern arayüz geliştirilecek.",
        answers: {},
      },
      softwareQuestions,
      "tr"
    );

    const allCaps = calculateClarityScore(
      {
        title: "ACİL NEXT.JS E-TİCARET UYGULAMASI GELİŞTİRİCİSİ ARANIYOR HEMEN",
        summary:
          "Yeni e-ticaret platformumuz için Next.js ve Tailwind CSS teknolojileriyle modern arayüz geliştirilecek.",
        answers: {},
      },
      softwareQuestions,
      "tr"
    );

    expect(normal.score).toBeGreaterThan(allCaps.score);
    expect(allCaps.tips.some((t) => t.includes("büyük harf"))).toBe(true);
  });

  it("clamps score between 0 and 100", () => {
    const emptyResult = calculateClarityScore(
      {
        title: "",
        summary: "",
        answers: {},
      },
      softwareQuestions,
      "tr"
    );
    expect(emptyResult.score).toBeGreaterThanOrEqual(0);

    const superCompleteResult = calculateClarityScore(
      {
        title: "Modern Next.js E-Ticaret Uygulaması Geliştirme",
        summary:
          "Yeni e-ticaret platformumuz için Next.js ve Tailwind CSS teknolojileriyle modern arayüz geliştirilecek.",
        tagsInput: "Next.js, TypeScript, Tailwind, PostgreSQL, Docker",
        projectType: "new_build",
        projectStage: "requirements_ready",
        answers: {
          projectBasis: "scratch",
          designAssets: "figma_ready",
          deploymentResponsibility: "full_cicd_deployment",
          warrantyScope: "thirty_days_warranty",
        },
        customNotes: "Ekstra gereksinimler ve detaylı mimari notlar.",
        scope: "Çok uzun şartname...".repeat(50),
      },
      softwareQuestions,
      "tr"
    );
    expect(superCompleteResult.score).toBeLessThanOrEqual(100);
  });
});
