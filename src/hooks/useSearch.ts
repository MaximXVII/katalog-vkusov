'use client'

import { useState, useEffect, useCallback } from 'react'
import type { RecipeCard } from '@/types'

/**
 * Хук для поиска рецептов.
 * Debounce 300ms, минимум 2 символа для запроса.
 */
export function useSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<RecipeCard[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([])
      setError(null)
      return
    }

    const controller = new AbortController()

    const timer = setTimeout(async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal }
        )
        if (!res.ok) throw new Error('Ошибка поиска')
        const data = (await res.json()) as { data: RecipeCard[] }
        setResults(data.data ?? [])
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError('Не удалось выполнить поиск')
          setResults([])
        }
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  const clear = useCallback(() => {
    setQuery('')
    setResults([])
    setError(null)
  }, [])

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    hasResults: results.length > 0,
    clear,
  }
}
