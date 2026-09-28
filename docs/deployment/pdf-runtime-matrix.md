# Operis — PDF Runtime Dağıtım ve Doğrulama Matrisi

Bu doküman, Operis sözleşme motorunun (`src/lib/pdf/vector-pdf-engine.ts`) farklı dağıtım ve yayın ortamlarındaki çalışma kurallarını, headless Chromium gereksinimlerini ve kullanıcı deneyimi güvencelerini belgeler.

---

## 1. Çalışma Mimarisi

Operis, sözleşmelerin indirilebilir resmi kopyalarını üretmek için iki kademeli bir mimari uygular:

1. **Birincil Yol (Vektörel PDF Üretimi — Server-side):**
   - Headless Chromium (`@playwright/test`) üzerinden CSS Paged Media (`@page`, `break-inside: avoid`, `break-after: avoid`) kurallarıyla gerçek vektör PDF üretilir.
   - Çıktı başlığı: `Content-Type: application/pdf`.
   - İmzalı sözleşmenin kriptografik bütünlüğü `X-Contract-Sha256` HTTP başlığıyla iletilir.

2. **İkincil Yol (Yüksek Kaliteli İstemci Yazdırma — Client-side Print Fallback):**
   - Sunucusuz (serverless) veya binary kısıtlı ortamlarda Chromium başlatılamazsa 500 hatası üretilmez.
   - Endpoint otomatik olarak `X-PDF-Fallback: client-print` başlığı ve tarayıcının yerel baskı motorunu tetikleyen `<script>window.onload=function(){window.print();}</script>` yönergesiyle zengin HTML döndürür.
   - Kullanıcı tarayıcının "PDF Olarak Kaydet" veya "Yazdır" iletişim kutusundan aynı yüksek çözünürlüklü çıktıyı alır.

---

## 2. Dağıtım Ortamı Matrisi

| Ortam | Çalışma Türü | Headless Chromium | Beklenen Çıktı | Doğrulama Yöntemi |
|---|---|---|---|---|
| **Yerel Geliştirme (Local Dev)** | Node.js 22 + Chromium | Mevcut (`pnpm audit:pdf`) | `application/pdf` | `pnpm audit:pdf --strict` |
| **CI / GitHub Actions** | Ubuntu Runner (`ci.yml:105-108`) | Mevcut (`playwright install`) | `application/pdf` | `pnpm audit:pdf --strict` (Exit 0) |
| **Konteyner / Standalone Docker** | Node.js Standalone + Playwright | Mevcut (Docker base image) | `application/pdf` | `pnpm tsx scripts/verify-deployment-pdf.ts` |
| **Vercel Serverless (Hobby/Pro)** | AWS Lambda / Serverless Function | Kısıtlı (50 MB bundle sınırı) | `text/html` + `X-PDF-Fallback` | `pnpm tsx scripts/verify-deployment-pdf.ts` |

---

## 3. Doğrulama Kapıları (Quality Gates)

### 3.1. CI / Derleme Öncesi Kontrol (Strict Mode)
Derleme hattında headless Chromium motorunun bütünlüğü test edilir:
```bash
pnpm audit:pdf --strict
```
- Bu komut `scripts/verify-pdf-runtime.ts` dosyasını `--strict` parametresiyle çalıştırır.
- Başarı durumunda en az 100 baytlık geçerli `%PDF-` sihirli baytlarına sahip vektör belgesi üretildiğini onaylar (yerelde ~35.7 KB).

### 3.2. Dağıtım Sonrası Doğrulama (Post-Deploy Smoke Check)
Canlı veya preview dağıtım sonrasında sözleşme indirme akışını denetlemek için:
```bash
pnpm tsx scripts/verify-deployment-pdf.ts --url https://operis.pro --contract-id <ID> --token <SESSION_TOKEN>
```
Script, hedef sunucunun durumunu inceler:
- `application/pdf` dönerse vektörel PDF motorunun canlıda aktif olduğunu doğrular.
- `X-PDF-Fallback: client-print` dönerse istemci yazdırma ekranının güvenli şekilde hazırlandığını onaylar.
- Asla 500 dahili sunucu hatası dönmemesini güvenceye alır.
