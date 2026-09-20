import type { Dispatch, SetStateAction } from "react";
import { QuickOfferDrawer } from "@/src/components/offers/quick-offer-drawer";
import {
  SubmitOfferModal,
  type SubmitOfferModalProps,
} from "@/src/components/offers/submit-offer-modal";
import { BatchSelectionBar } from "@/src/components/offers/batch-selection-bar";
import {
  BatchOfferWizardModal,
  BatchListingTarget,
} from "@/src/components/offers/batch-offer-wizard-modal";
import type { QuickOfferTarget, FullModalListing } from "./types";

export interface ListingsModalsProps {
  locale: string;
  quickOfferTarget: QuickOfferTarget | null;
  setQuickOfferTarget: (target: QuickOfferTarget | null) => void;
  fullModalListing: FullModalListing | null;
  setFullModalListing: (listing: FullModalListing | null) => void;
  fullModalInitialData: SubmitOfferModalProps["initialData"];
  setFullModalInitialData: (data: SubmitOfferModalProps["initialData"]) => void;
  selectedIds: Set<string>;
  setSelectedIds: Dispatch<SetStateAction<Set<string>>>;
  isBatchOpen: boolean;
  setIsBatchOpen: (isOpen: boolean) => void;
  batchTargets: BatchListingTarget[];
}

export function ListingsModals({
  locale,
  quickOfferTarget,
  setQuickOfferTarget,
  fullModalListing,
  setFullModalListing,
  fullModalInitialData,
  setFullModalInitialData,
  selectedIds,
  setSelectedIds,
  isBatchOpen,
  setIsBatchOpen,
  batchTargets,
}: ListingsModalsProps) {
  return (
    <>
      {quickOfferTarget && (
        <QuickOfferDrawer
          isOpen={Boolean(quickOfferTarget)}
          onClose={() => setQuickOfferTarget(null)}
          listing={quickOfferTarget}
          locale={locale}
          onOpenFullModal={(initialData) => {
            const current = quickOfferTarget;
            setQuickOfferTarget(null);
            setFullModalListing(current);
            setFullModalInitialData(initialData);
          }}
          onSuccess={() => {
            setQuickOfferTarget(null);
          }}
        />
      )}

      {fullModalListing && (
        <SubmitOfferModal
          isOpen={Boolean(fullModalListing)}
          onClose={() => {
            setFullModalListing(null);
            setFullModalInitialData(undefined);
          }}
          listingId={fullModalListing.id}
          listingTitle={fullModalListing.title}
          locale={locale}
          initialData={fullModalInitialData}
          onSuccess={() => {
            setFullModalListing(null);
            setFullModalInitialData(undefined);
          }}
        />
      )}

      {/* Batch Selection Sticky Bar (in Catalog view when items are selected) */}
      <BatchSelectionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        onOpenWizard={() => setIsBatchOpen(true)}
        locale={locale}
      />

      {isBatchOpen && (
        <BatchOfferWizardModal
          isOpen={isBatchOpen}
          onClose={() => setIsBatchOpen(false)}
          selectedListings={batchTargets}
          locale={locale}
          onRemoveListing={(id) => {
            setSelectedIds((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          }}
          onSuccess={() => {
            setSelectedIds(new Set());
            setIsBatchOpen(false);
          }}
        />
      )}
    </>
  );
}
