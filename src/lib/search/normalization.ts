/**
 * Operis Search v5 — Normalization & Fuzzy Pipeline
 * Strictly adheres to docs/04_NORMALIZATION_AND_TYPO.md and data/normalization-rules.json.
 */

export const PROTECTED_TOKENS = [
  'c#',
  'c++',
  '.net',
  'ui/ux',
  '3d',
  '2d',
  'b2b',
  'b2c',
  'seo',
  'sem',
  'ppc',
  'kvkk',
  'gdpr',
  'llm',
  'rag',
  'api',
  'sdk',
  'ios',
] as const;

export const MAX_QUERY_LENGTH = 160;

/**
 * Strips null bytes and length-guards the raw query.
 */
export function sanitizeRawQuery(input: string): string {
  if (!input) return '';
  // Remove null bytes and control characters without triggering no-control-regex
  let clean = '';
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    if (
      code === 9 ||
      code === 10 ||
      code === 13 ||
      (code >= 32 && code !== 127)
    ) {
      clean += input[i];
    }
  }
  if (clean.length > MAX_QUERY_LENGTH) {
    return clean.slice(0, MAX_QUERY_LENGTH);
  }
  return clean;
}

/**
 * Turkish ASCII Shadow
 * ç -> c, ğ -> g, ı -> i, ö -> o, ş -> s, ü -> u
 */
export function toAsciiShadow(str: string): string {
  return str
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u');
}

/**
 * Normalizes text according to the 9-stage Operis v5 pipeline:
 * 1. unicode_nfkc
 * 2. trim_collapse_whitespace
 * 3. turkish_locale_lowercase
 * 4. protected_token_preservation
 * 5. soft_punctuation_normalization
 */
export function normalizeSearchQuery(rawInput: string): string {
  if (!rawInput) return '';
  const sanitized = sanitizeRawQuery(rawInput);
  if (!sanitized.trim()) return '';

  // 1. Unicode NFKC
  let text = sanitized.normalize('NFKC');

  // 2. Trim & collapse whitespace
  text = text.trim().replace(/\s+/g, ' ');

  // 3. Turkish-aware lowercase
  // Explicitly handle Turkish dotted/dotless I before toLocaleLowerCase for robustness across Node environments
  text = text
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLocaleLowerCase('tr-TR');

  // 4. Protected token preservation
  // Protect tokens like c#, c++, .net, ui/ux with safe alphanumeric placeholders
  const protectedMap = new Map<string, string>();
  let placeholderCounter = 0;

  // Sort protected tokens by length descending so longer ones match first (e.g. c++ before c)
  const sortedProtected = [...PROTECTED_TOKENS].sort((a, b) => b.length - a.length);

  for (const token of sortedProtected) {
    // Escape regex special chars in token
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match only whole token or token at boundary
    const regex = new RegExp(`(^|\\s|[.,;:!?(){}\\[\\]])${escaped}($|\\s|[.,;:!?(){}\\[\\]])`, 'gi');

    text = text.replace(regex, (_match, prefix, suffix) => {
      const placeholder = `__prot${placeholderCounter++}__`;
      protectedMap.set(placeholder, token);
      return `${prefix}${placeholder}${suffix}`;
    });
  }

  // 5. Soft punctuation normalization
  // Replace punctuation characters with space, except our placeholder characters
  // Retain letters, digits, and underscores
  text = text.replace(/[^a-z0-9ğüşıöç_]/gi, ' ');

  // Collapse whitespaces
  text = text.trim().replace(/\s+/g, ' ');

  // Restore protected tokens
  for (const [placeholder, token] of protectedMap.entries()) {
    text = text.replaceAll(placeholder, token);
  }

  return text.trim();
}

/**
 * Splits normalized text into discrete tokens while preserving protected multi-char tokens.
 */
export function tokenizeQuery(normalized: string): string[] {
  if (!normalized) return [];
  return normalized.split(/\s+/).filter(Boolean);
}

/**
 * Generates unigrams, bigrams, and trigrams from a token list.
 */
export function generateNGrams(tokens: string[]): string[] {
  const ngrams: string[] = [];
  const len = tokens.length;

  // Unigrams
  for (let i = 0; i < len; i++) {
    const tok = tokens[i];
    if (tok) ngrams.push(tok);
  }

  // Bigrams
  for (let i = 0; i < len - 1; i++) {
    ngrams.push(`${tokens[i]} ${tokens[i + 1]}`);
  }

  // Trigrams
  for (let i = 0; i < len - 2; i++) {
    ngrams.push(`${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`);
  }

  return ngrams;
}

/**
 * Bounded Levenshtein Distance with early exit.
 * Returns infinity if distance exceeds maxAllowed.
 */
