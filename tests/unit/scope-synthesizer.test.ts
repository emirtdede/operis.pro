import { describe, it, expect } from "vitest";
import {
  synthesizeScope,
  validateCustomNotes,
} from "@/src/modules/listings/wizard/scope-synthesizer";

describe("Scope Synthesizer Engine", () => {
  it("synthesizes a valid 4-part RFP markdown specification for software sector", () => {
    const markdown = synthesizeScope({
      title: "Next.js ve PostgreSQL Tabanlı SaaS Uygulaması Geliştirme",
      summary:
        "Modern bir teknoloji platformu için ölçeklenebilir, güvenli ve performanslı web uygulaması geliştirilmesi işi.",
      categoryName: "Web Geliştirme",
      categorySlug: "web-development",
      sectorKey: "sector-software-it",
      projectType: "new_build",
      projectStage: "requirements_ready",
      tags: ["Next.js", "TypeScript", "Tailwind", "PostgreSQL"],
      answers: {
        projectBasis: "scratch",
        designAssets: "figma_ready",
        deploymentResponsibility: "full_cicd_deployment",
        warrantyScope: "thirty_days_warranty",
      },
      locale: "tr",
    });

    expect(markdown).toContain("### 1. Proje Amacı ve Genel Çerçeve");
    expect(markdown).toContain("### 2. Mevcut Varlıklar ve Başlangıç Koşulları");
    expect(markdown).toContain("### 3. Teslim Edilecek Çıktılar ve Standartlar");
    expect(markdown).toContain("### 4. Kapsam Sınırları, Revizyon ve Garanti Koşulları");

    // Answers correctly converted to human-readable strings
    expect(markdown).toContain("Figma / Tasarım Dosyaları Eksiksiz Hazır");
    expect(markdown).toContain("Canlıya Alma ve CI/CD Kurulumu Uzmana Ait");
    expect(markdown).toContain("Teslim Sonrası 30 Gün Kapsamlı Destek");
    expect(markdown).toContain("Next.js, TypeScript, Tailwind, PostgreSQL");

    // Must comfortably exceed 200 chars
    expect(markdown.trim().length).toBeGreaterThan(300);
  });

  it("synthesizes valid RFP for creative design sector with revision limits", () => {
    const markdown = synthesizeScope({
      title: "Fintech Mobil Uygulaması UI/UX Tasarımı ve Design System",
      summary:
        "Fintech startup'ımız için sıfırdan modern mobil arayüz tasarımı ve Figma bileşen kütüphanesi hazırlanması.",
      categoryName: "UI/UX Tasarım",
      categorySlug: "ui-ux-design",
      sectorKey: "sector-design-creative",
      projectType: "new_build",
      projectStage: "idea",
      tags: ["Figma", "Design System", "Mobile UI"],
      answers: {
        brandAssets: "guidelines_ready",
        conceptOptions: "two_distinct_directions",
        revisionRounds: "two_rounds",
        deliverableFormats: "figma_and_vectors",
      },
      locale: "tr",
    });

    expect(markdown).toContain("### 1. Proje Amacı ve Genel Çerçeve");
    expect(markdown).toContain("Marka Rehberi, Logo ve Renk Paleti Eksiksiz Hazır");
    expect(markdown).toContain("2 Farklı Görsel Yaklaşım ve Tasarım Yönelimi");
    expect(markdown).toContain("2 Tur Kapsamlı Revizyon Dahil");
    expect(markdown).toContain("Düzenlenebilir Figma Dosyası");
    expect(markdown.length).toBeGreaterThan(250);
  });

  it("synthesizes valid RFP in English when locale is 'en'", () => {
    const markdown = synthesizeScope({
      title: "Enterprise LLM RAG Pipeline and Vector Search Implementation",
      summary:
        "Looking for an AI engineer to construct an enterprise RAG pipeline with vector database integration.",
      categoryName: "AI & ML",
      categorySlug: "ai-ml",
      sectorKey: "sector-ai-data",
      projectType: "new_build",
      projectStage: "requirements_ready",
      tags: ["Python", "OpenAI", "LangChain", "Qdrant"],
      answers: {
        modelStrategy: "commercial_llm_api",
        dataReadiness: "cleaned_ready",
        tokenCostOwnership: "client_pays_direct",
        evaluationMetric: "benchmark_accuracy",
      },
      locale: "en",
    });

    expect(markdown).toContain("### 1. Project Objective & Strategic Context");
    expect(markdown).toContain("### 2. Baseline Assets & Technical Environment");
    expect(markdown).toContain("### 3. Target Deliverables & Milestones");
    expect(markdown).toContain("### 4. Scope Boundaries, Revisions & Warranty");
    expect(markdown).toContain("Commercial LLM API (GPT-4o, Claude 3.5, Gemini 1.5)");
    expect(markdown).toContain("Client Pays Direct to Cloud / AI Provider");
  });

  it("appends Part 5 when clean custom notes are provided", () => {
    const markdown = synthesizeScope({
      title: "Next.js Kurumsal Web Sitesi Yenilenmesi",
      summary:
        "Mevcut web sitemizin Next.js ve modern Tailwind arayüzü ile yeniden yazılması işi.",
      categorySlug: "web-development",
      sectorKey: "sector-software-it",
      answers: {},
      customNotes: "Adayların daha önce fintech tecrübesi olması tercih sebebidir.",
      locale: "tr",
    });

    expect(markdown).toContain("### 5. İşverenin Özel Notları ve Ek Detaylar");
    expect(markdown).toContain("Adayların daha önce fintech tecrübesi olması tercih sebebidir.");
  });

  it("validates custom notes against vulgar profanity", () => {
    const result = validateCustomNotes("Bu işi yapacak adam gibi ahmak herifler yazmasın");
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("validates custom notes against contact leakage (phone numbers)", () => {
    const result = validateCustomNotes("Bana hemen 0532 123 45 67 numarasından ulaşabilirsiniz");
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("iletişim");
  });

  it("validates custom notes against contact leakage (emails)", () => {
    const result = validateCustomNotes("Lütfen cv ve portfolyonuzu boss@sirketim.com adresine atın");
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("iletişim");
  });

  it("validates custom notes against contact leakage (messenger invites)", () => {
    const result = validateCustomNotes("Anlaşmak için wa.me/905551234567 adresinden yazın");
    expect(result.isValid).toBe(false);
  });

  it("allows professional custom notes without contact leaks", () => {
    const result = validateCustomNotes(
      "Projeye başlamadan önce GitHub profilinizi ve benzer çalışmalarınızı incelemek isteriz."
    );
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});
