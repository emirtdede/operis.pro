/**
 * Operis Search v5 — Type Definitions
 * Authoritative taxonomy and ranking interfaces.
 */

export interface TaxonomyCategory {
  id: number;
  slug: string;
  name: string;
  canonicalTerms: string[];
  searchTerms: string[];
  skillTags: string[];
  aliases: string[];
  serviceIntents: string[];
  relatedCategories: CategoryRelation[];
  negativeTerms?: string[];
  weightedTermsRef: string;
  relationGraphRef: string;
  disambiguationRef: string;
  typoCorpusRef: string;
  longTailCorpusRef: string;
  problemLanguageRef: string;
  synonymRef: string;
  locale?: string[];
  searchBoost?: number;
  status?: string;
}

export interface CategoryRelation {
  slug: string;
  name: string;
  score: number;
  strength: 'strong' | 'medium' | 'weak';
  sharedFamilies?: string[];
}

export interface TermWeight {
  term: string;
  normalized: string;
  field: 'canonical' | 'searchTerm' | 'skillTag' | 'alias' | 'serviceIntent' | string;
  categoryDocumentFrequency: number;
  specificity: number;
  weight: number;
}

export interface DisambiguationNegativeRule {
  term: string;
  towardCategorySlug: string;
  penalty: number;
  reason?: string;
}

export interface DisambiguationRule {
  positiveContext: string[];
  softNegativeContext: DisambiguationNegativeRule[];
  hardExclusions: string[];
}

export interface CollisionEntry {
  term: string;
  categoryCount: number;
  severity: 'high' | 'medium' | 'low';
  categorySlugs: string[];
  resolution?: string;
}

export type MatchClass =
  | 'exactCategoryName'
  | 'exactCanonicalTerm'
  | 'exactSearchTerm'
  | 'exactSkillTag'
  | 'prefixSearchTerm'
  | 'aliasExact'
  | 'serviceIntentPhrase'
  | 'problemLanguage'
  | 'fuzzySearchTerm'
  | 'relationPrior';

export interface SearchResult {
  id: number;
  slug: string;
  repoKey: string;
  name: string;
  score: number;
  matchClass: MatchClass;
  matchedTerms: string[];
  queryCoverage: number;
  termSpecificity: number;
  categorySpecificity: number;
  relatedCategories?: CategoryRelation[];
}

export interface SearchOptions {
  limit?: number;
  minScore?: number;
  sectorKey?: string;
  enableFuzzy?: boolean;
  enableDisambiguation?: boolean;
  enableRelationPrior?: boolean;
}

export interface SearchTelemetryEvent {
  event: 'search_started' | 'search_results_shown' | 'search_result_clicked' | 'search_zero_result' | 'search_query_refined' | 'search_category_selected';
  queryLength: number;
  latencyMs: number;
  top1Slug?: string;
  resultCount: number;
  isZeroResult: boolean;
  timestamp: string;
}
