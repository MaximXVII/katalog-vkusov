import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recipeCardSelect, transformCard } from '@/lib/recipe-helpers'
import { SIMILAR_RECIPES_COUNT } from '@/lib/constants'

/**
 * GET /api/recipes/[slug]/similar
 * Возвращает до 10 рецептов, у которых больше всего совпадающих тегов.
 * Алгоритм: считаем пересечение множеств тегов, сортируем по убыванию.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // 1. Получаем теги текущего рецепта
    const current = await prisma.recipe.findUnique({
      where: { slug: params.slug, published: true },
      select: { id: true, tags: { select: { tagId: true } } },
    })

    if (!current) {
      return NextResponse.json({ data: [] })
    }

    const currentTagIds = current.tags.map((t) => t.tagId)

    if (currentTagIds.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // 2. Находим рецепты с хотя бы одним совпадающим тегом
    const candidates = await prisma.recipe.findMany({
      where: {
        published: true,
        id: { not: current.id },
        tags: { some: { tagId: { in: currentTagIds } } },
      },
      select: {
        ...recipeCardSelect,
        tags: {
          select: {
            tagId: true,
            tag: { select: { id: true, slug: true, name: true, category: true } },
          },
        },
      },
    })

    // 3. Считаем количество совпадающих тегов и сортируем
    const currentTagSet = new Set(currentTagIds)
    const scored = candidates
      .map((recipe) => ({
        recipe,
        score: recipe.tags.filter((t) => currentTagSet.has(t.tagId)).length,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, SIMILAR_RECIPES_COUNT)

    const result = scored.map(({ recipe }) => ({
      ...recipe,
      tags: recipe.tags.map((rt) => rt.tag),
    }))

    return NextResponse.json({ data: result })
  } catch (err) {
    console.error('[GET /api/recipes/[slug]/similar]', err)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