export function boundedLevenshtein(a: string, b: string, maxAllowed: number): number {
  if (a === b) return 0;
  const aLen = a.length;
  const bLen = b.length;

  if (Math.abs(aLen - bLen) > maxAllowed) return Infinity;
  if (aLen === 0) return bLen <= maxAllowed ? bLen : Infinity;
  if (bLen === 0) return aLen <= maxAllowed ? aLen : Infinity;

  // Single row DP
  let prevRow: number[] = new Array(bLen + 1);
  let currRow: number[] = new Array(bLen + 1);

  for (let j = 0; j <= bLen; j++) {
    prevRow[j] = j;
  }

  for (let i = 1; i <= aLen; i++) {
    currRow[0] = i;
    let minInRow = currRow[0];

    const aChar = a.charCodeAt(i - 1);

    for (let j = 1; j <= bLen; j++) {
      const cost = aChar === b.charCodeAt(j - 1) ? 0 : 1;
      const prevJ = prevRow[j] ?? 0;
      const currPrev = currRow[j - 1] ?? 0;
      const prevPrev = prevRow[j - 1] ?? 0;
      const val = Math.min(
        prevJ + 1,      // deletion
        currPrev + 1,  // insertion
        prevPrev + cost // substitution
      );
      currRow[j] = val;
      if (val < minInRow) {
        minInRow = val;
      }
    }

    if (minInRow > maxAllowed) {
      return Infinity;
    }

    // Swap rows
    const temp = prevRow;
    prevRow = currRow;
    currRow = temp;
  }

  const result = prevRow[bLen] ?? Infinity;
  return result <= maxAllowed ? result : Infinity;
}

/**
 * Checks fuzzy match according to authoritative fuzzy policy:
 * - 1-2 chars: disabled
 * - 3-4 chars: max edit distance 1
 * - 5+ chars: max edit distance 1 (distance 2 only when candidate len >= 8)
 * - Protected tokens: never mutated
 */
export function isFuzzyMatch(
  queryToken: string,
  targetToken: string
): { isMatch: boolean; distance: number } {
  if (queryToken === targetToken) {
    return { isMatch: true, distance: 0 };
  }

  // Never fuzzy match protected tokens
  const protectedList = PROTECTED_TOKENS as readonly string[];
  if (protectedList.includes(queryToken) || protectedList.includes(targetToken)) {
    return { isMatch: false, distance: Infinity };
  }

  const qLen = queryToken.length;
  const tLen = targetToken.length;

  // 1-2 chars: disabled
  if (qLen <= 2 || tLen <= 2) {
    return { isMatch: false, distance: Infinity };
  }

  // 3-4 chars: max edit 1
  if (qLen <= 4 || tLen <= 4) {
    const dist = boundedLevenshtein(queryToken, targetToken, 1);
    return { isMatch: dist <= 1, distance: dist };
  }

  // 5+ chars: max edit 1 (distance 2 allowed only if both words are >= 8 characters)
  const maxDist = (qLen >= 8 && tLen >= 8) ? 2 : 1;
  const dist = boundedLevenshtein(queryToken, targetToken, maxDist);
  return { isMatch: dist <= maxDist, distance: dist };
}

export const TURKISH_SUFFIXES = [
  'larindan', 'lerinden',
  'larinda', 'lerinde',
  'larini', 'lerini',
  'larina', 'lerine',
  'larinin', 'lerinin',
  'sindan', 'sinden',
  'larin', 'lerin',
  'lardan', 'lerden',
  'sinda', 'sinde',
  'larda', 'lerde',
  'lara', 'lere',
  'lari', 'leri',
  'minden', 'mindan',
  'minde', 'minda',
  'undan', 'unden', 'indan', 'inden',
  'unda', 'unde', 'inda', 'inde',
  'larim', 'lerim',
  'ndan', 'nden',
  'nda', 'nde',
  'sini', 'sine',
  'sinin',
  'yla', 'yle',
  'unu', 'unu', 'ini', 'ini',
  'lar', 'ler',
  'dan', 'den', 'tan', 'ten',
  'nin', 'nin', 'nun', 'nun',
  'da', 'de', 'ta', 'te',
  'ya', 'ye', 'na', 'ne',
  'yi', 'yi', 'yu', 'yu',
  'min', 'min', 'mun', 'mun',
  'in', 'in', 'un', 'un',
  'im', 'im', 'um', 'um',
  'si', 'si', 'su', 'su',
];

export const STOP_WORDS = new Set([
  've', 'ile', 'veya', 'icin', 'için', 'bir', 'bu', 'bunu', 'olan', 'de', 'da',
  'mi', 'mu', 'mü', 'var', 'yok', 'cok', 'çok', 'daha', 'en', 'gibi', 'kadar',
  'biri', 'lazim', 'lazım', 'istiyorum', 'ariyorum', 'arıyorum', 'yaptirmak',
  'yaptırmak', 'almak', 'etmek', 'eden', 'yapan', 'uzman', 'freelancer',
  'destek', 'hizmet', 'hizmeti', 'konusunda', 'isini', 'işini', 'deneyimli',
  'profesyonel', 'gerekiyor', 'istek', 'ihtiyacim', 'ihtiyacım', 'biri', 'biriyle',
  'icin', 'için', 'danismanlik', 'danışmanlık', 'hizmetleri', 'olarak',
  'tasarlatmak', 'hazirlatmak', 'yazdirmak'
]);

