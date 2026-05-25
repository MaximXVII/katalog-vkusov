'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useBookmarks } from '@/hooks/useBookmarks'
import { useCookieContext } from '@/components/layout/CookieProvider'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import type { RecipeCard as RecipeCardType } from '@/types'

export default function BookmarksPage() {
  const { cookiesAllowed } = useCookieContext()
  const { bookmarks, isReady, clearAll } = useBookmarks({ cookiesAllowed })
  const [recipes, setRecipes] = useState<RecipeCardType[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isReady || bookmarks.length === 0) {
      setRecipes([])
      return
    }
    setLoading(true)
    fetch(`/api/recipes?ids=${bookmarks.join(',')}&perPage=48`)
      .then((r) => r.json())
      .then((data: { data: RecipeCardType[] }) => {
        const map = new Map((data.data ?? []).map((r) => [r.id, r]))
        setRecipes(bookmarks.map((id) => map.get(id)).filter(Boolean) as RecipeCardType[])
      })
      .catch(() => setRecipes([]))
      .finally(() => setLoading(false))
  }, [bookmarks, isReady])

  if (!isReady) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="h-8 w-48 rounded-lg bg-gray-200 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Закладки</h1>
          {recipes.length > 0 && (
            <p className="mt-1 text-sm text-gray-500">{recipes.length} сохранённых рецептов</p>
          )}
        </div>
        {recipes.length > 0 && (
          <button
            onClick={clearAll}
            className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
          >
            Очистить все
          </button>
        )}
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: bookmarks.length || 3 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && bookmarks.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <span className="text-6xl" aria-hidden>🔖</span>
          <h2 className="text-xl font-semibold text-gray-800">Закладок пока нет</h2>
          <p className="text-sm text-gray-500">
            Нажми на иконку закладки на любой карточке рецепта — и он сохранится здесь
          </p>
          <Link
            href="/"
            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            Перейти на главную
          </Link>
        </div>
      )}

      {!loading && recipes.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  )
}
