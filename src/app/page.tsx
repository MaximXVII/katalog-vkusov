import { prisma } from '@/lib/prisma'
import { REVALIDATE_SECONDS, SITE_NAME, SITE_URL, NEW_RECIPES_DAYS } from '@/lib/constants'
import { HomeHero } from '@/components/layout/HomeHero'
import { RandomRecipeButton } from '@/components/ui/RandomRecipeButton'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import { HorizontalScroll } from '@/components/recipe/HorizontalScroll'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'
import { recipeCardSelect, transformCard } from '@/lib/recipe-helpers'

export const revalidate = REVALIDATE_SECONDS

export const metadata: Metadata = {
  title: 'Каталог Вкусов — кулинарная коллекция',
  description:
    'Коллекция лучших рецептов. Найди блюдо по ингредиенту, стране кухни или сложности приготовления.',
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'Каталог Вкусов — кулинарная коллекция',
    description: 'Коллекция лучших рецептов. Найди блюдо по ингредиенту, стране кухни или сложности приготовления.',
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: 'ru_RU',
    type: 'website',
  },
}

const CATEGORY_PALETTES = [
  { border: 'border-emerald-400', fallbackBg: 'bg-emerald-50', fallbackText: 'text-emerald-800', badge: 'bg-emerald-500/80 text-white' },
  { border: 'border-sky-400',     fallbackBg: 'bg-sky-50',     fallbackText: 'text-sky-800',     badge: 'bg-sky-500/80 text-white' },
  { border: 'border-violet-400',  fallbackBg: 'bg-violet-50',  fallbackText: 'text-violet-800',  badge: 'bg-violet-500/80 text-white' },
  { border: 'border-rose-400',    fallbackBg: 'bg-rose-50',    fallbackText: 'text-rose-800',    badge: 'bg-rose-500/80 text-white' },
  { border: 'border-amber-400',   fallbackBg: 'bg-amber-50',   fallbackText: 'text-amber-800',   badge: 'bg-amber-500/80 text-white' },
  { border: 'border-teal-400',    fallbackBg: 'bg-teal-50',    fallbackText: 'text-teal-800',    badge: 'bg-teal-500/80 text-white' },
]

// Вспомогательная нормализация
function n(s: string): string {
  return s.toLowerCase().replace(/ё/g, 'е')
}

interface SortRule {
  keywords: string[]
  order: string[]
}

const SORT_RULES: SortRule[] = [
  { keywords: ['ингредиент'], order: ['курица', 'свинина', 'говядина', 'рыба', 'овощи', 'морепродукты'] },
  { keywords: ['тип блюда', 'вид блюда', 'тип'], order: ['закуска', 'суп', 'горячее', 'салат', 'выпечка', 'десерт'] },
  { keywords: ['стоимост', 'цен'], order: ['дешев', 'средн', 'дорог'] },
  { keywords: ['сложност', 'сложн'], order: ['легк', 'прост', 'начин', 'средн', 'слож', 'трудн', 'эксперт', 'мастер'] },
  { keywords: ['способ', 'приготовлен'], order: ['сыро', 'варен', 'тушен', 'жарен', 'копчен'] },
  { keywords: ['температур'], order: ['тепл', 'холодн', 'заморожен'] },
  { keywords: ['формат'], order: ['домашн', 'стритфуд', 'фастфуд', 'ресторанн', 'высокая'] },
  { keywords: ['калор'], order: ['низкокалор', 'умеренн', 'высококалор'] },
]

interface TagForSort {
  id: string
  slug: string
  name: string
  imageUrl?: string
  _count: { recipes: number }
}

function sortTagsForGroup(groupName: string, tags: TagForSort[]): TagForSort[] {
  if (tags.length <= 1) return tags
  const normGroup = n(groupName)
  const rule = SORT_RULES.find((r) => r.keywords.some((kw) => normGroup.includes(n(kw))))
  if (!rule) return tags
  const getOrder = (tag: TagForSort): number => {
    const normName = n(tag.name)
    const idx = rule.order.findIndex((fragment) => normName.includes(n(fragment)))
    return idx === -1 ? rule.order.length * 1000 + (99999 - tag._count.recipes) : idx
  }
  return [...tags].sort((a, b) => getOrder(a) - getOrder(b))
}

