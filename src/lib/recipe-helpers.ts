import { Prisma } from '@prisma/client'
import { RECIPES_PER_PAGE } from '@/lib/constants'

// Селектор карточки
export const recipeCardSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  imageUrl: true,
  prepTime: true,
  cookTime: true,
  difficulty: true,
  isOriginal: true,
  createdAt: true,
  tags: {
    select: {
      tag: {
        select: { id: true, slug: true, name: true, category: true },
      },
    },
  },
} satisfies Prisma.RecipeSelect

// Селектор полного рецепта
export const recipeFullSelect = {
  ...recipeCardSelect,
  ingredients: true,
  steps: true,
  published: true,
  updatedAt: true,
} satisfies Prisma.RecipeSelect

// Трансформация: убираем вложенность RecipeTag -> Tag
type RawRecipeCard = Prisma.RecipeGetPayload<{ select: typeof recipeCardSelect }>
type RawRecipeFull = Prisma.RecipeGetPayload<{ select: typeof recipeFullSelect }>

export function transformCard(r: RawRecipeCard) {
  return { ...r, tags: r.tags.map((rt) => rt.tag) }
}

export function transformFull(r: RawRecipeFull) {
  return { ...r, tags: r.tags.map((rt) => rt.tag) }
}

// Парсинг параметров запроса
export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const perPage = Math.min(
    48,
    Math.max(1, parseInt(searchParams.get('perPage') ?? String(RECIPES_PER_PAGE), 10))
  )
  return { page, perPage, skip: (page - 1) * perPage }
}

export function parseTagSlugs(searchParams: URLSearchParams): string[] {
  const raw = searchParams.get('tags')
  if (!raw) return []
  return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

// Стандартные ответы
export function paginated<T>(data: T[], total: number, page: number, perPage: number) {
  return {
    data,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  }
}
