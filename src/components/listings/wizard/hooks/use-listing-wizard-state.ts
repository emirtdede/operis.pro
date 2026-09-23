import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { calculateFreelanceTax } from "@/src/modules/finance/tax-calculator";
import type { MarketBenchmarkResult } from "@/src/modules/categories/benchmark-service";
import { AcceptanceEngine } from "@/src/modules/contracts/acceptance-engine";
import type { SynthesizedScopePackage } from "@/src/modules/contracts/acceptance-types";
import { getLocalizedListingPath } from "@/src/lib/i18n/routes";
import type { ListingWizardInput } from "@/src/modules/listings/wizard/schema";
import { getTemplateQuestions } from "@/src/modules/listings/wizard/templates";
import {
  synthesizeScope,
  calculateClarityScore,
  validateCustomNotes,
} from "@/src/modules/listings/wizard/scope-synthesizer";
import {
  CategoryItem,
  SavedDraftItem,
  SavedDraftPayload,
  BLUEPRINT_TEMPLATE_TR,
  BLUEPRINT_TEMPLATE_EN,
  mapBudgetModeToPayload,
} from "../types";

export interface UseListingWizardStateProps {
  categories: CategoryItem[];
  locale: string;
  userId?: string;
}

export function useListingWizardState({
  categories,
  locale,
  userId,
}: UseListingWizardStateProps) {
  const isTr = locale === "tr";
  const router = useRouter();
  const searchParams = useSearchParams();
  const cloneFromId = searchParams.get("cloneFrom");
  const draftsListKey = userId ? `operis_wizard_drafts_${userId}` : "operis_wizard_drafts_guest";
  const draftKey = userId ? `operis_listing_draft_${userId}` : "operis_listing_draft";

  const [draftsList, setDraftsList] = useState<SavedDraftItem[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const isDiscardingRef = useRef(false);

  const [clonedSourceTitle, setClonedSourceTitle] = useState<string | null>(null);
  const [isCloningLoading, setIsCloningLoading] = useState(false);

  // 3-Stage Stepper
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Form State
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [customNotes, setCustomNotes] = useState("");
  const [scopeMode, setScopeMode] = useState<"wizard" | "manual">("wizard");
  const [isScopePreviewOpen, setIsScopePreviewOpen] = useState(false);
  const [notesWarning, setNotesWarning] = useState<string | null>(null);
  const [scope, setScope] = useState("");
  const [summary, setSummary] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [budgetMode, setBudgetMode] = useState("RANGE");
  const [budgetCurrency, setBudgetCurrency] = useState("TRY");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [benchmark, setBenchmark] = useState<MarketBenchmarkResult | null>(null);
  const [isBenchmarkLoading, setIsBenchmarkLoading] = useState(false);
  const [showEmployerTaxBreakdown, setShowEmployerTaxBreakdown] = useState(false);

  const employerTaxPreview = useMemo(() => {
    const rawVal = parseFloat(budgetMax || budgetMin || "0");
    if (!rawVal || isNaN(rawVal) || rawVal <= 0) return null;
    return calculateFreelanceTax({
      amount: rawVal,
      direction: "GROSS_TO_NET",
      clientType: "CORPORATE",
      documentType: "SMM",
      currency: budgetCurrency,
    });
  }, [budgetMin, budgetMax, budgetCurrency]);

  const [timelineMode, setTimelineMode] = useState<string>("DURATION_ESTIMATE");
  const [timelineValue, setTimelineValue] = useState("2");
  const [timelineUnit, setTimelineUnit] = useState("WEEKS");
  const [targetDate, setTargetDate] = useState("");
  const [projectType, setProjectType] = useState<string>("new_build");
  const [projectStage, setProjectStage] = useState<string>("requirements_ready");
  const [workPreference, setWorkPreference] = useState<string>("REMOTE");
  const [preferredLanguage, setPreferredLanguage] = useState<string>("any");

  const [hasDraftNotice, setHasDraftNotice] = useState(false);
  const [draftTitleNotice, setDraftTitleNotice] = useState("");
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isPrdArchitectOpen, setIsPrdArchitectOpen] = useState(false);
  const [isScopeInterviewOpen, setIsScopeInterviewOpen] = useState(false);
  const [acceptedScopePackage, setAcceptedScopePackage] = useState<SynthesizedScopePackage | null>(null);

  // Review Declarations
  const [ackDirectRelationship, setAckDirectRelationship] = useState(false);
  const [ackNoPlatformPayment, setAckNoPlatformPayment] = useState(false);
  const [ackSevenDayExpiry, setAckSevenDayExpiry] = useState(false);
  const [ackProhibitedContent, setAckProhibitedContent] = useState(false);

  // Status State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const detectedArchetype = useMemo(() => {
    if (!title || title.trim().length < 6) return null;
    return AcceptanceEngine.detectArchetype(title, summary, selectedCategory?.slug);
  }, [title, summary, selectedCategory?.slug]);

  const currentQuestions = getTemplateQuestions(
    selectedCategory?.slug,
    selectedCategory?.sectorKey
  );

  // Initialize sensible defaults for any unselected questions
  useEffect(() => {
    setAnswers((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const q of currentQuestions) {
        if (next[q.key] === undefined) {
          if (q.type === "single" && q.options && q.options.length > 0 && q.options[0]) {
            next[q.key] = q.options[0].value;
            changed = true;
          } else if (q.type === "boolean") {
            next[q.key] = true;
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
  }, [currentQuestions]);

  // Keep synthesized scope updated in wizard mode
  useEffect(() => {
    if (scopeMode === "wizard") {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const generated = synthesizeScope({
        title,
        summary,
        categoryName: selectedCategory?.name,
        categorySlug: selectedCategory?.slug,
        sectorKey: selectedCategory?.sectorKey,
        projectType,
        projectStage,
        tags,
        answers,
        customNotes,
        locale,
      });
      setScope(generated);
    }
  }, [
    scopeMode,
    title,
    summary,
    selectedCategory,
    projectType,
    projectStage,
    tagsInput,
    answers,
    customNotes,
    locale,
  ]);

  // Dynamic clarity score
  const clarity = calculateClarityScore(
    {
      title,
      summary,
      tagsInput,
      projectType,
      projectStage,
      answers,
      customNotes,
    },
    currentQuestions,
    locale
  );

  // Real-time Market Rate Benchmark integration (Zero-mock policy)
  useEffect(() => {
    let isMounted = true;
    async function fetchBenchmark() {
      if (!selectedCategory) return;
      setIsBenchmarkLoading(true);
      try {
        const catId = selectedCategory.id || "";
        const slug = selectedCategory.slug || selectedCategory.key || "";
        const res = await fetch(
          `/api/categories/benchmark?categoryId=${encodeURIComponent(catId)}&categorySlug=${encodeURIComponent(slug)}&currency=${encodeURIComponent(budgetCurrency)}&days=30`
        );
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success) {
            setBenchmark(data);
          }
        }
      } catch {
        // Fail-open
      } finally {
        if (isMounted) {
          setIsBenchmarkLoading(false);
        }
      }
    }
    fetchBenchmark();
    return () => {
      isMounted = false;
    };
  }, [selectedCategory?.id, selectedCategory?.slug, selectedCategory?.key, budgetCurrency, selectedCategory]);

  // Pre-fill form from existing listing when cloneFrom query param is present
  useEffect(() => {
    if (!cloneFromId) return;
    let isMounted = true;
    async function loadCloneData() {
      setIsCloningLoading(true);
      try {
        const res = await fetch(`/api/listings/${cloneFromId}/clone-data`, {
          headers: { "x-locale": locale },
        });
        const json = await res.json();
        if (!res.ok || !json.success || !json.data) return;
        if (!isMounted) return;

        const d = json.data;
        setClonedSourceTitle(d.sourceTitle || d.title);
        if (d.categoryId) setCategoryId(d.categoryId);
        if (d.title) setTitle(d.title);
        if (d.summary) setSummary(d.summary);
        if (d.scope) setScope(d.scope);
        if (d.tags && Array.isArray(d.tags)) setTagsInput(d.tags.join(", "));
        if (d.budgetMode) setBudgetMode(d.budgetMode);
        if (d.budgetCurrency) setBudgetCurrency(d.budgetCurrency);
        if (d.budgetMin) setBudgetMin(d.budgetMin);
        if (d.budgetMax) setBudgetMax(d.budgetMax);
        if (d.timelineMode) setTimelineMode(d.timelineMode);
        if (d.timelineValue) setTimelineValue(d.timelineValue);
        if (d.timelineUnit) setTimelineUnit(d.timelineUnit);
        setTargetDate("");
        if (d.projectType) setProjectType(d.projectType);
        if (d.projectStage) setProjectStage(d.projectStage);
        if (d.workPreference) setWorkPreference(d.workPreference);
        if (d.preferredLanguage) setPreferredLanguage(d.preferredLanguage);
        if (d.answers) setAnswers(d.answers);
        if (d.customNotes) setCustomNotes(d.customNotes);
      } catch {
        // Fail-open
      } finally {
        if (isMounted) setIsCloningLoading(false);
      }
    }
    loadCloneData();
    return () => {
      isMounted = false;
    };
  }, [cloneFromId, locale]);

  // LocalStorage Multi-Draft Persistence & Migration
  useEffect(() => {
    try {
      // 1. Load multi-draft list from localStorage
      const listRaw = localStorage.getItem(draftsListKey);
      let list: SavedDraftItem[] = listRaw ? JSON.parse(listRaw) : [];

      // 2. Check legacy single draft key: if exists with user content, migrate to list
      let saved = localStorage.getItem(draftKey);
      if (!saved && !userId) {
        saved = localStorage.getItem("operis_listing_draft");
      }
      if (saved) {
        const d = JSON.parse(saved);
        const hasSubstantialContent = Boolean(
          (d.title && d.title.trim().length >= 3) ||
          (d.summary && d.summary.trim().length >= 10) ||
          (d.scope && d.scope.trim().length >= 10)
        );

        if (hasSubstantialContent) {
          const alreadyExists = list.some(
            (item) => item.data.title === d.title && item.data.summary === d.summary
          );
          if (!alreadyExists) {
            const catName = categories.find((c) => c.id === d.categoryId)?.name;
            const migratedDraft: SavedDraftItem = {
              id: `draft_${d.savedAt || Date.now()}`,
              title: d.title || (isTr ? "Kayıtlı Taslak" : "Saved Draft"),
              summary: d.summary || "",
              categoryId: d.categoryId,
              categoryName: catName,
              step: d.step || 1,
              updatedAt: d.savedAt || Date.now(),
              data: d,
            };
            list = [migratedDraft, ...list];
            try {
              localStorage.setItem(draftsListKey, JSON.stringify(list));
            } catch {
              // Gracefully ignore localStorage quota limit or storage restrictions
            }
          }
        }
      }

      setDraftsList(list);

      // Populate notice if drafts exist
      if (list.length > 0 && list[0]) {
        setDraftTitleNotice(list[0].title);
        setHasDraftNotice(true);
      }
    } catch {
      // fail-open
    }
  }, [draftsListKey, draftKey, userId, categories, isTr]);

  // Safe Autosave: ONLY saves if user has typed meaningful content!
  // Template question defaults by themselves will NEVER auto-save or re-create drafts.
  useEffect(() => {
    if (isDiscardingRef.current) return;

    const hasUserContent =
      (title && title.trim().length >= 3) ||
      (summary && summary.trim().length >= 10) ||
      (scope && scope.trim().length >= 20) ||
      (tagsInput && tagsInput.trim().length > 0);

    if (!hasUserContent) return;

    try {
      const payload = {
        categoryId,
        title,
        summary,
        scope,
        tagsInput,
        budgetMode,
        budgetCurrency,
        budgetMin,
        budgetMax,
        timelineMode,
        timelineValue,
        timelineUnit,
        targetDate,
        projectType,
        projectStage,
        workPreference,
        preferredLanguage,
        answers,
        customNotes,
        scopeMode,
        step,
        savedAt: Date.now(),
      };

      localStorage.setItem(draftKey, JSON.stringify(payload));
      if (!userId) {
        localStorage.setItem("operis_listing_draft", JSON.stringify(payload));
      }

      // If this session is actively editing a known draft in the list, update it
      if (activeDraftId) {
        setDraftsList((prev) => {
          const exists = prev.some((d) => d.id === activeDraftId);
          if (!exists) return prev;
          const updated = prev.map((d) => {
            if (d.id !== activeDraftId) return d;
            return {
              ...d,
              title: title.trim() || d.title,
              summary: summary.trim(),
              categoryId,
              categoryName: categories.find((c) => c.id === categoryId)?.name,
              step,
              updatedAt: Date.now(),
              data: payload,
            };
          });
          try {
            localStorage.setItem(draftsListKey, JSON.stringify(updated));
          } catch {
            // Gracefully ignore localStorage quota limit or storage restrictions
          }
          return updated;
        });
      }
    } catch {
      // ignore
    }
  }, [
    categoryId,
    title,
    summary,
    scope,
    tagsInput,
    budgetMode,
    budgetCurrency,
    budgetMin,
    budgetMax,
    timelineMode,
    timelineValue,
    timelineUnit,
    targetDate,
    projectType,
    projectStage,
    workPreference,
    preferredLanguage,
    answers,
    customNotes,
    scopeMode,
    step,
    draftKey,
    draftsListKey,
    userId,
    activeDraftId,
    categories,
  ]);

  const handleCustomNotesChange = (val: string) => {
    setCustomNotes(val);
    if (val.trim().length > 0) {
      const check = validateCustomNotes(val);
      if (!check.isValid) {
        setNotesWarning(
          check.error ||
            (isTr
              ? "Platform dışı iletişim veya uygunsuz içerik yasaktır."
              : "Off-platform contacts or inappropriate content prohibited.")
        );
      } else {
        setNotesWarning(null);
      }
    } else {
      setNotesWarning(null);
    }
  };

  const handleInsertBlueprintTemplate = () => {
    const template = isTr ? BLUEPRINT_TEMPLATE_TR : BLUEPRINT_TEMPLATE_EN;
    if (!scope.trim()) {
      setScope(template);
    } else {
      setScope((prev) => `${prev.trim()}\n\n${template}`);
    }
  };

  const handleApplyPrdMarkdown = (prdMarkdown: string) => {
    setScope(prdMarkdown);
    setScopeMode("manual");
  };

  const handleApplyScopePackage = (pkg: SynthesizedScopePackage) => {
    setAcceptedScopePackage(pkg);
    setIsScopeInterviewOpen(false);
    setScopeMode("manual");

    const annexText = isTr ? pkg.contractAnnexMarkdownTr : pkg.contractAnnexMarkdownEn;
    setScope((prev) => {
      const cleanPrev = prev
        .replace(/### EK-1: TARAFLARCA KARARLAŞTIRILAN[\s\S]*$/, "")
        .replace(/### ANNEX-1: AGREED OBJECTIVE[\s\S]*$/, "")
        .trim();
      return cleanPrev ? `${cleanPrev}\n\n${annexText}` : annexText;
    });

    setStep(2);
  };

  const handleApplyMarketBudget = (min: number, max: number) => {
    setBudgetMode("RANGE");
    setBudgetMin(min.toString());
    setBudgetMax(max.toString());
  };

  const handleToggleTagSuggestion = (tag: string) => {
    const currentTags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const exists = currentTags.some((t) => t.toLowerCase() === tag.toLowerCase());
    if (exists) {
      const nextTags = currentTags.filter((t) => t.toLowerCase() !== tag.toLowerCase());
      setTagsInput(nextTags.join(", "));
    } else {
      if (currentTags.length >= 10) return;
      const nextTags = [...currentTags, tag];
      setTagsInput(nextTags.join(", "));
    }
  };

  const [draftSavedToast, setDraftSavedToast] = useState(false);

  const handleSaveDraft = () => {
    try {
      const draftId = activeDraftId || `draft_${Date.now()}`;
      const draftTitle = title.trim() || (isTr ? "İsimsiz İlan Taslağı" : "Untitled Draft");
      const draftSummary = summary.trim();

      const draftPayload: SavedDraftPayload = {
        categoryId,
        title,
        summary,
        scope,
        tagsInput,
        budgetMode,
        budgetCurrency,
        budgetMin,
        budgetMax,
        timelineMode,
        timelineValue,
        timelineUnit,
        targetDate,
        projectType,
        projectStage,
        workPreference,
        preferredLanguage,
        answers,
        customNotes,
        scopeMode,
        step,
        savedAt: Date.now(),
      };

      const newDraftItem: SavedDraftItem = {
        id: draftId,
        title: draftTitle,
        summary: draftSummary,
        categoryId,
        categoryName: selectedCategory?.name,
        step,
        updatedAt: Date.now(),
        data: draftPayload,
      };

      setDraftsList((prev) => {
        const filtered = prev.filter((d) => d.id !== draftId);
        const updated = [newDraftItem, ...filtered];
        try {
          localStorage.setItem(draftsListKey, JSON.stringify(updated));
        } catch {
          // Gracefully ignore localStorage quota limit or storage restrictions
        }
        return updated;
      });

      setActiveDraftId(draftId);
      localStorage.setItem(draftKey, JSON.stringify(draftPayload));
      if (!userId) {
        localStorage.setItem("operis_listing_draft", JSON.stringify(draftPayload));
      }

      setHasDraftNotice(false);
      setDraftSavedToast(true);
      setTimeout(() => setDraftSavedToast(false), 2500);
      return true;
    } catch {
      return false;
    }
  };

  const handleLoadDraft = (draftId: string) => {
    try {
      const item = draftsList.find((d) => d.id === draftId);
      if (!item) return;

      const d = item.data;
      if (d.categoryId) setCategoryId(d.categoryId);
      setTitle(d.title || "");
      setSummary(d.summary || "");
      setScope(d.scope || "");
      setTagsInput(d.tagsInput || "");
      if (d.budgetMode) setBudgetMode(d.budgetMode);
      if (d.budgetCurrency) setBudgetCurrency(d.budgetCurrency);
      if (d.budgetMin) setBudgetMin(d.budgetMin);
      if (d.budgetMax) setBudgetMax(d.budgetMax);
      if (d.timelineMode) setTimelineMode(d.timelineMode);
      if (d.timelineValue) setTimelineValue(d.timelineValue);
      if (d.timelineUnit) setTimelineUnit(d.timelineUnit);
      if (d.targetDate) setTargetDate(d.targetDate);
      if (d.projectType) setProjectType(d.projectType);
      if (d.projectStage) setProjectStage(d.projectStage);
      if (d.workPreference) setWorkPreference(d.workPreference);
      if (d.preferredLanguage) setPreferredLanguage(d.preferredLanguage);
      if (d.answers) setAnswers(d.answers);
      if (d.customNotes) setCustomNotes(d.customNotes);
      if (d.scopeMode) setScopeMode(d.scopeMode);
      if (d.step) setStep(d.step);

      setActiveDraftId(item.id);
      setHasDraftNotice(false);
    } catch {
      // ignore
    }
  };

  const handleDeleteDraft = (draftId: string) => {
    try {
      // 1. Remove permanently from draftsList and localStorage
      const updated = draftsList.filter((d) => d.id !== draftId);
      setDraftsList(updated);
      localStorage.setItem(draftsListKey, JSON.stringify(updated));

      // 2. If the deleted draft was the active one currently in the form or list is now empty:
      if (activeDraftId === draftId || updated.length === 0) {
        isDiscardingRef.current = true;
        setActiveDraftId(null);
        localStorage.removeItem(draftKey);
        localStorage.removeItem("operis_listing_draft");
        setTitle("");
        setSummary("");
        setScope("");
        setTagsInput("");
        setAnswers({});
        setCustomNotes("");
        setScopeMode("wizard");
        setStep(1);
        setHasDraftNotice(false);
        setTimeout(() => {
          isDiscardingRef.current = false;
        }, 500);
      }
    } catch {
      // ignore
    }
  };

  const handleStartNewListing = () => {
    try {
      isDiscardingRef.current = true;
      setActiveDraftId(null);
      localStorage.removeItem(draftKey);
      localStorage.removeItem("operis_listing_draft");
      setTitle("");
      setSummary("");
      setScope("");
      setTagsInput("");
      setAnswers({});
      setCustomNotes("");
      setScopeMode("wizard");
      setStep(1);
      setHasDraftNotice(false);
      setTimeout(() => {
        isDiscardingRef.current = false;
      }, 500);
    } catch {
      // ignore
    }
  };

  const handleDiscardDraft = () => {
    if (activeDraftId) {
      handleDeleteDraft(activeDraftId);
    } else if (draftsList.length > 0 && draftsList[0]) {
      handleDeleteDraft(draftsList[0].id);
    } else {
      handleStartNewListing();
    }
  };

  const handleRestoreDraft = () => {
    if (draftsList.length > 0 && draftsList[0]) {
      handleLoadDraft(draftsList[0].id);
    }
    setHasDraftNotice(false);
  };

  const validateStep = (currentStep: number): boolean => {
    setError(null);
    if (currentStep === 1) {
      if (!categoryId) {
        setError(isTr ? "Lütfen bir ilan kategorisi seçin." : "Please select a listing category.");
        return false;
      }
      if (title.trim().length < 20 || title.trim().length > 120) {
        setError(
          isTr
            ? "İlan başlığı en az 20, en fazla 120 karakter olmalıdır."
            : "Title must be between 20 and 120 characters."
        );
        return false;
      }
      if (title === title.toUpperCase() && title.length > 5) {
        setError(
          isTr
            ? "Tamamı büyük harflerden oluşan başlık kullanılamaz (§54 içerik kalite kuralı)."
            : "All-caps titles are not permitted."
        );
        return false;
      }
      if (summary.trim().length < 80 || summary.trim().length > 280) {
        setError(
          isTr
            ? "Kısa özet en az 80, en fazla 280 karakter olmalıdır (şu an: " +
                summary.trim().length +
                " karakter)."
            : "Summary must be between 80 and 280 characters."
        );
        return false;
      }
    } else if (currentStep === 2) {
      if (customNotes.trim().length > 0) {
        const check = validateCustomNotes(customNotes);
        if (!check.isValid) {
          setError(
            check.error ||
              (isTr
                ? "Özel notlar alanında kurallara aykırı veya uygunsuz ifade tespit edildi."
                : "Prohibited content detected in custom notes.")
          );
          return false;
        }
      }
      if (scope.trim().length < 200 || scope.trim().length > 6000) {
        setError(
          isTr
            ? "İlan kapsamı en az 200, en fazla 6000 karakter olmalıdır (şu an: " +
                scope.trim().length +
                " karakter). Lütfen sihirbaz sorularını yanıtlayın."
            : "Listing scope must be between 200 and 6000 characters."
        );
        return false;
      }
    } else if (currentStep === 3) {
      if (budgetMode === "RANGE" && budgetMin && budgetMax) {
        if (parseFloat(budgetMin) > parseFloat(budgetMax)) {
          setError(
            isTr
              ? "Minimum bütçe maksimum bütçeden büyük olamaz."
              : "Minimum budget cannot exceed maximum budget."
          );
          return false;
        }
      }
      if (timelineMode === "SPECIFIC_DATE") {
        if (!targetDate || new Date(targetDate).getTime() <= Date.now()) {
          setError(
            isTr
              ? "Lütfen gelecekte geçerli bir hedef teslim tarihi seçin."
              : "Please select a valid future target delivery date."
          );
          return false;
        }
      }
      if (
        !ackDirectRelationship ||
        !ackNoPlatformPayment ||
        !ackSevenDayExpiry ||
        !ackProhibitedContent
      ) {
        setError(
          isTr
            ? "Yayımlamak için lütfen 4 yasal taahhüt kutucuğunu da onaylayın."
            : "Please accept all 4 declaration checkboxes before publishing."
        );
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, totalSteps));
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const prevStep = () => {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 1));
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePublish = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    setError(null);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .slice(0, 8);

    const mappedBudgetMode = mapBudgetModeToPayload(budgetMode);

    const payload = {
      categoryId,
      title: title.trim(),
      summary: summary.trim(),
      scope: scope.trim(),
      projectType: projectType as ListingWizardInput["projectType"],
      projectStage: projectStage as ListingWizardInput["projectStage"],
      answers: answers || {},
      tags,
      budgetMode: mappedBudgetMode,
      budgetCurrency: mappedBudgetMode !== "NEGOTIABLE" ? budgetCurrency : "TRY",
      budgetMin: budgetMin ? parseFloat(budgetMin) : null,
      budgetMax: budgetMax ? parseFloat(budgetMax) : null,
      timelineMode: timelineMode as ListingWizardInput["timelineMode"],
      targetDate: timelineMode === "SPECIFIC_DATE" && targetDate ? targetDate : null,
      timelineValue:
        timelineMode === "DURATION_ESTIMATE" && timelineValue ? parseInt(timelineValue, 10) : 2,
      timelineUnit: (timelineUnit || "WEEKS") as "DAYS" | "WEEKS" | "MONTHS",
      workPreference: workPreference as ListingWizardInput["workPreference"],
      preferredLanguage: preferredLanguage as ListingWizardInput["preferredLanguage"],
      noSecretsConfirmed: ackNoPlatformPayment,
      acceptableUseConfirmed: ackProhibitedContent,
      expiryAcknowledged: ackSevenDayExpiry,
      matchingRoleAcknowledged: ackDirectRelationship,
    };

    try {
      const res = await fetch("/api/listings/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || (isTr ? "İlan yayınlanamadı." : "Failed to publish listing.")
        );
      }

      try {
        localStorage.removeItem(draftKey);
        localStorage.removeItem("operis_listing_draft");
      } catch {
        // ignore
      }

      router.push(getLocalizedListingPath(data.listing.slug, locale));
    } catch (err: unknown) {
      const defaultErr = isTr
        ? "İlan yayımlanamadı. Lütfen giriş yaptığınızdan emin olun."
        : "Could not publish listing. Please ensure you are logged in.";
      setError(err instanceof Error ? err.message : defaultErr);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isTr,
    clonedSourceTitle,
    setClonedSourceTitle,
    isCloningLoading,
    step,
    setStep,
    totalSteps,
    categoryId,
    setCategoryId,
    selectedCategory,
    title,
    setTitle,
    summary,
    setSummary,
    scope,
    setScope,
    tagsInput,
    setTagsInput,
    budgetMode,
    setBudgetMode,
    budgetCurrency,
    setBudgetCurrency,
    budgetMin,
    setBudgetMin,
    budgetMax,
    setBudgetMax,
    timelineMode,
    setTimelineMode,
    timelineValue,
    setTimelineValue,
    timelineUnit,
    setTimelineUnit,
    targetDate,
    setTargetDate,
    projectType,
    setProjectType,
    projectStage,
    setProjectStage,
    workPreference,
    setWorkPreference,
    preferredLanguage,
    setPreferredLanguage,
    answers,
    setAnswers,
    customNotes,
    setCustomNotes,
    scopeMode,
    setScopeMode,
    isScopePreviewOpen,
    setIsScopePreviewOpen,
    notesWarning,
    benchmark,
    isBenchmarkLoading,
    showEmployerTaxBreakdown,
    setShowEmployerTaxBreakdown,
    employerTaxPreview,
    hasDraftNotice,
    setHasDraftNotice,
    draftTitleNotice,
    isPreviewModalOpen,
    setIsPreviewModalOpen,
    isPrdArchitectOpen,
    setIsPrdArchitectOpen,
    isScopeInterviewOpen,
    setIsScopeInterviewOpen,
    acceptedScopePackage,
    detectedArchetype,
    currentQuestions,
    clarity,
    ackDirectRelationship,
    setAckDirectRelationship,
    ackNoPlatformPayment,
    setAckNoPlatformPayment,
    ackSevenDayExpiry,
    setAckSevenDayExpiry,
    ackProhibitedContent,
    setAckProhibitedContent,
    isSubmitting,
    error,
    setError,
    handleCustomNotesChange,
    handleInsertBlueprintTemplate,
    handleApplyPrdMarkdown,
    handleApplyScopePackage,
    handleApplyMarketBudget,
    handleToggleTagSuggestion,
    handleSaveDraft,
    draftSavedToast,
    handleDiscardDraft,
    draftsList,
    activeDraftId,
    handleLoadDraft,
    handleDeleteDraft,
    handleStartNewListing,
    handleRestoreDraft,
    validateStep,
    nextStep,
    prevStep,
    handlePublish,
  };
}

export type ListingWizardState = ReturnType<typeof useListingWizardState>;
