# PowerShell скрипт деплоя Admin на Vercel (Windows)

param(
    [string]$ApiUrl = ""
)

Write-Host "🚀 Деплой InSkate Admin на Vercel..." -ForegroundColor Cyan

if ($ApiUrl -eq "") {
    Write-Host "⚠️  Укажите URL API:" -ForegroundColor Yellow
    Write-Host "   .\scripts\deploy-admin.ps1 -ApiUrl https://your-api.vercel.app/api" -ForegroundColor White
    exit 1
}

# Проверка Vercel CLI
$vercelPath = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelPath) {
    Write-Host "Vercel CLI не установлен. Устанавливаю..." -ForegroundColor Yellow
    npm install -g vercel
}

Set-Location admin

# Установить переменную окружения
Write-Host "⚙️  Установка VITE_API_URL=$ApiUrl" -ForegroundColor Yellow
vercel env add VITE_API_URL production --force

# Деплой
Write-Host "☁️ Деплой на Vercel..." -ForegroundColor Green
vercel --prod

Set-Location ..

Write-Host ""
Write-Host "✅ Admin панель задеплоена!" -ForegroundColor Green

