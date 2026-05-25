'use client'

import { useState, useEffect } from 'react'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import type { RecipeCard as RecipeCardType } from '@/types'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function ShuffledRecipeGrid({ recipes }: { recipes: RecipeCardType[] }) {
  // Начальное состояние — оригинальный порядок с сервера (гидратация без ошибок)
  const [shuffled, setShuffled] = useState(recipes)

  // Перемешиваем только после монтирования на клиенте
  useEffect(() => {
    setShuffled(shuffle(recipes))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {shuffled.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  )
}
