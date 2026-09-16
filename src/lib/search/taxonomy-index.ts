/**
 * Operis Search v5 — Taxonomy Index
 * Compiles in-memory lookup maps and inverted indexes for all 110 categories.
 */

import taxonomyData from './data/categories.search-taxonomy.json';
import termWeightsData from './data/term-weights.json';
import categorySynonymsData from './data/category-synonyms.json';
import relationGraphData from './data/relation-graph.json';
import disambiguationData from './data/disambiguation-rules.json';
import collisionMatrixData from './data/collision-matrix.json';
import globalAliasesData from './data/global-aliases.json';
import problemAliasesData from './data/problem-aliases.json';
import problemCorpusData from './data/problem-language-corpus.json';
import typoCorpusData from './data/typo-corpus.json';
import { SEED_CATEGORIES } from '@/db/seeds/categories';
import {
  TaxonomyCategory,
  CategoryRelation,
  TermWeight,
  DisambiguationRule,
  CollisionEntry,
} from './types';
import { normalizeSearchQuery, toAsciiShadow, stemTurkishWord } from './normalization';

export const TOOL_COLLISION_PRIORITY: Record<string, string> = {
  'apollo': 'potansiyel-musteri-ve-veri-zenginlestirme',
  'n8n': 'otomasyon-ve-entegrasyonlar',
  'bubble': 'no-code-ve-low-code-gelistirme',
  'premiere pro': 'youtube-ve-uzun-format-video-kurgusu',
  'pro tools': 'ses-tasarimi-ve-efektleri-sfx',
  'transcription': 'ses-ve-video-desifre-destegi',
  'contract drafting': 'freelance-ve-yazilim-hizmet-sozlesmeleri',
  'sql': 'veri-muhendisligi-ve-analitik',
  'python': 'web-kazima-ve-veri-madenciligi',
  'excel': 'finansal-modelleme-ve-fizibilite',
  'illustrator': 'ambalaj-etiket-ve-baski-tasarimi',
  'adobe audition': 'podcast-duzenleme-ve-ses-muhendisligi',
  'c sharp': 'masaustu-yazilim-gelistirme',
  'crm': 'e-posta-pazarlamasi-ve-crm-akislari',
  'blender': '3d-oyun-varliklari-ve-karakter-modelleme',
  'ai otomasyon': 'yapay-zeka-ajanlari-ve-is-akislari',
  'ai strategy': 'prompt-muhendisligi-ve-ai-danismanligi',
  'ai danismanligi': 'prompt-muhendisligi-ve-ai-danismanligi',
  'online satis sitesi': 'e-ticaret-sitesi-gelistirme',
  'online satış sitesi': 'e-ticaret-sitesi-gelistirme',
  'uygulamamin arayuzunu tasarlatmak': 'ui-ux-tasarim',
  'uygulamamin arayuzunu': 'ui-ux-tasarim',
  'uygulamamın arayüzü': 'ui-ux-tasarim',
  'uygulama arayuzu': 'ui-ux-tasarim',
  'uygulama arayuzunu': 'ui-ux-tasarim',
  'nodejs': 'backend-ve-api-muhendisligi',
  'node.js': 'backend-ve-api-muhendisligi',
  'unity': 'unity-ile-oyun-gelistirme',
  'figma tasarimci': 'ui-ux-tasarim',
};

export interface IndexedTerm {
  categorySlug: string;
  field: 'canonical' | 'searchTerm' | 'skillTag' | 'alias' | 'serviceIntent';
  weight: number;
  specificity: number;
}

export interface ProblemStatement {
  categorySlug: string;
  original: string;
  normalized: string;
  tokens: Set<string>;
}

class TaxonomyIndex {
  private static instance: TaxonomyIndex | null = null;

  public readonly categories: TaxonomyCategory[];
  public readonly categoriesBySlug: Map<string, TaxonomyCategory> = new Map();
  public readonly categoriesById: Map<number, TaxonomyCategory> = new Map();
  public readonly slugToRepoKey: Map<string, string> = new Map();
  public readonly repoKeyToSlug: Map<string, string> = new Map();

  // Inverted lexical term index: normalized term -> array of IndexedTerm
  public readonly termIndex: Map<string, IndexedTerm[]> = new Map();

  // Exact category name lookup
  public readonly categoryByName: Map<string, TaxonomyCategory> = new Map();

  // Exact canonical term lookup
  public readonly canonicalTerms: Map<string, Set<string>> = new Map();

  // Global aliases: normalized alias -> target normalized term(s)
  public readonly globalAliases: Map<string, string[]> = new Map();

