# Relation Graph Policy

The relation graph is deliberately **precision-first**.

## Rules

- No category is required to have a minimum number of relations.
- Do not create weak filler edges merely for completeness.
- Relations must come from a narrow, defensible semantic family.
- Relation priors are small ranking signals, never substitutes for query relevance.
- A category with zero related categories is valid.
- Scores are globally calibrated, not normalized relative to one category's local list.

## Strength

- `strong`: score >= 0.76
- `medium`: score < 0.76 and relation remains semantically defensible
- V5 intentionally does not publish `weak` filler edges.