async function getTagCategories() {
  const groups = await prisma.tagCategoryGroup.findMany({ orderBy: { displayOrder: 'asc' } })
  const result = await Promise.all(
    groups.map(async (group) => {
      const tags = await prisma.tag.findMany({
        where: { category: group.slug },
        select: {
          id: true,
          slug: true,
          name: true,
          imageUrl: true as never,
          _count: { select: { recipes: true } },
        },
        orderBy: { recipes: { _count: 'desc' } },
      })
      return { group, tags: sortTagsForGroup(group.name, tags) }
    })
  )
  return result.filter((r) => r.tags.length > 0)
}

async function getNewRecipes() {
  const since = new Date()
  since.setDate(since.getDate() - NEW_RECIPES_DAYS)
  const raw = await prisma.recipe.findMany({
    where: { published: true, createdAt: { gte: since } },
    select: recipeCardSelect,
    orderBy: { createdAt: 'desc' },
    take: 12,
  })
  return raw.map(transformCard)
}

export default async function HomePage() {
  const [categories, newRecipes] = await Promise.all([getTagCategories(), getNewRecipes()])

  return (
    <>
      <HomeHero />
      <div className="mx-auto max-w-7xl px-4 py-12 space-y-16">

        {/* Новинки */}
        {newRecipes.length > 0 && (
          <section>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2.5 text-xl font-bold text-gray-900 sm:text-2xl">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white shadow-sm">
                  NEW
                </span>
                Новинки
                <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-sm font-medium text-brand-700">
                  за 7 дней
                </span>
              </h2>
              <Link href="/all" className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline transition-colors">
                Все рецепты →
              </Link>
            </div>
            <HorizontalScroll>
              {newRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} compact />
              ))}
            </HorizontalScroll>
          </section>
        )}

        {/* Категории */}
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <span className="text-5xl" aria-hidden>🥘</span>
            <h2 className="text-xl font-semibold text-gray-800">Теги ещё не добавлены</h2>
            <p className="text-gray-500">
              Зайди в{' '}
              <a href="/admin" className="font-medium text-brand-600 hover:underline">
                админ-панель
              </a>{' '}
              чтобы добавить первые рецепты и теги.
            </p>
          </div>
        ) : (
          categories.map(({ group, tags }, categoryIndex) => {
            const palette = CATEGORY_PALETTES[categoryIndex % CATEGORY_PALETTES.length]
            return (
              <section key={group.id}>
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                    {group.name}
                  </h2>
                </div>
                {/*
                  На мобильных — Netflix-скролл горизонтальный
                  На sm+ — сетка
                */}
                <div
                  className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as any}
                >
                  {tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/tag/${tag.slug}`}
                      className={cn(
                        'group relative block overflow-hidden rounded-2xl border-2 shadow-sm',
                        'aspect-[4/3]',
                        'w-40 flex-shrink-0 snap-start sm:w-auto',
                        'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg',
                        palette.border
                      )}
                    >
                      {tag.imageUrl ? (
                        <>
                          <Image
                            src={tag.imageUrl}
                            alt={tag.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 640px) 160px, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                            quality={70}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                          <div className="absolute inset-x-0 bottom-0 p-2.5">
                            <p className="text-sm font-bold leading-tight text-white drop-shadow-sm line-clamp-2">
                              {tag.name}
                            </p>
                            {tag._count.recipes > 0 && (
                              <span className="mt-1 inline-block rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                                {tag._count.recipes} рец.
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className={cn(
                          'flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center',
                          palette.fallbackBg
                        )}>
                          <span className="text-4xl leading-none" aria-hidden>
                            {group.icon ?? '🍽️'}
                          </span>
                          <span className={cn('text-sm font-semibold leading-tight line-clamp-2', palette.fallbackText)}>
                            {tag.name}
                          </span>
                          {tag._count.recipes > 0 && (
                            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', palette.badge)}>
                              {tag._count.recipes} рец.
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )
          })
        )}

        {/* Случайный рецепт */}
        {categories.length > 0 && (
          <section className="rounded-2xl bg-gradient-to-r from-brand-50 to-amber-50 border border-brand-100 p-6 sm:p-8">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
              <div>
                <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                  Не знаешь что приготовить?
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Дай нам выбрать за тебя — случайный рецепт из коллекции
                </p>
              </div>
              <RandomRecipeButton />
            </div>
          </section>
        )}
      </div>
    </>
  )
}
