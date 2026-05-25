import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { RecipeForm } from '@/components/admin/RecipeForm'
import type { TagCategorySlug } from '@/types'

export const metadata: Metadata = { title: 'Новый рецепт' }

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

  // Группируем по категории
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

export default async function NewRecipePage() {
  const availableTags = await getAvailableTags()

  return (
    <div>
      <RecipeForm availableTags={availableTags} />
    </div>
  )
}
