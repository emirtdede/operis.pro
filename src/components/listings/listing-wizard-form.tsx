"use client";

import { Copy, Loader2, Bookmark, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/button";
import {
  useListingWizardState,
  StepBasicInfo,
  StepScopeSkills,
  StepBudgetReview,
  WizardModals,
  WizardStepperSidebar,
} from "./wizard";
import type { CategoryItem, ListingWizardFormProps } from "./wizard";

export type { CategoryItem, ListingWizardFormProps };

const STEP_SUBTITLES: Record<number, { tr: string; en: string }> = {
  1: { tr: "Temel Proje Tanımı", en: "Basic Project Info" },
  2: { tr: "Teknik Kapsam ve İhtiyaçlar", en: "Technical Scope & Specs" },
  3: { tr: "Bütçe ve Yasal Bildirimler", en: "Budget & Declarations" },
};

export function ListingWizardForm({ categories, locale, userId }: ListingWizardFormProps) {
  const state = useListingWizardState({ categories, locale, userId });

  const getStep1ValidationStatus = () => {
    if (!state.categoryId) {
      return state.isTr ? "Önce kategori seçiniz" : "Select category";
    }
    const titleLen = state.title.trim().length;
    if (titleLen < 20) {
      return state.isTr
        ? `Başlık min. 20 krk (${titleLen}/20)`
        : `Title min. 20 chars (${titleLen}/20)`;
    }
    const summaryLen = state.summary.trim().length;
    if (summaryLen < 80) {
      return state.isTr
        ? `Özet min. 80 krk (${summaryLen}/80)`
        : `Summary min. 80 chars (${summaryLen}/80)`;
    }
    return state.isTr ? "Kurallara uygun" : "Valid";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
      {/* LEFT COLUMN: Sticky Stepper & Dynamic Guidance Rail (lg: 4 cols) */}
      <div className="lg:col-span-4 xl:col-span-4 w-full">
        <WizardStepperSidebar
          step={state.step}
          setStep={state.setStep}
          totalSteps={state.totalSteps}
          isTr={state.isTr}
          hasDraftNotice={state.hasDraftNotice && !state.clonedSourceTitle}
          draftTitleNotice={state.draftTitleNotice}
          currentTitle={state.title}
          categoryName={state.selectedCategory?.name}
          onRestoreDraft={state.handleRestoreDraft}
          onDiscardDraft={state.handleDiscardDraft}
          draftsList={state.draftsList}
          activeDraftId={state.activeDraftId}
          onSaveDraft={state.handleSaveDraft}
          onLoadDraft={state.handleLoadDraft}
          onDeleteDraft={state.handleDeleteDraft}
          onStartNewListing={state.handleStartNewListing}
        />
      </div>

      {/* RIGHT/CENTER COLUMN: Main Form Canvas (lg: 8 cols) */}
      <div className="lg:col-span-8 xl:col-span-8 w-full min-w-0">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-6 sm:p-10 shadow-2xl space-y-8">
          {/* Background ambient glows */}
          <div
            className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative z-10 space-y-8">
            {/* Cloned Listing Banner */}
            {state.clonedSourceTitle && (
              <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-transparent p-4 flex items-center justify-between gap-3 shadow-lg shadow-cyan-500/5 animate-in fade-in duration-300">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                    <Copy className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                        {state.isTr ? "İlan Klonlandı & Düzenlemeye Hazır" : "Listing Cloned & Ready to Post"}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-medium">
                        {state.isTr ? "Hızlı Yeniden Yayınlama" : "Quick Re-post"}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                      {state.isTr
                        ? `"${state.clonedSourceTitle}" ilanınız referans alınarak tüm alanlar dolduruldu. Detayları inceleyip saniyeler içinde yayına alabilirsiniz.`
                        : `Pre-filled from your previous listing "${state.clonedSourceTitle}". Review or update details and post in seconds.`}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => state.setClonedSourceTitle(null)}
                  className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] shrink-0 cursor-pointer"
                >
                  ✕
                </Button>
              </div>
            )}

            {state.isCloningLoading && (
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-center gap-3 text-xs text-blue-300 animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin text-blue-400 shrink-0" />
                <span>
                  {state.isTr
                    ? "Önceki ilanınızın verileri yükleniyor..."
                    : "Loading clone data from previous listing..."}
                </span>
              </div>
            )}


            {/* Focused Step Banner Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-border-subtle)] pb-5 gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="inline-flex items-center text-[11px] font-mono font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                    {state.isTr ? `${state.step}. Aşama / ${state.totalSteps}` : `Stage ${state.step} of ${state.totalSteps}`}
                  </span>
                  <span className="text-xs text-[var(--color-text-tertiary)]">
                    {STEP_SUBTITLES[state.step]?.[state.isTr ? "tr" : "en"] || ""}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
                  {state.step === 1 && (state.isTr ? "İlan Tanımı & Kategori Seçimi" : "Listing Info & Category")}
                  {state.step === 2 && (state.isTr ? "Teknik Kapsam & Yetkinlikler" : "Technical Scope & Skills")}
                  {state.step === 3 && (state.isTr ? "Bütçe, Süreç & Yasal Onay" : "Budget, Timeline & Review")}
                </h2>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
                  {state.step === 1 && (state.isTr ? "Projenize uygun kategoriyi belirleyin ve net bir başlık yazarak başlayın." : "Select the best category and define a clear title for your project.")}
                  {state.step === 2 && (state.isTr ? "İhtiyaç duyulan teknolojileri, teslim edilecek çıktıları ve proje kapsamını netleştirin." : "Define required tech stacks, deliverable milestones, and specifications.")}
                  {state.step === 3 && (state.isTr ? "Tahmini bütçe aralığınızı, teslim sürenizi belirleyin ve yasal beyanları onaylayın." : "Set estimated budget, delivery timeline, and confirm platform terms.")}
                </p>
              </div>

              {/* Quick Save Draft Button in Step Header */}
              <button
                type="button"
                onClick={state.handleSaveDraft}
                className={`self-start sm:self-center shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all duration-200 cursor-pointer ${
                  state.draftSavedToast
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-semibold"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/50 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-blue-500/40 hover:bg-blue-500/5"
                }`}
              >
                {state.draftSavedToast ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{state.isTr ? "Taslak Kaydedildi!" : "Draft Saved!"}</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="h-3.5 w-3.5 text-blue-400" />
                    <span>{state.isTr ? "Taslağı Kaydet" : "Save Draft"}</span>
                  </>
                )}
              </button>
            </div>

            {state.error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-medium text-red-400 animate-in fade-in duration-200">
                {state.error}
              </div>
            )}

            {/* STAGE 1: Project Info & Category */}
            {state.step === 1 && (
              <StepBasicInfo
                isTr={state.isTr}
                categoryId={state.categoryId}
                setCategoryId={state.setCategoryId}
                categories={categories}
                selectedCategory={state.selectedCategory}
                title={state.title}
                setTitle={state.setTitle}
                summary={state.summary}
                setSummary={state.setSummary}
                detectedArchetype={state.detectedArchetype}
                setIsScopeInterviewOpen={state.setIsScopeInterviewOpen}
                setIsPrdArchitectOpen={state.setIsPrdArchitectOpen}
              />
            )}

            {/* STAGE 2: Technical Scope & Skills */}
            {state.step === 2 && (
              <StepScopeSkills
                isTr={state.isTr}
                acceptedScopePackage={state.acceptedScopePackage}
                setIsScopeInterviewOpen={state.setIsScopeInterviewOpen}
                clarity={state.clarity}
                selectedCategory={state.selectedCategory}
                currentQuestions={state.currentQuestions}
                answers={state.answers}
                setAnswers={state.setAnswers}
                customNotes={state.customNotes}
                handleCustomNotesChange={state.handleCustomNotesChange}
                notesWarning={state.notesWarning}
                scope={state.scope}
                setScope={state.setScope}
                setIsPrdArchitectOpen={state.setIsPrdArchitectOpen}
                isScopePreviewOpen={state.isScopePreviewOpen}
                setIsScopePreviewOpen={state.setIsScopePreviewOpen}
                scopeMode={state.scopeMode}
                setScopeMode={state.setScopeMode}
                handleInsertBlueprintTemplate={state.handleInsertBlueprintTemplate}
                tagsInput={state.tagsInput}
                setTagsInput={state.setTagsInput}
                handleToggleTagSuggestion={state.handleToggleTagSuggestion}
                projectType={state.projectType}
                setProjectType={state.setProjectType}
                projectStage={state.projectStage}
                setProjectStage={state.setProjectStage}
                workPreference={state.workPreference}
                setWorkPreference={state.setWorkPreference}
                preferredLanguage={state.preferredLanguage}
                setPreferredLanguage={state.setPreferredLanguage}
              />
            )}

            {/* STAGE 3: Budget, Timeline & Declarations */}
            {state.step === 3 && (
              <StepBudgetReview
                isTr={state.isTr}
                benchmark={state.benchmark}
                isBenchmarkLoading={state.isBenchmarkLoading}
                budgetMode={state.budgetMode}
                setBudgetMode={state.setBudgetMode}
                budgetCurrency={state.budgetCurrency}
                setBudgetCurrency={state.setBudgetCurrency}
                budgetMin={state.budgetMin}
                setBudgetMin={state.setBudgetMin}
                budgetMax={state.budgetMax}
                setBudgetMax={state.setBudgetMax}
                showEmployerTaxBreakdown={state.showEmployerTaxBreakdown}
                setShowEmployerTaxBreakdown={state.setShowEmployerTaxBreakdown}
                employerTaxPreview={state.employerTaxPreview}
                timelineMode={state.timelineMode}
                setTimelineMode={state.setTimelineMode}
                timelineValue={state.timelineValue}
                setTimelineValue={state.setTimelineValue}
                timelineUnit={state.timelineUnit}
                setTimelineUnit={state.setTimelineUnit}
                targetDate={state.targetDate}
                setTargetDate={state.setTargetDate}
                title={state.title}
                summary={state.summary}
                setIsPreviewModalOpen={state.setIsPreviewModalOpen}
                ackDirectRelationship={state.ackDirectRelationship}
                setAckDirectRelationship={state.setAckDirectRelationship}
                ackNoPlatformPayment={state.ackNoPlatformPayment}
                setAckNoPlatformPayment={state.setAckNoPlatformPayment}
                ackSevenDayExpiry={state.ackSevenDayExpiry}
                setAckSevenDayExpiry={state.setAckSevenDayExpiry}
                ackProhibitedContent={state.ackProhibitedContent}
                setAckProhibitedContent={state.setAckProhibitedContent}
              />
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-t border-[var(--color-border-subtle)] pt-6 gap-3">
              <div className="flex items-center gap-2">
                {state.step > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={state.prevStep}
                    disabled={state.isSubmitting}
                  >
                    {state.isTr ? "← Önceki Aşama" : "← Previous"}
                  </Button>
                ) : (
                  <div />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5 justify-end">
                {/* Step 1 Requirement Guidance Indicator */}
                {state.step === 1 && (
                  <div
                    className={`hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded-xl border transition-all ${
                      state.categoryId &&
                      state.title.trim().length >= 20 &&
                      state.title.trim().length <= 120 &&
                      state.summary.trim().length >= 80 &&
                      state.summary.trim().length <= 280
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold"
                        : "bg-white/[0.04] text-[var(--color-text-tertiary)] border-[var(--color-border-subtle)]"
                    }`}
                  >
                    {state.categoryId &&
                    state.title.trim().length >= 20 &&
                    state.title.trim().length <= 120 &&
                    state.summary.trim().length >= 80 &&
                    state.summary.trim().length <= 280 ? (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{state.isTr ? "1. Aşama Tamamlandı" : "Stage 1 Ready"}</span>
                      </>
                    ) : (
                      <span>{getStep1ValidationStatus()}</span>
                    )}
                  </div>
                )}

                {/* Save Draft Button (every step) */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={state.handleSaveDraft}
                  className={`transition-all duration-200 cursor-pointer ${
                    state.draftSavedToast
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-medium"
                      : "border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-blue-500/40"
                  }`}
                >
                  {state.draftSavedToast ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{state.isTr ? "Taslak Kaydedildi!" : "Draft Saved!"}</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-3.5 w-3.5 text-blue-400" />
                      <span>{state.isTr ? "Taslağı Kaydet" : "Save Draft"}</span>
                    </>
                  )}
                </Button>

                {state.step < state.totalSteps ? (
                  <Button type="button" variant="primary" onClick={state.nextStep}>
                    {state.isTr ? "Sonraki Aşama →" : "Next Stage →"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={state.handlePublish}
                    isLoading={state.isSubmitting}
                  >
                    {state.isTr ? "İlanı Ücretsiz Yayımla" : "Publish Listing for Free"}
                  </Button>
                )}
              </div>
            </div>

            {/* Modal Dialogs */}
            <WizardModals
              isTr={state.isTr}
              locale={locale}
              isPreviewModalOpen={state.isPreviewModalOpen}
              setIsPreviewModalOpen={state.setIsPreviewModalOpen}
              isPrdArchitectOpen={state.isPrdArchitectOpen}
              setIsPrdArchitectOpen={state.setIsPrdArchitectOpen}
              isScopeInterviewOpen={state.isScopeInterviewOpen}
              setIsScopeInterviewOpen={state.setIsScopeInterviewOpen}
              title={state.title}
              summary={state.summary}
              selectedCategory={state.selectedCategory}
              budgetMode={state.budgetMode}
              budgetCurrency={state.budgetCurrency}
              budgetMin={state.budgetMin}
              budgetMax={state.budgetMax}
              timelineMode={state.timelineMode}
              targetDate={state.targetDate}
              timelineValue={state.timelineValue}
              timelineUnit={state.timelineUnit}
              tagsInput={state.tagsInput}
              handleApplyPrdMarkdown={state.handleApplyPrdMarkdown}
              handleApplyMarketBudget={state.handleApplyMarketBudget}
              handleApplyScopePackage={state.handleApplyScopePackage}
              setStep={state.setStep}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

