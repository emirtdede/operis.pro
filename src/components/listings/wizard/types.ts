export interface CategoryItem {
  id: string;
  key: string;
  slug: string;
  name: string;
  sectorKey?: string;
}

export interface ListingWizardFormProps {
  categories: CategoryItem[];
  locale: string;
  userId?: string;
}

export const CATEGORY_TECH_SUGGESTIONS: Record<string, string[]> = {
  "web-development": ["React", "Next.js", "TypeScript", "Tailwind CSS", "Node.js", "Vue.js"],
  "mobile-development": ["React Native", "Flutter", "iOS Swift", "Android Kotlin", "Expo"],
  "desktop-development": ["Electron", "Tauri", "C# .NET", "Qt", "C++"],
  "backend-api": ["Node.js", "Go", "PostgreSQL", "Redis", "Docker", "GraphQL"],
  "ai-ml": ["Python", "PyTorch", "OpenAI API", "LangChain", "TensorFlow"],
  "devops-cloud": ["AWS", "Kubernetes", "Docker", "Terraform", "GitHub Actions"],
  cybersecurity: ["Penetration Testing", "OAuth 2.0", "OWASP", "WAF", "Cryptography"],
  "qa-testing": ["Playwright", "Cypress", "Jest", "k6", "Selenium"],
  "ui-ux-design": ["Figma", "Design System", "Prototyping", "Wireframing", "Tailwind CSS"],
  "data-analytics": ["Python", "Pandas", "PowerBI", "SQL", "Airflow"],
  "blockchain-web3": ["Solidity", "Ethers.js", "Smart Contracts", "Hardhat", "Web3.js"],
  "embedded-iot": ["C++", "Rust", "ESP32", "Raspberry Pi", "MQTT"],
  "game-development": ["Unity", "Unreal Engine", "C#", "C++", "Shaders"],
};

export const DEFAULT_TECH_SUGGESTIONS = ["TypeScript", "React", "Node.js", "PostgreSQL", "Docker"];

export function getTaxToggleLabel(isOpen: boolean, isTr: boolean): string {
  if (isOpen) {
    return isTr ? "Gizle ▲" : "Hide ▲";
  }
  return isTr ? "Gör ▼" : "View ▼";
}

export const BLUEPRINT_TEMPLATE_TR = `### 1. Proje Amacı ve Kapsamı
Bu projenin temel amacı, ölçeklenebilir ve modern standartlara uygun bir çözüm geliştirmektir. Kullanıcı deneyimini en üst seviyeye çıkarmak ve operasyonel verimliliği artırmak hedeflenmektedir.

### 2. Teknik Gereksinimler ve Mimari
- Modern teknoloji yığını ile temiz, modüler ve sürdürülebilir mimari kurulumu
- Güvenli veri yönetimi, performans optimizasyonu ve kararlı API entegrasyonları
- Mobil uyumlu (responsive) ve web erişilebilirlik standartlarına uygun arayüz tasarımı

### 3. Teslim Edilecek Çıktılar
- Eksiksiz, çalışır kaynak kod deposu ve dağıtım (deployment) rehberi
- Doğrulanmış test kapsamı ve canlı ortam kurulum desteği
- Gerekli teknik mimari dokümantasyon ve devir teslim dokümanı

### 4. İletişim ve Süreç Beklentisi
- Düzenli sprint toplantıları veya haftalık şeffaf ilerleme raporlamaları
- Git (GitHub / GitLab) üzerinden şeffaf kod inceleme (code review) akışı`;

export const BLUEPRINT_TEMPLATE_EN = `### 1. Project Goals & Overview
The primary objective of this project is to deliver a scalable, robust, and modern software solution aimed at optimizing user experience and operational efficiency.

### 2. Technical Architecture & Requirements
- Clean, modular, and maintainable architecture utilizing modern industry best practices
- Secure data handling, high performance optimization, and reliable API integrations
- Fully responsive, accessible, and well-tested component design

### 3. Key Deliverables
- Complete, production-ready source code repository and deployment guide
- Comprehensive test coverage and production rollout verification
- Technical architectural documentation and clean handover notes

### 4. Communication & Milestone Cadence
- Regular milestone check-ins and structured asynchronous progress reports
- Transparent pull request and code review workflow via GitHub / GitLab`;

export function mapBudgetModeToPayload(
  budgetMode: string
): "FIXED_RANGE" | "FIXED_EXACT" | "NEGOTIABLE" {
  if (budgetMode === "RANGE") return "FIXED_RANGE";
  if (budgetMode === "FIXED") return "FIXED_EXACT";
  return "NEGOTIABLE";
}

export function getStepButtonClass(isActive: boolean, isDone: boolean): string {
  if (isActive) {
    return "border-blue-500/60 bg-blue-500/10 text-blue-400 shadow-xs";
  }
  if (isDone) {
    return "border-emerald-500/40 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 cursor-pointer";
  }
  return "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/40 text-[var(--color-text-tertiary)] opacity-60";
}

export function getClarityBadgeClass(level: string): string {
  if (level === "excellent") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  if (level === "good") return "bg-blue-500/10 text-blue-400 border-blue-500/30";
  return "bg-amber-500/10 text-amber-400 border-amber-500/30";
}

export function getClarityBarClass(level: string): string {
  if (level === "excellent") return "bg-emerald-500";
  if (level === "good") return "bg-blue-500";
  return "bg-amber-500";
}

export function getClarityLabel(level: string, isTr: boolean): string {
  if (level === "excellent") {
    return isTr ? "Mükemmel Şartname" : "Excellent Clarity";
  }
  if (level === "good") {
    return isTr ? "İyi Düzeyde" : "Good Clarity";
  }
  return isTr ? "Geliştirilmeli" : "Needs Detail";
}

export function getScopePreviewButtonLabel(isOpen: boolean, isTr: boolean): string {
  if (isOpen) {
    return isTr ? "Önizlemeyi Gizle" : "Hide Preview";
  }
  return isTr ? "Canlı Önizle" : "Live Preview";
}

export function getBudgetMinPlaceholder(budgetMode: string, isTr: boolean): string {
  if (budgetMode === "FIXED") {
    return isTr ? "Tutar" : "Amount";
  }
  return isTr ? "Min Tutar" : "Min";
}

export function getTimelineDescription(timelineMode: string, isTr: boolean): string {
  if (timelineMode === "FLEXIBLE") {
    return isTr
      ? "Teslimat takvimi karşılıklı görüşülerek netleştirilecektir."
      : "Milestone timeline to be agreed with the partner.";
  }
  return isTr ? "Teslimat için hedeflenen takvim aralığı." : "Target milestone window.";
}
