# Human-Style Gold Benchmark v5

File: `tests/gold-human-style-queries.json`

Cases: **660**

## Main change from v4

V4 had six cosmetic variations around one base scenario per category.

V5 instead contains **six distinct task/problem intents per category**. The intent changes, not merely the sentence wrapper.

## Labels

- `preferredTop1`: desired primary category.
- `allowedTop1`: acceptable top-1 set when a naturally broad query has more than one defensible interpretation.
- `requiredInTop3`: the intended category must remain highly discoverable.
- `labelConfidence`: `high` or `medium`.

## Provenance

These are expert-curated synthetic queries. They are not real Operis traffic and must never be represented as production telemetry.