  // Problem aliases: normalized phrase -> target category slugs
  public readonly problemAliases: Map<string, string[]> = new Map();

  // Scoped category synonyms: categorySlug -> Set of normalized synonyms
  public readonly categorySynonyms: Map<string, Set<string>> = new Map();

  // Reverse synonym index: normalized synonym -> category slugs
  public readonly synonymIndex: Map<string, Set<string>> = new Map();

  // Term weights lookup: categorySlug -> Map(normalizedTerm -> TermWeight)
  public readonly termWeightsBySlug: Map<string, Map<string, TermWeight>> = new Map();

  // Disambiguation rules: categorySlug -> DisambiguationRule
  public readonly disambiguationRules: Map<string, DisambiguationRule> = new Map();

  // Relation graph: categorySlug -> CategoryRelation[]
  public readonly relationGraph: Map<string, CategoryRelation[]> = new Map();

  // Collisions: normalized term -> CollisionEntry
  public readonly collisions: Map<string, CollisionEntry> = new Map();

  // Problem statements corpus
  public readonly problemStatements: ProblemStatement[] = [];
  public readonly problemTokenToSlugs: Map<string, Map<string, number>> = new Map();

  // Curated typo corpus
  public readonly typoMap: Map<string, string> = new Map();

  // Vocabulary of category name tokens for edit-distance-1 typos
  public readonly categoryNameTokens: Map<string, string> = new Map();

  // Pre-stemmed problem statements
  public readonly stemmedProblemStatements: Array<{
    categorySlug: string;
    rawTokens: Set<string>;
    stemmedTokens: Set<string>;
  }> = [];

  private constructor() {
    this.categories = taxonomyData.categories as unknown as TaxonomyCategory[];

    this.initCategoryMappings();
    this.initTermWeights();
    this.initSynonyms();
    this.initAliases();
    this.initDisambiguation();
    this.initRelationGraph();
    this.initCollisions();
    this.initLexicalIndex();
    this.initProblemCorpus();
    this.initTypoCorpus();
    this.initStemmedProblemStatements();
  }

  public static getInstance(): TaxonomyIndex {
    if (!TaxonomyIndex.instance) {
      TaxonomyIndex.instance = new TaxonomyIndex();
    }
    return TaxonomyIndex.instance;
  }

  private initCategoryMappings(): void {
    // Build seed by normalized Turkish name
    const seedByName = new Map(
      SEED_CATEGORIES.map((s) => [
        normalizeSearchQuery(s.translations.tr.name),
        s,
      ])
    );

    for (const cat of this.categories) {
      this.categoriesBySlug.set(cat.slug, cat);
      this.categoriesById.set(cat.id, cat);

      const normName = normalizeSearchQuery(cat.name);
      this.categoryByName.set(normName, cat);
      this.categoryByName.set(toAsciiShadow(normName), cat);

      const seedMatch = seedByName.get(normName) || seedByName.get(toAsciiShadow(normName));
      if (seedMatch) {
        this.slugToRepoKey.set(cat.slug, seedMatch.key);
        this.repoKeyToSlug.set(seedMatch.key, cat.slug);
      } else {
        // Fallback: use cat.slug as repoKey
        this.slugToRepoKey.set(cat.slug, cat.slug);
        this.repoKeyToSlug.set(cat.slug, cat.slug);
      }
    }
  }

  private initTermWeights(): void {
    const rawWeights = termWeightsData.categoriesBySlug as Record<string, TermWeight[]>;
    for (const [slug, weights] of Object.entries(rawWeights)) {
      const termMap = new Map<string, TermWeight>();
      for (const w of weights) {
        const norm = normalizeSearchQuery(w.normalized || w.term);
        termMap.set(norm, w);
        const shadow = toAsciiShadow(norm);
        if (shadow !== norm) {
          termMap.set(shadow, w);
        }
      }
      this.termWeightsBySlug.set(slug, termMap);
    }
  }

  private initSynonyms(): void {
    const rawSynonyms = categorySynonymsData.categoriesBySlug as Record<string, string[]>;
    for (const [slug, synList] of Object.entries(rawSynonyms)) {
      const synSet = new Set<string>();
      for (const syn of synList) {
        const norm = normalizeSearchQuery(syn);
        synSet.add(norm);
        synSet.add(toAsciiShadow(norm));

        // Inverted index
        if (!this.synonymIndex.has(norm)) {
          this.synonymIndex.set(norm, new Set());
        }
        this.synonymIndex.get(norm)!.add(slug);

        const shadow = toAsciiShadow(norm);
        if (shadow !== norm) {
          if (!this.synonymIndex.has(shadow)) {
            this.synonymIndex.set(shadow, new Set());
          }
          this.synonymIndex.get(shadow)!.add(slug);
        }
      }
      this.categorySynonyms.set(slug, synSet);
    }
  }

