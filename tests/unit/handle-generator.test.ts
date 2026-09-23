import { describe, it, expect, vi } from "vitest";
import {
  cleanForHandle,
  buildBaseHandle,
  generateUniqueSequentialHandle,
  type DbOrTx,
} from "@/src/modules/auth/handle-generator";

describe("Handle Generator - cleanForHandle", () => {
  it("converts Turkish characters to standard English letters", () => {
    expect(cleanForHandle("Çağrı Şengül")).toBe("cagrisengul");
    expect(cleanForHandle("İsmail Öztürk")).toBe("ismailozturk");
    expect(cleanForHandle("Iğdır Şükrü")).toBe("igdirstkru".replace("t", "u").replace("tk", "k")); // verify igdirsukru
    expect(cleanForHandle("Iğdır Şükrü")).toBe("igdirsukru");
  });

  it("removes non-alphanumeric characters and converts to lowercase", () => {
    expect(cleanForHandle("Emir-Dede_123!@#")).toBe("emirdede123");
    expect(cleanForHandle("  JOHN DOE  ")).toBe("johndoe");
  });

  it("handles accented Latin characters gracefully", () => {
    expect(cleanForHandle("René François")).toBe("renefrancois");
  });
});

describe("Handle Generator - buildBaseHandle", () => {
  it("combines firstName and lastName when both are present", () => {
    expect(buildBaseHandle("Emir", "Dede")).toBe("emirdede");
    expect(buildBaseHandle("Ahmet", "Yılmaz")).toBe("ahmetyilmaz");
  });

  it("uses only firstName when lastName is absent or empty", () => {
    expect(buildBaseHandle("Emir", null)).toBe("emir");
    expect(buildBaseHandle("Emir", "")).toBe("emir");
    expect(buildBaseHandle("Emir", undefined)).toBe("emir");
  });

  it("uses only lastName when firstName is absent or empty", () => {
    expect(buildBaseHandle(null, "Dede")).toBe("dede");
    expect(buildBaseHandle("", "Dede")).toBe("dede");
  });

  it("falls back to email prefix when both names are absent", () => {
    expect(buildBaseHandle(null, null, "emirdede@operis.pro")).toBe("emirdede");
  });

  it("falls back to user when all arguments are empty", () => {
    expect(buildBaseHandle("", "", "")).toBe("user");
  });

  it("pads strings shorter than 3 characters to satisfy minimum length", () => {
    expect(buildBaseHandle("Su", null)).toBe("user_su");
    expect(buildBaseHandle("A", null)).toBe("user_a");
  });

  it("truncates base handle to at most 24 characters to leave room for sequential digits", () => {
    const longName = "abdelrahman";
    const longSurname = "almuhammadialmansoori";
    const result = buildBaseHandle(longName, longSurname);
    expect(result.length).toBeLessThanOrEqual(24);
    expect(result).toBe(`${longName}${longSurname}`.slice(0, 24));
  });
});

describe("Handle Generator - generateUniqueSequentialHandle", () => {
  const createMockDb = (existingHandles: string[]): DbOrTx => {
    return {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            // Return rows matching the base
            return Promise.resolve(existingHandles.map((h) => ({ handle: h })));
          }),
        }),
      }),
    } as unknown as DbOrTx;
  };

  it("assigns base handle directly if available and not reserved (Emir Dede -> emirdede)", async () => {
    const mockDb = createMockDb([]);
    const handle = await generateUniqueSequentialHandle(mockDb, "Emir", "Dede");
    expect(handle).toBe("emirdede");
  });

  it("assigns base handle directly for single name if available (Emir -> emir)", async () => {
    const mockDb = createMockDb([]);
    const handle = await generateUniqueSequentialHandle(mockDb, "Emir", null);
    expect(handle).toBe("emir");
  });

  it("assigns emirdede2 when emirdede is already taken", async () => {
    const mockDb = createMockDb(["emirdede"]);
    const handle = await generateUniqueSequentialHandle(mockDb, "Emir", "Dede");
    expect(handle).toBe("emirdede2");
  });

  it("assigns emir2 when emir is already taken", async () => {
    const mockDb = createMockDb(["emir"]);
    const handle = await generateUniqueSequentialHandle(mockDb, "Emir", null);
    expect(handle).toBe("emir2");
  });

  it("assigns emirdede3 when emirdede and emirdede2 are already taken", async () => {
    const mockDb = createMockDb(["emirdede", "emirdede2"]);
    const handle = await generateUniqueSequentialHandle(mockDb, "Emir", "Dede");
    expect(handle).toBe("emirdede3");
  });

  it("fills gaps in sequence (e.g. emirdede and emirdede3 taken -> returns emirdede2)", async () => {
    const mockDb = createMockDb(["emirdede", "emirdede3"]);
    const handle = await generateUniqueSequentialHandle(mockDb, "Emir", "Dede");
    expect(handle).toBe("emirdede2");
  });

  it("appends counter starting at 2 if the base handle is in RESERVED_HANDLES (e.g. admin -> admin2)", async () => {
    const mockDb = createMockDb([]);
    const handle = await generateUniqueSequentialHandle(mockDb, "Admin", null);
    expect(handle).toBe("admin2");
  });
});
