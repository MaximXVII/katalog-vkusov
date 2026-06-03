import { Suspense } from 'react'
import { unstable_cache } from 'next/cache'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { recipeCardSelect, transformCard, parsePagination, parseTagSlugs, paginated } from '@/lib/recipe-helpers'
import { REVALIDATE_SECONDS } from '@/lib/constants'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import { FilterSidebar } from '@/components/layout/FilterSidebar'
import { MobileFilterDrawer } from '@/components/layout/MobileFilterDrawer'
import { Pagination } from '@/components/ui/Pagination'
import type { TagCategory } from '@/types'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Все рецепты',
  description: 'Полная коллекция рецептов с фильтрацией по тегам, сложности и времени приготовления.',
}

interface Props {
  searchParams: { tags?: string; page?: string; difficulty?: string; maxTime?: string; original?: string }
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Sidebar-категории кешируем на час — они меняются только через админку
const getSidebarCategories = unstable_cache(
  async (): Promise<TagCategory[]> => {
    const groups = await prisma.tagCategoryGroup.findMany({ orderBy: { displayOrder: 'asc' } })
    const result = await Promise.all(
      groups.map(async (group) => {
        const tags = await prisma.tag.findMany({
          where: { category: group.slug },
          select: { id: true, slug: true, name: true, category: true },
          orderBy: { name: 'asc' },
        })
        return {
          id: group.id,
          name: group.name,
          slug: group.slug,
          displayOrder: group.displayOrder,
          icon: group.icon ?? undefined,
          tags,
        } satisfies TagCategory
      })
    )
    return result.filter((c) => c.tags.length > 0)
  },
  ['sidebar-categories'],
  { revalidate: REVALIDATE_SECONDS }
)

export default async function AllPage({ searchParams }: Props) {
  const sp = new URLSearchParams()
  if (searchParams.tags)       sp.set('tags', searchParams.tags)
  if (searchParams.page)       sp.set('page', searchParams.page)
  if (searchParams.difficulty) sp.set('difficulty', searchParams.difficulty)
  if (searchParams.maxTime)    sp.set('maxTime', searchParams.maxTime)
  if (searchParams.original)   sp.set('original', searchParams.original)

  const { page, perPage, skip } = parsePagination(sp)
  const tagSlugs = parseTagSlugs(sp)
  const difficulty = (searchParams.difficulty ?? null) as 'easy' | 'medium' | 'hard' | null
  const maxTime = searchParams.maxTime ? parseInt(searchParams.maxTime, 10) : null
  const originalOnly = searchParams.original === 'true'

  const where = {
    published: true,
    ...(difficulty && { difficulty }),
    ...(originalOnly && { isOriginal: true }),
    ...(tagSlugs.length > 0 && {
      AND: tagSlugs.map((slug) => ({ tags: { some: { tag: { slug } } } })),
    }),
  }

  const [rawAll, sidebarCategories] = await Promise.all([
    prisma.recipe.findMany({ where, select: recipeCardSelect, orderBy: { createdAt: 'desc' } }),
    getSidebarCategories(),
  ])

  const filtered = maxTime
    ? rawAll.filter((r) => (r.prepTime + r.cookTime) <= maxTime && (r.prepTime + r.cookTime) > 0)
    : rawAll

  const total = filtered.length
  const sliced = filtered.slice(skip, skip + perPage)
  const { totalPages } = paginated([], total, page, perPage)
  const recipes = shuffleArray(sliced.map(transformCard))
  const hasFilters = tagSlugs.length > 0 || !!difficulty || !!maxTime || originalOnly

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Все рецепты</h1>
          <p className="mt-1 text-sm text-gray-500">
            {hasFilters ? `${total} рецептов по выбранным фильтрам` : `${total} рецептов в коллекции`}
          </p>
        </div>
        <Suspense>
          <MobileFilterDrawer categories={sidebarCategories} />
        </Suspense>
      </div>

      <div className="flex gap-8">
        <aside className="hidden w-56 flex-shrink-0 lg:block">
          <Suspense>
            <FilterSidebar categories={sidebarCategories} />
          </Suspense>
        </aside>

        <div className="min-w-0 flex-1">
          {recipes.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <span className="text-4xl" aria-hidden>🔍</span>
              <p className="text-lg font-semibold text-gray-700">Ничего не найдено</p>
              <p className="text-sm text-gray-500">Попробуй убрать некоторые фильтры</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {recipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
              <Suspense>
                <Pagination page={page} totalPages={totalPages} />
              </Suspense>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
