# InSkate by Alexey Motorin

Мобильное приложение онлайн-школы фигурного катания InSkate.

## Структура проекта

```
inskate2.0/
├── api/                    # Backend API (Node.js + Fastify + TypeScript)
├── admin/                  # Веб-админка (React + React-Admin)
├── mobile/                 # Мобильное приложение (Flutter)
├── shared/                 # Общие типы и константы
└── docker-compose.yml      # PostgreSQL + Redis для разработки
```

## Быстрый старт

### Требования

- Node.js 18+
- Docker и Docker Compose
- Flutter 3.16+ (для мобильного приложения)
- Git

### 1. Установка зависимостей

```bash
# Клонировать репозиторий
git clone <repository-url>
cd inskate2.0

# Установить зависимости Node.js
npm install
```

### 2. Запуск базы данных

```bash
# Запустить PostgreSQL и Redis
docker-compose up -d

# Проверить статус
docker-compose ps
```

### 3. Настройка API

```bash
# Перейти в директорию API
cd api

# Скопировать файл окружения
cp ../env.example .env

# Отредактировать .env файл с вашими настройками
# Особенно важно настроить:
# - DATABASE_URL
# - JWT_SECRET
# - SMS провайдер (p1sms или twilio)
# - Stripe ключи (для платежей)

# Сгенерировать Prisma клиент
npm run db:generate

# Применить миграции
npm run db:migrate

# Заполнить базу тестовыми данными
npm run db:seed

# Запустить API сервер
npm run dev
```

API будет доступен по адресу: http://localhost:3000
Документация Swagger: http://localhost:3000/docs

### 4. Запуск админки

```bash
# В новом терминале
cd admin

# Установить зависимости
npm install

# Запустить dev-сервер
npm run dev
```

Админка будет доступна по адресу: http://localhost:3001

**Данные для входа (после seed):**
- Email: admin@inskate.ru
- Пароль: admin123

### 5. Запуск мобильного приложения

```bash
# В новом терминале
cd mobile

# Получить зависимости Flutter
flutter pub get

# Запустить на эмуляторе/устройстве
flutter run
```

**Для тестирования SMS:**
В режиме разработки код подтверждения выводится в консоль API сервера.

## Основные функции

### Мобильное приложение
- ✅ Авторизация по SMS
- ✅ Каталог видео-уроков (Прыжки, Вращения, ОФП)
- ✅ Видеоплеер с управлением скоростью
- ✅ Комментарии под уроками
- ✅ Подписки через Stripe
- ✅ Бронирование индивидуальных тренировок
- ✅ Видеоразборы от тренеров
- ✅ Push-уведомления

### Админка
- ✅ Дашборд с аналитикой
- ✅ Управление пользователями
- ✅ CRUD категорий и уроков
- ✅ Модерация контента и комментариев
- ✅ Управление тарифами и подписками
- ✅ Управление тренерами и расписанием
- ✅ Обработка видеоразборов
- ✅ Push-уведомления с планированием
- ✅ Экспорт пользователей в CSV

## Технологический стек

### Backend (API)
- **Framework:** Fastify + TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Cache:** Redis
- **Auth:** JWT + SMS OTP
- **Payments:** Stripe
- **Push:** Firebase Cloud Messaging

### Admin Panel
- **Framework:** React + React-Admin
- **UI:** Material UI
- **Charts:** Recharts
- **Build:** Vite

### Mobile
- **Framework:** Flutter
- **State:** Riverpod
- **HTTP:** Dio
- **Video:** youtube_player_flutter
- **Push:** Firebase Messaging

## Переменные окружения

Основные переменные в `.env`:

```env
# Database
DATABASE_URL="postgresql://inskate:inskate_dev_password@localhost:5432/inskate"

# JWT
JWT_SECRET="your-secret-key"

# SMS (выберите провайдера)
SMS_PROVIDER="p1sms"
P1SMS_API_KEY="your-api-key"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Firebase (для push)
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_PRIVATE_KEY="..."
FIREBASE_CLIENT_EMAIL="..."
```

## API Endpoints

### Авторизация
- `POST /api/auth/send-code` - Отправка SMS-кода
- `POST /api/auth/verify-code` - Проверка кода и вход
- `POST /api/auth/refresh` - Обновление токена
- `GET /api/auth/me` - Текущий пользователь

### Контент
- `GET /api/categories` - Список категорий
- `GET /api/lessons` - Список уроков
- `GET /api/lessons/:id` - Детали урока
- `GET /api/comments/lesson/:id` - Комментарии к уроку

### Подписки
- `GET /api/plans` - Список тарифов
- `POST /api/subscriptions/checkout` - Создание checkout сессии
- `GET /api/subscriptions/me` - Текущая подписка

### Бронирования
- `GET /api/coaches` - Список тренеров
- `POST /api/bookings` - Создание бронирования
- `GET /api/bookings/me` - Мои бронирования

### Видеоразборы
- `GET /api/video-reviews/me` - Мои разборы
- `POST /api/video-reviews` - Создание разбора
- `POST /api/video-reviews/:id/messages` - Добавление сообщения

## Stripe Webhooks

Для обработки платежей необходимо настроить webhook endpoint:

```bash
# Для локальной разработки используйте Stripe CLI
stripe listen --forward-to localhost:3000/webhooks/stripe
```

События для обработки:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

## Деплой

Полная инструкция: [DEPLOY.md](./DEPLOY.md)

### Быстрый деплой на Vercel + Supabase

```powershell
# 1. Создайте проект на supabase.com и скопируйте Connection string

# 2. Установите Vercel CLI
npm install -g vercel
vercel login

# 3. Деплой API
cd api
npm install && npx prisma generate
vercel --prod
# Добавьте DATABASE_URL (от Supabase), JWT_SECRET в Vercel Dashboard

# 4. Деплой Admin
cd ../admin
npm install && vercel --prod
# Добавьте VITE_API_URL в Vercel Dashboard

# 5. Сборка APK
cd ../mobile
flutter pub get
flutter build apk --release --dart-define=API_URL=https://your-api.vercel.app/api
```

### CI/CD через GitHub Actions

При push в main автоматически:
- API деплоится на Vercel (при изменениях в `api/`)
- Admin деплоится на Vercel (при изменениях в `admin/`)
- APK собирается и выкладывается в Artifacts

Необходимые секреты в GitHub:
- `VERCEL_TOKEN` - токен Vercel
- `VERCEL_ORG_ID` - ID организации
- `VERCEL_API_PROJECT_ID` - ID проекта API
- `VERCEL_ADMIN_PROJECT_ID` - ID проекта Admin
- `VITE_API_URL` - URL API для Admin
- `API_URL` - URL API для Mobile

## Поддержка

По вопросам разработки: dev@inskate.ru

---

© 2024 InSkate by Alexey Motorin

