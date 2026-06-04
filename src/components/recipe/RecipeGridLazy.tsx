'use client'

import { useRef, useState, useEffect } from 'react'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import { RecipeCardSkeleton } from '@/components/recipe/RecipeGridSkeleton'
import type { RecipeCard as RecipeCardType } from '@/types'

const INITIAL_VISIBLE = 6
const BATCH_SIZE = 6

interface RecipeGridLazyProps {
  recipes: RecipeCardType[]
}

export function RecipeGridLazy({ recipes }: RecipeGridLazyProps) {
  const [visible, setVisible] = useState(INITIAL_VISIBLE)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setVisible(INITIAL_VISIBLE)
  }, [recipes])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || visible >= recipes.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible((v) => Math.min(v + BATCH_SIZE, recipes.length))
        }
      },
      { rootMargin: '400px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [visible, recipes.length])

  const remaining = recipes.length - visible
  const skeletonCount = remaining > 0 ? Math.min(BATCH_SIZE, remaining) : 0

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {recipes.slice(0, visible).map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
      {Array.from({ length: skeletonCount }).map((_, i) => (
        <RecipeCardSkeleton key={'sk-' + String(i)} />
      ))}
      {remaining > 0 && <div ref={sentinelRef} className="sr-only" />}
    </div>
  )
}
