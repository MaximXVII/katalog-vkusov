import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { slugify } from '@/lib/utils'

// PUT /api/admin/categories/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const deny = await requireAdmin()
  if (deny) return deny

  try {
    const existing = await prisma.tagCategoryGroup.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Категория не найдена' }, { status: 404 })
    }

    const body = await request.json() as Record<string, unknown>
    const name = (body.name as string | undefined)?.trim() ?? existing.name
    const icon = body.icon !== undefined ? (body.icon as string | null) : existing.icon
    const displayOrder = typeof body.displayOrder === 'number'
      ? body.displayOrder
      : existing.displayOrder

    let newSlug: string = existing.slug as string
    if ((body.slug as string | undefined)?.trim()) {
      newSlug = (body.slug as string).trim()
    } else if (body.name && body.name !== existing.name) {
      newSlug = slugify(name)
    }

    if (newSlug !== (existing.slug as string)) {
      const conflict = await prisma.tagCategoryGroup.findFirst({
        where: { slug: newSlug as never, id: { not: params.id } },
      })
      if (conflict) {
        return NextResponse.json({ error: `Slug "${newSlug}" уже занят` }, { status: 409 })
      }

      // Обновляем category у всех тегов этой категории
      await prisma.tag.updateMany({
        where: { category: existing.slug as never },
        data: { category: newSlug as never },
      })
    }

    const updated = await prisma.tagCategoryGroup.update({
      where: { id: params.id },
      data: { name, slug: newSlug as never, icon, displayOrder },
    })

    const tagCount = await prisma.tag.count({ where: { category: updated.slug as never } })
    return NextResponse.json({ ...updated, _count: { tags: tagCount } })
  } catch (err) {
    console.error('[PUT /api/admin/categories/[id]]', err)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

// DELETE /api/admin/categories/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const deny = await requireAdmin()
  if (deny) return deny

  try {
    const existing = await prisma.tagCategoryGroup.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Категория не найдена' }, { status: 404 })
    }

    const tagCount = await prisma.tag.count({ where: { category: existing.slug as never } })
    if (tagCount > 0) {
      return NextResponse.json(
        { error: `Нельзя удалить: в категории ${tagCount} тегов. Сначала удали или перенеси теги.` },
        { status: 409 }
      )
    }

    await prisma.tagCategoryGroup.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true, id: params.id })
  } catch (err) {
    console.error('[DELETE /api/admin/categories/[id]]', err)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
