/**
 * Operis Search v5 — Telemetry & Analytics Pipeline
 * Adheres strictly to docs/06_ANALYTICS_AND_LEARNING.md and KVKK/GDPR privacy guidelines.
 */

export interface SearchTelemetryPayload {
  event:
    | 'search_started'
    | 'search_results_shown'
    | 'search_result_clicked'
    | 'search_zero_result'
    | 'search_query_refined'
    | 'search_category_selected';
  queryLength: number;
  queryHash?: string;
  latencyMs: number;
  top1Slug?: string;
  resultCount: number;
  isZeroResult: boolean;
  selectedSlug?: string;
  selectedRank?: number;
  matchClass?: string;
  timestamp: string;
}

interface LatencyStats {
  count: number;
  p50: number;
  p95: number;
  p99: number;
  zeroResultCount: number;
  zeroResultRate: number;
}

// In-memory sliding window ring buffer for high-performance server-side monitoring
const RECENT_EVENTS_LIMIT = 500;
const recentLatencies: number[] = [];
let totalSearches = 0;
let totalZeroResults = 0;

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Emits a structured telemetry event safely without blocking search execution.
 */
export function recordSearchTelemetry(
  event: SearchTelemetryPayload['event'],
  details: {
    rawQuery?: string;
    queryLength?: number;
    latencyMs: number;
    top1Slug?: string;
    resultCount: number;
    selectedSlug?: string;
    selectedRank?: number;
    matchClass?: string;
  }
): SearchTelemetryPayload {
  const queryLen = details.queryLength ?? details.rawQuery?.length ?? 0;
  const isZero = details.resultCount === 0;

  totalSearches++;
  if (isZero) totalZeroResults++;

  // Record latency in circular buffer
  if (details.latencyMs >= 0) {
    if (recentLatencies.length >= RECENT_EVENTS_LIMIT) {
      recentLatencies.shift();
    }
    recentLatencies.push(details.latencyMs);
  }

  const payload: SearchTelemetryPayload = {
    event,
    queryLength: queryLen,
    queryHash: details.rawQuery ? simpleHash(details.rawQuery) : undefined,
    latencyMs: Number(details.latencyMs.toFixed(2)),
    top1Slug: details.top1Slug,
    resultCount: details.resultCount,
    isZeroResult: isZero,
    selectedSlug: details.selectedSlug,
    selectedRank: details.selectedRank,
    matchClass: details.matchClass,
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === 'development' && isZero) {
    // Debug logging for zero-result queries in development
    console.info(`[SearchTelemetry] Zero results for query length=${queryLen}, latency=${payload.latencyMs}ms`);
  }

  return payload;
}

/**
 * Calculates latency percentiles and performance metrics.
 */
export function getSearchPerformanceStats(): LatencyStats {
  if (recentLatencies.length === 0) {
    return {
      count: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      zeroResultCount: totalZeroResults,
      zeroResultRate: 0,
    };
  }

  const sorted = [...recentLatencies].sort((a, b) => a - b);
  const getPercentile = (p: number): number => {
    const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
    return Number((sorted[idx] ?? 0).toFixed(2));
  };

  return {
    count: sorted.length,
    p50: getPercentile(50),
    p95: getPercentile(95),
    p99: getPercentile(99),
    zeroResultCount: totalZeroResults,
    zeroResultRate: totalSearches > 0 ? Number((totalZeroResults / totalSearches).toFixed(4)) : 0,
  };
}
