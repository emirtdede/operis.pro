# Search Analytics & Continuous Learning

## Eventler
- search_started
- search_results_shown
- search_result_clicked
- search_zero_result
- search_query_refined
- search_category_selected

## Ölçümler
- Zero Result Rate
- Top-1 Click Rate
- MRR
- Query Reformulation Rate
- Search-to-Category Conversion
- p50/p95/p99 latency
- typo recovery success
- no-click rate

## Haftalık kalite döngüsü
1. en çok aranan sorgular,
2. en çok zero-result sorgular,
3. yüksek gösterim/düşük tıklama sorgular,
4. reformulated queries,
5. yanlış kategori tıklama sinyalleri,
6. yeni alias/term önerileri,
7. golden query regression testi.

## Privacy
Search query potansiyel olarak kişisel veri içerebilir. Ham query retention, masking ve erişim politikası ürünün KVKK/GDPR politikasına göre sınırlandırılmalı.
