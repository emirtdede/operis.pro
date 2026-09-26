import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/src/app/api/profile/check-handle/route";
import * as sessionModule from "@/src/modules/auth/session";
import * as dbModule from "@/src/lib/db";

describe("GET /api/profile/check-handle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when handle parameter is missing", async () => {
    const req = new Request("https://operis.pro/api/profile/check-handle");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.available).toBe(false);
    expect(data.reason).toBe("empty");
  });

  it("rejects handles shorter than 3 characters", async () => {
    const req = new Request("https://operis.pro/api/profile/check-handle?handle=ab");
    const res = await GET(req);
    const data = await res.json();
    expect(data.available).toBe(false);
    expect(data.reason).toBe("length");
  });

  it("rejects handles with invalid special characters", async () => {
    const req = new Request("https://operis.pro/api/profile/check-handle?handle=emir%40dede");
    const res = await GET(req);
    const data = await res.json();
    expect(data.available).toBe(false);
    expect(data.reason).toBe("format");
  });

  it("rejects reserved system handles like 'admin'", async () => {
    const req = new Request("https://operis.pro/api/profile/check-handle?handle=admin");
    const res = await GET(req);
    const data = await res.json();
    expect(data.available).toBe(false);
    expect(data.reason).toBe("reserved");
  });

  it("returns available=true when handle is available in DB", async () => {
    vi.spyOn(sessionModule, "getSession").mockResolvedValue({
      userId: "user-123",
      email: "emir@operis.pro",
    } as unknown as sessionModule.SessionPayload);

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]), // No existing handle
        }),
      }),
    });

    vi.spyOn(dbModule, "getDb").mockReturnValue({
      select: mockSelect,
    } as unknown as ReturnType<typeof dbModule.getDb>);

    const req = new Request("https://operis.pro/api/profile/check-handle?handle=emirdedeev");
    const res = await GET(req);
    const data = await res.json();
    expect(data.available).toBe(true);
    expect(data.message).toContain("kullanılabilir");
  });

  it("returns isCurrent=true when handle belongs to the logged in user", async () => {
    vi.spyOn(sessionModule, "getSession").mockResolvedValue({
      userId: "user-123",
      email: "emir@operis.pro",
    } as unknown as sessionModule.SessionPayload);

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ userId: "user-123" }]),
        }),
      }),
    });

    vi.spyOn(dbModule, "getDb").mockReturnValue({
      select: mockSelect,
    } as unknown as ReturnType<typeof dbModule.getDb>);

    const req = new Request("https://operis.pro/api/profile/check-handle?handle=emirdede");
    const res = await GET(req);
    const data = await res.json();
    expect(data.available).toBe(true);
    expect(data.isCurrent).toBe(true);
  });

  it("returns available=false when handle belongs to another user", async () => {
    vi.spyOn(sessionModule, "getSession").mockResolvedValue({
      userId: "user-123",
      email: "emir@operis.pro",
    } as unknown as sessionModule.SessionPayload);

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ userId: "another-user-999" }]),
        }),
      }),
    });

    vi.spyOn(dbModule, "getDb").mockReturnValue({
      select: mockSelect,
    } as unknown as ReturnType<typeof dbModule.getDb>);

    const req = new Request("https://operis.pro/api/profile/check-handle?handle=takenhandle");
    const res = await GET(req);
    const data = await res.json();
    expect(data.available).toBe(false);
    expect(data.reason).toBe("taken");
  });
});
