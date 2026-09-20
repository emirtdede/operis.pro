# Operis Worker Daemon — Production Operasyon ve İzleme Kılavuzu (Runbook)

**Sürüm:** 1.0.0  
**Tarih:** 12 Eylül 2026  
**Kapsam:** `scripts/worker-daemon.ts`, Transactional Outbox Worker, Zamanlanmış Bakım Görevleri ve Dış Alarm Entegrasyonu (K01).

---

## 1. Mimarisi ve Çalışma Prensipleri

Operis Worker Daemon, arka planda bağımsız bir süreç (daemon/background service) olarak çalışır ve iki ana sorumluluğu yerine getirir:
1. **Transactional Outbox Event Processing (1.500 ms döngü):**
   * Veritabanında `PENDING` durumundaki outbox olaylarını (`schema.outboxEvents`) FOR UPDATE SKIP LOCKED ve lease fencing mekanizmasıyla toplar.
   * `LISTING_PUBLISHED`, `LISTING_REACTIVATED`, `RADAR_MATCH`, `OFFER_RECEIVED` vb. olayları hedeflenen kullanıcılara ulaştırır veya radar/kategori bildirimlerini dağıtır.
   * Başarısız olaylar için üstel geri çekilme (exponential backoff) uygular. 5 denemeyi aşan veya alıcısı geçersiz olan olaylar `FAILED` veya `DEAD` olarak işaretlenir.
2. **Periyodik Sistem Bakım Görevleri (15 Dakika Döngü):**
   * Süresi dolan ilanları (`activeUntil < NOW()`) tespit edip `EXPIRED` durumuna çeker.
   * Süresi dolan veya tüketilen tek kullanımlık SMS/OTP kodlarını (`schema.otpChallenges`) temizler.
   * Süresi dolan IP engellemelerini ve geçici oturum kilitlerini arşive kaldırır.
   * Son deneme zamanı (`lastAttemptAt`) ve son başarılı tamamlanma (`lastSuccessfulMaintenance`) metriklerini ayrı ayrı kayıt altına alır.

---

## 2. Systemd Servis Tanımı (Linux / Ubuntu Production)

Production sunucularında worker daemon'un kesintisiz çalışması ve çökme durumunda otomatik yeniden başlatılması için systemd servis birimi:

`/etc/systemd/system/operis-worker.service`:
```ini
[Unit]
Description=Operis Platform Background Outbox & Maintenance Worker Daemon
After=network.target postgresql.service
Wants=network-online.target

[Service]
Type=simple
User=operis
Group=operis
WorkingDirectory=/var/www/operis
EnvironmentFile=/var/www/operis/.env.production
ExecStart=/usr/bin/pnpm run worker:daemon
Restart=always
RestartSec=5s
KillMode=process
TimeoutStopSec=30s

# Güvenlik ve İzolasyon Sınırları
ProtectSystem=full
ProtectHome=true
NoNewPrivileges=true
PrivateTmp=true

# Kaynak Limitleri
LimitNOFILE=65536
MemoryMax=1G
CPUQuota=50%

# Standart Çıktı ve Günlükleme (Journald)
StandardOutput=journal
StandardError=journal
SyslogIdentifier=operis-worker

[Install]
WantedBy=multi-user.target
```

### Servis Yönetim Komutları
```bash
# Servisi etkinleştir ve başlat
sudo systemctl daemon-reload
sudo systemctl enable operis-worker
sudo systemctl start operis-worker

# Durum kontrolü
sudo systemctl status operis-worker

# Canlı log takibi
journalctl -u operis-worker -f -o cat
```

---

## 3. Docker Compose Dağıtım Tanımı

Konteyner tabanlı ortamlarda (Kubernetes / ECS / Docker Swarm) worker daemon konfigürasyonu:

