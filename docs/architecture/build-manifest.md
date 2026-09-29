# Operis çalışma zamanı ve derleme manifestosu

**Son doğrulama:** 29 Eylül 2026

**Kaynak:** Depodaki `package.json`, kilit dosyası ve yerel araç çıktıları.

Bu belge geliştirme ve derleme tabanını kaydeder. Üretim ortamının gerçekten bu sürümleri kullandığı dağıtım sırasında ayrıca kanıtlanmalıdır.

## Doğrulanmış taban

| Bileşen | Sürüm / durum |
|---|---|
| Node.js | `v24.19.0` |
| pnpm | `10.5.2` |
| `packageManager` | `pnpm@10.5.2` |
| Next.js | `16.3.6` |
| React / React DOM | `19.2.7` |
| TypeScript | `^5.8.2` |
| Drizzle ORM | `^0.45.3` |
| PostgreSQL istemcisi | `pg ^8.13.3` |

## Standart komutlar

```bash
pnpm install --frozen-lockfile
pnpm run lint
pnpm run typecheck
pnpm run format:check
pnpm run test:unit
pnpm run test:integration
pnpm run test:a11y
pnpm run build
pnpm run test:e2e:prod
```

Üretim worker'ı `pnpm run worker:daemon` komutuyla başlatılır. Bu komut `tsx` kullanır; `tsx` şu anda `devDependencies` altındadır. Yalnız üretim bağımlılıklarının kurulduğu bir artefakta worker'ın başlayabildiği yayın kapısında doğrulanmalıdır.

## Veritabanı tabanı

Yerel makinede `psql` sürümü bu belge için doğrulanmamıştır. Entegrasyon testlerinin kullandığı PostgreSQL konteyneri ile hedef üretim PostgreSQL sürümü aynı kabul edilmemelidir. Desteklenen üretim sürümü, TLS ayarları, bağlantı havuzu, en az yetkili runtime rolü ve ayrı migration rolü hedef ortamda kayda geçirilmelidir.

Güncel yayın kapıları ve eksik doğrulamalar için [`../YAYIN_ONCESI_TEK_RAPOR.md`](../YAYIN_ONCESI_TEK_RAPOR.md) kullanılır.
