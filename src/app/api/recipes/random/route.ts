import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recipeCardSelect, transformCard } from '@/lib/recipe-helpers'

/**
 * GET /api/recipes/random
 * Возвращает все опубликованные рецепты в случайном порядке.
 * Перемешивание на JS стороне — для старта оптимально.
 */
export async function GET() {
  try {
    const recipes = await prisma.recipe.findMany({
      where: { published: true },
      select: recipeCardSelect,
    })

    // Fisher-Yates shuffle
    for (let i = recipes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[recipes[i], recipes[j]] = [recipes[j], recipes[i]]
    }

    return NextResponse.json({ data: recipes.map(transformCard) })
  } catch (err) {
    console.error('[GET /api/recipes/random]', err)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
