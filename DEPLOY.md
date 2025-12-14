# Инструкция по деплою InSkate v2.0

## Быстрый старт (5 минут)

```powershell
# 1. Создайте проект на Supabase.com и скопируйте Connection string

# 2. Установите Vercel CLI
npm install -g vercel
vercel login

# 3. Деплой API
cd api
npm install
npx prisma generate
vercel --prod
# Добавьте DATABASE_URL и другие env в Vercel Dashboard

# 4. Деплой Admin
cd ../admin
npm install
vercel --prod
# Добавьте VITE_API_URL в Vercel Dashboard

# 5. Сборка APK
cd ../mobile
flutter pub get
flutter build apk --release --dart-define=API_URL=https://your-api.vercel.app/api
```

---

## 1. Настройка Supabase (PostgreSQL)

### 1.1 Создание проекта
1. Зайдите на https://supabase.com и создайте аккаунт
2. Создайте новый проект (регион: Frankfurt или ближайший)
3. Запомните пароль от базы данных

### 1.2 Получение строки подключения
1. Settings → Database → Connection string
2. Выберите "URI" и скопируйте строку
3. Замените `[YOUR-PASSWORD]` на ваш пароль

Пример:
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

### 1.3 Применение миграций
```bash
cd api

# Установите переменную окружения локально
export DATABASE_URL="postgresql://postgres:YOUR-PASSWORD@db.xxxxx.supabase.co:5432/postgres"

# Примените миграции
npx prisma migrate deploy

# Заполните тестовыми данными (опционально)
npx prisma db seed
```

---

## 2. Деплой API на Vercel

### 2.1 Подготовка
```bash
cd api
npm install -g vercel
vercel login
```

### 2.2 Настройка переменных окружения
Создайте в Vercel Dashboard или через CLI:

```bash
vercel env add DATABASE_URL production
# Вставьте строку подключения Supabase

vercel env add JWT_SECRET production
# Сгенерируйте: openssl rand -base64 32

vercel env add JWT_REFRESH_SECRET production
# Сгенерируйте: openssl rand -base64 32

vercel env add STRIPE_SECRET_KEY production
# sk_live_... от Stripe

vercel env add STRIPE_WEBHOOK_SECRET production
# whsec_... от Stripe

vercel env add SMS_PROVIDER production
# p1sms или twilio

vercel env add P1SMS_API_KEY production
# API ключ от p1sms

vercel env add ADMIN_URL production
# https://your-admin.vercel.app
```

### 2.3 Деплой
```bash
cd api
vercel --prod
```

Запомните URL: `https://inskate-api.vercel.app`

### 2.4 Настройка Stripe Webhook
1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-api.vercel.app/webhooks/stripe`
3. События: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`
4. Скопируйте Signing secret в `STRIPE_WEBHOOK_SECRET`

---

## 3. Деплой Admin на Vercel

### 3.1 Настройка переменных
```bash
cd admin
vercel env add VITE_API_URL production
# https://your-api.vercel.app/api
```

### 3.2 Деплой
```bash
cd admin
vercel --prod
```

URL: `https://inskate-admin.vercel.app`

### 3.3 Обновите ADMIN_URL в API
```bash
cd ../api
vercel env add ADMIN_URL production
# https://inskate-admin.vercel.app
vercel --prod
```

---

## 4. Сборка APK (Android)

### 4.1 Настройка Firebase
1. Firebase Console → Create Project "InSkate"
2. Add Android app: `com.inskate.app`
3. Скачайте `google-services.json`
4. Поместите в `mobile/android/app/google-services.json`

### 4.2 Настройка API URL
Отредактируйте `mobile/lib/core/config/api_config.dart`:

```dart
class ApiConfig {
  static const String baseUrl = 'https://your-api.vercel.app/api';
  // ...
}
```

### 4.3 Сборка APK
```bash
cd mobile

# Получить зависимости
flutter pub get

# Сборка release APK
flutter build apk --release

# APK будет в:
# mobile/build/app/outputs/flutter-apk/app-release.apk
```

### 4.4 Сборка App Bundle (для Google Play)
```bash
flutter build appbundle --release
# mobile/build/app/outputs/bundle/release/app-release.aab
```

---

## 5. Сборка iOS (требуется macOS)

### 5.1 Настройка Firebase
1. Firebase Console → Add iOS app: `com.inskate.app`
2. Скачайте `GoogleService-Info.plist`
3. Поместите в `mobile/ios/Runner/GoogleService-Info.plist`

### 5.2 Сборка IPA
```bash
cd mobile

# Открыть в Xcode
open ios/Runner.xcworkspace

# Или через CLI
flutter build ipa --release
```

---

## 6. Проверка деплоя

### API
```bash
curl https://your-api.vercel.app/health
# {"status":"ok","timestamp":"..."}
```

### Admin
Откройте https://your-admin.vercel.app
Логин: admin@inskate.ru / admin123

### Mobile
Установите APK на устройство и проверьте:
- Регистрация по SMS
- Просмотр уроков
- Оформление подписки

---

## 7. Мониторинг

### Vercel
- Dashboard → Logs для просмотра ошибок
- Analytics для метрик

### Supabase
- Dashboard → Database → Table Editor
- SQL Editor для запросов

### Stripe
- Dashboard → Payments для отслеживания платежей

---

## Полезные команды

```bash
# Просмотр логов API
vercel logs https://your-api.vercel.app

# Пересобрать с новыми env
vercel --prod --force

# Откатить на предыдущую версию
vercel rollback

# Просмотр всех деплоев
vercel ls
```

---

## Troubleshooting

### "Database connection failed"
- Проверьте DATABASE_URL в Vercel env
- Убедитесь что IP Vercel разрешён в Supabase (Settings → Database → Connection Pooling)

### "SMS not sending"
- Проверьте API ключ SMS провайдера
- В dev режиме код выводится в логах

### "Stripe webhook fails"
- Проверьте STRIPE_WEBHOOK_SECRET
- URL должен быть точным: `/webhooks/stripe`

### "CORS error в Admin"
- Убедитесь что ADMIN_URL установлен в API env
- Пересобрите API после изменения

