<#
.SYNOPSIS
  Operis (Vellium) - Strix AI Otonom Penetrasyon Testi Güvenli Başlatıcı Betiği
.DESCRIPTION
  Bu betik, Strix AI pentest aracını izole ortam değişkenleri, bütçe sınırlandırması ($5 max),
  hedef kapsamı, ChatGPT (GPT-5.6) ve Gemini Flash 3.8 / 2.5 yedekleme desteğiyle çalıştırır.
.PARAMETER Target
  Taranacak alt dizin (varsayılan: "api"). Seçenekler: "api", "modules", "full-backend"
.PARAMETER Provider
  Kullanılacak sağlayıcı: "auto", "chatgpt", "gemini" (varsayılan: "auto")
.PARAMETER Model
  Özel model adı (Boş bırakılırsa ChatGPT için "chatgpt/gpt-5.6", Gemini için "gemini/gemini-2.5-flash" seçilir)
.PARAMETER ScanMode
  Tarama modu: "quick", "standard", "deep" (varsayılan: "standard")
.PARAMETER MaxBudget
  Maksimum LLM bütçesi (USD, varsayılan: 5)
.PARAMETER Instruction
  Özel güvenlik talimatı
#>

[CmdletBinding()]
param (
    [ValidateSet("api", "modules", "full-backend")]
    [string]$Target = "api",

    [ValidateSet("auto", "chatgpt", "gemini")]
    [string]$Provider = "auto",

    [string]$Model = "",

    [ValidateSet("quick", "standard", "deep")]
    [string]$ScanMode = "standard",

    [double]$MaxBudget = 5.0,

    [string]$Instruction = "Focus on authorization bypass, IDOR, BOLA, input sanitization and API security in Next.js App Router endpoints."
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  OPERIS (VELLIUM) - STRIX AI PENTEST GÜVENLİ BAŞLATICI   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 0. .env.pentest dosyasını yükle (Varsa)
$pentestEnvFile = Join-Path $PSScriptRoot "..\.env.pentest"
if (Test-Path $pentestEnvFile) {
    Get-Content $pentestEnvFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $varName = $parts[0].Trim()
            $varVal = $parts[1].Trim()
            if (-not [System.Environment]::GetEnvironmentVariable($varName, "Process")) {
                [System.Environment]::SetEnvironmentVariable($varName, $varVal, "Process")
            }
        }
    }
}

# 1. Docker Daemon Kontrolü
Write-Host "`n[1/4] Docker Daemon kontrol ediliyor..." -ForegroundColor Yellow
try {
    $null = docker ps 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker daemon erisilemiyor."
    }
    Write-Host "  [OK] Docker calisir durumda." -ForegroundColor Green
} catch {
    Write-Host "  [HATA] Docker Desktop calismiyor!" -ForegroundColor Red
    Write-Host "  Strix izole sandbox konteynerleri olusturmak icin Docker motoruna ihtiyac duyar." -ForegroundColor Yellow
    Write-Host "  Lutfen Docker Desktop uygulamasini baslatin ve komutu tekrar calistirin." -ForegroundColor Yellow
    exit 1
}

# 2. Strix CLI Konumunu Tespit Etme
Write-Host "`n[2/4] Strix CLI kontrol ediliyor..." -ForegroundColor Yellow
$strixPath = "strix"
$strixCmd = Get-Command strix -ErrorAction SilentlyContinue
if (-not $strixCmd) {
    $fallbackPath = "C:\Users\DEDE-\AppData\Roaming\Python\Python314\Scripts\strix.exe"
    if (Test-Path $fallbackPath) {
        $strixPath = $fallbackPath
        Write-Host "  [OK] Strix yerel Python Scripts dizininde bulundu: $strixPath" -ForegroundColor Green
    } else {
        Write-Host "  [HATA] 'strix' komutu bulunamadi." -ForegroundColor Red
        Write-Host "  Kurulum icin calistirin: python -m pip install --upgrade strix-agent" -ForegroundColor Cyan
        exit 1
    }
} else {
    Write-Host "  [OK] Strix PATH icinde bulundu: $($strixCmd.Source)" -ForegroundColor Green
}

# 3. LLM Kimlik ve Model Kontrolü
Write-Host "`n[3/4] LLM ve Kimlik Dogrulama kontrol ediliyor..." -ForegroundColor Yellow

