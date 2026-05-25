import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { SITE_NAME, TELEGRAM_URL, REVALIDATE_SECONDS } from '@/lib/constants'
import { PolicyAccordion } from '@/components/ui/PolicyAccordion'

export const revalidate = REVALIDATE_SECONDS

export const metadata: Metadata = {
  title: 'О проекте',
  description: 'Что такое «Каталог Вкусов» и как им пользоваться.',
}

async function getStats() {
  const [recipeCount, tagCount, categoryCount] = await Promise.all([
    prisma.recipe.count({ where: { published: true } }),
    prisma.tag.count(),
    prisma.tagCategoryGroup.count(),
  ])
  return { recipeCount, tagCount, categoryCount }
}

export default async function AboutPage() {
  const { recipeCount, tagCount, categoryCount } = await getStats()

  const features = [
    {
      icon: '🏷️',
      title: 'Умный поиск по тегам',
      text: 'Каждый рецепт помечен тегами по ингредиентам, типу блюда, кухне и сложности. Нажми на тег — и увидишь все похожие блюда.',
    },
    {
      icon: '🔍',
      title: 'Быстрый поиск',
      text: 'Начни вводить название блюда или ингредиент — результаты появляются мгновенно, без перезагрузки страницы.',
    },
    {
      icon: '🔖',
      title: 'Закладки',
      text: 'Сохраняй понравившиеся рецепты в закладки. Они хранятся прямо в браузере — не нужно регистрироваться.',
    },
    {
      icon: '🎲',
      title: 'Случайный рецепт',
      text: 'Не знаешь что приготовить? Нажми «Случайный рецепт» на главной — получи вдохновение из всей коллекции.',
    },
    {
      icon: '📱',
      title: 'Работает на любом устройстве',
      text: 'Сайт одинаково удобен на телефоне, планшете и компьютере. Смотри рецепты прямо на кухне.',
    },
    {
      icon: '⚡',
      title: 'Мгновенная загрузка',
      text: 'Страницы генерируются заранее и кешируются. Каждый рецепт открывается молниеносно.',
    },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">

      {/* Герой */}
      <div className="mb-14 text-center">
        <div className="mb-4 flex justify-center">
          <div className="relative h-20 w-20">
            <Image src="/logo.png" alt={SITE_NAME} fill className="object-contain" priority />
          </div>
        </div>
        <h1 className="mb-4 text-4xl font-extrabold text-gray-900 sm:text-5xl">
          {SITE_NAME}
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600 leading-relaxed">
          Домашняя коллекция рецептов — удобная, быстрая и без рекламы.
          Всё что нужно для вдохновения на кухне.
        </p>
      </div>

      {/* Живая статистика */}
      <div className="mb-14 grid grid-cols-3 gap-4 rounded-2xl bg-brand-50 p-6">
        {[
          { value: recipeCount, label: recipeCount === 1 ? 'рецепт' : recipeCount < 5 ? 'рецепта' : 'рецептов' },
          { value: tagCount, label: tagCount === 1 ? 'тег' : tagCount < 5 ? 'тега' : 'тегов' },
          { value: categoryCount, label: categoryCount === 1 ? 'категория' : categoryCount < 5 ? 'категории' : 'категорий' },
        ].map(({ value, label }) => (
          <div key={label} className="text-center">
            <p className="text-3xl font-extrabold text-brand-600 sm:text-4xl">{value}</p>
            <p className="mt-1 text-sm text-gray-600">{label}</p>
          </div>
        ))}
      </div>

      {/* Возможности */}
      <section className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Что умеет сайт</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <span className="mb-3 block text-3xl" aria-hidden>{f.icon}</span>
              <h3 className="mb-1.5 text-base font-semibold text-gray-900">{f.title}</h3>
              <p className="text-sm leading-relaxed text-gray-600">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Как пользоваться */}
      <section className="mb-14 rounded-2xl bg-gray-50 p-6 sm:p-8">
        <h2 className="mb-5 text-2xl font-bold text-gray-900">Как пользоваться</h2>
        <ol className="space-y-4">
          {[
            { step: 1, text: 'На главной странице выбери категорию и нажми на интересующую подборку — например «Мясо» или «Итальянская кухня».' },
            { step: 2, text: 'Листай рецепты в подборке. В боковом меню можно добавить дополнительные фильтры.' },
            { step: 3, text: 'Открой рецепт — увидишь список ингредиентов и пошаговое приготовление.' },
            { step: 4, text: 'Нажми на иконку закладки чтобы сохранить рецепт. Все сохранённые — в разделе «Закладки».' },
          ].map(({ step, text }) => (
            <li key={step} className="flex gap-4">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
                {step}
              </span>
              <p className="text-sm leading-relaxed text-gray-700 pt-0.5">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <div className="mb-14 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-brand-600 hover:-translate-y-0.5"
        >
          Перейти к рецептам
        </Link>
        {TELEGRAM_URL && (
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-sky-300 hover:text-sky-600 hover:-translate-y-0.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            Telegram-канал
          </a>
        )}
      </div>

      {/* Политика конфиденциальности — раскрывается по клику */}
      <PolicyAccordion />

    </div>
  )
}
