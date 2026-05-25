import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recipeCardSelect, transformCard } from '@/lib/recipe-helpers'

/**
 * GET /api/search?q=борщ
 * Поиск по названию блюда и по тегам (без учёта регистра).
 *
 * Стратегия (от лучшего к худшему совпадению):
 *   1. Точное вхождение в title
 *   2. Совпадение по тегам
 * Результаты объединяются и дедублируются.
 *
 * В будущем можно заменить на Algolia (Чат 5+).
 */
export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q')?.trim()

    // Минимум 2 символа — иначе пустой ответ
    if (!q || q.length < 2) {
      return NextResponse.json({ data: [] })
    }

    const limit = 20

    // Ищем рецепты: совпадение в названии ИЛИ в тегах
    const recipes = await prisma.recipe.findMany({
      where: {
        published: true,
        OR: [
          // Совпадение в названии (нечувствительно к регистру)
          { title: { contains: q, mode: 'insensitive' } },
          // Совпадение в описании
          { description: { contains: q, mode: 'insensitive' } },
          // Совпадение в имени тега
          {
            tags: {
              some: {
                tag: { name: { contains: q, mode: 'insensitive' } },
              },
            },
          },
        ],
      },
      select: recipeCardSelect,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Сортируем: title-совпадения выше tag-совпадений
    const qLower = q.toLowerCase()
    const sorted = recipes.sort((a, b) => {
      const aTitle = a.title.toLowerCase().includes(qLower) ? 0 : 1
      const bTitle = b.title.toLowerCase().includes(qLower) ? 0 : 1
      return aTitle - bTitle
    })

    return NextResponse.json({ data: sorted.map(transformCard), query: q })
  } catch (err) {
    console.error('[GET /api/search]', err)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
