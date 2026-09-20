/**
 * Smart Runbook & Architecture Vault Synthesizer (Operis Engagements Module)
 *
 * Automatically generates production-ready, sector-specific system runbooks,
 * .env.example dictionaries, startup & build commands, third-party service matrices,
 * and disaster recovery blueprints across all 10 platform sectors.
 */

export type SecretCategory =
  | "DATABASE"
  | "AUTH"
  | "PAYMENT"
  | "STORAGE"
  | "ANALYTICS"
  | "COMMUNICATION"
  | "OTHER";

export type RunbookEnvironment = "LOCAL" | "DOCKER" | "PRODUCTION" | "CI_CD";

export type DisasterPriority = "CRITICAL" | "HIGH" | "MEDIUM";

export interface RunbookEnvVar {
  key: string;
  description: string;
  isRequired: boolean;
  sampleValue?: string;
  secretCategory: SecretCategory;
}

export interface RunbookBuildStep {
  stepNumber: number;
  title: string;
  command: string;
  description: string;
  environment: RunbookEnvironment;
}

export interface RunbookThirdPartyService {
  serviceName: string;
  category: string;
  dashboardUrl?: string;
  purpose: string;
  credentialsTransferred: boolean;
  notes?: string;
}

export interface RunbookDisasterStep {
  priority: DisasterPriority;
  scenario: string;
  procedure: string;
  verificationCommand?: string;
}

export interface RunbookBackupSchedule {
  frequency: string;
  backupScriptOrCommand?: string;
  storageLocation?: string;
  restoreProcedure?: string;
}

export interface SynthesizedRunbook {
  architectureSummary: string;
  environmentVariables: RunbookEnvVar[];
  buildAndRunSteps: RunbookBuildStep[];
  thirdPartyServices: RunbookThirdPartyService[];
  disasterRecoverySteps: RunbookDisasterStep[];
  backupSchedule: RunbookBackupSchedule;
}

export interface SynthesizeRunbookInput {
  sectorKey?: string | null;
  categoryKey?: string | null;
  categoryName?: string | null;
  title?: string | null;
  scope?: string | null;
  tags?: string[] | null;
}

// ----------------------------------------------------------------------
// 1. Secret Leakage Detector (Security & Credential Anti-Leak Shield)
// ----------------------------------------------------------------------

export class SecretLeakageDetector {
  private static readonly SECRET_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
    { pattern: /-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/, name: "SSH/RSA Private Key" },
    { pattern: /AKIA[0-9A-Z]{16}/, name: "AWS Access Key ID" },
    { pattern: /sk_live_[0-9a-zA-Z]{24,}/, name: "Stripe Live Secret Key" },
    { pattern: /ghp_[0-9a-zA-Z]{36}/, name: "GitHub Personal Access Token" },
    { pattern: /xoxb-[0-9]{11,}-[0-9a-zA-Z]{24,}/, name: "Slack Bot Token" },
    { pattern: /AIza[0-9A-Za-z\-_]{35}/, name: "Google API Key" },
    { pattern: /re_[0-9a-zA-Z_]{24,}/, name: "Resend Live API Key" },
    { pattern: /SG\.[0-9a-zA-Z-_]{22}\.[0-9a-zA-Z-_]{43}/, name: "SendGrid API Key" },
  ];

  /**
   * Scans a string or text payload to detect if live credentials, passwords, or
   * private keys are accidentally included.
   */
  static scanForSecrets(content: string): {
    hasSecretLeakage: boolean;
    leakedCategory?: string;
    warningTr?: string;
    warningEn?: string;
  } {
    if (!content || typeof content !== "string") {
      return { hasSecretLeakage: false };
    }

    for (const { pattern, name } of this.SECRET_PATTERNS) {
      if (pattern.test(content)) {
        return {
          hasSecretLeakage: true,
          leakedCategory: name,
          warningTr: `⚠️ Güvenlik Uyarısı: Metinde canlı '${name}' tespit edildi. Lütfen kılavuz içine gerçek şifreleri asla yazmayınız; sadece şema ve örnek format veriniz.`,
          warningEn: `⚠️ Security Warning: Detected live '${name}' in content. Never paste production credentials into runbook documentation; provide only schema and format examples.`,
        };
      }
    }

    return { hasSecretLeakage: false };
  }
}

