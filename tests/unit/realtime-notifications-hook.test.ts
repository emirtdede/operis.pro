// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useRealtimeNotifications } from "@/src/hooks/use-realtime-notifications";
let current: ReturnType<typeof useRealtimeNotifications>;
let root: Root;
const connections: FakeEventSource[] = [];
class FakeEventSource extends EventTarget {
  static CONNECTING = 0;
  static CLOSED = 2;
  static OPEN = 1;
  readyState = 1;
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public url: string) {
    super();
    connections.push(this);
  }
  close() {
    this.readyState = 2;
  }
  send(id: string, data: string) {
    this.dispatchEvent(new MessageEvent("notification", { lastEventId: id, data }));
  }
  disconnect() {
    this.readyState = FakeEventSource.CONNECTING;
    this.onerror?.();
  }
}
const channels: FakeBroadcast[] = [];
class FakeBroadcast {
  onmessage: ((event: MessageEvent) => void) | null = null;
  constructor() {
    channels.push(this);
  }
  postMessage = vi.fn();
  close() {}
}
function Harness() {
  current = useRealtimeNotifications({ locale: "tr" });
  return null;
}
const user = "00000000-0000-0000-0000-000000000001";
const cursor = (n: number) => `v1.${user}.${n}`;
beforeEach(async () => {
  vi.useFakeTimers();
  connections.length = 0;
  channels.length = 0;
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("EventSource", FakeEventSource);
  vi.stubGlobal("BroadcastChannel", FakeBroadcast);
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ notifications: [], unreadCount: 0, streamCursor: cursor(0) }),
    })
  );
  root = createRoot(document.createElement("div"));
  await act(async () => {
    root.render(createElement(Harness));
  });
});
afterEach(async () => {
  await act(async () => root.unmount());
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it("deduplicates SSE and broadcasts and does not advance cursor on malformed JSON", async () => {
  const item = {
    id: "a",
    streamSequence: "1",
    type: "SECURITY_EVENT",
    payloadJson: {},
    readAt: null,
    createdAt: new Date().toISOString(),
  };
  await act(async () => {
    connections[0]!.send(cursor(1), JSON.stringify(item));
    connections[0]!.send(cursor(1), JSON.stringify(item));
    channels[0]!.onmessage?.(
      new MessageEvent("message", { data: { type: "NEW_NOTIFICATION", notification: item } })
    );
    connections[0]!.send(cursor(99), "not-json");
  });
  expect(current.unreadCount).toBe(1);
  expect(current.notifications).toHaveLength(1);
  await act(async () => {
    connections[0]!.close();
    connections[0]!.onerror?.();
    await vi.advanceTimersByTimeAsync(2000);
  });
  expect(decodeURIComponent(connections[1]!.url)).toContain(cursor(1));
});
it("preserves a newer SSE event when an older REST snapshot resolves", async () => {
  let resolveFetch!: (value: Response) => void;
  vi.mocked(fetch).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
  );
  let pending!: Promise<void>;
  await act(async () => {
    pending = current.fetchNotifications();
  });
  const item = {
    id: "new",
    streamSequence: "2",
    type: "SECURITY_EVENT",
    payloadJson: {},
    readAt: null,
    createdAt: new Date().toISOString(),
  };
  await act(async () => {
    connections[0]!.send(cursor(2), JSON.stringify(item));
  });
  await act(async () => {
    resolveFetch(Response.json({ notifications: [], unreadCount: 0, streamCursor: cursor(1) }));
    await pending;
  });
  expect(current.unreadCount).toBe(1);
  expect(current.notifications[0]?.id).toBe("new");
});

it("does not count replayed rows already covered by a paginated REST snapshot", async () => {
  const items = Array.from({ length: 250 }, (_, index) => ({
    id: `notification-${index + 1}`,
    streamSequence: String(index + 1),
    type: "SECURITY_EVENT",
    payloadJson: {},
    readAt: null,
    createdAt: new Date().toISOString(),
  }));
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      notifications: items.slice(-50).reverse(),
      unreadCount: 250,
      streamCursor: cursor(250),
    }),
  } as Response);
  await act(async () => {
    await current.fetchNotifications();
    for (const [index, item] of items.entries()) {
      connections[0]!.send(cursor(index + 1), JSON.stringify(item));
    }
  });
  expect(current.notifications).toHaveLength(250);
  expect(current.unreadCount).toBe(250);
  expect(current.liveToast).toBeNull();
  expect(current.isRinging).toBe(false);

  const latest = { ...items[0]!, id: "latest", streamSequence: "251" };
  await act(async () => {
    connections[0]!.send(cursor(251), JSON.stringify(latest));
    channels[0]!.onmessage?.(
      new MessageEvent("message", { data: { type: "NEW_NOTIFICATION", notification: latest } })
    );
  });
  expect(current.unreadCount).toBe(251);
  expect(current.liveToast?.id).toBe("latest");
});

