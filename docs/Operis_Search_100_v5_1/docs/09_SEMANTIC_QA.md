# Semantic QA — Version-Neutral

Reject the package or implementation if any of the following occurs:

1. An external JSON pointer does not resolve.
2. The same normalized deterministic regression query has conflicting strict expectations.
3. Short aliases are assigned through substring containment instead of exact token/phrase matching.
4. A relation exists only to satisfy a numeric relation-count target.
5. Relation score and strength labels disagree.
6. Category names are used as fake negative keywords.
7. Fuzzy matching corrupts protected tokens such as C#, C++, .NET, UI/UX, SEO, LLM or RAG.
8. Natural-language benchmark cases are generated as cosmetic wrappers around one base sentence.
9. Benchmark strings are hard-coded into production ranking logic.
10. Production telemetry is claimed when the data is synthetic.
11. A broad ambiguous query is treated as if there is universally only one valid category.
12. Relevance gains come from popularity/personality priors overpowering lexical and intent relevance.
