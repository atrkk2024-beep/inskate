#!/bin/bash
# Скрипт сборки APK для InSkate

# Проверка наличия Flutter
if ! command -v flutter &> /dev/null; then
    echo "Flutter не установлен. Установите Flutter: https://docs.flutter.dev/get-started/install"
    exit 1
fi

# Переменные
API_URL="${API_URL:-http://10.0.2.2:3000/api}"
BUILD_TYPE="${1:-release}"

echo "🔨 Сборка InSkate APK..."
echo "API URL: $API_URL"
echo "Build type: $BUILD_TYPE"

cd mobile

# Получить зависимости
echo "📦 Получение зависимостей..."
flutter pub get

# Сборка
if [ "$BUILD_TYPE" = "release" ]; then
    echo "🚀 Сборка release APK..."
    flutter build apk --release --dart-define=API_URL="$API_URL"
    
    APK_PATH="build/app/outputs/flutter-apk/app-release.apk"
    echo ""
    echo "✅ APK собран успешно!"
    echo "📍 Путь: $APK_PATH"
    echo "📊 Размер: $(du -h "$APK_PATH" | cut -f1)"
else
    echo "🔧 Сборка debug APK..."
    flutter build apk --debug --dart-define=API_URL="$API_URL"
    
    APK_PATH="build/app/outputs/flutter-apk/app-debug.apk"
    echo ""
    echo "✅ Debug APK собран!"
    echo "📍 Путь: $APK_PATH"
fi

echo ""
echo "📱 Для установки на устройство:"
echo "   adb install $APK_PATH"

