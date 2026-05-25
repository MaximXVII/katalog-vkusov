import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, validateRequired } from '@/lib/admin-auth'
import { deleteImage } from '@/lib/storage'
import { slugify } from '@/lib/utils'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const deny = await requireAdmin()
  if (deny) return deny

  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: params.id },
      include: {
        tags: {
          select: { tag: { select: { id: true, slug: true, name: true, category: true } } },
        },
      },
    })

    if (!recipe) {
      return NextResponse.json({ error: 'Рецепт не найден' }, { status: 404 })
    }

    return NextResponse.json({ ...recipe, tags: recipe.tags.map((rt) => rt.tag) })
  } catch (err) {
    console.error('[GET /api/admin/recipes/[id]]', err)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const deny = await requireAdmin()
  if (deny) return deny

  try {
    const existing = await prisma.recipe.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Рецепт не найден' }, { status: 404 })
    }

    const body = await request.json() as Record<string, unknown>

    const missing = validateRequired(body, ['title', 'description'])
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Обязательные поля не заполнены: ${missing.join(', ')}` },
        { status: 400 }
      )
    }

    const title = body.title as string
    const newSlug = (body.slug as string | undefined)?.trim() || slugify(title)

    const slugConflict = await prisma.recipe.findFirst({
      where: { slug: newSlug, id: { not: params.id } },
    })
    if (slugConflict) {
      return NextResponse.json(
        { error: `Slug уже занят: ${newSlug}` },
        { status: 409 }
      )
    }

    const newImageUrl = (body.imageUrl as string | undefined) ?? ''

    if (existing.imageUrl && newImageUrl !== existing.imageUrl) {
      try {
        await deleteImage(existing.imageUrl)
      } catch {
        console.warn('Не удалось удалить старое изображение:', existing.imageUrl)
      }
    }

    const tagIds = (body.tagIds as string[] | undefined) ?? []

    // Используем createMany отдельно — надёжнее при большом числе тегов
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Удаляем все старые связи
      await tx.recipeTag.deleteMany({ where: { recipeId: params.id } })

      // 2. Обновляем рецепт без тегов
      const recipe = await tx.recipe.update({
        where: { id: params.id },
        data: {
          title,
          slug: newSlug,
          description: (body.description as string | undefined) ?? '',
          imageUrl: newImageUrl,
          prepTime: Number(body.prepTime ?? 0),
          cookTime: Number(body.cookTime ?? 0),
          difficulty: (body.difficulty as 'easy' | 'medium' | 'hard') ?? 'medium',
          ingredients: (body.ingredients as object[]) ?? [],
          steps: (body.steps as object[]) ?? [],
          published: Boolean(body.published ?? existing.published),
          isOriginal: Boolean(body.isOriginal ?? existing.isOriginal),
        },
      })

      // 3. Создаём новые связи одним запросом
      if (tagIds.length > 0) {
        await tx.recipeTag.createMany({
          data: tagIds.map((tagId) => ({ recipeId: params.id, tagId })),
          skipDuplicates: true,
        })
      }

      // 4. Возвращаем рецепт с тегами
      return tx.recipe.findUnique({
        where: { id: recipe.id },
        include: {
          tags: { select: { tag: { select: { id: true, slug: true, name: true, category: true } } } },
        },
      })
    })

    if (!updated) {
      return NextResponse.json({ error: 'Ошибка обновления' }, { status: 500 })
    }

    return NextResponse.json({ ...updated, tags: updated.tags.map((rt) => rt.tag) })
  } catch (err) {
    console.error('[PUT /api/admin/recipes/[id]]', err)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const deny = await requireAdmin()
  if (deny) return deny

  try {
    const existing = await prisma.recipe.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Рецепт не найден' }, { status: 404 })
    }

    await prisma.recipe.delete({ where: { id: params.id } })

    if (existing.imageUrl) {
      try {
        await deleteImage(existing.imageUrl)
      } catch {
        console.warn('Не удалось удалить изображение:', existing.imageUrl)
      }
    }

    return NextResponse.json({ success: true, id: params.id })
  } catch (err) {
    console.error('[DELETE /api/admin/recipes/[id]]', err)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