// ----------------------------------------------------------------------
// 2. Raw .env.example Text Parser
// ----------------------------------------------------------------------

export function parseEnvExampleText(rawText: string): RunbookEnvVar[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/);
  const result: RunbookEnvVar[] = [];
  let pendingComment = "";

  for (const line of lines) {
    const trimmed = line.trim();

    // Comment line: accumulate as description
    if (trimmed.startsWith("#")) {
      const commentText = trimmed.replace(/^#+\s*/, "");
      pendingComment = pendingComment ? `${pendingComment} ${commentText}` : commentText;
      continue;
    }

    // Skip blank lines
    if (!trimmed) {
      pendingComment = "";
      continue;
    }

    // Parse KEY=VALUE or export KEY=VALUE
    const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (match) {
      const key = match[1]!;
      let value = match[2] ? match[2].trim() : "";

      // Strip quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      // Infer category from key naming conventions
      const upperKey = key.toUpperCase();
      let category: SecretCategory = "OTHER";
      if (upperKey.includes("DATABASE") || upperKey.includes("DB_") || upperKey.includes("POSTGRES") || upperKey.includes("MYSQL") || upperKey.includes("MONGO") || upperKey.includes("REDIS")) {
        category = "DATABASE";
      } else if (upperKey.includes("AUTH") || upperKey.includes("SECRET") || upperKey.includes("JWT") || upperKey.includes("TOKEN") || upperKey.includes("CLERK") || upperKey.includes("SESSION")) {
        category = "AUTH";
      } else if (upperKey.includes("STRIPE") || upperKey.includes("IYZICO") || upperKey.includes("PAYMENT") || upperKey.includes("PAYPAL")) {
        category = "PAYMENT";
      } else if (upperKey.includes("S3") || upperKey.includes("STORAGE") || upperKey.includes("BLOB") || upperKey.includes("BUCKET") || upperKey.includes("UPLOAD")) {
        category = "STORAGE";
      } else if (upperKey.includes("ANALYTICS") || upperKey.includes("GA_") || upperKey.includes("POSTHOG") || upperKey.includes("SENTRY") || upperKey.includes("MIXPANEL")) {
        category = "ANALYTICS";
      } else if (upperKey.includes("RESEND") || upperKey.includes("MAIL") || upperKey.includes("SMTP") || upperKey.includes("SMS") || upperKey.includes("TWILIO")) {
        category = "COMMUNICATION";
      }

      result.push({
        key,
        description: pendingComment || `${key} yapılandırma parametresi`,
        isRequired: true,
        sampleValue: value || undefined,
        secretCategory: category,
      });

      pendingComment = "";
    }
  }

  return result;
}

// ----------------------------------------------------------------------
// 3. Sector & Category Blueprint Catalogs (10 Sectors)
// ----------------------------------------------------------------------

