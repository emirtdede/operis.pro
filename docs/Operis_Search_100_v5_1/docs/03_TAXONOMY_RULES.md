# Taxonomy Rules v3

## Canonical kategori listesi
`data/categories.search-taxonomy.json`

## Alanlar
- `canonicalTerms`: resmi/çekirdek isim
- `searchTerms`: direkt hizmet ve teknoloji terimleri
- `skillTags`: beceri/araç
- `aliases`: güvenli varyasyonlar
- `serviceIntents`: sentetik ama doğal seed sorgular
- `relatedCategories`: yalnız semantik olarak savunulabilir ilişkiler
- `negativeTerms`: deprecated; v3'te boş
- `disambiguationRef`: gerçek soft context kuralları

## Yasaklar
- Sayısal completeness için sahte relation üretme.
- Substring ile kısa alias eşleştirme.
- Kategori adını negative term yapma.
- Ambiguous query'yi keyfi biçimde tek kategoriye sabitleme.
