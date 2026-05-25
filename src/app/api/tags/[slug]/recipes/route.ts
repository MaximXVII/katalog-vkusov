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
 * GET /api/tags/[slug]/recipes
 * Рецепты по конкретному тегу с дополнительными фильтрами.
 *
 * Query params:
 *   page       — страница
 *   perPage    — рецептов на странице
 *   tags       — дополнительные теги-фильтры (помимо основного)
 *   difficulty — easy | medium | hard
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Убеждаемся что тег существует
    const tag = await prisma.tag.findUnique({
      where: { slug: params.slug },
      select: { id: true, name: true, slug: true, category: true },
    })

    if (!tag) {
      return NextResponse.json({ error: 'Тег не найден' }, { status: 404 })
    }

    const sp = req.nextUrl.searchParams
    const { page, perPage, skip } = parsePagination(sp)
    const extraTagSlugs = parseTagSlugs(sp).filter((s) => s !== params.slug)
    const difficulty = sp.get('difficulty') as 'easy' | 'medium' | 'hard' | null

    const where = {
      published: true,
      // Основной тег всегда обязателен
      tags: { some: { tag: { slug: params.slug } } },
      ...(difficulty && { difficulty }),
      // Дополнительные теги-фильтры (AND логика)
      ...(extraTagSlugs.length > 0 && {
        AND: extraTagSlugs.map((slug) => ({
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

    return NextResponse.json({
      tag,
      ...paginated(recipes.map(transformCard), total, page, perPage),
    })
  } catch (err) {
    console.error('[GET /api/tags/[slug]/recipes]', err)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
