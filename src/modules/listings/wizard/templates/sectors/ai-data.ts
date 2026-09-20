import type { WizardQuestion } from "../types";

export const aiDataQuestions: WizardQuestion[] = [
  {
    key: "modelStrategy",
    type: "single",
    required: true,
    labelKey: "Model Tercihi & Mimari Yaklaşım",
    labelEn: "Model Strategy & Architecture",
    clarityWeight: 10,
    helpTip: "Kullanılacak model yaklaşımını seçin.",
    helpTipEn: "Select target model approach.",
    options: [
      {
        value: "commercial_llm_api",
        label: "Ticari LLM API (OpenAI GPT-4o, Claude 3.5, Gemini 1.5)",
        labelEn: "Commercial LLM API (GPT-4o, Claude 3.5, Gemini 1.5)",
      },
      {
        value: "open_source_local",
        label: "Açık Kaynak & Yerel Sunucu (Llama 3, Mistral, vLLM)",
        labelEn: "Open Source / Local Host (Llama 3, Mistral, vLLM)",
      },
      {
        value: "rag_knowledge_base",
        label: "RAG & Vektör Veritabanı Kurumsal Bilgi Motoru",
        labelEn: "RAG Pipeline & Enterprise Vector DB",
      },
      {
        value: "custom_fine_tune",
        label: "Özel Veriyle Model Eğitimi (Fine-Tuning)",
        labelEn: "Custom Model Fine-Tuning",
      },
    ],
  },
  {
    key: "dataReadiness",
    type: "single",
    required: true,
    labelKey: "Veri Hazırlığı ve Etiketleme Durumu",
    labelEn: "Data Readiness & Labeling",
    clarityWeight: 10,
    helpTip: "Verinin hazır olup olmadığını belirtin.",
    helpTipEn: "Clarify data availability and pipeline status.",
    options: [
      {
        value: "cleaned_ready",
        label: "Veri Seti Temizlenmiş, Yapılandırılmış ve Hazır",
        labelEn: "Cleaned, Structured & Ready for Ingestion",
      },
      {
        value: "raw_needs_etl",
        label: "Ham Veri Var; Temizleme (ETL) ve Ön İşleme Gerekli",
        labelEn: "Raw Data Exists; ETL & Pre-processing Required",
      },
      {
        value: "no_data_scraping_required",
        label: "Veri Yok; Web Kazıma veya Dış API ile Toplanmalı",
        labelEn: "No Data; Web Scraping or External API Collection",
      },
    ],
  },
  {
    key: "tokenCostOwnership",
    type: "single",
    required: true,
    labelKey: "API Jeton & GPU Bulut Maliyeti",
    labelEn: "API Token & GPU Compute Billing",
    clarityWeight: 10,
    helpTip: "Model kullanım maliyetlerinin nasıl faturalandırılacağını seçin.",
    helpTipEn: "Define API and GPU compute cost allocation.",
    options: [
      {
        value: "client_pays_direct",
        label: "API & GPU Giderleri Doğrudan İşveren Hesabından Karşılanır",
        labelEn: "Client Pays Direct to Cloud / AI Provider",
      },
      {
        value: "included_in_fixed_quote",
        label: "Geliştirme Boyunca Test Maliyeti Proje Bütçesine Dahildir",
        labelEn: "Development Test Tokens Included in Fixed Budget",
      },
    ],
  },
  {
    key: "evaluationMetric",
    type: "single",
    required: true,
    labelKey: "Doğruluk & Kabul Kriteri",
    labelEn: "Evaluation & Acceptance Benchmark",
    clarityWeight: 10,
    helpTip: "Model başarısının nasıl ölçüleceğini belirleyin.",
    helpTipEn: "Specify target performance metric.",
    options: [
      {
        value: "benchmark_accuracy",
        label: "Belirlenen Test Veri Setinde %85+ Doğruluk Metriği",
        labelEn: "85%+ Accuracy on Defined Test Benchmark",
      },
      {
        value: "human_review_loop",
        label: "İnsan Denetimli (Human-in-the-Loop) Kabul Onayı",
        labelEn: "Human-in-the-Loop Qualitative Review",
      },
      {
        value: "functional_poc",
        label: "Uçtan Uca Çalışır Prototip (PoC) ve Demo Yeterlidir",
        labelEn: "Functional End-to-End PoC Demo Sufficient",
      },
    ],
  },
];
