/**
 * Operis Search v5 — Ranking & Search Engine
 * Authoritative production ranking pipeline adhering strictly to:
 * - docs/02_SEARCH_ARCHITECTURE.md
 * - docs/05_RANKING_SPEC.md
 * - data/ranking-config.json
 * - data/disambiguation-rules.json
 * - data/benchmark-metrics.json
 */

import { taxonomyIndex, TOOL_COLLISION_PRIORITY } from './taxonomy-index';
import {
  TaxonomyCategory,
  SearchResult,
  SearchOptions,
  MatchClass,
} from './types';
import {
  normalizeSearchQuery,
  toAsciiShadow,
  tokenizeQuery,
  generateNGrams,
  isFuzzyMatch,
  MAX_QUERY_LENGTH,
  PROTECTED_TOKENS,
  STOP_WORDS,
  stemTurkishWord,
  cleanHiringIntent,
  sanitizeRawQuery,
} from './normalization';
import { SEED_CATEGORIES } from '@/db/seeds/categories';

export const MATCH_CLASS_ORDER: Record<MatchClass, number> = {
  exactCategoryName: 1,
  exactCanonicalTerm: 2,
  exactSearchTerm: 3,
  exactSkillTag: 4,
  aliasExact: 5,
  serviceIntentPhrase: 6,
  prefixSearchTerm: 7,
  problemLanguage: 8,
  fuzzySearchTerm: 9,
  relationPrior: 10,
};

export const MATCH_CLASS_CEILINGS: Record<MatchClass, number> = {
  exactCategoryName: 1.0,
  exactCanonicalTerm: 0.98,
  exactSearchTerm: 0.94,
  exactSkillTag: 0.90,
  aliasExact: 0.86,
  serviceIntentPhrase: 0.80,
  prefixSearchTerm: 0.76,
  problemLanguage: 0.74,
  fuzzySearchTerm: 0.62,
  relationPrior: 0.50,
};

function correctCategoryTypos(shadowQuery: string): string {
  const words = shadowQuery.split(/\s+/);
  let changed = false;
  const corrected = words.map((w) => {
    if (w.length >= 6 && !taxonomyIndex.categoryNameTokens.has(w) && !STOP_WORDS.has(w)) {
      for (const [target] of taxonomyIndex.categoryNameTokens.entries()) {
        if (Math.abs(target.length - w.length) <= 1) {
          const fz = isFuzzyMatch(w, target);
          if (fz.isMatch) {
            changed = true;
            return target;
          }
        }
      }
    }
    return w;
  });
  return changed ? corrected.join(' ') : shadowQuery;
}

interface CandidateAccumulator {
  category: TaxonomyCategory;
  matchClass: MatchClass;
  matchedTerms: Map<string, { field: string; weight: number; specificity: number; tokenCount: number }>;
  matchedQueryTokens: Set<string>;
  longestMatchedPhraseTokens: number;
  highestFieldWeight: number;
  highestSpecificity: number;
  specificitySum: number;
  problemOverlapScore: number;
  contextBoost: number;
  isWholeQueryMatch: boolean;
  toolPriorityScore: number;
}

/**
 * Searches the Operis taxonomy categories for a given user query using the v5 ranking engine.
 */
