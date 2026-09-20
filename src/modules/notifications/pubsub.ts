import { EventEmitter } from "node:events";

export interface RealtimeNotificationPayload {
  id: string;
  userId: string;
  type: string;
  payloadJson: {
    title?: string;
    message?: string;
    actionUrl?: string;
    [key: string]: unknown;
  };
  readAt: string | null;
  createdAt: string;
}

export interface RealtimeContractEvent {
  type:
    | "CONTRACT_SIGNED"
    | "CONTRACT_FULLY_EXECUTED"
    | "CONTRACT_SELECTION_UPDATED"
    | "CONTRACT_SIGNATURES_INVALIDATED";
  engagementId: string;
  packageId: string;
  status: "PENDING_SIGNATURES" | "PARTIALLY_SIGNED" | "FULLY_SIGNED";
  version: number;
  signerRole?: "CLIENT" | "CONTRACTOR";
  signerName?: string;
  signedAt?: string;
  sha256Seal?: string | null;
  selectedContracts?: string[];
  noticeTr?: string;
  noticeEn?: string;
  timestamp: string;
}

export class NotificationPubSub extends EventEmitter {
  constructor() {
    super();
    // Allow up to 1000 listeners without Node warning
    this.setMaxListeners(1000);
  }

  private channelName(userId: string): string {
    return `user:${userId}:notification`;
  }

  private contractChannelName(engagementId: string): string {
    return `engagement:${engagementId}:contract`;
  }

  emitNotification(userId: string, notification: RealtimeNotificationPayload) {
    this.emit(this.channelName(userId), notification);
  }

  subscribe(userId: string, listener: (notification: RealtimeNotificationPayload) => void): () => void {
    const channel = this.channelName(userId);
    this.on(channel, listener);
    return () => {
      this.off(channel, listener);
    };
  }

  emitContractEvent(engagementId: string, event: RealtimeContractEvent) {
    this.emit(this.contractChannelName(engagementId), event);
  }

  subscribeContract(
    engagementId: string,
    listener: (event: RealtimeContractEvent) => void
  ): () => void {
    const channel = this.contractChannelName(engagementId);
    this.on(channel, listener);
    return () => {
      this.off(channel, listener);
    };
  }
}

const globalForPubSub = globalThis as unknown as {
  operisNotificationPubSub?: NotificationPubSub;
};

export const notificationPubSub =
  globalForPubSub.operisNotificationPubSub ?? new NotificationPubSub();

if (process.env.NODE_ENV !== "production") {
  globalForPubSub.operisNotificationPubSub = notificationPubSub;
}
