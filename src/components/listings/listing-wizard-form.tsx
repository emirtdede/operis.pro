"use client";

import {
  FolderTree,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Loader2,
} from "lucide-react";
import { Button } from "../ui/button";
import { DraftRecoveryBar } from "../ui/draft-recovery-bar";
import {
  useListingWizardState,
  StepBasicInfo,
  StepScopeSkills,
  StepBudgetReview,
  WizardModals,
  getStepButtonClass,
} from "./wizard";
import type { CategoryItem, ListingWizardFormProps } from "./wizard";

export type { CategoryItem, ListingWizardFormProps };

export function ListingWizardForm({ categories, locale, userId }: ListingWizardFormProps) {
  const state = useListingWizardState({ categories, locale, userId });

  const stageTitles = [
    {
      step: 1,
      title: state.isTr ? "İlan Tanımı & Kategori" : "Listing Info & Category",
      desc: state.isTr ? "Kategori, başlık ve kısa özet" : "Category, title & summary",
      icon: FolderTree,
    },
    {
      step: 2,
      title: state.isTr ? "Teknik Kapsam & Yetkinlikler" : "Technical Scope & Skills",
      desc: state.isTr ? "Gereksinimler ve teknoloji etiketleri" : "Deliverables & technology tags",
      icon: FileText,
    },
    {
      step: 3,
      title: state.isTr ? "Bütçe, Süreç & Yasal Onay" : "Budget, Timeline & Review",
      desc: state.isTr ? "Tahmini bütçe ve yasal güvenceler" : "Budget, timeline & guarantees",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="relative overflow-hidden mx-auto max-w-3xl rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 backdrop-blur-xl p-6 sm:p-10 shadow-2xl">
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

        {/* Draft Recovery Bar */}
        <DraftRecoveryBar
          isOpen={state.hasDraftNotice && !state.clonedSourceTitle}
          draftTitle={state.draftTitleNotice}
          locale={locale}
          onRestore={() => state.setHasDraftNotice(false)}
          onDiscard={state.handleDiscardDraft}
          onDismiss={() => state.setHasDraftNotice(false)}
        />

        {/* 3-Stage Visual Stepper Header */}
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
            {stageTitles.map((st) => {
              const Icon = st.icon;
              const isActive = state.step === st.step;
              const isDone = state.step > st.step;
              return (
                <button
                  key={st.step}
                  type="button"
                  onClick={() => {
                    if (isDone) state.setStep(st.step);
                  }}
                  disabled={!isDone && !isActive}
                  className={`flex flex-col items-start p-2 sm:p-3.5 rounded-xl sm:rounded-2xl border text-left transition-all ${getStepButtonClass(
                    isActive,
                    isDone
                  )}`}
                >
                  <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-bold mb-0.5 sm:mb-1">
                    {isDone ? (
                      <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                    )}
                    <span className="truncate">{state.isTr ? `${st.step}. Aşama` : `Stage ${st.step}`}</span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-semibold text-[var(--color-text-primary)] truncate w-full">
                    {st.title}
                  </div>
                </button>
              );
            })}
          </div>

          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]"
            role="progressbar"
            aria-valuenow={state.step}
            aria-valuemin={1}
            aria-valuemax={state.totalSteps}
          >
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-300"
              style={{ width: `${(state.step / state.totalSteps) * 100}%` }}
            />
          </div>
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
        <div className="flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-6">
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
  );
}
