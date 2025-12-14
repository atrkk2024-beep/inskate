# PowerShell скрипт сборки APK для InSkate (Windows)

param(
    [string]$ApiUrl = "http://10.0.2.2:3000/api",
    [string]$BuildType = "release"
)

# Проверка Flutter
$flutterPath = Get-Command flutter -ErrorAction SilentlyContinue
if (-not $flutterPath) {
    Write-Host "Flutter не установлен. Установите Flutter: https://docs.flutter.dev/get-started/install" -ForegroundColor Red
    exit 1
}

Write-Host "🔨 Сборка InSkate APK..." -ForegroundColor Cyan
Write-Host "API URL: $ApiUrl" -ForegroundColor Gray
Write-Host "Build type: $BuildType" -ForegroundColor Gray

Set-Location mobile

# Получить зависимости
Write-Host "📦 Получение зависимостей..." -ForegroundColor Yellow
flutter pub get

# Сборка
if ($BuildType -eq "release") {
    Write-Host "🚀 Сборка release APK..." -ForegroundColor Green
    flutter build apk --release --dart-define="API_URL=$ApiUrl"
    
    $apkPath = "build\app\outputs\flutter-apk\app-release.apk"
} else {
    Write-Host "🔧 Сборка debug APK..." -ForegroundColor Yellow
    flutter build apk --debug --dart-define="API_URL=$ApiUrl"
    
    $apkPath = "build\app\outputs\flutter-apk\app-debug.apk"
}

if (Test-Path $apkPath) {
    $size = (Get-Item $apkPath).Length / 1MB
    Write-Host ""
    Write-Host "✅ APK собран успешно!" -ForegroundColor Green
    Write-Host "📍 Путь: $apkPath" -ForegroundColor Cyan
    Write-Host "📊 Размер: $([math]::Round($size, 2)) MB" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📱 Для установки на устройство:" -ForegroundColor Yellow
    Write-Host "   adb install $apkPath" -ForegroundColor White
} else {
    Write-Host "❌ Ошибка сборки APK" -ForegroundColor Red
}

Set-Location ..

