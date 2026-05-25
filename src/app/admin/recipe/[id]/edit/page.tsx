import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { RecipeForm } from '@/components/admin/RecipeForm'
import type { TagCategorySlug } from '@/types'

export const metadata: Metadata = { title: 'Редактировать рецепт' }

async function getAvailableTags() {
  const tags = await prisma.tag.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      _count: { select: { recipes: true } },
    },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })

  const groupMap = new Map<string, typeof tags>()
  for (const tag of tags) {
    const list = groupMap.get(tag.category) ?? []
    list.push(tag)
    groupMap.set(tag.category, list)
  }

  return Array.from(groupMap.entries()).map(([slug, groupTags]) => ({
    slug: slug as TagCategorySlug,
    name: slug,
    tags: groupTags,
  }))
}

async function getRecipe(id: string) {
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      tags: {
        select: { tag: { select: { id: true } } },
      },
    },
  })
  return recipe
}

interface PageProps {
  params: { id: string }
}

export default async function EditRecipePage({ params }: PageProps) {
  const [recipe, availableTags] = await Promise.all([
    getRecipe(params.id),
    getAvailableTags(),
  ])

  if (!recipe) notFound()

  // Преобразуем данные из Prisma в формат формы
  const ingredients = (recipe.ingredients as { name: string; amount: string; unit?: string }[]) ?? []
  const stepsRaw = (recipe.steps as { type?: string; stepNumber?: number; text: string; emoji?: string }[]) ?? []

  // Шаги конвертируем в FormItem[] с поддержкой разделителей
  let stepCounter = 0
  const steps = stepsRaw.map((s, i) => {
    if (s.type === 'divider') {
      return {
        type: 'divider' as const,
        id: `divider-${i}-${Date.now()}`,
        emoji: s.emoji ?? '\u{1F52A}',
        label: s.text ?? '',
      }
    }
    stepCounter++
    return {
      type: 'step' as const,
      id: `step-${s.stepNumber ?? stepCounter}`,
      text: s.text,
    }
  })

  const initialData = {
    title: recipe.title,
    slug: recipe.slug,
    description: recipe.description,
    imageUrl: recipe.imageUrl,
    prepTime: recipe.prepTime > 0 ? String(recipe.prepTime) : '',
    cookTime: recipe.cookTime > 0 ? String(recipe.cookTime) : '',
    difficulty: recipe.difficulty as 'easy' | 'medium' | 'hard',
    ingredients: ingredients.length > 0
      ? ingredients.map((i) => ({ name: i.name, amount: i.amount, unit: i.unit ?? '' }))
      : [{ name: '', amount: '', unit: '' }],
    steps: steps.length > 0 ? steps : [{ type: 'step' as const, id: 'step-1', text: '' }],
    tagIds: recipe.tags.map((rt) => rt.tag.id),
    published: recipe.published,
    isOriginal: (recipe as { isOriginal?: boolean }).isOriginal ?? false,
  }

  return (
    <div>
      <RecipeForm
        recipeId={recipe.id}
        initialData={initialData}
        availableTags={availableTags}
      />
    </div>
  )
}
