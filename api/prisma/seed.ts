import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@inskate.ru' },
    update: {},
    create: {
      email: 'admin@inskate.ru',
      password: hashPassword('admin123'),
      name: 'Alexey Motorin',
    },
  });
  console.log('Created admin:', admin.email);

  // Create lesson categories
  const categories = await Promise.all([
    prisma.lessonCategory.upsert({
      where: { id: 'cat-jumps' },
      update: {},
      create: {
        id: 'cat-jumps',
        title: 'Прыжки',
        order: 0,
      },
    }),
    prisma.lessonCategory.upsert({
      where: { id: 'cat-spins' },
      update: {},
      create: {
        id: 'cat-spins',
        title: 'Вращения',
        order: 1,
      },
    }),
    prisma.lessonCategory.upsert({
      where: { id: 'cat-ofp' },
      update: {},
      create: {
        id: 'cat-ofp',
        title: 'ОФП',
        order: 2,
      },
    }),
  ]);
  console.log('Created categories:', categories.map((c) => c.title).join(', '));

  // Create sample lessons
  const jumpsLessons = [
    { title: 'Введение в прыжки', description: 'Базовые принципы прыжков', isFree: true },
    { title: 'Тулуп', description: 'Техника выполнения тулупа' },
    { title: 'Сальхов', description: 'Техника выполнения сальхова' },
    { title: 'Риттбергер', description: 'Техника выполнения риттбергера' },
    { title: 'Флип', description: 'Техника выполнения флипа' },
    { title: 'Лутц', description: 'Техника выполнения лутца' },
    { title: 'Аксель', description: 'Техника выполнения акселя' },
    { title: 'Двойные прыжки', description: 'Переход к двойным прыжкам' },
    { title: 'Каскады', description: 'Комбинации прыжков' },
    { title: 'Ошибки в прыжках', description: 'Типичные ошибки и их исправление' },
  ];

  for (let i = 0; i < jumpsLessons.length; i++) {
    await prisma.lesson.upsert({
      where: { id: `lesson-jump-${i + 1}` },
      update: {},
      create: {
        id: `lesson-jump-${i + 1}`,
        categoryId: 'cat-jumps',
        title: jumpsLessons[i].title,
        description: jumpsLessons[i].description,
        durationSec: 600 + Math.floor(Math.random() * 600),
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        thumbnailUrl: `https://picsum.photos/seed/jump${i + 1}/640/360`,
        isFree: jumpsLessons[i].isFree || false,
        status: 'PUBLISHED',
        order: i,
        publishedAt: new Date(),
      },
    });
  }
  console.log('Created jump lessons');

  const spinsLessons = [
    { title: 'Введение во вращения', description: 'Базовые принципы вращений', isFree: true },
    { title: 'Винт стоя', description: 'Техника винта стоя' },
    { title: 'Либела', description: 'Техника либелы' },
    { title: 'Волчок', description: 'Техника волчка' },
    { title: 'Заклон', description: 'Техника заклона' },
    { title: 'Бильман', description: 'Техника бильмана' },
    { title: 'Комбинированные вращения', description: 'Переходы между позициями' },
    { title: 'Прыжок во вращение', description: 'Заходы в вращения через прыжок' },
    { title: 'Скорость вращения', description: 'Как увеличить скорость' },
    { title: 'Центровка', description: 'Техника центровки вращений' },
  ];

  for (let i = 0; i < spinsLessons.length; i++) {
    await prisma.lesson.upsert({
      where: { id: `lesson-spin-${i + 1}` },
      update: {},
      create: {
        id: `lesson-spin-${i + 1}`,
        categoryId: 'cat-spins',
        title: spinsLessons[i].title,
        description: spinsLessons[i].description,
        durationSec: 600 + Math.floor(Math.random() * 600),
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        thumbnailUrl: `https://picsum.photos/seed/spin${i + 1}/640/360`,
        isFree: spinsLessons[i].isFree || false,
        status: 'PUBLISHED',
        order: i,
        publishedAt: new Date(),
      },
    });
  }
  console.log('Created spin lessons');

  const ofpLessons = [
    { title: 'Разминка', description: 'Правильная разминка перед тренировкой', isFree: true },
    { title: 'Растяжка', description: 'Упражнения на гибкость' },
    { title: 'Силовая подготовка', description: 'Базовые силовые упражнения' },
    { title: 'Баланс', description: 'Упражнения на равновесие' },
    { title: 'Координация', description: 'Развитие координации движений' },
    { title: 'Выносливость', description: 'Кардио для фигуристов' },
    { title: 'Прыжковая подготовка', description: 'Имитация прыжков вне льда' },
    { title: 'Хореография', description: 'Базовая хореографическая подготовка' },
    { title: 'Восстановление', description: 'Упражнения после тренировки' },
    { title: 'Профилактика травм', description: 'Укрепляющие упражнения' },
  ];

  for (let i = 0; i < ofpLessons.length; i++) {
    await prisma.lesson.upsert({
      where: { id: `lesson-ofp-${i + 1}` },
      update: {},
      create: {
        id: `lesson-ofp-${i + 1}`,
        categoryId: 'cat-ofp',
        title: ofpLessons[i].title,
        description: ofpLessons[i].description,
        durationSec: 600 + Math.floor(Math.random() * 600),
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        thumbnailUrl: `https://picsum.photos/seed/ofp${i + 1}/640/360`,
        isFree: ofpLessons[i].isFree || false,
        status: 'PUBLISHED',
        order: i,
        publishedAt: new Date(),
      },
    });
  }
  console.log('Created OFP lessons');

  // Create subscription plans
  const plans = await Promise.all([
    prisma.plan.upsert({
      where: { id: 'plan-standard' },
      update: {},
      create: {
        id: 'plan-standard',
        name: 'Стандарт',
        price: 100000, // $10.00 / 1000 RUB in cents
        currency: 'RUB',
        interval: 'month',
        trialDays: 3,
        features: ['Доступ ко всем видео', 'Комментарии под уроками'],
        order: 0,
      },
    }),
    prisma.plan.upsert({
      where: { id: 'plan-pro' },
      update: {},
      create: {
        id: 'plan-pro',
        name: 'Про',
        price: 300000, // 3000 RUB in cents
        currency: 'RUB',
        interval: 'month',
        trialDays: 3,
        features: ['Всё из Стандарта', '1 видеоразбор в месяц', 'Приоритетная поддержка'],
        order: 1,
      },
    }),
    prisma.plan.upsert({
      where: { id: 'plan-max' },
      update: {},
      create: {
        id: 'plan-max',
        name: 'Максимум',
        price: 1000000, // 10000 RUB in cents
        currency: 'RUB',
        interval: 'month',
        trialDays: 3,
        features: ['Всё из Про', 'Безлимитные видеоразборы', 'Личные консультации'],
        order: 2,
      },
    }),
  ]);
  console.log('Created plans:', plans.map((p) => p.name).join(', '));

  // Create coaches
  const coaches = await Promise.all([
    prisma.coach.upsert({
      where: { id: 'coach-alexey' },
      update: {},
      create: {
        id: 'coach-alexey',
        name: 'Алексей Моторин',
        level: 'Мастер спорта международного класса',
        bio: 'Основатель школы InSkate. Более 20 лет опыта в фигурном катании.',
        avatarUrl: 'https://picsum.photos/seed/coach1/200/200',
        socials: { instagram: 'inskate_alexey', youtube: 'inskate' },
      },
    }),
    prisma.coach.upsert({
      where: { id: 'coach-maria' },
      update: {},
      create: {
        id: 'coach-maria',
        name: 'Мария Петрова',
        level: 'Мастер спорта',
        bio: 'Специализация: вращения и хореография.',
        avatarUrl: 'https://picsum.photos/seed/coach2/200/200',
        socials: { instagram: 'maria_skating' },
      },
    }),
    prisma.coach.upsert({
      where: { id: 'coach-dmitry' },
      update: {},
      create: {
        id: 'coach-dmitry',
        name: 'Дмитрий Соколов',
        level: 'Кандидат в мастера спорта',
        bio: 'Специализация: прыжки и ОФП.',
        avatarUrl: 'https://picsum.photos/seed/coach3/200/200',
        socials: { instagram: 'dmitry_jumps' },
      },
    }),
  ]);
  console.log('Created coaches:', coaches.map((c) => c.name).join(', '));

  // Create sample slots for coaches
  const now = new Date();
  for (const coach of coaches) {
    for (let day = 1; day <= 14; day++) {
      const date = new Date(now.getTime() + day * 24 * 60 * 60 * 1000);
      
      // Morning slot
      const morning = new Date(date);
      morning.setHours(10, 0, 0, 0);
      await prisma.coachSlot.create({
        data: {
          coachId: coach.id,
          startAt: morning,
          endAt: new Date(morning.getTime() + 60 * 60 * 1000),
        },
      });

      // Afternoon slot
      const afternoon = new Date(date);
      afternoon.setHours(15, 0, 0, 0);
      await prisma.coachSlot.create({
        data: {
          coachId: coach.id,
          startAt: afternoon,
          endAt: new Date(afternoon.getTime() + 60 * 60 * 1000),
        },
      });
    }
  }
  console.log('Created coach slots');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

