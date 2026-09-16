# Ranking Specification v3

Config: `data/ranking-config.json`

Global score concept:

`lexical + specificity + coverage + context + small_relation_prior + bounded_history`

## Critical rules
- Relative normalization inside one category is forbidden for relation strength.
- Shared terms get lower specificity.
- Context terms disambiguate collisions.
- Relation score cannot overpower exact lexical relevance.
- CTR is never a substitute for relevance; position bias must be considered.
