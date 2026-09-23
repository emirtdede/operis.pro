import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { searchCategories } from '@/src/lib/search/engine';
import { recordSearchTelemetry } from '@/src/lib/search/telemetry';
import {
  evaluateSecurityAccessAsync,
  getClientIp,
  normalizeIp,
} from '@/src/lib/security/rate-limit';

const searchQuerySchema = z.object({
  q: z.string().max(160, 'Query exceeds maximum length of 160 characters').default(''),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sector: z.string().optional(),
});

const searchPostSchema = z.object({
  query: z.string().max(160, 'Query exceeds maximum length of 160 characters'),
  limit: z.number().int().min(1).max(50).optional().default(10),
  sectorKey: z.string().optional(),
  enableFuzzy: z.boolean().optional().default(true),
  enableDisambiguation: z.boolean().optional().default(true),
  enableRelationPrior: z.boolean().optional().default(true),
});

export async function GET(req: NextRequest) {
  try {
    const startTime = performance.now();
    const ip = getClientIp(req);

    // Rate limiting: 120 searches / minute per IP
    const access = await evaluateSecurityAccessAsync({
      ip,
      purpose: 'cat:search',
      subject: normalizeIp(ip),
      limit: 120,
      windowMs: 60 * 1000,
    });

    if (!access.allowed) {
      return access.response;
    }

    const { searchParams } = new URL(req.url);
    const parseResult = searchQuerySchema.safeParse({
      q: searchParams.get('q') || '',
      limit: searchParams.get('limit') || 10,
      sector: searchParams.get('sector') || undefined,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || 'Invalid search parameters' },
        { status: 400 }
      );
    }

    const { q, limit, sector } = parseResult.data;

    if (!q.trim()) {
      return NextResponse.json(
        { results: [], total: 0, query: '', latencyMs: 0 },
        { status: 200 }
      );
    }

    const results = searchCategories(q, {
      limit,
      sectorKey: sector,
      enableFuzzy: true,
      enableDisambiguation: true,
      enableRelationPrior: true,
    });

    const latencyMs = performance.now() - startTime;
    const isZero = results.length === 0;

    recordSearchTelemetry(isZero ? 'search_zero_result' : 'search_results_shown', {
      rawQuery: q,
      latencyMs,
      top1Slug: results[0]?.slug,
      resultCount: results.length,
      matchClass: results[0]?.matchClass,
    });

    return NextResponse.json(
      {
        results,
        total: results.length,
        query: q,
        latencyMs: Number(latencyMs.toFixed(2)),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Category search failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const startTime = performance.now();
    const ip = getClientIp(req);

    const access = await evaluateSecurityAccessAsync({
      ip,
      purpose: 'cat:search',
      subject: normalizeIp(ip),
      limit: 120,
      windowMs: 60 * 1000,
    });

    if (!access.allowed) {
      return access.response;
    }

    const body = await req.json();
    const { query, limit, sectorKey, enableFuzzy, enableDisambiguation, enableRelationPrior } =
      searchPostSchema.parse(body);

    if (!query.trim()) {
      return NextResponse.json(
        { results: [], total: 0, query: '', latencyMs: 0 },
        { status: 200 }
      );
    }

    const results = searchCategories(query, {
      limit,
      sectorKey,
      enableFuzzy,
      enableDisambiguation,
      enableRelationPrior,
    });

    const latencyMs = performance.now() - startTime;
    const isZero = results.length === 0;

    recordSearchTelemetry(isZero ? 'search_zero_result' : 'search_results_shown', {
      rawQuery: query,
      latencyMs,
      top1Slug: results[0]?.slug,
      resultCount: results.length,
      matchClass: results[0]?.matchClass,
    });

    return NextResponse.json(
      {
        results,
        total: results.length,
        query,
        latencyMs: Number(latencyMs.toFixed(2)),
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message || 'Invalid request body' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred while searching' },
      { status: 500 }
    );
  }
}
