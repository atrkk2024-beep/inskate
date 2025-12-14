# PowerShell скрипт деплоя API на Vercel (Windows)

Write-Host "🚀 Деплой InSkate API на Vercel..." -ForegroundColor Cyan

# Проверка Vercel CLI
$vercelPath = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelPath) {
    Write-Host "Vercel CLI не установлен. Устанавливаю..." -ForegroundColor Yellow
    npm install -g vercel
}

Set-Location api

# Генерация Prisma клиента
Write-Host "📦 Генерация Prisma клиента..." -ForegroundColor Yellow
npx prisma generate

# Деплой
Write-Host "☁️ Деплой на Vercel..." -ForegroundColor Green
vercel --prod

Set-Location ..

Write-Host ""
Write-Host "✅ Деплой завершён!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Не забудьте настроить переменные окружения в Vercel Dashboard:" -ForegroundColor Yellow
Write-Host "   - DATABASE_URL (от Supabase)" -ForegroundColor White
Write-Host "   - JWT_SECRET" -ForegroundColor White
Write-Host "   - STRIPE_SECRET_KEY" -ForegroundColor White
Write-Host "   - SMS провайдер (P1SMS_API_KEY или TWILIO_*)" -ForegroundColor White

