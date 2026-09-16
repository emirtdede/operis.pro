# OPERIS SEARCH v5 — MASTER IMPLEMENTATION PROMPT

Read every `.md` and `.json` file in this ZIP before editing the repository. Then inspect the repository's category, routing, DB/ORM, search, API, UI, analytics and test layers.

Do not stop for intermediate approval. Do not move to the next phase while a discovered problem remains unresolved. Do not leave TODOs, placeholders, mocked success or temporary hacks.

## Goal

A user must be able to reach the correct category even when they do not know the category name and instead search by:

- service
- deliverable
- technology/tool
- skill
- synonym/alias
- Turkish ASCII spelling
- reasonable typo
- natural problem statement
- longer hiring intent

## Authoritative package data

- `data/categories.search-taxonomy.json`
- `data/category-synonyms.json`
- `data/term-weights.json`
- `data/relation-graph.json`
- `data/disambiguation-rules.json`
- `data/collision-matrix.json`
- `data/problem-language-corpus.json`
- `data/normalization-rules.json`
- `data/ranking-config.json`
- `data/benchmark-metrics.json`

## Required test gates

1. `tests/regression-queries.json`
2. `tests/gold-human-style-queries.json`
3. `tests/contrastive-queries.json`
4. `tests/adversarial-queries-v5.json`

### Human-style benchmark semantics

- `preferredTop1`: desired primary category.
- `allowedTop1`: acceptable top-1 categories for genuinely ambiguous queries.
- `requiredInTop3`: intended category must remain discoverable.
- `labelConfidence`: evaluate high- and medium-confidence queries separately.

Do not convert all medium-confidence queries into strict top-1 assertions.

### Anti-gaming rule

Never hard-code benchmark query strings or load test JSON into production ranking logic.

If a test fails, improve general:
- normalization
- candidate retrieval
- aliases
- term specificity
- query coverage
- disambiguation
- ranking

## Required implementation sequence

1. Repository audit
2. Stable category ID/name mapping
3. Search index/data model
4. Turkish-aware normalization
5. Exact/prefix/skill/synonym candidate retrieval
6. Global term specificity + query coverage
7. Bounded fuzzy typo recovery
8. Context disambiguation
9. Small precision-first relation prior
10. Problem-language / zero-result fallback
11. Accessible desktop/mobile search UI
12. Analytics/telemetry
13. Unit/integration/E2E
14. Deterministic regression
15. Human-style benchmark metrics
16. Contrastive benchmark
17. Adversarial robustness
18. Referential/semantic QA
19. Performance benchmark
20. lint/typecheck/test/build
21. Fix every failure and rerun all gates

## Ranking invariants

- exact category/canonical > exact search term > exact skill > prefix > synonym > fuzzy
- shared/common terms receive lower specificity
- broader query coverage is positive
- context signals are soft boosts/penalties
- related-category/popularity/personalization are bounded priors
- relation priors may never overpower exact intent
- no weak relation filler
- ambiguous short queries may return several plausible categories
- aggressive fuzzy matching is disabled for 1–2 characters
- protected technical tokens must remain intact

## Complete only when

Every requirement in `docs/08_ACCEPTANCE_CRITERIA.md` passes and the final report includes:
- relevance metrics
- failed-query count = 0 for deterministic/contrastive/adversarial gates
- p50/p95/p99 latency
- exact implementation files changed
- any remaining production-only calibration risks
