import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { slugify } from '@/lib/utils'

// PUT /api/admin/tags/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const deny = await requireAdmin()
  if (deny) return deny

  try {
    const existing = await prisma.tag.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Тег не найден' }, { status: 404 })
    }

    const body = await request.json() as Record<string, unknown>

    const name = (body.name as string | undefined) ?? existing.name
    const category = ((body.category as string | undefined) ?? existing.category) as string
    const imageUrl = body.imageUrl !== undefined
      ? (body.imageUrl as string)
      : (existing as { imageUrl?: string }).imageUrl ?? ''

    if (body.category !== undefined) {
      const categoryExists = await prisma.tagCategoryGroup.findUnique({ where: { slug: category as never } })
      if (!categoryExists) {
        return NextResponse.json({ error: `Категория "${category}" не найдена` }, { status: 400 })
      }
    }

    let newSlug = existing.slug
    if ((body.slug as string | undefined)?.trim()) {
      newSlug = (body.slug as string).trim()
    } else if (body.name && body.name !== existing.name) {
      newSlug = slugify(name)
    }

    if (newSlug !== existing.slug) {
      const slugConflict = await prisma.tag.findFirst({
        where: { slug: newSlug, id: { not: params.id } },
      })
      if (slugConflict) {
        return NextResponse.json({ error: `Slug уже занят: ${newSlug}` }, { status: 409 })
      }
    }

    const updated = await prisma.tag.update({
      where: { id: params.id },
      data: { name, slug: newSlug, category: category as never, imageUrl: imageUrl as never },
      select: {
        id: true, slug: true, name: true, category: true, imageUrl: true as never,
        _count: { select: { recipes: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error('[PUT /api/admin/tags/[id]]', err)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

// DELETE /api/admin/tags/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const deny = await requireAdmin()
  if (deny) return deny

  try {
    const existing = await prisma.tag.findUnique({
      where: { id: params.id },
      include: { _count: { select: { recipes: true } } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Тег не найден' }, { status: 404 })
    }

    const recipeCount = existing._count.recipes
    await prisma.tag.delete({ where: { id: params.id } })

    return NextResponse.json({
      success: true,
      id: params.id,
      message: recipeCount > 0
        ? `Тег удалён. Был отвязан от ${recipeCount} рецептов.`
        : 'Тег удалён.',
    })
  } catch (err) {
    console.error('[DELETE /api/admin/tags/[id]]', err)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
