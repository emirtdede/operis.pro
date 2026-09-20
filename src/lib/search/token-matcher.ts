import { normalizeSearchQuery, toAsciiShadow, tokenizeQuery } from "./normalization";

/**
 * Normalizes text for Turkish and international search.
 * Handles casing, diacritics, and ASCII shadows for tolerant matching.
 */
export function normalizeTurkish(text: string): string {
  if (!text) return "";
  const norm = normalizeSearchQuery(text);
  const shadow = toAsciiShadow(norm);
  return `${norm} ${shadow}`.trim();
}

/**
 * Tokenizes a search query into distinct lowercase terms.
 */
export function extractSearchTokens(query: string): string[] {
  if (!query || !query.trim()) return [];
  const normalized = normalizeSearchQuery(query);
  const tokens = tokenizeQuery(normalized);
  // Also include ASCII shadows for query tokens (e.g., 'tasarim' matches 'tasarım')
  const tokenSet = new Set<string>();
  for (const t of tokens) {
    if (t.length > 0) {
      tokenSet.add(t);
      tokenSet.add(toAsciiShadow(t));
    }
  }
  return Array.from(tokenSet);
}

export interface WeightedField {
  text: string | null | undefined;
  weight: number;
}

/**
 * Evaluates whether a target item matches the search query across weighted fields.
 * Returns a score > 0 if all primary tokens are present, or partial matches if query is short.
 */
export function scoreSearchMatch(
  rawQuery: string,
  fields: WeightedField[]
): { matches: boolean; score: number } {
  if (!rawQuery || !rawQuery.trim()) {
    return { matches: true, score: 0 };
  }

  const rawTokens = tokenizeQuery(normalizeSearchQuery(rawQuery));
  if (rawTokens.length === 0) {
    return { matches: true, score: 0 };
  }

  // Pre-normalize target fields (both original normalized and ascii shadow)
  const preparedFields = fields
    .filter((f) => Boolean(f.text && f.text.trim()))
    .map((f) => {
      const norm = normalizeSearchQuery(f.text!);
      const shadow = toAsciiShadow(norm);
      return {
        norm,
        shadow,
        weight: f.weight,
      };
    });

  let totalScore = 0;
  let matchedTokenCount = 0;

  for (const token of rawTokens) {
    const tokenShadow = toAsciiShadow(token);
    let tokenMatched = false;
    let maxTokenScore = 0;

    for (const field of preparedFields) {
      const normNoSpace = field.norm.replace(/\s+/g, "");
      const shadowNoSpace = field.shadow.replace(/\s+/g, "");
      const tokenNoSpace = token.replace(/\s+/g, "");
      const tokenShadowNoSpace = tokenShadow.replace(/\s+/g, "");

      const fieldHasExactToken =
        field.norm.includes(token) ||
        field.shadow.includes(tokenShadow) ||
        (tokenNoSpace.length >= 3 &&
          (normNoSpace.includes(tokenNoSpace) ||
            shadowNoSpace.includes(tokenShadowNoSpace)));

      if (fieldHasExactToken) {
        tokenMatched = true;
        // Exact whole-word bonus
        const isWholeWord =
          field.norm === token ||
          field.norm.startsWith(`${token} `) ||
          field.norm.endsWith(` ${token}`) ||
          field.norm.includes(` ${token} `) ||
          field.shadow === tokenShadow ||
          field.shadow.startsWith(`${tokenShadow} `) ||
          field.shadow.endsWith(` ${tokenShadow}`) ||
          field.shadow.includes(` ${tokenShadow} `);

        const fieldScore = field.weight * (isWholeWord ? 2.0 : 1.0);
        if (fieldScore > maxTokenScore) {
          maxTokenScore = fieldScore;
        }
      }
    }

    if (tokenMatched) {
      matchedTokenCount++;
      totalScore += maxTokenScore;
    }
  }

  // Multi-token requirement: All query tokens must match at least one field (AND logic)
  const matches = matchedTokenCount === rawTokens.length;

  return {
    matches,
    score: matches ? totalScore : 0,
  };
}

/**
 * Filters and sorts items based on Turkish multi-token weighted relevance score.
 */
export function filterAndSortByRelevance<T>(
  items: T[],
  query: string,
  extractFields: (item: T) => WeightedField[]
): T[] {
  if (!query || !query.trim()) {
    return items;
  }

  const scored: Array<{ item: T; score: number; index: number }> = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    const fields = extractFields(item);
    const { matches, score } = scoreSearchMatch(query, fields);

    if (matches) {
      scored.push({ item, score, index: i });
    }
  }

  // Sort descending by score; preserve original order if scores are identical
  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.index - b.index;
  });

  return scored.map((s) => s.item);
}

/**
 * Algoritma 5: Shift + Click Hızlı Aralık Seçimi (Range Selection Algorithm)
 * Enables Gmail/Mac Finder style contiguous range selection.
 */
export function computeRangeSelection<T extends { id: string }>(
  items: T[],
  lastSelectedId: string | null,
  targetId: string,
  currentSelection: Set<string>
): Set<string> {
  const nextSelection = new Set(currentSelection);

  if (!lastSelectedId) {
    // Normal single selection
    if (nextSelection.has(targetId)) {
      nextSelection.delete(targetId);
    } else {
      nextSelection.add(targetId);
    }
    return nextSelection;
  }

  const lastIndex = items.findIndex((i) => i.id === lastSelectedId);
  const targetIndex = items.findIndex((i) => i.id === targetId);

  if (lastIndex === -1 || targetIndex === -1) {
    if (nextSelection.has(targetId)) {
      nextSelection.delete(targetId);
    } else {
      nextSelection.add(targetId);
    }
    return nextSelection;
  }

  const start = Math.min(lastIndex, targetIndex);
  const end = Math.max(lastIndex, targetIndex);

  // Range select all items between start and end inclusive
  for (let i = start; i <= end; i++) {
    const item = items[i];
    if (item) {
      nextSelection.add(item.id);
    }
  }

  return nextSelection;
}
