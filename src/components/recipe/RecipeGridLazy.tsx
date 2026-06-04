'use client'

import { useRef, useState, useEffect } from 'react'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import type { RecipeCard as RecipeCardType } from '@/types'

const INITIAL_VISIBLE = 6
const BATCH_SIZE = 6

interface RecipeGridLazyProps {
  recipes: RecipeCardType[]
}

export function RecipeGridLazy({ recipes }: RecipeGridLazyProps) {
  const [visible, setVisible] = useState(INITIAL_VISIBLE)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Reset when recipes list changes (filter applied)
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
      { rootMargin: '300px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [visible, recipes.length])

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {recipes.slice(0, visible).map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
        {/* Skeleton cards while more are loading */}
        {visible < recipes.length && Array.from({ length: Math.min(BATCH_SIZE, recipes.length - visible) }).map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className="animate-pulse rounded-2xl bg-gray-100 aspect-[4/3]"
            aria-hidden
          />
        ))}
      </div>
      {/* Sentinel for intersection observer */}
      {visible < recipes.length && (
        <div ref={sentinelRef} className="h-10 mt-4" aria-hidden />
      )}
    </>
  )
}
