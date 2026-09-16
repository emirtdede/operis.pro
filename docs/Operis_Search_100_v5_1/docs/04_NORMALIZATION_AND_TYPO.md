# Normalization & Typo v3

1. Unicode NFKC
2. trim + whitespace collapse
3. Turkish-aware lower
4. safe punctuation normalization
5. Turkish ASCII shadow
6. exact phrase/token alias expansion
7. unigram/bigram/trigram candidate generation
8. bounded fuzzy

## Protected tokens
C#, C++, .NET, UI/UX, 3D, 2D, B2B, SEO, SEM, PPC, KVKK, GDPR, LLM, RAG, API, SDK, iOS.

## Fuzzy
- 1–2 char: disabled
- 3–4 char: max edit 1, strong candidate required
- 5+ char: max edit 1; edit 2 only if strongly constrained
- exact/prefix always outrank fuzzy
