# 🚀 Пошаговый деплой InSkate v2.0

## ⚡ Подготовка (5 минут)

### Шаг 1: Откройте PowerShell в папке проекта
```
Правый клик на папке inskate2.0 → "Открыть в терминале"
```

### Шаг 2: Установите Vercel CLI
```powershell
npm install -g vercel
```

### Шаг 3: Войдите в Vercel
```powershell
vercel login
```
- Откроется браузер
- Войдите через GitHub/GitLab/Email

---

## 🗄️ Часть 1: База данных Supabase (3 минуты)

### Шаг 4: Создайте проект на Supabase
1. Откройте https://supabase.com
2. Нажмите "Start your project" → Войти через GitHub
3. "New Project"
   - Name: `inskate`
   - Database Password: **запомните пароль!**
   - Region: `Frankfurt (eu-central-1)`
4. Дождитесь создания (~2 мин)

### Шаг 5: Скопируйте Connection String
1. Settings → Database
2. Раздел "Connection string" → URI
3. Скопируйте строку, замените `[YOUR-PASSWORD]` на ваш пароль

Пример:
```
postgresql://postgres.xxxx:ВАШ_ПАРОЛЬ@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

---

## 🔧 Часть 2: API на Vercel (5 минут)

### Шаг 6: Установите зависимости API
```powershell
cd api
npm install
```

### Шаг 7: Сгенерируйте Prisma
```powershell
npx prisma generate
```

### Шаг 8: Примените миграции к Supabase
```powershell
$env:DATABASE_URL="ВАША_СТРОКА_SUPABASE"
npx prisma migrate deploy
```

### Шаг 9: Задеплойте API на Vercel
```powershell
vercel --prod
```

На вопросы ответьте:
- Set up and deploy? **Y**
- Which scope? Ваш аккаунт
- Link to existing project? **N**
- Project name: **inskate-api**
- Directory: **./**
- Override settings? **N**

### Шаг 10: Добавьте переменные окружения
1. Откройте https://vercel.com → Ваш проект `inskate-api`
2. Settings → Environment Variables
3. Добавьте:

| Name | Value |
|------|-------|
| `DATABASE_URL` | Строка от Supabase |
| `JWT_SECRET` | Любая строка 32+ символа (например: `openssl rand -base64 32`) |
| `JWT_REFRESH_SECRET` | Другая случайная строка |
| `JWT_EXPIRES_IN` | `7d` |
| `SMS_PROVIDER` | `mock` (для тестирования) |
| `ADMIN_URL` | `https://inskate-admin.vercel.app` |
| `NODE_ENV` | `production` |

### Шаг 11: Пересоберите API
```powershell
vercel --prod
```

Запомните URL: `https://inskate-api.vercel.app`

---

## 🖥️ Часть 3: Admin панель на Vercel (3 минуты)

### Шаг 12: Перейдите в admin
```powershell
cd ..\admin
npm install
```

### Шаг 13: Задеплойте Admin
```powershell
vercel --prod
```

На вопросы:
- Project name: **inskate-admin**
- Override settings? **N**

### Шаг 14: Добавьте переменную API URL
1. Vercel → проект `inskate-admin` → Settings → Environment Variables
2. Добавьте:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://inskate-api.vercel.app/api` |

### Шаг 15: Пересоберите Admin
```powershell
vercel --prod
```

URL админки: `https://inskate-admin.vercel.app`

---

## 📱 Часть 4: Сборка APK (5 минут)

### Шаг 16: Перейдите в mobile
```powershell
cd ..\mobile
flutter pub get
```

### Шаг 17: Соберите APK
```powershell
flutter build apk --release --dart-define=API_URL=https://inskate-api.vercel.app/api
```

### Шаг 18: Найдите APK
```
mobile\build\app\outputs\flutter-apk\app-release.apk
```

Скопируйте на телефон и установите!

---

## ✅ Проверка

### API
Откройте в браузере:
```
https://inskate-api.vercel.app/health
```
Должно показать: `{"status":"ok","timestamp":"..."}`

### Admin
Откройте:
```
https://inskate-admin.vercel.app
```

### Mobile
Установите APK и проверьте регистрацию

---

## 🔐 Генерация секретных ключей

PowerShell:
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

Или онлайн: https://generate-secret.vercel.app/32

---

## 🆘 Решение проблем

### "Cannot connect to database"
- Проверьте DATABASE_URL в Vercel
- Убедитесь что пароль без спецсимволов (или URL-encoded)

### "CORS error"  
- Проверьте ADMIN_URL в переменных API

### "SMS not working"
- В тестовом режиме (SMS_PROVIDER=mock) код выводится в логах Vercel
- Логи: Vercel → Project → Deployments → Functions

### Пересборка после изменения переменных
```powershell
vercel --prod --force
```

---

## 📋 Итоговые URL

После деплоя у вас будут:
- API: `https://inskate-api.vercel.app`
- Admin: `https://inskate-admin.vercel.app`  
- APK: `mobile\build\app\outputs\flutter-apk\app-release.apk`

🎉 Готово!