it("replaces the browser auto-reconnect with the last accepted SSE cursor", async () => {
  const item = {
    id: "accepted",
    streamSequence: "1",
    type: "SECURITY_EVENT",
    payloadJson: {},
    readAt: null,
    createdAt: new Date().toISOString(),
  };
  await act(async () => {
    connections[0]!.send(cursor(1), JSON.stringify(item));
    connections[0]!.disconnect();
  });
  expect(connections[0]!.readyState).toBe(FakeEventSource.CLOSED);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2000);
  });
  expect(connections).toHaveLength(2);
  expect(decodeURIComponent(connections[1]!.url)).toContain(cursor(1));
});

it("reconnects after malformed JSON before a later event can advance past it", async () => {
  const item = {
    id: "accepted",
    streamSequence: "1",
    type: "SECURITY_EVENT",
    payloadJson: {},
    readAt: null,
    createdAt: new Date().toISOString(),
  };
  await act(async () => {
    connections[0]!.send(cursor(1), JSON.stringify(item));
    connections[0]!.send(cursor(2), "not-json");
    connections[0]!.send(cursor(3), JSON.stringify({ ...item, id: "later", streamSequence: "3" }));
  });
  expect(connections[0]!.readyState).toBe(FakeEventSource.CLOSED);
  expect(current.notifications.map((notification) => notification.id)).toEqual(["accepted"]);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2000);
  });
  expect(decodeURIComponent(connections[1]!.url)).toContain(cursor(1));
});

it.each(["single", "all", "broadcast-single", "broadcast-all"] as const)(
  "preserves %s read changes across a pending snapshot and duplicate delivery",
  async (action) => {
    const item = {
      id: "newer-than-snapshot",
      streamSequence: "2",
      type: "SECURITY_EVENT",
      payloadJson: {},
      readAt: null,
      createdAt: new Date().toISOString(),
    };
    let resolveFetch!: (value: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );
    let pending!: Promise<void>;
    await act(async () => {
      pending = current.fetchNotifications();
      connections[0]!.send(cursor(2), JSON.stringify(item));
    });
    await act(async () => {
      if (action === "single") await current.markAsRead(item.id);
      else if (action === "all") await current.markAllRead();
      else {
        channels[0]!.onmessage?.(
          new MessageEvent("message", {
            data: {
              type: action === "broadcast-single" ? "MARK_READ" : "MARK_ALL_READ",
              notificationId: item.id,
            },
          })
        );
      }
      // An already queued SSE row can still carry its older unread value.
      connections[0]!.send(cursor(2), JSON.stringify(item));
      resolveFetch(
        Response.json({ notifications: [item], unreadCount: 1, streamCursor: cursor(2) })
      );
      await pending;
    });
    expect(current.unreadCount).toBe(0);
    expect(current.notifications[0]?.readAt).not.toBeNull();

    // Another snapshot that predates this event must merge its cached read state.
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ notifications: [], unreadCount: 0, streamCursor: cursor(1) }),
    } as Response);
    await act(async () => {
      await current.fetchNotifications();
    });
    expect(current.unreadCount).toBe(0);
    expect(current.notifications[0]?.readAt).not.toBeNull();
  }
);
