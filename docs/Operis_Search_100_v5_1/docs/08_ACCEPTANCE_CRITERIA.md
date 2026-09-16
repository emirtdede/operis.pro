# Acceptance Criteria — v5 Release Gate

## Data integrity
- [ ] Exactly 110 categories
- [ ] 110 unique IDs/slugs
- [ ] JSON Schema PASS
- [ ] Every external JSON pointer resolves
- [ ] Every relation target exists
- [ ] No self-relation
- [ ] No obsolete version-specific semantic QA filename
- [ ] Category synonym references resolve

## Relation quality
- [ ] No forced minimum relation count
- [ ] No weak filler relations
- [ ] Relation strength matches global thresholds
- [ ] Relation prior cannot overpower lexical relevance

## Lexical quality
- [ ] Exact phrase/token aliases only
- [ ] No substring alias contamination
- [ ] Protected tokens survive normalization
- [ ] Turkish ASCII shadow works
- [ ] Fuzzy 1–2 character queries disabled

## Relevance tests
- [ ] deterministic regression assertions = 100% PASS
- [ ] human-style benchmark has 660 distinct normalized queries
- [ ] six distinct task/problem intents per category
- [ ] high-confidence preferred Top-1 >= 97%
- [ ] medium-confidence allowed Top-1 >= 98%
- [ ] target Recall@3 >= 99.5%
- [ ] nDCG@5 >= 0.97
- [ ] contrastive expected Top-1 = 100%
- [ ] contrastive must-rank-above assertions = 100%
- [ ] no query-specific ranking hacks

## Security / robustness
- [ ] adversarial suite = 100%
- [ ] parameterized DB queries / ORM
- [ ] XSS-safe output
- [ ] query-length guard
- [ ] bounded/escaped regex if used
- [ ] no unnecessary PII in search telemetry

## UX/accessibility
- [ ] desktop/mobile
- [ ] debounce
- [ ] ArrowUp/ArrowDown
- [ ] Enter/Escape
- [ ] ARIA combobox/listbox
- [ ] loading/empty/no-result/error
- [ ] canonical category navigation

## Engineering
- [ ] unit PASS
- [ ] integration PASS
- [ ] E2E PASS
- [ ] lint PASS
- [ ] typecheck PASS
- [ ] production build PASS
- [ ] no TODO/placeholder/mock implementation

## Observability
- [ ] p50/p95/p99
- [ ] zero-result rate
- [ ] Top-1 click rate
- [ ] MRR
- [ ] nDCG
- [ ] reformulation rate
- [ ] search-to-category conversion
- [ ] typo recovery rate
