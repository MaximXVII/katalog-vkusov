import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/tags
 * Возвращает все теги сгруппированные по категориям.
 * Включает конфигурацию категорий из TagCategoryGroup (порядок, иконки).
 * Используется для: главной страницы (Netflix-меню) и панели фильтров.
 */
export async function GET() {
  try {
    const [categoryGroups, tags] = await prisma.$transaction([
      prisma.tagCategoryGroup.findMany({
        orderBy: { displayOrder: 'asc' },
      }),
      prisma.tag.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { recipes: true } },
        },
      }),
    ])

    // Группируем теги по категориям, сортируем по популярности внутри категории
    const grouped = categoryGroups.map((group) => {
      const groupTags = tags
        .filter((t) => t.category === group.slug)
        .sort((a, b) => b._count.recipes - a._count.recipes)
        .map(({ _count, ...tag }) => ({ ...tag, recipeCount: _count.recipes }))

      return {
        ...group,
        tags: groupTags,
      }
    })

    return NextResponse.json({ data: grouped })
  } catch (err) {
    console.error('[GET /api/tags]', err)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
