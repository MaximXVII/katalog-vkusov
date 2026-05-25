'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function RandomRecipeButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/recipes/random')
      if (!res.ok) throw new Error('no random recipe')
      const data = await res.json() as { data: Array<{ slug: string }> }
      const recipes = data.data
      if (recipes && recipes.length > 0) {
        const pick = recipes[Math.floor(Math.random() * recipes.length)]
        router.push(`/recipe/${pick.slug}`)
      }
    } catch {
      // Если запрос упал — просто переходим на страницу всех рецептов
      router.push('/all')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-brand-600 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-wait"
    >
      {loading ? (
        <>
          <svg
            className="animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          Ищем...
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M3 3h5l3 5-3 4h-5l3-4z" />
            <path d="M21 3h-5l-3 5 3 4h5l-3-4z" />
            <path d="M12 19v2" />
            <path d="M12 12v3" />
          </svg>
          Случайный рецепт
        </>
      )}
    </button>
  )
}
