# Operis Search v5 — Precision Search Package

V5 addresses the remaining V4 quality gaps.

## Major improvements

- Relation graph rebuilt as precision-first: no forced relation count and no weak filler edges.
- Category-scoped synonym layer added.
- **660** human-style gold queries now represent **660 distinct problem/task intents**, not wrapper variations.
- Ambiguous natural-language cases use confidence-aware `allowedTop1`.
- **50** contrastive relevance cases directly test commonly confused category pairs.
- Release quality is measured with Top-1, Recall@3 and nDCG@5 rather than pretending every natural-language query has one universally correct answer.
- Semantic QA document is version-neutral.
- Benchmark anti-gaming rules explicitly prohibit query-specific hard-coding.

## Entry point

`01_AGENT_PROMPT.md`

## Important reality boundary

This is a high-quality static taxonomy/search benchmark package. Real production excellence still requires post-launch Operis telemetry.


## v5.1 natural-language patch

This patch intentionally changes only synthetic query naturalness.

- 660/660 human-style gold queries rewritten in natural Turkish.
- 110 category problem-language corpora rewritten.
- Long-tail/service-intent strings rewritten to avoid mechanical constructions.
- Ranking, relation graph, alias policy, typo strategy and all other v5 architecture are intentionally unchanged.
