"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { RealtimeContractEvent } from "@/src/modules/notifications/pubsub";
import type { ContractPackageDetails } from "@/src/modules/contracts/signing-types";

export interface UseContractRealtimeOptions {
  engagementId: string;
  myRole?: "CLIENT" | "CONTRACTOR";
  isTr?: boolean;
  enabled?: boolean;
  onCounterpartySigned?: (event: RealtimeContractEvent) => void;
  onFullyExecuted?: (event: RealtimeContractEvent) => void;
  onSignaturesInvalidated?: (event: RealtimeContractEvent) => void;
  onPackageUpdated?: (packageDetails: ContractPackageDetails) => void;
}

interface ContractBroadcastMessage {
  type: "REFRESH_PACKAGE" | "CONFETTI_CELEBRATION" | "CONTRACT_EVENT";
  engagementId: string;
  sourceTabId: string;
  version?: number;
  event?: RealtimeContractEvent;
}

export function useContractRealtime({
  engagementId,
  myRole,
  isTr = true,
  enabled = true,
  onCounterpartySigned,
  onFullyExecuted,
  onSignaturesInvalidated,
  onPackageUpdated,
}: UseContractRealtimeOptions) {
  const [packageDetails, setPackageDetails] = useState<ContractPackageDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [liveToastMessage, setLiveToastMessage] = useState<string | null>(null);
  const [tamperWarning, setTamperWarning] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const lastSeenVersionRef = useRef<number>(0);
  const pendingCelebrationRef = useRef<boolean>(false);
  const tabIdRef = useRef<string>(
    typeof window !== "undefined"
      ? `tab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
      : "ssr"
  );

  // Auto-dismiss live toast after 8 seconds
  const setCelebratoryToast = useCallback((msg: string | null) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    setLiveToastMessage(msg);
    if (msg) {
      toastTimeoutRef.current = setTimeout(() => {
        setLiveToastMessage(null);
      }, 8000);
    }
  }, []);

  // Trigger celebration with motion sensitivity & visibility checks
  const triggerCelebration = useCallback(() => {
    if (typeof window === "undefined") return;

    // Accessibility check: respects reduced motion preference
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      return;
    }

    if (document.visibilityState === "visible") {
      setShowConfetti(true);
      pendingCelebrationRef.current = false;
    } else {
      // Buffer celebration until user switches back to this tab
      pendingCelebrationRef.current = true;
    }
  }, []);

  // Fetch freshest package details from server
  const loadPackageData = useCallback(async () => {
    if (!engagementId) return;
    try {
      const res = await fetch(`/api/work/${engagementId}/contract/package`);
      if (res.ok) {
        const data = await res.json();
        if (data.package) {
          setPackageDetails(data.package);
          if (typeof data.package.version === "number") {
            lastSeenVersionRef.current = Math.max(lastSeenVersionRef.current, data.package.version);
          }
          onPackageUpdated?.(data.package);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setFetchError(err.error || "Sözleşme paketi yüklenemedi.");
      }
    } catch {
      setFetchError("Ağ bağlantı hatası oluştu.");
    } finally {
      setIsLoading(false);
    }
  }, [engagementId, onPackageUpdated]);

  // Handle incoming real-time contract event
  const handleIncomingContractEvent = useCallback(
    (event: RealtimeContractEvent, fromBroadcast = false) => {
      if (event.engagementId !== engagementId) return;

      // CAS Versioning & Deduplication
      if (typeof event.version === "number") {
        if (event.version <= lastSeenVersionRef.current && fromBroadcast) {
          return;
        }
        lastSeenVersionRef.current = Math.max(lastSeenVersionRef.current, event.version);
      }

      loadPackageData();

      // Check if signer is counterparty
      const signerRole = event.signerRole;
      const isCounterparty =
        !myRole ||
        (myRole === "CLIENT" && signerRole === "CONTRACTOR") ||
        (myRole === "CONTRACTOR" && signerRole === "CLIENT");

      if (event.type === "CONTRACT_SIGNED") {
        if (isCounterparty) {
          if (!fromBroadcast) {
            triggerCelebration();
            // Broadcast celebration to other tabs with tabId
            try {
              broadcastChannelRef.current?.postMessage({
                type: "CONFETTI_CELEBRATION",
                engagementId,
                sourceTabId: tabIdRef.current,
                version: event.version,
                event,
              } as ContractBroadcastMessage);
            } catch {
              // Ignore broadcast error
            }
          }

          setCelebratoryToast(
            isTr
              ? `🎉 Harika haber! ${event.signerName || "Karşı taraf"} sözleşmeyi az önce imzaladı! Sıra sizde.`
              : `🎉 Great news! ${event.signerName || "Counterparty"} just signed the contract! Awaiting your signature.`
          );
          onCounterpartySigned?.(event);
        }
      } else if (event.type === "CONTRACT_FULLY_EXECUTED") {
        if (!fromBroadcast) {
          triggerCelebration();
          try {
            broadcastChannelRef.current?.postMessage({
              type: "CONFETTI_CELEBRATION",
              engagementId,
              sourceTabId: tabIdRef.current,
              version: event.version,
              event,
            } as ContractBroadcastMessage);
          } catch {
            // Ignore
          }
        }

        setCelebratoryToast(
          isTr
            ? "🎉 Sözleşmeler çift taraflı olarak başarıyla imzalandı ve SHA-256 mührüyle yürürlüğe girdi!"
            : "🎉 Contract package has been fully signed and cryptographically sealed with SHA-256!"
        );
        onFullyExecuted?.(event);
      } else if (event.type === "CONTRACT_SIGNATURES_INVALIDATED") {
        setTamperWarning(
          isTr
            ? event.noticeTr ||
                "Sözleşme seçimi değiştiği için önceden atılmış olan imza(lar) güvenlik amacıyla sıfırlandı."
            : event.noticeEn || "Contract selection changed; prior signature(s) were invalidated."
        );
        onSignaturesInvalidated?.(event);
      } else if (event.type === "CONTRACT_SELECTION_UPDATED") {
        loadPackageData();
      }
    },
    [
      engagementId,
      loadPackageData,
      myRole,
      isTr,
      triggerCelebration,
      setCelebratoryToast,
      onCounterpartySigned,
      onFullyExecuted,
      onSignaturesInvalidated,
    ]
  );

  // Cross-tab synchronization via BroadcastChannel
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(`operis_contract_${engagementId}`);
      broadcastChannelRef.current = bc;

      bc.onmessage = (e: MessageEvent<ContractBroadcastMessage>) => {
        const msg = e.data;
        if (!msg || msg.engagementId !== engagementId) return;

        // Skip self-originated broadcast messages
        if (msg.sourceTabId === tabIdRef.current) return;

        if (msg.type === "REFRESH_PACKAGE") {
          loadPackageData();
        } else if (msg.type === "CONFETTI_CELEBRATION" && msg.event) {
          // Other tab already popped confetti, update state without redundant celebration
          handleIncomingContractEvent(msg.event, true);
        } else if (msg.type === "CONTRACT_EVENT" && msg.event) {
          handleIncomingContractEvent(msg.event, true);
        }
      };
    } catch {
      // BroadcastChannel unavailable
    }

    return () => {
      if (bc) {
        bc.close();
        broadcastChannelRef.current = null;
      }
    };
  }, [engagementId, loadPackageData, handleIncomingContractEvent]);

  // Connect to SSE Stream with exponential backoff & jitter
  const connectSSE = useCallback(() => {
    if (!enabled || typeof window === "undefined" || !("EventSource" in window)) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    try {
      const es = new EventSource(`/api/work/${engagementId}/contract/stream`);
      eventSourceRef.current = es;

      es.onopen = () => {
        retryCountRef.current = 0;
      };

      es.addEventListener("connected", (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.package) {
            setPackageDetails(payload.package);
            if (typeof payload.package.version === "number") {
              lastSeenVersionRef.current = Math.max(
                lastSeenVersionRef.current,
                payload.package.version
              );
            }
          }
        } catch {
          // Non-critical
        }
      });

      es.addEventListener("contract_event", (event: MessageEvent) => {
        try {
          const payload: RealtimeContractEvent = JSON.parse(event.data);
          if (payload && payload.type) {
            handleIncomingContractEvent(payload);
          }
        } catch {
          // Ignore malformed JSON
        }
      });

      es.onerror = () => {
        if (es.readyState === EventSource.CLOSED) {
          es.close();
          eventSourceRef.current = null;

          // Reconnection backoff: min(2000 * 1.5^retry, 30000) + jitter
          const jitter = Math.random() * 1000;
          const backoff = Math.min(2000 * Math.pow(1.5, retryCountRef.current), 30000) + jitter;
          retryCountRef.current += 1;

          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (document.visibilityState === "visible") {
              connectSSE();
            }
          }, backoff);
        }
      };
    } catch {
      // Fallback
    }
  }, [enabled, engagementId, handleIncomingContractEvent]);

  // Initial fetch, stream connection, and visibility handlers
  useEffect(() => {
    if (!enabled) return;

    loadPackageData();
    connectSSE();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Trigger buffered celebration if event arrived while hidden
        if (pendingCelebrationRef.current) {
          pendingCelebrationRef.current = false;
          setShowConfetti(true);
        }

        // Reconnect SSE if closed
        if (!eventSourceRef.current || eventSourceRef.current.readyState === EventSource.CLOSED) {
          connectSSE();
        }
        loadPackageData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Adaptive fallback polling (every 10s while not fully signed and visible)
    const pollInterval = setInterval(() => {
      if (document.visibilityState === "visible" && packageDetails?.status !== "FULLY_SIGNED") {
        loadPackageData();
      }
    }, 10000);

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      clearInterval(pollInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, loadPackageData, connectSSE, packageDetails?.status]);

  const dismissToast = useCallback(() => {
    setLiveToastMessage(null);
  }, []);

  return {
    packageDetails,
    setPackageDetails,
    isLoading,
    fetchError,
    showConfetti,
    setShowConfetti,
    liveToastMessage,
    setLiveToastMessage,
    dismissToast,
    tamperWarning,
    setTamperWarning,
    refreshPackage: loadPackageData,
    triggerCelebration,
  };
}