  private initAliases(): void {
    // Global aliases
    const rawGlobal = globalAliasesData.aliases as Record<string, string[]>;
    for (const [canonical, aliasList] of Object.entries(rawGlobal)) {
      const normCanonical = normalizeSearchQuery(canonical);
      const canonAliases = new Set<string>();

      for (const rawAlias of aliasList) {
        const normAlias = normalizeSearchQuery(rawAlias);
        if (!normAlias || normAlias === normCanonical) continue;

        canonAliases.add(normAlias);

        // Reverse mapping: alias -> canonical
        if (!this.globalAliases.has(normAlias)) {
          this.globalAliases.set(normAlias, [normCanonical]);
        } else {
          const list = this.globalAliases.get(normAlias)!;
          if (!list.includes(normCanonical)) {
            list.push(normCanonical);
          }
        }

        const shadow = toAsciiShadow(normAlias);
        if (shadow !== normAlias) {
          canonAliases.add(shadow);
          if (!this.globalAliases.has(shadow)) {
            this.globalAliases.set(shadow, [normCanonical]);
          } else {
            const list = this.globalAliases.get(shadow)!;
            if (!list.includes(normCanonical)) {
              list.push(normCanonical);
            }
          }
        }
      }

      // Canonical -> aliases
      if (!this.globalAliases.has(normCanonical)) {
        this.globalAliases.set(normCanonical, Array.from(canonAliases));
      } else {
        const list = this.globalAliases.get(normCanonical)!;
        for (const a of canonAliases) {
          if (!list.includes(a)) {
            list.push(a);
          }
        }
      }

      const canonShadow = toAsciiShadow(normCanonical);
      if (canonShadow !== normCanonical) {
        if (!this.globalAliases.has(canonShadow)) {
          this.globalAliases.set(canonShadow, Array.from(canonAliases));
        }
      }
    }

    // Problem aliases
    const rawProblem = problemAliasesData.problemAliases as Record<string, string[]>;
    for (const [phrase, slugs] of Object.entries(rawProblem)) {
      const norm = normalizeSearchQuery(phrase);
      this.problemAliases.set(norm, slugs);
      const shadow = toAsciiShadow(norm);
      if (shadow !== norm) {
        this.problemAliases.set(shadow, slugs);
      }
    }
  }

  private initDisambiguation(): void {
    const rawDis = disambiguationData.categoriesBySlug as Record<string, DisambiguationRule>;
    for (const [slug, rule] of Object.entries(rawDis)) {
      const normalizedRule: DisambiguationRule = {
        positiveContext: rule.positiveContext.map((p) => normalizeSearchQuery(p)),
        softNegativeContext: rule.softNegativeContext.map((s) => ({
          ...s,
          term: normalizeSearchQuery(s.term),
        })),
        hardExclusions: rule.hardExclusions.map((h) => normalizeSearchQuery(h)),
      };
      this.disambiguationRules.set(slug, normalizedRule);
    }
  }

  private initRelationGraph(): void {
    const rawGraph = relationGraphData.categoriesBySlug as Record<
      string,
      Array<{ categorySlug: string; categoryName: string; score: number; strength: 'strong' | 'medium' | 'weak'; sharedFamilies?: string[] }>
    >;
    for (const [slug, rels] of Object.entries(rawGraph)) {
      const relations: CategoryRelation[] = rels.map((r) => ({
        slug: r.categorySlug,
        name: r.categoryName,
        score: r.score,
        strength: r.strength,
        sharedFamilies: r.sharedFamilies,
      }));
      this.relationGraph.set(slug, relations);
    }
  }

  private initCollisions(): void {
    const rawCollisions = collisionMatrixData.collisions as CollisionEntry[];
    for (const c of rawCollisions) {
      const norm = normalizeSearchQuery(c.term);
      this.collisions.set(norm, c);
      this.collisions.set(toAsciiShadow(norm), c);
    }
  }

