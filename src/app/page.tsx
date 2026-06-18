import { prisma } from '@/lib/prisma'
import { REVALIDATE_SECONDS, SITE_NAME, SITE_URL, NEW_RECIPES_DAYS } from '@/lib/constants'
import { HomeHero } from '@/components/layout/HomeHero'
import { RandomRecipeButton } from '@/components/ui/RandomRecipeButton'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import { HorizontalScroll } from '@/components/recipe/HorizontalScroll'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'
import { recipeCardSelect, transformCard } from '@/lib/recipe-helpers'
import { RecipeGridLazy } from '@/components/recipe/RecipeGridLazy'

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
  { fallbackBg: 'bg-emerald-50' },
  { fallbackBg: 'bg-sky-50' },
  { fallbackBg: 'bg-violet-50' },
  { fallbackBg: 'bg-rose-50' },
  { fallbackBg: 'bg-amber-50' },
  { fallbackBg: 'bg-teal-50' },
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

async function getAllRecipesShuffled() {
  const raw = await prisma.recipe.findMany({
    where: { published: true },
    select: recipeCardSelect,
    orderBy: { createdAt: 'desc' },
  })
  const cards = raw.map(transformCard)
  // Fisher-Yates — свежее перемешивание при каждой ISR-перегенерации страницы
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[cards[i], cards[j]] = [cards[j], cards[i]]
  }
  return cards
}

export default async function HomePage() {
  const [categories, newRecipes, allRecipes] = await Promise.all([
    getTagCategories(),
    getNewRecipes(),
    getAllRecipesShuffled(),
  ])

  return (
    <>
      <HomeHero />
      <div className="mx-auto max-w-7xl px-4 py-12 space-y-6 sm:py-8 sm:space-y-10">

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
                <HorizontalScroll>
                  {tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/tag/${tag.slug}`}
                      className={cn(
                        'group flex min-w-[112px] flex-shrink-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm',
                        'transition-all duration-300 hover:-translate-y-1 hover:shadow-lg'
                      )}
                    >
                      <div className="flex h-32 items-center justify-center overflow-hidden bg-gray-50 sm:h-36">
                        {tag.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={tag.imageUrl}
                            alt={tag.name}
                            loading="lazy"
                            className="h-full w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className={cn('flex h-full w-32 items-center justify-center', palette.fallbackBg)}>
                            <span className="text-4xl leading-none" aria-hidden>
                              {group.icon ?? '🍽️'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-0.5 p-3.5">
                        <p className="text-sm font-semibold leading-snug text-gray-900 line-clamp-1 transition-colors group-hover:text-brand-600">
                          {tag.name}
                        </p>
                        {tag._count.recipes > 0 && (
                          <span className="text-xs text-gray-500">
                            {tag._count.recipes} рец.
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </HorizontalScroll>
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

        {/* Листай дальше — все рецепты перемешаны, без фильтров, бесконечная подгрузка */}
        {allRecipes.length > 0 && (
          <section>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                Листай дальше
              </h2>
              <Link href="/all" className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline transition-colors">
                С фильтрами →
              </Link>
            </div>
            <RecipeGridLazy recipes={allRecipes} />
          </section>
        )}
      </div>
    </>
  )
}