export class RunbookSynthesizer {
  /**
   * Deterministically synthesizes an end-to-end Runbook blueprint tailored to the
   * engagement's sector, category, title, scope, and technologies.
   */
  static synthesizeDefaultRunbook(input: SynthesizeRunbookInput): SynthesizedRunbook {
    const sectorKey = (input.sectorKey || "").toLowerCase();
    const categoryKey = (input.categoryKey || "").toLowerCase();
    const categoryName = (input.categoryName || "").toLowerCase();
    const title = (input.title || "").toLowerCase();
    const scope = (input.scope || "").toLowerCase();
    const tagsText = (input.tags || []).join(" ").toLowerCase();

    const combined = `${sectorKey} ${categoryKey} ${categoryName} ${title} ${scope} ${tagsText}`;

    // 1. Mobile Development
    if (
      !sectorKey.includes("design") &&
      !categoryKey.includes("design") &&
      !categoryKey.includes("ui") &&
      (sectorKey.includes("mobile") ||
        categoryKey.includes("mobile") ||
        combined.includes("mobil") ||
        combined.includes("react native") ||
        combined.includes("flutter") ||
        combined.includes("ios") ||
        combined.includes("android") ||
        combined.includes("swift") ||
        combined.includes("kotlin"))
    ) {
      return {
        architectureSummary:
          "Cross-Platform / Native Mobil Uygulama Mimarisi. Backend API ile REST/WebSocket üzerinden senkronize olur. iOS build'leri Fastlane ve TestFlight, Android build'leri Google Play Console dahili test kanalı üzerinden yönetilir.",
        environmentVariables: [
          {
            key: "EXPO_PUBLIC_API_BASE_URL",
            description: "Mobil uygulamanın bağlandığı ana backend API adresi (HTTPS)",
            isRequired: true,
            sampleValue: "https://api.operis-app.com/v1",
            secretCategory: "OTHER",
          },
          {
            key: "SENTRY_DSN",
            description: "Mobil istemci hata ve kaza (crash) izleme DSN adresi",
            isRequired: false,
            sampleValue: "https://examplePublicKey@o0.ingest.sentry.io/0",
            secretCategory: "ANALYTICS",
          },
          {
            key: "ONE_SIGNAL_APP_ID",
            description: "FCM ve APNS push bildirim servisi uygulama kimliği",
            isRequired: true,
            sampleValue: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            secretCategory: "COMMUNICATION",
          },
        ],
        buildAndRunSteps: [
          {
            stepNumber: 1,
            title: "Bağımlılıkları Yükle",
            command: "pnpm install",
            description: "Node modüllerini ve paket bağımlılıklarını kurar.",
            environment: "LOCAL",
          },
          {
            stepNumber: 2,
            title: "iOS Pods Kurulumu",
            command: "cd ios && pod install && cd ..",
            description: "iOS yerel bağımlılıklarını (CocoaPods) yapılandırır.",
            environment: "LOCAL",
          },
          {
            stepNumber: 3,
            title: "Android Simülatöründe Çalıştır",
            command: "pnpm android",
            description: "Yerel geliştirme modunda Android emulator üzerinde uygulamayı başlatır.",
            environment: "LOCAL",
          },
          {
            stepNumber: 4,
            title: "iOS Simülatöründe Çalıştır",
            command: "pnpm ios",
            description: "Xcode simülatörü üzerinde uygulamayı başlatır.",
            environment: "LOCAL",
          },
          {
            stepNumber: 5,
            title: "Prodüksiyon AAB/IPA Derlemesi",
            command: "pnpm build:release",
            description: "Mağaza yüklemesi için imzalı binary paketi oluşturur.",
            environment: "PRODUCTION",
          },
        ],
        thirdPartyServices: [
          {
            serviceName: "Apple Developer Program",
            category: "App Store",
            dashboardUrl: "https://developer.apple.com/account",
            purpose: "iOS App Store yayınlama, Provisioning Profiles ve Push APNS sertifikaları",
            credentialsTransferred: true,
            notes: "İşverenin Apple Developer hesabına Admin/Account Holder yetkisi devredildi.",
          },
          {
            serviceName: "Google Play Console",
            category: "Play Store",
            dashboardUrl: "https://play.google.com/console",
            purpose: "Android uygulama yayını ve dahili test kanalı yönetimi",
            credentialsTransferred: true,
            notes: "Android Keystore (.jks) ve şifresi işverenin güvenli şifre kasasına aktarıldı.",
          },
          {
            serviceName: "Firebase / OneSignal",
            category: "Push Notifications",
            dashboardUrl: "https://console.firebase.google.com",
            purpose: "Android ve iOS için anlık bildirim dağıtımı",
            credentialsTransferred: true,
          },
        ],
        disasterRecoverySteps: [
          {
            priority: "CRITICAL",
            scenario: "Android İmza Anahtarı (Keystore) Kaybı",
            procedure:
              "Google Play App Signing devredeyse, Google Play Console Destek üzerinden yeni bir yükleme anahtarı (upload key) sıfırlama talebi açılabilir. Keystore kopyası güvenli çevrimdışı yedekte tutulmalıdır.",
            verificationCommand: "keytool -list -v -keystore release.keystore",
          },
          {
            priority: "HIGH",
            scenario: "APNS Push Bildirimi Sertifikası Süresinin Dolması",
            procedure:
              "Apple Developer Portal > Certificates, Identifiers & Profiles üzerinden yeni APNS Auth Key (.p8) üretilip Firebase/OneSignal paneline yüklenmelidir.",
          },
        ],
        backupSchedule: {
          frequency: "Sürüm Bazlı (Her Yeni Release)",
          backupScriptOrCommand: "git tag -a v1.0.0 -m 'Release v1.0.0' && git push origin --tags",
          storageLocation: "GitHub Releases & Güvenli Bulut Sürücüsü (Keystore & P8)",
          restoreProcedure: "İlgili git tag'ine checkout yapılarak derleme tekrarlanabilir.",
        },
      };
    }

    // 2. AI & Data Science
    if (
      sectorKey.includes("ai") ||
      categoryKey.includes("ai") ||
      combined.includes("yapay zeka") ||
      combined.includes("llm") ||
      combined.includes("rag") ||
      combined.includes("embedding") ||
      combined.includes("vector")
    ) {
      return {
        architectureSummary:
          "Yapay Zeka & RAG (Retrieval-Augmented Generation) Pipeline Mimarisi. FastAPI mikroservisi, vektör veritabanı (Pinecone/Qdrant) ve LLM orkestrasyonu (LangChain/LlamaIndex) içerir. Docker container üzerinden dağıtılır.",
        environmentVariables: [
          {
            key: "OPENAI_API_KEY",
            description: "LLM ve Embedding modelleri için OpenAI API erişim anahtarı",
            isRequired: true,
            sampleValue: "sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx",
            secretCategory: "AUTH",
          },
          {
            key: "PINECONE_API_KEY",
            description: "Semantik vektör indeksi ve arama için Pinecone API anahtarı",
            isRequired: true,
            sampleValue: "pcsk_xxxxxxxxxxxxxxxxxxxxxxxx",
            secretCategory: "DATABASE",
          },
          {
            key: "PINECONE_INDEX_NAME",
            description: "Hedef vektör koleksiyonu/indeks adı",
            isRequired: true,
            sampleValue: "knowledge-base-v1",
            secretCategory: "DATABASE",
          },
          {
            key: "EMBEDDING_MODEL",
            description: "Metin vektörleştirme modeli",
            isRequired: false,
            sampleValue: "text-embedding-3-small",
            secretCategory: "OTHER",
          },
        ],
        buildAndRunSteps: [
          {
            stepNumber: 1,
            title: "Python Sanal Ortam Kurulumu",
            command: "python -m venv venv && source venv/bin/activate && pip install -r requirements.txt",
            description: "Python bağımlılıklarını izole sanal ortama kurar.",
            environment: "LOCAL",
          },
          {
            stepNumber: 2,
            title: "Vektör Veritabanını İndeksle",
            command: "python -m scripts.ingest_documents",
            description: "Ham dokümanları chunk'lara böler ve vektör veritabanına aktarır.",
            environment: "LOCAL",
          },
          {
            stepNumber: 3,
            title: "API Mikroservisini Başlat",
            command: "uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4",
            description: "FastAPI REST API sunucusunu canlı istekler için ayağa kaldırır.",
            environment: "PRODUCTION",
          },
          {
            stepNumber: 4,
            title: "Docker Container ile Ayağa Kaldır",
            command: "docker compose up -d --build",
            description: "Tüm servisleri containerized ortamda arka planda başlatır.",
            environment: "DOCKER",
          },
        ],
        thirdPartyServices: [
          {
            serviceName: "OpenAI / Anthropic",
            category: "LLM Provider",
            dashboardUrl: "https://platform.openai.com/usage",
            purpose: "Doğal dil işleme ve metin vektörleştirme servisleri",
            credentialsTransferred: true,
            notes: "İşverenin kurumsal kredi kartı ve kullanım kotası yapılandırıldı.",
          },
          {
            serviceName: "Pinecone / Qdrant",
            category: "Vector Database",
            dashboardUrl: "https://app.pinecone.io",
            purpose: "Semantik arama ve RAG bağlam hafızası",
            credentialsTransferred: true,
          },
        ],
        disasterRecoverySteps: [
          {
            priority: "CRITICAL",
            scenario: "Vektör İndeksinin Bozulması / Silinmesi",
            procedure:
              "Ham doküman arşivi PostgreSQL/S3 üzerinde korunmaktadır. 'python -m scripts.ingest_documents --reindex' komutu çalıştırılarak tüm indeks yaklaşık 15 dakika içinde yeniden oluşturulabilir.",
            verificationCommand: "curl -X GET http://localhost:8000/health",
          },
          {
            priority: "HIGH",
            scenario: "OpenAI API Kota Aşımı veya Kesintisi",
            procedure:
              "Sistem yapılandırmasında 'LLM_FALLBACK_MODEL=anthropic/claude-3-haiku' yedek sağlayıcı olarak tanımlanmıştır; sistem otomatik failover yapar.",
          },
        ],
        backupSchedule: {
          frequency: "Haftalık",
          backupScriptOrCommand: "python -m scripts.backup_vector_metadata",
          storageLocation: "AWS S3 / GCS Güvenli Yedekleme Kovası",
          restoreProcedure: "python -m scripts.restore_vector_metadata --backup-file latest.json",
        },
      };
    }

    // 3. UI/UX & Design
    if (
      sectorKey.includes("design") ||
      categoryKey.includes("design") ||
      combined.includes("tasarım") ||
      combined.includes("figma") ||
      combined.includes("ui/ux") ||
      combined.includes("wireframe")
    ) {
      return {
        architectureSummary:
          "UI/UX Tasarım Sistemi & Varlık Kütüphanesi. Figma üzerinde Design Tokens (Renkler, Tipografi, Grid, Spacing) ve interaktif bileşen mimarisiyle kurgulanmıştır. Tüm SVG/Lottie varlıkları ve lisanslı font dosyaları içerir.",
        environmentVariables: [
          {
            key: "FIGMA_FILE_URL",
            description: "Ana Figma tasarım sistemi ve ekranlarının proje bağlantısı",
            isRequired: true,
            sampleValue: "https://www.figma.com/file/xxxxxxxxxxxxxxxxxx",
            secretCategory: "OTHER",
          },
          {
            key: "FIGMA_TEAM_ID",
            description: "Tasarım kütüphanesinin devredildiği Figma Takım Kimliği",
            isRequired: false,
            sampleValue: "123456789012345678",
            secretCategory: "OTHER",
          },
        ],
        buildAndRunSteps: [
          {
            stepNumber: 1,
            title: "Figma Takım Sahipliğini Doğrula",
            command: "Figma Team > Settings > Members > Change Role to Owner",
            description: "İşverenin Figma hesabının dosya sahibi (Admin/Owner) olduğunu doğrular.",
            environment: "PRODUCTION",
          },
          {
            stepNumber: 2,
            title: "Tasarım Varlıklarını (SVG/PNG/Lottie) İhraç Et",
            command: "pnpm export:design-tokens",
            description: "Figma token'larını CSS/Tailwind formatında derler.",
            environment: "LOCAL",
          },
        ],
        thirdPartyServices: [
          {
            serviceName: "Figma Professional",
            category: "Design Suite",
            dashboardUrl: "https://www.figma.com",
            purpose: "Tüm ekran tasarımları, prototipler ve bileşen kütüphanesi",
            credentialsTransferred: true,
            notes: "İşverenin kurumsal Figma organizasyonuna 'Owner' yetkisi aktarıldı.",
          },
          {
            serviceName: "Google Fonts / Commercial Font Foundry",
            category: "Typography",
            dashboardUrl: "https://fonts.google.com",
            purpose: "Yazı tipi lisansı ve web font dağıtımı",
            credentialsTransferred: true,
          },
        ],
        disasterRecoverySteps: [
          {
            priority: "CRITICAL",
            scenario: "Figma Hesabının Yanlışlıkla Silinmesi veya Erişim Kaybı",
            procedure:
              "Proje teslim anında yerel '.fig' dosya yedeği (Local Archive) indirilmiş ve işverene teslim edilmiştir. Yeni bir Figma hesabına '.fig' dosyası sürüklenerek tüm katmanlar ve prototip bağlantıları eksiksiz kurtarılabilir.",
          },
        ],
        backupSchedule: {
          frequency: "Aşama Bazlı",
          backupScriptOrCommand: "Figma File > Save local copy (.fig)",
          storageLocation: "Şirket Google Drive / OneDrive Arşivi",
          restoreProcedure: "Figma > Import File (.fig)",
        },
      };
    }

    // 4. DevOps & Security
    if (
      sectorKey.includes("security") ||
      sectorKey.includes("devops") ||
      categoryKey.includes("security") ||
      categoryKey.includes("devops") ||
      combined.includes("docker") ||
      combined.includes("kubernetes") ||
      combined.includes("terraform") ||
      combined.includes("ci/cd") ||
      combined.includes("aws")
    ) {
      return {
        architectureSummary:
          "Bulut Altyapısı & Güvenli Dağıtım Mimarisi (IaC). Terraform ile altyapı provizyonu, GitHub Actions ile otomatik CI/CD ve Cloudflare WAF/SSL koruması içerir.",
        environmentVariables: [
          {
            key: "AWS_REGION",
            description: "Sunucu ve bulut kaynaklarının barındığı ana bölge",
            isRequired: true,
            sampleValue: "eu-central-1",
            secretCategory: "OTHER",
          },
          {
            key: "CLOUDFLARE_ZONE_ID",
            description: "Alan adı DNS ve WAF kural seti için Cloudflare Zone ID",
            isRequired: true,
            sampleValue: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
            secretCategory: "OTHER",
          },
          {
            key: "SSH_BASTION_USER",
            description: "Güvenli sunucu yönetim tüneli (Bastion) kullanıcı adı",
            isRequired: true,
            sampleValue: "ubuntu",
            secretCategory: "AUTH",
          },
        ],
        buildAndRunSteps: [
          {
            stepNumber: 1,
            title: "Terraform Altyapısını Doğrula",
            command: "terraform init && terraform plan",
            description: "Bulut kaynaklarının mevcut durumunu ve konfigürasyonunu doğrular.",
            environment: "LOCAL",
          },
          {
            stepNumber: 2,
            title: "Kubernetes Kümesine Bağlan",
            command: "aws eks update-kubeconfig --region eu-central-1 --name prod-cluster",
            description: "K8s kümesi için yerel kubectl yapılandırmasını günceller.",
            environment: "LOCAL",
          },
          {
            stepNumber: 3,
            title: "Sistem Durumunu Kontrol Et",
            command: "kubectl get pods -n production",
            description: "Canlı pod'ların sağlık durumunu listeler.",
            environment: "PRODUCTION",
          },
        ],
        thirdPartyServices: [
          {
            serviceName: "Cloudflare",
            category: "DNS & WAF",
            dashboardUrl: "https://dash.cloudflare.com",
            purpose: "DDoS koruması, SSL/TLS sonlandırma ve CDN önbellekleme",
            credentialsTransferred: true,
          },
          {
            serviceName: "AWS / DigitalOcean",
            category: "Cloud Provider",
            dashboardUrl: "https://console.aws.amazon.com",
            purpose: "Sunucu (EC2/EKS), veritabanı (RDS) ve dosya depolama (S3)",
            credentialsTransferred: true,
          },
        ],
        disasterRecoverySteps: [
          {
            priority: "CRITICAL",
            scenario: "Ana Bölge (Region) Çökmesi / Veri Merkezi Kesintisi",
            procedure:
              "Terraform değişken dosyasında 'region=eu-west-1' tanımlanarak 'terraform apply' çalıştırılır. Cloudflare üzerinden DNS trafiği yeni bölge Load Balancer IP'sine yönlendirilir.",
            verificationCommand: "kubectl get nodes",
          },
          {
            priority: "HIGH",
            scenario: "SSL Sertifikası Yenileme Hatası",
            procedure:
              "Cloudflare Universal SSL kullanılıyorsa sertifika otomatik yenilenir. Nginx/Certbot kullanılıyorsa: 'certbot renew --force-renewal && systemctl reload nginx' çalıştırılmalıdır.",
            verificationCommand: "certbot certificates",
          },
        ],
        backupSchedule: {
          frequency: "Günlük Otomatik Snapshot (03:00 UTC)",
          backupScriptOrCommand: "aws rds create-db-snapshot --db-instance-identifier prod-db",
          storageLocation: "AWS RDS Multi-AZ & S3 Glacier",
          restoreProcedure: "aws rds restore-db-instance-from-db-snapshot",
        },
      };
    }

    // 5. E-Commerce & No-Code
    if (
      sectorKey.includes("ecommerce") ||
      categoryKey.includes("ecommerce") ||
      combined.includes("shopify") ||
      combined.includes("e-ticaret") ||
      combined.includes("woocommerce") ||
      combined.includes("webflow") ||
      combined.includes("sanal pos")
    ) {
      return {
        architectureSummary:
          "E-Ticaret Mağaza & Ödeme Altyapısı. Özel tema kodlaması, İyzico/Stripe sanal POS entegrasyonu, kargo takip API'leri ve transactional e-posta şablonları içerir.",
        environmentVariables: [
          {
            key: "SHOPIFY_STORE_DOMAIN",
            description: "Mağazanın myshopify.com alan adı",
            isRequired: true,
            sampleValue: "magazaniz.myshopify.com",
            secretCategory: "OTHER",
          },
          {
            key: "IYZICO_API_KEY",
            description: "İyzico Sanal POS canlı API anahtarı",
            isRequired: true,
            sampleValue: "sandbox-xxxxxxxxxxxxxxxxxxxxxxxx",
            secretCategory: "PAYMENT",
          },
          {
            key: "IYZICO_SECRET_KEY",
            description: "İyzico Sanal POS canlı gizli anahtarı",
            isRequired: true,
            sampleValue: "sandbox-xxxxxxxxxxxxxxxxxxxxxxxx",
            secretCategory: "PAYMENT",
          },
        ],
        buildAndRunSteps: [
          {
            stepNumber: 1,
            title: "Tema Geliştirme Sunucusunu Başlat",
            command: "shopify theme dev --store magazaniz.myshopify.com",
            description: "Yerel makinede temayı önizleme modunda çalıştırır.",
            environment: "LOCAL",
          },
          {
            stepNumber: 2,
            title: "Canlı Mağazaya Temayı Yayınla",
            command: "shopify theme push --live",
            description: "Geliştirilen temayı canlı mağazaya gönderir.",
            environment: "PRODUCTION",
          },
        ],
        thirdPartyServices: [
          {
            serviceName: "Shopify / WooCommerce",
            category: "E-Commerce Engine",
            dashboardUrl: "https://admin.shopify.com",
            purpose: "Ürün kataloğu, sipariş yönetimi ve müşteri veritabanı",
            credentialsTransferred: true,
          },
          {
            serviceName: "İyzico / Stripe",
            category: "Payment Gateway",
            dashboardUrl: "https://merchant.iyzipay.com",
            purpose: "3D Secure kredi kartı tahsilatları ve taksit entegrasyonu",
            credentialsTransferred: true,
          },
        ],
        disasterRecoverySteps: [
          {
            priority: "CRITICAL",
            scenario: "Tema Kodunda Hatalı Değişiklik / Ödeme Akışının Kırılması",
            procedure:
              "Shopify Admin > Online Store > Themes üzerinden 'Yedek Canlı Tema' (Backup Live Theme) tek tıkla 'Publish' edilerek sistem 30 saniye içinde eski çalışan duruma döndürülür.",
          },
        ],
        backupSchedule: {
          frequency: "Haftalık",
          backupScriptOrCommand: "Shopify Admin > Export Theme (.zip) & Export Products (CSV)",
          storageLocation: "Güvenli Şirket Bulut Deposu",
          restoreProcedure: "Shopify Admin > Add Theme > Upload zip file",
        },
      };
    }

    // Default: Web & Fullstack Software Architecture
    return {
      architectureSummary:
        "Modern Fullstack Web Uygulaması Mimarisi. Next.js App Router frontend, PostgreSQL veritabanı, Drizzle ORM, Vercel/Docker dağıtım katmanı ve Resend e-posta servislerini içerir.",
      environmentVariables: [
        {
          key: "DATABASE_URL",
          description: "Ana PostgreSQL veritabanı bağlantı URI'si (Bağlantı havuzlu)",
          isRequired: true,
          sampleValue: "postgresql://postgres:sample_password@db.example.com:5432/production_db?sslmode=require",
          secretCategory: "DATABASE",
        },
        {
          key: "NEXTAUTH_SECRET",
          description: "Oturum token'larını ve JWT çerezlerini şifreleyen 32+ baytlık rastgele gizli anahtar",
          isRequired: true,
          sampleValue: "generate_via_openssl_rand_hex_32",
          secretCategory: "AUTH",
        },
        {
          key: "NEXT_PUBLIC_APP_URL",
          description: "Uygulamanın canlı ana alan adı adresi (Protokol dahil)",
          isRequired: true,
          sampleValue: "https://app.operis-proje.com",
          secretCategory: "OTHER",
        },
        {
          key: "RESEND_API_KEY",
          description: "E-posta bildirimleri ve şifre sıfırlama için Resend API anahtarı",
          isRequired: true,
          sampleValue: "re_xxxxxxxxxxxxxxxxxxxxxxxx",
          secretCategory: "COMMUNICATION",
        },
      ],
      buildAndRunSteps: [
        {
          stepNumber: 1,
          title: "Paket Bağımlılıklarını Kur",
          command: "pnpm install",
          description: "Tüm npm paketlerini ve kütüphane bağımlılıklarını kurar.",
          environment: "LOCAL",
        },
        {
          stepNumber: 2,
          title: "Çevre Değişkenlerini Tanımla",
          command: "cp .env.example .env.local",
          description: "Örnek çevre değişkenleri şablonunu kopyalar ve gerçek değerleri girer.",
          environment: "LOCAL",
        },
        {
          stepNumber: 3,
          title: "Veritabanı Şemasını Güncelle (Migrations)",
          command: "pnpm db:push",
          description: "Yeni tabloları ve şema değişikliklerini veritabanına uygular.",
          environment: "PRODUCTION",
        },
        {
          stepNumber: 4,
          title: "Üretim Paketini Derle (Build)",
          command: "pnpm build",
          description: "TypeScript tip denetimini yapar ve optimize edilmiş üretim derlemesini oluşturur.",
          environment: "PRODUCTION",
        },
        {
          stepNumber: 5,
          title: "Canlı Sunucuyu Başlat",
          command: "docker compose up -d || pnpm start",
          description: "Uygulama sunucusunu arka planda ayağa kaldırır.",
          environment: "PRODUCTION",
        },
      ],
      thirdPartyServices: [
        {
          serviceName: "PostgreSQL / Supabase",
          category: "Database",
          dashboardUrl: "https://supabase.com/dashboard",
          purpose: "İlişkisel veritabanı, veri kalıcılığı ve otomatik günlük yedekler",
          credentialsTransferred: true,
          notes: "Proje işverenin Supabase organizasyonuna devredildi.",
        },
        {
          serviceName: "Vercel / VPS Server",
          category: "Hosting & CDN",
          dashboardUrl: "https://vercel.com/dashboard",
          purpose: "Next.js sunucu tarafı render (SSR), edge fonksiyonları ve SSL",
          credentialsTransferred: true,
        },
        {
          serviceName: "Resend",
          category: "Transactional Email",
          dashboardUrl: "https://resend.com/overview",
          purpose: "Sistem bildirimleri, karşılama e-postaları ve aktivasyon kodları",
          credentialsTransferred: true,
        },
      ],
      disasterRecoverySteps: [
        {
          priority: "CRITICAL",
          scenario: "Sunucunun Çökmesi veya Yeniden Başlatılması Durumu",
          procedure:
            "SSH ile sunucuya bağlanın: 'cd /var/www/proje && docker compose down && docker compose up -d'. Logları izlemek için: 'docker compose logs -f app'.",
          verificationCommand: "curl -I https://app.operis-proje.com/api/health",
        },
        {
          priority: "CRITICAL",
          scenario: "Veritabanının Zarar Görmesi / Veri Kaybı",
          procedure:
            "Supabase panelinden 'Database > Backups > Restore' adımıyla son 24 saatin otomatik anlık görüntüsüne tek tıkla dönülebilir. Yerel dump yedeğinden dönmek için: 'psql $DATABASE_URL < backup.sql'.",
          verificationCommand: "psql $DATABASE_URL -c 'SELECT COUNT(*) FROM users;'",
        },
        {
          priority: "HIGH",
          scenario: "SSL Sertifikasının Süresinin Dolması",
          procedure:
            "Vercel/Cloudflare kullanılıyorsa SSL otomatik yenilenir. Bağımsız VPS üzerinde Nginx/Certbot kullanılıyorsa: 'certbot renew --quiet && systemctl reload nginx' komutunu çalıştırınız.",
          verificationCommand: "certbot certificates",
        },
      ],
      backupSchedule: {
        frequency: "Her Gece 02:00 (Otomatik Günlük)",
        backupScriptOrCommand: "pg_dump -Fc $DATABASE_URL > /backups/db_$(date +%F).dump",
        storageLocation: "Cloudflare R2 / AWS S3 Şifreli Arşiv",
        restoreProcedure: "pg_restore -d $DATABASE_URL -c /backups/db_backup.dump",
      },
    };
  }
}
