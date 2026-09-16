# Search Quality Metrics & Release Thresholds

Authoritative thresholds: `data/benchmark-metrics.json`.

## Why metric-based evaluation

Natural-language marketplace search does not always have one universally correct top-1 category.

The release gate therefore separates:

- deterministic lexical regression,
- high-confidence human-style queries,
- medium-confidence ambiguous queries,
- contrastive confusion tests,
- adversarial robustness.

## Primary metrics

- Preferred Top-1 accuracy
- Allowed Top-1 accuracy
- Recall@3
- MRR
- nDCG@5
- Contrastive pair accuracy
- Zero-result rate
- Query reformulation rate

## Anti-overfitting

Never hard-code benchmark strings. A benchmark failure must be fixed through general retrieval/ranking/taxonomy logic.
