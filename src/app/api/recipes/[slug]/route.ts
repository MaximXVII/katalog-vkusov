import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recipeFullSelect, transformFull } from '@/lib/recipe-helpers'

/**
 * GET /api/recipes/[slug]
 * Возвращает полный рецепт включая ингредиенты и шаги
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { slug: params.slug, published: true },
      select: recipeFullSelect,
    })

    if (!recipe) {
      return NextResponse.json({ error: 'Рецепт не найден' }, { status: 404 })
    }

    return NextResponse.json(transformFull(recipe))
  } catch (err) {
    console.error('[GET /api/recipes/[slug]]', err)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
