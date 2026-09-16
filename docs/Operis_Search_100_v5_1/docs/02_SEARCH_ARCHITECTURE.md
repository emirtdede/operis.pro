# Search Architecture v3

Pipeline:

`Query -> Turkish-aware Normalize -> Exact/Prefix Candidates -> Term Specificity -> Query Coverage -> Alias -> Bounded Fuzzy -> Context Disambiguation -> Small Relation Prior -> Stable Sort`

## İlkeler

- Arama lexical-first olmalı.
- Embedding/LLM yalnız ölçülen zero-result/problem-query ihtiyacında fallback olabilir.
- PostgreSQL kullanılıyorsa uygun full-text/trigram indexleri değerlendir.
- Harici search engine yalnız gerçek ölçüm bunu gerektiriyorsa eklenmeli.
- Aynı sorguda birden çok kategori doğru olabilir.
- Result count tipik olarak 8–12 ile sınırlandırılmalı.
