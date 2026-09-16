# Test Strategy v5

## 1. Deterministic regression

`tests/regression-queries.json`

- exact category/term
- aliases
- typo recovery
- Turkish ASCII variants
- deterministic ambiguity-safe rules

Pass target: 100% of deterministic assertions.

## 2. Human-style gold benchmark

`tests/gold-human-style-queries.json`

Six distinct problem/task intents per category.

Evaluate:
- high-confidence preferred Top-1 accuracy
- medium-confidence allowed Top-1 accuracy
- Recall@3
- nDCG@5

## 3. Contrastive relevance

`tests/contrastive-queries.json`

Tests confusing neighbors directly, e.g.:
- Frontend coding vs web UI/UX
- SEO vs technical SEO
- Cybersecurity vs penetration testing
- E-commerce development vs management vs operations
- Translation vs software localization
- Unity vs Unreal vs general game development

## 4. Security / robustness

`tests/adversarial-queries-v4.json` remains valid and is treated as the v5 robustness suite until implementation renames it.

## 5. E2E

- keyboard navigation
- ARIA
- desktop/mobile
- loading/error/no-result
- canonical navigation

## 6. Performance

Report p50/p95/p99 on a production-like dataset.
