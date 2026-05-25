import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  recipeCardSelect,
  transformCard,
  parsePagination,
  parseTagSlugs,
  paginated,
} from '@/lib/recipe-helpers'

/**
 * GET /api/recipes
 * Query params:
 *   page       — номер страницы (default: 1)
 *   perPage    — рецептов на странице (default: 24, max: 48)
 *   tags       — слаги тегов через запятую: ?tags=kurica,sup
 *   difficulty — easy | medium | hard
 *   ids        — ID рецептов через запятую (для страницы закладок)
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const { page, perPage, skip } = parsePagination(sp)
    const tagSlugs = parseTagSlugs(sp)
    const difficulty = sp.get('difficulty') as 'easy' | 'medium' | 'hard' | null

    // Фильтр по конкретным ID (страница закладок)
    const idsParam = sp.get('ids')
    const ids = idsParam ? idsParam.split(',').filter(Boolean) : null

    const where = {
      published: true,
      ...(ids && ids.length > 0 && { id: { in: ids } }),
      ...(difficulty && { difficulty }),
      ...(tagSlugs.length > 0 && {
        AND: tagSlugs.map((slug) => ({
          tags: { some: { tag: { slug } } },
        })),
      }),
    }

    const [recipes, total] = await prisma.$transaction([
      prisma.recipe.findMany({
        where,
        select: recipeCardSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.recipe.count({ where }),
    ])

    return NextResponse.json(paginated(recipes.map(transformCard), total, page, perPage))
  } catch (err) {
    console.error('[GET /api/recipes]', err)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
