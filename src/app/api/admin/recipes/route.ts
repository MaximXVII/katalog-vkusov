import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, validateRequired } from '@/lib/admin-auth'
import { slugify } from '@/lib/utils'

export async function GET() {
  const deny = await requireAdmin()
  if (deny) return deny

  try {
    const recipes = await prisma.recipe.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        imageUrl: true,
        difficulty: true,
        published: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { tags: true } },
        tags: {
          select: { tag: { select: { name: true, category: true } } },
          take: 5,
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ data: recipes })
  } catch (err) {
    console.error('[GET /api/admin/recipes]', err)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin()
  if (deny) return deny

  try {
    const body = await req.json() as Record<string, unknown>

    const missing = validateRequired(body, ['title', 'description'])
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Обязательные поля не заполнены: ${missing.join(', ')}` },
        { status: 400 }
      )
    }

    const title = body.title as string
    const slug = (body.slug as string | undefined)?.trim() || slugify(title)

    const existing = await prisma.recipe.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json(
        { error: `Рецепт со slug "${slug}" уже существует` },
        { status: 409 }
      )
    }

    const tagIds = (body.tagIds as string[] | undefined) ?? []

    // Создаём рецепт, затем теги отдельным createMany — без ограничений на количество
    const recipe = await prisma.$transaction(async (tx) => {
      const created = await tx.recipe.create({
        data: {
          title,
          slug,
          description: body.description as string,
          imageUrl: (body.imageUrl as string | undefined) ?? '',
          prepTime: Number(body.prepTime ?? 0),
          cookTime: Number(body.cookTime ?? 0),
          difficulty: (body.difficulty as 'easy' | 'medium' | 'hard') ?? 'easy',
          ingredients: (body.ingredients as object[]) ?? [],
          steps: (body.steps as object[]) ?? [],
          published: Boolean(body.published ?? false),
          isOriginal: Boolean(body.isOriginal ?? false),
        },
      })

      if (tagIds.length > 0) {
        await tx.recipeTag.createMany({
          data: tagIds.map((tagId) => ({ recipeId: created.id, tagId })),
          skipDuplicates: true,
        })
      }

      return tx.recipe.findUnique({
        where: { id: created.id },
        include: { tags: { include: { tag: true } } },
      })
    })

    return NextResponse.json(recipe, { status: 201 })
  } catch (err) {
    console.error('[POST /api/admin/recipes]', err)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
