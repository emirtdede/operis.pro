import { Dialog } from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { ListingCard } from "@/src/components/listings/listing-card";
import { AiPrdArchitectCard } from "@/src/components/listings/ai-prd-architect-card";
import { ScopeInterviewModal } from "@/src/components/contracts/acceptance/scope-interview-modal";
import type { SynthesizedScopePackage } from "@/src/modules/contracts/acceptance-types";
import type { CategoryItem } from "../types";

export interface WizardModalsProps {
  isTr: boolean;
  locale: string;
  isPreviewModalOpen: boolean;
  setIsPreviewModalOpen: (isOpen: boolean) => void;
  isPrdArchitectOpen: boolean;
  setIsPrdArchitectOpen: (isOpen: boolean) => void;
  isScopeInterviewOpen: boolean;
  setIsScopeInterviewOpen: (isOpen: boolean) => void;
  title: string;
  summary: string;
  selectedCategory?: CategoryItem;
  budgetMode: string;
  budgetCurrency: string;
  budgetMin: string;
  budgetMax: string;
  timelineMode: string;
  targetDate: string;
  timelineValue: string;
  timelineUnit: string;
  tagsInput: string;
  handleApplyPrdMarkdown: (prdMarkdown: string) => void;
  handleApplyMarketBudget: (min: number, max: number) => void;
  handleApplyScopePackage: (pkg: SynthesizedScopePackage) => void;
  setStep: (step: number) => void;
}

export function WizardModals({
  isTr,
  locale,
  isPreviewModalOpen,
  setIsPreviewModalOpen,
  isPrdArchitectOpen,
  setIsPrdArchitectOpen,
  isScopeInterviewOpen,
  setIsScopeInterviewOpen,
  title,
  summary,
  selectedCategory,
  budgetMode,
  budgetCurrency,
  budgetMin,
  budgetMax,
  timelineMode,
  targetDate,
  timelineValue,
  timelineUnit,
  tagsInput,
  handleApplyPrdMarkdown,
  handleApplyMarketBudget,
  handleApplyScopePackage,
  setStep,
}: WizardModalsProps) {
  const parsedTimelineValue = timelineValue ? parseInt(timelineValue, 10) : 2;
  const tagsList = tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const fallbackTitle = isTr ? "Örnek İlan Başlığı (En Az 20 Karakter)" : "Sample Listing Title";
  const fallbackSummary = isTr
    ? "Bu ilan için belirtilen kısa özet bilgisi burada yer alacaktır. Serbest çalışanlar ilanınızın detaylarına karar vermeden önce ilk olarak bu özeti okuyacaklardır."
    : "Short summary of the listing will appear here for freelancers to evaluate.";
  const fallbackCategory = isTr ? "Web Geliştirme" : "Web Development";
  const ownerLabel = isTr ? "İlan Sahibi (Siz)" : "Listing Owner (You)";
  const interviewLocale = locale === "en" ? "en" : "tr";

  return (
    <>
      {/* Live Feed Card Preview Modal */}
      <Dialog
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title={isTr ? "İlan Canlı Akış Önizlemesi" : "Live Feed Card Preview"}
        description={
          isTr
            ? "İlanınız onaylandıktan sonra pazar yeri akışında ve arama sonuçlarında tam olarak bu şekilde görüntülenecektir."
            : "This is exactly how your project will appear in the marketplace feed and search results."
        }
        className="max-w-2xl"
      >
        <div className="py-2 pointer-events-none select-none">
          <ListingCard
            id="preview-demo-id"
            slug="onizleme-ilani"
            title={title.trim() || fallbackTitle}
            summary={summary.trim() || fallbackSummary}
            categoryName={selectedCategory?.name || fallbackCategory}
            budgetMode={budgetMode}
            budgetCurrency={budgetCurrency}
            budgetMin={budgetMin || null}
            budgetMax={budgetMax || null}
            timelineMode={timelineMode}
            targetDate={targetDate || null}
            timelineValue={parsedTimelineValue}
            timelineUnit={timelineUnit}
            ownerHandle="is-sahibi"
            ownerDisplayName={ownerLabel}
            firstPublishedAt={new Date()}
            lastActivatedAt={new Date()}
            activeUntil={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)}
            activationSeq={1}
            locale={locale}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="button" variant="secondary" onClick={() => setIsPreviewModalOpen(false)}>
            {isTr ? "Kapat" : "Close"}
          </Button>
        </div>
      </Dialog>

      {/* Operis AI PRD & Scope Architect Dialog */}
      <Dialog
        isOpen={isPrdArchitectOpen}
        onClose={() => setIsPrdArchitectOpen(false)}
        title=""
        className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-0 bg-transparent shadow-none"
      >
        <AiPrdArchitectCard
          title={title}
          summary={summary}
          categorySlug={selectedCategory?.slug}
          tags={tagsList}
          locale={locale}
          onApplyPrdMarkdown={(prd: string) => {
            handleApplyPrdMarkdown(prd);
            setIsPrdArchitectOpen(false);
            setStep(2);
          }}
          onApplyMarketBudget={(min: number, max: number) => {
            handleApplyMarketBudget(min, max);
          }}
          onClose={() => setIsPrdArchitectOpen(false)}
        />
      </Dialog>

      {/* Operis Intelligent Scope & Acceptance Criteria Dialog */}
      <ScopeInterviewModal
        isOpen={isScopeInterviewOpen}
        onClose={() => setIsScopeInterviewOpen(false)}
        title={title}
        summary={summary}
        categorySlug={selectedCategory?.slug}
        tags={tagsList}
        locale={interviewLocale}
        onApplyPackage={handleApplyScopePackage}
      />
    </>
  );
}
