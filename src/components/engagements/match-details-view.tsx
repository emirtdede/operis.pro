"use client";

import {
  type MatchDetailsViewProps,
  getCounterpartyLocalTime,
  useMatchDetailsActions,
  MatchSummaryCard,
  MatchHandshakeKit,
  MatchEscrowStatus,
  MatchActionModals,
} from "./match-details";

export type { MatchDetailsViewProps };
export { getCounterpartyLocalTime };

export function MatchDetailsView(props: MatchDetailsViewProps) {
  const {
    engagementId,
    listingTitle,
    category,
    matchedAt,
    status,
    offerMessage,
    budgetLabel,
    timelineLabel,
    counterparty,
    currentUser,
    currentUserId,
    ownerUserId,
    isCompleted,
    userCompletionStatus,
    counterpartyCompletionStatus,
    initialEndorsements = [],
    locale,
  } = props;

  const actions = useMatchDetailsActions({
    engagementId,
    status,
    isCompleted,
    userCompletionStatus,
    initialEndorsements,
    locale,
    currentUserId,
  });

  const counterpartyTime = getCounterpartyLocalTime(counterparty.timeZone, locale);

  const cleanPhone = counterparty.phone
    ? counterparty.phone.replace(/[^0-9+]/g, "").replace(/^\+/, "")
    : null;

  const waText = encodeURIComponent(
    actions.isTr
      ? `Merhaba ${counterparty.displayName}, Operis üzerinden '${listingTitle}' ilanımızda eşleştik. İlan detaylarını ve başlangıç takvimini görüşmek isterim.`
      : `Hello ${counterparty.displayName}, we matched on Operis for '${listingTitle}'. I would like to discuss listing details and timeline.`
  );
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${waText}` : null;
  const telUrl = cleanPhone ? `tel:${cleanPhone}` : null;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Summary, Status Badges, Cancel Banner & 3-Step Milestone Schedule */}
      <MatchSummaryCard
        category={category}
        listingTitle={listingTitle}
        matchedAt={matchedAt}
        currentStatus={actions.currentStatus}
        completed={actions.completed}
        isTr={actions.isTr}
        onOpenContractModal={() => actions.setContractModalOpen(true)}
      />

      {/* Counterparty Contact & Instant Handshake Kit (7 Channels) */}
      <MatchHandshakeKit
        counterparty={counterparty}
        currentUser={currentUser}
        listingTitle={listingTitle}
        engagementId={engagementId}
        locale={locale}
        isTr={actions.isTr}
        counterpartyTime={counterpartyTime}
        copiedField={actions.copiedField}
        pingCooldown={actions.pingCooldown}
        onOpenPingModal={() => actions.setPingModalOpen(true)}
        onOpenNightCallModal={() => actions.setShowNightCallModal(true)}
        onCopy={actions.handleCopy}
      />

      {/* Agreed Offer, Direct Payment Protocol, Mutual Completion & Verified Endorsements */}
      <MatchEscrowStatus
        offerMessage={offerMessage}
        budgetLabel={budgetLabel}
        timelineLabel={timelineLabel}
        isTr={actions.isTr}
        currentStatus={actions.currentStatus}
        completed={actions.completed}
        myMark={actions.myMark}
        isLoading={actions.isLoading}
        feedback={actions.feedback}
        counterpartyCompletionStatus={counterpartyCompletionStatus}
        counterpartyDisplayName={counterparty.displayName}
        onMarkComplete={actions.handleMarkComplete}
        onDispute={actions.handleDispute}
        onOpenCancelModal={() => actions.setCancelModalOpen(true)}
        endorsements={actions.endorsements}
        endorsementText={actions.endorsementText}
        setEndorsementText={actions.setEndorsementText}
        isSubmittingEndorsement={actions.isSubmittingEndorsement}
        endorsementFeedback={actions.endorsementFeedback}
        onSubmitEndorsement={actions.handleSubmitEndorsement}
        currentUserId={currentUserId}
      />

      {/* Action Modals (Contract, Cancel, Ping, Night Call) */}
      <MatchActionModals
        contractModalOpen={actions.contractModalOpen}
        onCloseContractModal={() => actions.setContractModalOpen(false)}
        engagementId={engagementId}
        listingTitle={listingTitle}
        category={category}
        matchedAt={matchedAt}
        offerMessage={offerMessage}
        budgetLabel={budgetLabel}
        timelineLabel={timelineLabel}
        counterparty={counterparty}
        currentUser={currentUser}
        isOwner={ownerUserId === currentUserId}
        locale={locale}
        isTr={actions.isTr}
        cancelModalOpen={actions.cancelModalOpen}
        onCloseCancelModal={() => {
          actions.setCancelModalOpen(false);
          actions.setCancelFeedback(null);
        }}
        cancelReason={actions.cancelReason}
        setCancelReason={actions.setCancelReason}
        isCancelling={actions.isCancelling}
        cancelFeedback={actions.cancelFeedback}
        onCancelEngagement={actions.handleCancelEngagement}
        pingModalOpen={actions.pingModalOpen}
        onClosePingModal={() => {
          actions.setPingModalOpen(false);
          actions.setPingFeedback(null);
        }}
        pingTemplate={actions.pingTemplate}
        setPingTemplate={actions.setPingTemplate}
        isPinging={actions.isPinging}
        pingFeedback={actions.pingFeedback}
        onSendPing={actions.handleSendPing}
        showNightCallModal={actions.showNightCallModal}
        onCloseNightCallModal={() => actions.setShowNightCallModal(false)}
        counterpartyTime={counterpartyTime}
        waUrl={waUrl}
        telUrl={telUrl}
      />
    </div>
  );
}