export function searchCategories(
  rawQuery: string,
  options: SearchOptions = {}
): SearchResult[] {
  if (!rawQuery) return [];

  const sanitized = sanitizeRawQuery(rawQuery);
  if (!sanitized.trim()) return [];

  const bounded = sanitized.length > MAX_QUERY_LENGTH ? sanitized.slice(0, MAX_QUERY_LENGTH) : sanitized;
  const normQuery = normalizeSearchQuery(bounded);
  if (!normQuery) return [];

  const shadowQuery = toAsciiShadow(normQuery);
  const { coreQuery, hasHiringIntent } = cleanHiringIntent(shadowQuery);
  const typoCorrectedCore = correctCategoryTypos(coreQuery);
  const coreShadow = toAsciiShadow(typoCorrectedCore);

  const limit = options.limit ?? 10;
  const enableFuzzy = options.enableFuzzy ?? true;
  const enableDisambiguation = options.enableDisambiguation ?? true;
  const enableRelationPrior = options.enableRelationPrior ?? true;
  const minScore = options.minScore ?? 0.25;

  const candidates = new Map<string, CandidateAccumulator>();

  const getOrCreate = (cat: TaxonomyCategory): CandidateAccumulator => {
    let acc = candidates.get(cat.slug);
    if (!acc) {
      acc = {
        category: cat,
        matchClass: 'relationPrior',
        matchedTerms: new Map(),
        matchedQueryTokens: new Set(),
        longestMatchedPhraseTokens: 0,
        highestFieldWeight: 0,
        highestSpecificity: 0,
        specificitySum: 0,
        problemOverlapScore: 0,
        contextBoost: 0,
        isWholeQueryMatch: false,
        toolPriorityScore: 0,
      };
      candidates.set(cat.slug, acc);
    }
    return acc;
  };

  const registerMatch = (
    cat: TaxonomyCategory,
    term: string,
    field: string,
    weight: number,
    specificity: number,
    matchedTokens: string[],
    matchClass: MatchClass,
    isWhole: boolean
  ) => {
    const acc = getOrCreate(cat);
    acc.matchedTerms.set(term, {
      field,
      weight,
      specificity,
      tokenCount: matchedTokens.length,
    });

    for (const tok of matchedTokens) {
      acc.matchedQueryTokens.add(tok);
    }

    if (matchedTokens.length > acc.longestMatchedPhraseTokens) {
      acc.longestMatchedPhraseTokens = matchedTokens.length;
    }
    if (weight > acc.highestFieldWeight) {
      acc.highestFieldWeight = weight;
    }
    if (specificity > acc.highestSpecificity) {
      acc.highestSpecificity = specificity;
    }
    acc.specificitySum += specificity;

    if (MATCH_CLASS_ORDER[matchClass] < MATCH_CLASS_ORDER[acc.matchClass]) {
      acc.matchClass = matchClass;
    }

    if (isWhole) {
      acc.isWholeQueryMatch = true;
    }

    // Tool collision canonical resolution
    const termShadow = toAsciiShadow(term);
    if (TOOL_COLLISION_PRIORITY[termShadow] === cat.slug) {
      acc.toolPriorityScore = 0.08;
      if (acc.matchClass === 'exactSkillTag') {
        acc.matchClass = 'exactSearchTerm';
        acc.highestFieldWeight = Math.max(acc.highestFieldWeight, 0.94);
      }
    }
  };

  // 0. Curated typo corpus lookup
  const typoSlug =
    taxonomyIndex.typoMap.get(normQuery) ||
    taxonomyIndex.typoMap.get(shadowQuery) ||
    taxonomyIndex.typoMap.get(typoCorrectedCore) ||
    (coreQuery ? (taxonomyIndex.typoMap.get(coreQuery) || taxonomyIndex.typoMap.get(coreShadow)) : undefined);
  if (typoSlug) {
    const cat = taxonomyIndex.getCategory(typoSlug);
    if (cat) {
      registerMatch(
        cat,
        normQuery,
        'typoCorpus',
        0.95,
        1.0,
        tokenizeQuery(coreQuery || normQuery),
        'fuzzySearchTerm',
        true
      );
    }
  }

  // 1. Whole Query Direct Match
  const checkWholeMatch = (queryVariant: string) => {
    const exactCat =
      taxonomyIndex.categoryByName.get(queryVariant) ||
      taxonomyIndex.categoryByName.get(toAsciiShadow(queryVariant));
    if (exactCat) {
      registerMatch(
        exactCat,
        queryVariant,
        'categoryName',
        1.0,
        1.0,
        tokenizeQuery(queryVariant),
        'exactCategoryName',
        true
      );
    }

    const canonCats =
      taxonomyIndex.canonicalTerms.get(queryVariant) ||
      taxonomyIndex.canonicalTerms.get(toAsciiShadow(queryVariant));
    if (canonCats) {
      for (const slug of canonCats) {
        const cat = taxonomyIndex.getCategory(slug);
        if (cat) {
          registerMatch(
            cat,
            queryVariant,
            'canonical',
            0.98,
            1.0,
            tokenizeQuery(queryVariant),
            'exactCanonicalTerm',
            true
          );
        }
      }
    }

    const directEntries =
      taxonomyIndex.termIndex.get(queryVariant) ||
      taxonomyIndex.termIndex.get(toAsciiShadow(queryVariant));
    if (directEntries) {
      for (const entry of directEntries) {
        const cat = taxonomyIndex.getCategory(entry.categorySlug);
        if (cat) {
          let mClass: MatchClass = 'exactSearchTerm';
          if (entry.field === 'canonical') mClass = 'exactCanonicalTerm';
          else if (entry.field === 'skillTag') mClass = 'exactSkillTag';
          else if (entry.field === 'alias') mClass = 'aliasExact';
          else if (entry.field === 'serviceIntent') mClass = 'serviceIntentPhrase';

          registerMatch(
            cat,
            queryVariant,
            entry.field,
            entry.weight,
            entry.specificity,
            tokenizeQuery(queryVariant),
            mClass,
            true
          );
        }
      }
    }

    // Global alias match for whole query
    const gEquivs =
      taxonomyIndex.globalAliases.get(queryVariant) ||
      taxonomyIndex.globalAliases.get(toAsciiShadow(queryVariant));
    if (gEquivs) {
      for (const equiv of gEquivs) {
        const equivEntries =
          taxonomyIndex.termIndex.get(equiv) ||
          taxonomyIndex.termIndex.get(toAsciiShadow(equiv));
        if (equivEntries) {
          for (const entry of equivEntries) {
            const cat = taxonomyIndex.getCategory(entry.categorySlug);
            if (cat) {
              registerMatch(
                cat,
                equiv,
                'globalAlias',
                entry.weight * 0.95,
                entry.specificity,
                tokenizeQuery(queryVariant),
                'aliasExact',
                true
              );
            }
          }
        }
      }
    }
  };

  checkWholeMatch(normQuery);
  if (hasHiringIntent && coreQuery && coreQuery !== normQuery) {
    checkWholeMatch(coreQuery);
    if (typoCorrectedCore !== coreQuery) {
      checkWholeMatch(typoCorrectedCore);
    }
  } else if (typoCorrectedCore !== shadowQuery) {
    checkWholeMatch(typoCorrectedCore);
  }

  // 2. Token & N-Gram Candidate Matching
  const effectiveQuery = (hasHiringIntent && coreQuery) ? coreQuery : typoCorrectedCore;
  const queryTokens = tokenizeQuery(effectiveQuery);
  const ngrams = generateNGrams(queryTokens);

  for (const ngram of ngrams) {
    const shadowNGram = toAsciiShadow(ngram);
    const ngramTokens = ngram.split(' ');
    const isWhole = ngram === normQuery || ngram === coreQuery || ngram === typoCorrectedCore;

    // Check term index
    const entries =
      taxonomyIndex.termIndex.get(ngram) ||
      taxonomyIndex.termIndex.get(shadowNGram);
    if (entries) {
      for (const entry of entries) {
        const cat = taxonomyIndex.getCategory(entry.categorySlug);
        if (cat) {
          let mClass: MatchClass = 'exactSearchTerm';
          if (entry.field === 'canonical') mClass = 'exactCanonicalTerm';
          else if (entry.field === 'skillTag') mClass = 'exactSkillTag';
          else if (entry.field === 'alias') mClass = 'aliasExact';
          else if (entry.field === 'serviceIntent') mClass = 'serviceIntentPhrase';

          registerMatch(
            cat,
            ngram,
            entry.field,
            entry.weight,
            entry.specificity,
            ngramTokens,
            mClass,
            isWhole
          );
        }
      }
    }

    // Check stemmed ngram if single or double token
    if (ngramTokens.length <= 2) {
      const stemmedNGram = ngramTokens.map(stemTurkishWord).join(' ');
      if (stemmedNGram !== shadowNGram) {
        const stemmedEntries =
          taxonomyIndex.termIndex.get(stemmedNGram) ||
          taxonomyIndex.termIndex.get(toAsciiShadow(stemmedNGram));
        if (stemmedEntries) {
          for (const entry of stemmedEntries) {
            const cat = taxonomyIndex.getCategory(entry.categorySlug);
            if (cat) {
              registerMatch(
                cat,
                stemmedNGram,
                entry.field,
                entry.weight * 0.95,
                entry.specificity,
                ngramTokens,
                entry.field === 'canonical' ? 'exactCanonicalTerm' : 'exactSearchTerm',
                isWhole
              );
            }
          }
        }
      }
    }

    // Check global aliases for ngram
    const equivs =
      taxonomyIndex.globalAliases.get(ngram) ||
      taxonomyIndex.globalAliases.get(shadowNGram);
    if (equivs) {
      for (const equiv of equivs) {
        const equivEntries =
          taxonomyIndex.termIndex.get(equiv) ||
          taxonomyIndex.termIndex.get(toAsciiShadow(equiv));
        if (equivEntries) {
          for (const entry of equivEntries) {
            const cat = taxonomyIndex.getCategory(entry.categorySlug);
            if (cat) {
              registerMatch(
                cat,
                equiv,
                'globalAlias',
                entry.weight * 0.9,
                entry.specificity,
                ngramTokens,
                'aliasExact',
                isWhole
              );
            }
          }
        }
      }
    }

    // Scoped category synonyms
    const synCats =
      taxonomyIndex.synonymIndex.get(ngram) ||
      taxonomyIndex.synonymIndex.get(shadowNGram);
    if (synCats) {
      for (const slug of synCats) {
        const cat = taxonomyIndex.getCategory(slug);
        if (cat) {
          registerMatch(cat, ngram, 'synonym', 0.85, 0.9, ngramTokens, 'aliasExact', isWhole);
        }
      }
    }
  }

  // Check TOOL_COLLISION_PRIORITY directly on core and full query
  for (const [toolTerm, prioritizedSlug] of Object.entries(TOOL_COLLISION_PRIORITY)) {
    const toolNorm = toAsciiShadow(toolTerm);
    if (
      coreShadow === toolNorm ||
      coreShadow.startsWith(toolNorm + ' ') ||
      coreShadow.endsWith(' ' + toolNorm) ||
      coreShadow.includes(' ' + toolNorm + ' ') ||
      shadowQuery === toolNorm ||
      shadowQuery.startsWith(toolNorm + ' ') ||
      shadowQuery.endsWith(' ' + toolNorm) ||
      shadowQuery.includes(' ' + toolNorm + ' ')
    ) {
      const cat = taxonomyIndex.getCategory(prioritizedSlug);
      if (cat) {
        const acc = getOrCreate(cat);
        acc.toolPriorityScore = 0.08;
        if (MATCH_CLASS_ORDER['exactSearchTerm'] < MATCH_CLASS_ORDER[acc.matchClass] || acc.matchClass === 'relationPrior') {
          acc.matchClass = 'exactSearchTerm';
          if (acc.highestFieldWeight < 0.94) {
            acc.highestFieldWeight = 0.94;
          }
        }
        for (const t of toolNorm.split(/\s+/)) {
          acc.matchedQueryTokens.add(t);
        }
      }
    }
  }

  // 3. Prefix Matching (Only for short queries length <= 3 tokens, query must prefix term)
  if (queryTokens.length <= 3 && normQuery.length >= 3) {
    for (const [term, entries] of taxonomyIndex.termIndex.entries()) {
      if (term.length > normQuery.length && term !== normQuery && term !== coreQuery) {
        let isPrefix = false;
        if (term.startsWith(normQuery + ' ') || term.startsWith(normQuery)) {
          isPrefix = true;
        } else if (coreQuery && (term.startsWith(coreQuery + ' ') || term.startsWith(coreQuery))) {
          isPrefix = true;
        }

        if (isPrefix) {
          for (const entry of entries) {
            const cat = taxonomyIndex.getCategory(entry.categorySlug);
            if (cat) {
              registerMatch(
                cat,
                term,
                'prefix',
                entry.weight * 0.80,
                entry.specificity,
                queryTokens,
                'prefixSearchTerm',
                false
              );
            }
          }
        }
      }
    }
  }

  // 4. Bounded Fuzzy Matching
  if (enableFuzzy && candidates.size === 0 && queryTokens.length <= 2) {
    const protectedList = PROTECTED_TOKENS as readonly string[];
    for (const token of queryTokens) {
      if (token.length >= 3 && !protectedList.includes(token)) {
        for (const [term, entries] of taxonomyIndex.termIndex.entries()) {
          if (!term.includes(' ') && Math.abs(term.length - token.length) <= 1) {
            const fuzzy = isFuzzyMatch(token, term);
            if (fuzzy.isMatch) {
              for (const entry of entries) {
                const cat = taxonomyIndex.getCategory(entry.categorySlug);
                if (cat) {
                  registerMatch(cat, term, 'fuzzy', 0.60, entry.specificity, [token], 'fuzzySearchTerm', false);
                }
              }
            }
          }
        }
      }
    }
  }

  // 5. Problem Language Overlap (Natural language queries) with Morphological Stemming
  const contentTokens = queryTokens.filter(
    (t) => !STOP_WORDS.has(t) && !STOP_WORDS.has(toAsciiShadow(t))
  );
  const stemmedContentTokens = contentTokens.map(stemTurkishWord);

  if (contentTokens.length >= 2) {
    for (const stmt of taxonomyIndex.stemmedProblemStatements) {
      let matchedCount = 0;
      for (let i = 0; i < contentTokens.length; i++) {
        const tok = contentTokens[i];
        const stem = stemmedContentTokens[i];
        if (!tok || !stem) continue;
        if (stmt.rawTokens.has(tok) || stmt.rawTokens.has(toAsciiShadow(tok)) || stmt.stemmedTokens.has(stem)) {
          matchedCount++;
        }
      }

      if (matchedCount >= 2) {
        const cat = taxonomyIndex.getCategory(stmt.categorySlug);
        if (cat) {
          const acc = getOrCreate(cat);
          const ratio = matchedCount / contentTokens.length;
          const probScore = ratio * 0.40;
          if (probScore > acc.problemOverlapScore) {
            acc.problemOverlapScore = probScore;
          }
          if (ratio >= 0.4) {
            if (MATCH_CLASS_ORDER['serviceIntentPhrase'] < MATCH_CLASS_ORDER[acc.matchClass] || acc.matchClass === 'relationPrior') {
              acc.matchClass = 'serviceIntentPhrase';
              if (acc.highestFieldWeight < 0.85) {
                acc.highestFieldWeight = 0.85;
              }
            }
          }
          if (matchedCount >= 3 && ratio >= 0.5) {
            if (acc.highestFieldWeight < 0.90) {
              acc.highestFieldWeight = 0.90;
            }
          }
          for (let i = 0; i < contentTokens.length; i++) {
            const tok = contentTokens[i];
            const stem = stemmedContentTokens[i];
            if (!tok || !stem) continue;
            if (stmt.rawTokens.has(tok) || stmt.rawTokens.has(toAsciiShadow(tok)) || stmt.stemmedTokens.has(stem)) {
              acc.matchedQueryTokens.add(tok);
            }
          }
        }
      }
    }
  }

  // 6. Context Disambiguation Rules
  if (enableDisambiguation) {
    const shadowTokens = shadowQuery.split(/\s+/);
    const stemmedShadowTokens = new Set(shadowTokens.map(stemTurkishWord));

    for (const [slug, acc] of candidates.entries()) {
      const disRule = taxonomyIndex.disambiguationRules.get(slug);
      if (!disRule) continue;

      // Positive context
      for (const pos of disRule.positiveContext) {
        const posWords = toAsciiShadow(pos).split(/\s+/);
        const firstPosWord = posWords[0] ?? "";
        const matchesPos =
          posWords.length > 1
            ? posWords.every((w) => shadowQuery.includes(w) || stemmedShadowTokens.has(stemTurkishWord(w)))
            : shadowQuery.includes(firstPosWord) || stemmedShadowTokens.has(stemTurkishWord(firstPosWord));
        if (matchesPos) {
          acc.contextBoost += 0.15;
          break;
        }
      }

      // Soft negative context (Only if not whole categoryName or canonical match)
      const isExactCategoryOrCanon = acc.isWholeQueryMatch && (acc.matchClass === 'exactCategoryName' || acc.matchClass === 'exactCanonicalTerm');
      if (!isExactCategoryOrCanon) {
        for (const neg of disRule.softNegativeContext) {
          const negWords = toAsciiShadow(neg.term).split(/\s+/);
          const firstNegWord = negWords[0] ?? "";
          const matchesNeg =
            negWords.length > 1
              ? negWords.every((w) => shadowQuery.includes(w) || stemmedShadowTokens.has(stemTurkishWord(w)))
              : shadowQuery.includes(firstNegWord) || stemmedShadowTokens.has(stemTurkishWord(firstNegWord));
          if (matchesNeg) {
            acc.contextBoost += neg.penalty;
            const towardCat = taxonomyIndex.getCategory(neg.towardCategorySlug);
            if (towardCat) {
              const towardAcc = getOrCreate(towardCat);
              towardAcc.contextBoost += Math.abs(neg.penalty) * 1.0;
            }
          }
        }
      }

      // Special semantic disambiguation: general contract review vs software contract
      if (slug === 'sozlesme-hazirlama-ve-inceleme') {
        if (shadowQuery.includes('yazilim') && (shadowQuery.includes('sozlesme') || shadowQuery.includes('anlasma'))) {
          acc.contextBoost -= 0.15;
          const swCat = taxonomyIndex.getCategory('freelance-ve-yazilim-hizmet-sozlesmeleri');
          if (swCat) {
            const swAcc = getOrCreate(swCat);
            swAcc.contextBoost += 0.15;
            if (MATCH_CLASS_ORDER['exactSearchTerm'] < MATCH_CLASS_ORDER[swAcc.matchClass] || swAcc.matchClass === 'relationPrior') {
              swAcc.matchClass = 'exactSearchTerm';
              swAcc.highestFieldWeight = 0.94;
            }
          }
        }
      }
    }
  }

  // Filter by sector if provided in options
  if (options.sectorKey && options.sectorKey !== 'all') {
    for (const [slug] of candidates.entries()) {
      const repoKey = taxonomyIndex.getRepoKey(slug);
      const seedMatch = SEED_CATEGORIES.find((s) => s.key === repoKey);
      if (seedMatch && seedMatch.sectorKey !== options.sectorKey) {
        candidates.delete(slug);
      }
    }
  }

  // 7. Score Calculation
  const totalContentTokens = contentTokens.length > 0 ? contentTokens.length : queryTokens.length;
  const scoredResults: SearchResult[] = [];

  for (const acc of candidates.values()) {
    let finalScore: number;

    if (acc.isWholeQueryMatch) {
      const baseScore = MATCH_CLASS_CEILINGS[acc.matchClass] ?? 0.85;

      const specBonus = Math.min(0.18, (acc.highestSpecificity || 1.0) * 0.18);
      const ctxAdj = Math.max(-0.25, Math.min(0.20, acc.contextBoost));

      finalScore = baseScore + specBonus * 0.05 + ctxAdj + acc.toolPriorityScore;
    } else {
      const matchedContentCount = Array.from(acc.matchedQueryTokens).filter(
        (t) => !STOP_WORDS.has(t) && !STOP_WORDS.has(toAsciiShadow(t))
      ).length;

      const coverageRatio =
        totalContentTokens > 0 ? Math.min(1.0, matchedContentCount / totalContentTokens) : 0;
      const coverageBonus = coverageRatio * 0.15;

      const phraseRatio =
        totalContentTokens > 0 ? Math.min(1.0, acc.longestMatchedPhraseTokens / totalContentTokens) : 0;
      const phraseBonus = phraseRatio * 0.10;

      const fieldWeight = acc.highestFieldWeight > 0 ? acc.highestFieldWeight : 0.70;
      const baseLexical = fieldWeight * coverageRatio * 0.55;

      const specBonus = Math.min(0.15, acc.specificitySum * 0.03);
      const problemBonus = acc.problemOverlapScore;
      const ctxAdj = Math.max(-0.25, Math.min(0.20, acc.contextBoost));

      finalScore =
        baseLexical +
        coverageBonus +
        phraseBonus +
        specBonus +
        problemBonus +
        ctxAdj +
        acc.toolPriorityScore;
    }

    // STRICT MATCH CLASS CEILING
    const ceiling = MATCH_CLASS_CEILINGS[acc.matchClass] || 0.75;
    finalScore = Math.min(ceiling, finalScore);
    finalScore = Math.max(0.01, finalScore);

    if (finalScore >= minScore) {
      const coveredContentCount = Array.from(acc.matchedQueryTokens).filter(
        (t) => !STOP_WORDS.has(t) && !STOP_WORDS.has(toAsciiShadow(t))
      ).length;
      const coverageRatio = totalContentTokens > 0 ? Math.min(1.0, coveredContentCount / totalContentTokens) : 1.0;

      scoredResults.push({
        id: acc.category.id,
        slug: acc.category.slug,
        repoKey: taxonomyIndex.getRepoKey(acc.category.slug),
        name: acc.category.name,
        score: Number(finalScore.toFixed(4)),
        matchClass: acc.matchClass,
        matchedTerms: Array.from(acc.matchedTerms.keys()),
        queryCoverage: Number(coverageRatio.toFixed(4)),
        termSpecificity: Number((acc.highestSpecificity || 0).toFixed(4)),
        categorySpecificity: Number((acc.specificitySum || 0).toFixed(4)),
        relatedCategories: acc.category.relatedCategories,
      });
    }
  }

  // 8. Relation Prior (Small precision boost for strong relations)
  if (enableRelationPrior && scoredResults.length > 0) {
    scoredResults.sort((a, b) => b.score - a.score);
    const top = scoredResults[0];

    if (top && top.score >= 0.85) {
      const relations = taxonomyIndex.relationGraph.get(top.slug);
      if (relations) {
        for (const rel of relations) {
          if (rel.strength === 'strong') {
            const item = scoredResults.find((r) => r.slug === rel.slug);
            if (item && item.slug !== top.slug) {
              item.score = Math.min(top.score - 0.04, Number((item.score + 0.03).toFixed(4)));
            }
          }
        }
      }
    }
  }

  // 9. Stable Sort with Tie-Breakers according to ranking-config.json
  scoredResults.sort((a, b) => {
    // Significant score difference
    if (Math.abs(b.score - a.score) > 0.0001) {
      return b.score - a.score;
    }
    // 1. exactMatchClass
    const classDiff = MATCH_CLASS_ORDER[a.matchClass] - MATCH_CLASS_ORDER[b.matchClass];
    if (classDiff !== 0) return classDiff;

    // 2. queryCoverage
    if (Math.abs(b.queryCoverage - a.queryCoverage) > 0.01) {
      return b.queryCoverage - a.queryCoverage;
    }

    // 3. Tool priority tie-breaker (for colliding ambiguous tools)
    const accA = candidates.get(a.slug);
    const accB = candidates.get(b.slug);
    const toolDiff = (accB?.toolPriorityScore || 0) - (accA?.toolPriorityScore || 0);
    if (toolDiff !== 0) return toolDiff;

    // 4. termSpecificity
    if (Math.abs(b.termSpecificity - a.termSpecificity) > 0.01) {
      return b.termSpecificity - a.termSpecificity;
    }
    // 5. categorySpecificity
    if (Math.abs(b.categorySpecificity - a.categorySpecificity) > 0.01) {
      return b.categorySpecificity - a.categorySpecificity;
    }
    // 6. Stable ID
    return a.id - b.id;
  });

  return scoredResults.slice(0, limit);
}

// Alias for searchCategories adhering to Search v5 specification
export const searchV5 = searchCategories;
