import { describe, it, expect, beforeEach } from "vitest";
import { SymSpellEngine } from "@/src/lib/search/symspell-engine";

describe("SymSpellEngine - O(1) Fast Fuzzy Search & Turkish Character Handling", () => {
  let engine: SymSpellEngine;

  beforeEach(() => {
    engine = new SymSpellEngine({ maxEditDistance: 2 });
    engine.loadWords([
      "yazılım",
      "geliştirici",
      "tasarım",
      "iletişim",
      "yapay zeka",
      "veritabanı",
      "muhasebe",
      "sözleşme",
      "hakediş",
      "nextjs",
      "typescript",
      "tailwind",
      "postgresql",
    ]);
  });

  it("returns exact match immediately with distance 0", () => {
    const results = engine.lookup("yazılım");
    expect(results).toHaveLength(1);
    expect(results[0]?.term).toBe("yazılım");
    expect(results[0]?.distance).toBe(0);
  });

  it("corrects single-character typo with Turkish diacritics (tasarim -> tasarım)", () => {
    // 1 edit: 'i' vs 'ı'
    const results = engine.lookup("tasarim", 1);
    expect(results.some((r) => r.term === "tasarım")).toBe(true);
    expect(results[0]?.term).toBe("tasarım");
    expect(results[0]?.distance).toBe(1);
  });

  it("corrects multiple-character typo with Turkish diacritics (yazilim -> yazılım)", () => {
    // 2 edits: both 'i's vs 'ı's
    const results = engine.lookup("yazilim", 2);
    expect(results.some((r) => r.term === "yazılım")).toBe(true);
    expect(results[0]?.term).toBe("yazılım");
    expect(results[0]?.distance).toBe(2);
  });

  it("corrects missing character (gelistirci -> geliştirici)", () => {
    const results = engine.lookup("gelistirci", 2);
    expect(results.some((r) => r.term === "geliştirici")).toBe(true);
  });

  it("corrects transpositions and extra characters (tasarımm -> tasarım)", () => {
    const results = engine.lookup("tasarımm", 1);
    expect(results.some((r) => r.term === "tasarım")).toBe(true);
    expect(results[0]?.distance).toBe(1);
  });

  it("handles tech keywords like nextjs, typescript, postgresql", () => {
    const typoTs = engine.lookup("typscript", 1);
    expect(typoTs[0]?.term).toBe("typescript");

    const typoPg = engine.lookup("postgreql", 1);
    expect(typoPg[0]?.term).toBe("postgresql");
  });

  it("returns empty array when distance exceeds threshold or term is too short", () => {
    const results = engine.lookup("xyzcompletelyunrelated", 2);
    expect(results).toHaveLength(0);

    const singleLetter = engine.lookup("a", 2);
    expect(singleLetter).toHaveLength(0);
  });

  it("computes bounded Damerau-Levenshtein correctly with early termination", () => {
    expect(SymSpellEngine.damerauLevenshtein("kitten", "sitting", 3)).toBe(3);
    expect(SymSpellEngine.damerauLevenshtein("sözleşme", "sozlesme", 2)).toBe(2);
    // Distance > maxLimit terminates early with maxLimit + 1
    expect(SymSpellEngine.damerauLevenshtein("short", "extremelylongword", 2)).toBe(3);
  });
});