```yaml
version: "3.8"

services:
  operis-worker:
    image: operis/platform:latest
    container_name: operis_worker_daemon
    restart: unless-stopped
    command: ["pnpm", "run", "worker:daemon"]
    env_file:
      - .env.production
      - .env
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      SMS_PROVIDER: netgsm
      EMAIL_PROVIDER: resend
      RESEND_API_KEY: ${RESEND_API_KEY}
      NETGSM_USERCODE: ${NETGSM_USERCODE}
      NETGSM_PASSWORD: ${NETGSM_PASSWORD}
      NETGSM_HEADER: ${NETGSM_HEADER}
      AUTH_SECRET: ${AUTH_SECRET}
      PII_ENCRYPTION_KEY_CURRENT: ${PII_ENCRYPTION_KEY_CURRENT}
      PII_HMAC_KEY: ${PII_HMAC_KEY}
      WORKER_HEARTBEAT_FILE: /tmp/operis-worker-heartbeat.json
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 1024M
        reservations:
          cpus: '0.1'
          memory: 256M
    healthcheck:
      test: ["CMD", "pnpm", "tsx", "scripts/worker-daemon.ts", "--healthcheck"]
      interval: 30s
      timeout: 5s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "5"
```

---

## 4. Dış Alarm ve İzleme Kuralları (Prometheus / Grafana / Datadog)

Sistemin sıhhatini ve güvenilirliğini garanti altına almak için aşağıdaki 4 kritik alarm kuralı yapılandırılmalıdır:

| Alarm Adı | Koşul | Şiddet | Olası Neden | Aksiyon |
|:---|:---|:---:|:---|:---|
| `OperisWorkerHeartbeatMissing` | Son heartbeat > 120 saniye | **CRITICAL** (P1) | Worker süreci çöktü veya bellek/CPU tüketiminden kilitlendi. | Systemd/Docker servisini yeniden başlat, OOM loglarını incele. |
| `OperisOutboxDeadLettersPresent` | `COUNT(outboxEvents WHERE status = 'DEAD') > 0` | **HIGH** (P1) | 5 denemede iletilemeyen bildirim veya geçersiz JSON payload. | Dead letter kuyruğunu incele, alıcı kullanıcı profilini doğrula. |
| `OperisOutboxBacklogHigh` | `COUNT(outboxEvents WHERE status = 'PENDING') > 100` | **MEDIUM** (P2) | Outbox olay üretim hızı worker tüketim hızını aştı. | Worker instance sayısını artır veya veritabanı I/O durumunu denetle. |
| `OperisMaintenanceFailure` | `lastMaintenanceStatus == 'failed'` veya `partial_failure` | **HIGH** (P2) | DB timeout, disk doluluğu veya şema uyuşmazlığı. | PostgreSQL bağlantı havuzunu ve `scripts/worker-daemon.ts` loglarını incele. |

### Prometheus Alertmanager Kural Örneği
```yaml
groups:
  - name: operis-worker.rules
    rules:
      - alert: OperisOutboxDeadLetters
        expr: operis_outbox_dead_letters_total > 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Operis transactional outbox has dead-letter events"
          description: "There are unprocessable outbox events in dead-letter state."

      - alert: OperisWorkerDown
        expr: time() - operis_worker_last_heartbeat_timestamp > 120
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Operis Worker Daemon is unresponsive"
          description: "No worker heartbeat recorded in the last 2 minutes."
```

---

## 5. Sıfır Kesinti ve Sürüm Yükseltme Stratejisi

1. **Lease Fencing Garantisi:**
   Worker daemon, her işlem turunda `leaseToken` (UUID) ve `leaseUntil` (şimdi + 30 saniye) yazar. Yeni bir worker sürümü dağıtılırken eski worker süreci kapatılsa dahi yarım kalan işlemler en geç 30 saniye sonra yeni worker tarafından devralınır.
2. **Kademeli Dağıtım (Rolling Update):**
   Yeni kod tabanında önce veritabanı migration'ları (`pnpm run db:migrate`) uygulanır. Ardından worker daemon yeniden başlatılır (`sudo systemctl restart operis-worker`). Son olarak web uygulaması dağıtılır.
