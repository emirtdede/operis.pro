# Natural-Language QA — v5.1

This patch addresses only synthetic-query naturalness.

## Requirements

- Queries should read like something a real Turkish client could type into marketplace search.
- Avoid mechanical constructions such as `X kullanan mevcut yapı`, `X kullanılarak ...`, `X için production ortamına uygun çözüm`, or nonsensical noun/verb pairings.
- Technical English product names are allowed when Turkish users commonly use them (React, Figma, Google Ads, Unity, etc.).
- Each gold query must be category-specific and grammatically natural.
- The corpus remains synthetic and must not be described as real Operis telemetry.
