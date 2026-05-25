'use client'

import { useEffect, useState } from 'react'
import { HorizontalScroll } from '@/components/recipe/HorizontalScroll'
import { RecipeCard as RecipeCardComponent } from '@/components/recipe/RecipeCard'
import type { RecipeCard } from '@/types'

interface SimilarRecipesRowProps {
  recipeSlug: string
}

export function SimilarRecipesRow({ recipeSlug }: SimilarRecipesRowProps) {
  const [recipes, setRecipes] = useState<RecipeCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    fetch(`/api/recipes/${recipeSlug}/similar`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data: { data: RecipeCard[] }) => {
        if (!cancelled) setRecipes(data.data ?? [])
      })
      .catch(() => {
        /* молча игнорируем — похожие рецепты не критичны */
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [recipeSlug])

  if (loading) {
    return (
      <section>
        <h2 className="mb-4 text-lg font-bold text-gray-900 sm:text-xl">Похожие рецепты</h2>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="w-56 flex-shrink-0 xs:w-64 h-64 rounded-2xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      </section>
    )
  }

  if (!recipes.length) return null

  return (
    <section>
      <h2 className="mb-4 text-lg font-bold text-gray-900 sm:text-xl">
        <span aria-hidden className="mr-2">🍽️</span>
        Похожие рецепты
      </h2>
      <HorizontalScroll>
        {recipes.map((recipe) => (
          <RecipeCardComponent key={recipe.id} recipe={recipe} compact />
        ))}
      </HorizontalScroll>
    </section>
  )
}
