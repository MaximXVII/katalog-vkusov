'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useSearch } from '@/hooks/useSearch'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import { SearchBar } from '@/components/ui/SearchBar'
import { cn } from '@/lib/utils'

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQ = searchParams.get('q') ?? ''

  const { query, setQuery, results, isLoading, error } = useSearch()
  const initialized = useRef(false)

  // При первом рендере подхватываем q из URL
  useEffect(() => {
    if (!initialized.current && initialQ) {
      setQuery(initialQ)
      initialized.current = true
    }
  }, [initialQ, setQuery])

  // Синхронизируем URL с запросом (debounce уже в useSearch)
  useEffect(() => {
    if (!initialized.current) return
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    const newUrl = query.trim() ? `/search?${params.toString()}` : '/search'
    router.replace(newUrl, { scroll: false })
  }, [query, router])

  const showEmpty = !isLoading && query.trim().length >= 2 && results.length === 0
  const showResults = results.length > 0

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Заголовок */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Поиск рецептов</h1>
        <p className="mt-2 text-gray-500">Введи название блюда, ингредиент или тег</p>
      </div>

      {/* Большая строка поиска */}
      <SearchBar
        variant="full"
        defaultQuery={initialQ}
        onSearch={(q) => setQuery(q)}
        className="mb-10"
      />

      {/* Состояния */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <p className="text-center text-sm text-red-500">{error}</p>
      )}

      {showEmpty && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="text-5xl" aria-hidden>🔍</span>
          <p className="text-lg font-semibold text-gray-700">Ничего не найдено</p>
          <p className="text-sm text-gray-500">
            Попробуй другое название или проверь написание
          </p>
        </div>
      )}

      {!query.trim() && !isLoading && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="text-5xl" aria-hidden>🥘</span>
          <p className="text-base text-gray-500">Начни вводить запрос — результаты появятся сразу</p>
        </div>
      )}

      {showResults && (
        <>
          <p className="mb-5 text-sm text-gray-500">
            Найдено: <span className="font-semibold text-gray-800">{results.length}</span> рецептов
          </p>
          <div className={cn('grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3')}>
            {results.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