  private initLexicalIndex(): void {
    for (const cat of this.categories) {
      const termWeights = this.termWeightsBySlug.get(cat.slug);

      const addTerm = (
        term: string,
        field: 'canonical' | 'searchTerm' | 'skillTag' | 'alias' | 'serviceIntent',
        defaultWeight: number
      ) => {
        const norm = normalizeSearchQuery(term);
        if (!norm) return;

        let weight = defaultWeight;
        let specificity = 1.0;

        if (termWeights?.has(norm)) {
          const tw = termWeights.get(norm)!;
          weight = tw.weight;
          specificity = tw.specificity;
        } else if (this.collisions.has(norm)) {
          const col = this.collisions.get(norm)!;
          specificity = Math.max(0.1, 1 / col.categoryCount);
        }

        const entry: IndexedTerm = {
          categorySlug: cat.slug,
          field,
          weight,
          specificity,
        };

        const registerNorm = (n: string) => {
          if (!this.termIndex.has(n)) {
            this.termIndex.set(n, []);
          }
          // Avoid duplicate entries for same category and field
          const list = this.termIndex.get(n)!;
          if (!list.some((it) => it.categorySlug === cat.slug && it.field === field)) {
            list.push(entry);
          }
        };

        registerNorm(norm);
        const shadow = toAsciiShadow(norm);
        if (shadow !== norm) {
          registerNorm(shadow);
        }
      };

      // Canonical terms
      for (const ct of cat.canonicalTerms) {
        addTerm(ct, 'canonical', 0.98);
        const norm = normalizeSearchQuery(ct);
        if (!this.canonicalTerms.has(norm)) {
          this.canonicalTerms.set(norm, new Set());
        }
        this.canonicalTerms.get(norm)!.add(cat.slug);
      }

      // Search terms
      for (const st of cat.searchTerms) {
        addTerm(st, 'searchTerm', 0.94);
      }

      // Skill tags
      for (const sk of cat.skillTags) {
        addTerm(sk, 'skillTag', 0.90);
      }

      // Aliases
      for (const al of cat.aliases) {
        addTerm(al, 'alias', 0.80);
      }

      // Service intents
      for (const si of cat.serviceIntents) {
        addTerm(si, 'serviceIntent', 0.78);
      }
    }
  }

  private initProblemCorpus(): void {
    const rawCorpus = problemCorpusData.categoriesBySlug as Record<string, string[]>;
    for (const [slug, statements] of Object.entries(rawCorpus)) {
      for (const stmt of statements) {
        const norm = normalizeSearchQuery(stmt);
        const tokens = new Set(norm.split(/\s+/).filter((t) => t.length >= 3));

        const probStmt: ProblemStatement = {
          categorySlug: slug,
          original: stmt,
          normalized: norm,
          tokens,
        };
        this.problemStatements.push(probStmt);

        for (const token of tokens) {
          if (!this.problemTokenToSlugs.has(token)) {
            this.problemTokenToSlugs.set(token, new Map());
          }
          const catMap = this.problemTokenToSlugs.get(token)!;
          catMap.set(slug, (catMap.get(slug) || 0) + 1);
        }
      }
    }
  }

  private initTypoCorpus(): void {
    const rawTypos = typoCorpusData.categoriesBySlug as Record<string, Array<{ input: string }>>;
    for (const [slug, entries] of Object.entries(rawTypos)) {
      for (const e of entries) {
        const norm = normalizeSearchQuery(e.input);
        this.typoMap.set(norm, slug);
        const shadow = toAsciiShadow(norm);
        if (shadow !== norm) {
          this.typoMap.set(shadow, slug);
        }
      }
    }

    // Build single-word vocabulary from category names for edit-distance-1 typos
    for (const cat of this.categories) {
      const norm = normalizeSearchQuery(cat.name);
      const shadow = toAsciiShadow(norm);
      for (const w of shadow.split(/\s+/)) {
        if (w.length >= 5) {
          this.categoryNameTokens.set(w, w);
        }
      }
    }
  }

  private initStemmedProblemStatements(): void {
    for (const stmt of this.problemStatements) {
      const words = stmt.normalized.split(/\s+/).filter((w) => w.length >= 3);
      this.stemmedProblemStatements.push({
        categorySlug: stmt.categorySlug,
        rawTokens: stmt.tokens,
        stemmedTokens: new Set(words.map(stemTurkishWord)),
      });
    }
  }

  public getCategory(slug: string): TaxonomyCategory | undefined {
    return this.categoriesBySlug.get(slug);
  }

  public getCategoryById(id: number): TaxonomyCategory | undefined {
    return this.categoriesById.get(id);
  }

  public getRepoKey(slug: string): string {
    return this.slugToRepoKey.get(slug) || slug;
  }
}

export const taxonomyIndex = TaxonomyIndex.getInstance();