export const INTENT_PREFIXES = [
  'mevcut projemde',
  'mevcut projem için',
  'mevcut projem icin',
  'yeni projem icin',
  'yeni projem için',
  'projem icin',
  'projem için',
  'sirketim icin',
  'şirketim için',
  'bana bir',
  'yeni bir',
].sort((a, b) => b.length - a.length);

export const INTENT_SUFFIXES = [
  'konusunda benzer isler yapmis bir freelancer ariyorum',
  'konusunda benzer işler yapmış bir freelancer arıyorum',
  'konusunda tecrubeli bir freelancer lazim',
  'konusunda tecrübeli bir freelancer lazım',
  'konusunda uzman birine ihtiyacim var',
  'konusunda uzman birine ihtiyacım var',
  'konusunda destek ariyorum',
  'konusunda destek arıyorum',
  'konusunda yardim ariyorum',
  'konusunda yardım arıyorum',
  'isini yapacak deneyimli bir freelancer ariyorum',
  'işini yapacak deneyimli bir freelancer arıyorum',
  'yapacak deneyimli bir freelancer ariyorum',
  'yapacak deneyimli bir freelancer arıyorum',
  'bilen bir freelancer ariyorum',
  'bilen bir freelancer arıyorum',
  'bilen bir uzman ariyorum',
  'bilen bir uzman arıyorum',
  'bilen birine ihtiyacim var',
  'bilen birine ihtiyacım var',
  'bilen birini ariyorum',
  'bilen birini arıyorum',
  'bilen uzman ariyorum',
  'bilen uzman arıyorum',
  'yapacak gelistirici ariyorum',
  'yapacak geliştirici arıyorum',
  'yapacak freelancer ariyorum',
  'yapacak freelancer arıyorum',
  'yapacak uzman ariyorum',
  'yapacak uzman arıyorum',
  'yapacak gelistirici',
  'yapacak geliştirici',
  'isini disaridan yaptirmak istiyorum',
  'işini dışarıdan yaptırmak istiyorum',
  'icin teklif almak istiyorum',
  'için teklif almak istiyorum',
  'icin uzman ariyorum',
  'için uzman arıyorum',
  'icin gelistirici ariyorum',
  'için geliştirici arıyorum',
  'icin freelancer ariyorum',
  'için freelancer arıyorum',
  'yaptirmak istiyorum',
  'yaptırmak istiyorum',
  'tasarlatmak istiyorum',
  'hazirlatmak istiyorum',
  'hazırlatmak istiyorum',
  'almak istiyorum',
  'destegi ariyorum',
  'desteği arıyorum',
  'hizmeti almak istiyorum',
  'hizmetleri almak istiyorum',
  'uzmani ariyorum',
  'uzmanı arıyorum',
  'freelancer ariyorum',
  'freelancer arıyorum',
  'gelistirici ariyorum',
  'geliştirici arıyorum',
  'uzman ariyorum',
  'uzman arıyorum',
  'destek ariyorum',
  'destek arıyorum',
  'biri lazim',
  'biri lazım',
  'birisi lazim',
  'birisi lazım',
  'hizmetleri',
  'danismanligi',
  'danışmanlığı',
  'danismanlik',
  'danışmanlık',
  'istiyorum',
  'ariyorum',
  'arıyorum',
  'lazim',
  'lazım',
].sort((a, b) => b.length - a.length);

export function stemTurkishWord(raw: string): string {
  let w = toAsciiShadow(raw.toLowerCase().trim());
  if (w.length <= 3) return w;
  for (const suf of TURKISH_SUFFIXES) {
    if (w.endsWith(suf) && (w.length - suf.length) >= 3) {
      if ((suf === 'nun' || suf === 'nin') && (w.slice(0, -suf.length) === 'oy' || w.slice(0, -suf.length) === 'oyu')) continue;
      w = w.slice(0, -suf.length);
      break;
    }
  }
  // Strip trailing 1st person possessive 'm' after vowel (e.g. uygulamam -> uygulama)
  if (w.length >= 6 && w.endsWith('m') && /[aeiou]m$/.test(w)) {
    w = w.slice(0, -1);
  }
  if (w.length >= 5 && /[aeiou]$/.test(w)) {
    const candidate = w.slice(0, -1);
    if (!/[aeiou]$/.test(candidate) && candidate.length >= 4) {
      w = candidate;
    }
  }
  return w;
}

export function cleanHiringIntent(normQuery: string): { coreQuery: string; hasHiringIntent: boolean } {
  let shadow = toAsciiShadow(normQuery).trim();
  let hasHiringIntent = false;

  for (const prefix of INTENT_PREFIXES) {
    const normPrefix = toAsciiShadow(prefix);
    if (shadow.startsWith(normPrefix + ' ')) {
      shadow = shadow.slice(normPrefix.length + 1).trim();
      hasHiringIntent = true;
      break;
    }
  }

  for (const suffix of INTENT_SUFFIXES) {
    const normSuffix = toAsciiShadow(suffix);
    if (shadow.endsWith(' ' + normSuffix)) {
      shadow = shadow.slice(0, -(normSuffix.length + 1)).trim();
      hasHiringIntent = true;
      break;
    }
  }

  return { coreQuery: shadow, hasHiringIntent };
}
