import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { slugify } from '@/lib/utils'

// GET /api/admin/categories
export async function GET() {
  const deny = await requireAdmin()
  if (deny) return deny

  try {
    const categories = await prisma.tagCategoryGroup.findMany({
      orderBy: { displayOrder: 'asc' },
    })

    // Добавляем количество тегов в каждой категории
    const withCounts = await Promise.all(
      categories.map(async (cat) => ({
        ...cat,
        _count: {
          tags: await prisma.tag.count({ where: { category: cat.slug } }),
        },
      }))
    )

    return NextResponse.json(withCounts)
  } catch (err) {
    console.error('[GET /api/admin/categories]', err)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

// POST /api/admin/categories — создать категорию
export async function POST(request: NextRequest) {
  const deny = await requireAdmin()
  if (deny) return deny

  try {
    const body = await request.json() as Record<string, unknown>
    const name = (body.name as string | undefined)?.trim()
    if (!name) {
      return NextResponse.json({ error: 'Поле name обязательно' }, { status: 400 })
    }

    const slug = (body.slug as string | undefined)?.trim() || slugify(name)
    const icon = (body.icon as string | undefined)?.trim() || null

    // Считаем максимальный displayOrder
    const last = await prisma.tagCategoryGroup.findFirst({ orderBy: { displayOrder: 'desc' } })
    const displayOrder = (last?.displayOrder ?? -1) + 1

    const conflict = await prisma.tagCategoryGroup.findUnique({ where: { slug: slug as never } })
    if (conflict) {
      return NextResponse.json({ error: `Slug "${slug}" уже занят` }, { status: 409 })
    }

    const category = await prisma.tagCategoryGroup.create({
      data: { name, slug: slug as never, icon, displayOrder },
    })

    return NextResponse.json({ ...category, _count: { tags: 0 } }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/admin/categories]', err)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