$hasAuthSession = $false
try {
    $authStatus = & $strixPath auth status 2>&1
    if ($LASTEXITCODE -eq 0 -and $authStatus -match "Signed in") {
        $hasAuthSession = $true
    }
} catch {}

$activeProvider = $Provider
if ($activeProvider -eq "auto") {
    if ($hasAuthSession) {
        $activeProvider = "chatgpt"
    } elseif ($env:GEMINI_API_KEY -or $env:LLM_API_KEY) {
        $activeProvider = "gemini"
    } else {
        Write-Host "  [UYARI] Aktif bir LLM kimligi bulunamadi!" -ForegroundColor Red
        Write-Host "  1) ChatGPT ile giris:   strix auth login chatgpt" -ForegroundColor Yellow
        Write-Host "  2) Gemini API Key ile:  -Provider 'gemini'" -ForegroundColor Yellow
        exit 1
    }
}

if ($activeProvider -eq "chatgpt") {
    if (-not $hasAuthSession) {
        Write-Host "  [HATA] ChatGPT oturumu kapali. Calistirin: strix auth login chatgpt" -ForegroundColor Red
        exit 1
    }
    $selectedModel = if ($Model) { $Model } elseif ($env:STRIX_LLM -and $env:STRIX_LLM.StartsWith("chatgpt/")) { $env:STRIX_LLM } else { "chatgpt/gpt-5.5" }
    $env:STRIX_LLM = $selectedModel
    Write-Host "  [OK] Saglayici: ChatGPT Aboneligi (Kota dahilinde)" -ForegroundColor Green
    Write-Host "  [OK] Model: $env:STRIX_LLM" -ForegroundColor Green
} elseif ($activeProvider -eq "gemini") {
    $geminiKey = if ($env:GEMINI_API_KEY) { $env:GEMINI_API_KEY } else { $env:LLM_API_KEY }
    if (-not $geminiKey) {
        Write-Host "  [HATA] GEMINI_API_KEY bulunamadi!" -ForegroundColor Red
        exit 1
    }
    $env:GEMINI_API_KEY = $geminiKey
    $env:LLM_API_KEY = $geminiKey
    $selectedModel = if ($Model) { $Model } elseif ($env:STRIX_LLM -and $env:STRIX_LLM.StartsWith("gemini/")) { $env:STRIX_LLM } else { "gemini/gemini-3.8-flash" }
    $env:STRIX_LLM = $selectedModel
    Write-Host "  [OK] Saglayici: Google Gemini Flash" -ForegroundColor Green
    Write-Host "  [OK] Model: $env:STRIX_LLM" -ForegroundColor Green
    Write-Host "  [OK] API Anahtari yuklendi (.env.pentest korumali)" -ForegroundColor Green
}

Write-Host "  [OK] Maksimum Butce: $MaxBudget USD" -ForegroundColor Green
Write-Host "  [OK] Tarama Modu: $ScanMode" -ForegroundColor Green

# 4. Hedef Dizin Belirleme ve Taramayı Başlatma
$targetPath = switch ($Target) {
    "api"          { "./src/app/api" }
    "modules"      { "./src/modules" }
    "full-backend" { "./src" }
}

Write-Host "`n[4/4] Strix AI Pentest baslatiliyor..." -ForegroundColor Yellow
Write-Host "  Hedef Dizin: $targetPath" -ForegroundColor Cyan
Write-Host "  Guvenlik Talimati: $Instruction" -ForegroundColor Gray
Write-Host "  Sonuclar 'strix_runs/' altina kaydedilecektir (.gitignore korumali)." -ForegroundColor Gray
Write-Host "----------------------------------------------------------`n" -ForegroundColor DarkGray

& $strixPath --target $targetPath --scan-mode $ScanMode --max-budget-usd $MaxBudget --instruction $Instruction

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[BASARILI] Pentest taramasi tamamlandi." -ForegroundColor Green
    Write-Host "Detayli rapor ve PoC scriptleri 'strix_runs/' dizinindedir." -ForegroundColor Cyan
} else {
    Write-Host "`n[BILGI] Tarama kod $LASTEXITCODE ile sonlandi." -ForegroundColor Yellow
    if ($activeProvider -eq "chatgpt") {
        Write-Host "`n[IPUCU] Eger ChatGPT kotaniz dolduysa, Gemini anahtarinizla devam etmek icin:" -ForegroundColor Cyan
        Write-Host "powershell -ExecutionPolicy Bypass -File scripts/run-strix-scan.ps1 -Provider 'gemini'" -ForegroundColor Yellow
    }
}
