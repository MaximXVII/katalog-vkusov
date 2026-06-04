import { Suspense } from 'react'
import { unstable_cache } from 'next/cache'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { recipeCardSelect, transformCard, parsePagination, parseTagSlugs, parseExcludeSlugs, paginated } from '@/lib/recipe-helpers'
import { REVALIDATE_SECONDS } from '@/lib/constants'
import { FilterSidebar } from '@/components/layout/FilterSidebar'
import { MobileFilterDrawer } from '@/components/layout/MobileFilterDrawer'
import { RecipeGridLazy } from '@/components/recipe/RecipeGridLazy'
import { Pagination } from '@/components/ui/Pagination'
import type { TagCategory } from '@/types'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Все рецепты',
  description: 'Полная коллекция рецептов с фильтрацией по тегам, сложности и времени приготовления.',
}

interface Props {
  searchParams: { tags?: string; page?: string; difficulty?: string; maxTime?: string; original?: string; exclude?: string }
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Sidebar-категории кешируем на час
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
  if (searchParams.exclude)    sp.set('exclude', searchParams.exclude)

  const { page, perPage, skip } = parsePagination(sp)
  const tagSlugs = parseTagSlugs(sp)
  const excludeSlugs = parseExcludeSlugs(sp)
  const difficulty = (searchParams.difficulty ?? null) as 'easy' | 'medium' | 'hard' | null
  const maxTime = searchParams.maxTime ? parseInt(searchParams.maxTime, 10) : null
  const originalOnly = searchParams.original === 'true'

  const sidebarCategories = await getSidebarCategories()

  // Группируем теги по категориям для OR внутри категории, AND между категориями
  const tagsByCategory = new Map<string, string[]>()
  for (const slug of tagSlugs) {
    for (const cat of sidebarCategories) {
      if (cat.tags.some((t) => t.slug === slug)) {
        const existing = tagsByCategory.get(cat.slug) ?? []
        tagsByCategory.set(cat.slug, [...existing, slug])
        break
      }
    }
  }

  // DEBUG: remove after testing
  if (tagSlugs.length > 0) {
    console.log('[filter] tagSlugs:', tagSlugs)
    console.log('[filter] tagsByCategory:', Object.fromEntries(tagsByCategory))
  }

  const tagAndConditions = Array.from(tagsByCategory.values()).map((slugs) =>
    slugs.length === 1
      ? { tags: { some: { tag: { slug: slugs[0] } } } }
      : { OR: slugs.map((slug) => ({ tags: { some: { tag: { slug } } } })) }
  )

  const where = {
    published: true,
    ...(difficulty && { difficulty }),
    ...(originalOnly && { isOriginal: true }),
    ...(tagAndConditions.length > 0 && { AND: tagAndConditions }),
    ...(excludeSlugs.length > 0 && {
      NOT: excludeSlugs.map((slug) => ({ tags: { some: { tag: { slug } } } })),
    }),
  }

  const rawAll = await prisma.recipe.findMany({ where, select: recipeCardSelect, orderBy: { createdAt: 'desc' } })

  const filtered = maxTime
    ? rawAll.filter((r) => (r.prepTime + r.cookTime) <= maxTime && (r.prepTime + r.cookTime) > 0)
    : rawAll

  const total = filtered.length
  const sliced = filtered.slice(skip, skip + perPage)
  const { totalPages } = paginated([], total, page, perPage)
  const recipes = shuffleArray(sliced.map(transformCard))
  const hasFilters = tagSlugs.length > 0 || excludeSlugs.length > 0 || !!difficulty || !!maxTime || originalOnly

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
              <RecipeGridLazy recipes={recipes} />
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
