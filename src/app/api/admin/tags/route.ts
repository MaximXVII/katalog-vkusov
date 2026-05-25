import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, validateRequired } from '@/lib/admin-auth'
import { slugify } from '@/lib/utils'

// GET /api/admin/tags
export async function GET() {
  const deny = await requireAdmin()
  if (deny) return deny

  try {
    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        category: true,
        imageUrl: true,
        _count: { select: { recipes: true } },
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })
    return NextResponse.json(tags)
  } catch (err) {
    console.error('[GET /api/admin/tags]', err)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

// POST /api/admin/tags
export async function POST(request: NextRequest) {
  const deny = await requireAdmin()
  if (deny) return deny

  try {
    const body = await request.json() as Record<string, unknown>

    const missing = validateRequired(body, ['name', 'category'])
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Обязательные поля: ${missing.join(', ')}` },
        { status: 400 }
      )
    }

    const name = body.name as string
    const category = body.category as string
    const imageUrl = (body.imageUrl as string | undefined) ?? ''
    const newSlug = (body.slug as string | undefined)?.trim() || slugify(name)

    const categoryExists = await prisma.tagCategoryGroup.findUnique({ where: { slug: category as never } })
    if (!categoryExists) {
      return NextResponse.json({ error: `Категория "${category}" не найдена` }, { status: 400 })
    }

    const existing = await prisma.tag.findUnique({ where: { slug: newSlug } })
    if (existing) {
      return NextResponse.json({ error: `Тег со slug "${newSlug}" уже существует` }, { status: 409 })
    }

    const tag = await prisma.tag.create({
      data: { name, slug: newSlug, category: category as never, imageUrl: imageUrl as never },
      select: {
        id: true, slug: true, name: true, category: true, imageUrl: true as never,
        _count: { select: { recipes: true } },
      },
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (err) {
    console.error('[POST /api/admin/tags]', err)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
